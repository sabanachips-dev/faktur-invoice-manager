# Validasi Isolasi Organisasi — 26 Agustus 2026

Fondasi organisasi telah diverifikasi dengan **1 organisasi** dan **1 membership owner**. Semua profil bisnis, klien, katalog, invoice, dan aktivitas lama sudah memiliki `organizationId`; tidak ada nilai tenant yang kosong pada data tersebut.

Migrasi `20260826_000013_organization_data_isolation.sql` berhasil diterapkan setelah Worker yang memahami organisasi aktif dirilis. Migrasi ini mengganti RLS inti dari batas `userId` menjadi `organizationId`, memperbarui fungsi invoice atomik, impor, pemenuhan/pengiriman, serta query invoice publik.

Validasi yang masih perlu dilakukan sebelum menyatakan fondasi multi-tenant siap digunakan oleh banyak pengguna adalah pemeriksaan policy produksi, advisor keamanan, uji alur Sabana Chips saat login, dan uji negatif lintas organisasi dengan akun uji yang dibersihkan kembali. Antarmuka manajemen anggota, undangan, dan pemilih organisasi belum dirilis pada tahap ini.

Pada produksi, Dashboard Sabana Chips berhasil memuat ringkasan dan satu invoice yang ada. Daftar Invoice juga berhasil memuat `INV-2026-001` setelah RLS organisasi diaktifkan. Verifikasi struktur policy menunjukkan setiap tabel inti memiliki policy organisasi dan tidak ada policy lama berakhiran `_own` yang tersisa.

Halaman Klien juga berhasil memuat tiga klien Sabana Chips. Halaman Katalog kemudian berhasil memuat tiga produk dengan harga dan diskon yang tersimpan. Validasi ini mencakup alur baca inti; pengujian tulis sengaja belum dijalankan pada data produksi untuk menghindari pembuatan data bisnis uji.

Saat membuka Pengaturan setelah rilis antarmuka tim, browser menerima error modul dinamis untuk berkas aset Settings dengan hash rilis lama. Temuan ini menunjukkan cache aset klien belum melakukan fallback ke rilis baru dan harus diperbaiki sebelum panel tim dapat divalidasi.

Perbaikan cache service worker kemudian diterapkan dengan mengecualikan aset Vite ber-hash dari strategi cache-first. Setelah memuat ulang URL Pengaturan, halaman berhasil memuat: nama ruang kerja aktif, badge Pemilik, pemilih ruang kerja, satu anggota organisasi, form undangan role Staf/Admin, dan daftar undangan tertunda semuanya tampil pada produksi.

Pemilik memutuskan untuk menunda pengujian dengan akun email kedua. Karena itu, pengujian penegakan role pada Worker dan pemeriksaan produksi satu akun telah dilakukan, tetapi verifikasi end-to-end undang → terima → pindah organisasi → penolakan data lintas organisasi tetap dicatat sebagai prasyarat sebelum menyatakan kesiapan SaaS publik.

Uji dua akun kemudian dimulai dengan membuat undangan role Staf untuk akun kedua yang disetujui pemilik. Halaman undangan menolak sesi pemilik awal dengan pesan bahwa email tidak sesuai, sebagaimana diharapkan. Setelah pemilik menyatakan telah beralih akun, halaman yang sama masih menunjukkan penolakan email; status sesi akun kedua perlu diverifikasi kembali sebelum undangan dapat diterima.

Sesi kemudian berhasil diverifikasi sebagai akun kedua. Saat tautan undangan dibuka kembali, penerimaan berjalan otomatis dan workspace berubah ke organisasi Sabana Chips pemilik awal. Dashboard akun kedua menampilkan satu invoice milik organisasi tersebut; ini membuktikan undangan yang beralamat-email sesuai dapat diterima dan organisasi aktif berpindah setelah penerimaan.

Pada Pengaturan akun kedua, workspace organisasi pemilik menampilkan role Staf, dua anggota terlihat, dan kontrol undangan tidak ditampilkan. Akun kedua juga memiliki workspace pribadi hasil provisioning saat registrasi; pemilih workspace menyediakan jalur untuk berpindah dan membandingkan data organisasi tanpa membuat atau mengubah data bisnis.

Akun kedua kemudian dipindahkan ke workspace pribadinya. Dashboard segera memuat ulang dan menunjukkan nol invoice serta seluruh metrik transaksi nol, sementara dashboard organisasi pemilik sebelumnya menampilkan satu invoice. Perbedaan ini merupakan bukti end-to-end bahwa data invoice tidak terbawa melewati batas organisasi aktif.

Setelah pemuatan ulang halaman yang terpisah, dashboard workspace pribadi akun kedua kembali menunjukkan nol invoice dan nol metrik. Hasil ini mengonfirmasi bahwa tampilan kosong bukan sekadar keadaan transien setelah perpindahan workspace.

Daftar Invoice pada workspace pribadi akun kedua menampilkan keadaan kosong tanpa invoice organisasi pemilik. Daftar Klien juga menampilkan keadaan kosong tanpa klien organisasi pemilik. Kedua pemeriksaan bersifat baca-saja dan menambah bukti bahwa data transaksi serta data pelanggan mengikuti organisasi aktif.

Katalog pada workspace pribadi akun kedua juga menampilkan keadaan kosong. Dengan demikian, tiga kelompok data utama yang diuji secara baca-saja—invoice, klien, dan katalog—tidak bocor dari organisasi pemilik ke workspace pribadi akun kedua.

Sesi pemilik awal kemudian diverifikasi kembali pada organisasi asal, yang tetap menampilkan satu invoice. Pengaturan tim menampilkan tepat dua anggota sebelum pembersihan: pemilik dan akun kedua ber-role Staf. Tidak ada invoice, klien, katalog, maupun konfigurasi bisnis yang diubah selama seluruh uji dua akun.

Advisor keamanan Supabase menandai fungsi invoice publik dan helper RLS `SECURITY DEFINER` yang dapat dipanggil oleh peran terkait. Akses invoice publik memang disengaja untuk fitur tautan invoice; helper RLS hanya mengembalikan konteks pemanggil. Peringatan leaked-password protection tetap ada dan merupakan backlog keamanan yang belum diaktifkan.
