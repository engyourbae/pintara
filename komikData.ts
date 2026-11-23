import type { FlowerColor, Mood } from './KomikArt';

/** Data dan aturan Komik Pintar. Level 1 saja (Tahap 1–2); struktur siap untuk level berikutnya. */

export type KObjKind = 'flower' | 'can' | 'butterfly';

export interface KObj {
  id: string;
  kind: KObjKind;
  name: string;
  color?: FlowerColor;
  /** Letak di adegan (satuan 360×420). */
  x: number;
  y: number;
  /** Petunjuk bertahap: umum dulu, lalu lebih jelas. */
  hints: [string, string];
}

export interface KTarget {
  id: string;
  /** Id benda yang diterima target ini. */
  accepts: string;
  x: number;
  y: number;
  r: number;
  band?: string;
  kind: 'pot' | 'plant';
}

export interface KLevel {
  id: string;
  title: string;
  seconds: number;
  objs: KObj[];
  targets: KTarget[];
  intro: { text: string; mood: Mood }[];
  missions: { id: string; text: string }[];
}

export const LEVEL1: KLevel = {
  id: 'taman',
  title: 'Taman Kesayangan',
  seconds: 90,
  objs: [
    { id: 'f-merah', kind: 'flower', color: 'merah', name: 'bunga merah', x: 318, y: 224, hints: ['Ada bunga yang malu-malu bersembunyi di balik semak.', 'Lihat semak hijau di sisi kanan. Ada yang mengintip!'] },
    { id: 'f-kuning', kind: 'flower', color: 'kuning', name: 'bunga kuning', x: 34, y: 262, hints: ['Bunga kuning suka berdiri dekat pohon besar.', 'Lihat rumput di dekat batang pohon.'] },
    { id: 'f-jambu', kind: 'flower', color: 'jambu', name: 'bunga merah muda', x: 150, y: 258, hints: ['Ada bunga yang berteduh di bawah tempat duduk.', 'Coba lihat di bawah bangku taman.'] },
    { id: 'can', kind: 'can', name: 'penyiram tanaman', x: 96, y: 250, hints: ['Penyiramnya ada di dekat kaki bangku.', 'Lihat di antara pohon dan bangku, sisi kiri.'] },
    { id: 'kupu', kind: 'butterfly', name: 'kupu-kupu', x: 205, y: 166, hints: ['Kupu-kupu ungu suka hinggap di tempat tinggi.', 'Lihat pagar putih di belakang taman.'] },
  ],
  targets: [
    { id: 'pot-merah', accepts: 'f-merah', x: 140, y: 352, r: 28, band: '#F0506E', kind: 'pot' },
    { id: 'pot-kuning', accepts: 'f-kuning', x: 184, y: 352, r: 28, band: '#FFC83D', kind: 'pot' },
    { id: 'pot-jambu', accepts: 'f-jambu', x: 228, y: 352, r: 28, band: '#FF8FB1', kind: 'pot' },
    { id: 'plant', accepts: 'can', x: 236, y: 268, r: 32, kind: 'plant' },
  ],
  intro: [
    { text: 'Hai! Aku punya masalah kecil. Bisa bantu aku?', mood: 'wave' },
    { text: 'Aku ingin taman ini jadi indah lagi. Tapi beberapa benda hilang!', mood: 'sad' },
    { text: 'Cari tiga bunga, satu penyiram, dan satu kupu-kupu yang bersembunyi. Ketuk bendanya kalau ketemu!', mood: 'point' },
    { text: 'Lalu seret bunga ke pot yang warna garisnya sama, dan seret penyiram ke tanaman yang layu. Waktumu 90 detik!', mood: 'excited' },
  ],
  missions: [
    { id: 'm1', text: 'Cari 3 bunga yang tersembunyi' },
    { id: 'm2', text: 'Cari penyiram tanaman' },
    { id: 'm3', text: 'Seret bunga ke pot yang warnanya sama' },
    { id: 'm4', text: 'Seret penyiram ke tanaman yang layu' },
    { id: 'm5', text: 'Temukan kupu-kupu yang tersembunyi' },
  ],
};

export const LEVELS: KLevel[] = [LEVEL1];

/* ───────── Kemajuan di dalam satu permainan ───────── */

export interface KState {
  found: string[];
  /** targetId -> id benda yang sudah diletakkan. */
  placed: Record<string, string>;
}

export function missionsDone(l: KLevel, s: KState): boolean[] {
  const flowers = l.objs.filter((o) => o.kind === 'flower');
  const pots = l.targets.filter((t) => t.kind === 'pot');
  return [
    flowers.every((o) => s.found.includes(o.id)),
    s.found.includes('can'),
    pots.every((t) => s.placed[t.id]),
    Boolean(s.placed.plant),
    s.found.includes('kupu'),
  ];
}

