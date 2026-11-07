// ============================================================
// ui.js — helper tampilan umum
// ============================================================

function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type === 'error' ? ' error' : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3200);
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmtDate(s) { if (!s) return '-'; const [y, m, d] = String(s).split('-'); return d && m && y ? `${d}/${m}/${y}` : s; }
function fmtDateTime(s) { if (!s) return '-'; try { const d = new Date(s); return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return s; } }

function kpi(label, value, sub, pct) {
  return `<div class="kpi-card">
    <div class="kpi-label">${esc(label)}</div>
    <div class="kpi-value">${value}</div>
    ${sub ? `<div class="kpi-sub">${esc(sub)}</div>` : ''}
    ${pct != null ? `<div class="progress"><div style="width:${Math.min(100, Math.max(0, pct))}%"></div></div>` : ''}
  </div>`;
}

function statusPill(status) {
  const map = {
    'Hadir': 'pill-solid', 'Disetujui': 'pill-solid', 'Tuntas': 'pill-solid', 'Terkirim': 'pill-solid',
    'Menunggu Approval': 'pill-warn', 'Antri': 'pill-warn', 'Perlu Remedial': 'pill-warn',
    'Alpa': 'pill-outline', 'Revisi': 'pill-error', 'Gagal': 'pill-error', 'Error': 'pill-error'
  };
  const cls = map[status] || 'pill';
  return `<span class="pill ${cls}">${esc(status)}</span>`;
}

function waBadge(status) {
  if (status === 'Terdaftar') return `<span class="badge-wa-ya">✓ WA</span>`;
  if (status === 'Tidak Terdaftar') return `<span class="badge-wa-tidak">✕ bukan WA</span>`;
  return `<span class="badge-wa-cek">? belum dicek</span>`;
}

function skeleton(rows = 3) {
  return `<div class="card">${Array.from({ length: rows }).map(() => `<div class="skeleton" style="margin-bottom:8px;width:${60 + Math.random() * 35}%"></div>`).join('')}</div>`;
}

function emptyState(text) { return `<div class="empty-state">${esc(text)}</div>`; }

function openModal(html) {
  const back = document.createElement('div');
  back.className = 'modal-backdrop';
  back.id = 'activeModal';
  back.innerHTML = `<div class="modal">${html}</div>`;
  back.addEventListener('click', e => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
  return back;
}
function closeModal() { const m = document.getElementById('activeModal'); if (m) m.remove(); }

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// ------------------------------------------------------------
// Cetak dengan kop surat sekolah (logo + nama + alamat + semester)
// ------------------------------------------------------------
function getPengaturanCache() {
  const c = Store.get(userKey('pengaturan'));
  return (c && c.data) || {};
}

function cetakDenganKop(judul, kontenHtml) {
  const p = getPengaturanCache();
  const w = window.open('', '_blank');
  if (!w) { showToast('Mohon izinkan pop-up untuk mencetak.', 'error'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(judul)}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#111;}
      .kop{display:flex;align-items:center;gap:16px;border-bottom:3px solid #111;padding-bottom:14px;margin-bottom:18px;}
      .kop img{height:64px;width:64px;object-fit:contain;}
      .kop h1{font-size:18px;margin:0;}
      .kop p{font-size:12px;margin:2px 0 0;color:#444;}
      h2{font-size:15px;margin:18px 0 10px;}
      table{width:100%;border-collapse:collapse;font-size:12px;}
      th,td{border:1px solid #999;padding:6px 8px;text-align:left;}
      th{background:#eee;}
      .ttd{margin-top:50px;display:flex;justify-content:flex-end;}
      .ttd div{text-align:center;width:220px;}
      .ttd .garis{margin-top:60px;border-top:1px solid #111;}
      @media print{ .no-print{display:none;} }
    </style></head><body>
    <div class="kop">
      ${p.logoUrl ? `<img src="${esc(p.logoUrl)}">` : ''}
      <div>
        <h1>${esc(p.namaSekolah || 'Nama Sekolah')}</h1>
        <p>${esc(p.alamat || '')}</p>
        <p>Semester ${esc(p.semester || '')} — Tahun Ajaran ${esc(p.tahunAjaran || '')}</p>
      </div>
    </div>
    <h2>${esc(judul)}</h2>
    ${kontenHtml}
    <script>window.onload = function(){ window.print(); };<\/script>
    </body></html>`);
  w.document.close();
}

function selectOptions(list, valueKey, labelKey, selected) {
  return list.map(o => `<option value="${esc(o[valueKey])}" ${String(o[valueKey]) === String(selected) ? 'selected' : ''}>${esc(o[labelKey])}</option>`).join('');
}