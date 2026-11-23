# PROJECT_CONTEXT — PINTARA

Sumber utama untuk melanjutkan project di percakapan baru. Tanpa API key atau data pribadi.

## Identitas
PINTARA — "Belajar Bersama, Berkembang Bersama!" Platform belajar & game edukasi anak SD Indonesia. Tiga mode: Siswa (`/siswa`), Guru (`/guru`), Orang tua (`/ortu`).

## Teknologi
React 18, TypeScript, Vite 5, Tailwind 3, React Router (HashRouter), Firebase (Auth, Firestore, RTDB; paket Spark, tanpa Cloud Functions), Dexie (belum dipakai), vite-plugin-pwa (belum dipasang), GitHub Pages.

## Status (jujur)
| Fitur | Status |
|---|---|
| Design system, landing, navigasi | Selesai |
| Mode siswa (belajar, kuis, 3 game, profil; progres di localStorage) | Berfungsi, data contoh |
| Halaman guru & orang tua (tampilan) | Data contoh |
| Firebase Firestore/RTDB + rules | Dibuat & di-publish pengguna; BELUM diuji emulator |
| Login/daftar orang tua & guru, akun anak, guard peran (Fase F-1) | Kode ditulis; BELUM diuji (npm install tidak tersedia saat penulisan) |
| Sinkronisasi progres ke akun | Belum |
| Pertemanan (cari username, minta/terima/tolak, hapus, blokir, cermin RTDB) | Kode ditulis (F-2); BELUM diuji |
| Presence, undangan bermain, room, kelas langsung, laporan | Belum (rules sudah ada) |
| PWA / offline (service worker) | F18: selesai & diuji di Chromium (build nyata + reload offline). IndexedDB/Dexie: belum |
| Deployment GitHub Pages | Belum diuji |

## Keputusan teknis
- Peran dibaca dari `users/{uid}.role` (bukan claims). Guard frontend hanya UX; keamanan di rules.
- Login anak: username + PIN 6 angka → email sintetis `username@anak.pintara.invalid` (`CHILD_EMAIL_DOMAIN` di `services/firebase/auth.ts`). Belum diverifikasi diterima Firebase Auth.
- Akun anak dibuat orang tua lewat instance Firebase sekunder (persistensi memori). Urutan tulis: Auth anak → `parent_accounts/{ortu}/children/{anak}` → `users/{anak}` → batch `usernames`+`user_profiles`.
- Guru: `teacherVerified` diubah manual di Console (+ `verified_teachers/{uid}` di RTDB).
- Modul auth dimuat lazy (dynamic import) agar mode tamu ringan.

## Berkas Fase F-1
Baru: `src/services/firebase/auth.ts`, `src/hooks/useAuth.tsx`, `src/features/auth/{parts,RequireRole,LoginPage,RegisterPage}.tsx`, `src/features/parent/ChildAccounts.tsx`.
Fase F-2 (Teman): `src/services/firebase/friends.ts`, `src/features/friends/FriendsPage.tsx`; `App.tsx` diubah (rute `teman`).
Diubah: `src/types/index.ts`, `src/app/{App.tsx,navigation.ts}`, `src/layouts/ModeLayout.tsx`, `src/pages/LandingPage.tsx`, `src/features/parent/ParentPages.tsx`, `firebase.json` (path rules), `README.md`.

## Masalah diketahui
- Kode F-1 belum dikompilasi/diuji.
- `firebase.json` sebelumnya menunjuk `firebase/firestore.rules` padahal berkasnya `firebase/firebase.rules` (sudah diperbaiki).
- Persetujuan orang tua hanya kotak centang di UI (rules tidak menyimpan catatan persetujuan); perlu tinjauan UU PDP.

## Langkah berikutnya
1. Uji F-1 (lihat langkah uji di balasan terakhir), perbaiki galat.
2. Sinkronisasi progres siswa ke `learning_progress` (Fase F-2), antrean offline Dexie (Fase G).
3. Pertemanan & undangan.

## Catatan F-3
- Config Firebase (publik) kini dibaca dari `.env.production` (di-commit); workflow tidak lagi memakai GitHub Variables untuk Firebase. Penyebab login "belum tersedia" di GitHub Pages: variabel kosong saat build.
- Halaman `/ruang` (pilih ruang) + tombol "Ganti ruang" di header tiap mode.
- Zoom dinonaktifkan (viewport + gesturestart). Catatan aksesibilitas: pengguna low-vision tidak bisa cubit-zoom.

## Catatan F-10 (aplikasi admin terpisah)
- Dua aplikasi dari satu repo (Vite multi-page): utama `/` dan admin `/admin/` (`admin/index.html`, `src/admin/main.tsx`, `public/admin/*` dengan manifest & ikon sendiri). Kode admin tidak ada di bundel aplikasi utama.
- Keduanya satu origin (github.io): penyimpanan & sesi login dipakai bersama. Isolasi penuh butuh subdomain sendiri.
- Dev lokal: `http://localhost:5173/pintara/admin/` (atau sesuaikan VITE_BASE_PATH).
- Service worker/PWA belum (Fase G); saat dibuat, scope admin harus `/admin/`.

