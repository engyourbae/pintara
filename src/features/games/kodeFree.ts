import type { KLine } from './kodeData';

export type Free = NonNullable<KLine['free']>;
export type CellKind = 'ok' | 'bad' | 'ghost' | 'free' | 'freebad' | 'freeghost';
export interface Cell {
  ch: string;
  k: CellKind;
}

const WARNA = [
  'red', 'green', 'blue', 'orange', 'darkorange', 'yellow', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 'brown', 'teal', 'navy', 'gold',
  'crimson', 'tomato', 'salmon', 'lime', 'olive', 'coral', 'indigo', 'violet', 'skyblue', 'lightblue', 'lightgreen', 'darkgreen', 'darkblue',
  'maroon', 'turquoise', 'magenta', 'cyan', 'silver', 'khaki', 'orchid', 'chocolate', 'beige', 'ivory', 'lavender', 'plum', 'tan',
];

function partialOk(f: Free, v: string): boolean {
  if (v === '') return true;
  if (f.kind === 'angka') return /^\d{1,3}$/.test(v) && Number(v) <= (f.max ?? 999);
  if (f.kind === 'teks') return v.length <= 40;
  const s = v.toLowerCase();
  return /^#[0-9a-f]{0,6}$/.test(s) || WARNA.some((w) => w.startsWith(s));
}

function fullOk(f: Free, v: string): boolean {
  if (f.kind === 'angka') return /^\d{1,3}$/.test(v) && Number(v) <= (f.max ?? 999);
  if (f.kind === 'teks') return v.trim().length >= 1 && v.length <= 40;
  const s = v.toLowerCase();
  return WARNA.includes(s) || /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(s);
}

export interface Parsed {
  cells: Cell[];
  done: boolean;
  bad: boolean;
}

/** Mencocokkan ketikan dengan baris. Baris tanpa bagian bebas harus persis sama; bagian bebas boleh diganti nilai yang sah. */
export function parseTyped(code: string, free: Free | undefined, typed: string): Parsed {
  const at = free ? code.indexOf(free.v) : -1;
  if (!free || at < 0) {
    const cells = code.split('').map<Cell>((ch, k) => (k >= typed.length ? { ch, k: 'ghost' } : { ch, k: typed[k] === ch ? 'ok' : 'bad' }));
    return { cells, done: typed === code, bad: cells.some((c) => c.k === 'bad') || typed.length > code.length };
  }
  const pre = code.slice(0, at);
  const suf = code.slice(at + free.v.length);
  const cells: Cell[] = [];
  let bad = false;
  pre.split('').forEach((ch, k) => {
    const k2: CellKind = k >= typed.length ? 'ghost' : typed[k] === ch ? 'ok' : 'bad';
    if (k2 === 'bad') bad = true;
    cells.push({ ch, k: k2 });
  });
  const rest = typed.length > pre.length ? typed.slice(pre.length) : '';
  const sIdx = suf && rest ? rest.indexOf(suf[0]) : -1;
  const value = sIdx < 0 ? rest : rest.slice(0, sIdx);
  const after = sIdx < 0 ? '' : rest.slice(sIdx);
  if (rest === '') {
    free.v.split('').forEach((ch) => cells.push({ ch, k: 'freeghost' }));
  } else {
    const okPart = partialOk(free, value);
    if (!okPart || (value === '' && sIdx >= 0)) bad = true;
    value.split('').forEach((ch) => cells.push({ ch, k: okPart ? 'free' : 'freebad' }));
  }
  suf.split('').forEach((ch, k) => {
    const k2: CellKind = k >= after.length ? 'ghost' : after[k] === ch ? 'ok' : 'bad';
    if (k2 === 'bad') bad = true;
    cells.push({ ch, k: k2 });
  });
  if (after.length > suf.length) bad = true;
  const done = !bad && rest !== '' && fullOk(free, value) && after === suf;
  return { cells, done, bad };
}

export function freeHint(f: Free): string {
  if (f.kind === 'warna') return 'Bagian kuning boleh kamu ganti dengan warna lain, misalnya red, green, blue, purple, atau kode seperti #ff0000. Lihat hasilnya di layar hasil.';
  if (f.kind === 'angka') return `Bagian kuning boleh kamu ganti dengan angka lain dari 0 sampai ${f.max ?? 999}. Lihat perubahannya di layar hasil.`;
  return 'Bagian kuning boleh kamu ganti dengan tulisanmu sendiri.';
}
