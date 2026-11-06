// ============================================================
// pages/migrasi.js — Import data dari spreadsheet JurnalGuru lama
// Sesuai skill gas-migrasi-database: dry-run dulu, lalu jalankan.
// ============================================================
const MIGRASI_SHEETS = ['Master_Guru', 'Master_Mapel', 'Master_Kelas', 'Master_Siswa', 'Jurnal_Harian', 'Absensi', 'Nilai', 'Catatan_Sikap'];

registerPage('migrasi', {
  title: 'Migrasi Data Lama',
  roles: ['Admin'],
  template: () => `
    <h2>Migrasi Data dari Aplikasi Lama</h2>
    <p class="muted">Aplikasi lama hanya <b>dibaca</b>, tidak pernah diubah. Proses ini aman diulang (idempoten).</p>
    <div class="card">
      <label class="field"><span>URL atau ID Spreadsheet Aplikasi Lama</span>
        <input id="migSource" placeholder="https://docs.google.com/spreadsheets/d/....">
      </label>
      <p class="muted">Pastikan Anda login dengan akun Google yang sama dengan pemilik spreadsheet lama.</p>
      <div style="margin:10px 0;">
        <div class="label-sm" style="margin-bottom:6px;">PILIH SHEET YANG DIIMPOR</div>
        <div id="migChecklist" class="field-row"></div>
      </div>
      <div class="field-row">
        <button class="btn" id="migScan">🔍 PINDAI (DRY-RUN)</button>
        <button class="btn btn-primary" id="migRun">▶ JALANKAN IMPORT</button>
      </div>
    </div>
    <div id="migResult"></div>
    <div class="card"><h3 style="margin-bottom:10px;">Riwayat Import</h3><div id="migRiwayat">${skeleton(2)}</div></div>
  `,
  show(el) {
    el.querySelector('#migChecklist').innerHTML = MIGRASI_SHEETS.map(s =>
      `<label style="display:flex;align-items:center;gap:6px;font-size:12px;"><input type="checkbox" class="migChk" value="${s}" checked> ${s}</label>`
    ).join('');
    el.querySelector('#migScan').addEventListener('click', () => runMigrasi(el, true));
    el.querySelector('#migRun').addEventListener('click', () => {
      if (confirm('Jalankan import sesungguhnya? Data akan ditulis ke database aplikasi ini.')) runMigrasi(el, false);
    });
    loadMigrasiRiwayat(el);
  }
});

async function runMigrasi(el, dryRun) {
  const source = el.querySelector('#migSource').value.trim();
  if (!source) return showToast('Isi URL/ID spreadsheet lama terlebih dahulu.', 'error');
  const sheets = [...el.querySelectorAll('.migChk:checked')].map(c => c.value);
  el.querySelector('#migResult').innerHTML = skeleton(4);
  const action = dryRun ? 'migrasi.scan' : 'migrasi.import';
  const res = await api(action, { source, sheets });
  if (!res.success) { el.querySelector('#migResult').innerHTML = `<div class="form-error">${esc(res.message)}</div>`; return; }
  renderMigrasiResult(el, res.data);
  if (!dryRun) loadMigrasiRiwayat(el);
}

function renderMigrasiResult(el, d) {
  const rows = Object.keys(d.report);
  el.querySelector('#migResult').innerHTML = `
    <div class="card">
      <h3>${d.dryRun ? 'Hasil Pemindaian (Dry-run)' : 'Hasil Import'}</h3>
      <p class="muted">Sumber: ${esc(d.source.name)}</p>
      <div class="table-wrap"><table><thead><tr><th>Sheet</th><th>Di App Lama</th><th>Ditambah</th><th>Diperbarui</th><th>Dilewati</th></tr></thead><tbody>
        ${rows.map(s => `<tr><td>${s}</td><td>${d.report[s].source}</td><td>${d.report[s].inserted}</td><td>${d.report[s].updated}</td><td>${d.report[s].skipped}</td></tr>`).join('')}
      </tbody></table></div>
      ${d.warnings.length ? `<div class="form-error" style="margin-top:10px;">⚠ ${d.warnings.map(esc).join('<br>⚠ ')}</div>` : ''}
    </div>`;
}

async function loadMigrasiRiwayat(el) {
  const res = await api('migrasi.riwayat', {});
  if (!res.success) { el.querySelector('#migRiwayat').innerHTML = emptyState(res.message); return; }
  el.querySelector('#migRiwayat').innerHTML = res.data.length ? `<div class="table-wrap"><table><thead><tr><th>Waktu</th><th>Oleh</th><th>Sumber</th></tr></thead><tbody>
      ${res.data.map(r => `<tr><td class="mono">${fmtDateTime(r.Waktu)}</td><td>${esc(r.Oleh)}</td><td class="mono" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;">${esc(r.SourceId)}</td></tr>`).join('')}
    </tbody></table></div>` : emptyState('Belum pernah menjalankan import.');
}
