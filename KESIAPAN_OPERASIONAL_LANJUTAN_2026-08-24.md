# Kesiapan Operasional Lanjutan

## Ringkasan

Pemeriksaan ini dilakukan setelah pembersihan klien duplikat dan sebelum uji cetak fisik. Tidak ada domain, data invoice, atau aplikasi fallback yang diubah. Akun aplikasi terhubung ke Supabase Auth dan profil bisnis inti tersedia, tetapi terdapat data operasional yang masih perlu dilengkapi pemilik.

| Area | Hasil | Tindakan |
|---|---|---|
| Identitas bisnis, alamat, telepon | Tersedia | Tidak ada tindakan teknis. |
| Email bisnis | Belum tersedia di profil bisnis | Lengkapi sebelum invoice dibagikan ke pelanggan. |
| Nama bank dan pemilik rekening | Tersedia | Tidak ada tindakan teknis. |
| Nomor rekening | Belum tersedia di profil bisnis | Lengkapi sebelum invoice dibagikan sebagai instruksi pembayaran. |
| Logo bisnis | Belum tersedia | Opsional; unggah bila diperlukan untuk konsistensi merek. |
| Nomor invoice | Tersedia | Format otomatis tersedia. |
| Tautan akun ke Supabase Auth | Tersedia | Metode email/sandi atau magic link tetap menjadi jalur masuk utama. |

## Penguatan Database yang Diterapkan

Migrasi `20260824_000011_operational_hardening.sql` telah diterapkan ke Supabase staging. Helper `current_faktur_user_id` tidak lagi dapat dipanggil oleh anon, sementara dua fungsi internal yang hanya diperlukan trigger (`handle_auth_user_created` dan `rls_auto_enable`) tidak lagi dapat dipanggil lewat API oleh anon maupun pengguna terautentikasi. Fungsi `get_public_invoice` tetap dapat dipanggil secara anonim karena merupakan dasar tautan invoice pelanggan.

Tiga indeks ditambahkan pada relasi invoice dan item invoice. Kebijakan RLS pengguna juga diperbarui agar identitas autentikasi dapat dievaluasi sekali per pernyataan. Seluruh regresi setelah migrasi lulus: **44 berkas / 87 pengujian**, pemeriksaan TypeScript lulus, halaman invoice publik dan health endpoint staging tetap merespons.

## Sinyal Advisor Setelah Penguatan

| Jenis | Status | Interpretasi |
|---|---|---|
| SECURITY DEFINER trigger/helper internal | Diperbaiki | Peringatan untuk trigger/helper internal sudah hilang dari advisor. |
| Invoice publik | Dipertahankan dengan sadar | Peringatan tersisa karena fungsi public invoice memang harus dapat dipanggil tanpa login, dengan public ID yang dibagikan ke penerima. |
| Helper identitas pengguna | Dipertahankan untuk RLS | Peringatan tersisa untuk peran authenticated karena helper dibutuhkan kebijakan RLS saat membaca data milik sendiri. Pemindahan ke schema non-API dapat menjadi hardening lanjutan setelah regresi sesi terautentikasi lengkap. |
| Leaked password protection | Belum aktif | Aktifkan di pengaturan Auth Supabase sebelum cutover jika akun memakai kata sandi. |
| Performa | Tidak ada peringatan tingkat WARN | Sisa advisor hanya informasi indeks belum dipakai pada database yang masih kecil; indeks baru dipertahankan untuk pertumbuhan data. |

Supabase merekomendasikan akses fungsi diberikan hanya kepada peran yang memang memerlukannya, sedangkan RLS mengatur baris data yang dapat diakses.[1] Fungsi SECURITY DEFINER juga perlu ditinjau secara hati-hati, khususnya bila berada pada schema yang diekspos API.[2]

## Urutan Tindak Lanjut

1. Lengkapi **email bisnis** dan **nomor rekening** di Pengaturan.
2. Aktifkan **Leaked Password Protection** pada Supabase Auth jika login kata sandi akan digunakan.
3. Uji masuk ulang dengan metode yang dipilih pemilik dan kirim satu email invoice ke alamat uji.
4. Lakukan **uji cetak fisik sebagai langkah terakhir**, lalu kirim foto hasilnya untuk penilaian margin dan potongan.

## Referensi

[1]: https://supabase.com/docs/guides/api/securing-your-api "Supabase — Securing your API"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"
