// Memeriksa bank soal sebelum build. Gagal = CI merah, supaya soal rusak tidak sampai ke anak.
import fs from 'node:fs';
import path from 'node:path';

const root = import.meta.dirname;
const dir = path.join(root, 'src/data/bank/batches');
const cats = new Set(JSON.parse(fs.readFileSync(path.join(root, 'src/data/sample/categories.json'), 'utf8')).categories.map((c) => c.id));
const legacy = JSON.parse(fs.readFileSync(path.join(root, 'src/data/sample/contents.json'), 'utf8')).contents.map((c) => c.id);

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const ids = new Set(legacy);
let packs = 0;
let questions = 0;

const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
for (const file of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  } catch (e) {
    err(file, `JSON tidak valid (${e.message})`);
    continue;
  }
  if (!Array.isArray(data)) {
    err(file, 'isi berkas harus larik paket');
    continue;
  }
  for (const c of data) {
    const w = `${file} › ${c?.id}`;
    packs++;
    if (typeof c.id !== 'string' || !/^[a-z0-9-]+$/.test(c.id) || c.id.length > 60) err(w, 'id harus a-z, 0-9, "-" dan maksimal 60 karakter (batas Rules)');
    if (ids.has(c.id)) err(w, 'id ganda');
    ids.add(c.id);
    if (!cats.has(c.categoryId)) err(w, `categoryId "${c.categoryId}" tidak ada`);
    if (!c.title || c.title.length > 100) err(w, 'judul kosong/terlalu panjang (maks 100)');
    if (!Array.isArray(c.grades) || !c.grades.length || c.grades.some((g) => ![1, 2, 3, 4, 5, 6].includes(g))) err(w, 'grades harus berisi angka 1-6');
    if (![1, 2, 3].includes(c.difficulty)) err(w, 'difficulty harus 1-3');
    if (!Number.isInteger(c.version) || c.version < 1) err(w, 'version harus bilangan bulat >= 1');
    if (!Array.isArray(c.questions) || c.questions.length < 1 || c.questions.length > 100) {
      err(w, 'jumlah soal harus 1-100 (batas Rules hasil kelas)');
      continue;
    }
    const qids = new Set();
    for (const q of c.questions) {
      const qw = `${w} › ${q?.id}`;
      questions++;
      if (!q.id || qids.has(q.id)) err(qw, 'id soal kosong/ganda');
      qids.add(q.id);
      if (!q.prompt?.trim()) err(qw, 'prompt kosong');
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5) err(qw, 'pilihan harus 2-5');
      else {
        if (new Set(q.options.map((o) => String(o).trim())).size !== q.options.length) err(qw, 'pilihan ada yang sama');
        if (q.options.some((o) => !String(o).trim())) err(qw, 'ada pilihan kosong');
        if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) err(qw, 'answerIndex di luar pilihan');
      }
      if (!q.explanation?.trim()) err(qw, 'penjelasan kosong (wajib, ini bagian belajar)');
    }
  }
}

if (errors.length) {
  console.error(`Bank soal TIDAK valid (${errors.length} masalah):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Bank soal OK: ${packs} paket, ${questions} soal dari ${files.length} berkas.`);
