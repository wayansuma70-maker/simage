// ============================================================
// pages/crm.js — CRM Kontak (Guru & Wali Siswa)
// ============================================================
registerPage('crm', {
  title: 'CRM Kontak',
  roles: ['Admin', 'Kepsek', 'Wakasek'],
  template: () => `
    <div class="toolbar">
      <h2 style="flex:1;">CRM Kontak</h2>
      <button class="btn btn-sm" id="crmSync">↻ SINKRON SEKARANG</button>
    </div>
    <div id="crmKpi" class="grid grid-4">${skeleton(1)}${skeleton(1)}${skeleton(1)}${skeleton(1)}</div>
    <div class="card">
      <div class="toolbar">
        <input class="search-box" id="crmCari" placeholder="Cari nama, email, atau nomor..." style="height:36px;border:1px solid var(--c-highest);padding:0 10px;">
        <select id="crmSegmen" style="height:36px;"><option value="">Semua Segmen</option><option>Guru</option><option>Wali Siswa</option></select>
        <div id="crmBulkActions" style="display:none;gap:8px;">
          <button class="btn btn-sm" onclick="crmBulkAction('tag')">🏷 TAG</button>
          <button class="btn btn-sm" onclick="crmBulkAction('optout')">⛔ OPT-OUT</button>
        </div>
      </div>
      <div id="crmTableWrap">${skeleton(6)}</div>
    </div>
  `,
  show(el) {
    el.querySelector('#crmSync').addEventListener('click', async () => {
      el.querySelector('#crmSync').disabled = true;
      const res = await api('crm.sync', {});
      showToast(res.message, res.success ? 'success' : 'error');
      el.querySelector('#crmSync').disabled = false;
      loadCrm(el);
    });
    el.querySelector('#crmCari').addEventListener('input', debounce(() => loadCrm(el), 350));
    el.querySelector('#crmSegmen').addEventListener('change', () => loadCrm(el));
    loadCrm(el);
    api('crm.stats', {}).then(r => { if (r.success) renderCrmKpi(el, r.data); });
  }
});

function renderCrmKpi(el, s) {
  el.querySelector('#crmKpi').innerHTML =
    kpi('Total Kontak', s.total) + kpi('WA Terverifikasi', s.waTerdaftar) + kpi('Email Valid', s.emailValid) + kpi('Opt-out', s.optOut);
}

async function loadCrm(el) {
  const res = await api('crm.list', { cari: el.querySelector('#crmCari').value, segmen: el.querySelector('#crmSegmen').value, per: 50 });
  if (!res.success) { el.querySelector('#crmTableWrap').innerHTML = emptyState(res.message); return; }
  window._crmRows = res.data.rows;
  el.querySelector('#crmTableWrap').innerHTML = res.data.rows.length ? `<div class="table-wrap"><table><thead><tr>
      <th><input type="checkbox" id="crmCheckAll"></th><th>Nama</th><th>Segmen</th><th>Email</th><th>WhatsApp</th><th>Tag</th><th></th>
    </tr></thead><tbody>
      ${res.data.rows.map(k => `<tr>
        <td><input type="checkbox" class="crmChk" value="${k.KontakID}"></td>
        <td>${esc(k.Nama)}</td>
        <td><span class="pill">${esc(k.Segmen)}</span></td>
        <td>${k.Email ? (k.EmailValid === 'YA' ? '✓ ' : '⚠ ') + esc(k.Email) : '-'}</td>
        <td class="mono">${esc(k.NoWA) || '-'} ${waBadge(k.StatusWA)}</td>
        <td>${esc(k.Tag) || '-'}</td>
        <td><button class="btn btn-sm" onclick="openCrmDetail('${k.KontakID}')">DETAIL</button></td>
      </tr>`).join('')}
    </tbody></table></div>` : emptyState('Belum ada kontak. Klik "Sinkron Sekarang".');

  el.querySelector('#crmCheckAll')?.addEventListener('change', (e) => {
    el.querySelectorAll('.crmChk').forEach(c => c.checked = e.target.checked);
    toggleCrmBulk(el);
  });
  el.querySelectorAll('.crmChk').forEach(c => c.addEventListener('change', () => toggleCrmBulk(el)));
}
function toggleCrmBulk(el) {
  const any = [...el.querySelectorAll('.crmChk')].some(c => c.checked);
  el.querySelector('#crmBulkActions').style.display = any ? 'flex' : 'none';
}
async function crmBulkAction(aksi) {
  const ids = [...document.querySelectorAll('.crmChk:checked')].map(c => c.value);
  if (!ids.length) return;
  let nilai = '';
  if (aksi === 'tag') { nilai = prompt('Masukkan tag:'); if (nilai == null) return; }
  const res = await api('crm.bulk', { ids, aksi, nilai });
  showToast(res.message, res.success ? 'success' : 'error');
  route();
}
async function openCrmDetail(id) {
  const res = await api('crm.detail', { kontakId: id });
  if (!res.success) return showToast(res.message, 'error');
  const k = res.data.kontak;
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>${esc(k.Nama)}</h3>
    <p class="muted">${esc(k.Segmen)} · ${esc(k.Sumber)}:${esc(k.RefID)}</p>
    <div class="card-flat" style="margin:10px 0;">
      <div>📧 ${esc(k.Email) || '-'}</div>
      <div>📱 ${esc(k.NoWA) || '-'} ${waBadge(k.StatusWA)}</div>
      <div>Tag: ${esc(k.Tag) || '-'} · Opt-out: ${k.OptOut}</div>
      <div>Jumlah pesan terkirim: ${k.JumlahPesan || 0}</div>
    </div>
    <h4 style="margin-bottom:6px;">Riwayat Interaksi</h4>
    <div style="max-height:200px;overflow-y:auto;">
      ${res.data.interaksi.map(i => `<div class="muted" style="margin-bottom:4px;">${fmtDateTime(i.Tanggal)} · ${esc(i.Kanal)}: ${esc(i.Ringkasan)}</div>`).join('') || '<div class="muted">Belum ada interaksi.</div>'}
    </div>
    <label class="field" style="margin-top:10px;"><span>Catat interaksi baru</span><textarea id="crmInteraksiText" placeholder="cth: Dihubungi via telepon mengenai..."></textarea></label>
    <button class="btn btn-primary btn-block" onclick="simpanInteraksi('${id}')">SIMPAN CATATAN</button>
  `);
}
async function simpanInteraksi(id) {
  const ringkasan = document.getElementById('crmInteraksiText').value;
  if (!ringkasan.trim()) return;
  const res = await api('crm.interaksi', { kontakId: id, ringkasan, kanal: 'Catatan' });
  if (res.success) { showToast(res.message); closeModal(); } else showToast(res.message, 'error');
}
