// ============================================================
// pages/jurnal.js — Jurnal Pembelajaran Harian (PRD §5.2)
// ============================================================
registerPage('jurnal', {
  title: 'Jurnal KBM',
  template: () => `
    <div class="toolbar">
      <h2 style="flex:1;">Jurnal Pembelajaran Harian</h2>
      <select class="field" id="jurnalFilterStatus" style="height:38px;">
        <option value="">Semua Status</option>
        <option value="Menunggu Approval">Menunggu Approval</option>
        <option value="Disetujui">Disetujui</option>
        <option value="Revisi">Revisi</option>
      </select>
      <button class="btn btn-primary" id="jurnalTambahBtn">+ TAMBAH JURNAL</button>
    </div>
    <div id="jurnalList">${skeleton(5)}</div>
  `,
  show(el) {
    const isSup = ['Kepsek', 'Wakasek', 'Admin'].includes(AppState.peran);
    el.querySelector('#jurnalTambahBtn').hidden = isSup;
    el.querySelector('#jurnalFilterStatus').addEventListener('change', () => loadJurnal(el));
    el.querySelector('#jurnalTambahBtn').addEventListener('click', () => openJurnalForm());
    loadJurnal(el);
  }
});

function loadJurnal(el) {
  const status = el.querySelector('#jurnalFilterStatus').value;
  swr('jurnal:' + status, 'jurnal.list', { status }, (rows) => renderJurnalList(el, rows), { fresh: 20000 });
}

function renderJurnalList(el, rows) {
  const isSup = ['Kepsek', 'Wakasek', 'Admin'].includes(AppState.peran);
  if (!rows || !rows.length) { el.querySelector('#jurnalList').innerHTML = emptyState('Belum ada data jurnal.'); return; }
  el.querySelector('#jurnalList').innerHTML = `<div class="table-wrap"><table><thead><tr>
      <th>Tanggal</th><th>Guru</th><th>Kelas</th><th>Mapel</th><th>Jam</th><th>Materi</th><th>Status</th><th></th>
    </tr></thead><tbody>
      ${rows.map(j => `<tr>
        <td class="mono">${fmtDate(j.Tanggal)}</td>
        <td>${esc(j.NamaGuru)}</td>
        <td>${esc(j.NamaKelas)}</td>
        <td>${esc(j.NamaMapel)}</td>
        <td class="mono">${esc(j.JamKe)}</td>
        <td>${esc((j.Materi || '').slice(0, 50))} ${j.FotoURL ? '📷' : ''}</td>
        <td>${statusPill(j.StatusApproval)}</td>
        <td>${isSup && j.StatusApproval === 'Menunggu Approval' ? `<button class="btn btn-sm" onclick="openJurnalApprove('${j.ID_Jurnal}')">PERIKSA</button>` : `<button class="btn btn-sm btn-ghost" onclick="openJurnalDetail('${j.ID_Jurnal}')">DETAIL</button>`}</td>
      </tr>`).join('')}
    </tbody></table></div>`;
  window._jurnalCache = rows;
}

function openJurnalDetail(id) {
  const j = (window._jurnalCache || []).find(x => x.ID_Jurnal === id);
  if (!j) return;
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>Detail Jurnal</h3>
    <p class="muted">${fmtDate(j.Tanggal)} · ${esc(j.NamaKelas)} · Jam ke-${esc(j.JamKe)}</p>
    <div class="card-flat" style="margin-top:10px;"><b>Materi:</b> ${esc(j.Materi)}<br><b>Metode:</b> ${esc(j.Metode) || '-'}</div>
    <p style="margin-top:10px;">Status: ${statusPill(j.StatusApproval)}</p>
    ${j.CatatanKepsek ? `<p class="muted">Catatan Kepsek: ${esc(j.CatatanKepsek)}</p>` : ''}
    ${j.FotoURL ? `<div style="margin-top:10px;"><div class="label-sm" style="margin-bottom:4px;">FOTO KEGIATAN KBM</div><img src="${esc(j.FotoURL)}" style="max-width:100%;border-radius:10px;border:1px solid var(--c-high);"></div>` : ''}
  `);
}

function openJurnalApprove(id) {
  const j = (window._jurnalCache || []).find(x => x.ID_Jurnal === id);
  if (!j) return;
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>Approval Jurnal</h3>
    <p class="muted">${esc(j.NamaGuru)} · ${fmtDate(j.Tanggal)} · ${esc(j.NamaKelas)} · ${esc(j.NamaMapel)}</p>
    <div class="card-flat" style="margin:10px 0;">${esc(j.Materi)}</div>
    <label class="field"><span>Catatan Evaluasi (opsional)</span><textarea id="apprCatatan"></textarea></label>
    <div class="field-row" style="margin-top:14px;justify-content:flex-end;">
      <button class="btn" onclick="submitApprove('${id}','Revisi')">KEMBALIKAN UNTUK REVISI</button>
      <button class="btn btn-primary" onclick="submitApprove('${id}','Disetujui')">SETUJUI</button>
    </div>
  `);
}

