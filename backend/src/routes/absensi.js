const express = require('express');
const { getDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const { tanggal, tanggal_dari, tanggal_sampai, pegawai_id, status, unit_kerja, page = 1, limit = 15 } = req.query;
    const db = getDB();
    let q = db('absensi as a').join('pegawai as p', 'a.pegawai_id', 'p.id').select('a.*', 'p.nama', 'p.nip', 'p.jabatan', 'p.unit_kerja');
    if (tanggal)        q = q.where('a.tanggal', tanggal);
    if (tanggal_dari)   q = q.where('a.tanggal', '>=', tanggal_dari);
    if (tanggal_sampai) q = q.where('a.tanggal', '<=', tanggal_sampai);
    if (pegawai_id)     q = q.where('a.pegawai_id', pegawai_id);
    if (status)         q = q.where('a.status', status);
    if (unit_kerja)     q = q.where('p.unit_kerja', unit_kerja);

    const totalRes = await q.clone().count('a.id as c').first();
    const total = totalRes.c;
    const offset = (Number(page) - 1) * Number(limit);
    const data = await q.orderBy('a.tanggal', 'desc').orderBy('p.nama').limit(Number(limit)).offset(offset);
    res.json({ data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
});

router.get('/today', async (req, res, next) => {
  try {
    const db = getDB();
    const today = new Date().toISOString().slice(0, 10);
    const data = await db('absensi as a').join('pegawai as p', 'a.pegawai_id', 'p.id').select('a.*', 'p.nama', 'p.nip', 'p.unit_kerja').where('a.tanggal', today).orderBy('a.jam_masuk');
    res.json(data);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { pegawai_id, tanggal, jam_masuk, jam_keluar, status, keterangan } = req.body;
    const db = getDB();
    await db('absensi').insert({ pegawai_id, tanggal, jam_masuk, jam_keluar, status, keterangan }).onConflict(['pegawai_id', 'tanggal']).merge();
    res.status(201).json({ message: 'Absensi berhasil disimpan' });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { jam_masuk, jam_keluar, status, keterangan } = req.body;
    const db = getDB();
    await db('absensi').where({ id: req.params.id }).update({ jam_masuk, jam_keluar, status, keterangan });
    res.json({ message: 'Absensi berhasil diperbarui' });
  } catch (e) { next(e); }
});

module.exports = router;
