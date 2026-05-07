require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { initDB } = require('./src/db');
const authRoutes    = require('./src/routes/auth');
const pegawaiRoutes = require('./src/routes/pegawai');
const absensiRoutes = require('./src/routes/absensi');
const importRoutes  = require('./src/routes/import');
const laporanRoutes = require('./src/routes/laporan');
const dashboardRoutes = require('./src/routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',      authRoutes);
app.use('/api/pegawai',   pegawaiRoutes);
app.use('/api/absensi',   absensiRoutes);
app.use('/api/import',    importRoutes);
app.use('/api/laporan',   laporanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' }); });

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 SIAP Backend → http://localhost:${PORT}`);
    console.log(`📦 Database: SQLite (siap.db)`);
  });
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
