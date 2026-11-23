# Keamanan PINTARA (Firebase Spark, tanpa Cloud Functions)

Status rules: **ditulis, belum diuji di emulator**. Uji dulu sebelum dipakai publik (lihat bagian Pengujian).

## Admin (aplikasi terpisah: `/pintara/admin/`)
Satu kali: daftar akun admin seperti biasa, lalu di Firestore buat koleksi `admins` dengan dokumen ber-ID = **email akun admin** (huruf kecil, salin persis) dan satu field apa saja (mis. `ok` = true). Email admin hanya ada di Firestore, tidak di repo. (ID berupa UID juga diterima.)
Buka `https://<user>.github.io/<repo>/admin/` (aplikasi PINTARA Admin, dipasang terpisah dari aplikasi utama): guru baru muncul di "Menunggu persetujuan" dan bisa disetujui/ditolak/dicabut. Rules mencegah siapa pun membuat dokumen `admins` dari klien.
Risiko: email pendaftaran belum diverifikasi; jangan hapus akun admin (email yang sama bisa didaftarkan orang lain). Perkuat dengan verifikasi email / Masuk dengan Google nanti.
Catatan: layar admin hanya mengubah Firestore. Node RTDB `verified_teachers/{uid}` masih manual dan baru dibutuhkan saat kelas langsung dibangun.
Rules Firestore harus di-publish ulang setelah pembaruan ini.

## Langkah admin manual (cara lama, tidak perlu lagi bila memakai layar admin)
1. **Verifikasi guru.** Guru mendaftar sendiri dengan `teacherVerified: false`. Setelah Anda memverifikasi orangnya, lakukan DUA hal di Firebase Console:
   - Firestore: `users/{uid}` set `teacherVerified` = `true`.
   - Realtime Database: buat node `verified_teachers/{uid}` = `true`.
2. **Konten.** `learning_categories`, `learning_contents`, `games`, `achievements` hanya bisa ditulis admin lewat Console (klien hanya membaca).
3. **Laporan.** Koleksi `reports` hanya bisa dibaca admin lewat Console.

## Urutan penulisan yang diwajibkan rules
- **Akun anak:** (a) orang tua membuat `parent_accounts/{ortu}` lalu `parent_accounts/{ortu}/children/{uidAnak}`; (b) akun anak membuat `users/{uidAnak}` dengan `parentUid`; (c) batch `usernames/{nama}` + `user_profiles/{uid}`. Rules menolak (b) bila (a) belum ada, jadi akun anak tidak bisa dibuat tanpa akun orang tua.
- **Akun orang tua / guru:** `users/{uid}` dulu, baru batch `usernames` + `user_profiles`.
- **Terima teman:** satu batch: ubah `friend_requests/{dari_ke}` jadi `accepted` DAN buat `friendships/{uidA_uidB}` (uid terurut alfabet, `uids` juga terurut). Rules memakai `getAfter`, jadi tidak bisa membuat pertemanan tanpa permintaan yang diterima.
- **Ajak bermain:** `game_invitations/{dari_ke}` (berlaku maks. 5 menit) lalu tulis `notifications/{ke}/{id}` di Realtime DB dan buat `rooms/{roomId}` (host menambahkan `allowed/{uidTeman}`).
- **Cermin teman di RTDB:** saat pertemanan jadi, tiap anak menulis `friends/{uidSendiri}/{uidTeman} = true` (hanya boleh menulis milik sendiri). Notifikasi dan status online baru bisa dikirim/dibaca bila **kedua pihak saling mencantumkan**. Menghapus teman/blokir: hapus entri sendiri.
- **Kode room:** host membuat `rooms/{roomId}` bertipe `code` + `room_codes/{KODE6}`. Pemain mencari kode (get), lalu menulis diri sendiri ke `players`.
- **Kelas langsung:** guru membuat `class_live/{classId}/meta`; setelah menyetujui anggota di Firestore, guru menulis `class_live/{classId}/roster/{uid}`. Kunci jawaban disimpan di `class_live_private` (hanya guru), jawaban siswa di `class_answers` (hanya guru dan pemilik jawaban). Penilaian dilakukan oleh klien guru lalu ditulis ke `class_results`.

