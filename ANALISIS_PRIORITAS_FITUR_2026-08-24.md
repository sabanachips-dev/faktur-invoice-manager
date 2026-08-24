# Analisis Prioritas Fitur Faktur

Tanggal: 24 Agustus 2026  
Status: **Siap untuk keputusan produk sebelum implementasi**

Dokumen ini menerjemahkan dua spesifikasi yang diberikan pengguna menjadi rencana yang sesuai dengan aplikasi Faktur saat ini. Tujuannya adalah membedakan fitur yang layak dikerjakan segera pada staging dari perubahan yang perlu dirancang sebagai tahap SaaS terpisah.

## Kesimpulan Utama

Fitur **diskon per item** adalah peningkatan yang paling siap dikerjakan sekarang. Kebutuhan bisnisnya telah jelas, fondasi katalog serta invoice sudah tersedia, dan manfaatnya langsung terasa untuk pembuatan invoice asli. Fitur ini dapat ditambahkan tanpa mengubah domain aktif atau mengubah aplikasi Manus.

Roadmap SaaS dan online seller sangat relevan sebagai arah jangka panjang. Namun, fitur seperti multi-tenant, paket langganan, role pengguna, payment gateway, WhatsApp API, QRIS otomatis, stok, dan integrasi kurir memiliki ketergantungan bisnis serta teknis yang lebih besar. Fitur tersebut sebaiknya tidak digabungkan dalam satu rilis dengan diskon per item.

> Rekomendasi utama: selesaikan diskon per item sebagai rilis staging pertama, lalu pilih maksimal tiga sampai lima kebutuhan operasional yang paling penting untuk bisnis pengguna sebelum membangun kemampuan SaaS umum.

## 1. Kesenjangan antara Spesifikasi dan Aplikasi Saat Ini

| Area | Kondisi aplikasi saat ini | Penyesuaian yang diperlukan |
|---|---|---|
| Diskon invoice | Tersedia pada level invoice sebagai nominal atau persentase. | Tetap dipertahankan sebagai diskon tambahan setelah subtotal semua item. |
| Diskon katalog | Belum tersedia. | Tambahkan default diskon per produk. |
| Diskon item invoice | Belum tersedia; item hanya memiliki produk, deskripsi, kuantitas, harga satuan, subtotal, dan urutan. | Tambahkan tipe, nilai, dan nilai potongan aktual per baris item. |
| Perhitungan | Subtotal dihitung dari `kuantitas × harga`; kemudian diskon invoice dan pajak diterapkan. | Hitung diskon item dahulu, jumlahkan subtotal bersih item, lalu diskon invoice dan pajak. |
| Duplikasi invoice | Mendukung penyalinan produk, jumlah, dan harga. | Salin diskon setiap item secara utuh. |
| Invoice massal | Membuat invoice toko dari satu invoice sumber. | Diskon item ikut terbawa dari source invoice secara otomatis. |
| Impor spreadsheet | Mendukung detail invoice dan item. | Tambahkan kolom diskon per item dan validasi baris. |
| PDF, preview, publik, cetak | Menampilkan daftar item dan total. | Tampilkan potongan item secara transparan pada semua dokumen. |
| Ekspor daftar invoice | Tersedia CSV dan Excel. | Tambahkan ringkasan total diskon item opsional, bukan rincian per baris. |

## 2. Keputusan yang Masih Diperlukan untuk Diskon per Item

Spesifikasi sudah lengkap kecuali satu keputusan operasional. Nilai diskon nominal perlu memiliki arti yang konsisten agar pengguna tidak salah memasukkan angka.

| Keputusan | Pilihan | Rekomendasi |
|---|---|---|
| Arti diskon nominal item | Potongan per unit, atau potongan flat untuk satu baris item. | **Potongan per unit**. Ini konsisten dengan harga satuan dan mudah dipahami saat kuantitas lebih dari satu. Label antarmuka akan berbunyi **“Potongan per unit (Rp)”**. |
| Penamaan teknis | `nominal` atau `amount`. | Gunakan `amount` secara internal agar konsisten dengan diskon invoice yang sudah ada; tampilan pengguna memakai **“Nominal (Rp)”**. |
| Diskon default katalog | Selalu diterapkan atau dapat diubah. | Terapkan sebagai nilai awal yang **dapat diubah/hapus** hanya pada invoice tersebut, tanpa mengubah katalog. |
| Pajak | Dihitung setelah diskon item dan diskon invoice. | **Ya.** Ini konsisten dengan aturan yang diberikan dan total aplikasi saat ini. |

Jika Anda setuju dengan rekomendasi potongan nominal per unit, implementasi dapat dimulai tanpa perubahan desain bisnis lain.

