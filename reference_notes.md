# Catatan Referensi Visual

Referensi menggunakan tata letak aplikasi manajemen dengan sidebar putih berlebar tetap, konten utama pada latar abu-abu sangat muda, dan aksen biru tua untuk navigasi aktif serta aksi utama. Tabel invoice memakai header bersih, garis pemisah tipis, status badge berwarna, dan aksen merah tipis di sisi invoice yang jatuh tempo.

Preview invoice diwujudkan sebagai dokumen A4 putih dengan border/shadow ringan, toolbar aksi horizontal di atasnya, tipografi hierarkis, serta total beraksen biru tua. Komposisi dokumen menempatkan identitas bisnis, nomor invoice, pihak penagihan, item, ringkasan nilai, catatan, dan informasi pembayaran secara berurutan dan mudah dipindai.

## Catatan Verifikasi

Pratinjau aplikasi tanpa sesi aktif menampilkan layar masuk Faktur dengan benar, termasuk tombol untuk memulai autentikasi. Halaman internal sengaja memerlukan autentikasi; setelah masuk, dashboard dan seluruh area manajemen akan tersedia. Pemeriksaan tipe dan unit test berhasil sebelum verifikasi visual ini dilakukan.

Verifikasi desktop memperlihatkan dashboard, daftar invoice, editor invoice, klien, katalog, dan pengaturan berhasil dirender pada keadaan data kosong tanpa elemen yang saling bertumpuk. Editor menampilkan nomor default `INV-2026-001`, nilai pajak 11%, tabel item, dan ringkasan total dengan jelas. Verifikasi mobile memperlihatkan dashboard tersusun menjadi satu kolom yang tetap terbaca. Sidebar yang diposisikan tetap tidak muncul dalam tangkapan halaman penuh karena krom tetap disembunyikan saat proses tangkapan, bukan karena navigasi dihilangkan dari aplikasi.

## Verifikasi Pembaruan Laporan dan Cetak

Pratinjau desktop yang terautentikasi memperlihatkan pemilih periode **Bulan ini** pada dashboard dan keterangan grafik yang berubah mengikuti rentang aktif. Daftar invoice memperlihatkan tombol **CSV** serta **Excel** di samping tombol pembuatan invoice dan tetap mempertahankan seluruh filter yang ada. Kontrol cetak tersedia pada toolbar preview invoice dan halaman invoice publik; ia membuka pemilih ukuran A4, Letter, A5, atau struk 80 mm sebelum menyerahkan pemilihan printer—termasuk printer portabel yang telah tersambung—kepada dialog cetak sistem operasi.