## Catatan F-11 (integrasi guru–murid–orang tua)
- Kemajuan lokal kini per pemilik (`pintara:progress:v2:<uid|guest>`). `ProgressBridge` mengganti pemilik saat login/logout dan menjalankan `progressSync` (XP, hasil per kuis, hasil per kelas) ke Firestore. Hanya akun siswa yang disinkronkan.
- Kelas nyata: `services/firebase/classes.ts` (buat kelas + kode dalam 1 batch, ganti nama/tingkat/arsip, gabung dengan kode, setujui/tolak/keluarkan). `class_members` kini memuat `displayName` (Rules diubah; WAJIB publish ulang).
- Guru: Beranda/Kelas/Detail Kelas/Hasil memakai data nyata. "Coba" kuis memakai rute guru `/guru/kuis/:id` (pratinjau, tidak mencatat apa pun).
- Orang tua: Beranda/Perkembangan membaca `learning_progress` anak.
- Kelas langsung (`/guru/langsung`): acak nama, bagi kelompok, kuis tim; lokal di 1 perangkat.
- Batas: belum diuji dengan Firebase nyata; sesi game tidak disinkronkan; nilai kelas hanya dari kuis yang dikerjakan online; `verified_teachers` RTDB tetap manual; avatar belum ditulis balik ke akun.

## Catatan F-12 (halaman masuk 3-in-1)
- `/masuk` kini `MasukPage`: besar = Google (orang tua; profil orang tua dibuat otomatis bila belum ada) + nama pengguna/PIN (murid) / email+sandi; kecil "Saya guru" = masuk/daftar guru (Google atau email; guru baru tetap menunggu verifikasi admin).
- `signInWithGoogle(role)` di `services/firebase/auth.ts` memakai popup; tidak pernah mengubah peran akun yang sudah ada. Syarat Console: Authentication > Sign-in method > Google aktif, dan Settings > Authorized domains memuat `engyourbae.github.io`.
- Sesi tetap (persistensi bawaan Firebase). `/` dan `/ruang` langsung diarahkan ke ruang peran bila sudah masuk (`GuestOnly`); logo di ModeLayout menuju beranda ruangnya; "Ganti ruang" disembunyikan saat masuk; akun yang membuka ruang peran lain dikembalikan ke ruangnya.
- Aplikasi admin tetap terpisah; `LoginPage` (dengan prop `home`) kini juga punya tombol Google.
- Akun anak tidak bisa memakai Google (tidak punya email); tetap nama pengguna + PIN.

## Catatan F-13 (misi kelas)
- Guru memberi "misi" (kuis atau game) per kelas di Detail Kelas. Disimpan di `classes/{id}/quizzes` (Rules diperketat: field wajib, tanpa update). Murid membukanya di `/siswa/kelas/:classId` (dari kartu "Kelasku").
- Status misi: kuis dari hasil terbaik (lokal + `results`); game dianggap selesai bila pernah dimainkan (skor>0), disinkronkan sebagai hasil `game_<id>` skor 100. Skor asli game tidak dikirim.
- Belum ada: tenggat, kunci jawaban kuis buatan guru sendiri, notifikasi misi baru. WAJIB publish ulang Firestore Rules.

## Catatan F-14 (rapikan masuk & akun)
- `/masuk` (orang tua/murid) punya pilihan Masuk | Akun baru (orang tua: Google atau email+sandi; murid tidak mendaftar sendiri). Semua tombol setinggi `Button size="lg"` (h-14). "Saya guru" mengganti seluruh tampilan ke panel guru (naik ke atas) dengan tombol Kembali.
- Tombol Keluar dipindah dari header ke `AccountMenu` (ikon akun) dan selalu memakai dialog konfirmasi (Batal / Ya, keluar).

## Catatan F-15 (tanpa tarik-muat-ulang & pemberitahuan update)
- `overscroll-behavior: none` pada html/body: tarik-untuk-muat-ulang dimatikan.
- Update tanpa service worker: build menulis `version.json` (ID build, dari `vite.config.ts`); `useAppUpdate` membandingkannya dengan `__BUILD_ID__` (saat dibuka, tiap 10 menit, saat kembali ke aplikasi/online). `UpdatePrompt` menampilkan Perbarui/Nanti; tidak pernah muat ulang otomatis. Dipasang di aplikasi utama dan admin.
- Batas: ini deteksi versi baru, BUKAN cache offline. Service worker/offline tetap Fase G; saat ditambahkan, hubungkan tombol Perbarui ke `registration.waiting`.

## Catatan F-17 (layar fokus)
- `ModeLayout` menyembunyikan header dan bilah menu di layar aktivitas: siswa `belajar/:id`, `game/:id`, `kelas/:id`; guru `kuis/:id` (pratinjau). Keluar lewat tombol X/Kembali di halaman itu. Daftar (Belajar, Permainan) dan Beranda tetap memakai menu penuh.

