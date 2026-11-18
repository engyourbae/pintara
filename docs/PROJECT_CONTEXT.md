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
| PWA / offline (service worker, IndexedDB) | Belum |
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
- `/masuk`: semua tombol setinggi `Button size="lg"` (h-14). "Saya guru" mengganti seluruh tampilan ke panel guru (naik ke atas) dengan tombol Kembali.
- Tombol Keluar dipindah dari header ke `AccountMenu` (ikon akun) dan selalu memakai dialog konfirmasi (Batal / Ya, keluar).

## Catatan F-15 (tanpa tarik-muat-ulang & pemberitahuan update)
- `overscroll-behavior: none` pada html/body: tarik-untuk-muat-ulang dimatikan.
- Update tanpa service worker: build menulis `version.json` (ID build, dari `vite.config.ts`); `useAppUpdate` membandingkannya dengan `__BUILD_ID__` (saat dibuka, tiap 10 menit, saat kembali ke aplikasi/online). `UpdatePrompt` menampilkan Perbarui/Nanti; tidak pernah muat ulang otomatis. Dipasang di aplikasi utama dan admin.
- Batas: ini deteksi versi baru, BUKAN cache offline. Service worker/offline tetap Fase G; saat ditambahkan, hubungkan tombol Perbarui ke `registration.waiting`.
