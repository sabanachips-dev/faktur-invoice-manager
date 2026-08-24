# Keputusan Integrasi Pengiriman

Tanggal: 24 Agustus 2026  
Status: Menunggu API key pemilik bisnis untuk aktivasi staging.

## Pilihan yang Direkomendasikan

Gunakan **RajaOngkir / Komerce Shipping API** sebagai satu layanan untuk cek ongkir dan cek resi. Layanan ini dipilih karena dokumentasi resminya menyatakan dukungan untuk perhitungan ongkir beberapa ekspedisi serta pelacakan resi, termasuk contoh endpoint ongkir domestik. Hal ini sesuai dengan kebutuhan Faktur: pemilik bisnis dapat membandingkan opsi kurir dan kemudian memeriksa perjalanan nomor resi yang disimpan pada invoice.

> API key hanya akan disimpan sebagai secret Worker. Kunci tidak pernah dikirim ke browser, ditulis pada Git, atau ditampilkan pada halaman invoice publik.

## Batasan Data Saat Ini

Invoice saat ini menyimpan alamat pengiriman sebagai teks bebas. Untuk menghasilkan ongkir aktual, layar cek ongkir akan meminta informasi tambahan setiap kali digunakan: asal dan tujuan yang dikenali layanan, berat paket gram, serta kurir yang ingin dibandingkan. Nilai ongkir tidak akan otomatis mengubah total invoice tanpa tindakan eksplisit pemilik bisnis.

## Catatan Evaluasi

Biteship mendukung perhitungan ongkir, tetapi dokumentasi tracking-nya menyebut pelacakan `GET /v1/trackings/:id` hanya tersedia untuk pengiriman yang dibuat lewat Order API Biteship. Karena Faktur sudah mendukung nomor resi manual dari beberapa kurir, RajaOngkir lebih sesuai untuk satu integrasi yang ditujukan pada cek ongkir serta resi lintas pengiriman.

## Referensi

1. [RajaOngkir — API Pengiriman Terpadu](https://rajaongkir.com/)
2. [Biteship — Introduction](https://biteship.com/en/docs/intro)
3. [Biteship — Retrieve a Tracking](https://biteship.com/en/docs/api/trackings/retrieve)
