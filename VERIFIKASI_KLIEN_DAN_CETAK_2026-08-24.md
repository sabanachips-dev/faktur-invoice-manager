# Verifikasi Klien Duplikat dan Cetak

## Perbandingan Klien FRESH Mart Toko 01

Pemeriksaan dilakukan pada 24 Agustus 2026 melalui staging dan tidak ada data yang diubah.

| Pembanding | Entri pertama | Entri kedua | Kesimpulan |
|---|---|---|---|
| Nama | FRESH Mart Toko 01 | FRESH Mart Toko 01 | Sama persis |
| Email | Kosong | Kosong | Sama |
| Telepon | Sama | Sama | Sama |
| Alamat | Kosong | Kosong | Sama |
| NPWP | Kosong | Kosong | Sama |
| Riwayat invoice | 0 invoice | 0 invoice | Tidak ada relasi invoice yang perlu dipindahkan |

Kedua entri sangat mungkin merupakan duplikasi administratif. Karena keduanya tidak memiliki riwayat invoice, penghapusan **satu** entri tidak semestinya mengubah data invoice. Namun, penghapusan tetap menunggu persetujuan pemilik atas entri yang ingin dipertahankan.

### Tindakan Setelah Persetujuan Pemilik

Pemilik menyetujui pembersihan pada 24 Agustus 2026. Entri yang lebih baru dihapus hanya setelah pemeriksaan ulang memastikan identitasnya cocok dan tidak memiliki invoice. Verifikasi sesudah penghapusan menunjukkan **satu** entri FRESH Mart Toko 01 tersisa, entri yang dipertahankan tetap memiliki 0 invoice, dan jumlah seluruh invoice pengguna tetap 1. Tidak ada invoice yang dipindahkan, diubah, atau dihapus.

## Batas Verifikasi Cetak

Pratinjau dan aturan cetak dapat diperiksa dari aplikasi, tetapi margin perangkat, driver, skala browser, dan hasil kertas hanya dapat dikonfirmasi menggunakan printer nyata. Bukti yang diperlukan adalah foto satu hasil cetak A4 satu invoice, satu hasil batch dua-up bila digunakan, serta hasil thermal bila printer thermal dipakai.

## Hasil Pratinjau Digital A4

Pratinjau PDF non-destruktif dibuat dari invoice publik aktif dengan tiga item dan aturan A4 potret aplikasi. Hasilnya memiliki tepat **satu halaman A4**. Pemeriksaan visual menunjukkan identitas bisnis, metadata invoice, pihak yang ditagih, tiga baris item, catatan, status pengiriman, ringkasan total, dan informasi pembayaran terlihat tanpa pemotongan.

Pengujian regresi terkait cetak juga lulus: label salinan diterapkan sebagai **Faktur Asli**, lalu **Copy 1**, **Copy 2**, dan seterusnya; layout dua-up hanya tersedia untuk invoice maksimal dua item, sedangkan invoice tiga item atau lebih memakai halaman penuh. Dialog cetak pada browser pengguna tidak dapat dibuka ulang pada sesi ini karena koneksi browser pengguna mengalami timeout, sehingga hasil kertas fisik masih membutuhkan verifikasi pemilik.
