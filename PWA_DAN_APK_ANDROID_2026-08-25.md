# PWA dan APK Android — Faktur

**Tanggal:** 25 Agustus 2026  
**Status:** PWA aktif pada domain produksi dan APK Android rilis pertama berhasil dibangun.  
**Domain:** `https://faktur.sabanachips.biz.id`

## Ringkasan

Faktur kini menyediakan dua cara penggunaan di Android yang memakai aplikasi web dan data yang sama. **PWA** dipasang langsung dari Chrome tanpa mengunduh berkas APK. **APK Faktur** adalah wrapper Trusted Web Activity (TWA) yang membuka PWA Faktur melalui browser Android yang mendukung TWA, sehingga alur invoice, autentikasi Google, dan magic link tetap menggunakan domain HTTPS yang sama. TWA dapat tampil tanpa toolbar browser hanya setelah domain dan APK berhasil diverifikasi menggunakan Digital Asset Links; apabila verifikasi browser tidak berhasil, aplikasi tetap membuka situs dalam Custom Tab sebagai fallback.[1]

| Jalur | Cocok untuk | Cara pembaruan | Status |
|---|---|---|---|
| **PWA Chrome** | Penggunaan paling mudah tanpa berkas instalasi | Otomatis mengikuti pembaruan aplikasi web | Aktif dan dapat dipasang |
| **APK TWA** | Ikon aplikasi khusus dan distribusi langsung di Android | Perlu APK rilis baru bila wrapper Android berubah; isi Faktur tetap berasal dari domain web | APK rilis v1 tersedia |

## Pemasangan PWA dari Chrome Android

Buka `https://faktur.sabanachips.biz.id` melalui Chrome Android. Ketuk menu tiga titik, pilih **Install app** atau **Tambahkan ke layar utama**, lalu ikuti instruksi Android. Setelah selesai, ikon **Faktur** akan tampil pada launcher seperti aplikasi biasa. Chrome mendukung pemasangan web app dari menu instalasi tersebut.[3]

PWA harus tetap memiliki koneksi internet untuk memakai data langsung, login, pembuatan invoice, dan sinkronisasi data. Service worker Faktur hanya menangani aset aplikasi; ia dengan sengaja tidak menyimpan respons `/api/`, metode selain `GET`, maupun autentikasi agar data dan sesi tidak menjadi kedaluwarsa.

## APK Faktur — Rilis Pertama

APK dibangun sebagai Trusted Web Activity menggunakan Bubblewrap, dengan mode `standalone` dan orientasi `portrait-primary`. TWA menggunakan browser Android yang kompatibel, bukan WebView buatan sendiri; karena itu sesi Google OAuth dan magic link tetap berjalan pada origin `https://faktur.sabanachips.biz.id`. Panduan Android menjelaskan bahwa Bubblewrap menghasilkan `app-release-signed.apk` untuk pemasangan pengujian perangkat atau distribusi rilis.[1]

| Properti | Nilai |
|---|---|
| Nama aplikasi | Faktur — Invoice Manager |
| Package ID | `id.biz.sabanachips.faktur.twa` |
| Version code / version name | `1` / `1` |
| Mode tampilan | `standalone` |
| APK artefak | `app-release-signed.apk` |
| Ukuran APK | 921 KiB |
| SHA-256 berkas APK | `c822deb1093eb051dd1191d925d30d2d5cf368259f2c762a0024cc129f8147d2` |
| Sertifikat SHA-256 | `FA:F7:B1:D2:49:9A:EB:E8:2A:E1:35:DD:2C:B2:19:4C:4C:3D:90:17:9C:D1:05:ED:CA:7B:7C:AE:A7:B7:36:EE` |

Untuk pemasangan langsung, unduh APK hanya dari sumber yang diberikan pemilik aplikasi. Android mungkin meminta izin pemasangan dari sumber tersebut, bergantung pada versi Android dan kebijakan perangkat. Setelah pemasangan, buka **Faktur** dari launcher dan masuk memakai Google atau magic link seperti pada versi web.

> **Batas uji saat ini:** APK telah dibangun dan diverifikasi secara struktural serta kriptografis, tetapi belum dipasang pada perangkat Android fisik atau emulator. Oleh karena itu, tampilan layar penuh TWA dan alur login pada perangkat harus dikonfirmasi saat APK pertama kali diuji pada ponsel.

## Digital Asset Links dan Verifikasi Domain

File publik `/.well-known/assetlinks.json` diterbitkan di domain Faktur. File ini memuat relasi `delegate_permission/common.handle_all_urls`, package ID APK, dan fingerprint sertifikat rilis. Digital Asset Links mensyaratkan file JSON tersebut berada tepat pada lokasi `https://<domain>/.well-known/assetlinks.json` dan memverifikasi target Android dengan package name serta fingerprint SHA-256 sertifikat.[2]

| Pemeriksaan | Hasil |
|---|---|
| Endpoint asset links | `200 OK` |
| Content-Type | `application/json` |
| Kebijakan cache | `no-cache, no-store, must-revalidate` |
| Package ID di APK dan asset links | Cocok |
| Fingerprint sertifikat APK dan asset links | Cocok |
| Signature APK | Skema v1, v2, dan v3 tervalidasi |
| Audit PWA produksi | HTTPS, manifest, service worker, registration, dan controller aktif |

Digital Asset Links adalah pernyataan publik yang dapat diverifikasi mengenai hubungan aplikasi dan situs. Struktur file menggunakan array statement, relasi, namespace `android_app`, package name, serta fingerprint SHA-256 sertifikat.[2] Jika kunci penandatanganan APK berubah pada rilis berikutnya, fingerprint baru harus ditambahkan atau menggantikan fingerprint pada file asset links sebelum APK tersebut dibagikan. Kunci penandatanganan disimpan di luar repositori dan **tidak boleh dikomit, dibagikan, atau diganti sembarangan**.

## Prosedur Pembaruan Rilis APK

Untuk pembaruan konten invoice, fitur web, atau data, cukup deploy aplikasi web ke domain Faktur; PWA dan APK akan membuka konten web terbaru. APK baru hanya diperlukan apabila identitas wrapper, ikon native, konfigurasi Android, atau package Android berubah.

| Perubahan | Tindakan yang diperlukan |
|---|---|
| Perubahan fitur atau tampilan web Faktur | Deploy Worker/web saja; tidak perlu APK baru |
| Perubahan kode atau aset native APK | Naikkan version code, build APK baru dengan keystore yang sama, lalu validasi checksum dan signature |
| Perubahan keystore atau sertifikat rilis | Perbarui `assetlinks.json` dengan fingerprint baru sebelum distribusi APK |
| Distribusi melalui Google Play di masa depan | Periksa fingerprint **App Signing** dari Play Console dan sesuaikan asset links karena dapat berbeda dari sertifikat lokal.[1] [2] |

## Referensi

[1] [Android Developers — Trusted Web Activities Quick Start Guide](https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2)  
[2] [Google Developers — Digital Asset Links: Getting Started dan Statement Format](https://developers.google.com/digital-asset-links/v1/getting-started)  
[3] [Google Chrome Help — Install a Web App on Android](https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid)
