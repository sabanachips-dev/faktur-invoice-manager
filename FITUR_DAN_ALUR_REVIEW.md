# Panduan Review Fitur dan Alur Faktur

Dokumen ini menjelaskan kemampuan aplikasi **Faktur — Invoice Manager** yang saat ini tersedia di staging. Gunakan panduan ini sebagai daftar review sebelum kita menambah atau menyesuaikan fitur. Aplikasi Manus yang lama tetap terpisah dan tidak diubah selama proses review staging ini.

> **Tujuan staging saat ini:** memastikan alur kerja faktur asli sudah sesuai kebutuhan operasional sebelum domain bisnis diarahkan ke aplikasi baru.

## 1. Ringkasan Navigasi

Setelah masuk, menu utama berada pada sidebar kiri. Kelima menu utama adalah Dashboard, Invoice, Klien, Katalog, dan Pengaturan. Halaman turunan seperti editor invoice, invoice massal, impor, riwayat, dan preview memiliki tombol **Kembali** agar pengguna dapat kembali ke halaman asal tanpa kehilangan arah.

| Menu | Fungsi utama | Digunakan ketika |
|---|---|---|
| **Dashboard** | Melihat ringkasan invoice, nilai tagihan, status pembayaran, grafik pendapatan, dan invoice terbaru. | Memulai kerja serta memantau kondisi penagihan. |
| **Invoice** | Membuat, mencari, menyaring, mengubah, menduplikasi, menghapus, mencetak, mengekspor, dan melacak invoice. | Mengelola tagihan sehari-hari. |
| **Klien** | Menyimpan data toko atau pelanggan serta melihat riwayat invoice mereka. | Menambah atau memperbarui tujuan tagihan. |
| **Katalog** | Menyimpan daftar produk atau jasa beserta harga default. | Menyiapkan item yang dapat dipilih cepat dalam invoice. |
| **Pengaturan** | Mengatur identitas bisnis, rekening, pajak, mata uang, format nomor, warna, dan template dokumen. | Menyesuaikan tampilan dan informasi resmi faktur. |

## 2. Alur Kerja Utama yang Direkomendasikan

Alur normal untuk membuat tagihan adalah menyiapkan data dasar terlebih dahulu, kemudian membuat invoice, lalu memantau statusnya. Katalog mempercepat pemilihan barang dan klien menyimpan informasi toko agar tidak perlu diketik ulang.

```text
Pengaturan bisnis → Katalog produk → Klien toko → Buat invoice → Simpan draft / kirim
                                                               ↓
                         Preview → PDF / tautan publik / email / cetak → Pantau di Dashboard
```

Untuk kebutuhan banyak toko dengan isi yang sama, gunakan invoice massal. Untuk banyak invoice yang setiap detailnya dapat berbeda, gunakan impor spreadsheet.

## 3. Dashboard

Dashboard memberi gambaran cepat mengenai arus penagihan. Empat kartu ringkasan menampilkan invoice pada periode terpilih, nilai belum dibayar, nilai lunas, dan nilai yang jatuh tempo. Grafik pendapatan menampilkan invoice yang telah lunas, sedangkan area invoice terbaru memudahkan membuka tagihan terbaru.

Pengguna dapat memilih filter **Bulan ini**, **Bulan lalu**, atau **Tahun ini**. Filter tersebut memengaruhi statistik dan grafik sehingga bermanfaat untuk review penagihan periodik.

| Yang dapat direview | Kondisi saat ini | Pertanyaan untuk Anda |
|---|---|---|
| Kartu ringkasan | Menampilkan jumlah dan nilai invoice berdasarkan periode. | Apakah ada angka lain yang perlu tampil, misalnya omzet per toko atau jumlah barang? |
| Grafik pendapatan | Menampilkan pendapatan invoice lunas sesuai rentang waktu. | Apakah rentang waktu atau bentuk grafik perlu ditambah? |
| Invoice terbaru | Menampilkan daftar invoice yang perlu diperhatikan. | Apakah perlu pengingat jatuh tempo atau status lain? |
| Ringkasan batch | Mendukung rekap invoice massal per kelompok toko. | Apakah format rekap per toko atau per barang perlu diubah? |

## 4. Klien

