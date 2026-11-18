# Bank soal PINTARA

Ditambah **bertahap** (± 100 soal per tahap) agar mudah ditinjau dan tidak membebani batas penggunaan. Jangan menambah ribuan soal sekaligus.

## Format
Satu berkas = satu tahap: `src/data/bank/batches/bNN-<tema>.json`, berisi larik paket (`LearningContent`, lihat `src/types`).
- `id` paket: a-z, 0-9, `-`, maks 60 karakter (batas Rules), **tidak pernah diubah** setelah dipakai (kemajuan murid + misi kelas memakainya). Pola: `<mapel>-k<kelas>-<topik>`.
- `categoryId` harus ada di `src/data/sample/categories.json`. `grades` 1-6, `difficulty` 1-3, `version` naik bila soal direvisi.
- 1-100 soal per paket (batas Rules hasil kelas); praktisnya 10 soal. Tiap soal: `prompt`, 2-5 `options` (tanpa duplikat), `answerIndex`, `explanation` (wajib).
- Berkas baru otomatis termuat (`import.meta.glob`). `npm run validate:bank` (juga dijalankan oleh `npm run typecheck`/`build`/CI) memeriksa semuanya.

## Tahap
| Tahap | Isi | Status |
|---|---|---|
| 1 `b01-sekolah-inti` | 10 paket x 10 soal: Matematika k1-5, B. Indonesia k2-4, IPAS k4-5, Pancasila k2-4, B. Inggris k3-4 | Selesai |
| 2 `b02-sekolah-lanjutan` | 10 paket x 10 soal: Matematika k1-6 (pengurangan, penjumlahan 100, pecahan, desimal/persen, KPK-FPB), B. Indonesia k4-6 (kata baku, gagasan pokok), IPAS k3-5 (tumbuhan, pencernaan, gaya) | Selesai |
| 3 | Melengkapi mapel sekolah: Matematika k4/k6 (bangun ruang, data), B. Indonesia k1-3, IPAS k1-2 dan k6, Pancasila k5-6, B. Inggris | Rencana |
| 4 | Pengetahuan umum (tata surya, hewan, sejarah, geografi) | Rencana |
| 5 | Keterampilan hidup + berpikir (logika, pola) | Rencana |
| 6 | Literasi digital (privasi, penipuan, informasi palsu) | Rencana |
Paket `contoh-*` lama dihapus setelah topiknya tercakup bank nyata. Hapus paket contoh akan menghilangkan progres uji coba terkait: tidak masalah selama belum dipakai anak sungguhan.

## Catatan kualitas (JUJUR)
Soal tahap 1 ditulis AI dan **belum ditinjau guru**. Jawaban aritmetika sudah dicek otomatis saat pembuatan, tetapi kesesuaian dengan Kurikulum Merdeka, tingkat kesulitan, dan ejaan perlu ditinjau guru sebelum dipakai anak sungguhan. Bila ada soal keliru, perbaiki di berkas JSON dan naikkan `version`.
Ke depan bila soal > ± 500: pecah muat-malas per kategori (sekarang semua ikut paket utama; 100 soal ≈ 28 KB mentah).
