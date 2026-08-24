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
| Editor diskon per item | Lulus | Invoice draft nyata yang sudah ada dapat dibuka setelah migrasi; setiap baris item menampilkan kontrol Tidak ada/Persen/Nominal dan subtotal tetap konsisten tanpa mengubah isi draft. |
| Rilis diskon per item | Lulus | Promo katalog, perhitungan atomik, duplikasi, invoice massal, impor spreadsheet, ekspor ringkasan, preview, PDF, tautan publik, dan cetak telah diperbarui. Seluruh 40 berkas dan 79 pengujian lulus sebelum Worker staging versi `1f36bfcc-5c06-4118-aef4-eb944a83b920` diterbitkan. |
| Status pesanan dan resi manual | Lulus | Preview invoice menampilkan panel terpisah untuk tahap pesanan, kurir, dan nomor resi; invoice lama tetap aman dengan nilai awal Menunggu pembayaran tanpa kurir/resi. Seluruh 41 berkas dan 81 pengujian lulus sebelum Worker staging versi `6e7a86e3-c26d-49d4-b037-1327d7a1d6cd` diterbitkan. |
| Halaman invoice publik pembeli | Lulus | Halaman publik mobile-first kini menampilkan total tagihan, aksi salin nomor invoice, status pesanan, keadaan resi, dan tautan telepon bisnis tanpa membuka data operasional internal. Rilis diterbitkan sebagai Worker staging versi `e12813fb-ecf5-4d50-800e-5600cb4c695f`. |
| Dashboard dan Kanban pesanan | Lulus | Dashboard menampilkan jumlah dan nilai per status pemenuhan, lalu mengarah ke Kanban Board enam kolom. Board menampilkan invoice nyata, kurir/resi, serta pilihan pemindahan tahap yang mewajibkan resi sebelum status Dikirim atau Selesai. |
| Pencarian tujuan cek ongkir | Lulus | Menu Pengiriman berhasil mencari dan menampilkan pilihan wilayah tujuan RajaOngkir dari input kota pada staging; API key tetap berada di server Worker. |
| Cek ongkir dan resi RajaOngkir | Lulus | Cek ongkir nyata antara Payakumbuh dan Jambi Timur untuk 1.000 gram menampilkan beberapa layanan kurir beserta estimasi serta tarif. Cek resi siap dipakai dari menu Pengiriman atau tombol Cek resi di preview invoice; kurir, resi, dan lima digit akhir telepon penerima (jika diminta kurir) diteruskan hanya melalui Worker. Seluruh 43 berkas dan 83 pengujian lulus sebelum Worker staging versi `42964cf4-b51b-4801-bbfd-0d7e12c393cd` diterbitkan. |
| Perbaikan wilayah dan pengalaman cek ongkir | Lulus | Pencarian menerima alias Sumbar dan memetakan ke Sumatera Barat. Tombol Payakumbuh membuka daftar wilayah Payakumbuh yang jelas beserta kecamatan dan kode pos. Input kode kurir dihapus; pengguna kini hanya memilih asal, tujuan, serta berat lalu hasil diurutkan dari ongkir terendah. Worker staging versi `de979be6-5353-40a5-b234-e33403724d67`. |
| Asal default Sabana Chips | Lulus | Setelah satu kelurahan Payakumbuh dipilih, aplikasi menyimpannya pada perangkat sebagai asal Sabana Chips dan menampilkannya kembali pada cek ongkir berikutnya. Pengguna tetap dapat memilih **Ganti asal** kapan saja. Worker staging versi `a5ea9a5f-32d2-458c-a6c6-7c63d07735fd`. |
| Penguatan audit keamanan dan health | Lulus | Header `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, dan `Cross-Origin-Opener-Policy` aktif pada respons Worker maupun aset statis. `/api/health` kini merupakan liveness check Worker cepat; `/api/health/deep` memeriksa Supabase secara eksplisit. Seluruh 43 berkas dan 85 pengujian lulus sebelum Worker staging versi `469d4544-4684-4490-8f54-9bb0c5c696ac` diterbitkan. |
| Kemudahan tabel dan Kanban di ponsel | Lulus | Daftar Invoice dan Kanban Board menampilkan petunjuk geser horizontal khusus layar kecil agar aksi, kolom, dan enam tahap tidak terlewat. |
| Invoice publik pada ponsel | Lulus | Pengujian viewport 375 × 812 piksel tidak menemukan kesalahan konsol maupun overflow horizontal. Tombol utama, status, detail pihak, tabel tiga item, total, dan informasi pembayaran tetap terbaca. |

Audit inti staging telah selesai. Deployment Manus tetap tidak disentuh dan berfungsi sebagai fallback sampai pemilik menyetujui cutover.