## Yang dijaga rules
Role tidak bisa diubah sendiri; guru wajib terverifikasi; hanya akun anak yang bisa saling berteman dan hanya dengan izin orang tua (`friendsEnabled`, `multiplayerEnabled`); orang dewasa tidak bisa mengirim permintaan ke anak; permintaan teman butuh persetujuan penerima; blokir mencegah permintaan dan undangan; undangan butuh pertemanan, kedaluwarsa 5 menit, satu aktif per arah; profil publik minimal dan tidak bisa di-list; username unik; progres hanya milik sendiri (orang tua anak boleh baca); XP hanya naik dan dibatasi per penulisan; riwayat permainan tidak bisa diedit; jawaban live quiz hanya sekali dan hanya saat soal dibuka.

## Keterbatasan (jujur)
Tanpa server, hal berikut **tidak bisa dijamin**:
1. **Anti-curang skor.** Kunci jawaban berada di konten publik/offline, dan skor ditulis klien. Karena itu jangan membuat ranking global atau hadiah nyata dari skor. Batas XP hanya batas lunak.
2. **Persetujuan orang tua tidak terverifikasi.** Seorang anak bisa saja membuat akun "orang tua" sendiri. Perlu langkah verifikasi (mis. OTP/email orang tua) bila ingin lebih kuat, dan tinjauan hukum UU PDP sebelum rilis publik.
3. **Pembatasan laju.** Rules tidak bisa menghitung frekuensi. Dipakai ID deterministik, satu undangan aktif per arah, dan masa berlaku. Pengirim masih bisa batal lalu kirim ulang permintaan teman; penerima dapat memblokir.
4. **Room kode** tidak bisa menegakkan blokir (siapa pun yang tahu kodenya dapat masuk). Tidak ada chat bebas. Rules Realtime Database tidak bisa menghitung jumlah anak node, jadi **batas jumlah pemain (`maxPlayers`) hanya ditegakkan di klien**; host dapat mengeluarkan pemain.
5. **Pencarian username** bisa dipakai menebak username. Gunakan ID acak (mis. `pnt_k7q2x9`) sebagai username bawaan.
6. **Waktu bermain harian** dan status online hanya dicek di klien/orang tua; tidak dapat dipaksakan di server.
7. **Kuota Spark.** Pantau di Console.

## Pengujian (disarankan sebelum publik)
- Jalankan `firebase emulators:start` lalu uji skenario penolakan: ubah role sendiri, baca profil orang lain via list, buat `friendships` tanpa request, undang non-teman, jawab dua kali, tulis `class_live` tanpa verifikasi.
- Atau pakai **Rules Playground** di tab Rules Firestore dan RTDB.
- Konsol akan menolak publish bila ada kesalahan sintaks; baca pesannya dan kirim ke saya untuk diperbaiki.


## Duel teman & sesi offline (F22)
- Duel memakai Rules RTDB yang sudah ada (`rooms`, `notifications`, `friends`, `blocked`): undangan hanya antar teman yang saling berteman dan belum memblokir; ruang hanya terbaca host, pemain, dan teman yang diizinkan; jawaban ditulis sekali (`!data.exists()`).
- **Tidak ditegakkan Rules (batas jujur):** izin orang tua untuk main bersama (flag di Firestore) hanya dicek klien; skor/jawaban dari klien yang dimodifikasi tidak bisa dicegah sepenuhnya; data ruang tidak bisa dihapus klien.
- Salinan profil offline (`pintara:auth-user:v1`) hanya berisi uid, peran, nama tampilan, status verifikasi guru; tidak ada token/sandi. Peran di sana hanya untuk tampilan; Rules tetap membaca `users/{uid}.role`.

## Data hemat (F23)
- RTDB: ruang duel dan undangan bersifat sementara; Rules mengizinkan host/pemain menghapus seluruh ruang (`rooms/$roomId` hanya untuk hapus), dan `duel_active/$uid` hanya milik pemilik.
- Firestore: `learning_progress/{uid}/snapshot/main` hanya boleh ditulis pemilik, dengan kunci tetap dan batas nilai; dapat dibaca orang tua dan dihapus pemilik/orang tua.