Halaman Klien digunakan untuk menyimpan data pelanggan atau toko. Data yang dapat dicatat mencakup nama, email, telepon, alamat penagihan, NPWP opsional, dan informasi terkait. Klien dapat dicari, ditambah, diubah, dipilih untuk melihat detail, serta dihapus bila tidak lagi digunakan.

Saat ini staging secara sengaja hanya menyimpan empat entri klien bertema Fresh sebagai data awal. Anda dapat menambah klien asli kapan saja.

### Alur Klien

1. Buka **Klien**.
2. Klik **Tambah klien**.
3. Isi nama toko dan informasi yang ingin disimpan.
4. Simpan. Klien akan langsung tersedia saat membuat invoice.
5. Pilih klien dari daftar untuk meninjau detail dan riwayat invoice terkait.

## 5. Katalog Produk atau Jasa

Katalog adalah daftar produk atau jasa yang dapat dipilih cepat ketika membuat invoice. Setiap item mendukung nama, deskripsi, serta harga default. Harga tetap dapat disesuaikan pada invoice tertentu tanpa harus mengubah harga katalog.

### Alur Katalog

1. Buka **Katalog**.
2. Klik **Tambah item** untuk membuat produk atau jasa baru.
3. Isi nama, deskripsi bila diperlukan, dan harga default.
4. Gunakan pencarian untuk menemukan item saat daftar sudah banyak.
5. Ubah atau hapus item dari aksi pada baris katalog.

Staging saat ini sudah memiliki tiga produk awal yang dapat langsung dipilih dalam invoice.

## 6. Invoice Biasa

Invoice biasa dipakai ketika membuat satu tagihan untuk satu klien. Editor invoice mendukung nomor invoice otomatis, tanggal, jatuh tempo, status, item dinamis, diskon, pajak, catatan, alamat pengiriman, dan nomor toko.

### Membuat Invoice Draft

1. Buka **Invoice** lalu pilih **Buat invoice baru**.
2. Pilih klien. Tambahkan data alamat pengiriman atau nomor toko jika berbeda dari alamat penagihan.
3. Tambahkan produk dari katalog atau buat baris item manual.
4. Isi jumlah, harga, serta diskon bila diperlukan.
5. Periksa subtotal, pajak, dan total yang dihitung otomatis.
6. Klik **Simpan sebagai draft** untuk menyimpan tanpa mengirim ke pelanggan.
7. Buka preview untuk meninjau hasil dokumen sebelum dibagikan atau dicetak.

### Diskon dan Perhitungan

Diskon dapat digunakan sebagai **nominal rupiah** atau **persentase**. Diskon persentase dibatasi maksimal 100%. Subtotal, pajak, dan total dihitung ulang secara otomatis setelah jumlah, harga, atau diskon berubah.

### Status Invoice

Invoice dapat dikelola sebagai draft, terkirim, lunas, atau status penagihan lain yang tersedia pada aplikasi. Perubahan penting dicatat pada riwayat invoice agar proses penagihan dapat ditelusuri.

| Aksi | Fungsi |
|---|---|
| **Simpan sebagai draft** | Menyimpan invoice untuk diperiksa atau dilanjutkan nanti. |
| **Kirim invoice** | Menandai invoice siap dikirim sesuai alur aplikasi. |
| **Duplikasi / copy** | Membuat invoice baru dari invoice lama untuk diedit; nomor invoice baru dibuat otomatis. |
| **Tandai lunas** | Memperbarui status pembayaran dan metrik Dashboard. |
| **Hapus** | Menghapus invoice yang tidak diperlukan setelah konfirmasi. |
| **Riwayat** | Menampilkan catatan aktivitas pembuatan, perubahan, pengiriman, duplikasi, status, dan penghapusan. |

## 7. Preview, Berbagi, dan Dokumen Invoice

Setelah invoice dibuat, halaman Preview digunakan untuk memastikan informasi bisnis, klien, alamat, barang, total, rekening, catatan, dan label salinan sudah benar.

