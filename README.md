# PINTARA — Belajar Bersama, Berkembang Bersama!

Platform belajar dan game edukasi anak SD Indonesia. React + Vite + TypeScript + Tailwind, Firebase (paket Spark), GitHub Pages.

## Menjalankan
```
npm install
npm run typecheck
npm run dev        # buka http://localhost:5173/#/  dan  #/desain
```
`.env.local` sudah berisi konfigurasi web Firebase project `pintara-f966d`. Isi `VITE_FIREBASE_DATABASE_URL` setelah Realtime Database dibuat.

## Firebase rules
Salin isi `firebase/firestore.rules` ke Firestore > Rules, dan `firebase/database.rules.json` ke Realtime Database > Rules, lalu **Publish**. Atau: `firebase deploy --only firestore:rules,database`.
Baca `docs/keamanan.md` (langkah admin dan keterbatasan) sebelum dipakai.

## Dokumen
`docs/arsitektur.md`, `docs/design-system.md`, `docs/keamanan.md`, `docs/deployment.md`.

## Status
Fase A–D selesai. Fase E sebagian: mode siswa berfungsi dengan data contoh (belajar, kuis, game Kilat Hitung, profil; kemajuan di localStorage). Halaman guru dan orang tua baru tampilan contoh. Belum ada login, pertemanan, multiplayer, atau PWA offline.
