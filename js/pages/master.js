// ============================================================
// pages/master.js — Data Master (PRD §5.6, khusus Admin)
// + Impor Excel/CSV & Unduh Format Template
// + Tab Penugasan Mengajar (guru mapel → kelas, di luar wali kelas)
// ============================================================
registerPage('master', {
  title: 'Data Master',
  roles: ['Admin'],
  template: () => `
    <h2>Data Master</h2>
    <div class="tabs" id="masterTabs">
      <button data-e="guru" class="active">GURU</button>
      <button data-e="siswa">SISWA</button>
      <button data-e="kelas">KELAS</button>
      <button data-e="mapel">MAPEL</button>
      <button data-e="penugasan">PENUGASAN MENGAJAR</button>
    </div>
    <div class="toolbar">
      <input class="search-box" style="height:38px;border:1px solid var(--c-highest);padding:0 10px;" id="masterSearch" placeholder="Cari...">
      <button class="btn" id="masterUnduhFormat">⬇ UNDUH FORMAT</button>
      <button class="btn" id="masterImportBtn">⬆ IMPOR EXCEL/CSV</button>
      <button class="btn btn-primary" id="masterTambahBtn">+ TAMBAH</button>
    </div>
    <div id="masterBody">${skeleton(6)}</div>
    <input type="file" id="masterFile" accept=".csv,.xlsx,.xls" hidden>
  `,
  show(el) {
    let entitas = 'guru';
    const load = () => loadMaster(el, entitas);
    el.querySelectorAll('#masterTabs button').forEach(b => b.addEventListener('click', () => {
      el.querySelectorAll('#masterTabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); entitas = b.dataset.e;
      el.querySelector('#masterSearch').value = '';
      load();
    }));
    el.querySelector('#masterSearch').addEventListener('input', debounce(() => renderMasterTable(el, entitas, el.querySelector('#masterSearch').value), 250));
    el.querySelector('#masterTambahBtn').addEventListener('click', () => bukaFormTambah_(el, entitas));
    el.querySelector('#masterUnduhFormat').addEventListener('click', () => unduhFormatTemplate(entitas));
    el.querySelector('#masterImportBtn').addEventListener('click', () => el.querySelector('#masterFile').click());
    el.querySelector('#masterFile').addEventListener('change', (e) => handleFileImport(e, entitas, load));
    load();
  }
});

const MASTER_FIELDS = {
  guru: [['Nama', 'text'], ['NIP', 'text'], ['Email', 'email'], ['NoHP', 'tel'], ['Mapel', 'text'],
    ['Peran', 'select', ['Guru', 'WaliKelas', 'Kepsek', 'Wakasek', 'Admin']]],
  siswa: [['Nama', 'text'], ['NIS', 'text'], ['Kelas', 'text'], ['JenisKelamin', 'select', ['L', 'P']], ['NoHPWali', 'tel'], ['EmailWali', 'email']],
  kelas: [['NamaKelas', 'text'], ['NamaWaliKelas', 'text'], ['TahunAjaran', 'text'], ['Fase', 'text']],
  mapel: [['NamaMapel', 'text'], ['Kelompok', 'text'], ['KKM', 'number']],
  penugasan: [['NamaGuru', 'text'], ['NamaKelas', 'text'], ['NamaMapel', 'text']] // tampilan saja, diisi lewat form khusus
};
const MASTER_KEY = { guru: 'ID_Guru', siswa: 'ID_Siswa', kelas: 'ID_Kelas', mapel: 'ID_Mapel', penugasan: 'ID_Tugas' };
const MASTER_LABEL = { guru: 'Guru', siswa: 'Siswa', kelas: 'Kelas', mapel: 'Mapel', penugasan: 'Penugasan Mengajar' };
// Baris contoh untuk memandu admin mengisi template dengan benar
const MASTER_CONTOH = {
  guru: { Nama: 'Siti Aminah, M.Pd.', NIP: '198705192011012014', Email: 'siti.aminah@sekolah.sch.id', NoHP: '081234567890', Mapel: 'Bahasa Indonesia', Peran: 'Guru' },
  siswa: { Nama: 'Ahmad Fauzan', NIS: '0078219921', Kelas: 'X-A', JenisKelamin: 'L', NoHPWali: '081300000001', EmailWali: 'wali@email.com' },
  kelas: { NamaKelas: 'X-B', NamaWaliKelas: 'Bambang S., S.Pd.', TahunAjaran: '2024/2025', Fase: 'Fase E' },
  mapel: { NamaMapel: 'Bahasa Inggris', Kelompok: 'Umum', KKM: 75 }
};

function loadMaster(el, entitas) {
  el.querySelector('#masterBody').innerHTML = skeleton(6);
  const isPenugasan = entitas === 'penugasan';
  el.querySelector('#masterUnduhFormat').style.display = isPenugasan ? 'none' : '';
  el.querySelector('#masterImportBtn').style.display = isPenugasan ? 'none' : '';
  if (isPenugasan) { loadPenugasan(el); return; }
  if (entitas === 'kelas') { loadKelas(el); return; }
  swr('master:' + entitas, 'master.list', { entitas }, (rows) => { window['_master_' + entitas] = rows; renderMasterTable(el, entitas, el.querySelector('#masterSearch').value); }, { fresh: 15000 });
  if (entitas === 'siswa') api('master.list', { entitas: 'kelas' }).then(r => { if (r.success) window._master_opsi_kelas = r.data; }); // untuk dropdown form
}

async function loadKelas(el) {
  const [kelasRes, guruRes] = await Promise.all([api('master.list', { entitas: 'kelas' }), api('master.list', { entitas: 'guru' })]);
  if (!kelasRes.success) { el.querySelector('#masterBody').innerHTML = emptyState(kelasRes.message); return; }
  window._master_opsi_guru = guruRes.data || [];
  const gMap = {}; window._master_opsi_guru.forEach(g => gMap[g.ID_Guru] = g.Nama);
  window._master_kelas = kelasRes.data.map(r => Object.assign({}, r, { NamaWaliKelas: gMap[r.ID_WaliKelas] || (r.ID_WaliKelas ? r.ID_WaliKelas : '—') }));
  renderMasterTable(el, 'kelas', el.querySelector('#masterSearch').value);
}

async function loadPenugasan(el) {
  const [tgs, guru, kelas, mapel] = await Promise.all([
    api('master.list', { entitas: 'penugasan' }), api('master.list', { entitas: 'guru' }),
    api('master.list', { entitas: 'kelas' }), api('master.list', { entitas: 'mapel' })
  ]);
  if (!tgs.success) { el.querySelector('#masterBody').innerHTML = emptyState(tgs.message); return; }
  const gMap = {}, kMap = {}, mMap = {};
  (guru.data || []).forEach(g => gMap[g.ID_Guru] = g.Nama);
  (kelas.data || []).forEach(k => kMap[k.ID_Kelas] = k.NamaKelas);
  (mapel.data || []).forEach(m => mMap[m.ID_Mapel] = m.NamaMapel);
  window._master_penugasan = tgs.data.map(r => Object.assign({}, r, {
    NamaGuru: gMap[r.ID_Guru] || r.ID_Guru, NamaKelas: kMap[r.ID_Kelas] || r.ID_Kelas, NamaMapel: mMap[r.ID_Mapel] || r.ID_Mapel
  }));
  window._master_opsi_guru = guru.data || []; window._master_opsi_kelas = kelas.data || []; window._master_opsi_mapel = mapel.data || [];
  renderMasterTable(el, 'penugasan', el.querySelector('#masterSearch').value);
}

function bukaFormTambah_(el, entitas) {
  if (entitas === 'penugasan') openPenugasanForm(el);
  else if (entitas === 'siswa') openSiswaForm(el);
  else if (entitas === 'kelas') openKelasForm(el);
  else openMasterForm(entitas);
}
function formOpenerCall_(entitas, r) {
  const data = JSON.stringify(r).replace(/'/g, '&#39;');
  const pageEl = `document.querySelector(".page[data-page=master]")`;
  if (entitas === 'penugasan') return `openPenugasanForm(${pageEl}, ${data})`;
  if (entitas === 'siswa') return `openSiswaForm(${pageEl}, ${data})`;
  if (entitas === 'kelas') return `openKelasForm(${pageEl}, ${data})`;
  return `openMasterForm("${entitas}", ${data})`;
}

function renderMasterTable(el, entitas, q) {
  let rows = window['_master_' + entitas] || [];
  if (q) { const ql = q.toLowerCase(); rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(ql)); }
  if (!rows.length) {
    el.querySelector('#masterBody').innerHTML = emptyState(entitas === 'penugasan'
      ? 'Belum ada penugasan. Guru mapel tanpa penugasan tidak akan melihat kelas di menu Jurnal/Absensi/Nilai, kecuali ia wali kelas.'
      : 'Belum ada data. Gunakan "Unduh Format" untuk mulai mengisi lewat Excel.');
    return;
  }
  const cols = MASTER_FIELDS[entitas].map(f => f[0]);
  el.querySelector('#masterBody').innerHTML = `<div class="card"><div class="table-wrap"><table><thead><tr>
      <th>ID</th>${cols.map(c => `<th>${c}</th>`).join('')}<th></th>
    </tr></thead><tbody>
      ${rows.map(r => `<tr><td class="mono">${esc(r[MASTER_KEY[entitas]])}</td>${cols.map(c => `<td>${esc(r[c])}</td>`).join('')}
        <td style="white-space:nowrap;">
          <button class="btn btn-sm" onclick='${formOpenerCall_(entitas, r)}'>EDIT</button>
          <button class="btn btn-sm btn-danger" onclick="hapusMaster('${entitas}','${r[MASTER_KEY[entitas]]}')">HAPUS</button>
        </td></tr>`).join('')}
    </tbody></table></div></div>`;
}

function openMasterForm(entitas, data) {
  const fields = MASTER_FIELDS[entitas];
  const isEdit = !!data;
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>${isEdit ? 'Edit' : 'Tambah'} ${entitas.toUpperCase()}</h3>
    <form id="masterForm" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
      ${fields.map(([name, type, opts]) => `
        <label class="field"><span>${name}</span>
          ${type === 'select' ? `<select name="${name}">${opts.map(o => `<option ${data && data[name] === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`
            : `<input type="${type}" name="${name}" value="${esc(data ? data[name] : '')}">`}
        </label>`).join('')}
      ${entitas === 'guru' ? `<label class="field"><span>${isEdit ? 'Reset Kata Sandi (opsional)' : 'Kata Sandi Awal'}</span><input type="text" name="password" placeholder="${isEdit ? 'Kosongkan jika tidak diubah' : 'default: ganti123'}"></label>` : ''}
      <button type="submit" class="btn btn-primary btn-block">SIMPAN</button>
    </form>
  `);
  document.getElementById('masterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {}; fd.forEach((v, k) => { if (v !== '') payload[k] = v; });
    const btn = e.target.querySelector('button'); btn.disabled = true;
    const res = await api('master.save', { entitas, id: data ? data[MASTER_KEY[entitas]] : '', data: payload });
    if (res.success) { showToast(res.message); closeModal(); Store.del(userKey('master:' + entitas)); route(); }
    else { showToast(res.message, 'error'); btn.disabled = false; }
  });
}

async function hapusMaster(entitas, id) {
  if (!confirm('Hapus data "' + id + '" ini? Tindakan tidak dapat dibatalkan.')) return;
  const res = await api('master.delete', { entitas, id });
  if (res.success) {
    showToast(res.message);
    Store.del(userKey('master:' + entitas));
    route();
  } else showToast(res.message, 'error');
}

// ------------------------------------------------------------
// Form khusus Penugasan Mengajar (dropdown nama, bukan isi ID manual)
// ------------------------------------------------------------
function openPenugasanForm(el, data) {
  const guruList = window._master_opsi_guru || [];
  const kelasList = window._master_opsi_kelas || [];
  const mapelList = window._master_opsi_mapel || [];
  const isEdit = !!data;
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>${isEdit ? 'Edit' : 'Tambah'} Penugasan Mengajar</h3>
    <p class="muted">Guru mapel yang ditugaskan mengajar di suatu kelas akan melihat kelas itu di menu Jurnal, Absensi, dan Nilai — meski bukan wali kelasnya.</p>
    <form id="penugasanForm" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
      <label class="field"><span>Guru *</span><select name="ID_Guru" required>${selectOptions(guruList, 'ID_Guru', 'Nama', data ? data.ID_Guru : '')}</select></label>
      <label class="field"><span>Kelas *</span><select name="ID_Kelas" required>${selectOptions(kelasList, 'ID_Kelas', 'NamaKelas', data ? data.ID_Kelas : '')}</select></label>
      <label class="field"><span>Mapel *</span><select name="ID_Mapel" required>${selectOptions(mapelList, 'ID_Mapel', 'NamaMapel', data ? data.ID_Mapel : '')}</select></label>
      <button type="submit" class="btn btn-primary btn-block">SIMPAN</button>
    </form>
  `);
  document.getElementById('penugasanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {}; fd.forEach((v, k) => payload[k] = v);
    const btn = e.target.querySelector('button'); btn.disabled = true;
    const res = await api('master.save', { entitas: 'penugasan', id: data ? data.ID_Tugas : '', data: payload });
    if (res.success) { showToast(res.message); closeModal(); loadPenugasan(el); }
    else { showToast(res.message, 'error'); btn.disabled = false; }
  });
}

// ------------------------------------------------------------
// Form khusus Siswa — Kelas dipilih dari dropdown, bukan ketik ID manual
// (penyebab umum "siswa tidak muncul saat absen/nilai" sebelumnya)
// ------------------------------------------------------------
async function openSiswaForm(el, data) {
  let kelasList = window._master_opsi_kelas;
  if (!kelasList) { const r = await api('master.list', { entitas: 'kelas' }); kelasList = r.success ? r.data : []; window._master_opsi_kelas = kelasList; }
  if (!kelasList.length) { showToast('Buat data Kelas dulu di tab "Kelas" sebelum menambah siswa.', 'error'); return; }
  const isEdit = !!data;
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>${isEdit ? 'Edit' : 'Tambah'} Siswa</h3>
    <form id="siswaForm" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
      <label class="field"><span>Nama *</span><input name="Nama" required value="${esc(data ? data.Nama : '')}"></label>
      <label class="field"><span>NIS *</span><input name="NIS" required value="${esc(data ? data.NIS : '')}"></label>
      <label class="field"><span>Kelas *</span><select name="ID_Kelas" required>${selectOptions(kelasList, 'ID_Kelas', 'NamaKelas', data ? data.ID_Kelas : '')}</select></label>
      <label class="field"><span>Jenis Kelamin</span><select name="JenisKelamin"><option value="L" ${data && data.JenisKelamin === 'L' ? 'selected' : ''}>L</option><option value="P" ${data && data.JenisKelamin === 'P' ? 'selected' : ''}>P</option></select></label>
      <label class="field"><span>No. HP Wali</span><input name="NoHPWali" value="${esc(data ? data.NoHPWali : '')}"></label>
      <label class="field"><span>Email Wali</span><input type="email" name="EmailWali" value="${esc(data ? data.EmailWali : '')}"></label>
      <button type="submit" class="btn btn-primary btn-block">SIMPAN</button>
    </form>
  `);
  document.getElementById('siswaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {}; fd.forEach((v, k) => { if (v !== '') payload[k] = v; });
    const kelas = kelasList.find(k => k.ID_Kelas === payload.ID_Kelas);
    if (kelas) { payload.Kelas = kelas.NamaKelas; payload.ID_WaliKelas = kelas.ID_WaliKelas || ''; }
    const btn = e.target.querySelector('button'); btn.disabled = true;
    const res = await api('master.save', { entitas: 'siswa', id: data ? data.ID_Siswa : '', data: payload });
    if (res.success) { showToast(res.message); closeModal(); Store.del(userKey('master:siswa')); route(); }
    else { showToast(res.message, 'error'); btn.disabled = false; }
  });
}

