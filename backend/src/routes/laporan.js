const express = require('express');
const ExcelJS = require('exceljs');
const { getDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const BULAN_NAMES = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

async function getRekapData(db, { bulan, tahun, unit_kerja }) {
  let q = db('pegawai').where({ status_aktif: 1 });
  if (unit_kerja) q = q.where({ unit_kerja });
  const pegawaiList = await q.orderBy('nama');

  return Promise.all(pegawaiList.map(async p => {
    let sq = db('absensi').where({ pegawai_id: p.id }).whereRaw(`strftime('%Y', tanggal) = ?`, [String(tahun)]);
    if (bulan) sq = sq.whereRaw(`strftime('%m', tanggal) = ?`, [String(bulan).padStart(2,'0')]);
    const stats = await sq.groupBy('status').select('status', db.raw('COUNT(*) as total'));
    const sm = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, cuti: 0 };
    stats.forEach(s => { sm[s.status] = Number(s.total); });
    const totalHadir = sm.hadir + sm.terlambat;
    const totalHariKerja = Object.values(sm).reduce((a, b) => a + b, 0);
    return { ...p, ...sm, totalHadir, totalHariKerja, persentase: totalHariKerja > 0 ? Math.round((totalHadir / totalHariKerja) * 100) : 0 };
  }));
}

router.get('/rekap', async (req, res, next) => {
  try {
    const { bulan, tahun = new Date().getFullYear(), unit_kerja } = req.query;
    const db = getDB();
    const data = await getRekapData(db, { bulan, tahun, unit_kerja });
    res.json({ data, bulan, tahun, unit_kerja });
  } catch (e) { next(e); }
});

router.get('/export/excel', async (req, res, next) => {
  try {
    const { bulan, tahun = new Date().getFullYear(), unit_kerja } = req.query;
    const db = getDB();
    const data = await getRekapData(db, { bulan, tahun, unit_kerja });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'SIAP - DLH Palembang';
    const ws = wb.addWorksheet('Rekap Absensi');

    ws.mergeCells('A1:L1');
    ws.getCell('A1').value = 'REKAPITULASI ABSENSI PEGAWAI';
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };
    ws.mergeCells('A2:L2');
    ws.getCell('A2').value = 'DINAS LINGKUNGAN HIDUP KOTA PALEMBANG';
    ws.getCell('A2').font = { bold: true, size: 12 };
    ws.getCell('A2').alignment = { horizontal: 'center' };
    ws.mergeCells('A3:L3');
    ws.getCell('A3').value = `Periode: ${bulan ? BULAN_NAMES[Number(bulan)] : 'Semua Bulan'} ${tahun}${unit_kerja ? ' | Unit: ' + unit_kerja : ''}`;
    ws.getCell('A3').alignment = { horizontal: 'center' };
    ws.addRow([]);

    const hRow = ws.addRow(['No','NIP','Nama','Jabatan','Unit Kerja','Gol.','Hadir','Terlambat','Izin','Sakit','Alpha','% Hadir']);
    hRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
    hRow.alignment = { horizontal: 'center', vertical: 'middle' };
    [4,18,28,22,28,8,8,10,8,8,8,10].forEach((w, i) => ws.getColumn(i+1).width = w);

    data.forEach((p, i) => {
      const row = ws.addRow([i+1, p.nip, p.nama, p.jabatan, p.unit_kerja, p.golongan, p.hadir, p.terlambat, p.izin, p.sakit, p.alpha, `${p.persentase}%`]);
      const pct = p.persentase;
      const color = pct >= 80 ? 'FFBBF7D0' : pct >= 60 ? 'FFFEF3C7' : 'FFFEE2E2';
      row.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      if (i % 2 === 0) { for (let c=1; c<=11; c++) { if (!row.getCell(c).fill || !row.getCell(c).fill.fgColor) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; } }
    });

    // Add totals row
    const totalRow = ws.addRow(['','','TOTAL','','', '', data.reduce((s,p)=>s+p.hadir,0), data.reduce((s,p)=>s+p.terlambat,0), data.reduce((s,p)=>s+p.izin,0), data.reduce((s,p)=>s+p.sakit,0), data.reduce((s,p)=>s+p.alpha,0), '']);
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdcfce7' } };

    ws.addRow([]);
    ws.addRow(['', '', `Palembang, ${new Date().toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}`]);
    ws.addRow(['', '', 'Kepala Dinas Lingkungan Hidup']);
    ws.addRow(['', '', 'Kota Palembang']);
    for (let i = 0; i < 4; i++) ws.addRow([]);
    ws.addRow(['', '', '__________________________']);
    ws.addRow(['', '', 'NIP. ..............................']);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=rekap_absensi_${tahun}${bulan?'_'+String(bulan).padStart(2,'0'):''}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) { next(e); }
});

module.exports = router;
