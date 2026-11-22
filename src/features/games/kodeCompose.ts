import { TRACKS, type KLesson, type KLine } from './kodeData';

/** Satu baris tampilan: teks, tingkat menjorok, tugas dan alasannya (untuk ditampilkan saat diketuk). */
export interface Ln {
  t: string;
  i: number;
  r?: string;
  w?: string;
  box?: string;
}

export interface Composed {
  /** Pelengkap sebelum baris pelajaran ini (kode pelajaran sebelumnya). */
  before: Ln[];
  /** Pelengkap sesudah baris pelajaran ini (penutup wadah, bagian lain). */
  after: Ln[];
  /** Tambahan menjorok untuk baris pelajaran ini (selalu 0: indentasi sudah letak sebenarnya). */
  ind: number;
  /** Pelajaran yang sedang dimainkan (untuk mengambil alasan baris yang dipasang). */
  lesson: KLesson;
}

const WEB = ['html', 'css', 'js'];
export type Edits = Record<string, string>;
const toLn = (l: KLine, code = l.c): Ln => ({ t: code, i: l.i ?? 0, r: l.r, w: l.w, box: l.box });

/** Indeks tempat menyisipkan: tepat sebelum penutup wadah bernama `into` (atau di akhir berkas). */
function insertIndex(file: Ln[], into?: string): number {
  if (!into) return file.length;
  const o = file.findIndex((x) => x.box === into);
  if (o < 0) return file.length;
  const open = file[o];
  const tag = /^<([a-z0-9]+)/i.exec(open.t)?.[1] ?? '';
  for (let k = o + 1; k < file.length; k++) if (file[k].i === open.i && file[k].t === `</${tag}>`) return k;
  return file.length;
}

/** Proyek web "Tugas Pintar" satu berkas (HTML + CSS + JS); jalur lain punya berkas sendiri. */
function projectOf(ti: number, li: number): { lessons: KLesson[]; pos: number } {
  const track = TRACKS[ti];
  if (!WEB.includes(track.id)) return { lessons: track.lessons, pos: li };
  const lessons = TRACKS.filter((t) => WEB.includes(t.id)).flatMap((t) => t.lessons);
  return { lessons, pos: lessons.indexOf(track.lessons[li]) };
}

export function compose(ti: number, li: number, edits: Edits = {}): Composed {
  const { lessons, pos } = projectOf(ti, li);
  const file: Ln[] = [];
  for (let j = 0; j < pos; j++) {
    const L = lessons[j];
    file.splice(insertIndex(file, L.into), 0, ...L.lines.map((l, k) => toLn(l, edits[`${L.id}#${k}`] ?? l.c)));
  }
  const at = insertIndex(file, lessons[pos].into);
  return { before: file.slice(0, at), after: file.slice(at), ind: 0, lesson: lessons[pos] };
}

function syntaxOk(code: string): boolean {
  try {
    // Hanya memeriksa tata bahasa; kode TIDAK dijalankan di sini.
    new Function(code);
    return true;
  } catch {
    return false;
  }
}

/** Apakah dokumen utuh dan aman ditampilkan (style/script tertutup, JavaScript tidak salah tata bahasa). */
function docValid(lines: string[]): boolean {
  let k = 0;
  while (k < lines.length) {
    const t = lines[k];
    if (t === '<style>' || t === '<script>') {
      const close = t === '<style>' ? '</style>' : '</script>';
      const end = lines.indexOf(close, k + 1);
      if (end < 0) return false;
      if (t === '<script>' && !syntaxOk(lines.slice(k + 1, end).join('\n'))) return false;
      k = end;
    } else if (t === '</style>' || t === '</script>') return false;
    k++;
  }
  return true;
}

/** Dokumen untuk layar hasil (HTML/CSS/JS): berkas lengkap + baris pelajaran yang sudah terpasang. */
export function buildDoc(ti: number, li: number, shown: string[], edits: Edits = {}): string {
  const c = compose(ti, li, edits);
  const b = c.before.map((x) => x.t);
  const a = c.after.map((x) => x.t);
  const withShown = [...b, ...shown, ...a];
  return (docValid(withShown) ? withShown : [...b, ...a]).join('\n');
}

/** Keluaran terminal pelajaran-pelajaran sebelumnya (untuk Python/Git). */
export function previousOutputs(ti: number, li: number): { cmds: string[]; out: string }[] {
  return TRACKS[ti].lessons.slice(0, li).map((x) => ({ cmds: x.lines.map((l) => l.c), out: x.out ?? '' }));
}
