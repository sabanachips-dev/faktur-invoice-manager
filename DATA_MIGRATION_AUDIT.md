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
