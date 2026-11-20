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
| 3 `b03-sekolah-pelengkap` | 10 paket x 10 soal: Matematika k4-5 (data, modus) dan k5-6 (volume kubus/balok), B. Indonesia k1 (huruf, suku kata) dan k2-3 (jenis kata), IPAS k1-2 (panca indra) dan k6 (listrik), Pancasila k5 (musyawarah) dan k6 (hak-kewajiban), B. Inggris (hewan, tubuh, hari, bulan). Paket `contoh-mat-1`, `contoh-indo-1`, `contoh-ipas-1`, `contoh-pancasila-1` dihapus | Selesai |
| 4 | Pengetahuan umum (tata surya, hewan, sejarah, geografi) | Rencana |
| 5 | Keterampilan hidup + berpikir (logika, pola) | Rencana |
| 6 | Literasi digital (privasi, penipuan, informasi palsu) | Rencana |
Paket `contoh-*` lama dihapus setelah topiknya tercakup bank nyata. Hapus paket contoh akan menghilangkan progres uji coba terkait: tidak masalah selama belum dipakai anak sungguhan.

## Catatan kualitas (JUJUR)
Soal tahap 1 ditulis AI dan **belum ditinjau guru**. Jawaban aritmetika sudah dicek otomatis saat pembuatan, tetapi kesesuaian dengan Kurikulum Merdeka, tingkat kesulitan, dan ejaan perlu ditinjau guru sebelum dipakai anak sungguhan. Bila ada soal keliru, perbaiki di berkas JSON dan naikkan `version`.
Ke depan bila soal > ± 500: pecah muat-malas per kategori (sekarang semua ikut paket utama; 100 soal ≈ 28 KB mentah).


## F26: semua paket jadi 30 soal
- Semua 30 paket bank (b01-b03) dan 8 paket `contoh-*` yang tersisa (Tata Surya, Hewan & Tumbuhan, Privasi Digital, Penipuan Digital, Kebersihan, Menabung, Pola, Logika) kini berisi 30 soal. Total 1.140 soal (bank 900 + contoh 240). Versi tiap paket naik jadi 2; id paket tidak berubah.
- Soal hitungan (matematika k1-k6, pola, uang) dibuat dengan skrip yang menghitung jawaban dan pengecoh; soal teks ditulis AI. **Belum ditinjau guru.**
- Paket `contoh-*` tetap berlabel contoh (id tidak boleh diganti); ganti dengan paket bank nyata secara bertahap.
- Batas Rules (maks 100 soal/paket) masih jauh.

## Level (F29)
- Aplikasi membagi setiap paket menjadi level 10 soal menurut urutan `questions` (paket 30 soal = 3 level). Soal yang sudah dikerjakan dicatat per `id` soal di perangkat murid dan tidak muncul lagi sampai semua soal paket selesai.
- Menambah soal: tambah di AKHIR paket dengan `id` baru yang unik dan naikkan `version`. Jangan mengubah `id` soal lama dan jangan menyisipkan soal di tengah (menggeser level). Paket tidak harus kelipatan 10: sisa soal membentuk level terakhir yang lebih pendek.
