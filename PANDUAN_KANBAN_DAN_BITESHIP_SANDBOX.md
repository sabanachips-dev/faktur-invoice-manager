# Panduan Kanban Pesanan dan Uji Biteship Sandbox

Dokumen ini menjelaskan cara memakai Kanban Board pesanan yang sudah aktif pada Faktur serta cara menyiapkan pengujian Biteship Sandbox tanpa membuat order produksi. Integrasi pengiriman yang aktif saat ini tetap RajaOngkir, sesuai pilihan penggunaan gratis. Biteship belum dihubungkan ke staging dan belum menerima API key Sandbox.

> **Penting:** Biteship Sandbox dapat mensimulasikan order dan perubahan status tanpa kurir atau transaksi nyata. Namun, agar status tersebut dapat mengubah Kanban Board Faktur secara otomatis, aplikasi perlu terlebih dahulu diintegrasikan dengan API key Sandbox dan webhook Biteship.

## 1. Ringkasan Kanban Board Pesanan

Menu **Pesanan** menyediakan Kanban Board untuk memantau proses pesanan setelah invoice dibuat. Setiap kartu adalah satu invoice operasional; kartu rekap invoice massal tidak ikut masuk ke board agar proses toko individual tetap jelas.

| Kolom | Arti operasional | Tindakan berikutnya yang lazim |
|---|---|---|
| **Menunggu pembayaran** | Invoice baru/draft atau pembayaran belum dikonfirmasi. | Periksa pembayaran atau kirim invoice. |
| **Dibayar** | Pembayaran sudah diterima. | Siapkan barang atau pesanan. |
| **Diproses** | Barang sedang disiapkan/dikemas. | Lengkapi alamat, kurir, dan resi ketika paket siap. |
| **Dikirim** | Paket telah diserahkan ke kurir. | Kurir serta nomor resi wajib tersedia. |
| **Selesai** | Pengiriman/penyerahan telah selesai. | Arsipkan sebagai transaksi selesai. |
| **Dibatalkan** | Pesanan dibatalkan. | Catat alasan pembatalan bila diperlukan. |

Setiap kartu menampilkan nomor invoice, nama klien, total, jatuh tempo, alamat pengiriman bila tersedia, serta kurir dan resi bila sudah diisi. Pengguna dapat membuka Preview invoice dengan menekan nomor invoice pada kartu.

### Cara Mengubah Status

1. Buka menu **Pesanan**.
2. Pindahkan kartu dengan menariknya ke kolom tujuan, atau gunakan pilihan status pada bagian bawah kartu.
3. Saat memindahkan ke **Dikirim** atau **Selesai**, aplikasi akan meminta kurir dan nomor resi terlebih dahulu. Anda akan diarahkan ke Preview invoice jika informasi tersebut belum ada.
4. Di Preview invoice, isi kurir dan resi pada panel **Status pesanan & pengiriman**, lalu simpan.
5. Kembali ke Kanban Board dan lanjutkan perpindahan kartu.

Status pemenuhan pada Kanban Board dipisahkan dari status pembayaran invoice. Artinya, invoice dapat sudah lunas tetapi masih berada pada tahap Diproses atau Dikirim.

## 2. Alamat Asal Default Sabana Chips

Pada menu **Pengiriman**, pilih dulu kelurahan asal Sabana Chips yang benar dari hasil Payakumbuh. Setelah dipilih, lokasi tersebut otomatis ditandai sebagai **Asal Sabana Chips tersimpan** dan digunakan kembali untuk cek ongkir berikutnya pada perangkat/browser yang sama.

Pilihan ini sengaja tetap dapat diubah melalui tombol **Ganti asal**, karena Payakumbuh memiliki beberapa kelurahan dengan kode pos serta wilayah kurir yang berbeda. Jangan memakai pilihan contoh sebagai alamat bisnis jika bukan lokasi asal Sabana Chips yang sebenarnya.

## 3. Apa yang Dapat Diuji Gratis dengan Biteship Sandbox

