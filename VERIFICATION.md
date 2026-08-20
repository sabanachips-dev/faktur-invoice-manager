# Catatan Verifikasi Antarmuka

## 20 Agustus 2026

Layanan aplikasi telah dimulai ulang dan daftar Invoice berhasil dimuat pada sesi terautentikasi. Tampilan menunjukkan tiga invoice aktif, sehingga rute aplikasi dan pemanggilan data tRPC berjalan setelah restart.

Tombol **Kembali** tersedia di header global untuk seluruh rute ruang kerja selain Dashboard sebagai halaman awal. Tombol ini menggunakan riwayat browser dan kembali ke Dashboard apabila halaman dibuka langsung tanpa riwayat sebelumnya. Halaman invoice publik juga memiliki tombol kembali mandiri.

| Alur yang diverifikasi | Hasil |
|---|---|
| Editor invoice | Tombol Kembali global dan stepper tiga tahap tampil tanpa kontrol duplikat. |
| Invoice massal | Tombol Kembali global dan stepper pemilihan invoice, toko/pengiriman, serta rekap tampil. |
| Import Invoice | Tombol Kembali global dan stepper unggah, pemeriksaan, serta pembuatan invoice tampil. |
| Preview invoice | Tombol Kembali global dan toolbar aksi invoice tampil pada invoice `INV-2026-003`. |
| Riwayat invoice | Tombol Kembali global dan tombol Buka invoice untuk konteks invoice tertentu tampil. |
| Klien, Katalog, Pengaturan | Tombol Kembali global tampil konsisten. |

Pengujian otomatis terakhir selesai dengan **22 berkas pengujian dan 44 kasus lulus**, serta pemeriksaan TypeScript selesai tanpa error.

Verifikasi layar seluler pada editor invoice, invoice massal, Import Invoice, dan preview `INV-2026-003` menunjukkan tombol Kembali tetap terlihat pada header, sementara stepper tetap terbaca dan dapat digeser secara horizontal pada ruang yang sempit.

Helper navigasi kembali juga diuji untuk dua skenario: kembali melalui riwayat browser ketika tersedia dan kembali ke Dashboard ketika halaman dibuka langsung. Seluruh halaman ruang kerja memakai helper yang sama, sedangkan halaman invoice publik memakai fallback yang sama menuju halaman awal.

## Validasi Alur Batch dan Impor

| Alur | Bukti validasi | Hasil |
|---|---|---|
| Cetak batch | Pengujian label dokumen cetak memvalidasi urutan **Faktur Asli**, **Copy 1**, dan salinan berikutnya. Daftar Invoice menampilkan seleksi invoice dan entry point cetak batch. | Lulus tanpa mengirim pekerjaan ke printer pengguna. |
| Invoice massal dan rekap | Pengujian end-to-end memvalidasi invoice toko, alamat pengiriman bersama, diskon, serta invoice rekap. Halaman invoice massal dan Dashboard memuat data invoice terbaru setelah restart. | Lulus tanpa membuat batch tambahan saat verifikasi. |
| Import invoice lengkap | Pengujian end-to-end memvalidasi pengelompokan baris spreadsheet, penciptaan atau penggunaan klien yang cocok, serta invoice draft lengkap. Halaman Import Invoice menyediakan template, unggah file, pratinjau, dan konfirmasi. | Lulus tanpa mengimpor file baru pada data pengguna. |

## Validasi Sesi Produksi Terautentik

Pada 20 Agustus 2026, sesi produksi pengguna memvalidasi dialog cetak batch tanpa mengirim pekerjaan ke printer. Dialog menyediakan ukuran **A4**, **Letter**, **A5**, dan **Struk 80 mm**; jumlah tiga salinan; serta tata letak satu invoice atau dua invoice ringkas per lembar. Untuk dua invoice terpilih dengan tiga salinan, ringkasan dialog menampilkan enam dokumen dan menyatakan bahwa salinan pertama berlabel **Faktur Asli**, diikuti **Copy 1**, **Copy 2**, dan seterusnya. Dialog ditutup melalui tombol Batal dan daftar invoice dikembalikan ke keadaan tanpa pilihan.

Preview cetak bawaan browser kemudian dibuka untuk satu invoice dengan tiga salinan. Pengguna mengonfirmasi label **Faktur Asli**, **Copy 1**, dan **Copy 2** terlihat pada preview, lalu menutup dialog dengan Batal/Esc tanpa mengirim pekerjaan ke printer.

File CSV sementara `verifikasi-import-invoice.csv` berhasil dipilih pada halaman Import Invoice dan membentuk pratinjau satu invoice valid dengan ID `VERIF-PRATINJAU-001`. Stepper berpindah dari unggah dan pemeriksaan data ke langkah pembuatan. Tombol pembuatan invoice tidak ditekan, sehingga file pratinjau tidak menambah data invoice atau klien.

Setelah persetujuan eksplisit pengguna, file CSV yang sama dikonfirmasi melalui sesi produksi. Sistem membuat `INV-2026-004` berstatus Draft untuk **Klien Verifikasi Pratinjau** dengan total Rp263.625. Invoice dan klien uji kemudian dihapus. Pemeriksaan database menunjukkan `0` invoice uji, `0` klien uji, dan total invoice kembali `3`.

Dengan persetujuan pengguna, batch uji dua toko dibuat dari `INV-2026-003`. Sistem membuat `INV-2026-004` dan `INV-2026-005` untuk toko uji serta `INV-2026-006` sebagai invoice rekap. Dashboard menampilkan rekap dua toko, total Rp3.219.000, dan rekap `Produk A` sebanyak 20 unit. Setelah verifikasi, ketiga invoice uji tersebut dihapus satu per satu dengan dialog konfirmasi. Daftar Invoice dan Dashboard kembali menampilkan tiga invoice asli dengan nilai Rp4.802.160 dan tanpa rekap batch uji.

Batch uji menggunakan `clientId` dari invoice sumber `INV-2026-003` yaitu **Toko Merdeka 02**. Karena alur invoice massal hanya menyalin `clientId` invoice sumber, batch tidak membuat klien uji baru dan tidak ada klien tambahan yang perlu dihapus.
