# Audit Kesiapan Staging Faktur

Tanggal audit: 24 Agustus 2026  
Lingkup: fungsi inti, regresi, respons, keamanan dasar, dan pengalaman pengguna untuk pengguna awam/IKM.

## Temuan Awal

| Area | Hasil awal | Catatan |
|---|---|---|
| Regresi otomatis | Lulus | 43 berkas pengujian dan 83 pengujian lulus; pemeriksaan TypeScript lulus. |
| Endpoint kesehatan | Berfungsi, perlu perbaikan performa | Mengembalikan Supabase sehat, tetapi pemeriksaan upstream memerlukan sekitar 5–6 detik pada sampel audit. |
| Dashboard | Lulus secara fungsi | Menampilkan ringkasan invoice, status pesanan, tautan Kanban, grafik, dan invoice terbaru. Struktur visual cukup konsisten dan jelas di desktop. |
| Daftar Invoice | Lulus secara fungsi | Pencarian, filter, ekspor CSV/Excel, riwayat, impor, invoice massal, tindakan lihat/duplikasi/lunas/hapus tersedia. Kepadatan kontrol desktop perlu ditinjau untuk ponsel. |
| Header keamanan | Perlu penguatan | Respons staging saat audit hanya menyatakan `cache-control`; header pertahanan browser perlu ditambahkan pada Worker. |

## Pemeriksaan Alur Operasional

| Area | Hasil | Catatan UX dan risiko |
|---|---|---|
| Kanban Board | Lulus secara fungsi | Enam tahap mudah dibedakan melalui warna dan label; kartu menampilkan nomor, klien, total, jatuh tempo, serta resi. Namun, enam kolom memakai scroll horizontal sehingga pengguna ponsel perlu diberi petunjuk yang lebih eksplisit. |
| Validasi status Dikirim/Selesai | Lulus secara desain | Sistem mengarahkan pengguna ke Preview invoice bila resi belum terisi, sehingga mengurangi risiko pesanan ditandai terkirim tanpa nomor resi. |
| Invoice publik | Lulus secara fungsi dan visual desktop | Total, status pengiriman, kurir, resi, kontak bisnis, PDF, dan salin nomor invoice mudah ditemukan. Halaman memang memperlihatkan informasi tagihan pelanggan pada siapa pun yang memegang tautan publik; ini sesuai tujuan invoice publik tetapi tautan perlu hanya dibagikan kepada pihak yang berhak. |
| Klien | Lulus secara tampilan | Pencarian dan tambah klien jelas. Namun, data staging memuat dua entri nama **FRESH Mart Toko 01** yang tampak duplikat; pembersihan/penyatuan perlu persetujuan pemilik agar riwayat invoice tidak salah pindah. |
| Katalog | Lulus secara fungsi dan visual | Daftar produk ringkas, harga dan promo mudah dikenali. Sejumlah produk belum memiliki deskripsi; ini tidak mengganggu invoice, tetapi dapat dilengkapi untuk hasil dokumen yang lebih informatif. |
| Editor invoice | Lulus secara fungsi | Stepper, ringkasan pembayaran, diskon per item, diskon invoice, pajak, item, dan pengiriman tersedia serta total terbaca. Form cukup panjang; stepper membantu orientasi, tetapi pengguna awam masih perlu panduan singkat saat membuat invoice pertama. |
| Pengaturan bisnis | Lulus secara fungsi dan visual | Pengelompokan Profil bisnis, Rekening, Aturan invoice, dan Branding mudah dipahami. Beberapa data penting masih kosong pada staging, seperti email bisnis dan detail rekening; pengguna perlu melengkapinya sebelum invoice benar-benar dibagikan. |

## Perbaikan Selama Audit

| Temuan | Perbaikan | Hasil verifikasi |
|---|---|---|
| Health dasar memeriksa Supabase setiap kali | Endpoint `/api/health` sekarang memeriksa kesiapan Worker saja; pemeriksaan Supabase dipindahkan ke `/api/health/deep`. | Sampel respons health dasar turun dari sekitar 5–6 detik menjadi sekitar 1,7 detik. Deep health tetap memastikan Supabase tersedia. |
| Header pertahanan browser tidak lengkap | Worker dan aset statis sekarang mengirim `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, serta `Cross-Origin-Opener-Policy`. | Header terverifikasi pada respons API dan halaman utama staging versi `469d4544-4684-4490-8f54-9bb0c5c696ac`. Content Security Policy belum dipaksakan karena perlu kebijakan terukur untuk font Google, analytics, dan fungsi dokumen agar tidak memutus fitur. |
| Tabel Invoice dan Kanban lebar pada ponsel | Ditambahkan petunjuk geser horizontal khusus layar kecil. | Desktop tetap ringkas; pengguna ponsel mendapatkan arahan eksplisit untuk melihat kolom atau seluruh tahap. |

## Penilaian Visual dan UX

Antarmuka desktop menerapkan palet navy, permukaan terang, radius konsisten, hierarki tipografi jelas, CTA utama yang menonjol, dan bahasa Indonesia yang langsung. Navigasi utama mengelompokkan pekerjaan dengan baik untuk pengguna IKM: penagihan, pesanan, pengiriman, data klien/produk, lalu pengaturan. Layout juga menyediakan drawer menu pada layar kecil menurut implementasi responsif.

Keterbatasan yang tersisa untuk validasi pengguna: hasil cetak fisik harus diuji pada printer nyata; email harus diuji hanya ke alamat uji; Google OAuth belum dikonfigurasi; dan data duplikat klien perlu persetujuan sebelum digabung.

### Pemeriksaan Ponsel — Invoice Publik

Invoice publik diuji pada viewport 375 × 812 piksel. Tidak ada kesalahan konsol dan tidak ditemukan overflow horizontal; `scrollWidth` halaman dan viewport sama-sama 375 piksel. Secara visual, tombol cetak dan PDF tetap terlihat di atas, status pembayaran/pesanan mudah dipindai, identitas pelanggan serta pengirim terbaca, dan tabel tiga item tetap terbaca tanpa dipotong. Panjang dokumen wajar untuk invoice tiga item; total serta informasi rekening tetap ditutup dengan jelas.

Audit telah menyelesaikan pemeriksaan rute inti yang tersedia tanpa mengubah data bisnis staging. Validasi akhir otomatis dan peninjauan risiko tersisa dicatat pada laporan kesiapan.