async function submitApprove(id, status) {
  const catatan = document.getElementById('apprCatatan').value;
  const res = await api('jurnal.approve', { id, status, catatan });
  if (res.success) { showToast(res.message); closeModal(); Store.del(userKey('jurnal:')); route(); }
  else showToast(res.message, 'error');
}

function openJurnalForm() {
  const boot = Store.get(userKey('boot'));
  const kelas = boot ? boot.data.boot.kelasDiampu : [];
  const mapel = boot ? boot.data.boot.mapel : [];
  openModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>Tambah Jurnal Harian</h3>
    <form id="jurnalForm" style="margin-top:12px;display:flex;flex-direction:column;gap:12px;">
      <div class="field-row">
        <label class="field" style="flex:1;"><span>Tanggal *</span><input type="date" id="jTanggal" required max="${todayISO()}"></label>
        <label class="field" style="flex:1;"><span>Jam Ke *</span><input id="jJam" required placeholder="1-2"></label>
      </div>
      <div class="field-row">
        <label class="field" style="flex:1;"><span>Kelas *</span><select id="jKelas" required>${selectOptions(kelas, 'id', 'nama')}</select></label>
        <label class="field" style="flex:1;"><span>Mapel *</span><select id="jMapel" required>${selectOptions(mapel, 'ID_Mapel', 'NamaMapel')}</select></label>
      </div>
      <label class="field"><span>Materi Pokok & Aktivitas KBM *</span><textarea id="jMateri" required></textarea></label>
      <label class="field"><span>Metode/Model Pembelajaran</span><input id="jMetode"></label>
      <label class="field"><span>Catatan Khusus (opsional)</span><textarea id="jCatatan"></textarea></label>
      <label class="field"><span>📷 Foto Kegiatan KBM (opsional, maks 5MB)</span>
        <input type="file" id="jFoto" accept="image/*" capture="environment">
      </label>
      <div id="jFotoPreview"></div>
      <button type="submit" class="btn btn-primary btn-block">KIRIM UNTUK APPROVAL</button>
    </form>
  `);
  document.getElementById('jFoto').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const prev = document.getElementById('jFotoPreview');
    if (!file) { prev.innerHTML = ''; return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Ukuran foto maksimal 5MB.', 'error'); e.target.value = ''; prev.innerHTML = ''; return; }
    prev.innerHTML = `<img src="${URL.createObjectURL(file)}" style="max-width:100%;max-height:160px;border-radius:10px;border:1px solid var(--c-high);margin-top:4px;">`;
  });
  document.getElementById('jurnalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = 'MENGIRIM...';
    const payload = {
      tanggal: document.getElementById('jTanggal').value,
      jamKe: document.getElementById('jJam').value,
      kelas: document.getElementById('jKelas').value,
      mapel: document.getElementById('jMapel').value,
      materi: document.getElementById('jMateri').value,
      metode: document.getElementById('jMetode').value,
      catatan: document.getElementById('jCatatan').value
    };
    const fotoFile = document.getElementById('jFoto').files[0];
    if (fotoFile) {
      btn.textContent = 'MENGUNGGAH FOTO...';
      try { payload.fotoBase64 = await fileToBase64(fotoFile); payload.fotoNama = fotoFile.name.replace(/\.[^.]+$/, ''); }
      catch (err) { showToast('Gagal membaca file foto.', 'error'); btn.disabled = false; btn.textContent = 'KIRIM UNTUK APPROVAL'; return; }
      btn.textContent = 'MENGIRIM...';
    }
    const res = await api('jurnal.save', payload);
    if (res.success) { showToast(res.message); closeModal(); route(); }
    else { showToast(res.message, 'error'); btn.disabled = false; btn.textContent = 'KIRIM UNTUK APPROVAL'; }
  });
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function todayISO() { return new Date().toISOString().slice(0, 10); }