Biteship menyediakan **Testing Mode** dengan API key khusus Sandbox. Key ini memakai awalan `biteship_test.` dan tidak sama dengan Production API key.[1] Test order yang dibuat menggunakan key tersebut tidak terhubung ke kurir nyata, tidak memotong saldo, dan dapat disimulasikan statusnya di dashboard Biteship.[2]

| Aktivitas | Bisa dilakukan tanpa order produksi | Catatan |
|---|---|---|
| Membuat test order | Ya | Order dibuat melalui Biteship API memakai Sandbox API key. |
| Simulasi status confirmed hingga delivered | Ya | Status diubah bertahap melalui dashboard Biteship. |
| Simulasi cancelled | Ya | Buat test order kedua lalu batalkan pada dashboard. |
| Uji webhook status otomatis | Ya | Memerlukan webhook URL Test di konfigurasi Biteship dan endpoint penerima di Faktur. |
| Cek ongkir live | Tidak sepenuhnya gratis | Biteship menyatakan Rates API memakai data kurir real-time dan dapat dikenakan biaya, termasuk di Sandbox.[3] |
| Tracking resi kurir publik | Tidak sepenuhnya gratis | Public Tracking juga menggunakan data nyata dan dapat dikenakan biaya.[3] |

## 4. Cara Menguji Tracking Otomatis Biteship pada Faktur

Langkah di bawah adalah **rencana pengujian**, bukan fitur yang sudah aktif. Karena Sabana Chips memilih layanan gratis, Faktur belum menerima Biteship API key ataupun webhook.

1. Buat akun Biteship lalu buka menu **Integrasi / Settings > API**.
2. Aktifkan **Testing Mode** dan salin key bertanda Development, yang umumnya diawali `biteship_test.`.[1] [2]
3. Jangan kirim key di chat. Balas **“Biteship Sandbox siap”**; saya akan meminta key lewat kolom aman.
4. Saya akan menambahkan integrasi Biteship Sandbox ke staging, terdiri dari tombol **Buat test shipment** di Preview invoice, penyimpanan Biteship Order ID, serta endpoint webhook khusus testing.
5. Buat dua test order dari Faktur: satu untuk alur **Delivered** dan satu untuk **Cancelled**. Dokumentasi Biteship merekomendasikan dua order ini sebagai bukti kesiapan integrasi sebelum aktivasi produksi.[2]
6. Pada dashboard Biteship, buka **Shipments**, cari order test, lalu ubah status pertama secara berurutan: Confirm Order → Allocate → Start Picking Up → Picked Up → Heading to Customer → Completed. Untuk order kedua, pilih Cancel sebelum selesai.[2]
7. Setiap perubahan status akan dikirim melalui event webhook `order.status`. Faktur kemudian memetakan status tersebut ke Kanban Board dan menampilkan pembaruan resi/AWB bila event `order.waybill_id` diterima.[4]
8. Periksa bahwa kartu test berpindah otomatis pada Kanban Board tanpa Anda mengubah status manual.

> Setelah uji Sandbox benar-benar lulus, Biteship meminta aktivasi API Production secara terpisah. Jangan memasukkan Production API key atau membuat pickup nyata sebelum Anda siap menggunakan layanan berbayar.[1] [2]

## Referensi

1. [Biteship — How to Use Sandbox or Testing Mode](https://help.biteship.com/hc/en-us/articles/39554706133913-How-to-Use-Sandbox-or-Testing-Mode-in-Biteship)
2. [Biteship — Simulate Test Orders as Delivered or Cancelled](https://help.biteship.com/hc/en-us/articles/58597705576985-How-to-Simulate-Test-Orders-as-Delivered-or-Cancelled-in-Biteship)
3. [Biteship — Testing Mode Fee Policy](https://help.biteship.com/hc/en-us/articles/58286997471513-Testing-Mode-Fee-Policy)
4. [Biteship — Webhook Overview](https://biteship.com/en/docs/api/webhook/overview)
