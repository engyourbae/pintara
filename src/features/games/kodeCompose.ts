import { TRACKS, type KLine } from './kodeData';

/** Satu baris tampilan: teks dan tingkat menjorok. */
export interface Ln {
  t: string;
  i: number;
}

export interface Composed {
  /** Pelengkap sebelum baris pelajaran ini (kode pelajaran sebelumnya, kerangka). */
  before: Ln[];
  /** Pelengkap sesudah baris pelajaran ini (penutup, isi body). */
  after: Ln[];
  /** Tambahan menjorok untuk baris pelajaran ini agar sejajar di dalam kerangka. */
  ind: number;
  /** Khusus JS: indeks di before tempat kode script dimulai. */
  scriptFrom?: number;
}

const FONT = 'body{font-family:sans-serif;font-size:18px;padding:12px}';
const ln = (t: string, i = 0): Ln => ({ t, i });
const fromLine = (l: KLine, add = 0): Ln => ({ t: l.c, i: (l.i ?? 0) + add });
const fromBase = (s: string, add: number): Ln => ({ t: s.trim(), i: (s.length - s.trimStart().length) / 2 + add });

export function compose(ti: number, li: number): Composed {
  const track = TRACKS[ti];
  const prev = track.lessons.slice(0, li);
  const uptoNow = track.lessons.slice(0, li + 1);
  switch (track.id) {
    case 'html': {
      if (li === 0) return { before: [], after: [], ind: 0 };
      const l0 = track.lessons[0].lines.map((l) => fromLine(l));
      return {
        before: [...l0.slice(0, 7), ...prev.slice(1).flatMap((x) => x.lines.map((l) => fromLine(l, 2)))],
        after: l0.slice(7),
        ind: 2,
      };
    }
    case 'css': {
      const top = [ln('<!DOCTYPE html>'), ln('<html lang="id">'), ln('<head>', 1), ln('<meta charset="utf-8">', 2), ln('<style>', 2)];
      return {
        before: [...top, ...prev.flatMap((x) => x.lines.map((l) => fromLine(l, 3)))],
        after: [
          ln('</style>', 2),
          ln('</head>', 1),
          ln('<body>', 1),
          ...uptoNow.flatMap((x) => (x.base ?? []).map((b) => fromBase(b, 2))),
          ln('</body>', 1),
          ln('</html>'),
        ],
        ind: 3,
      };
    }
    case 'js': {
      const top = [ln('<!DOCTYPE html>'), ln('<html lang="id">'), ln('<body>', 1), ...uptoNow.flatMap((x) => (x.base ?? []).map((b) => fromBase(b, 2))), ln('<script>', 2)];
      return {
        before: [...top, ...prev.flatMap((x) => x.lines.map((l) => fromLine(l, 3)))],
        after: [ln('</script>', 2), ln('</body>', 1), ln('</html>')],
        ind: 3,
        scriptFrom: top.length,
      };
    }
    default:
      return { before: prev.flatMap((x) => x.lines.map((l) => fromLine(l))), after: [], ind: 0 };
  }
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

/** Dokumen untuk layar hasil (HTML/CSS/JS): kerangka lengkap + baris pelajaran yang sudah terpasang. */
export function buildDoc(ti: number, li: number, shown: string[]): string {
  const c = compose(ti, li);
  const id = TRACKS[ti].id;
  let lines: string[];
  if (id === 'js') {
    const from = c.scriptFrom ?? 0;
    const prevJs = c.before.slice(from).map((x) => x.t);
    const ok = syntaxOk([...prevJs, ...shown].join('\n'));
    lines = [...c.before.map((x) => x.t), ...(ok ? shown : []), ...c.after.map((x) => x.t)];
  } else {
    lines = [...c.before.map((x) => x.t), ...shown, ...c.after.map((x) => x.t)];
  }
  const doc = lines.join('\n');
  const style = `<style>${FONT}</style>`;
  return doc.includes('<html lang="id">') ? doc.replace('<html lang="id">', `<html lang="id">${style}`) : style + doc;
}

/** Keluaran terminal pelajaran-pelajaran sebelumnya (untuk Python/Git/SQL). */
export function previousOutputs(ti: number, li: number): { cmds: string[]; out: string }[] {
  return TRACKS[ti].lessons.slice(0, li).map((x) => ({ cmds: x.lines.map((l) => l.c), out: x.out ?? '' }));
}
