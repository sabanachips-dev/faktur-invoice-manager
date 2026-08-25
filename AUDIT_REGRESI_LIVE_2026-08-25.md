# Audit Regresi Live — Faktur

**Tanggal audit:** 25 Agustus 2026  
**Domain:** `https://faktur.sabanachips.biz.id`  
**Cakupan:** alur data utama, UI terautentikasi, rute invoice publik tidak valid, PWA, header HTTP, serta build dan test suite.

## Ringkasan

Audit ulang dilakukan setelah perbaikan halaman **Buat Faktur** versi ponsel. Tidak ditemukan kegagalan aplikasi yang dapat direproduksi pada alur inti yang diperiksa. Audit dilakukan secara baca-saja: tidak ada invoice, klien, status pengiriman, profil bisnis, ataupun pengaturan yang diubah.

| Area | Hasil |
|---|---|
| Dashboard | Metrik, status pesanan, grafik, dan invoice terbaru termuat setelah pemuatan awal. |
| Invoice | Daftar, filter, ekspor, preview invoice aktual, copy link, PDF, dan status pengiriman tersedia. |
| Klien dan katalog | Daftar, pencarian, serta kontrol tambah/edit tersedia. |
| Kanban dan pengiriman | Kolom pemenuhan, kartu invoice, cek ongkir, dan cek resi termuat. |
| Rute publik salah | `/p/:publicId` menampilkan pesan tautan tidak valid tanpa error API. |
| PWA dan Android association | HTTPS, manifest, service worker, dan Digital Asset Links mengembalikan HTTP 200. |

## Verifikasi Teknis

| Pemeriksaan | Hasil |
|---|---|
| Suite unit/regresi | 48 berkas, 97 pengujian lulus |
| Pemeriksaan TypeScript | Lulus |
| Build Cloudflare | Lulus |
| Manifest PWA | `200 application/manifest+json` |
| Service worker | `200 text/javascript`, cache tidak disimpan permanen |
| Digital Asset Links | `200 application/json`, cache tidak disimpan permanen |
| Header browser | `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, dan `Cross-Origin-Opener-Policy` aktif |

## Temuan

Audit PWA mencatat respons `405` pada `POST /__manus__/logs`. Diagnosis menunjukkan ini adalah endpoint pencatatan debug eksternal, bukan endpoint Faktur, Worker, atau Supabase. Karena tidak memengaruhi data aplikasi maupun alur pengguna, tidak ada perubahan kode Faktur yang diperlukan.

Vite tetap memberikan peringatan ukuran bundle utama. Ini bukan error build dan rute operasional besar sudah dimuat secara tertunda; pengurangan bundle tambahan dapat dijadikan optimasi terpisah, bukan perbaikan insiden.

## Batas Audit dan Tindak Lanjut

Halaman **Buat Faktur** telah dikonfirmasi pemilik pada ponsel. Pemeriksaan visual ponsel untuk Dashboard, daftar invoice, dan pengiriman masih sebaiknya dilakukan saat digunakan di perangkat pemilik berikutnya. Uji instalasi APK, tampilan layar penuh Trusted Web Activity, serta login Google dan magic link pada APK tetap membutuhkan perangkat Android fisik yang kompatibel.
