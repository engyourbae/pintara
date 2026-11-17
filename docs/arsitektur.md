# Arsitektur PINTARA (revisi: Firebase Spark / gratis)

## Keputusan
| Topik | Keputusan | Alasan |
|---|---|---|
| Paket Firebase | **Spark (gratis)** | Pilihan proyek. Cloud Functions tidak tersedia. |
| Router | `HashRouter` | Aman di GitHub Pages tanpa fallback SPA, cocok untuk PWA. |
| Backend kustom | **Tidak ada** | Semua validasi lewat Firestore/RTDB Security Rules. |
| Offline | IndexedDB (Dexie) + Service Worker | Single player tidak butuh Firebase. |

## Layanan
- **Auth**: identitas. Peran disimpan di `users/{uid}.role`, bukan custom claims (butuh Admin SDK).
- **Firestore**: profil, kelas, materi, progres, pertemanan, undangan.
- **Realtime DB**: presence, notifikasi, state room game.
- **App Check** (opsional, gratis): ditambahkan di Fase F bila reCAPTCHA siap.

## Dampak tanpa Cloud Functions
Semua aturan keamanan harus bisa diekspresikan di Security Rules. Konsekuensinya:

1. **Pertemanan**: pengirim membuat `friend_requests/{from_to}`; hanya penerima yang boleh menerima. Dokumen `friendships` dibuat lewat batch penerima yang divalidasi rules (`getAfter`/`exists` ke request dan `blocked_users`).
2. **Undangan**: pembuat harus pengirim, dokumen memuat `expiresAt`, rules mengecek pertemanan dan blokir. Pembatasan laju hanya perkiraan (mis. ID dokumen berbasis jendela waktu).
3. **Role guru**: tidak boleh dipilih sendiri. Akun guru ditandai `teacherVerified` secara manual lewat Firebase Console.
4. **Login anak**: orang tua membuat akun anak (email sintetis `username@anak.pintara.invalid` + PIN sebagai sandi) lewat instance Firebase sekunder di klien. Sandi minimal 6 karakter.
5. **Skor**: tanpa server, skor multiplayer **tidak dapat dijamin anti-curang**. Mitigasi: batas XP per sesi di rules, kunci jawaban tidak ditaruh di node yang dibaca lawan, dan skor kompetitif tidak dipakai untuk ranking global (sesuai prinsip proyek).
6. **Anti-spam**: rate limit sejati tidak mungkin. Dipakai batas jumlah (mis. maks. request tertunda) dan masa berlaku.

## Batas kuota Spark (periksa di konsol Firebase)
Firestore dan RTDB punya kuota harian/koneksi gratis. Live class dengan banyak siswa sebaiknya memakai RTDB dan listener seminimal mungkin. Pantau penggunaan di konsol.

## Struktur folder
Lihat `src/`: `app/` (router, navigasi), `pages/`, `layouts/`, `components/ui/`, `features/{student,teacher,parent,games,friends,classroom,learning}`, `services/{firebase,offline}`, `data/sample`, `types/`, `hooks/`, `utils/`, `styles/`, `firebase/` (rules), `.github/workflows/`.

## Model data (ringkas, aktif bertahap)
`users` (role, username) · `user_profiles` (publik minimal: avatar, username) · `parent_accounts` (daftar anak, izin) · `teacher_profiles` · `classes` / `class_members` · `friend_requests` / `friendships` / `blocked_users` · `learning_categories` / `learning_contents` / `games` · `learning_progress` / `game_sessions` / `achievements` · `game_invitations` / `notifications`.
Rincian field dan rules dibuat di **Fase F**; Tahap 1 hanya mengaktifkan yang perlu.
