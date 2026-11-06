// ============================================================
// pages/beranda.js — Dashboard ringkasan (PRD §5.1)
// ============================================================
registerPage('beranda', {
  title: 'Beranda',
  template: () => `
    <div class="card" style="background:var(--ink);color:var(--on-primary);border:none;">
      <h2 id="berandaSapaan" style="color:var(--on-primary)">Selamat datang!</h2>
      <p class="muted" id="berandaSub" style="color:#ddd;">Memuat ringkasan hari ini…</p>
    </div>
    <div class="grid grid-4" id="berandaKpi">${skeleton(1)}${skeleton(1)}${skeleton(1)}${skeleton(1)}</div>
    <div class="grid grid-2" style="margin-top:4px;">
      <div class="card">
        <h3 style="margin-bottom:10px;">Kelas yang Diampu</h3>
        <div id="berandaKelas">${skeleton(3)}</div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:10px;">Agenda Menunggu Approval</h3>
        <div id="berandaAgenda">${skeleton(3)}</div>
      </div>
    </div>
  `,
  show(el) {
    const isSup = ['Kepsek', 'Wakasek', 'Admin'].includes(AppState.peran);
    el.querySelector('#berandaSapaan').textContent = 'Selamat datang, ' + AppState.nama + '!';
    el.querySelector('#berandaSub').textContent = isSup
      ? 'Pantau validasi jurnal & kehadiran seluruh sekolah hari ini.'
      : 'Berikut ringkasan KBM Anda hari ini.';

    swr('boot', 'auth.me', {}, (data) => renderBeranda(el, data), { fresh: 60000 });
  }
});

function renderBeranda(el, boot) {
  if (!boot) return;
  const r = boot.boot.ringkasan;
  el.querySelector('#berandaKpi').innerHTML =
    kpi('Kelas Diampu', r.totalKelas, 'Total siswa: ' + r.totalSiswa) +
    kpi('Jurnal Terisi Hari Ini', r.jurnalTerisiHariIni, 'Tanggal ' + fmtDate(boot.boot.tanggal)) +
    kpi('Rerata Kehadiran', r.rataKehadiran + '%', 'Hari ini', r.rataKehadiran) +
    kpi('Menunggu Approval', r.menungguApproval, r.menungguApproval > 0 ? 'Perlu tindak lanjut' : 'Semua beres');

  el.querySelector('#berandaKelas').innerHTML = boot.boot.kelasDiampu.length
    ? boot.boot.kelasDiampu.map(k => `
      <div class="card-flat" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <b>${esc(k.nama)}</b><span class="label-sm">${k.jumlahSiswa} SISWA</span>
        </div>
        <div class="muted" style="margin-top:4px;">Progres jurnal pengajaran</div>
        <div class="progress"><div style="width:${k.progresJurnal}%"></div></div>
        <div class="label-sm" style="margin-top:4px;">${k.progresJurnal}%</div>
      </div>`).join('')
    : emptyState('Belum ada kelas yang diampu.');

  el.querySelector('#berandaAgenda').innerHTML = boot.boot.agendaMenunggu.length
    ? `<div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Kelas</th><th>Materi</th><th>Status</th></tr></thead><tbody>
        ${boot.boot.agendaMenunggu.map(j => `<tr><td class="mono">${fmtDate(j.Tanggal)}</td><td>${esc(j.ID_Kelas)}</td><td>${esc((j.Materi || '').slice(0, 40))}</td><td>${statusPill(j.StatusApproval)}</td></tr>`).join('')}
      </tbody></table></div>`
    : emptyState('Tidak ada agenda menunggu approval.');
}