## Catatan F18 (Fase G: offline)
- `vite.config.ts` plugin `serviceWorkerFile` menulis `dist/sw.js` saat build (tanpa vite-plugin-pwa): precache HTML, JS/CSS/lazy chunk aplikasi utama, font Latin, ikon. Admin & `version.json` tidak ditangani SW (selalu jaringan).
- Strategi: navigasi = jaringan dulu, gagal -> `index.html` tersimpan; aset lain = cache dulu, lalu jaringan (disimpan). Cache bernama `pintara-<BUILD_ID>`; cache lama dihapus saat aktivasi.
- Pembaruan: worker baru menunggu; `UpdatePrompt` (Perbarui) memanggil `applyWaitingUpdate()` (`src/services/offline/sw.ts`) -> SKIP_WAITING + muat ulang. Cek `version.json` tetap jadi cadangan.
- `OfflineNotice` menampilkan penanda saat tanpa internet. Hanya didaftarkan di produksi (bukan dev).
- Antrean sinkronisasi: kemajuan sudah local-first dan `progressSync` idempoten + berjalan lagi saat `online`, jadi Dexie belum dibutuhkan. Persistensi offline Firestore SDK sengaja BELUM diaktifkan (promise tulis menggantung saat offline dan mengganggu loop sinkronisasi).
- Belum: sinkron skor game, data guru/orang tua offline (butuh jaringan), uji di perangkat/hosting nyata (BELUM DIKETAHUI).

## Catatan F19 (bank soal tahap 1)
- Bank soal nyata di `src/data/bank/batches/*.json` (lihat `docs/BANK_SOAL.md`); `src/data/sample/index.ts` menggabungkan bank + sisa paket `contoh-*` (nama ekspor `sampleContents` dipertahankan). `isSampleContent` menentukan label `SampleBadge` di daftar belajar.
- Tahap 1: 10 paket x 10 soal (100 soal). Belum ditinjau guru. Validator `validate-bank.mjs` dijalankan di `npm run typecheck` (otomatis di CI).
- Tahap berikutnya ditambah bertahap; setelah bank memadai: sinkron skor game.

## Catatan F20 (bank soal tahap 2)
- `b02-sekolah-lanjutan.json`: 10 paket x 10 soal (total bank 200 soal, 20 paket). Paket contoh `contoh-mat-2` (perkalian) dan `contoh-mat-3` (pecahan) dihapus karena digantikan bank nyata. Belum ditinjau guru. Berikutnya: tahap 3 lalu sinkron skor game.

## Catatan F21 (rasa aplikasi + undangan kelas)
- Tahan lama tidak lagi memilih teks / memunculkan menu peramban: CSS `user-select:none` di body + `contextmenu` dicegah di `src/utils/noZoom.ts`. Kolom isian dan elemen `.boleh-pilih` tetap bisa dipilih. Konsekuensi: teks penting harus punya tombol salin sendiri.
- Kelas: `ClassDetail` punya tombol Salin kode, Salin tautan, Bagikan undangan (`navigator.share`, cadangan salin). Tautan `#/gabung/KODE` (`InvitePage`) hanya menyimpan kode di sessionStorage; murid masuk lalu `JoinClassCard` terisi otomatis dan tetap menekan Gabung; guru tetap menyetujui. Undangan TANPA kode tidak dibuat (Spark tanpa Functions; kode = kunci Rules). Tautan bocor: arsipkan kelas.

## Catatan F22 (duel teman, offline tetap masuk, layar memuat)
- **Duel Kilat Hitung 1 lawan 1** (`/siswa/game/duel/:roomId`): tombol "Undang main" di daftar teman -> `inviteFriend` (rooms + notifications di RTDB, memakai Rules yang SUDAH ADA, tanpa perubahan Rules). Penerima melihat `GameInvites` (di Beranda dan halaman Teman): Terima/Tolak. Tuan rumah menggerakkan alur (soal -> pembahasan -> selesai). Skor dihitung dari jawaban tercatat (cap waktu server): benar = 100, bila keduanya benar yang lebih cepat +20. Kode: `src/services/firebase/duel.ts`, `src/features/games/{DuelPage,duelCore}.ts(x)`, `src/features/friends/GameInvites.tsx`.
- Batas diketahui: izin orang tua (`friendsEnabled` + `multiplayerEnabled`) hanya dicek di klien (RTDB tidak bisa membaca Firestore); soal tanpa kunci jawaban di ruang (klien menghitung dari soal hitungan); jawaban yang ditulis setelah waktu habis tidak ditolak Rules; data ruang lama tidak dihapus (Rules tidak mengizinkan); status online (presence) belum dipakai; undangan butuh cermin teman di RTDB di kedua sisi (`ensureMirror` dipanggil saat Beranda/Teman dibuka) -> bila teman belum pernah membuka aplikasi sejak berteman, undangan ditolak dengan pesan ramah. **BELUM TERUJI dengan dua akun nyata** (BELUM DIKETAHUI).
- **Offline tetap masuk**: `useAuth` menyimpan salinan profil (uid, peran, nama) di localStorage `pintara:auth-user:v1`; saat offline/galat jaringan dipakai salinan (status `ready`), dimuat ulang saat online lagi; dihapus saat keluar akun. Hanya UX; Rules tetap pengaman data.
- `OfflineNotice` kini hanya tampil beberapa detik di bawah (tidak menetap, tidak menutupi header). `LoadingScreen` + splash animasi di `index.html` (dihapus `main.tsx` setelah render).

