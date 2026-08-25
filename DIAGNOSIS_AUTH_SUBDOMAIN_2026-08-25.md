# Diagnosis Login Subdomain Faktur

## Temuan

Pemeriksaan dilakukan setelah `faktur.sabanachips.biz.id` aktif dan tidak mengubah konfigurasi Auth.

| Jalur masuk | Penyebab terverifikasi | Dampak |
|---|---|---|
| Magic link | Supabase Auth hanya memiliki `https://faktur-invoice-manager-staging.sabanachips.workers.dev` sebagai Site URL dan Additional Redirect URL. | Redirect ke `https://faktur.sabanachips.biz.id` yang dikirim aplikasi tidak diizinkan. |
| Google | Provider Google berstatus nonaktif pada endpoint Auth (`google: false`). | Tombol Google memanggil Supabase, tetapi provider menolak otorisasi karena belum dikonfigurasi. |
| Kode aplikasi | Komponen login menggunakan `window.location.origin` untuk magic link dan Google OAuth. | Kode sudah mengarahkan ke hostname aktif dengan benar; tidak memerlukan perubahan untuk custom domain. |

## Perubahan yang Diperlukan

Konfigurasi URL Auth perlu mempertahankan URL Worker staging agar alur lama tidak putus dan menambahkan `https://faktur.sabanachips.biz.id`. Site URL dapat dipindahkan ke custom domain setelah URL tersebut dimasukkan ke allow list.

Google OAuth memerlukan konfigurasi provider Google di Supabase, termasuk Client ID dan Client Secret dari Google Cloud. Redirect URI yang harus diizinkan pada konfigurasi OAuth Google adalah endpoint callback Supabase milik proyek. Tidak ada kredensial Google yang tersimpan dalam aplikasi saat ini.

## Batas Verifikasi

Magic link tidak dikirim ulang selama diagnosis agar tidak membuat email yang tidak diminta. Sesudah konfigurasi URL diperbarui, pemilik perlu menguji satu magic link pada custom domain. Google OAuth baru dapat diuji setelah provider diaktifkan dengan kredensial yang benar.

## Status Penerapan

Pada halaman URL Configuration Supabase, nilai Site URL baru telah diisikan sebagai `https://faktur.sabanachips.biz.id`, tetapi belum disimpan. URL redirect custom domain masih perlu ditambahkan terlebih dahulu agar URL staging lama dan custom domain sama-sama diizinkan.

Pemilik kemudian mengonfirmasi bahwa perubahan URL Auth telah disimpan. Halaman Sign In / Providers Supabase menegaskan bahwa provider Email aktif dan provider Google masih nonaktif. Pengiriman magic link uji berikutnya memerlukan persetujuan pemilik karena akan mengirim email ke akun pengguna.

## Hasil Validasi Magic Link

Satu magic link uji dikirim setelah persetujuan pemilik dengan redirect ke `https://faktur.sabanachips.biz.id`. Supabase menerima permintaan dengan HTTP 200, dan pengguna berhasil masuk ke Dashboard pada subdomain baru. Hal ini mengonfirmasi bahwa URL Auth custom domain, email provider, redirect, dan pembentukan sesi browser telah berfungsi.

Google OAuth tetap belum aktif. Untuk mengaktifkannya, pemilik perlu membuat atau menyediakan OAuth Client ID dan Client Secret Google Cloud, lalu memasukkannya pada provider Google di Supabase.

Status terakhir: Google OAuth telah dikonfigurasi, provider Google aktif, dan login Google berhasil mengembalikan pengguna ke Dashboard Faktur pada custom domain.
