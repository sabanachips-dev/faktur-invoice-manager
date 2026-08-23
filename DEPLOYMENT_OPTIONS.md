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

## Arsitektur target setelah pilihan pengguna

Pengguna memilih GitHub, Supabase, Vercel, Cloudflare, dan subdomain dari domain `biz.id`. Arsitektur aman adalah GitHub privat sebagai sumber kode, Supabase sebagai PostgreSQL dan object storage, Vercel sebagai runtime aplikasi **hanya pada paket yang mengizinkan penggunaan bisnis**, serta Cloudflare sebagai pengelola DNS. Vercel Hobby tidak boleh dipakai untuk produksi aplikasi Faktur karena batas penggunaan personal non-komersialnya.[2]

| Lapisan | Target | Ketentuan implementasi |
|---|---|---|
| Kode dan CI | GitHub private repository | Rahasia hanya di GitHub, Vercel, dan Supabase environment variables; tidak boleh masuk commit |
| Database dan file | Supabase staging lalu production | PostgreSQL dan Supabase Storage menggantikan MySQL serta helper storage sebelumnya |
| Aplikasi | Vercel | Gunakan paket yang mengizinkan penggunaan bisnis dan sesuaikan auth/runtime aplikasi |
| DNS | Cloudflare DNS | Pakai record CNAME pada subdomain menuju nilai unik yang ditampilkan Vercel; Vercel mendokumentasikan CNAME untuk subdomain.[8] |

Untuk kombinasi Vercel dan Cloudflare, Cloudflare sebaiknya dipakai **hanya sebagai DNS authoritative** bagi record aplikasi, bukan reverse proxy. Vercel memperingatkan bahwa reverse proxy Cloudflare dapat mengurangi visibilitas trafik, menambah latensi, dan menimbulkan masalah cache.[9] Saat record CNAME dibuat di Cloudflare, status proxied perlu dinonaktifkan (awan abu-abu/DNS only) untuk record subdomain tersebut.

Subdomain belum boleh dibuat sampai pengguna menyebut **nama domain lengkap** dan label yang diinginkan—misalnya `faktur.contoh.biz.id`—serta target Vercel telah tersedia. Ini menghindari konflik DNS dan perubahan layanan aktif yang tidak disengaja.

## Arsitektur gratis yang disetujui

Pengguna memilih jalur gratis dan domain **`sabanachips.biz.id`**. Karena Vercel Hobby tidak sesuai untuk penggunaan bisnis, Vercel tidak digunakan sebagai target produksi. Arsitektur gratis yang akan disiapkan adalah Cloudflare Pages untuk antarmuka statis, Cloudflare Worker untuk API, Supabase Free untuk PostgreSQL, autentikasi, dan file, serta GitHub private repository untuk kode dan riwayat perubahan.

| Komponen | Layanan gratis | Tanggung jawab |
|---|---|---|
| Repositori | GitHub Free private repository | Kode, pull request, dan riwayat rilis tanpa rahasia |
| Frontend | Cloudflare Pages | Menyajikan React/Vite secara statis; request aset statis tidak dibatasi oleh kuota Functions.[10] |
| API | Cloudflare Worker | Menggantikan Express/tRPC runtime saat ini dan memanggil Supabase melalui API yang sesuai |
| Database, auth, file | Supabase Free | PostgreSQL, Supabase Auth, dan Storage; gunakan satu project staging dan satu production |
| DNS | Cloudflare DNS | `staging.sabanachips.biz.id` dan `faktur.sabanachips.biz.id` menuju deployment Cloudflare |

Cloudflare Workers Free membatasi eksekusi CPU hingga **10 ms per request** dan total **100.000 request per hari**.[10] Oleh sebab itu proses berat tidak boleh dijalankan di Worker. Fungsi PDF dan parsing Excel yang sudah terjadi di browser harus tetap di sisi klien; API Worker hanya menangani autentikasi, validasi ringkas, dan operasi data. Server Express saat ini tidak dapat dipasang apa adanya; endpoint dan middleware perlu diadaptasi ke runtime Workers.

Supabase Free menyediakan maksimal dua project aktif, sehingga satu project **staging** dan satu project **produksi** menghabiskan seluruh kuota. Masing-masing dibatasi 500 MB database dan 1 GB storage, tidak memiliki automatic backup, serta akan dipause setelah satu minggu tidak aktif.[1] [11] Backup logical manual terjadwal harus menjadi kewajiban operasional; Supabase secara eksplisit menyarankan project Free rutin diekspor dengan `supabase db dump` dan disimpan di lokasi terpisah.[11]