## Kuis buatan guru (F25)
- Koleksi baru di bawah `classes/{id}`: `teacher_quizzes` (soal tanpa kunci; dibaca guru kelas dan murid aktif), `quiz_keys/{id}` (kunci; hanya guru kelas, Rules lama dipakai ulang), `quiz_answers/{id}_{uid}` (jawaban mentah murid; sekali kirim, tanpa update; dibaca guru dan pemilik; guru boleh hapus untuk kesempatan ulang).
- Penilaian dilakukan di app guru (kunci dibaca guru). Nilai ke murid hanya lewat guru menulis `results/tq_{id}_{uid}`; murid tidak pernah membaca kunci.
- Rules membatasi: jumlah soal 1-20, bidang dokumen, panjang jawaban = jumlah soal, id dokumen jawaban = `{kuis}_{uid}`. **Tidak ditegakkan Rules:** panjang teks soal/pilihan dan jumlah pilihan (hanya klien); nilai tiap elemen `answers`. Status: **BELUM TERUJI** (emulator tidak tersedia; hanya keseimbangan kurung dicek).
- Hapus kuis oleh guru ikut menghapus kunci, jawaban, dan nilai terkait supaya data tidak menumpuk.

## Duel dari paket kuis (F28b)
- Rules RTDB menambah validasi `meta.kind` (`hitung|paket`), `meta.packId` (`^[a-z0-9-]{1,60}$`), `meta.ver` (angka), `meta.order` (maks 10 bilangan bulat 0–99; paket wajib punya ketiganya), dan `packId` pada notifikasi. **BELUM TERUJI** (emulator tidak tersedia); hanya sintaks JSON diperiksa.
- Batas jujur (sama dengan duel hitung, lebih jelas untuk paket): kunci jawaban ada di bundel aplikasi, bukan di database. Klien yang dimodifikasi bisa mengetahui jawaban benar atau mengirim jawaban apa pun; Rules tidak bisa memeriksa kebenaran jawaban maupun waktu. Izin orang tua tetap hanya dicek di klien. Ruang tetap sementara (dihapus setelah selesai), tanpa riwayat duel.

## Penghapusan data (F29)
- Admin hanya dapat menghapus akun guru yang berstatus ditolak (bukan yang disetujui/menunggu): Rules `users/{uid}` dan `teacher_profiles/{uid}`. Kelas yang pernah dibuat guru yang dulu disetujui lalu ditolak TIDAK ikut terhapus (admin tidak punya hak atas kelas). Rules baru **BELUM TERUJI** (emulator tidak tersedia).
- Guru menghapus kelasnya sendiri dengan menghapus tiap subkoleksi lebih dulu dari klien (Firestore tidak punya hapus berantai). Bila proses terputus di tengah, sebagian data kelas bisa tersisa (dokumen kelas dihapus terakhir, jadi guru masih bisa mengulang "Hapus kelas").
- Hasil kelas kini hanya ditulis untuk misi aktif. Hasil lama dapat dibersihkan guru lewat "Bersihkan hasil lama".

## Jeda login bertingkat (F29b)
- `src/utils/loginGuard.ts`, dipasang di `signInWithIdentifier` (`auth.ts`) sehingga semua halaman masuk dengan sandi/PIN (murid, orang tua, guru, admin) ikut terjaga. Tangga jeda per akun (salah berturut-turut): 5 → 30 detik, 6 → 2 menit, 7 → 10 menit, 8 → 1 jam, 9 → 6 jam, 10 → 1 hari, 11 atau lebih → 3 hari. Masuk berhasil mereset hitungan akun itu. Hitungan dilupakan bila percobaan terakhir sudah lebih dari 7 hari. Tangga bisa diubah di `LOCK_LADDER`.
- Penghitung per perangkat (semua akun digabung) baru memicu jeda setelah 10 salah total (tangga yang sama mulai dari 30 detik), dilupakan setelah 24 jam, dan TIDAK direset oleh masuk berhasil (supaya tidak bisa direset memakai akun sendiri). Galat `auth/too-many-requests` dari Firebase memberi jeda minimal 5 menit.
- Layar menampilkan hitung mundur dan peringatan sisa percobaan (`LoginLock.tsx`); tombol Masuk nonaktif selama terkunci. Google Sign-In tidak terpengaruh.
- **Batas jujur**: ini perlindungan sisi klien (localStorage). Tidak menghentikan penyerang yang memanggil API Firebase langsung, memakai perangkat/peramban lain, menghapus data peramban, atau memajukan jam perangkat. Pembatasan sungguhan di server adalah milik Firebase Auth (otomatis, per IP/akun, tidak bisa diatur). Kunci akun di server butuh Cloud Functions (tidak ada di paket Spark). PIN anak 6 angka secara teori bisa ditebak lewat API; keamanannya bergantung pada nama pengguna acak (`pnt_xxxxxx`) dan pembatasan Firebase. Langkah tambahan yang bisa dilakukan pemilik di Firebase Console (tanpa kode): aktifkan "Email enumeration protection" (Authentication > Settings > User actions) dan pantau Authentication > Usage. Firebase App Check (reCAPTCHA) adalah pengerasan berikutnya, perlu tambahan kode dan konfigurasi.
- Diuji: logika tangga/perangkat/reset/lupa dengan jam tiruan (21 pemeriksaan) dan tampilan hitung mundur di Chromium. Belum diuji dengan Firebase Auth nyata (salah sandi sungguhan).

