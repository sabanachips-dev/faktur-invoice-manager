# Validasi Isolasi Organisasi — 26 Agustus 2026

Fondasi organisasi telah diverifikasi dengan **1 organisasi** dan **1 membership owner**. Semua profil bisnis, klien, katalog, invoice, dan aktivitas lama sudah memiliki `organizationId`; tidak ada nilai tenant yang kosong pada data tersebut.

Migrasi `20260826_000013_organization_data_isolation.sql` berhasil diterapkan setelah Worker yang memahami organisasi aktif dirilis. Migrasi ini mengganti RLS inti dari batas `userId` menjadi `organizationId`, memperbarui fungsi invoice atomik, impor, pemenuhan/pengiriman, serta query invoice publik.

Validasi yang masih perlu dilakukan sebelum menyatakan fondasi multi-tenant siap digunakan oleh banyak pengguna adalah pemeriksaan policy produksi, advisor keamanan, uji alur Sabana Chips saat login, dan uji negatif lintas organisasi dengan akun uji yang dibersihkan kembali. Antarmuka manajemen anggota, undangan, dan pemilih organisasi belum dirilis pada tahap ini.

Pada produksi, Dashboard Sabana Chips berhasil memuat ringkasan dan satu invoice yang ada. Daftar Invoice juga berhasil memuat `INV-2026-001` setelah RLS organisasi diaktifkan. Verifikasi struktur policy menunjukkan setiap tabel inti memiliki policy organisasi dan tidak ada policy lama berakhiran `_own` yang tersisa.

Halaman Klien juga berhasil memuat tiga klien Sabana Chips. Halaman Katalog kemudian berhasil memuat tiga produk dengan harga dan diskon yang tersimpan. Validasi ini mencakup alur baca inti; pengujian tulis sengaja belum dijalankan pada data produksi untuk menghindari pembuatan data bisnis uji.

Advisor keamanan Supabase menandai fungsi invoice publik dan helper RLS `SECURITY DEFINER` yang dapat dipanggil oleh peran terkait. Akses invoice publik memang disengaja untuk fitur tautan invoice; helper RLS hanya mengembalikan konteks pemanggil. Peringatan leaked-password protection tetap ada dan merupakan backlog keamanan yang belum diaktifkan.
