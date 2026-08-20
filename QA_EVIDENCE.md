# Bukti QA Sesi Produksi

## 20 Agustus 2026

Dokumen ini mencatat hasil validasi yang memerlukan interaksi sesi browser pengguna dan tindakan pembersihan data yang telah disetujui.

| Alur | Bukti yang dapat diperiksa | Hasil akhir |
|---|---|---|
| Cetak batch | Sesi terautentik membuka dialog cetak dengan tiga salinan. Ringkasan dialog menyebut **Faktur Asli**, **Copy 1**, dan **Copy 2**. Preview cetak sistem kemudian dibuka; pengguna mengonfirmasi ketiga label terlihat dan menutupnya dengan Batal/Esc. | Tidak ada pekerjaan cetak dikirim. |
| Rekap invoice massal | Batch dua toko dari `INV-2026-003` menghasilkan `INV-2026-004`, `INV-2026-005`, dan rekap `INV-2026-006`; Dashboard menampilkan dua toko, Rp3.219.000, dan Produk A 20 unit. | Ketiga invoice uji dihapus; Dashboard kembali ke tiga invoice asli tanpa rekap uji. |
| Import Invoice | CSV `verifikasi-import-invoice.csv` diunggah dan dikonfirmasi pada sesi terautentik. Aplikasi membuat `INV-2026-004` dan klien `Klien Verifikasi Pratinjau`. | Invoice serta klien uji dihapus. Pemeriksaan database terakhir: `test_invoice_remaining = 0`, `test_client_remaining = 0`, `total_invoices = 3`. |

Batch invoice massal menggunakan `clientId` dari invoice sumber dan tidak menciptakan klien baru. Klien uji hanya berasal dari impor CSV dan telah dibersihkan setelah invoice uji dihapus.
