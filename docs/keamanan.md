# Keamanan PINTARA (Firebase Spark, tanpa Cloud Functions)

Status rules: **ditulis, belum diuji di emulator**. Uji dulu sebelum dipakai publik (lihat bagian Pengujian).

## Langkah admin manual (wajib)
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