## Catatan F23 (data hemat: duel numpang lewat + progres ringkas)
- **Duel tidak menumpuk**: ruang RTDB dihapus seluruhnya oleh tuan rumah ~8 detik setelah selesai atau saat keluar (`deleteRoom`); penunjuk `duel_active/{uid}` memungkinkan ruang yang ditinggalkan dibersihkan saat aplikasi dibuka berikutnya (`cleanupMyDuel`, ruang >30 menit/selesai). Undangan kedaluwarsa dihapus penerimanya. Tidak ada riwayat duel; hanya skor terbaik lokal (`duel-kilat`) + XP yang ikut sinkronisasi. **Wajib publish ulang `firebase/database.rules.json`** (aturan hapus ruang + `duel_active`).
- **Progres ringkas** yang tersimpan di Firestore per anak: `learning_progress/{uid}` (XP -> level), `items/{kuis}` (hasil terbaik per kuis yang pernah dikerjakan), BARU `snapshot/main` (satu dokumen: rangkaian hari, skor game terbaik <=40, hitungan benar/jawab). **Wajib publish ulang `firebase/firebase.rules`**. Tanpa publish, ringkasan dilewati diam-diam (XP/kuis tetap jalan).
- Hemat kuota baca: `progressSync` membaca data server SEKALI per sesi (dan setelah kembali online) untuk memulihkan data setelah peramban dibersihkan; selanjutnya hanya menulis yang berubah (item/ringkasan dibandingkan dulu), daftar kelas di-cache 5 menit. `mergeRemote` kini juga memulihkan skor game dan rangkaian hari.
- Catatan: menghapus data situs di Chrome juga menghapus sesi login; anak perlu masuk lagi (nama pengguna + PIN), lalu progres terpulih otomatis. BELUM TERUJI dengan Firebase nyata.

## Catatan perbaikan layar memuat
- Aturan global `prefers-reduced-motion` di `index.css` mematikan semua animasi (ponsel dengan "hapus animasi"/hemat baterai), sehingga splash/loading terlihat diam. Kini layar memuat memakai kelas `.muat-logo`/`.muat-dot` (melayang; bila kurangi-animasi aktif diganti denyut halus) dan splash `index.html` punya varian denyut yang sama. Splash tampil minimal ±0,6 dtk sejak halaman dibuka (`MIN_SPLASH_MS` di `main.tsx`).

## Catatan layar memuat v2 (burung Pinta)
- `LoadingOwl` (SVG): Pinta melompat, sayap mengepak, pensil bergoyang, huruf/angka beterbangan, 3 bintang menyala bergantian. CSS `.lo-*` ada di `src/styles/index.css` DAN salinannya di `index.html` (splash); ubah keduanya bersamaan.
- Kedip mata (juga `animate-kedip` di `tailwind.config.js`): jeda 2 dtk -> kedip 1x -> jeda 2 dtk -> kedip 2x -> ulang (siklus 4,6 dtk). Tetap jalan walau "kurangi animasi" aktif (gerak besar diganti denyut).
- Splash tidak lagi hilang saat React pertama tampil: `SplashGate` menunggu status akun selesai (min. 0,9 dtk). Splash punya pesan bergantian; >10 dtk pesan "sabar", >20 dtk tombol "Muat ulang" (jalan sendiri walau JS macet). `LoadingScreen` memakai perilaku yang sama.


## Catatan F24
- Bank soal tahap 3 (`b03-sekolah-pelengkap`, 100 soal; total 300 soal / 30 paket). Ditulis AI, belum ditinjau guru. 4 paket `contoh-*` yang tergantikan dihapus dari `contents.json`. Tidak ada perubahan kode atau Rules.

## Catatan F25 (kuis buatan guru)
- Baru: `src/services/firebase/teacherQuizzes.ts`, `src/features/teacher/TeacherQuizPanel.tsx` (buat kuis, lihat benar/salah per murid per soal, bagikan nilai, kesempatan ulang, hapus), `src/features/student/TeacherQuizPlay.tsx` (rute `/siswa/kelas/:classId/kuis/:quizId`, layar fokus dengan tombol keluar).
- Diubah: `ClassDetail.tsx` (panel kuis), `StudentClass.tsx` (daftar kuis guru + status), `App.tsx` (rute), `src/data/missions.ts` (`resultTitle` untuk kunci `tq_`), `firebase/firebase.rules` (WAJIB publish ulang), docs.
- Alur: guru membuat kuis (soal ke `teacher_quizzes`, kunci ke `quiz_keys`) → murid mengirim jawaban sekali → guru melihat benar/salah (dihitung di app guru) → guru "Bagikan nilai" menulis `results/tq_{id}_{uid}` → murid melihat nilai di halaman kelas. Belum ada: edit kuis (hapus lalu buat ulang), batas waktu, kunci diperlihatkan ke murid setelah selesai.
- Belum teruji: build/tsc (sandbox tanpa node_modules), Rules baru, alur dengan akun nyata.

