const knex = require('knex');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../siap.db');

let db;

function getDB() {
  if (!db) {
    db = knex({ client: 'sqlite3', connection: { filename: DB_PATH }, useNullAsDefault: true });
  }
  return db;
}

async function initDB() {
  const database = getDB();

  await database.schema.hasTable('users').then(async (exists) => {
    if (!exists) {
      await database.schema.createTable('users', (t) => {
        t.increments('id').primary();
        t.string('username').unique().notNullable();
        t.string('password_hash').notNullable();
        t.string('nama').notNullable();
        t.string('role').defaultTo('admin');
        t.timestamp('created_at').defaultTo(database.fn.now());
      });
    }
  });

  await database.schema.hasTable('pegawai').then(async (exists) => {
    if (!exists) {
      await database.schema.createTable('pegawai', (t) => {
        t.increments('id').primary();
        t.string('nip').unique().notNullable();
        t.string('nama').notNullable();
        t.string('jabatan');
        t.string('unit_kerja');
        t.string('jenis_kelamin');
        t.string('golongan');
        t.integer('no_fp');
        t.integer('status_aktif').defaultTo(1);
        t.timestamp('created_at').defaultTo(database.fn.now());
      });
    }
  });

  await database.schema.hasTable('import_batch').then(async (exists) => {
    if (!exists) {
      await database.schema.createTable('import_batch', (t) => {
        t.increments('id').primary();
        t.string('filename').notNullable();
        t.integer('total_records').defaultTo(0);
        t.integer('berhasil').defaultTo(0);
        t.integer('gagal').defaultTo(0);
        t.string('status').defaultTo('pending');
        t.integer('imported_by');
        t.timestamp('created_at').defaultTo(database.fn.now());
      });
    }
  });

  await database.schema.hasTable('fingerprint_raw').then(async (exists) => {
    if (!exists) {
      await database.schema.createTable('fingerprint_raw', (t) => {
        t.increments('id').primary();
        t.integer('no_fp');
        t.string('tanggal').notNullable();
        t.string('jam').notNullable();
        t.integer('batch_id');
        t.timestamp('created_at').defaultTo(database.fn.now());
      });
    }
  });

  await database.schema.hasTable('absensi').then(async (exists) => {
    if (!exists) {
      await database.schema.createTable('absensi', (t) => {
        t.increments('id').primary();
        t.integer('pegawai_id').notNullable();
        t.string('tanggal').notNullable();
        t.string('jam_masuk');
        t.string('jam_keluar');
        t.string('status').defaultTo('hadir');
        t.integer('menit_terlambat').defaultTo(0);
        t.string('keterangan');
        t.timestamp('created_at').defaultTo(database.fn.now());
        t.unique(['pegawai_id', 'tanggal']);
      });
    }
  });

  console.log('✅ Database initialized');
  await seedIfEmpty(database);
}

async function seedIfEmpty(database) {
  const count = await database('users').count('id as c').first();
  if (count.c > 0) return;

  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  await database('users').insert({ username: 'admin', password_hash: hash, nama: 'Administrator', role: 'admin' });

  const units = ['Bidang Pengelolaan Sampah', 'Bidang PSLB3', 'Bidang Tata Lingkungan', 'Sekretariat', 'UPT Kebersihan'];
  const jabatans = ['Kepala Bidang', 'Kepala Sub Bagian', 'Analis Kebijakan', 'Pengawas Lingkungan', 'Pengelola Data', 'Staf Administrasi'];
  const golongans = ['II/a', 'II/b', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a'];
  const namaL = ['Ahmad Fauzi', 'Budi Santoso', 'Chandra Wijaya', 'Dedi Kurniawan', 'Eko Prasetyo', 'Fajar Hidayat', 'Gunawan Saputra', 'Hendra Setiawan', 'Imam Wahyudi', 'Joko Susanto', 'Khairul Anwar', 'Lukman Hakim'];
  const namaP = ['Siti Rahayu', 'Dewi Astuti', 'Fitri Handayani', 'Nurul Hidayah', 'Ratna Sari', 'Indah Permata', 'Yuni Kartika', 'Wulandari'];
  const allNames = [...namaL.map(n => ({ nama: n, jk: 'L' })), ...namaP.map(n => ({ nama: n, jk: 'P' }))];

  for (let i = 0; i < allNames.length; i++) {
    const p = allNames[i];
    const nip = `197${i + 1}${String(i + 1).padStart(6, '0')}`;
    await database('pegawai').insert({ nip, nama: p.nama, jabatan: jabatans[i % jabatans.length], unit_kerja: units[i % units.length], jenis_kelamin: p.jk, golongan: golongans[i % golongans.length], no_fp: i + 1, status_aktif: 1 });
  }

  const pegawaiList = await database('pegawai').select('id');
  const statuses = ['hadir','hadir','hadir','hadir','terlambat','terlambat','izin','sakit','alpha'];
  const absensiRows = [];

  for (let d = 29; d >= 0; d--) {
    const date = new Date(); date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().slice(0, 10);
    for (const p of pegawaiList) {
      const st = statuses[Math.floor(Math.random() * statuses.length)];
      let jamMasuk = null, jamKeluar = null, menit = 0;
      if (st === 'hadir') { jamMasuk = `07:${30 + Math.floor(Math.random() * 10)}`; jamKeluar = '16:05'; }
      else if (st === 'terlambat') { menit = 15 + Math.floor(Math.random() * 60); const h = Math.floor((480 + menit) / 60); const m = (480 + menit) % 60; jamMasuk = `${h}:${String(m).padStart(2,'0')}`; jamKeluar = '16:05'; }
      absensiRows.push({ pegawai_id: p.id, tanggal: dateStr, jam_masuk: jamMasuk, jam_keluar: jamKeluar, status: st, menit_terlambat: menit });
    }
  }

  // Insert in chunks
  for (let i = 0; i < absensiRows.length; i += 100) {
    try { await database('absensi').insert(absensiRows.slice(i, i + 100)).onConflict(['pegawai_id','tanggal']).ignore(); }
    catch (e) { /* ignore */ }
  }
  console.log('🌱 Seed data inserted');
}

module.exports = { getDB, initDB };
