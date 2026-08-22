# Pilihan Deployment untuk Faktur — Invoice Manager

## Ringkasan keputusan

Aplikasi saat ini adalah **React/Vite + Express + tRPC + Drizzle ORM + MySQL**, dengan autentikasi Manus OAuth, pengiriman email melalui Resend, dan helper penyimpanan objek. Struktur ini dapat diekspor ke GitHub dan dijalankan di hosting eksternal, tetapi pemindahan ke Supabase bukan sekadar mengganti URL database: Supabase memakai PostgreSQL, sedangkan aplikasi saat ini memakai `mysql2` dan dialek MySQL pada Drizzle.

Untuk aplikasi faktur yang dipakai dalam kegiatan usaha, solusi gratis sepenuhnya cocok untuk **demo, staging, atau penggunaan pribadi terbatas**, bukan sebagai produksi tanpa risiko. Khususnya, Vercel Hobby hanya mengizinkan penggunaan pribadi non-komersial, dan Supabase Free menghentikan project setelah satu minggu tidak aktif.[1][2]

## Ketergantungan migrasi khusus aplikasi ini

Selain database, ada dua ketergantungan platform yang harus diganti atau divalidasi sebelum aplikasi dapat berdiri sendiri di luar deployment saat ini.

| Komponen saat ini | Dampak bila dipindah | Pekerjaan yang diperlukan |
|---|---|---|
| Manus OAuth | Callback login saat ini menukar kode melalui SDK platform dan membuat cookie sesi | Ganti ke Supabase Auth/Auth.js atau pastikan provider OAuth serta callback domain eksternal didukung |
| Forge-backed S3 storage | Helper upload memakai `BUILT_IN_FORGE_API_URL` dan `BUILT_IN_FORGE_API_KEY` | Ganti helper ke Supabase Storage atau bucket S3/R2 milik sendiri |
| MySQL + `mysql2` | Supabase menggunakan PostgreSQL | Ubah driver dan konfigurasi Drizzle, konversi tipe/skema, lalu migrasikan salinan data |
| Resend | Tetap dapat digunakan | Salin environment variable dan verifikasi domain pengirim pada domain produksi baru |

Konsekuensinya, **GitHub saja** dapat dilakukan tanpa mengubah fungsionalitas aplikasi. Sementara **Supabase + hosting eksternal** adalah proyek migrasi aplikasi, bukan pemindahan konfigurasi satu klik.

| Opsi | Perubahan aplikasi | Kelayakan untuk produksi bisnis | Rekomendasi |
|---|---:|---|---|
| **Tetap di hosting saat ini + GitHub privat** | Hampir tidak ada | Paling aman untuk aplikasi yang sekarang | **Pilih sekarang** |
| **GitHub + Supabase + Vercel** | Migrasi MySQL ke PostgreSQL dan penyesuaian runtime/auth | Vercel Hobby tidak sesuai untuk penggunaan komersial | Hanya jika memakai paket bisnis Vercel |
| **GitHub + Supabase + Cloudflare Workers** | Refactor Express ke runtime Workers/Hono dan driver Postgres edge | Dapat menjadi opsi hemat setelah refactor | Cocok sebagai proyek migrasi tahap dua |
| **GitHub + Render + Supabase** | Relatif kecil untuk server Express | Tidak disarankan untuk produksi gratis; service tidur 15 menit | Hanya demo/staging |

## Perbandingan platform

### GitHub Free untuk repositori kode

GitHub Free mendukung repositori privat tanpa batas dan menyediakan 2.000 menit GitHub Actions per bulan untuk akun personal.[3] Ini pilihan yang tepat untuk **kepemilikan kode, riwayat perubahan, dan cadangan**. Repositori harus privat dan seluruh nilai rahasia—database URL, token OAuth, kunci Resend, dan JWT secret—harus disimpan sebagai *repository secrets* atau environment variables platform, bukan di-commit ke Git.

### Supabase Free untuk database

Supabase Free menyediakan PostgreSQL 500 MB, 50.000 MAU, 1 GB file storage, 5 GB egress, dan dua project aktif. Namun project Free dihentikan setelah satu minggu tidak aktif dan tidak memiliki backup otomatis.[1] Batas ini cukup untuk prototipe atau penggunaan ringan, tetapi penghentian project dan tidak adanya backup otomatis menjadikannya kurang ideal sebagai satu-satunya basis data faktur produksi.

