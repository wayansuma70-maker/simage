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

function selectOptions(list, valueKey, labelKey, selected) {
  return list.map(o => `<option value="${esc(o[valueKey])}" ${String(o[valueKey]) === String(selected) ? 'selected' : ''}>${esc(o[labelKey])}</option>`).join('');
}