## Perbaikan layar memuat macet (fix-loading3)
- Gejala: splash tertahan selamanya. Penyebab yang ditutup: (1) `getDoc` profil bisa menggantung tanpa galat di jaringan yang memblokir WebChannel → `getDb()` kini memakai `experimentalAutoDetectLongPolling`; (2) `useAuth`: batas 8 dtk untuk `fetchAppUser` dan watchdog 10 dtk (status `loading` → salinan profil bila ada, jika tidak `error`), plus coba segarkan tiap 20 dtk selama memakai salinan; (3) `SplashGate`: splash dihapus paksa setelah 14 dtk; (4) `ErrorBoundary` menghapus splash agar pesan galat terlihat (sebelumnya galat render/chunk gagal tertutup splash).
- Penyebab pasti di perangkat pemilik BELUM DIKETAHUI; belum teruji di ponsel.

## Catatan F26
- Setiap paket (38 paket) sekarang 30 soal, versi 2. Hanya data JSON dan docs yang berubah; tidak ada kode atau Rules. `progressSync` hanya menyimpan nomor versi bersama hasil terbaik, jadi hasil lama tetap aman.

## Catatan F25b
- Kuis buatan guru kini juga muncul di menu **Kuis** guru (bagian "Kuis buatan saya", pilih kelas bila punya lebih dari satu), bukan hanya di dalam halaman detail kelas. `TeacherPages.tsx` (`MyQuizzes`).

## Catatan F27 (undangan mengambang)
- Baru: `src/features/friends/FloatingInvites.tsx` (dimuat lazy dari `ModeLayout` untuk peran siswa, termasuk layar fokus; disembunyikan di rute `/game/duel/`). Menampilkan permintaan berteman dan ajakan Duel dengan tombol Terima/Tolak (+ "Nanti"), maksimal 2 kartu.
- Dihapus: `GameInvites.tsx` (kotak undangan di Beranda dan Teman digantikan kartu mengambang). `FriendsPage` memuat ulang daftar bila kartu mengambang menerima/menolak (event `FRIENDS_CHANGED`).
- Hemat data: ajakan lewat langganan RTDB yang sama; permintaan teman lewat satu query (`listIncomingRequests`) saat dibuka, tiap 90 dtk bila layar terlihat, saat kembali ke aplikasi, dan saat daftar berubah. Tidak ada koleksi atau Rules baru.
- Belum teruji dengan dua akun nyata.

## Catatan F28a–b (poin cepat kuis tim, duel dari paket)
- **Skor cepat bersama**: `src/features/games/scoring.ts` (tingkat waktu + `teamQuizPoints`). Dipakai `TeamQuiz.tsx`: benar ≤5 dtk = 15, ≤10 dtk = 12, lebih lambat = 10, salah = 0; waktu per giliran dihitung di perangkat guru (tanpa Firebase).
- **Duel dari paket kuis (F28b)**: tombol "Duel dengan teman" di kuis Belajar (layar soal pertama dan layar hasil; hanya akun anak, bukan pratinjau guru) membuka `src/features/friends/PackDuelPicker.tsx` -> `inviteFriend(..., pack)`. Ruang punya `meta.kind: 'hitung'|'paket'`; untuk `paket` hanya `meta.packId`, `meta.ver` (versi paket), dan `meta.order` (10 indeks soal) yang disimpan; **tidak ada node `questions` dan tidak ada kunci jawaban di database**. Kedua klien membaca paket dari bundel (`sampleContents`) dan menghitung benar/salah sendiri (`packQuestions`, `scoreAll(..., correct)`). Bila paket/versi di perangkat penerima berbeda, `DuelPage` menampilkan "Perbarui PINTARA dulu". Waktu per soal paket 20 dtk (`DUEL_PACK_LIMIT`); skor sama dengan duel hitung (benar 100, lebih cepat +20). Skor terbaik dicatat di kunci `duel-kilat` yang sama (tidak menambah entri). Undangan membawa `packId` (kartu mengambang menulis judul paket). **Wajib publish ulang `firebase/database.rules.json`** (field `kind/packId/ver/order` di `meta`, `packId` di notifikasi); BELUM TERUJI.