Supabase menyediakan panduan migrasi dari MySQL ke PostgreSQL, termasuk penggunaan alat migrasi atau `pgloader`.[4] Untuk aplikasi ini, migrasi juga membutuhkan perubahan kode dari driver `mysql2` ke driver PostgreSQL dan penyesuaian skema Drizzle sebelum data dipindahkan.

### Vercel untuk frontend dan Express

Vercel dapat menjalankan aplikasi Express sebagai satu Vercel Function, dan aplikasi Express yang ada dapat dideploy dari repositori Git.[5] Namun Vercel menyatakan bahwa Hobby dibatasi untuk penggunaan pribadi non-komersial; penggunaan komersial memerlukan Pro atau Enterprise.[2] Karena Faktur adalah aplikasi bisnis, **saya tidak merekomendasikan Vercel Hobby sebagai hosting produksi**.

### Cloudflare Workers sebagai opsi gratis alternatif

Cloudflare Workers Free menyertakan 100.000 request per hari dan 10 ms CPU per invocation.[6] Ini dapat menjadi hosting hemat untuk aplikasi faktur kecil, tetapi server Express saat ini tidak dapat dipindahkan tanpa perubahan arsitektur ke runtime Workers/Pages Functions. Selain itu, koneksi PostgreSQL harus dirancang untuk runtime edge; ini bukan migrasi sekali klik.

### Render Free sebagai opsi demo

Render dapat menjalankan web service Node secara gratis, tetapi service Free tidur setelah 15 menit tanpa trafik dan proses bangun dapat memakan sekitar satu menit. Dokumentasinya juga secara eksplisit menyatakan Free tidak untuk aplikasi produksi.[7] Karena itu Render Free tidak direkomendasikan untuk aplikasi faktur yang perlu respons cepat dan konsisten.

## Rekomendasi praktis

> **Rekomendasi sekarang:** pertahankan deployment aktif untuk operasional, lalu ekspor kode ke **GitHub privat** sebagai cadangan dan fondasi CI. Jangan memindahkan database produksi ke paket gratis sebelum ada backup, staging, dan pengujian migrasi lengkap.

Jika tujuan utama Anda adalah **memiliki kode dan tidak bergantung pada satu platform**, GitHub privat adalah langkah pertama yang tepat dan rendah risiko. Bila nanti ingin memindahkan seluruh sistem secara eksternal, gunakan jalur bertahap:

1. Buat repositori GitHub privat dan pindahkan kode tanpa rahasia.
2. Buat project Supabase **staging**, lalu konversi skema MySQL ke PostgreSQL dan migrasikan salinan data, bukan database produksi langsung.
3. Ubah aplikasi agar memakai PostgreSQL/Supabase dan ganti atau validasi alur autentikasi saat domain berubah.
4. Uji CRUD invoice, impor Excel, pengiriman email, halaman publik, PDF, dan cetak batch pada staging.
5. Pilih hosting produksi yang sesuai: Vercel paket bisnis untuk jalur Express paling mudah, atau Cloudflare Workers setelah refactor bila prioritasnya biaya rendah.
6. Cutover hanya setelah backup database, rencana rollback, dan konfirmasi pengguna selesai.

## Pilihan yang perlu diputuskan

| Pilihan | Hasil | Risiko |
|---|---|---|
| **A. Ekspor ke GitHub privat saja** | Kode dimiliki dan dapat dipindahkan kapan saja | Rendah |
| **B. GitHub + Supabase staging** | Memulai migrasi database tanpa mengganggu aplikasi aktif | Sedang |
| **C. Migrasi penuh ke Vercel + Supabase** | Hosting eksternal dengan perubahan runtime/database/auth | Tinggi; Vercel Hobby tidak sesuai bisnis |
| **D. GitHub + Cloudflare Workers + Supabase** | Potensi biaya hosting rendah | Tinggi; perlu refactor server |

## Referensi

[1]: https://supabase.com/pricing "Supabase Pricing"
[2]: https://vercel.com/docs/limits/fair-use-guidelines "Vercel Fair Use Guidelines"
[3]: https://docs.github.com/get-started/learning-about-github/githubs-products "GitHub Free Plans"
[4]: https://supabase.com/docs/guides/platform/migrating-to-supabase/mysql "Migrating from MySQL to Supabase"
[5]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
[6]: https://developers.cloudflare.com/workers/platform/pricing/ "Cloudflare Workers Pricing"
[7]: https://render.com/docs/free "Render Free Services"
