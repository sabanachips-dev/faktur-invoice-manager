# Desain Multi-Tenant Faktur

**Status:** Rancangan untuk review. **Belum ada perubahan skema atau data produksi yang diterapkan.**

## Tujuan

Membuat satu aplikasi Faktur dapat dipakai banyak bisnis tanpa satu bisnis dapat melihat atau mengubah data bisnis lain. Model yang diusulkan memperkenalkan organisasi sebagai batas data utama, lalu menghubungkan pengguna dengan organisasi melalui keanggotaan dan peran.

## Model Data yang Diusulkan

| Entitas | Peran | Field inti |
|---|---|---|
| `organizations` | Satu bisnis/tenant | `id`, `name`, `slug`, `createdAt`, `updatedAt` |
| `organization_members` | Keanggotaan dan izin pengguna | `organizationId`, `userId`, `role`, `createdAt` |
| `organization_invitations` | Undangan staf/admin | `organizationId`, `email`, `role`, `tokenHash`, `expiresAt`, `acceptedAt`, `invitedByUserId` |
| `user_active_organizations` | Organisasi aktif bagi pengguna yang tergabung pada lebih dari satu bisnis | `userId`, `organizationId`, `updatedAt` |

Peran yang disarankan adalah **owner**, **admin**, dan **staff**. Owner dapat mengelola organisasi, anggota, undangan, profil bisnis, dan billing pada tahap berikutnya. Admin dapat mengelola data bisnis dan staf operasional, tetapi tidak dapat memindahkan kepemilikan organisasi. Staff dapat mengelola invoice, klien, katalog, serta pesanan sesuai izin operasional yang ditetapkan.

## Batas Data

Tabel berikut perlu memperoleh `organizationId`: `businessProfiles`, `clients`, `catalogItems`, `invoices`, dan `invoiceActivities`. `invoiceItems` tidak perlu menyimpan organisasi sendiri karena batasnya mengikuti invoice induknya. Nomor invoice harus unik per organisasi, bukan per pengguna.

| Data | Kepemilikan saat ini | Target |
|---|---|---|
| Profil bisnis | Satu `userId` | Satu `organizationId` |
| Klien dan katalog | `userId` | `organizationId` |
| Invoice dan aktivitas | `userId` | `organizationId`, dengan `userId` tetap mencatat pelaku tindakan |
| Item invoice | Invoice induk | Tetap melalui invoice induk |
| Logo storage | Folder pengguna | Bertahap ke folder organisasi setelah akses storage organisasi tersedia |

## Strategi Migrasi Aman

Migrasi harus dijalankan dalam beberapa langkah yang dapat diperiksa, bukan dengan menghapus kolom kepemilikan lama sekaligus.

1. Membuat tabel organisasi, anggota, organisasi aktif, undangan, enum peran organisasi, dan helper RLS baru.
2. Membuat satu organisasi awal untuk Sabana Chips dan satu keanggotaan `owner` untuk akun pemilik saat ini.
3. Menambah `organizationId` pada tabel data sebagai kolom nullable sementara, kemudian mengisi semua data Sabana Chips ke organisasi awal.
4. Menambahkan indeks dan constraint yang diperlukan, termasuk nomor invoice unik per organisasi.
5. Memperbarui RLS, fungsi RPC invoice, router Worker, serta kueri profil agar memakai organisasi aktif dan tetap mencatat `userId` sebagai pelaku.
6. Menjalankan pengujian negatif lintas organisasi, kemudian baru menjadikan `organizationId` wajib dan menghapus policy kepemilikan satu pengguna yang lama.

> Kolom `userId` historis tidak langsung dihapus. Kolom tersebut tetap berguna untuk pencatat pelaku tindakan dan kompatibilitas selama migrasi, sedangkan batas akses akan berpindah ke `organizationId`.

## Prinsip RLS

Setiap kebijakan RLS akan memeriksa dua hal: pengguna yang sedang login adalah anggota organisasi terkait, dan operasi yang dilakukan sesuai dengan perannya. Kueri tidak boleh menerima `organizationId` dari browser sebagai satu-satunya bukti izin; server dan RLS harus selalu memverifikasi membership.

Organisasi aktif hanya dapat diubah ke organisasi yang sudah memiliki membership pengguna. Jika pengguna hanya punya satu organisasi, alur sekarang tetap sederhana tanpa pemilih organisasi tambahan.

## Dampak dan Batas Tahap Pertama

Tahap pertama tidak mengubah desain invoice, kalkulasi, ekspor, impor, atau domain publik. Perubahan utama berada di penyimpanan data, autentikasi konteks organisasi, dan RLS. Undangan dapat dibuat setelah isolasi organisasi dan peran dasar lulus pengujian; pengiriman email undangan hanya diaktifkan ketika alur aksesnya telah tervalidasi.

## Validasi Wajib Sebelum Go-Live

| Uji | Hasil yang harus dicapai |
|---|---|
| Owner organisasi A membaca data organisasi B | Ditolak oleh RLS dan Worker. |
| Staff organisasi A mengubah pengaturan owner | Ditolak. |
| Admin organisasi A membuat invoice | Diizinkan serta aktivitas mencatat pelaku. |
| Pengguna bergabung ke dua organisasi | Hanya data organisasi aktif yang tampil. |
| Data Sabana Chips lama | Tetap tampil lengkap pada organisasi awal tanpa perubahan total invoice/klien. |
| Invoice publik | Tetap hanya dapat dibuka melalui `publicId` yang sah dan memuat profil organisasi terkait. |
