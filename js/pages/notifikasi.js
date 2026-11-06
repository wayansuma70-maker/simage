// ============================================================
// pages/notifikasi.js — WhatsApp (Fonnte) & Email, Blast, Antrean, Config
// ============================================================
registerPage('notifikasi', {
  title: 'WhatsApp & Notifikasi',
  roles: ['Admin', 'Kepsek', 'Wakasek'],
  template: () => `
    <h2>WhatsApp & Notifikasi</h2>
    <div class="tabs" id="notifTabs">
      <button data-t="blast" class="active">📣 BLAST WHATSAPP</button>
      <button data-t="antrean">📬 ANTREAN & RIWAYAT</button>
      ${AppState.peran === 'Admin' ? '<button data-t="config">⚙️ KONFIGURASI</button>' : ''}
    </div>
    <div id="notifBody"></div>
  `,
  show(el) {
    let tab = 'blast';
    const render = () => renderNotifTab(el, tab);
    el.querySelectorAll('#notifTabs button').forEach(b => b.addEventListener('click', () => {
      el.querySelectorAll('#notifTabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); tab = b.dataset.t; render();
    }));
    render();
  }
});

function renderNotifTab(el, tab) {
  if (tab === 'blast') return renderBlastTab(el);
  if (tab === 'antrean') return renderAntreanTab(el);
  if (tab === 'config') return renderConfigTab(el);
}

// ---------------- TAB 1: BLAST ----------------
function renderBlastTab(el) {
  el.querySelector('#notifBody').innerHTML = `
    <div class="grid grid-2">
      <div class="card">
        <h3 style="margin-bottom:10px;">1. Pilih Sasaran</h3>
        <div class="field-row">
          <select class="field" id="blSegmen" style="height:36px;"><option value="">Semua Segmen</option><option>Guru</option><option>Wali Siswa</option></select>
          <button class="btn btn-sm" id="blMuat">👥 MUAT PENERIMA</button>
          <button class="btn btn-sm" id="blDeteksi">📱 DETEKSI WA</button>
        </div>
        <div id="blRingkas" class="muted" style="margin:10px 0;">Belum ada penerima dimuat.</div>
        <div class="table-wrap" style="max-height:300px;overflow-y:auto;"><table><thead><tr><th><input type="checkbox" id="blCheckAll"></th><th>Nama</th><th>Nomor</th><th>WA</th></tr></thead><tbody id="blTbody"></tbody></table></div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:10px;">2. Tulis Pesan</h3>
        <label class="field"><span>Judul Internal</span><input id="blJudul" placeholder="cth: Pengumuman Rapor"></label>
        <label class="field"><span>Pesan (gunakan {nama} untuk nama penerima)</span><textarea id="blPesan" placeholder="Assalamu'alaikum {nama}, ..."></textarea></label>
        <h3 style="margin:14px 0 6px;">3. Ukuran Batch & Jeda</h3>
        <div class="field-row">
          <select class="field" id="blBatch" style="height:36px;"><option value="10">10</option><option value="20" selected>20</option><option value="50">50</option></select>
          <label class="field"><span>Jeda (detik)</span><input id="blJeda" value="5" style="width:70px;"></label>
        </div>
        <button class="btn btn-primary btn-block" id="blMulai" style="margin-top:14px;">🚀 MULAI BLAST</button>
      </div>
    </div>
    <div class="card"><h3 style="margin-bottom:10px;">Riwayat Blast</h3><div id="blRiwayat">${skeleton(3)}</div></div>
  `;
  let penerima = [];
  el.querySelector('#blMuat').addEventListener('click', async () => {
    const res = await api('wa.audience', { segmen: el.querySelector('#blSegmen').value });
    if (!res.success) return showToast(res.message, 'error');
    penerima = res.data.rows;
    el.querySelector('#blRingkas').innerHTML = `Total <b>${res.data.ringkas.total}</b> · Valid <b>${res.data.ringkas.valid}</b> · Tidak valid <b>${res.data.ringkas.tidakValid}</b> · Ganda <b>${res.data.ringkas.ganda}</b> · Terdaftar WA <b>${res.data.ringkas.terdaftarWA}</b>`;
    el.querySelector('#blTbody').innerHTML = penerima.map(p => `<tr style="${!p.valid || p.ganda ? 'opacity:.5' : ''}"><td><input type="checkbox" class="blChk" value="${p.id}" ${p.valid && !p.ganda ? 'checked' : ''}></td><td>${esc(p.nama)}</td><td class="mono">${esc(p.hp)}</td><td>${waBadge(p.statusWA === 'belum dicek' ? '' : p.statusWA)}</td></tr>`).join('');
  });
  el.querySelector('#blCheckAll').addEventListener('change', (e) => el.querySelectorAll('.blChk').forEach(c => c.checked = e.target.checked));
  el.querySelector('#blDeteksi').addEventListener('click', async () => {
    if (!penerima.length) return showToast('Muat penerima terlebih dahulu.', 'error');
    showToast('Memeriksa nomor WhatsApp...');
    const res = await api('wa.validate', { nomor: penerima.slice(0, 50).map(p => p.hp) });
    if (res.success) { showToast(res.data.dicek + ' nomor diperiksa.'); el.querySelector('#blMuat').click(); } else showToast(res.message, 'error');
  });
  el.querySelector('#blMulai').addEventListener('click', async () => {
    const terpilih = [...el.querySelectorAll('.blChk:checked')].map(c => c.value);
    const list = penerima.filter(p => terpilih.includes(p.id)).map(p => ({ nama: p.nama, hp: p.hp }));
    if (!list.length) return showToast('Pilih minimal 1 penerima.', 'error');
    if (!el.querySelector('#blPesan').value.trim()) return showToast('Isi pesan terlebih dahulu.', 'error');
    const btn = el.querySelector('#blMulai'); btn.disabled = true; btn.textContent = 'MEMBUAT BLAST...';
    const res = await api('wa.blastCreate', {
      judul: el.querySelector('#blJudul').value, pesan: el.querySelector('#blPesan').value,
      ukuranBatch: Number(el.querySelector('#blBatch').value), jeda: el.querySelector('#blJeda').value, penerima: list
    });
    btn.disabled = false; btn.textContent = '🚀 MULAI BLAST';
    if (res.success) { showToast(res.message); loadBlastRiwayat(el); } else showToast(res.message, 'error');
  });
  loadBlastRiwayat(el);
}

async function loadBlastRiwayat(el) {
  const res = await api('wa.blastList', {});
  if (!res.success) { el.querySelector('#blRiwayat').innerHTML = emptyState(res.message); return; }
  const rows = res.data;
  el.querySelector('#blRiwayat').innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>Judul</th><th>Total</th><th>Terkirim</th><th>Gagal</th><th>Status</th><th></th></tr></thead><tbody>
    ${rows.map(b => `<tr><td>${esc(b.Judul)}</td><td>${b.Total}</td><td>${b.Terkirim}</td><td>${b.Gagal}</td><td>${statusPill(b.Status)}</td>
      <td>${b.Status === 'Berjalan' ? `<button class="btn btn-sm" onclick="prosesBlast('${b.BlastID}')">▶ PROSES</button> <button class="btn btn-sm btn-ghost" onclick="stopBlast('${b.BlastID}')">⏹</button>` : ''}</td></tr>`).join('')}
    </tbody></table></div>` : emptyState('Belum ada blast.');
}
async function prosesBlast(id) { const res = await api('wa.blastProcess', { blastId: id }); showToast(res.message); route(); }
async function stopBlast(id) { const res = await api('wa.blastStop', { blastId: id }); showToast(res.message); route(); }

// ---------------- TAB 2: ANTREAN ----------------
function renderAntreanTab(el) {
  el.querySelector('#notifBody').innerHTML = `<div id="antBody">${skeleton(5)}</div>`;
  loadAntrean(el);
}
async function loadAntrean(el) {
  const res = await api('notif.queue', {});
  if (!res.success) { el.querySelector('#antBody').innerHTML = emptyState(res.message); return; }
  const r = res.data.ringkasan;
  el.querySelector('#antBody').innerHTML = `
    <div class="grid grid-4">${kpi('Menunggu', r.menunggu)}${kpi('Terkirim', r.terkirim)}${kpi('Gagal', r.gagal)}${kpi('Dibatalkan', r.batal)}</div>
    <div class="card">
      <div class="toolbar"><button class="btn btn-sm" id="antProses">PROSES SEKARANG</button><button class="btn btn-sm" id="antRetry">ULANGI YANG GAGAL</button></div>
      <div class="table-wrap"><table><thead><tr><th>Waktu</th><th>Kanal</th><th>Tujuan</th><th>Event</th><th>Status</th></tr></thead><tbody>
        ${res.data.rows.map(a => `<tr><td class="mono">${fmtDateTime(a.DibuatPada)}</td><td class="mono">${a.Kanal}</td><td class="mono">${esc(a.Tujuan)}</td><td>${esc(a.Event)}</td><td>${statusPill(a.Status)}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
  el.querySelector('#antProses').addEventListener('click', async () => { const r2 = await api('notif.processNow', {}); showToast(r2.message); loadAntrean(el); });
  el.querySelector('#antRetry').addEventListener('click', async () => { const r2 = await api('notif.retry', {}); showToast(r2.message); loadAntrean(el); });
}

// ---------------- TAB 3: KONFIGURASI ----------------
async function renderConfigTab(el) {
  el.querySelector('#notifBody').innerHTML = skeleton(8);
  const res = await api('notif.config', {});
  if (!res.success) { el.querySelector('#notifBody').innerHTML = emptyState(res.message); return; }
  const c = res.data;
  el.querySelector('#notifBody').innerHTML = `
    <div class="grid grid-2">
      <div class="card">
        <h3>WhatsApp (Fonnte)</h3>
        <div class="field-row" style="margin-top:10px;align-items:center;">
          <label class="switch"><input type="checkbox" id="cfgWaAktif" ${c.waAktif ? 'checked' : ''}><span class="slider"></span></label>
          <span>Notifikasi WhatsApp Aktif</span>
        </div>
        <label class="field" style="margin-top:10px;"><span>Token Fonnte ${c.tokenMask ? '(' + c.tokenMask + ')' : ''}</span><input type="password" id="cfgToken" placeholder="Kosongkan jika tidak diubah"></label>
        <div class="field-row" style="margin-top:10px;">
          <button class="btn btn-sm" id="cfgCekDevice">📡 CEK PERANGKAT</button>
          <input class="field" id="cfgNomorTes" placeholder="08xxxx" style="height:34px;">
          <button class="btn btn-sm" id="cfgKirimTes">KIRIM TES WA</button>
        </div>
        <div id="cfgDeviceInfo" class="muted" style="margin-top:8px;"></div>
      </div>
      <div class="card">
        <h3>Email</h3>
        <div class="field-row" style="margin-top:10px;align-items:center;">
          <label class="switch"><input type="checkbox" id="cfgEmailAktif" ${c.emailAktif ? 'checked' : ''}><span class="slider"></span></label>
          <span>Notifikasi Email Aktif</span>
        </div>
        <p class="muted" style="margin-top:8px;">Sisa kuota hari ini: <b>${c.kuotaEmailTersisa}</b></p>
        <label class="field"><span>Nama Pengirim</span><input id="cfgNamaPengirim" value="${esc(c.namaPengirim)}"></label>
        <label class="field"><span>URL Aplikasi (untuk {link})</span><input id="cfgAppUrl" value="${esc(c.appUrl)}"></label>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-bottom:10px;">Matriks Notifikasi Otomatis</h3>
      <div class="table-wrap"><table><thead><tr><th>Event</th><th>WA</th><th>Email</th></tr></thead><tbody>
        ${Object.values(c.matriks).map(m => `<tr><td>${esc(m.label)}<div class="label-sm">${m.kode}</div></td>
          <td><label class="switch"><input type="checkbox" class="mtxWa" data-k="${m.kode}" ${m.wa ? 'checked' : ''}><span class="slider"></span></label></td>
          <td><label class="switch"><input type="checkbox" class="mtxEmail" data-k="${m.kode}" ${m.email ? 'checked' : ''}><span class="slider"></span></label></td>
        </tr>`).join('')}
      </tbody></table></div>
      <button class="btn btn-primary" id="cfgSimpan" style="margin-top:14px;">💾 SIMPAN KONFIGURASI</button>
    </div>`;

  el.querySelector('#cfgCekDevice').addEventListener('click', async () => {
    const r = await api('wa.device', {});
    el.querySelector('#cfgDeviceInfo').textContent = r.success ? JSON.stringify(r.data) : r.message;
  });
  el.querySelector('#cfgKirimTes').addEventListener('click', async () => {
    const r = await api('wa.test', { nomor: el.querySelector('#cfgNomorTes').value });
    showToast(r.message, r.success ? 'success' : 'error');
  });
  el.querySelector('#cfgSimpan').addEventListener('click', async () => {
    const matriks = {};
    Object.keys(c.matriks).forEach(k => {
      matriks[k] = { wa: el.querySelector(`.mtxWa[data-k="${k}"]`).checked, email: el.querySelector(`.mtxEmail[data-k="${k}"]`).checked };
    });
    const res2 = await api('notif.configSave', {
      waAktif: el.querySelector('#cfgWaAktif').checked, emailAktif: el.querySelector('#cfgEmailAktif').checked,
      token: el.querySelector('#cfgToken').value, namaPengirim: el.querySelector('#cfgNamaPengirim').value,
      appUrl: el.querySelector('#cfgAppUrl').value, matriks
    });
    showToast(res2.message, res2.success ? 'success' : 'error');
  });
}