| Fitur dokumen | Kegunaan |
|---|---|
| **PDF** | Mengunduh invoice sebagai dokumen PDF. |
| **Tautan publik** | Membuat halaman invoice yang dapat dibuka tanpa login menggunakan tautan unik. |
| **Kirim email** | Menyiapkan pengiriman invoice melalui layanan email terintegrasi. Pengiriman ke penerima nyata perlu diuji secara khusus sebelum digunakan untuk operasional. |
| **Cetak satu invoice** | Membuka alur cetak untuk invoice yang sedang dipreview. |
| **Edit** | Kembali ke editor jika ada data yang perlu diperbaiki. |

Halaman invoice publik hanya membuka satu dokumen berdasarkan tautan unik; halaman tersebut tidak membuka daftar invoice atau data internal bisnis.

## 8. Daftar Invoice, Pencarian, Filter, dan Ekspor

Halaman Invoice menyediakan daftar seluruh tagihan. Pengguna dapat mencari berdasarkan nomor invoice atau klien, lalu memfilter menurut status, klien, dan rentang tanggal. Dari halaman ini tersedia akses ke riwayat, impor, invoice massal, serta pembuatan invoice baru.

Daftar yang sedang difilter dapat diekspor menjadi **CSV** atau **Excel** untuk mendukung laporan bulanan. Hasil ekspor mengikuti data yang sedang relevan pada daftar sehingga pengguna dapat mengatur filter terlebih dahulu sebelum mengunduhnya.

## 9. Invoice Massal untuk Banyak Toko

Invoice massal dirancang untuk situasi ketika beberapa toko menerima daftar barang, jumlah, harga, diskon, tanggal, dan alamat gudang yang sama; perbedaan utamanya dapat berupa nomor atau nama toko. Sistem membuat invoice per toko serta satu invoice rekap untuk ringkasan batch.

### Alur Invoice Massal

1. Buka **Invoice** lalu klik **Invoice massal**.
2. Lengkapi data umum: tanggal, alamat pengiriman/gudang, item, kuantitas, harga, diskon, pajak, dan catatan.
3. Masukkan atau pilih daftar toko yang akan dibuatkan invoice.
4. Periksa ringkasan sebelum pembuatan.
5. Konfirmasi pembuatan. Sistem membentuk invoice per toko dan rekap batch.
6. Buka Dashboard atau daftar Invoice untuk meninjau hasil dan rekapnya.

## 10. Impor Invoice dari Spreadsheet

Fitur **Import invoice** berdiri terpisah dari invoice massal. Fitur ini cocok ketika setiap invoice dapat memiliki klien, tanggal, alamat, item, jumlah, harga, diskon, pajak, mata uang, maupun catatan yang berbeda.

Sistem menyediakan template Excel/CSV dan dapat mengelompokkan beberapa baris item ke dalam satu invoice berdasarkan identitas impor. Sebelum dibuat, file ditinjau terlebih dahulu untuk memperlihatkan data serta error per baris.

### Alur Impor

1. Buka **Invoice** lalu klik **Import invoice**.
2. Unduh template jika diperlukan.
3. Isi spreadsheet sesuai kolom yang tersedia.
4. Unggah file Excel atau CSV.
5. Periksa pratinjau dan perbaiki error baris bila ada.
6. Konfirmasi pembuatan invoice setelah data benar.
7. Tinjau hasil pada daftar Invoice.

## 11. Cetak dan Salinan Dokumen

Fitur cetak mendukung ukuran kertas **A4**, **Letter**, **A5**, dan format **80 mm**. Pengguna memilih printer fisik melalui dialog cetak sistem operasi atau browser, sehingga printer biasa maupun printer portabel dapat digunakan sesuai perangkat yang tersedia.

Cetak batch juga mendukung beberapa invoice sekaligus serta label **Faktur Asli**, **Copy 1**, **Copy 2**, dan seterusnya. Untuk menjaga hasil A4 tidak terpotong, sistem memakai aturan aman: invoice dengan maksimal dua item dapat memakai dua dokumen per halaman A4, sedangkan invoice dengan tiga item atau lebih memakai satu halaman penuh.

> Layout cetak sebaiknya direview pada printer yang benar-benar akan dipakai. Pengaturan margin, skala, dan header/footer pada dialog cetak browser dapat memengaruhi hasil fisik.

## 12. Riwayat Aktivitas

