# Persiapan Google OAuth

## Status Saat Ini

Provider Google pada Supabase project Faktur masih berstatus **Disabled**. Provider Email dan magic link telah aktif serta tervalidasi pada `faktur.sabanachips.biz.id`, sehingga Google OAuth dapat ditambahkan sebagai metode masuk tambahan tanpa mengganti jalur yang sudah berjalan.

Halaman provider Google Supabase telah dibuka dan siap untuk konfigurasi setelah kredensial Google Cloud tersedia.

## Kebutuhan Konfigurasi

Google OAuth membutuhkan OAuth Client bertipe **Web application** dari Google Cloud. Setelah kredensial tersedia, nilai Client ID dan Client Secret dimasukkan pada provider Google di Supabase, provider diaktifkan, dan perubahan disimpan. Callback yang ditampilkan oleh halaman provider Supabase harus disalin persis ke daftar redirect URI resmi pada konfigurasi Google Cloud.

## Batas Keamanan

Client Secret tidak akan ditulis ke repository, dokumentasi proyek, atau chat. Pemilik akan memasukkannya langsung pada halaman provider Google di Supabase ketika halaman tersebut sudah terbuka. Pengujian akhir dilakukan dengan akun Google pemilik dan tidak mengubah invoice maupun profil bisnis.

## Hasil Penerapan dan Validasi

OAuth Client Web bernama **Faktur Web** telah dibuat pada project Google Cloud Faktur OAuth. Konfigurasinya memakai origin `https://faktur.sabanachips.biz.id` dan callback Supabase project Faktur. Client ID dan Client Secret dipasang langsung oleh pemilik pada provider Google Supabase; secret tidak disimpan pada repository atau catatan ini.

Provider Google kemudian terverifikasi aktif melalui endpoint pengaturan Supabase. Pengujian masuk dilakukan pada `https://faktur.sabanachips.biz.id`: pengguna keluar dari sesi magic link, memilih masuk melalui Google, lalu berhasil kembali ke Dashboard. Magic link dan Google OAuth kini sama-sama berfungsi pada subdomain Faktur.