// ------------------------------------------------------------
// Form khusus Kelas — Wali Kelas dipilih dari dropdown guru
// ------------------------------------------------------------
async function openKelasForm(el, data) {
  let guruList = window._master_opsi_guru;
  if (!guruList) { const r = await api('master.list', { entitas: 'guru' }); guruList = r.success ? r.data : []; window._master_opsi_guru = guruList; }
  const isEdit = !!data;
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>${isEdit ? 'Edit' : 'Tambah'} Kelas</h3>
    <form id="kelasForm" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
      <label class="field"><span>Nama Kelas *</span><input name="NamaKelas" required value="${esc(data ? data.NamaKelas : '')}" placeholder="cth: VII-A"></label>
      <label class="field"><span>Wali Kelas</span><select name="ID_WaliKelas"><option value="">— Tidak ada —</option>${selectOptions(guruList, 'ID_Guru', 'Nama', data ? data.ID_WaliKelas : '')}</select></label>
      <label class="field"><span>Tahun Ajaran</span><input name="TahunAjaran" value="${esc(data ? data.TahunAjaran : '2024/2025')}"></label>
      <label class="field"><span>Fase</span><input name="Fase" value="${esc(data ? data.Fase : '')}" placeholder="cth: Fase D"></label>
      <button type="submit" class="btn btn-primary btn-block">SIMPAN</button>
    </form>
  `);
  document.getElementById('kelasForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {}; fd.forEach((v, k) => payload[k] = v);
    const btn = e.target.querySelector('button'); btn.disabled = true;
    const res = await api('master.save', { entitas: 'kelas', id: data ? data.ID_Kelas : '', data: payload });
    if (res.success) { showToast(res.message); closeModal(); window._master_opsi_kelas = null; loadKelas(el); }
    else { showToast(res.message, 'error'); btn.disabled = false; }
  });
}

// ------------------------------------------------------------
// Unduh Format Template (.xlsx) — berisi header kolom + 1 baris contoh
// ------------------------------------------------------------
function unduhFormatTemplate(entitas) {
  if (!window.XLSX) { showToast('Pustaka Excel belum termuat, coba lagi sesaat.', 'error'); return; }
  const cols = MASTER_FIELDS[entitas].map(f => f[0]);
  const contoh = MASTER_CONTOH[entitas] || {};
  const dataSheet = [cols, cols.map(c => contoh[c] !== undefined ? contoh[c] : '')];

  const wsKeterangan = XLSX.utils.aoa_to_sheet([
    ['PETUNJUK PENGISIAN — ' + MASTER_LABEL[entitas].toUpperCase()],
    [''],
    ['1. Jangan mengubah urutan atau nama header di baris pertama sheet "Data".'],
    ['2. Baris ke-2 pada sheet "Data" adalah CONTOH — boleh dihapus atau ditimpa.'],
    ['3. Kolom ID tidak perlu diisi, akan dibuat otomatis oleh sistem.'],
    ['4. Simpan file, lalu unggah lewat tombol "Impor Excel/CSV" di menu Data Master.'],
    ['5. Format nomor HP bebas (08xxx atau 62xxx), akan dirapikan otomatis oleh sistem.'],
    entitas === 'siswa' ? ['6. Kolom "Kelas" harus PERSIS SAMA dengan nama kelas yang sudah ada di tab Kelas (cth: "VII-A"). Buat kelasnya dulu di tab Kelas jika belum ada.'] : null,
    entitas === 'kelas' ? ['6. Kolom "NamaWaliKelas" harus PERSIS SAMA dengan nama guru di tab Guru. Boleh dikosongkan jika belum ada wali kelasnya.'] : null
  ].filter(Boolean));
  wsKeterangan['!cols'] = [{ wch: 70 }];

  const wsData = XLSX.utils.aoa_to_sheet(dataSheet);
  wsData['!cols'] = cols.map(() => ({ wch: 22 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsKeterangan, 'Petunjuk');
  XLSX.utils.book_append_sheet(wb, wsData, 'Data');
  XLSX.writeFile(wb, `Format_${MASTER_LABEL[entitas]}_JurnalGuru.xlsx`);
}

// ------------------------------------------------------------
// Impor dari Excel (.xlsx/.xls) atau CSV
// ------------------------------------------------------------
function handleFileImport(e, entitas, onDone) {
  const file = e.target.files[0];
  if (!file) return;
  const namaLower = file.name.toLowerCase();
  if (namaLower.endsWith('.xlsx') || namaLower.endsWith('.xls')) importFromExcel_(file, entitas, onDone, e.target);
  else importFromCsv_(file, entitas, onDone, e.target);
}

function importFromExcel_(file, entitas, onDone, inputEl) {
  if (!window.XLSX) { showToast('Pustaka Excel belum termuat, coba lagi sesaat.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const wb = XLSX.read(reader.result, { type: 'array' });
      const sheetName = wb.SheetNames.includes('Data') ? 'Data' : wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      let rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      rows = rows.map(r => { const o = {}; Object.keys(r).forEach(k => o[k.trim()] = String(r[k]).trim()); return o; })
        .filter(r => Object.values(r).some(v => v !== ''));
      if (!rows.length) { showToast('Tidak ada baris data terbaca dari sheet "Data".', 'error'); inputEl.value = ''; return; }
      await konfirmasiDanImpor_(entitas, rows, onDone, inputEl);
    } catch (err) { showToast('Gagal membaca file Excel: ' + err.message, 'error'); inputEl.value = ''; }
  };
  reader.readAsArrayBuffer(file);
}

function importFromCsv_(file, entitas, onDone, inputEl) {
  const reader = new FileReader();
  reader.onload = async () => {
    const lines = reader.result.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { showToast('File CSV kosong atau hanya berisi header.', 'error'); inputEl.value = ''; return; }
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(l => { const cells = l.split(','); const o = {}; headers.forEach((h, i) => o[h] = (cells[i] || '').trim()); return o; });
    await konfirmasiDanImpor_(entitas, rows, onDone, inputEl);
  };
  reader.readAsText(file);
}

async function konfirmasiDanImpor_(entitas, rows, onDone, inputEl) {
  if (!confirm(`Impor ${rows.length} baris ke data ${MASTER_LABEL[entitas]}?`)) { inputEl.value = ''; return; }
  const res = await api('master.importCsv', { entitas, rows });
  if (res.success) { showToast(res.message); onDone(); } else showToast(res.message, 'error');
  inputEl.value = '';
}