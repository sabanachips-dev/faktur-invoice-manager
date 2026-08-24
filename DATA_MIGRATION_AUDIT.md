# Audit Data Sumber — Staging Faktur

Tanggal audit: 24 Agustus 2026

Audit ini hanya membaca jumlah baris dari database aplikasi Manus. Tidak ada data produksi yang diekspor, disalin, diubah, atau dihapus.

| Tabel | Jumlah baris |
|---|---:|
| `users` | 3 |
| `businessProfiles` | 2 |
| `clients` | 6 |
| `catalogItems` | 3 |
| `invoices` | 20 |
| `invoiceItems` | 57 |
| `invoiceActivities` | 540 |

## Batas Aman Sebelum Migrasi Data

Data produksi belum dipindahkan karena pemetaan pemilik data lama ke akun Supabase perlu dikonfirmasi. Saat cutover nanti, proses harus membuat backup logis terlebih dahulu, mengekspor data dalam urutan ketergantungan, menjaga ID dan relasi, lalu memverifikasi jumlah baris serta invoice/item setelah impor.

Tidak ada domain, deployment Manus, maupun data pada aplikasi aktif yang diubah oleh audit ini.

## Hasil Impor Data Valid

Dengan persetujuan pengguna, data yang dapat direlasikan telah diimpor ke akun Supabase saat ini. Verifikasi pasca-impor menemukan seluruh relasi invoice yang diimpor konsisten.

| Data di Supabase staging | Jumlah |
|---|---:|
| Profil bisnis aktif | 1 |
| Klien | 6 |
| Katalog | 3 |
| Invoice | 20 |
| Item invoice | 57 |
| Riwayat aktivitas yang terhubung | 17 |

Satu profil bisnis tambahan dan 523 riwayat aktivitas tanpa invoice asal tetap tersedia pada arsip transformasi privat. Keduanya tidak dimasukkan ke tabel aplikasi karena akan membuat satu akun memiliki lebih dari satu profil aktif atau melanggar relasi invoice.

## Pembersihan Data Demo Staging

Setelah meninjau hasil impor, pengguna menegaskan bahwa invoice dan riwayat lama hanya merupakan data demo. Snapshot logis privat tambahan dibuat sebelum pembersihan sehingga pemulihan tetap dimungkinkan bila dibutuhkan. Pembersihan dilaksanakan dalam satu transaksi dengan urutan penghapusan aktivitas invoice, item invoice, invoice, lalu klien yang namanya tidak mengandung `Fresh`. Profil bisnis dan seluruh katalog produk tidak diubah.

| Data di Supabase staging setelah pembersihan | Jumlah |
|---|---:|
| Profil bisnis aktif | 1 |
| Klien toko Fresh | 4 |
| Katalog produk | 3 |
| Invoice | 0 |
| Item invoice | 0 |
| Riwayat aktivitas invoice | 0 |

Verifikasi relasi setelah pembersihan menunjukkan tidak ada invoice tanpa klien, item tanpa invoice, maupun riwayat tanpa invoice. Deployment dan database aplikasi Manus aktif tidak diubah.
