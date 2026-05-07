const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `fp_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let rows = [];
  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((h, i) => obj[h] = vals[i]);
      return obj;
    });
  } else {
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = xlsx.utils.sheet_to_json(ws, { raw: false });
  }
  return rows.map(r => {
    const noFp = r['no'] || r['no_fp'] || r['userid'] || r['id'] || r['user_id'] || r['No'] || r['UserID'];
    const checkTime = r['checktime'] || r['datetime'] || r['waktu'] || r['CheckTime'] || '';
    let tanggal = r['date'] || r['tanggal'] || r['Date'] || r['Tanggal'] || '';
    let jam = r['time'] || r['jam'] || r['Time'] || r['Jam'] || '';
    if (checkTime && !tanggal) { const p = checkTime.split(' '); tanggal = p[0]; jam = p[1] || ''; }
    return { no_fp: parseInt(noFp) || 0, tanggal: String(tanggal).trim(), jam: String(jam).trim().slice(0, 5) };
  }).filter(r => r.no_fp && r.tanggal && r.jam);
}

router.get('/batches', async (req, res, next) => {
  try {
    const db = getDB();
    const batches = await db('import_batch as b').leftJoin('users as u', 'b.imported_by', 'u.id').select('b.*', 'u.nama as imported_by_nama').orderBy('b.created_at', 'desc').limit(20);
    res.json(batches);
  } catch (e) { next(e); }
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan' });
  try {
    const normalized = parseFile(req.file.path);
    const db = getDB();
    const [batchId] = await db('import_batch').insert({ filename: req.file.filename, total_records: normalized.length, status: 'pending', imported_by: req.user.id });
    res.json({ batchId, preview: normalized.slice(0, 10), total: normalized.length, filename: req.file.originalname });
  } catch (e) { next(e); }
});

router.post('/process/:batchId', async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const db = getDB();
    const batch = await db('import_batch').where({ id: batchId }).first();
    if (!batch) return res.status(404).json({ error: 'Batch tidak ditemukan' });

    const files = fs.readdirSync(uploadDir).filter(f => f === batch.filename || f.includes(batch.filename));
    if (!files.length) return res.status(404).json({ error: 'File tidak ditemukan di server' });

    const normalized = parseFile(path.join(uploadDir, files[0]));
    let berhasil = 0, gagal = 0;

    for (const item of normalized) {
      try {
        await db('fingerprint_raw').insert({ no_fp: item.no_fp, tanggal: item.tanggal, jam: item.jam, batch_id: batchId });
        berhasil++;
      } catch (e) { gagal++; }
    }

    // Sync to absensi
    await syncToAbsensi(db, batchId);
    await db('import_batch').where({ id: batchId }).update({ status: 'selesai', berhasil, gagal });
    res.json({ message: 'Import berhasil', berhasil, gagal, total: normalized.length });
  } catch (e) { next(e); }
});

async function syncToAbsensi(db, batchId) {
  const rawData = await db('fingerprint_raw as fr').join('pegawai as p', 'fr.no_fp', 'p.no_fp').where('fr.batch_id', batchId).select('fr.*', 'p.id as pegawai_id').orderBy('fr.tanggal').orderBy('fr.jam');

  const grouped = {};
  rawData.forEach(r => {
    const key = `${r.pegawai_id}_${r.tanggal}`;
    if (!grouped[key]) grouped[key] = { pegawai_id: r.pegawai_id, tanggal: r.tanggal, jams: [] };
    grouped[key].jams.push(r.jam);
  });

  const BATAS = '07:30';
  for (const entry of Object.values(grouped)) {
    const jams = entry.jams.sort();
    const jamMasuk = jams[0];
    const jamKeluar = jams.length > 1 ? jams[jams.length - 1] : null;
    let status = 'hadir', menit = 0;
    if (jamMasuk > BATAS) {
      const [bh, bm] = BATAS.split(':').map(Number);
      const [jh, jm] = jamMasuk.split(':').map(Number);
      menit = (jh * 60 + jm) - (bh * 60 + bm);
      status = 'terlambat';
    }
    await db('absensi').insert({ pegawai_id: entry.pegawai_id, tanggal: entry.tanggal, jam_masuk: jamMasuk, jam_keluar: jamKeluar, status, menit_terlambat: menit }).onConflict(['pegawai_id', 'tanggal']).merge();
  }
}

router.get('/fingerprint-raw', async (req, res, next) => {
  try {
    const { batch_id, page = 1, limit = 15 } = req.query;
    const db = getDB();
    let q = db('fingerprint_raw as fr').leftJoin('pegawai as p', 'fr.no_fp', 'p.no_fp').select('fr.*', 'p.nama', 'p.nip');
    if (batch_id) q = q.where('fr.batch_id', batch_id);
    const totalRes = await q.clone().count('fr.id as c').first();
    const total = totalRes.c;
    const offset = (Number(page) - 1) * Number(limit);
    const data = await q.orderBy('fr.tanggal', 'desc').orderBy('fr.jam', 'desc').limit(Number(limit)).offset(offset);
    res.json({ data, total, totalPages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
});

module.exports = router;
