# Design system PINTARA

Peragaan: jalankan `npm run dev`, buka `#/desain`.

## Prinsip
- Nuansa buku tulis dan stiker: garis tinta tebal + bayangan keras (`.stiker`, `shadow-stiker`), kertas bertitik halus, tanpa gradien warna.
- Satu set komponen untuk semua mode. Karakter tiap mode hanya lewat `data-mode` pada elemen pembungkus:
  `student` (hijau), `teacher` (papan tulis hijau tua), `parent` (biru langit). Variabel: `--aksen`, `--aksen-tua`, `--aksen-muda` di `src/styles/index.css`.
- Area sentuh minimal 48px (`min-h-tap`), teks tombol tebal dan besar, fokus terlihat jelas, animasi dimatikan bila `prefers-reduced-motion`.
- Font dibundel lewat `@fontsource-variable` (Fredoka untuk judul/tombol, Nunito untuk teks), jadi tidak diunduh saat dipakai dan aman offline.
- Animasi (`animate-naik`, `pop`, `melayang`, `goyang`, `kedip`, `getar`, `berkilau`) otomatis dimatikan bila `prefers-reduced-motion`.
- Tinggi tombol tetap per ukuran (`md` 48px, `lg` 56px) agar semua tombol sejenis sama besar.

## Palet (`tailwind.config.js`)
`hijau` (identitas), `kuning` (aksen), `langit` (pendukung), `jingga` (interaksi tertentu), `krem` (latar), `gading` (kartu), `tinta` (teks), `papan` (papan tulis).

## Komponen (`src/components/ui`)
| Komponen | Catatan |
|---|---|
| `Button`, `ButtonLink` | varian `utama`, `sekunder`, `aksi`, `ghost`; ukuran `md`, `lg` |
| `Card` | `kertas`, `papan`, `catatan` |
| `Badge`, `SampleBadge` | `SampleBadge` wajib untuk data dummy |
| `Icon` | set ikon garis; tambah ikon di `Icon.tsx` |
| `ProgressBar` | `label` wajib |
| `Logo`, `LogoMark` | lambang buku + bintang; sumber sama dengan `public/favicon.svg` |
| `Mascot`, `Sparkle` | burung hantu "Pinta" (orisinal), moods `halo`/`hore`/`semangat` |
| `Page`, `PageHeader`, `Stat` | kerangka halaman dalam mode dan angka ringkas |

## Belum ada
Komponen form/modal/tab terpisah (saat ini input dan filter ditulis langsung di halaman), pengecekan kontras otomatis, versi logo vektor final dari desainer.
