// ============================================================
// router.js — SPA hash router (Prinsip 1 gas-instant-ux-pro)
// ============================================================

const Pages = {};
function registerPage(name, def) { Pages[name] = Object.assign({ roles: null, title: name }, def); }

const NAV_MENU = [
  { group: 'MENU', items: [
    { page: 'beranda', label: 'Beranda', icon: '▦' },
    { page: 'jurnal', label: 'Jurnal KBM', icon: '▤' },
    { page: 'absensi', label: 'Absensi', icon: '☑' },
    { page: 'nilai', label: 'Nilai', icon: '✎' },
    { page: 'sikap', label: 'Catatan Sikap', icon: '◈' },
    { page: 'laporan', label: 'Laporan', icon: '▥' }
  ]},
  { group: 'ADMINISTRASI', items: [
    { page: 'master', label: 'Data Master', icon: '⌂', roles: ['Admin'] },
    { page: 'log', label: 'Log Aktivitas', icon: '≡', roles: ['Admin', 'Kepsek', 'Wakasek'] }
  ]},
  { group: 'KOMUNIKASI', items: [
    { page: 'notifikasi', label: 'WhatsApp & Notifikasi', icon: '✆', roles: ['Admin', 'Kepsek', 'Wakasek'] },
    { page: 'crm', label: 'CRM Kontak', icon: '☍', roles: ['Admin', 'Kepsek', 'Wakasek'] }
  ]},
  { group: 'SISTEM', items: [
    { page: 'migrasi', label: 'Migrasi Data Lama', icon: '⇄', roles: ['Admin'] }
  ]}
];

function renderNav() {
  const nav = document.getElementById('sideNav');
  nav.innerHTML = NAV_MENU.map(g => {
    const items = g.items.filter(it => !it.roles || it.roles.includes(AppState.peran));
    if (!items.length) return '';
    return `<div class="nav-group-label">${g.group}</div>` + items.map(it =>
      `<button data-page="${it.page}"><span class="nav-icon">${it.icon}</span>${esc(it.label)}</button>`
    ).join('');
  }).join('');
  nav.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    go(b.dataset.page);
    document.querySelector('.sidebar').classList.remove('open');
  }));
}

function go(name, param) {
  const h = '#/' + name + (param ? '/' + encodeURIComponent(param) : '');
  if (location.hash === h) route(); else location.hash = h;
}

function defaultPage() { return 'beranda'; }

function route() {
  const [name, param] = location.hash.replace(/^#\/?/, '').split('/');
  let def = Pages[name] || Pages[defaultPage()];
  const pageName = Pages[name] ? name : defaultPage();

  if (def.roles && !def.roles.includes(AppState.peran)) {
    showToast('Anda tidak memiliki akses ke halaman ini.', 'error');
    def = Pages[defaultPage()];
  }

  const container = document.getElementById('pageContainer');
  let el = container.querySelector('.page[data-page="' + pageName + '"]');
  if (!el) {
    el = document.createElement('section');
    el.className = 'page';
    el.dataset.page = pageName;
    el.innerHTML = def.template();
    container.appendChild(el);
  }
  container.querySelectorAll('.page').forEach(p => p.hidden = p !== el);
  document.getElementById('pageTitle').textContent = def.title.toUpperCase();
  document.querySelectorAll('#sideNav button').forEach(b => b.classList.toggle('active', b.dataset.page === pageName));
  def.show && def.show(el, param && decodeURIComponent(param));
}

window.addEventListener('hashchange', route);