## Lupa sandi lewat email (F29b)
- Hanya untuk akun email (orang tua, guru, admin): `requestPasswordReset` (`auth.ts`) memakai `sendPasswordResetEmail` bawaan Firebase Auth. Firebase mengirim email berisi TAUTAN ke halaman bawaan Firebase untuk membuat sandi baru. Ini **bukan OTP**: OTP lewat SMS (Phone Auth) tidak tersedia di paket Spark (hanya Blaze, ditagih per SMS, per halaman harga Firebase saat dicek 21 Nov 2026), dan OTP email buatan sendiri butuh server (Cloud Functions) karena kode yang dibuat/diperiksa di klien tidak aman.
- Tidak membocorkan apakah email terdaftar (respons selalu tampak berhasil). Jeda per email dalam 24 jam: 1 menit, 5 menit, 15 menit, 1 jam, 24 jam; per perangkat (semua email) mulai menahan di permintaan ke-5. Jeda sisi klien saja; pembatas pengiriman sebenarnya milik Firebase.
- Murid (akun `pnt_xxxxxx@anak.pintara.invalid`, email tidak nyata) tidak bisa memakai jalur ini. Pemulihan PIN murid BELUM ADA: tanpa server tidak ada cara aman bagi orang tua untuk menyetel PIN akun lain. Pilihan desain ada di catatan pemilik (lihat jawaban fase F29b).
- Langkah opsional di Firebase Console (tanpa kode): Authentication > Templates > Password reset: ubah bahasa ke Indonesia, nama pengirim, subjek, dan isi pesan. Pastikan "Email enumeration protection" aktif bila ingin respons seragam dari server juga.
- Diuji: tangga jeda reset (31 pemeriksaan bersama jeda login), tampilan dan validasi di Chromium (email murid ditolak, jeda hanya tercatat bila Firebase memproses). Belum diuji dengan pengiriman email sungguhan.

## Hapus akun anak oleh orang tua (F30a-1) — Rules BARU, BELUM TERUJI
- Kode: `src/services/firebase/childDelete.ts`, tombol di `ChildAccounts.tsx`. Konfirmasi `useConfirm` (danger).
- Jalur dengan PIN: masuk sebagai anak lewat instance Firebase terpisah, hapus pertemanan/permintaan/blokir/undangan + simpul RTDB anak (sebisanya), lalu orang tua menghapus data kelas, riwayat, progres, nama pengguna, profil, dan `users/{anak}` PALING AKHIR, lalu `deleteUser` (akun Auth) dan dokumen `parent_accounts/{ortu}/children/{anak}`.
- Jalur lupa PIN: hanya bagian orang tua. Akun Auth anak TIDAK bisa dihapus tanpa Admin SDK: tetap ada (yatim), nama penggunanya tetap terpakai, dan anak yang memegang PIN lama masih bisa masuk (tanpa data). Sisa `friendships`/`friend_requests`/`blocked_users` anak tidak ikut terhapus (teman bisa menghapus pertemanannya sendiri).
- Urutan penting: Rules memakai `isParentOf` yang membaca `users/{anak}.parentUid`, jadi dokumen itu dihapus terakhir. Langkah idempoten; bila terputus, ulangi.
- Perubahan Rules: orang tua (`isParentOf`) boleh menghapus `usernames` anaknya; membaca dan menghapus `class_members`, `results`, `quiz_answers` anaknya; penerima boleh menghapus `game_invitations`. Konsekuensi: orang tua kini juga bisa MEMBACA keanggotaan kelas dan hasil kelas anaknya.
- Batas jujur: orang tua bisa menghapus `quiz_answers` anaknya (guru memberi kesempatan ulang dengan cara yang sama).
