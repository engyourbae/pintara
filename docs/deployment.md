# Deployment (GitHub Pages)

Status: **belum diuji**. Jangan anggap berhasil sebelum langkah verifikasi di bawah lolos.

1. Push repo ke GitHub (branch `main`).
2. Settings > Pages > Source: **GitHub Actions**.
3. Settings > Secrets and variables > Actions > **Variables**: isi semua `VITE_FIREBASE_*` (lihat `.env.example`).
4. Workflow `.github/workflows/deploy.yml` mengatur `VITE_BASE_PATH` otomatis menjadi `/<nama-repo>/`.
5. Firebase Console > Authentication > Settings > Authorized domains: tambahkan `<user>.github.io`.

Verifikasi: buka `https://<user>.github.io/<repo>/`, pindah antar halaman, muat ulang di sub-halaman (`#/siswa`), cek tidak ada 404 aset di tab Network.

Lokal: `npm install`, salin `.env.example` ke `.env.local`, `VITE_BASE_PATH=/`, lalu `npm run dev`.
