// ============================================================
// pages/log.js — Log Audit & Riwayat Aktivitas (PRD §5.7)
// ============================================================
registerPage('log', {
  title: 'Log Aktivitas',
  roles: ['Admin', 'Kepsek', 'Wakasek'],
  template: () => `
    <h2>Log Audit & Riwayat Aktivitas</h2>
    <p class="muted">Setiap perubahan data tercatat untuk akuntabilitas.</p>
    <div id="logBody">${skeleton(8)}</div>
  `,
  show(el) {
    swr('log', 'log.list', {}, (rows) => renderLog(el, rows), { fresh: 10000 });
  }
});

function renderLog(el, rows) {
  if (!rows || !rows.length) { el.querySelector('#logBody').innerHTML = emptyState('Belum ada aktivitas tercatat.'); return; }
  el.querySelector('#logBody').innerHTML = `<div class="card"><div class="table-wrap"><table><thead><tr>
      <th>Waktu</th><th>Pengguna</th><th>Peran</th><th>Aksi</th><th>Target</th>
    </tr></thead><tbody>
      ${rows.map(r => `<tr><td class="mono">${fmtDateTime(r.Waktu)}</td><td>${esc(r.EmailPengguna || '-')}</td><td>${esc(r.Peran || '-')}</td><td class="mono">${esc(r.Aksi)}</td><td class="mono">${esc(r.Target || '-')}</td></tr>`).join('')}
    </tbody></table></div></div>`;
}
