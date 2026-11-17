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
