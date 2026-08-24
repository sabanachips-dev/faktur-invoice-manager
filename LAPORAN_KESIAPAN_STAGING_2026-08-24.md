# Laporan Kesiapan Staging Faktur

**Tanggal:** 24 Agustus 2026  
**Lingkungan:** `https://faktur-invoice-manager-staging.sabanachips.workers.dev`  
**Rilis tervalidasi:** Cloudflare Worker `469d4544-4684-4490-8f54-9bb0c5c696ac`

## Kesimpulan Eksekutif

Staging **layak digunakan untuk review bisnis terarah**. Alur utama invoice, manajemen pesanan, pengiriman, dan halaman invoice pelanggan telah melewati regresi otomatis serta pemeriksaan antarmuka desktop dan mobile yang tidak mengubah data bisnis. Perbaikan prioritas dari audit ini—header perlindungan browser dasar, health check cepat, serta arahan scroll untuk data lebar di ponsel—sudah diterapkan pada staging.

Status ini **bukan pernyataan siap go-live tanpa syarat**. Sebelum pemindahan domain dan penggunaan operasional penuh, pemilik perlu melengkapi data bisnis, memverifikasi cetak pada perangkat fisik, dan menyetujui penanganan data klien yang tampak ganda. Aplikasi Manus lama tidak diubah dan tetap tersedia sebagai fallback.

| Area keputusan | Status | Dasar keputusan |
|---|---|---|
| Review fitur staging | **Siap** | Alur invoice, klien, katalog, dashboard, Kanban, cek ongkir/resi, ekspor, impor, dan invoice publik dapat diakses serta kontrak utamanya diuji. |
| Keamanan dasar browser | **Diperkuat** | Header `nosniff`, frame, referrer, permissions, dan opener policy aktif pada API serta aset statis. Konfigurasi `_headers` adalah mekanisme resmi untuk menambahkan header pada aset statis Workers.[1] |
| Pengalaman pengguna awam/IKM | **Baik, dengan batasan** | Bahasa tindakan jelas, struktur menu berurutan, status mudah dipindai, dan tabel/board lebar kini memiliki arahan khusus ponsel. |
| Cutover ke domain bisnis | **Tahan dahulu** | Memerlukan checklist operasional dan persetujuan pemilik; tidak ada perubahan DNS/domain pada audit ini. |

## Cakupan dan Hasil Validasi

Audit mencakup regresi otomatis, pemeriksaan tipe, build produksi, health check, header respons, penelusuran antarmuka desktop, dan pemeriksaan invoice publik pada layar ponsel 375 × 812 piksel. Pengujian dilakukan secara non-destruktif terhadap data staging yang sudah ada.

| Pemeriksaan | Hasil | Catatan |
|---|---|---|
| Regresi aplikasi | **Lulus** | 43 berkas pengujian dan 85 pengujian lulus. |
| Pemeriksaan TypeScript | **Lulus** | `pnpm run check` selesai tanpa error. |
| Build Cloudflare | **Lulus** | Asset aplikasi berhasil dibangun dan rilis staging dipublikasikan. |
| Health dasar | **Lulus** | `/api/health` kini memeriksa liveness Worker tanpa menunggu Supabase. |
| Health dependensi | **Lulus** | `/api/health/deep` memeriksa keterjangkauan Supabase secara eksplisit. |
| Respons health sampel | **Membaik** | Health dasar terukur sekitar 1,7 detik pada sampel sesudah pemisahan; sebelumnya pemeriksaan gabungan sekitar 5–6 detik. |
| Header API dan HTML | **Lulus** | Header pertahanan browser terverifikasi pada endpoint API dan halaman utama setelah revalidasi cache. |
| Invoice publik mobile | **Lulus** | Tidak ada error konsol atau overflow horizontal; `scrollWidth` sama dengan lebar viewport 375 piksel. |

## Perbaikan yang Diterapkan

### Keamanan dan Kesehatan Layanan

Endpoint health dipisahkan agar pemeriksaan rutin tidak ikut tertunda oleh panggilan ke Supabase. Untuk diagnosis dependensi, endpoint deep health tetap tersedia dan hanya memeriksa Supabase saat diminta. Tindakan ini memperjelas perbedaan antara layanan Worker yang hidup dan ketersediaan layanan data di belakangnya.

Header perlindungan dasar sekarang berlaku pada respons API dan aset statis: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, serta `Cross-Origin-Opener-Policy`. Header ini mengurangi risiko MIME sniffing, pembingkaian lintas situs, kebocoran referrer berlebihan, dan penggunaan perangkat browser yang tidak diperlukan. Cloudflare secara resmi mendukung aturan header aset lewat file `_headers` pada direktori aset statis.[1]

