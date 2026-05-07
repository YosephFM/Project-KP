const express = require('express');
const { getDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const { search, unit_kerja, status_aktif, page = 1, limit = 10 } = req.query;
    const db = getDB();
    let q = db('pegawai');
    if (search) q = q.where(function() { this.whereILike('nama', `%${search}%`).orWhereILike('nip', `%${search}%`); });
    if (unit_kerja) q = q.where({ unit_kerja });
    if (status_aktif !== undefined) q = q.where({ status_aktif: Number(status_aktif) });

    const totalRes = await q.clone().count('id as c').first();
    const total = totalRes.c;
    const offset = (Number(page) - 1) * Number(limit);
    const data = await q.orderBy('nama').limit(Number(limit)).offset(offset);
    res.json({ data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
});

router.get('/all', async (req, res, next) => {
  try {
    const db = getDB();
    const data = await db('pegawai').select('id','nip','nama','jabatan','unit_kerja').where({ status_aktif: 1 }).orderBy('nama');
    res.json(data);
  } catch (e) { next(e); }
});

router.get('/units', async (req, res, next) => {
  try {
    const db = getDB();
    const rows = await db('pegawai').distinct('unit_kerja').orderBy('unit_kerja');
    res.json(rows.map(r => r.unit_kerja).filter(Boolean));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = getDB();
    const pegawai = await db('pegawai').where({ id: req.params.id }).first();
    if (!pegawai) return res.status(404).json({ error: 'Pegawai tidak ditemukan' });
    res.json(pegawai);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { nip, nama, jabatan, unit_kerja, jenis_kelamin, golongan, no_fp } = req.body;
    if (!nip || !nama) return res.status(400).json({ error: 'NIP dan nama wajib diisi' });
    const db = getDB();
    const [id] = await db('pegawai').insert({ nip, nama, jabatan, unit_kerja, jenis_kelamin, golongan, no_fp });
    res.status(201).json(await db('pegawai').where({ id }).first());
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) return res.status(409).json({ error: 'NIP sudah terdaftar' });
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { nip, nama, jabatan, unit_kerja, jenis_kelamin, golongan, no_fp, status_aktif } = req.body;
    const db = getDB();
    await db('pegawai').where({ id: req.params.id }).update({ nip, nama, jabatan, unit_kerja, jenis_kelamin, golongan, no_fp, status_aktif: status_aktif ?? 1 });
    res.json(await db('pegawai').where({ id: req.params.id }).first());
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const db = getDB();
    const deleted = await db('pegawai').where({ id: req.params.id }).delete();
    if (!deleted) return res.status(404).json({ error: 'Pegawai tidak ditemukan' });
    res.json({ message: 'Pegawai berhasil dihapus' });
  } catch (e) { next(e); }
});

router.get('/:id/absensi', async (req, res, next) => {
  try {
    const { bulan, tahun } = req.query;
    const db = getDB();
    let q = db('absensi as a').join('pegawai as p', 'a.pegawai_id', 'p.id').where('a.pegawai_id', req.params.id).select('a.*', 'p.nama', 'p.nip');
    if (bulan && tahun) {
      const pad = String(bulan).padStart(2, '0');
      q = q.whereRaw(`strftime('%m', a.tanggal) = ? AND strftime('%Y', a.tanggal) = ?`, [pad, tahun]);
    }
    const absensi = await q.orderBy('a.tanggal', 'desc');
    const statsRaw = await db('absensi').where({ pegawai_id: req.params.id }).groupBy('status').select('status', db.raw('COUNT(*) as total'));
    res.json({ absensi, stats: statsRaw });
  } catch (e) { next(e); }
});

module.exports = router;