## Catatan F28c (game baru dari bank soal + memori)
- **Menu game** (`GamePages.tsx`): dikelompokkan (Hitung & Logika, Kata & Pengetahuan, Ingatan), label "Baru", bintang terbaik untuk game baru (`starsOfBest` di `scoring.ts`), kartu **Tantangan hari ini** (paket bank dipilih dari tanggal lokal lewat `daily.ts`; soal 10 acak berbiji tanggal+paket, sama untuk semua murid; TANPA data baru dan TANPA hadiah khusus, hanya Kuis Kilat biasa) dan petunjuk duel.
- **Kuis Kilat** (`/siswa/game/kuis-kilat`, `BankGames.tsx`): pilih paket apa pun (filter kelompok), 10 soal acak dari 30, 15 dtk/soal, poin cepat sama dengan kuis tim (15/12/10), beruntun ≥3 beri bonus XP kecil (`comboBonusXp`). XP = 3/benar + bonus. Skor terbaik di kunci `kuis-kilat` (maks 150 → bintang 90/135).
- **Benar atau Salah Kilat** (`/siswa/game/benar-salah`): soal+satu pilihan ditampilkan sebagai "Jawaban: X", tebak benar/salah; 30 dtk, 3 nyawa, +10 poin/benar, XP maks 30; kunci skor `benar-salah` (bintang 60/100). Soal dari seluruh bank + paket contoh (teks AI, belum ditinjau guru).
- **Pasangan Memori** (`/siswa/game/pasangan-memori`, `MemoryGame.tsx`): tema Kata–Arti, Pecahan–Desimal, Hewan–Habitat, Sila–Lambang (5 pasang), Campur; 4/6/8 pasang (dibatasi jumlah pasang tema); bintang dari langkah (`memoryStars`); skor = bintang×100 + bonus waktu 0–60, kunci `memori-4/6/8`. Data pasangan ditulis tangan di berkas.
- Semua game baru mencatat XP dan skor terbaik lewat `progressActions.recordGame` (ikut `snapshot/main`, kini maks 40 entri tetap terpenuhi). **Belum jadi misi kelas** (`GAME_MISSIONS` tidak diubah).
- `progressSync.ts`: hasil game ke kelas kini hanya untuk game di `GAME_MISSIONS` (sebelumnya semua game yang pernah dimainkan, termasuk `duel-kilat`, menulis dokumen `results/game_*` per kelas). Dokumen lama yang sudah tertulis tidak dihapus otomatis.

## Catatan F28d (satu bahasa poin)
- `src/features/games/scoring.ts` kini satu-satunya tempat konstanta dan teks aturan skor: poin cepat (`SPEED_RULES`, `quickPoints`, `teamQuizPoints`: 15/12/10), duel (`DUEL_CORRECT_POINTS` 100, `DUEL_FAST_BONUS` 20, `DUEL_RULES`), Benar/Salah (`TF_*`, `tfXp`), Kilat Hitung (`kilatHitungPoints`: 10 + sisa detik, rumus lama dipertahankan agar skor terbaik tetap sebanding), bintang game baru (`starsOfBest`, `memoryStars`). Dipakai `TeamQuiz`, `BankGames`, `DuelPage`, `duelCore`, `PackDuelPicker`, `GamePages`. Ubah angka di sana, jangan di komponen.
- Ringkasan skor: kuis tim dan Kuis Kilat = poin cepat; duel = 100 + bonus 20; Benar/Salah = 10/benar; Memori = bintang dari langkah. Bank soal tidak berubah di F28 (`docs/BANK_SOAL.md` tetap berlaku).
- Batas jujur duel paket dan Rules baru: lihat `docs/keamanan.md` (F28b). Belum teruji dengan Firebase nyata: duel paket dua akun, Rules RTDB baru.

## Catatan fix-loading4 (splash macet di jaringan lambat)
- **Penyebab (terukur)**: SDK Firebase (Auth+Firestore+Realtime Database, ±1,1 MB / 288 kB gzip) ikut di bundel awal karena `StudentPages` mengimpor `JoinClassCard` secara statis (dan sejak F28b `LearnPages` mengimpor `PackDuelPicker`). Aplikasi tidak bisa tampil sebelum semuanya terunduh, jadi splash tertahan di jaringan lambat. Service worker juga menunggu jaringan tanpa batas untuk `index.html`.
- **Perbaikan**: `JoinClassCard` dan `PackDuelPicker` dimuat lazy (`React.lazy`); `getRtdb` dipindah ke `src/services/firebase/rtdb.ts` (client.ts tidak lagi mengimpor `firebase/database`, jadi pemeriksaan akun tidak mengunduh RTDB); bundel awal turun dari ±1,4 MB (±363 kB gzip) menjadi ±480 kB (±138 kB gzip). Aturan: **jangan impor `@/services/firebase/*` atau `firebase/*` secara statis dari berkas yang terhubung ke `App.tsx`** (cek: `npm run build` lalu pastikan potongan `noZoom-*.js` kecil, ±190 kB, dan tidak berisi `FirebaseError`).
- **Service worker** (`vite.config.ts`): navigasi tetap jaringan-dulu, tetapi bila jaringan tidak menjawab dalam 4 dtk dipakai `index.html` tersimpan (berpasangan dengan JS tersimpan). Tanpa salinan (kunjungan pertama) tetap menunggu jaringan.
- **Splash** (`index.html`): tombol "Muat ulang" muncul setelah 15 dtk (sebelumnya 20), dan segera bila berkas JS/CSS gagal diunduh.
- Uji (jaringan dibatasi di Chromium, server gzip): 60 KB/s: 6,9 → 3,1 dtk; 20 KB/s: 19,2 → 8,2 dtk sampai aplikasi tampil. Dengan `index.html` menggantung dan service worker terpasang: aplikasi tampil dari salinan dalam ±4 dtk. Penyebab macet di ponsel nyata tetap BELUM DIKETAHUI pasti; bila masih terjadi, minta tangkapan layar setelah >20 dtk.

