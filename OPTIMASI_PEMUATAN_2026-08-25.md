# Optimasi Pemuatan Staging

## Perubahan

Route operasional selain Dashboard dipindahkan ke pemuatan tertunda. Dengan demikian, halaman invoice, editor, impor spreadsheet, invoice massal, preview/cetak, riwayat, Kanban, pengiriman, klien, katalog, Pengaturan, serta invoice publik dimuat ketika pengguna benar-benar membukanya. Pustaka PDF dan Excel sudah memakai import dinamis sehingga tetap hanya dimuat saat fungsi tersebut dipakai.

## Hasil Build

| Metrik bundle entry | Sebelum | Sesudah | Hasil |
|---|---:|---:|---|
| JavaScript entry utama | 1.773,73 kB | 1.400,25 kB | Lebih ringan pada pemuatan awal. |
| JavaScript entry utama terkompresi gzip | 441,40 kB | 390,72 kB | Lebih ringan pada jaringan pengguna. |
| Halaman berat | Tergabung di entry awal | Chunk terpisah | Dimuat hanya saat route terkait dibuka. |

## Validasi Staging

Staging Worker versi `0afab5d3-b525-4844-8340-3ddd618c766d` telah diverifikasi dengan sesi browser yang sama. Dashboard terautentikasi tampil dan navigasi utama tetap tersedia. Tautan invoice publik juga tampil dengan status, item, total, dan kontrol cetak/PDF setelah dimuat secara tertunda. Tidak ada tindakan yang mengubah invoice atau data bisnis selama validasi.
