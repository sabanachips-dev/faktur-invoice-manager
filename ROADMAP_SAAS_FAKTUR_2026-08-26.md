# Roadmap Bertahap SaaS — Faktur

**Tanggal:** 26 Agustus 2026  
**Prinsip:** Faktur tetap dipakai Sabana Chips terlebih dahulu. Ekspansi ke SaaS dilakukan hanya setelah setiap tahap memenuhi kriteria keluar yang terukur.

## Arah Produk

Faktur tidak perlu langsung menjadi SaaS besar. Jalur yang lebih aman adalah memperkuat penggunaan internal, lalu membuat fondasi organisasi dan akses pengguna, kemudian membuka program pelanggan terbatas. Hal ini menjaga aplikasi yang saat ini bekerja untuk Sabana Chips tetap stabil sembari risiko data lintas pelanggan dikurangi.

| Tahap | Tujuan | Ruang lingkup utama | Kriteria selesai |
|---|---|---|---|
| 0. Operasi internal | Membuat pemakaian Sabana Chips stabil dan dapat dipulihkan | Konfigurasi bisnis, backup, monitoring dasar, cetak/PDF fallback, uji APK dan perangkat fisik | Alur harian stabil; backup dipulihkan pada uji; tidak ada insiden kritis terbuka; printer physical test memiliki prosedur yang jelas. |
| 1. Fondasi SaaS | Menjaga setiap bisnis dan pengguna terisolasi | `organization`/tenant, anggota, peran pemilik–admin–staf, undangan, pemisahan data dan audit akses | Semua query terikat organisasi; pengguna tidak dapat membaca atau mengubah data organisasi lain; uji otorisasi lulus. |
| 2. Operasi SaaS | Membuat sistem dapat dipantau dan didukung | Rate limit, monitoring error, metrik dasar, alert, backup/restore terjadwal, runbook insiden, kebijakan privasi | Log dan alert berjalan; restore diuji; prosedur insiden serta retensi data terdokumentasi. |
| 3. Beta pelanggan | Menguji produk dengan pelanggan terbatas | Onboarding bisnis, halaman admin SaaS, batas penggunaan, dukungan, feedback, impor/ekspor aman | Beta berjalan pada pelanggan terbatas tanpa kebocoran data lintas tenant atau insiden kritis. |
| 4. Komersialisasi | Menjual paket layanan dengan kontrol yang jelas | Paket, langganan, billing, status pembayaran layanan, faktur SaaS, kebijakan layanan | Billing telah diuji dalam sandbox; status paket mengendalikan akses dengan benar; syarat layanan tersedia. |

## Tahap 0 — Prioritas Sekarang

Tahap pertama bukan fitur baru untuk pelanggan, melainkan menutup risiko pemakaian sendiri. Email bisnis dan rekening harus dilengkapi sebelum invoice dibagikan. Leaked Password Protection perlu diaktifkan bila login kata sandi dipakai. Backup Supabase harus memiliki jadwal dan satu kali uji pemulihan. PWA serta APK perlu diuji pada perangkat Android fisik. Cetak thermal tidak boleh diklaim didukung sampai sesuai pada printer pemilik; PDF dan cetak A4 tetap menjadi fallback yang aman.

| Urutan | Pekerjaan | Mengapa didahulukan |
|---|---|---|
| 1 | Lengkapi profil bisnis, email, dan rekening | Menjamin invoice yang dikirim ke pelanggan memuat informasi operasional yang benar. |
| 2 | Backup, pemulihan, dan monitoring dasar | Data invoice lebih penting daripada penambahan fitur komersial. |
| 3 | Uji Android fisik dan cetak | Mengubah status dari “secara teknis tersedia” menjadi “terbukti di perangkat”. |
| 4 | Hardening login dan pembatasan permintaan | Mengurangi risiko saat akses mulai diperluas. |

## Tahap 1 — Fondasi Multi-Tenant

SaaS tidak cukup dengan menambahkan kolom `businessId`. Model akses perlu menggunakan organisasi sebagai batas utama. Satu pengguna dapat memiliki atau bergabung ke organisasi sesuai perannya; setiap klien, katalog, invoice, dokumen, dan konfigurasi hanya dapat dibaca melalui keanggotaan yang sah. Operasi sensitif seperti ekspor, hapus massal, perubahan rekening, dan manajemen anggota harus ditulis ke audit log.

Fitur yang direkomendasikan pada tahap ini adalah organisasi, anggota, undangan email, role-based access control, audit log, dan pengujian negatif—yakni pembuktian bahwa pengguna dari organisasi A gagal mengakses data organisasi B. Billing belum perlu dibuat pada tahap ini.

## Tahap 2 — Operasi dan Keandalan

Setelah isolasi tenant kuat, operasional perlu dapat dideteksi dan dipulihkan. Minimal yang diperlukan adalah pencatatan error terstruktur, metrik request/error, alert untuk kegagalan kritis, job backup, prosedur restore, dan runbook untuk insiden autentikasi, database, atau domain. Uji beban untuk daftar invoice, impor spreadsheet, ekspor, dan dashboard dilakukan dengan volume mendekati penggunaan target.

## Tahap 3 dan 4 — Pelanggan Terbatas lalu Billing

Beta tidak langsung berarti layanan berbayar. Mulailah dengan beberapa pelanggan terpilih dan batas penggunaan yang jelas. Kumpulkan data kegagalan onboarding, kebutuhan dukungan, dan masalah performa sebelum menambahkan billing. Ketika alur pelanggan stabil, billing dapat ditambahkan dengan status paket yang benar-benar membatasi akses fitur, bukan hanya label visual.

> **Keputusan yang disarankan:** mulai dari **Tahap 0** sekarang. Tahap 1 baru dimulai setelah operasi internal stabil dan pemulihan data telah diuji. Jangan menjual paket SaaS sebelum Tahap 2 dan beta pelanggan selesai.

## Kriteria Go-Live SaaS Publik

SaaS publik baru dapat dinyatakan siap apabila semua butir berikut terpenuhi.

| Kategori | Kriteria minimum |
|---|---|
| Data dan akses | Tenant, peran, undangan, dan pengujian isolasi data lintas organisasi sudah lulus. |
| Keamanan | Secret dikelola aman, hardening login aktif, rate limit diterapkan, audit akses tersedia. |
| Operasi | Monitoring, alert, backup, dan restore telah diuji serta memiliki pemilik prosedur. |
| Kualitas | Regresi inti, uji perangkat, dan uji beban pada skenario target selesai tanpa isu kritis terbuka. |
| Komersial | Paket, billing, kebijakan privasi, ketentuan layanan, dan jalur dukungan pelanggan tersedia. |

