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
