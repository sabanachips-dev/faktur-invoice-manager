# Catatan Validasi Staging

## 24 Agustus 2026

| Pemeriksaan | Hasil | Catatan |
| --- | --- | --- |
| Worker staging dapat dibuka | Lulus | `https://faktur-invoice-manager-staging.sabanachips.workers.dev` merespons dan memuat aplikasi. |
| Sesi Supabase | Lulus | Akun Supabase yang telah login tampil pada sidebar staging. |
| API data dashboard | Lulus | Dashboard memuat metrik nol, grafik, dan kondisi kosong setelah procedure `dashboard.get` dipindahkan ke Worker. |
| API daftar invoice | Lulus | Halaman Invoice memuat filter serta kondisi kosong tanpa skeleton setelah procedure pembacaan invoice dipindahkan ke Worker. |
| Dashboard dengan data hasil impor | Lulus | Dashboard staging akun Supabase memuat 19 invoice bulan ini, total Rp 18.482.160, rekap batch 16 toko, dan invoice terbaru setelah data valid diimpor. |
| Daftar invoice dengan data hasil impor | Lulus | Halaman Invoice menampilkan 20 invoice, status, klien, tanggal, nilai, serta aksi lihat/duplikasi/status/hapus tanpa skeleton atau error API. |
| Preview invoice hasil impor | Lulus | Preview invoice `INV-2026-020` memuat klien, alamat kirim, tiga item rekap 16 toko, diskon, total, rekening, serta aksi edit/copy/cetak/link/PDF. |
| Direktori klien hasil impor | Lulus | Halaman Klien menampilkan enam data klien hasil impor serta aksi cari, tambah, pilih detail, dan edit. |
| Katalog hasil impor | Lulus | Halaman Katalog menampilkan tiga item hasil impor dengan harga dan aksi cari, tambah, edit, serta hapus. |
| Pengaturan bisnis hasil impor | Lulus | Halaman Pengaturan memuat nama bisnis, telepon, alamat, rekening, warna, template, dan kontrol unggah logo Supabase. |
| Pembersihan data demo | Lulus | Setelah snapshot tambahan, staging hanya menyisakan empat klien bernama Fresh dan tiga produk; invoice, item, dan aktivitas demo telah dihapus dalam satu transaksi. |
| Dashboard setelah pembersihan | Lulus | Dashboard staging memuat 0 invoice dan Rp 0, menampilkan grafik nol serta keadaan kosong tanpa error API. |
| Daftar invoice setelah pembersihan | Lulus | Halaman Invoice menampilkan keadaan kosong dan tidak menampilkan invoice demo. |
| Daftar klien setelah pembersihan | Lulus | Halaman Klien hanya menampilkan empat entri yang namanya mengandung Fresh. |
| Katalog setelah pembersihan | Lulus | Halaman Katalog tetap menampilkan tiga produk yang dipertahankan dan dapat digunakan saat membuat invoice baru. |
| Pengujian regresi pascapembersihan | Lulus | Seluruh 40 berkas pengujian dan 76 pengujian lulus; pemeriksaan TypeScript selesai tanpa error. |

Tahap berikutnya adalah memverifikasi halaman data lain dan alur staging dengan data hasil impor. Deployment Manus tetap tidak disentuh dan berfungsi sebagai fallback.