Content Security Policy sengaja belum diberlakukan secara ketat pada rilis ini. Aplikasi memerlukan verifikasi sumber font, analytics, Supabase, generator PDF, dan canvas agar kebijakan yang keliru tidak memutus alur invoice. Ini merupakan penguatan lanjutan, bukan hambatan untuk review staging saat ini.

### UX Ponsel dan Keterbacaan

Kanban berisi enam tahap dan tabel invoice berisi banyak kolom. Keduanya tetap memakai area horizontal karena menyembunyikan informasi penting demi memaksa tampilan kartu akan mengurangi kegunaan operasional. Perbaikan yang dipilih adalah arahan eksplisit khusus ponsel: pengguna diberi tahu untuk menggeser board atau tabel ke kanan. Pendekatan ini mempertahankan detail dan tindakan tanpa memperumit antarmuka.

Invoice publik diuji secara visual pada ponsel. Tombol cetak dan PDF terlihat di bagian atas; status pembayaran/pesanan, kurir, nomor resi, pihak pengirim/pelanggan, rincian item, total, dan informasi pembayaran terbaca tanpa konten melebar keluar layar. Tata visual konsisten dengan karakter yang diminta: dasar terang, aksen navy, hierarki informasi jelas, dan teks tindakan sederhana.

## Risiko dan Batasan Sebelum Go-Live

| Prioritas | Hal yang perlu ditangani | Penanggung jawab / tindakan berikutnya |
|---|---|---|
| Tinggi | Detail profil bisnis dan rekening belum seluruhnya dipastikan lengkap | Pemilik melengkapi email bisnis, rekening, dan data kontak yang akan muncul pada invoice pelanggan. |
| Tinggi | Cetak tidak dapat divalidasi sepenuhnya tanpa perangkat nyata | Uji satu invoice 1 halaman dan satu skenario batch pada printer A4/thermal yang benar-benar akan dipakai. Jangan mengubah template cetak sebelum bukti hasil fisik tersedia. |
| Sedang | Dua entri klien bernama sama tampak duplikat | Pemilik memastikan apakah keduanya memang toko yang berbeda. Jangan digabung atau dihapus otomatis karena relasi invoice dapat berbeda. |
| Sedang | Email outbound belum diuji ke penerima nyata dalam audit ini | Kirim satu invoice uji ke alamat yang dikendalikan pemilik, lalu cek penerimaan dan tampilan. |
| Sedang | Google OAuth belum dikonfigurasi | Gunakan email/sandi atau magic link terlebih dahulu; konfigurasi Google hanya jika benar-benar dibutuhkan. |
| Rendah | CSP ketat belum diterapkan | Lakukan inventaris sumber eksternal dan uji PDF/cetak terlebih dahulu sebelum menerapkan CSP bertahap. |
| Rendah | Bundel JavaScript utama masih besar | Lanjutkan dengan pemecahan kode untuk PDF/Excel bila metrik pengguna nyata menunjukkan waktu awal yang mengganggu. |

> Tautan invoice publik bersifat aman hanya sejauh tautannya dibagikan kepada pihak yang berhak. Siapa pun yang memegang tautan unik dapat melihat invoice tersebut, sesuai tujuan fitur invoice publik.

## Rekomendasi Keputusan

Gunakan staging ini untuk **review operasional 1–3 hari** dengan data bisnis terkendali. Fokuskan review pada pembuatan invoice sederhana, duplikasi untuk toko lain, ekspor laporan, perubahan status pesanan, cek ongkir, dan pengalaman pelanggan membuka tautan invoice. Jika semua checklist berikut selesai tanpa temuan kritis, barulah cutover domain dapat dipertimbangkan.

| Checklist sebelum cutover | Kriteria selesai |
|---|---|
| Data bisnis | Nama bisnis, alamat, nomor kontak, email, rekening, serta catatan invoice telah diverifikasi pemilik. |
| Cetak nyata | Hasil fisik A4 dan, bila digunakan, thermal diterima pemilik tanpa terpotong atau tata letak bermasalah. |
| Email nyata | Satu email invoice diterima oleh alamat uji dan lampiran/tautan bekerja. |
| Data klien | Duplikasi klien telah diputuskan pemilik; tidak ada penghapusan otomatis. |
| Keamanan akses | Akun pemilik dapat masuk kembali dengan metode yang dipilih dan tautan publik hanya dibagikan kepada penerima yang tepat. |
| Persetujuan pemilik | Pemilik memberi persetujuan tertulis untuk mengubah DNS/subdomain dan menjalankan rencana cutover. |

## Referensi

[1]: https://developers.cloudflare.com/workers/static-assets/headers/ "Cloudflare Workers — Headers for static assets"
