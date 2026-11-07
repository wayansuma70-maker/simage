// ============================================================
// pages/sikap.js — Catatan Sikap & Perilaku Siswa (Jurnal Anekdot)
// ============================================================
registerPage('sikap', {
  title: 'Catatan Sikap',
  template: () => `
    <div class="toolbar">
      <h2 style="flex:1;">Catatan Sikap & Perilaku Siswa</h2>
      <button class="btn btn-primary" id="sikapTambahBtn">+ CATAT INSIDEN</button>
    </div>
    <div id="sikapBody">${skeleton(5)}</div>
  `,
  show(el) {
    el.querySelector('#sikapTambahBtn').addEventListener('click', () => openSikapForm());
    swr('sikap', 'sikap.list', {}, (rows) => renderSikap(el, rows), { fresh: 20000 });
  }
});

function renderSikap(el, rows) {
  if (!rows || !rows.length) { el.querySelector('#sikapBody').innerHTML = emptyState('Belum ada catatan sikap.'); return; }
  el.querySelector('#sikapBody').innerHTML = rows.map(r => `
    <div class="card-flat" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <b>${esc(r.NamaSiswa)}</b>
        <span class="pill ${r.Klasifikasi === 'Positif/Apresiasi' ? 'pill-solid' : 'pill-outline'}">${esc(r.Klasifikasi)}</span>
      </div>
      <div class="muted" style="margin:4px 0;">${esc(r.Kelas)} · ${fmtDate(r.Tanggal)} ${r.DimensiP5 ? '· Dimensi Profil Lulusan: ' + esc(r.DimensiP5) : ''}</div>
      <div>${esc(r.Deskripsi)}</div>
      ${r.TindakLanjut ? `<div class="muted" style="margin-top:6px;"><b>Tindak lanjut:</b> ${esc(r.TindakLanjut)}</div>` : ''}
      ${['Admin', 'Kepsek', 'Wakasek'].includes(AppState.peran) || r.ID_Guru === AppState.guruId
        ? `<div style="margin-top:8px;text-align:right;"><button class="btn btn-sm btn-danger" onclick="hapusSikap('${r.ID_Catatan}')">HAPUS</button></div>` : ''}
    </div>`).join('');
}

async function hapusSikap(id) {
  if (!confirm('Hapus catatan sikap ini?')) return;
  const res = await api('sikap.delete', { id });
  if (res.success) { showToast(res.message); Store.del(userKey('sikap')); route(); } else showToast(res.message, 'error');
}

function openSikapForm() {
  const boot = Store.get(userKey('boot'));
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>Catat Insiden Sikap Siswa</h3>
    <form id="sikapForm" style="margin-top:12px;display:flex;flex-direction:column;gap:12px;">
      <div class="field-row">
        <label class="field" style="flex:1;"><span>Tanggal *</span><input type="date" id="sTanggal" required max="${todayISO()}" value="${todayISO()}"></label>
        <label class="field" style="flex:1;"><span>ID Siswa (NIS) *</span><input id="sSiswa" required placeholder="cth: SIS0001"></label>
      </div>
      <label class="field"><span>Klasifikasi *</span>
        <select id="sKlasifikasi">
          <option value="Positif/Apresiasi">Positif / Apresiasi</option>
          <option value="Perlu Pembinaan">Perlu Pembinaan</option>
        </select>
      </label>
      <label class="field"><span>Dimensi Profil Lulusan</span>
        <select id="sDimensi">
          <option value="">— Pilih Dimensi —</option>
          <option>Keimanan dan Ketakwaan terhadap Tuhan YME</option>
          <option>Kewargaan</option>
          <option>Penalaran Kritis</option>
          <option>Kreativitas</option>
          <option>Kolaborasi</option>
          <option>Kemandirian</option>
          <option>Kesehatan</option>
          <option>Komunikasi</option>
        </select>
      </label>
      <label class="field"><span>Deskripsi Kejadian *</span><textarea id="sDeskripsi" required></textarea></label>
      <label class="field"><span>Tindak Lanjut</span><textarea id="sTindakLanjut"></textarea></label>
      <button type="submit" class="btn btn-primary btn-block">SIMPAN CATATAN</button>
    </form>
  `);
  document.getElementById('sikapForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (formSudahDikirim(e.target)) return;
    const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'MENYIMPAN...';
    const res = await api('sikap.save', {
      tanggal: document.getElementById('sTanggal').value,
      idSiswa: document.getElementById('sSiswa').value,
      klasifikasi: document.getElementById('sKlasifikasi').value,
      dimensi: document.getElementById('sDimensi').value,
      deskripsi: document.getElementById('sDeskripsi').value,
      tindakLanjut: document.getElementById('sTindakLanjut').value
    });
    if (res.success) { showToast(res.message); closeModal(); route(); } else { showToast(res.message, 'error'); btn.disabled = false; btn.textContent = 'SIMPAN CATATAN'; formSelesaiDikirim(e.target); }
  });
}