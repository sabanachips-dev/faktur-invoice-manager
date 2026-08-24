# Evaluasi Biteship untuk Pengiriman Sabana Chips

Tanggal: 24 Agustus 2026  
Keputusan yang direkomendasikan: **Gunakan Biteship sebagai satu platform pengiriman Sabana Chips**, dengan catatan biaya per penggunaan dan batas label resmi harus dipahami sebelum produksi.

## Jawaban Singkat

**Bisa.** Biteship dapat menjadi satu integrasi untuk membandingkan ongkir, membuat order pengiriman, memperoleh AWB/resi, mengatur pickup, dan melacak order yang dibuat melalui Biteship. Dokumentasi resminya mencakup Rates API, Order API, dan tracking order, serta dukungan lebih dari 30 kurir. [1] [2]

Namun, **tidak sepenuhnya gratis di produksi**. Biteship menyatakan Rates API mulai dari **Rp5 per request** dan Public Tracking mulai dari **Rp10 per request**. Order API dipasarkan “mulai dari gratis”, tetapi tetap bergantung pada tarif pengiriman dan saldo Biteship; order produksi menimbulkan biaya pengiriman nyata sesuai layanan kurir yang dipilih. [1] [3]

## Kemampuan terhadap Kebutuhan Sabana Chips

| Kebutuhan | Biteship | Catatan implementasi Faktur |
|---|---|---|
| Cek ongkir multi-kurir | Ya | Gunakan Rates API, input asal/tujuan, berat, dimensi bila diperlukan, lalu pilih layanan. Biaya mulai Rp5 per request. [1] |
| Buat order pengiriman | Ya | Order API membuat shipment, dapat meminta pickup atau drop-off, dan menghasilkan AWB/resi. Order produksi memerlukan saldo mencukupi. [2] |
| Cek resi | Ya | Tracking order Biteship dapat memakai data internal Biteship; public tracking terhadap resi kurir juga tersedia tetapi dikenakan biaya per request. [3] |
| Status otomatis | Ya | Status order tersedia dari confirmed sampai delivered. Untuk pembaruan otomatis di aplikasi, webhook Biteship perlu ditambahkan pada tahap lanjutan. [2] |
| Cetak label/resi resmi kurir dari API | **Tidak langsung** | Dokumentasi Biteship menyatakan tidak ada Shipping Label API; label siap pakai tersedia untuk diunduh dari dashboard Biteship. [4] |
| Cetak dokumen resi dari aplikasi Faktur | Ya, dengan batasan | Kita dapat membuat **lembar resi internal** dari data order/AWB Biteship dan mencetaknya dari Faktur. Ini bukan pengganti label resmi kurir dari dashboard Biteship. |

## Kebijakan Gratis dan Sandbox

| Aktivitas | Sandbox / Testing | Produksi |
|---|---:|---:|
| Membuat simulasi Order API | Gratis | Biaya pengiriman nyata dan saldo Biteship diperlukan. |
| Mengambil tracking order internal Biteship | Gratis di sandbox | Sesuai ketentuan akun dan order. |
| Cek ongkir real-time | Rp5 per request | Mulai Rp5 per request. |
| Public tracking resi kurir | Rp10 per request | Mulai Rp10 per request. |

> Sandbox cocok untuk membangun serta mencoba alur pembuatan order tanpa pickup nyata. Cek ongkir dan public tracking tetap menggunakan data real-time dari mitra kurir sehingga dapat dikenakan biaya meski dalam mode pengujian. [3]

## Implikasi untuk Aplikasi Faktur

Integrasi RajaOngkir yang kini aktif di staging cukup baik untuk cek ongkir dan cek resi, tetapi tidak mencakup pembuatan shipment serta alur AWB Biteship. Jika Sabana Chips memilih Biteship, modul Pengiriman akan dipindahkan ke kontrak Biteship dan RajaOngkir dihentikan dari UI agar hanya ada satu sumber pengiriman.

Skema invoice akan ditambah dengan metadata pengiriman Biteship: ID order Biteship, ID tracking, AWB, nama serta layanan kurir, metode pickup/drop-off, biaya kirim yang dipilih, status shipment, dan waktu status terakhir. Status pemenuhan Kanban tetap dipertahankan, lalu akan disinkronkan dari status Biteship melalui webhook setelah order dibuat.

## Rencana Penerapan Bertahap

1. **Sandbox:** simpan Sandbox API key Biteship sebagai secret Worker, ganti cek ongkir dan cek resi dengan Biteship, lalu uji pembuatan order simulasi tanpa pickup nyata.
2. **Order dari invoice:** tambah tombol “Buat pengiriman Biteship” di Preview invoice. Pengguna memilih rate, mengonfirmasi pickup/drop-off, lalu sistem membuat order Biteship dan menyimpan AWB.
3. **Dokumen:** buat lembar resi internal yang dapat dicetak dari Faktur. Untuk label resmi Biteship/kurir, tetap tersedia melalui dashboard Biteship sampai provider menyediakan API label resmi.
4. **Produksi:** setelah Sandbox tervalidasi, masukkan Production API key, isi saldo Biteship, pilih kurir yang aktif, dan aktifkan webhook status. Tidak ada order produksi dibuat tanpa tombol konfirmasi eksplisit dari pengguna.

## Yang Dibutuhkan dari Pemilik Bisnis

1. Daftarkan akun Biteship dan aktifkan **Sandbox API key** terlebih dahulu.
2. Konfirmasi alamat asal pickup Sabana Chips, kode pos, kontak pickup, dan rata-rata berat/dimensi per produk.
3. Setelah Sandbox selesai diuji, sediakan **Production API key** serta saldo akun untuk order dan pickup nyata.

## Referensi

1. [Biteship Shipping API — Fitur dan harga mulai](https://biteship.com/en/product/api)
2. [Biteship Order API — Overview](https://biteship.com/en/docs/api/orders/overview)
3. [Biteship Testing Mode Fee Policy](https://help.biteship.com/hc/en-us/articles/58286997471513-Testing-Mode-Fee-Policy)
4. [Biteship Shipping Label](https://biteship.com/en/docs/shipping_label)