Rencana nama host adalah `staging.sabanachips.biz.id` untuk pengujian dan `faktur.sabanachips.biz.id` untuk produksi. Perubahan DNS dan deployment produksi tidak akan dilakukan sebelum autentikasi, database, storage, impor, email, PDF, dan alur cetak lulus uji pada staging.

## Hasil audit kode untuk migrasi

Kode saat ini masih terikat pada MySQL dan runtime Express. Konfigurasi Drizzle memakai dialek `mysql`, `server/db.ts` memakai driver `drizzle-orm/mysql2`, dan terdapat beberapa operasi spesifik MySQL seperti `onDuplicateKeyUpdate()` serta pembacaan `insertId`. Operasi pencarian `like()` dapat dipertahankan secara konseptual, tetapi skema, kolom auto-increment, dan operasi upsert harus dikonversi ke sintaks PostgreSQL (`onConflictDoUpdate()` dan pola `returning()`).

| Area | Kondisi saat ini | Perubahan untuk target gratis |
|---|---|---|
| ORM dan skema | Drizzle MySQL + `mysql2` | Ubah ke dialek PostgreSQL dan driver yang kompatibel dengan Supabase |
| API | Express + tRPC Node server | Adaptasi router tRPC ke fetch handler di Cloudflare Worker atau ganti pemanggilan data ke Supabase API secara bertahap |
| Autentikasi | Manus OAuth dan cookie sesi platform | Pindah ke Supabase Auth dan JWT terverifikasi pada Worker |
| Penyimpanan | Helper presigned URL platform | Pindah ke bucket Supabase Storage dengan RLS dan signed URL |
| Beban berat | PDF dan Excel sudah dijalankan secara dinamis di klien | Pertahankan di browser agar Worker Free tidak terkena batas CPU 10 ms |

Migrasi dilakukan pada branch staging dan tidak akan mengubah deployment aktif atau database aktif. Sebelum data nyata disalin, skema PostgreSQL, keamanan RLS, dan seluruh alur kritis akan diuji memakai staging kosong.

Untuk runtime gratis, pendekatan koneksi yang dipilih adalah **`@supabase/supabase-js` melalui API HTTPS** dari Cloudflare Worker, bukan koneksi PostgreSQL langsung. Dokumentasi Cloudflare menyatakan bahwa pendekatan ini memakai Supabase URL dan anon key sebagai Worker secrets, sedangkan Supabase menegaskan `supabase-js` berkomunikasi via PostgREST sehingga tidak menambah masalah koneksi database.[12] [13] Kunci service role, bila diperlukan pada operasi internal, hanya boleh hidup sebagai secret di Worker dan tidak boleh dikirim ke browser karena ia dapat melewati RLS.[13]

## Status akses awal

Sesi GitHub pengguna terverifikasi aktif pada organisasi/akun `sabanachips-dev`, dashboard Cloudflare dapat diakses, dan dashboard Supabase pada organisasi Free pengguna juga aktif. Saat pemeriksaan awal, Supabase menunjukkan satu project aktif, sehingga masih tersedia satu slot Free untuk project staging sebelum batas dua project aktif tercapai.[1] Repositori GitHub privat kemudian telah dibuat dan riwayat kode berhasil diunggah. Formulir project Supabase staging telah diisi dengan nama `faktur-staging`; password database acak dibuat langsung pada Supabase tanpa dicatat pada dokumen atau repository. Data API aktif, ekspos otomatis tabel baru nonaktif, dan automatic RLS aktif saat permintaan pembuatan project dikirim. Worker, Pages deployment, dan record DNS juga belum dibuat maupun diubah. Pembuatan sumber daya eksternal dan perubahan DNS akan meminta persetujuan eksplisit sebelum dijalankan.

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
[8]: https://vercel.com/docs/domains/working-with-domains/add-a-domain "Adding & Configuring a Custom Domain"
[9]: https://vercel.com/kb/guide/cloudflare-with-vercel "Using Cloudflare with Vercel"
[10]: https://developers.cloudflare.com/workers/platform/limits/ "Cloudflare Workers Limits"
[11]: https://supabase.com/docs/guides/platform/backups "Supabase Database Backups"
[12]: https://developers.cloudflare.com/workers/databases/third-party-integrations/supabase/ "Supabase on Cloudflare Workers"
[13]: https://supabase.com/partners/catalog/cloudflare?tab=cloudflare-workers "Cloudflare Works With Supabase"