## 3. Rancangan Implementasi Diskon per Item

### 3.1 Data yang Harus Disimpan

Katalog menyimpan default diskon agar item baru otomatis membawa promo aktif. Item invoice menyimpan salinan diskon yang benar-benar dipakai saat invoice dibuat. Penyimpanan pada item invoice penting agar invoice lama tidak berubah ketika promo katalog diperbarui kemudian hari.

| Tabel | Field baru yang direkomendasikan | Tujuan |
|---|---|---|
| `catalogItems` | `discountType`, `discountValue` | Default promo produk. Nilai `none` berarti tidak ada diskon. |
| `invoiceItems` | `discountType`, `discountValue`, `discount` | Tipe/nilai yang dipilih dan nilai potongan rupiah aktual per baris. |

Database staging yang sudah memiliki satu invoice draft akan dimigrasikan aman dengan nilai awal tanpa diskon. Tidak ada data yang akan dihapus.

### 3.2 Urutan Perhitungan

Untuk setiap item, aplikasi menghitung harga kotor, lalu diskon item, dan menyimpan subtotal bersih. Setelah semua subtotal bersih dijumlahkan, diskon invoice opsional diterapkan, lalu pajak dihitung. Tidak ada subtotal item yang boleh menjadi negatif.

```text
harga kotor item = harga satuan × kuantitas
diskon item      = persentase dari harga kotor, atau potongan nominal × kuantitas
subtotal item    = harga kotor item − diskon item

subtotal invoice = jumlah subtotal item
diskon invoice   = diskon tambahan opsional atas subtotal invoice
pajak            = (subtotal invoice − diskon invoice) × tarif pajak
total            = subtotal invoice − diskon invoice + pajak
```

### 3.3 Perubahan Antarmuka

Editor invoice akan memperoleh kontrol diskon pada setiap baris item. Kontrol tersebut berisi pilihan **Tidak ada**, **%**, atau **Nominal (Rp)** beserta input angka. Saat item berasal dari katalog berpromo, nilai awal otomatis muncul dengan indikator **“Promo katalog”**; pengguna tetap dapat mengubahnya.

Daftar katalog akan menampilkan label seperti **“Promo 10%”** atau **“Potongan Rp2.000/unit”**. Preview, PDF, tautan publik, dan cetak akan memperlihatkan harga kotor, potongan, serta subtotal bersih per item bila diskon digunakan.

### 3.4 Operasi yang Ikut Disesuaikan

| Operasi | Perilaku setelah rilis |
|---|---|
| Buat dan edit invoice | Memvalidasi diskon item dan menghitung ulang seluruh total secara atomik. |
| Duplikasi invoice | Menyalin diskon item persis seperti invoice sumber. |
| Invoice massal | Mewarisi diskon item dari invoice sumber untuk semua toko dan rekap. |
| Impor spreadsheet | Membaca tipe serta nilai diskon per item dari kolom tambahan. |
| Riwayat | Tetap mencatat perubahan invoice; detail diskon tersimpan dalam versi invoice terbaru. |
| CSV dan Excel | Dapat menampilkan total diskon item sebagai ringkasan per invoice. |
| Dashboard | Meneruskan total invoice akhir yang sudah benar; tidak membutuhkan desain ulang metrik. |

### 3.5 Validasi dan Pengujian

Rilis hanya disimpan jika validasi berikut lulus: diskon persen 0–100, diskon nominal tidak lebih besar dari harga kotor, nilai katalog default terisi benar, perubahan manual tidak mengubah katalog, duplikasi mempertahankan diskon, impor dan invoice massal konsisten, serta tampilan PDF/publik/cetak menjelaskan potongan item.

Pengujian unit, kontrak Worker, transaksi PostgreSQL, dan satu alur browser lengkap akan ditambahkan. Setelah itu staging akan diperiksa memakai invoice draft nyata sebelum ada cutover.

## 4. Roadmap yang Direkomendasikan

Roadmap dipisahkan berdasarkan sasaran agar investasi tahap awal tidak tercampur antara kebutuhan bisnis pengguna sendiri dan kebutuhan menjual aplikasi sebagai SaaS ke bisnis lain.

### Tahap A — Operasional Bisnis Sendiri

Tahap ini berfokus pada kelancaran penjualan dan penagihan bisnis pengguna. Ini adalah tahap yang paling tepat sebelum domain produksi diarahkan.

