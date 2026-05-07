const express = require('express');
const { getDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/stats', async (req, res, next) => {
  try {
    const db = getDB();
    const today = new Date().toISOString().slice(0, 10);
    const totalPegawai = (await db('pegawai').where({ status_aktif: 1 }).count('id as c').first()).c;
    const todayStats = await db('absensi').where({ tanggal: today }).groupBy('status').select('status', db.raw('COUNT(*) as c'));
    const sm = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0 };
    todayStats.forEach(s => { sm[s.status] = s.c; });
    const hadirHariIni = sm.hadir + sm.terlambat;
    const tidakHadirHariIni = sm.izin + sm.sakit + sm.alpha;
    const thisMonth = today.slice(0, 7);
    const monthStats = await db('absensi').whereRaw(`strftime('%Y-%m', tanggal) = ?`, [thisMonth]).groupBy('status').select('status', db.raw('COUNT(*) as c'));
    const msm = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0 };
    monthStats.forEach(s => { msm[s.status] = s.c; });
    const lastImport = await db('import_batch').orderBy('created_at', 'desc').first();
    const totalFpRaw = (await db('fingerprint_raw').count('id as c').first()).c;
    res.json({ totalPegawai, hadirHariIni, terlambatHariIni: sm.terlambat, tidakHadirHariIni, persentaseHadir: totalPegawai > 0 ? Math.round((hadirHariIni / totalPegawai) * 100) : 0, bulan: { ...msm, hadir: msm.hadir + msm.terlambat }, lastImport, totalFpRaw });
  } catch (e) { next(e); }
});

router.get('/weekly-chart', async (req, res, next) => {
  try {
    const db = getDB();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const dateStr = d.toISOString().slice(0, 10);
      const stats = await db('absensi').where({ tanggal: dateStr }).groupBy('status').select('status', db.raw('COUNT(*) as c'));
      const sm = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0 };
      stats.forEach(s => { sm[s.status] = s.c; });
      data.push({ tanggal: dateStr, label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }), hadir: sm.hadir + sm.terlambat, terlambat: sm.terlambat, alpha: sm.alpha, izin: sm.izin, sakit: sm.sakit });
    }
    res.json(data);
  } catch (e) { next(e); }
});

router.get('/units-summary', async (req, res, next) => {
  try {
    const db = getDB();
    const today = new Date().toISOString().slice(0, 10);
    const units = await db('pegawai').distinct('unit_kerja').where({ status_aktif: 1 }).orderBy('unit_kerja');
    const data = await Promise.all(units.filter(u => u.unit_kerja).map(async u => {
      const total = (await db('pegawai').where({ unit_kerja: u.unit_kerja, status_aktif: 1 }).count('id as c').first()).c;
      const hadir = (await db('absensi as a').join('pegawai as p', 'a.pegawai_id', 'p.id').where('p.unit_kerja', u.unit_kerja).where('a.tanggal', today).whereIn('a.status', ['hadir', 'terlambat']).count('a.id as c').first()).c;
      return { unit_kerja: u.unit_kerja, total, hadir, persen: total > 0 ? Math.round((hadir / total) * 100) : 0 };
    }));
    res.json(data);
  } catch (e) { next(e); }
});

module.exports = router;
