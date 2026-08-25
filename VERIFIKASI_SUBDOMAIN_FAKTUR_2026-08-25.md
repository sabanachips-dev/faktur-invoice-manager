# Verifikasi Subdomain Faktur

## Hasil Pengikatan

Subdomain **`faktur.sabanachips.biz.id`** telah diikat ke Worker **`faktur-invoice-manager-staging`** setelah persetujuan pemilik. Zona `sabanachips.biz.id` aktif di Cloudflare dan tidak memiliki record subdomain yang berkonflik sebelum pengikatan dilakukan. Domain utama, nameserver, record email, aplikasi Manus fallback, dan data invoice tidak diubah.

| Pemeriksaan | Hasil |
|---|---|
| Custom domain Worker | Aktif untuk `faktur.sabanachips.biz.id` |
| Sertifikat HTTPS | Aktif dan lolos verifikasi TLS |
| Halaman utama | Respons HTTP 200 dari Cloudflare |
| Header perlindungan browser | `nosniff`, frame, referrer, permissions, dan opener policy terlihat pada respons custom domain |
| Invoice publik | Halaman invoice, status pesanan, dan kontrol PDF/cetak tampil pada custom domain |
| Halaman masuk | Form email/sandi, magic link, dan Google tampil pada custom domain |

## Catatan Sesi Masuk

Sesi browser pada hostname Worker staging tidak otomatis berpindah ke hostname `faktur.sabanachips.biz.id`; ini normal karena penyimpanan sesi dipisahkan per domain. Pengguna perlu masuk sekali pada subdomain baru. Pengiriman magic link dan login kata sandi perlu diuji menggunakan akun pemilik sebelum subdomain dibagikan secara luas.

## Langkah Berikutnya

1. Masuk ke `https://faktur.sabanachips.biz.id` dengan akun aplikasi yang biasa digunakan.
2. Setelah email bisnis dan nomor rekening dilengkapi, kirim satu invoice uji ke alamat yang dikendalikan pemilik.
3. Lakukan uji cetak fisik sebagai langkah terakhir, lalu simpan foto hasilnya untuk penilaian margin.
