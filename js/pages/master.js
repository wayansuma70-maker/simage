// ============================================================
// pages/master.js — Data Master (PRD §5.6, khusus Admin)
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
    </div>
    <div class="toolbar">
      <input class="search-box" style="height:38px;border:1px solid var(--c-highest);padding:0 10px;" id="masterSearch" placeholder="Cari...">
      <button class="btn" id="masterImportBtn">⬆ IMPOR CSV</button>
      <button class="btn btn-primary" id="masterTambahBtn">+ TAMBAH</button>
    </div>
    <div id="masterBody">${skeleton(6)}</div>
    <input type="file" id="masterCsvFile" accept=".csv" hidden>
  `,
  show(el) {
    let entitas = 'guru';
    const load = () => loadMaster(el, entitas);
    el.querySelectorAll('#masterTabs button').forEach(b => b.addEventListener('click', () => {
      el.querySelectorAll('#masterTabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); entitas = b.dataset.e; load();
    }));
    el.querySelector('#masterSearch').addEventListener('input', debounce(() => renderMasterTable(el, entitas, el.querySelector('#masterSearch').value), 250));
    el.querySelector('#masterTambahBtn').addEventListener('click', () => openMasterForm(entitas));
    el.querySelector('#masterImportBtn').addEventListener('click', () => el.querySelector('#masterCsvFile').click());
    el.querySelector('#masterCsvFile').addEventListener('change', (e) => handleCsvImport(e, entitas, load));
    load();
  }
});

const MASTER_FIELDS = {
  guru: [['Nama', 'text'], ['NIP', 'text'], ['Email', 'email'], ['NoHP', 'tel'], ['Mapel', 'text'],
    ['Peran', 'select', ['Guru', 'WaliKelas', 'Kepsek', 'Wakasek', 'Admin']]],
  siswa: [['Nama', 'text'], ['NIS', 'text'], ['Kelas', 'text'], ['ID_Kelas', 'text'], ['ID_WaliKelas', 'text'],
    ['JenisKelamin', 'select', ['L', 'P']], ['NoHPWali', 'tel'], ['EmailWali', 'email']],
  kelas: [['NamaKelas', 'text'], ['ID_WaliKelas', 'text'], ['TahunAjaran', 'text'], ['Fase', 'text']],
  mapel: [['NamaMapel', 'text'], ['Kelompok', 'text'], ['KKM', 'number']]
};
const MASTER_KEY = { guru: 'ID_Guru', siswa: 'ID_Siswa', kelas: 'ID_Kelas', mapel: 'ID_Mapel' };

function loadMaster(el, entitas) {
  el.querySelector('#masterBody').innerHTML = skeleton(6);
  swr('master:' + entitas, 'master.list', { entitas }, (rows) => { window['_master_' + entitas] = rows; renderMasterTable(el, entitas, el.querySelector('#masterSearch').value); }, { fresh: 15000 });
}

function renderMasterTable(el, entitas, q) {
  let rows = window['_master_' + entitas] || [];
  if (q) { const ql = q.toLowerCase(); rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(ql)); }
  if (!rows.length) { el.querySelector('#masterBody').innerHTML = emptyState('Belum ada data.'); return; }
  const cols = MASTER_FIELDS[entitas].map(f => f[0]);
  el.querySelector('#masterBody').innerHTML = `<div class="card"><div class="table-wrap"><table><thead><tr>
      <th>ID</th>${cols.map(c => `<th>${c}</th>`).join('')}<th></th>
    </tr></thead><tbody>
      ${rows.map(r => `<tr><td class="mono">${esc(r[MASTER_KEY[entitas]])}</td>${cols.map(c => `<td>${esc(r[c])}</td>`).join('')}
        <td><button class="btn btn-sm" onclick='openMasterForm("${entitas}", ${JSON.stringify(r).replace(/'/g, "&#39;")})'>EDIT</button></td></tr>`).join('')}
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

function handleCsvImport(e, entitas, onDone) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const lines = reader.result.split(/\r?\n/).filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(l => { const cells = l.split(','); const o = {}; headers.forEach((h, i) => o[h] = (cells[i] || '').trim()); return o; });
    if (!confirm('Impor ' + rows.length + ' baris ke data ' + entitas + '?')) return;
    const res = await api('master.importCsv', { entitas, rows });
    if (res.success) { showToast(res.message); onDone(); } else showToast(res.message, 'error');
    e.target.value = '';
  };
  reader.readAsText(file);
}
