# JurnalGuru (SIMAGE)

Sistem Informasi Manajemen Administrasi Guru Berbasis Web.

Frontend statis (HTML/CSS/JS vanilla) ini berkomunikasi dengan backend Google Apps Script
sebagai REST API (pola **gas-pro-api**). Performa instan antar-halaman memakai pola
**gas-instant-ux-pro** (SPA hash router, stale-while-revalidate, retry jaringan).

## Struktur folder

```
index.html
css/style.css
js/config.js        ← isi GAS_URL di sini
js/api.js
js/ui.js
js/router.js
js/app.js
js/pages/*.js
```

## Sebelum deploy

1. Deploy `Kode.gs` (lihat berkas backend terpisah) sebagai Web App di Google Apps Script.
2. Salin URL `/exec`.
3. Buka `js/config.js`, ganti nilai `GAS_URL`.
4. Deploy folder ini ke GitHub Pages (lihat `PANDUAN-INSTALASI.md`).

## Modul yang tersedia

- Beranda (dashboard ringkasan KBM)
- Jurnal Harian + Approval Kepala Sekolah
- Absensi per kelas
- Input & Rekap Nilai
- Catatan Sikap & Perilaku (P5)
- Laporan & Rekapitulasi (grafik Chart.js)
- Data Master (Admin): Guru, Siswa, Kelas, Mapel + impor CSV
- Log Aktivitas
- WhatsApp & Notifikasi (Fonnte) — blast, antrean, konfigurasi
- CRM Kontak (Guru & Wali Siswa)
- Migrasi Data dari aplikasi lama (dry-run + import idempoten)

## Akun demo (setelah `setupAppEnvironment()`)

| Email | Password | Peran |
|---|---|---|
| admin@sekolah.sch.id | admin123 | Admin |
| kepsek@sekolah.sch.id | kepsek123 | Kepsek |
| bambang@sekolah.sch.id | guru123 | Wali Kelas |
