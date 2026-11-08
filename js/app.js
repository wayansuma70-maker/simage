// ============================================================
// app.js — Inisialisasi aplikasi, login/logout, restore sesi
// ============================================================

function showLogin() {
  document.getElementById('loginScreen').hidden = false;
  document.getElementById('appShell').hidden = true;
}
function showApp() {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('appShell').hidden = false;
  document.getElementById('userName').textContent = AppState.nama;
  document.getElementById('userRole').textContent = AppState.peran;
  renderNav();
  route();
  muatPengaturanSekolah();
}

function terapkanPengaturanSekolah(p) {
  if (!p) return;
  const pill = document.getElementById('semesterPill');
  if (pill && p.semester && p.tahunAjaran) pill.textContent = p.semester.toUpperCase() + ' ' + p.tahunAjaran;
  const label = document.getElementById('sidebarSchoolLabel');
  if (label) label.textContent = p.namaSekolah || 'SIMAGE v1.0';
  const mark = document.getElementById('sidebarBrandMark');
  if (mark) mark.innerHTML = p.logoUrl ? `<img src="${p.logoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">` : 'JG';
}

function muatPengaturanSekolah() {
  swr('pengaturan', 'pengaturan.get', {}, terapkanPengaturanSekolah, { fresh: 300000 });
}

async function doLogin(email, password) {
  const btn = document.getElementById('loginSubmit');
  const errBox = document.getElementById('loginError');
  errBox.hidden = true;
  btn.disabled = true; btn.textContent = 'MEMPROSES...';
  const res = await api('auth.login', { email, password });
  btn.disabled = false; btn.textContent = 'MASUK';
  if (!res.success) { errBox.textContent = res.message; errBox.hidden = false; return; }

  AppState.token = res.data.token;
  AppState.email = res.data.profile.email;
  AppState.nama = res.data.profile.nama;
  AppState.peran = res.data.profile.peran;
  AppState.guruId = res.data.profile.guruId;
  Store.set('session', { token: AppState.token, email: AppState.email, nama: AppState.nama, peran: AppState.peran, guruId: AppState.guruId });
  Store.set(userKey('boot'), { t: Date.now(), h: hashStr(JSON.stringify(res.data.boot)), data: { boot: res.data.boot } });
  showApp();
}

async function tryRestoreSession() {
  const s = Store.get('session');
  if (!s || !s.token) { showLogin(); return; }
  Object.assign(AppState, s);
  showApp(); // tampilkan dari cache dulu (instan), lalu verifikasi di latar
  const res = await api('auth.me', {});
  if (!res.success) { onSessionExpired(); return; }
  AppState.nama = res.data.profile.nama; AppState.peran = res.data.profile.peran;
  Store.set(userKey('boot'), { t: Date.now(), h: hashStr(JSON.stringify(res.data.boot)), data: { boot: res.data.boot } });
}

async function handleGoogleCredential(response) {
  const btn = document.getElementById('googleBtn');
  const errBox = document.getElementById('loginError');
  errBox.hidden = true;
  const res = await api('auth.googleLogin', { idToken: response.credential });
  if (!res.success) { errBox.textContent = res.message; errBox.hidden = false; return; }

  AppState.token = res.data.token;
  AppState.email = res.data.profile.email;
  AppState.nama = res.data.profile.nama;
  AppState.peran = res.data.profile.peran;
  AppState.guruId = res.data.profile.guruId;
  Store.set('session', { token: AppState.token, email: AppState.email, nama: AppState.nama, peran: AppState.peran, guruId: AppState.guruId });
  Store.set(userKey('boot'), { t: Date.now(), h: hashStr(JSON.stringify(res.data.boot)), data: { boot: res.data.boot } });
  showApp();
}

function initGoogleSignIn() {
  if (!GOOGLE_CLIENT_ID || !window.google || !google.accounts || !google.accounts.id) return;
  document.getElementById('googleLoginArea').hidden = false;
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential });
  google.accounts.id.renderButton(document.getElementById('googleBtn'), { theme: 'outline', size: 'large', shape: 'pill', width: 320, text: 'signin_with' });
}

function modeSaatIni_() {
  return document.documentElement.getAttribute('data-theme')
    || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function terapkanIkonTema_(mode) {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = mode === 'dark' ? '☀️' : '🌙';
}
function toggleTema() {
  const mode = modeSaatIni_() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(LS_PREFIX + 'theme', mode);
  terapkanIkonTema_(mode);
}

document.addEventListener('DOMContentLoaded', () => {
  warmUpServer();
  terapkanIkonTema_(modeSaatIni_());
  document.getElementById('themeToggleBtn').addEventListener('click', toggleTema);
  setTimeout(initGoogleSignIn, 300); // beri waktu skrip Google Identity Services selesai dimuat

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    doLogin(document.getElementById('loginEmail').value.trim(), document.getElementById('loginPassword').value);
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await api('auth.logout', {});
    AppState.token = '';
    Store.del('session');
    location.hash = '';
    showLogin();
  });

  document.getElementById('hamburgerBtn').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
  });

  tryRestoreSession();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && AppState.token) warmUpServer();
  });
});