## Catatan F29 (level soal, pencarian, kelola data)
- **Level soal** (`src/features/learning/levels.ts`, `LearnPages.tsx`): paket dibagi level berisi 10 soal menurut urutan di paket (`LEVEL_SIZE`). Akun murid/tamu memilih level lebih dulu (`LevelPicker`); level berikutnya terbuka setelah level sebelumnya selesai. Sesi hanya berisi soal level itu yang belum dikerjakan (diacak). Soal sesi ditandai "sudah dikerjakan" saat sesi selesai (`progressActions.markLevelDone`), jadi tidak muncul lagi sampai semua soal paket selesai; lalu tombol "Ulangi dari awal" (`resetLevels`) membuka semuanya lagi. Kemajuan level disimpan **hanya di perangkat** (`Progress.levelDone`, id soal per paket) dan TIDAK disalin ke Firebase. Konsekuensi: berganti perangkat atau menghapus data peramban mengulang dari Level 1. Pratinjau guru tetap menampilkan semua soal tanpa level.
- **Menambah soal**: tambahkan soal BARU di AKHIR `questions` sebuah paket dengan id baru yang unik (naikkan `version`). Level lama tetap sama; 10 soal baru membentuk level baru (sisa <10 mengisi level terakhir). Menyisipkan soal di tengah menggeser batas level dan bisa membuat level yang sudah selesai tampak belum selesai.
- **Pencarian**: `SearchBox` + `matchesSearch` (`src/components/ui/SearchBox.tsx`) dipakai di daftar Belajar murid, daftar paket kuis guru, dan `ContentPicker` (pilih kuis untuk misi kelas).
- **Misi kelas**: pilihan yang sudah ditugaskan tampil abu-abu dan tidak bisa dipilih (`ChoiceGroup` kini mendukung `disabled` per opsi; `ContentPicker`).
- **Hemat Firebase**: (1) `progressSync` kini menulis hasil kelas HANYA untuk kuis/game yang menjadi misi kelas itu (sebelumnya semua kuis yang pernah dimainkan murid ditulis ke setiap kelas); (2) `deleteMission` ikut menghapus hasil misi itu; (3) `pruneClassResults` ("Bersihkan hasil lama") menghapus hasil yang bukan misi dan bukan nilai kuis guru; (4) `deleteClassCascade` ("Hapus kelas") menghapus misi, kuis guru + kunci, jawaban, hasil, anggota, kode gabung, sisa kelas langsung di RTDB (best-effort), lalu dokumen kelas PALING AKHIR (Rules memeriksa dokumen kelas); (5) admin dapat menghapus guru berstatus **ditolak** (`deleteRejectedTeachers`, satu per satu atau semua). Kuis buatan guru sudah bisa dihapus sepenuhnya sejak F25 (`deleteTeacherQuiz`). Akun masuk (Firebase Auth) guru yang dihapus tidak bisa dihapus dari aplikasi (tanpa Cloud Functions).
- **Rules berubah** (`firebase/firebase.rules`, BELUM TERUJI, wajib publish ulang): `users/{uid}` delete oleh admin hanya untuk guru `teacherRejected == true` dan bukan `teacherVerified`; `teacher_profiles/{uid}` delete oleh admin dengan syarat yang sama (dibaca dari dokumen `users`, jadi hapus keduanya dalam satu batch). Hapus kelas dan hapus misi tidak butuh perubahan Rules.

## Catatan F29b (jeda login)
- Jeda bertingkat salah sandi: `src/utils/loginGuard.ts` (murni, tanpa Firebase; tangga `LOCK_LADDER`), dipanggil dari `signInWithIdentifier` di `auth.ts`; UI `src/features/auth/LoginLock.tsx` (`useLoginLock`, `LoginLockNotice`) dipakai `MasukPage` (murid dan guru) dan `LoginPage` (admin). Detail dan batas jujur: `docs/keamanan.md`.
- **Lupa sandi (F29b)**: `ForgotPassword.tsx` (di luar `<form>` masuk) di `MasukPage` (murid/orang tua dan guru-masuk) dan `LoginPage` (admin); `requestPasswordReset` di `auth.ts`; jeda reset di `loginGuard.ts` (`checkResetCooldown`, `recordResetRequest`). Tautan email, bukan OTP. Murid tidak punya pemulihan PIN (lihat `docs/keamanan.md`).

## F30a-1 — Hapus akun anak (BELUM TERUJI dengan Firebase nyata)
`childDelete.ts` (`deleteChildAccount(child, pin | null, onStep)`) + tombol "Hapus akun anak" di `ChildAccounts.tsx` (PIN → hapus lengkap; "Lupa PIN" → hanya data). Rules diubah (lihat `docs/keamanan.md`); publish ulang `firebase/firebase.rules`. Urutan hapus diuji dengan Firestore tiruan di memori (bukan Rules asli).

