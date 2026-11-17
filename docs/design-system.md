# Design system PINTARA

Peragaan: jalankan `npm run dev`, buka `#/desain`.

## Prinsip
- Nuansa buku tulis dan papan tulis; tanpa gradien warna (hanya garis buku tulis tipis di `.latar-kertas`).
- Satu set komponen untuk semua mode. Karakter tiap mode hanya lewat `data-mode` pada elemen pembungkus:
  `student` (hijau), `teacher` (papan tulis hijau tua), `parent` (biru langit). Variabel: `--aksen`, `--aksen-tua`, `--aksen-muda` di `src/styles/index.css`.
- Area sentuh minimal 48px (`min-h-tap`), teks tombol tebal dan besar, fokus terlihat jelas, animasi dimatikan bila `prefers-reduced-motion`.
- Font sistem (tanpa unduhan) agar aman offline.

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
| `Logo` | sementara, bisa diganti aset final |

## Belum ada
Ilustrasi maskot, aset logo final, komponen form/modal/tab/navigasi (dibuat saat dibutuhkan di Fase D/E), pengecekan kontras otomatis.