Halaman **Riwayat** membantu melihat aktivitas penagihan. Catatan tersedia untuk tindakan seperti membuat invoice, mengubah detail, mengubah status, menduplikasi, mengirim email, dan menghapus. Riwayat per invoice juga dapat ditinjau dari alur invoice terkait.

Fitur ini berguna saat perlu mengetahui siapa atau kapan invoice terakhir diubah, terutama ketika banyak invoice dibuat atau diperbarui.

## 13. Pengaturan Bisnis

Pengaturan menyimpan identitas resmi yang akan digunakan pada dokumen invoice. Area ini mendukung nama bisnis, alamat, email, telepon, rekening bank, warna merek, logo, format nomor invoice, pajak, mata uang, dan pilihan template Clean, Modern, atau Classic.

### Alur Pengaturan Awal

1. Buka **Pengaturan**.
2. Lengkapi identitas bisnis dan informasi rekening.
3. Pilih warna serta template invoice.
4. Atur format nomor invoice jika pola standar perlu disesuaikan.
5. Simpan lalu buka preview invoice untuk memastikan identitas tampil seperti yang diinginkan.

Logo bisnis disimpan di storage aplikasi dengan akses yang dibatasi sesuai pemilik profil bisnis.

## 14. Login dan Keamanan Akses

Staging menggunakan akun Supabase. Login email/sandi dan magic link telah tersedia. Tombol Google terlihat dalam antarmuka, tetapi login Google baru dapat dipakai setelah kredensial Google OAuth disiapkan pada pengaturan Supabase.

Data bisnis utama dibatasi berdasarkan akun yang masuk. Halaman invoice publik hanya ditujukan untuk melihat satu dokumen melalui tautan unik, bukan untuk mengakses data operasional internal.

## 15. Status Staging Saat Ini

Staging telah dibersihkan dari invoice demo. Data awal yang tersisa sengaja dibatasi menjadi empat klien Fresh dan tiga produk katalog, sementara invoice, item invoice, serta riwayat demo telah dihapus. Anda telah membuat satu invoice draft nyata; invoice tersebut menjadi dasar yang baik untuk memeriksa Dashboard, daftar invoice, detail, preview, dan status sebelum penambahan fitur berikutnya.

| Area | Status review | Catatan |
|---|---|---|
| Data dasar | Siap | Klien Fresh dan produk katalog tersedia. |
| Invoice draft | Perlu ditinjau | Satu draft nyata telah dibuat pengguna di staging. |
| Domain bisnis | Belum diarahkan | Belum ada perubahan pada domain Manus aktif atau domain bisnis. |
| Google login | Menunggu konfigurasi | Membutuhkan kredensial Google OAuth di Supabase bila ingin digunakan. |
| Pengiriman email nyata | Perlu uji terpisah | Jangan digunakan ke pelanggan sebelum pengujian penerima nyata disetujui. |
| Cetak fisik | Perlu uji printer | Hasil akhir bergantung pada printer dan konfigurasi dialog cetak. |

## 16. Cara Memberikan Catatan Review

Anda tidak perlu menjelaskan secara teknis. Anda dapat mengirim daftar sederhana dengan format berikut:

| Bagian | Yang sudah sesuai | Yang perlu diubah atau ditambah |
|---|---|---|
| Dashboard | Contoh: angka ringkas sudah cukup | Contoh: tambahkan penjualan per toko. |
| Invoice | Contoh: diskon sudah sesuai | Contoh: tambahkan kolom nomor surat jalan. |
| Klien | Contoh: daftar toko sudah mudah dicari | Contoh: tambahkan kategori area. |
| Katalog | Contoh: harga default sudah benar | Contoh: tambahkan satuan karton/pcs. |
| Cetak | Contoh: label copy diperlukan | Contoh: ubah informasi pada header. |
| Lainnya |  | Tulis kebutuhan baru apa pun. |

Setelah Anda mengirim catatan, saya akan mengelompokkan setiap perubahan menjadi: **wajib sebelum go-live**, **penting tetapi dapat menyusul**, dan **opsional**. Implementasi serta pengujian dilakukan di staging lebih dahulu; domain bisnis baru dipertimbangkan setelah Anda menyetujui hasilnya.

## Referensi

1. [Aplikasi staging Faktur](https://faktur-invoice-manager-staging.sabanachips.workers.dev)