## F34–F35 — Komik Pintar (game komik interaktif cari benda & seret) — Level 1 dan 2
Rute `game/komik-pintar` (lazy di `App.tsx`; menu Permainan, kategori "Cerita & Cari"). Bukan game petualangan: tanpa joystick atau gerak karakter. Berkas di `src/features/games/`:
- `KomikArt.tsx`: gambar vektor SVG (tanpa berkas gambar). `Chibi` (who: guide | boy | girl; mood: idle, talk, happy, sad, surprised, think, wave, excited, point, confused). F35: lengan berputar di bahu dan siku dengan CSS transition (pose berganti halus), kepala miring pelan, kedip tidak teratur, mulut membuka-menutup, ekspresi memudar (bukan terpotong), gradasi kulit/hijab/rambut, jubah pemandu. **Pemain perempuan dan pemandu SELALU berhijab** (rambut tidak pernah terlihat). Animasi `km-*` di `src/styles/index.css` (mati saat reduced-motion). Juga benda dan latar taman. Maskot burung hantu "Pinta" tetap dipakai di bagian lain aplikasi.
- `KomikScenes.tsx` (F35): `ObjArt` (semua benda: bunga, penyiram, kupu-kupu, buku, boneka, balok, mobil, kunci), `GardenScene`, `RoomScene`. Urutan lapisan menentukan "tersembunyi": benda digambar SEBELUM perabot yang menutupinya sebagian.
- `komikData.ts`: `LEVELS` = Level 1 Taman Kesayangan (90 dtk, `bestKey` 'komik') dan Level 2 Kamar Berantakan (80 dtk, `bestKey` 'komik-kamar'; level 2 terbuka setelah level 1 selesai). Level digerakkan data: `objs` (letak, petunjuk bertahap `hints`, `placeHint`), `targets` (menerima daftar benda, `cap` kapasitas, mis. kotak mainan menampung 2), `missions` (fungsi `done`), `afterFound`. Menambah level: tambah objek data + adegan di `KomikScenes.tsx` + daftar di `LEVELS`. Bintang: 3 bila selesai dengan sisa waktu ≥50% dan bantuan ≤1; 2 bila sisa ≥20%; selain itu 1; waktu habis = 0 (tidak menyimpan apa pun). Skor = 50/benda ditemukan + 50/benda diletakkan + 2/dtk sisa − 30/bantuan. XP dan koin HANYA pada penyelesaian pertama tiap level (20 + 5×bintang XP; koin 5 + 5×bintang).
- `komikSuara.ts` (F35, menggantikan TTS): suara karakter dibuat WebAudio di perangkat (oskilator gigi gergaji + dua filter formant), ucapan tak bermakna: sapa "Hiii-buup!", senang "Yipiii!", terkejut "Woop?!", bingung "Mmm... blup?", berhasil "Yaa-bii!", kecewa "Aww-bup...", idle "Hmm-bli..."; dialog biasa = celoteh acak pendek. Gelembung suara kecil ("Yipiii!") muncul di atas pemandu. Tanpa berkas audio dan tanpa suara Google/TTS. `siapkanSuara()` dipanggil dari ketukan pemain agar peramban mengizinkan suara. Pengaturan di `localStorage['pintara:komik:suara']`. Gumaman idle hanya tiap ≥9 dtk tanpa suara lain. BELUM DIUJI di ponsel nyata (hanya dipastikan tidak galat); mutu dan keras-lembut suara perlu didengar langsung.
- `KomikPintar.tsx`: menu (pilih cowok/cewek, wajib sebelum mulai; kartu level) + permainan. Ketuk benda tersembunyi; seret benda dari daftar bawah ke sasaran (pointer events) ATAU ketuk benda lalu ketuk sasaran (cadangan). Salah letak: benda kembali, pemandu memberi petunjuk, waktu tetap jalan. Waktu berhenti saat jeda atau saat aplikasi disembunyikan. Petunjuk teks otomatis setelah ±14 dan ±28 detik tanpa kemajuan; tombol Bantuan melingkari benda berikutnya (mengurangi skor dan peluang bintang 3). Peringatan saat sisa ≤20 dtk.
- Penyimpanan: `Progress.komik` (bintang terbaik per level), `komikHero`, `koin` (hanya di perangkat) dan `gameBest['komik'|'komik-kamar']` = bintang×1000 + skor (angka kecil ke Firebase; tidak ada perubahan Rules). Aksi `progressActions.recordKomik(levelId, stars, bestKey, best, gained, coins)`, `setKomikHero`.
- Batas jujur: ilustrasi di dalam adegan tidak terbaca pembaca layar (hanya tombol dan teks dialog); belum diuji di ponsel nyata (kecepatan, suara, seret dengan sentuhan); tampilan diperiksa lewat tangkapan layar tanpa Tailwind. Ilustrasi digambar dengan kode (SVG), bukan seni tangan: bila ingin tampilan seperti lembar referensi, siapkan aset PNG transparan dan `Chibi` bisa diganti. Level 3–5 dan variasi misi (susun, cocokkan, bersihkan, ketuk-interaksi seperti menyalakan lampu) = tahap berikutnya.
