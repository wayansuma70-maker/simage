# 📋 Panduan Instalasi — JurnalGuru (SIMAGE)

## === BACKEND (Google Apps Script) ===

1. Buka https://script.google.com → **Proyek Baru**.
2. Hapus isi `Code.gs` bawaan. Buat 8 berkas `.gs` baru dengan nama persis seperti ini, lalu
   tempel isi dari masing-masing berkas yang telah diberikan di chat:
   - `Config.gs`
   - `Util.gs`
   - `Auth.gs`
   - `Akademik.gs`
   - `Notifikasi.gs`
   - `CRM.gs`
   - `Migrasi.gs`
   - `Router.gs`
3. Buka ikon ⚙ **Project Settings** → `appsscript.json` → tampilkan file manifest → ganti isinya
   dengan berkas `appsscript.json` yang diberikan.
4. Jalankan fungsi **`setupAppEnvironment`** — **HANYA SEKALI**:
   - Dropdown fungsi di toolbar → pilih `setupAppEnvironment` → klik ▶ Run.
   - Klik **Review permissions** → pilih akun Google sekolah → **Allow** (izinkan akses
     Sheets, Drive, Gmail, dan trigger).
   - Buka **Execution Log** (Ctrl+Enter) — pastikan muncul `✅ Setup selesai!`.
   - Cek Google Drive: folder **📁 JurnalGuru (SIMAGE)** sudah terbuat berisi spreadsheet database.
   - ⚠️ **JANGAN** jalankan `setupAppEnvironment()` lebih dari sekali — akan membuat folder/spreadsheet duplikat.
5. **Deploy** → **New deployment** → pilih tipe **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy** → salin **URL** yang diakhiri `/exec`.
6. Buka spreadsheet database (lihat log atau Drive) → sheet **AppConfig** → kolom `NAMA_INSTITUSI`,
   ubah menjadi nama sekolah Anda.

## === FRONTEND (GitHub Pages) ===

1. Ekstrak ZIP yang diberikan. **Folder hasil ekstrak itu sendiri** adalah folder yang akan
   di-`git init` — jangan membuat folder pembungkus lagi di luarnya.
2. Buka `js/config.js`, ganti baris:
   ```js
   const GAS_URL = 'https://script.google.com/macros/s/ISI_DENGAN_DEPLOYMENT_ID/exec';
   ```
   dengan URL `/exec` dari langkah Backend #5.
3. Ikuti panduan `github-pages-deploy-guide` (akan dipandu langkah demi langkah di chat) untuk:
   - Install Git, buat akun GitHub.
   - Buat repository publik baru.
   - `git init` di dalam folder hasil ekstrak ZIP ini (pastikan `index.html` terlihat di `dir`/`ls`
     sebelum `git init`).
   - `git add .` → `git commit -m "Upload pertama"` → `git push`.
   - Settings → Pages → Branch `main` / folder `root` → Save.
4. Buka situs `https://USERNAME.github.io/NAMA-REPO/` → coba login dengan akun demo.

## === SETUP NOTIFIKASI WHATSAPP (FONNTE) ===

1. Daftar di https://fonnte.com → tambah **Device** → scan QR dengan nomor WhatsApp sekolah.
2. Salin **Token** perangkat.
3. Login sebagai Admin di JurnalGuru → menu **WhatsApp & Notifikasi** → tab **Konfigurasi**.
4. Tempel token → klik **📡 Cek Perangkat** (pastikan status `connect`).
5. Isi nomor HP Anda sendiri → **Kirim Tes WA** → pastikan pesan masuk.
6. Nyalakan saklar **Notifikasi WhatsApp Aktif** → atur matriks event (jurnal disetujui, siswa alpa, dst) → **Simpan Konfigurasi**.
7. (Opsional) Nyalakan **Notifikasi Email Aktif** untuk rekap bulanan ke Kepala Sekolah.

**Catatan jujur:** pengiriman WA bergantung status perangkat Fonnte tetap terhubung (device online);
kuota UrlFetch harian Google ±20.000 kali (akun gratis) — cukup untuk ribuan pesan per hari;
balasan WA masuk tidak tercatat otomatis kecuali webhook Fonnte disiapkan terpisah.

## === MIGRASI DATA DARI APLIKASI LAMA (opsional) ===

Gunakan ini **hanya jika** Anda sebelumnya sudah memakai versi JurnalGuru yang lain dan ingin
memindahkan data guru/siswa/jurnal/nilai lama tanpa mengetik ulang.

1. Login sebagai Admin → menu **Migrasi Data Lama**.
2. Tempel URL/ID spreadsheet database aplikasi **lama** (pastikan Anda login dengan akun Google
   yang sama dengan pemilik spreadsheet lama tersebut, agar lampiran foto di Drive tetap terbaca).
3. Klik **🔍 Pindai (Dry-run)** — ini **hanya membaca**, tidak menulis apa pun. Periksa jumlah
   data "Ditambah/Diperbarui/Dilewati" di setiap sheet.
4. Jika hasil pindai sudah sesuai, klik **▶ Jalankan Import**.
5. Uji dengan login 1 akun guru lama untuk memastikan data benar.
6. **Tepat sebelum** mengumumkan alamat baru ke semua guru, jalankan **Import sekali lagi**
   (delta sync) untuk menangkap data yang sempat masuk ke app lama selama masa transisi.
7. Umumkan alamat JurnalGuru yang baru ke seluruh guru (bisa lewat **Blast WhatsApp**).

**Batasan jujur:** sesi login lama tidak ikut pindah (guru cukup login ulang dengan email yang
sama); akun Admin lama tidak diimpor; proses hanya **membaca** spreadsheet lama, tidak pernah mengubahnya.

## === TEST SEBELUM DIGUNAKAN SEKOLAH ===

1. Buka situs frontend di browser → cek apakah form login tampil dengan benar (styling CSS termuat).
2. Login dengan akun demo Admin → cek Beranda tampil data.
3. Coba isi jurnal sebagai Guru → cek masuk sebagai "Menunggu Approval".
4. Login sebagai Kepsek → Approve jurnal tadi → cek status berubah.
5. Buka Chrome DevTools → tab Network → pastikan tidak ada error CORS saat memanggil `/exec`.
6. Ubah password akun demo & buat akun guru sungguhan lewat menu **Data Master**.
