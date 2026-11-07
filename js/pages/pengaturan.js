// ============================================================
// pages/pengaturan.js — Pengaturan Identitas Sekolah (khusus Admin)
// ============================================================
registerPage('pengaturan', {
  title: 'Pengaturan Sekolah',
  roles: ['Admin'],
  template: () => `
    <h2>Pengaturan Sekolah</h2>
    <p class="muted">Identitas sekolah ini dipakai di topbar aplikasi dan kop surat saat mencetak jurnal, absensi, dan nilai.</p>
    <div id="pengaturanBody">${skeleton(6)}</div>
  `,
  show(el) {
    loadPengaturan(el);
  }
});

async function loadPengaturan(el) {
  const res = await api('pengaturan.get', {});
  if (!res.success) { el.querySelector('#pengaturanBody').innerHTML = emptyState(res.message); return; }
  renderPengaturan(el, res.data);
}

function renderPengaturan(el, p) {
  el.querySelector('#pengaturanBody').innerHTML = `
    <div class="grid grid-2">
      <div class="card">
        <h3 style="margin-bottom:12px;">Identitas Sekolah</h3>
        <label class="field"><span>Nama Sekolah *</span><input id="pgNama" value="${esc(p.namaSekolah)}" required></label>
        <label class="field" style="margin-top:10px;"><span>Alamat Sekolah</span><textarea id="pgAlamat" placeholder="Jl. Pendidikan No. 1, Kota, Provinsi">${esc(p.alamat)}</textarea></label>
        <div class="field-row" style="margin-top:10px;">
          <label class="field" style="flex:1;"><span>Semester Aktif</span>
            <select id="pgSemester">
              <option value="Ganjil" ${p.semester === 'Ganjil' ? 'selected' : ''}>Ganjil</option>
              <option value="Genap" ${p.semester === 'Genap' ? 'selected' : ''}>Genap</option>
            </select>
          </label>
          <label class="field" style="flex:1;"><span>Tahun Ajaran</span><input id="pgTahunAjaran" value="${esc(p.tahunAjaran)}" placeholder="2024/2025"></label>
        </div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:12px;">Logo Sekolah</h3>
        <p class="muted">Dipakai di sidebar aplikasi dan kop surat cetak. Format PNG/JPG, maks 5MB.</p>
        <div id="pgLogoPreview" style="margin:12px 0;">
          ${p.logoUrl ? `<img src="${esc(p.logoUrl)}" style="height:90px;width:90px;object-fit:contain;border:1px solid var(--c-high);border-radius:12px;padding:6px;background:#fff;">`
            : '<div class="xbox" style="height:90px;width:90px;"></div>'}
        </div>
        <input type="file" id="pgLogoFile" accept="image/*">
      </div>
    </div>
    <div class="card">
      <h3 style="margin-bottom:10px;">Pratinjau Kop Surat</h3>
      <div id="pgKopPreview" class="card-flat"></div>
      <button class="btn btn-primary" id="pgSimpan" style="margin-top:16px;">💾 SIMPAN PENGATURAN</button>
    </div>
  `;

  const updatePreview = () => {
    const logoSrc = window._pgLogoDataUrl || p.logoUrl;
    el.querySelector('#pgKopPreview').innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;border-bottom:3px solid var(--ink);padding-bottom:12px;">
        ${logoSrc ? `<img src="${logoSrc}" style="height:56px;width:56px;object-fit:contain;">` : ''}
        <div>
          <div style="font-weight:700;font-size:16px;">${esc(el.querySelector('#pgNama').value || 'Nama Sekolah')}</div>
          <div class="muted">${esc(el.querySelector('#pgAlamat').value || '')}</div>
          <div class="muted">Semester ${esc(el.querySelector('#pgSemester').value)} — Tahun Ajaran ${esc(el.querySelector('#pgTahunAjaran').value)}</div>
        </div>
      </div>`;
  };
  updatePreview();
  ['pgNama', 'pgAlamat', 'pgSemester', 'pgTahunAjaran'].forEach(id => el.querySelector('#' + id).addEventListener('input', updatePreview));

  el.querySelector('#pgLogoFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Ukuran logo maksimal 5MB.', 'error'); e.target.value = ''; return; }
    window._pgLogoDataUrl = await fileToBase64(file);
    el.querySelector('#pgLogoPreview').innerHTML = `<img src="${window._pgLogoDataUrl}" style="height:90px;width:90px;object-fit:contain;border:1px solid var(--c-high);border-radius:12px;padding:6px;background:#fff;">`;
    updatePreview();
  });

  el.querySelector('#pgSimpan').addEventListener('click', async () => {
    if (!el.querySelector('#pgNama').value.trim()) { showToast('Nama sekolah wajib diisi.', 'error'); return; }
    const btn = el.querySelector('#pgSimpan'); btn.disabled = true; btn.textContent = 'MENYIMPAN...';
    const payload = {
      namaSekolah: el.querySelector('#pgNama').value.trim(),
      alamat: el.querySelector('#pgAlamat').value,
      semester: el.querySelector('#pgSemester').value,
      tahunAjaran: el.querySelector('#pgTahunAjaran').value.trim()
    };
    if (window._pgLogoDataUrl) payload.logoBase64 = window._pgLogoDataUrl;
    const res = await api('pengaturan.save', payload);
    btn.disabled = false; btn.textContent = '💾 SIMPAN PENGATURAN';
    if (res.success) {
      showToast(res.message);
      window._pgLogoDataUrl = null;
      Store.set(userKey('pengaturan'), { t: Date.now(), h: hashStr(JSON.stringify(res.data)), data: res.data });
      terapkanPengaturanSekolah(res.data);
      renderPengaturan(el, res.data);
    } else showToast(res.message, 'error');
  });
}
