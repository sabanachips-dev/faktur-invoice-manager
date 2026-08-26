# Penilaian Kesiapan Operasional dan SaaS — Faktur

**Tanggal:** 26 Agustus 2026  
**Cakupan:** aplikasi pada `faktur.sabanachips.biz.id`, bukan jaminan bebas bug atau audit kepatuhan formal.

## Kesimpulan Singkat

Faktur **sudah cukup kuat untuk dipakai sebagai aplikasi operasional internal Sabana Chips dalam tahap produksi terbatas**. Alur utama—autentikasi Google dan magic link, profil bisnis, klien, katalog, invoice, impor, ekspor, tautan publik, pengiriman, dashboard, dan PWA—telah dibangun serta diuji berulang.

Namun, aplikasi **belum layak diklaim sebagai SaaS publik yang matang**. SaaS publik memerlukan lapisan operasional dan komersial tambahan: multi-tenant/organisasi, peran pengguna, undangan tim, penagihan paket, pemantauan, backup-pemulihan yang diuji, pembatasan penyalahgunaan, kebijakan privasi, dan pengujian beban.

| Area | Penilaian | Dasar |
|---|---|---|
| Operasional satu bisnis | **Layak terbatas** | Data dan alur inti live; domain, autentikasi, PWA, dan backend Cloudflare–Supabase berjalan. |
| Keamanan dasar aplikasi | **Baik, belum lengkap** | HTTPS, RLS Supabase, autentikasi, header browser, dan pemisahan secret diterapkan; hardening operasional masih terbuka. |
| Kualitas regresi | **Baik** | 52 berkas pengujian dan 110 pengujian lulus pada pemeriksaan 26 Agustus 2026; TypeScript juga lulus. |
| Cetak fisik thermal/A4 | **Belum tervalidasi** | Cetak dari browser sudah tersedia, tetapi printer Bluetooth thermal pada perangkat pengguna masih menghasilkan hasil yang belum sesuai. |
| APK Android | **Siap uji, belum tervalidasi perangkat** | APK, tanda tangan, dan Digital Asset Links diverifikasi; pemasangan serta login pada perangkat fisik masih perlu dibuktikan. |
| SaaS publik multi-pelanggan | **Belum layak** | Belum ada organisasi/tenant formal, peran tim, billing, observabilitas, SLA backup, dan uji beban. |

## Bukti yang Sudah Ada

Pengujian terakhir menyatakan seluruh 52 berkas tes dan 110 tes lulus, termasuk cakupan router Cloudflare, otorisasi, invoice, dashboard, impor, ekspor, pengiriman, PWA, dan layout mobile. Pemeriksaan TypeScript juga lulus. Audit live sebelumnya menemukan dashboard, invoice, klien, katalog, Kanban, pengiriman, serta jalur invoice publik dapat dimuat tanpa kegagalan aplikasi yang dapat direproduksi.

Arsitektur aktif memakai Cloudflare Worker dan Supabase dengan autentikasi Google/magic link. Digital Asset Links dipublikasikan untuk package Android Faktur. Terdapat fallback aplikasi lama yang tidak diubah, sehingga risiko cutover dapat dibatasi.

## Risiko yang Masih Perlu Ditutup

| Prioritas | Risiko | Tindakan sebelum pemakaian lebih luas |
|---|---|---|
| Tinggi | Cetak Bluetooth thermal belum sesuai pada perangkat pemilik | Tunda klaim dukungan thermal sampai driver/model printer dan hasil cetak fisik tervalidasi. Gunakan PDF atau cetak A4 sebagai fallback. |
| Tinggi | Belum ada uji perangkat fisik untuk APK, Google login, dan magic link | Uji instalasi satu perangkat Android nyata, login, keluar/masuk, dan pembaruan aplikasi. |
| Tinggi | Fitur SaaS publik belum lengkap | Tambahkan organisasi/tenant, peran/undangan, isolasi data teruji, rate limit, serta audit akses sebelum menerima banyak pelanggan. |
| Menengah | Pemantauan, peringatan, dan prosedur pemulihan belum formal | Tetapkan backup, pemulihan, log error, metrik, dan kontak penanganan insiden. |
| Menengah | Leaked Password Protection dan detail invoice operasional belum diselesaikan | Aktifkan proteksi sandi jika kata sandi digunakan; lengkapi email bisnis dan rekening sebelum invoice dibagikan ke pelanggan. |
| Menengah | Belum ada uji beban dan uji konkurensi | Lakukan pengujian pada volume invoice, impor spreadsheet, dan akses serentak yang mendekati penggunaan nyata. |

## Rekomendasi Keputusan

Gunakan Faktur sekarang sebagai **aplikasi internal Sabana Chips dengan pengguna terbatas**. Jalur aman adalah memakai domain produksi yang sudah ada, menjaga fallback lama, mengaktifkan pencadangan rutin, dan menyimpan PDF sebagai fallback ketika cetak thermal belum stabil.

Jangan dahulu memasarkan aplikasi sebagai **SaaS publik berbayar**. Sebelum itu, selesaikan tiga kelompok pekerjaan: pertama, fondasi multi-tenant dan peran pengguna; kedua, operasi produksi seperti monitoring, backup/restore, rate limit, serta uji beban; ketiga, aspek komersial dan kepatuhan seperti billing, kebijakan privasi, dukungan pengguna, dan ketentuan layanan.

> Tidak ada aplikasi yang dapat dinyatakan tanpa bug. Status yang dapat dipertanggungjawabkan saat ini adalah **siap operasi terbatas untuk satu bisnis**, bukan **SaaS publik matang**.
