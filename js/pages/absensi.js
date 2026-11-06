// ============================================================
// pages/absensi.js — Presensi Siswa per Kelas (PRD §5.3)
// ============================================================
registerPage('absensi', {
  title: 'Absensi',
  template: () => `
    <h2>Presensi & Absensi Siswa</h2>
    <p class="muted">Verifikasi kehadiran peserta didik per jam tatap muka.</p>
    <div class="card">
      <div class="field-row">
        <label class="field"><span>Tanggal</span><input type="date" id="absTanggal" value="${todayISO()}" max="${todayISO()}"></label>
        <label class="field"><span>Kelas</span><select id="absKelas"></select></label>
        <label class="field"><span>Mapel</span><select id="absMapel"></select></label>
        <div class="field" style="justify-content:flex-end;"><span>&nbsp;</span><button class="btn" id="absMuat">MUAT DATA</button></div>
      </div>
    </div>
    <div id="absBody"></div>
  `,
  show(el) {
    const boot = Store.get(userKey('boot'));
    const kelas = boot ? boot.data.boot.kelasDiampu : [];
    const mapel = boot ? boot.data.boot.mapel : [];
    el.querySelector('#absKelas').innerHTML = selectOptions(kelas, 'id', 'nama');
    el.querySelector('#absMapel').innerHTML = selectOptions(mapel, 'ID_Mapel', 'NamaMapel');
    el.querySelector('#absMuat').addEventListener('click', () => loadAbsensi(el));
    loadAbsensi(el);
  }
});

async function loadAbsensi(el) {
  const tanggal = el.querySelector('#absTanggal').value;
  const kelas = el.querySelector('#absKelas').value;
  const mapel = el.querySelector('#absMapel').value;
  if (!kelas || !mapel) return;
  el.querySelector('#absBody').innerHTML = skeleton(5);
  const res = await api('absensi.get', { tanggal, kelas, mapel });
  if (!res.success) { el.querySelector('#absBody').innerHTML = emptyState(res.message); return; }
  renderAbsensi(el, res.data, { tanggal, kelas, mapel });
}

function renderAbsensi(el, data, ctxVal) {
  const siswa = data.siswa;
  const hadir = siswa.filter(s => s.status === 'Hadir').length;
  el.querySelector('#absBody').innerHTML = `
    <div class="grid grid-4">
      ${kpi('Total Siswa', siswa.length)}
      ${kpi('Hadir', hadir)}
      ${kpi('Tidak Hadir', siswa.length - hadir)}
      ${kpi('% Kehadiran', siswa.length ? Math.round(hadir / siswa.length * 1000) / 10 + '%' : '-')}
    </div>
    <div class="card">
      <div class="toolbar">
        <button class="btn" id="absTandaiSemua">✓ TANDAI SEMUA HADIR</button>
        <span class="muted" style="margin-left:auto;">${data.sudahDiisi ? 'Sudah pernah diisi — menyimpan akan memperbarui.' : 'Belum pernah diisi.'}</span>
      </div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>Nama</th><th>NIS</th><th>Status</th><th>Keterangan</th></tr></thead>
      <tbody id="absTbody">
        ${siswa.map((s, i) => `<tr data-id="${s.idSiswa}">
          <td class="mono">${String(i + 1).padStart(2, '0')}</td>
          <td>${esc(s.nama)}</td>
          <td class="mono">${esc(s.nis)}</td>
          <td>
            ${['Hadir', 'Sakit', 'Izin', 'Alpa'].map(st => `<button class="btn btn-sm status-opt ${s.status === st ? (st === 'Hadir' ? 'status-hadir' : st === 'Alpa' ? 'status-alpa' : 'status-neutral') : ''}" data-status="${st}" onclick="setAbsenStatus(this,'${s.idSiswa}')">${st.toUpperCase()}</button>`).join(' ')}
          </td>
          <td><input class="ket-input" style="height:30px;border:1px solid var(--c-highest);padding:0 8px;width:100%;" value="${esc(s.keterangan)}" placeholder="Catatan..."></td>
        </tr>`).join('')}
      </tbody></table></div>
      <div style="margin-top:14px;text-align:right;">
        <button class="btn btn-primary" id="absSimpan">KUNCI & SIMPAN PRESENSI</button>
      </div>
    </div>`;
  el.querySelector('#absBody')._state = siswa.reduce((a, s) => { a[s.idSiswa] = s.status; return a; }, {});

  el.querySelector('#absTandaiSemua').addEventListener('click', () => {
    el.querySelectorAll('#absTbody tr').forEach(tr => {
      const id = tr.dataset.id;
      el.querySelector('#absBody')._state[id] = 'Hadir';
      tr.querySelectorAll('.status-opt').forEach(b => b.className = 'btn btn-sm status-opt' + (b.dataset.status === 'Hadir' ? ' status-hadir' : ''));
    });
  });

  el.querySelector('#absSimpan').addEventListener('click', async () => {
    const state = el.querySelector('#absBody')._state;
    const rows = [];
    el.querySelectorAll('#absTbody tr').forEach(tr => {
      rows.push({ idSiswa: tr.dataset.id, status: state[tr.dataset.id] || 'Hadir', keterangan: tr.querySelector('.ket-input').value });
    });
    const btn = el.querySelector('#absSimpan'); btn.disabled = true; btn.textContent = 'MENYIMPAN...';
    const res = await api('absensi.save', { tanggal: ctxVal.tanggal, kelas: ctxVal.kelas, mapel: ctxVal.mapel, data: rows });
    btn.disabled = false; btn.textContent = 'KUNCI & SIMPAN PRESENSI';
    if (res.success) showToast(res.message); else showToast(res.message, 'error');
  });
}

function setAbsenStatus(btn, idSiswa) {
  const tr = btn.closest('tr');
  const body = document.getElementById('absBody');
  body._state[idSiswa] = btn.dataset.status;
  tr.querySelectorAll('.status-opt').forEach(b => {
    b.className = 'btn btn-sm status-opt' + (b.dataset.status === btn.dataset.status
      ? (btn.dataset.status === 'Hadir' ? ' status-hadir' : btn.dataset.status === 'Alpa' ? ' status-alpa' : ' status-neutral') : '');
  });
}
