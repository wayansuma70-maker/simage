// ============================================================
// pages/laporan.js — Rekapitulasi & Laporan Akademik KBM (§5.5)
// ============================================================
registerPage('laporan', {
  title: 'Laporan',
  template: () => `
    <h2>Rekapitulasi & Laporan Akademik KBM</h2>
    <p class="muted">Agregasi presensi, capaian nilai, dan validasi jurnal per kelas/mapel.</p>
    <div class="card">
      <div class="field-row">
        <label class="field"><span>Kelas</span><select id="lapKelas"><option value="">Semua Kelas</option></select></label>
        <label class="field"><span>Mapel</span><select id="lapMapel"><option value="">Semua Mapel</option></select></label>
        <label class="field"><span>Dari</span><input type="date" id="lapDari"></label>
        <label class="field"><span>Sampai</span><input type="date" id="lapSampai" value="${todayISO()}"></label>
        <div class="field" style="justify-content:flex-end;"><span>&nbsp;</span><button class="btn btn-primary" id="lapTerapkan">TERAPKAN FILTER</button></div>
      </div>
    </div>
    <div id="lapBody">${skeleton(4)}</div>
  `,
  show(el) {
    const boot = Store.get(userKey('boot'));
    const kelas = boot ? boot.data.boot.kelasDiampu : [];
    const mapel = boot ? boot.data.boot.mapel : [];
    el.querySelector('#lapKelas').insertAdjacentHTML('beforeend', selectOptions(kelas, 'id', 'nama'));
    el.querySelector('#lapMapel').insertAdjacentHTML('beforeend', selectOptions(mapel, 'ID_Mapel', 'NamaMapel'));
    el.querySelector('#lapTerapkan').addEventListener('click', () => loadLaporan(el));
    loadLaporan(el);
  }
});

async function loadLaporan(el) {
  const payload = {
    kelas: el.querySelector('#lapKelas').value, mapel: el.querySelector('#lapMapel').value,
    dari: el.querySelector('#lapDari').value, sampai: el.querySelector('#lapSampai').value
  };
  el.querySelector('#lapBody').innerHTML = skeleton(4);
  const res = await api('laporan.rekap', payload);
  if (!res.success) { el.querySelector('#lapBody').innerHTML = emptyState(res.message); return; }
  renderLaporan(el, res.data);
}

function renderLaporan(el, d) {
  el.querySelector('#lapBody').innerHTML = `
    <div class="grid grid-4">
      ${kpi('Rerata Kehadiran', d.rataKehadiranKelas + '%', null, d.rataKehadiranKelas)}
      ${kpi('Rerata Capaian Nilai', d.rataNilaiKelas)}
      ${kpi('Status Validasi Jurnal', d.statusValidasiJurnal + '%', d.totalJurnal + ' entri jurnal')}
      ${kpi('Total Siswa', d.perSiswa.length)}
    </div>
    <div class="grid grid-2">
      <div class="card"><h3 style="margin-bottom:10px;">Proporsi Status Kehadiran</h3><canvas id="chartDonat" height="200"></canvas></div>
      <div class="card"><h3 style="margin-bottom:10px;">Rata-rata Nilai per Siswa (Top 10)</h3><canvas id="chartBar" height="200"></canvas></div>
    </div>
    <div class="card">
      <div class="toolbar"><h3 style="flex:1;">Ledger Rekapitulasi Siswa</h3>
        <button class="btn btn-sm" onclick="exportLaporanCsv()">⬇ EKSPOR CSV</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>Nama</th><th>NIS</th><th>H</th><th>S</th><th>I</th><th>A</th><th>% Hadir</th><th>Rata Nilai</th></tr></thead>
      <tbody>${d.perSiswa.map((s, i) => `<tr><td class="mono">${String(i + 1).padStart(2, '0')}</td><td>${esc(s.nama)}</td><td class="mono">${esc(s.nis)}</td>
        <td>${s.hadir}</td><td>${s.sakit}</td><td>${s.izin}</td><td>${s.alpa}</td><td>${s.persenHadir}%</td><td>${s.rataNilai}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
  window._laporanCache = d;

  if (window.Chart) {
    const dk = d.distribusiKehadiran;
    new Chart(document.getElementById('chartDonat'), {
      type: 'doughnut',
      data: { labels: ['Hadir', 'Sakit', 'Izin', 'Alpa'], datasets: [{ data: [dk.Hadir, dk.Sakit, dk.Izin, dk.Alpa], backgroundColor: ['#111111', '#888888', '#cccccc', '#eeeeee'] }] },
      options: { plugins: { legend: { position: 'bottom', labels: { font: { family: 'Public Sans' } } } } }
    });
    const top = d.perSiswa.slice().sort((a, b) => b.rataNilai - a.rataNilai).slice(0, 10);
    new Chart(document.getElementById('chartBar'), {
      type: 'bar',
      data: { labels: top.map(s => s.nama.split(' ')[0]), datasets: [{ label: 'Rata Nilai', data: top.map(s => s.rataNilai), backgroundColor: '#111111' }] },
      options: { scales: { y: { beginAtZero: true, max: 100 } }, plugins: { legend: { display: false } } }
    });
  }
}

function exportLaporanCsv() {
  const d = window._laporanCache; if (!d) return;
  const header = ['No', 'Nama', 'NIS', 'Hadir', 'Sakit', 'Izin', 'Alpa', '%Hadir', 'RataNilai'];
  const rows = d.perSiswa.map((s, i) => [i + 1, s.nama, s.nis, s.hadir, s.sakit, s.izin, s.alpa, s.persenHadir, s.rataNilai]);
  const csv = [header].concat(rows).map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'laporan_rekap.csv'; a.click();
}