| Urutan | Fitur | Nilai bisnis | Ketergantungan |
|---:|---|---|---|
| A1 | Diskon per item dan promo katalog | Perhitungan harga lebih akurat dan transparan. | Keputusan nominal per unit. |
| A2 | Status pesanan yang mudah dipahami | Pembeli dan internal dapat membedakan menunggu bayar, diproses, dikirim, selesai. | Perlu menyepakati status operasional. |
| A3 | Nomor resi dan kurir | Menghubungkan invoice dengan pengiriman nyata. | Dapat dimulai manual tanpa integrasi kurir. |
| A4 | Halaman invoice publik mobile-first dan bukti pembayaran | Meningkatkan kepercayaan pembeli serta memudahkan verifikasi. | Perlu aturan penyimpanan bukti dan proses verifikasi. |
| A5 | Notifikasi WhatsApp atau email | Mempercepat pengiriman invoice dan pengingat. | Memilih penyedia serta memperoleh persetujuan biaya/akun. |

Untuk go-live awal yang sederhana, A1 dan A2 adalah prioritas terbaik. A3 dapat dibuat manual dahulu tanpa bergantung pada layanan eksternal. A4 dan A5 perlu persetujuan kebijakan serta konfigurasi layanan eksternal.

### Tahap B — Efisiensi Tim dan Pelaporan

Tahap ini dibangun setelah alur tagih, bayar, dan kirim stabil.

| Fitur | Nilai | Catatan |
|---|---|---|
| Multi-user dan role | Memisahkan pemilik, finance, sales, dan viewer. | Perlu model anggota bisnis dan audit per pengguna. |
| Reminder terjadwal | Mengurangi invoice terlewat jatuh tempo. | Membutuhkan penjadwalan andal serta saluran notifikasi. |
| Recurring invoice | Mempercepat tagihan berulang. | Membutuhkan job terjadwal dan aturan jatuh tempo. |
| Aging report dan arus kas | Membantu keputusan penagihan. | Menggunakan data status invoice yang sudah rapi. |
| Varian dan stok dasar | Menyesuaikan katalog dengan produk fisik. | Perlu model produk yang lebih kaya. |

### Tahap C — Produk SaaS untuk Banyak Bisnis

Tahap ini baru diperlukan jika aplikasi akan dijual atau dibuka untuk banyak UMKM. Arsitekturnya berbeda dari aplikasi satu bisnis karena setiap tenant harus mempunyai banyak anggota, profil bisnis, data, storage, pengaturan, batas paket, dan audit yang terisolasi.

| Fitur SaaS | Kenapa dipisahkan dari Tahap A/B |
|---|---|
| Multi-tenant dan subdomain per bisnis | Mengubah model kepemilikan data inti serta akses seluruh tabel. |
| Paket, trial, dan billing SaaS | Membutuhkan produk langganan, metering, payment gateway, dan kebijakan penagihan sendiri. |
| White-label dan custom domain pelanggan | Memerlukan manajemen domain, email sender, dan routing per tenant. |
| REST API, webhook, Zapier/Make | Membutuhkan autentikasi API, versi kontrak, rate limit, dan dokumentasi developer. |
| 2FA, audit lengkap, backup mandiri, enkripsi data sensitif | Membutuhkan desain keamanan serta prosedur operasional yang lebih formal. |

## 5. Keputusan Produk yang Dibutuhkan Sekarang

Sebelum implementasi apa pun, mohon jawab tiga hal berikut. Jawaban singkat sudah cukup.

1. Untuk **diskon nominal per item**, setujukah jika artinya **potongan per unit**? Contoh: harga Rp50.000, jumlah 4, potongan Rp2.000 berarti total potongan Rp8.000.
2. Target tahap ini apakah **bisnis Anda sendiri dahulu**, atau ingin langsung menyiapkan produk untuk banyak UMKM? Rekomendasi saya: bisnis sendiri dahulu.
3. Pilih maksimal tiga fitur setelah diskon per item yang paling Anda butuhkan:
   - status pesanan yang lebih lengkap;
   - nomor resi dan kurir manual;
   - halaman invoice publik lebih ramah ponsel serta unggah bukti bayar;
   - notifikasi WhatsApp;
   - QRIS/payment gateway;
   - laporan piutang dan arus kas;
   - stok dan varian produk;
   - multi-user dan role.

Setelah keputusan ini diterima, saya akan menambahkan spesifikasi final ke backlog, lalu mengimplementasikan diskon per item pada staging terlebih dahulu. Domain bisnis dan aplikasi Manus aktif tetap tidak akan diubah dalam proses tersebut.

## Referensi

1. [Spesifikasi Diskon per Item](file:///home/ubuntu/upload/pasted_content.txt)
2. [Roadmap SaaS dan Online Seller](file:///home/ubuntu/upload/pasted_content_2.txt)
