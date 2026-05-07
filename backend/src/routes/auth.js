const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' });
    const db = getDB();
    const user = await db('users').where({ username }).first();
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Username atau password salah' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, username: user.username, nama: user.nama, role: user.role } });
  } catch (e) { next(e); }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const db = getDB();
    const user = await db('users').select('id','username','nama','role','created_at').where({ id: req.user.id }).first();
    res.json(user);
  } catch (e) { next(e); }
});

router.put('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const db = getDB();
    const user = await db('users').where({ id: req.user.id }).first();
    if (!bcrypt.compareSync(oldPassword, user.password_hash)) return res.status(400).json({ error: 'Password lama salah' });
    await db('users').where({ id: req.user.id }).update({ password_hash: bcrypt.hashSync(newPassword, 10) });
    res.json({ message: 'Password berhasil diubah' });
  } catch (e) { next(e); }
});

module.exports = router;