/** Benda di daftar bawah: 'tersembunyi' (belum ketemu), 'siap' (bisa diseret), 'selesai'. */
export function chipState(s: KState, o: KObj): 'tersembunyi' | 'siap' | 'selesai' {
  if (!s.found.includes(o.id)) return 'tersembunyi';
  if (o.kind === 'butterfly') return 'selesai';
  return Object.values(s.placed).includes(o.id) ? 'selesai' : 'siap';
}

/** Letak benda yang belum ditemukan, berurutan sesuai misi (untuk petunjuk). */
export function nextHiddenObj(l: KLevel, s: KState): KObj | undefined {
  return l.objs.find((o) => !s.found.includes(o.id));
}

/* ───────── Skor, bintang, hadiah ───────── */

export interface KResult {
  stars: number;
  score: number;
  coins: number;
  gained: number;
}

/** Bintang: 3 bila selesai dengan sisa waktu ≥ 50% dan bantuan ≤ 1; 2 bila sisa ≥ 20%; selain itu 1. Gagal (waktu habis) = 0. */
export function starsFor(done: boolean, left: number, total: number, helps: number): number {
  if (!done) return 0;
  if (left >= total * 0.5 && helps <= 1) return 3;
  if (left >= total * 0.2) return 2;
  return 1;
}

/** Skor: 50 per benda ditemukan, 50 per benda diletakkan, 2 per detik tersisa, dikurangi 30 per bantuan. Tidak pernah di bawah 0. */
export function scoreFor(found: number, placed: number, left: number, helps: number): number {
  return Math.max(0, found * 50 + placed * 50 + Math.floor(left) * 2 - helps * 30);
}

export function resultFor(l: KLevel, s: KState, left: number, helps: number, done: boolean, firstTime: boolean): KResult {
  const stars = starsFor(done, left, l.seconds, helps);
  const score = scoreFor(s.found.length, Object.keys(s.placed).length, done ? left : 0, helps);
  return {
    stars,
    score,
    coins: done ? 5 + stars * 5 : 0,
    // XP hanya saat pertama kali selesai (sama seperti Kode Pintar).
    gained: done && firstTime ? 20 + 5 * stars : 0,
  };
}

/** Skor tersimpan di gameBest (satu angka kecil): bintang×1000 + skor. */
export const komikBest = (stars: number, score: number): number => stars * 1000 + Math.min(999, score);

/* ───────── Dialog pemandu (bervariasi, mengikuti kejadian) ───────── */

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

export const SAY = {
  foundFlower: (name: string) => pick([`Wah! Kamu menemukan ${name}!`, `Yeay, ${name} ketemu!`, `Hebat! ${name} sudah ketemu.`]),
  foundCan: () => pick(['Itu penyiramnya! Nanti kita pakai untuk tanaman yang layu.', 'Kamu menemukan penyiramnya! Tanaman itu pasti senang.']),
  foundButterfly: () => pick(['Kupu-kupunya ketemu! Cantik sekali.', 'Wah, matamu jeli! Kupu-kupu ungu itu ketemu.']),
  allFlowers: () => 'Semua bunga sudah ketemu! Sekarang letakkan di pot yang kosong.',
  missTap: () => pick(['Hmm, belum ada apa-apa di situ. Coba cari di tempat lain.', 'Bukan di sini. Coba perhatikan lagi!']),
  missMany: () => 'Tenang, pelan-pelan saja. Lihat sudut-sudut taman, ya.',
  potted: (name: string) => pick([`Pas sekali! ${name} sudah di potnya.`, `Cantik! ${name} cocok di situ.`]),
  watered: () => 'Segar! Tanamanku hidup lagi. Terima kasih!',
  urgent: () => 'Ayo, sedikit lagi! Jangan sampai waktunya habis!',
  win: () => 'Wow! Tamanku jadi indah lagi. Terima kasih!',
  lose: () => 'Yah, waktunya habis. Tidak apa-apa, ayo coba lagi!',
  paused: () => 'Istirahat sebentar. Waktu berhenti dulu.',
  tray: () => 'Seret bunga dari daftar di bawah ke pot yang warna garisnya sama.',
  trayCan: () => 'Seret penyiram dari daftar di bawah ke tanaman yang layu.',
};

/** Jawaban saat benda dilepas di target yang salah. */
export function rejectLine(o: KObj, t: KTarget): string {
  if (o.kind === 'flower' && t.kind === 'plant') return 'Tanaman layu itu butuh air, bukan bunga. Bunga masuk pot yang kosong, ya.';
  if (o.kind === 'can' && t.kind === 'pot') return 'Pot kosong itu butuh bunga. Penyiramnya untuk tanaman yang layu.';
  if (o.kind === 'flower') return `Belum cocok. ${o.name[0].toUpperCase()}${o.name.slice(1)} ke pot yang garisnya berwarna sama, ya.`;
  return 'Belum tepat. Coba tempat lain.';
}
