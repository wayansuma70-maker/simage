// ============================================================
// pages/nilai.js — Input & Rekapitulasi Nilai Siswa (PRD §5.4)
// ============================================================
registerPage('nilai', {
  title: 'Nilai',
  template: () => `
    <h2>Input & Rekapitulasi Nilai Siswa</h2>
    <p class="muted">Nilai asesmen sumatif per tujuan pembelajaran, tugas harian, dan ujian semester.</p>
    <div class="card">
      <div class="field-row">
        <label class="field"><span>Kelas</span><select id="nilKelas"></select></label>
        <label class="field"><span>Mapel</span><select id="nilMapel"></select></label>
        <label class="field"><span>Jenis Penilaian</span>
          <select id="nilJenis">
            <option value="Harian">Harian</option>
            <option value="Tugas">Tugas</option>
            <option value="UTS">UTS</option>
            <option value="UAS">UAS</option>
          </select>
        </label>
        <div class="field" style="justify-content:flex-end;"><span>&nbsp;</span><button class="btn" id="nilMuat">MUAT DATA</button></div>
      </div>
    </div>
    <div id="nilBody"></div>
  `,
  show(el) {
    const boot = Store.get(userKey('boot'));
    const kelas = boot ? boot.data.boot.kelasDiampu : [];
    const mapel = boot ? boot.data.boot.mapel : [];
    el.querySelector('#nilKelas').innerHTML = selectOptions(kelas, 'id', 'nama');
    el.querySelector('#nilMapel').innerHTML = selectOptions(mapel, 'ID_Mapel', 'NamaMapel');
    el.querySelector('#nilMuat').addEventListener('click', () => loadNilai(el));
    loadNilai(el);
  }
});

async function loadNilai(el) {
  const kelas = el.querySelector('#nilKelas').value;
  const mapel = el.querySelector('#nilMapel').value;
  const jenis = el.querySelector('#nilJenis').value;
  if (!kelas || !mapel) return;
  el.querySelector('#nilBody').innerHTML = skeleton(5);
  const res = await api('nilai.get', { kelas, mapel, jenis });
  if (!res.success) { el.querySelector('#nilBody').innerHTML = emptyState(res.message); return; }
  renderNilai(el, res.data, { kelas, mapel, jenis });
}

async function hapusNilai(id) {
  if (!confirm('Hapus nilai ini?')) return;
  const res = await api('nilai.hapus', { id });
  if (res.success) { showToast(res.message); route(); } else showToast(res.message, 'error');
}

function renderNilai(el, data, ctxVal) {
  const s = data.statistik;
  el.querySelector('#nilBody').innerHTML = `
    <div class="grid grid-4">
      ${kpi('Rata-rata Kelas', s.rata, 'KKM: ' + data.kkm)}
      ${kpi('Tuntas', s.tuntas + '/' + s.total, Math.round(s.tuntas / (s.total || 1) * 100) + '%')}
      ${kpi('Nilai Tertinggi', s.tertinggi)}
      ${kpi('Nilai Terendah', s.terendah)}
    </div>
    <div class="card">
      <div class="table-wrap"><table><thead><tr><th>#</th><th>Nama</th><th>NIS</th><th>Nilai (0–100)</th><th>Status</th><th></th></tr></thead>
      <tbody id="nilTbody">
        ${data.siswa.map((x, i) => `<tr data-id="${x.idSiswa}">
          <td class="mono">${String(i + 1).padStart(2, '0')}</td>
          <td>${esc(x.nama)}</td>
          <td class="mono">${esc(x.nis)}</td>
          <td><input type="number" min="0" max="100" class="nilai-input" style="width:90px;height:34px;border:1px solid var(--c-highest);padding:0 8px;" value="${x.nilai ?? ''}"></td>
          <td class="status-cell">${statusPill(x.status)}</td>
          <td>${x.idNilai ? `<button class="btn btn-sm btn-danger" onclick="hapusNilai('${x.idNilai}')">HAPUS</button>` : ''}</td>
        </tr>`).join('')}
      </tbody></table></div>
      <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:10px;">
        <button class="btn" id="nilCetak">🖨 CETAK NILAI</button>
        <button class="btn btn-primary" id="nilSimpan">SIMPAN & KIRIM KE LEDGER NILAI</button>
      </div>
    </div>`;

  el.querySelector('#nilCetak').addEventListener('click', () => {
    const html = `<p>Jenis Penilaian: ${esc(ctxVal.jenis)} — KKM: ${data.kkm}</p>
      <table><thead><tr><th>No</th><th>Nama</th><th>NIS</th><th>Nilai</th><th>Status</th></tr></thead><tbody>
      ${data.siswa.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.nama)}</td><td>${esc(x.nis)}</td><td>${x.nilai ?? '-'}</td><td>${esc(x.status)}</td></tr>`).join('')}
      </tbody></table>`;
    cetakDenganKop('Daftar Nilai Siswa', html);
  });

  el.querySelectorAll('.nilai-input').forEach(inp => inp.addEventListener('input', () => {
    const tr = inp.closest('tr');
    const v = Number(inp.value);
    const cell = tr.querySelector('.status-cell');
    if (inp.value === '') cell.innerHTML = statusPill('-');
    else if (v < 0 || v > 100) cell.innerHTML = statusPill('Error');
    else cell.innerHTML = statusPill(v >= data.kkm ? 'Tuntas' : 'Perlu Remedial');
  }));

  el.querySelector('#nilSimpan').addEventListener('click', async () => {
    const rows = [];
    el.querySelectorAll('#nilTbody tr').forEach(tr => {
      const v = tr.querySelector('.nilai-input').value;
      rows.push({ idSiswa: tr.dataset.id, nilai: v === '' ? null : Number(v) });
    });
    const btn = el.querySelector('#nilSimpan'); btn.disabled = true; btn.textContent = 'MENYIMPAN...';
    const res = await api('nilai.save', { kelas: ctxVal.kelas, mapel: ctxVal.mapel, jenis: ctxVal.jenis, data: rows });
    btn.disabled = false; btn.textContent = 'SIMPAN & KIRIM KE LEDGER NILAI';
    if (res.success) { showToast(res.message); loadNilai(el.closest('.page')); } else showToast(res.message, 'error');
  });
}