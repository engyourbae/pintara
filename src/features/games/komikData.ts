import type { FlowerColor, Mood } from './KomikArt';

/** Data dan aturan Komik Pintar. Level 1 (taman) dan Level 2 (kamar); level lain mengikuti pola yang sama. */

export type KObjKind = 'flower' | 'can' | 'butterfly' | 'book' | 'doll' | 'block' | 'car' | 'key';
export type KScene = 'taman' | 'kamar';

export interface KObj {
  id: string;
  kind: KObjKind;
  /** Nama lengkap untuk kalimat, mis. "bunga merah". */
  name: string;
  /** Label pendek di daftar bawah. */
  label: string;
  color?: FlowerColor;
  /** Letak di adegan (satuan 360×420). */
  x: number;
  y: number;
  /** Petunjuk bertahap mencari: umum dulu, lalu lebih jelas. */
  hints: [string, string];
  /** Petunjuk meletakkan setelah benda ditemukan. */
  placeHint: string;
}

export interface KTarget {
  id: string;
  /** Id benda yang diterima. */
  accepts: string[];
  /** Jumlah benda yang muat. */
  cap: number;
  x: number;
  y: number;
  r: number;
  /** Nama tempat untuk kalimat penolakan. */
  label: string;
  band?: string;
  kind: 'pot' | 'plant' | 'shelf' | 'bed' | 'box' | 'wardrobe';
}

export interface KState {
  found: string[];
  /** targetId -> id benda yang sudah diletakkan. */
  placed: Record<string, string[]>;
}

export interface KMission {
  id: string;
  text: string;
  done: (s: KState) => boolean;
}

export interface KLevel {
  id: string;
  title: string;
  desc: string;
  scene: KScene;
  /** Kunci gameBest (bintang×1000 + skor). Level 1 memakai 'komik' (nama lama). */
  bestKey: string;
  seconds: number;
  objs: KObj[];
  targets: KTarget[];
  intro: { text: string; mood: Mood }[];
  missions: KMission[];
  win: string;
  /** Kalimat tambahan setelah satu benda ditemukan (mis. semua bunga ketemu). */
  afterFound?: (o: KObj, s: KState) => string | undefined;
}

const has = (s: KState, ...ids: string[]) => ids.every((i) => s.found.includes(i));
const filled = (s: KState, t: string, n = 1) => (s.placed[t]?.length ?? 0) >= n;

/* ───────── Level 1: Taman Kesayangan ───────── */

export const LEVEL1: KLevel = {
  id: 'taman',
  title: 'Taman Kesayangan',
  desc: 'Taman jadi berantakan. Temukan 3 bunga, penyiram, dan kupu-kupu, lalu rapikan.',
  scene: 'taman',
  bestKey: 'komik',
  seconds: 90,
  objs: [
    { id: 'f-merah', kind: 'flower', color: 'merah', name: 'bunga merah', label: 'Bunga merah', x: 318, y: 224, hints: ['Ada bunga yang malu-malu bersembunyi di balik semak.', 'Lihat semak hijau di sisi kanan. Ada yang mengintip!'], placeHint: 'Seret bunga ke pot yang warna garisnya sama.' },
    { id: 'f-kuning', kind: 'flower', color: 'kuning', name: 'bunga kuning', label: 'Bunga kuning', x: 34, y: 262, hints: ['Bunga kuning suka berdiri dekat pohon besar.', 'Lihat rumput di dekat batang pohon.'], placeHint: 'Seret bunga ke pot yang warna garisnya sama.' },
    { id: 'f-jambu', kind: 'flower', color: 'jambu', name: 'bunga merah muda', label: 'Bunga merah muda', x: 150, y: 258, hints: ['Ada bunga yang berteduh di bawah tempat duduk.', 'Coba lihat di bawah bangku taman.'], placeHint: 'Seret bunga ke pot yang warna garisnya sama.' },
    { id: 'can', kind: 'can', name: 'penyiram tanaman', label: 'Penyiram', x: 96, y: 250, hints: ['Penyiramnya ada di dekat kaki bangku.', 'Lihat di antara pohon dan bangku, sisi kiri.'], placeHint: 'Seret penyiram ke tanaman yang layu.' },
    { id: 'kupu', kind: 'butterfly', name: 'kupu-kupu', label: 'Kupu-kupu', x: 205, y: 166, hints: ['Kupu-kupu ungu suka hinggap di tempat tinggi.', 'Lihat pagar putih di belakang taman.'], placeHint: '' },
  ],
  targets: [
    { id: 'pot-merah', accepts: ['f-merah'], cap: 1, x: 140, y: 352, r: 28, label: 'pot', band: '#F0506E', kind: 'pot' },
    { id: 'pot-kuning', accepts: ['f-kuning'], cap: 1, x: 184, y: 352, r: 28, label: 'pot', band: '#FFC83D', kind: 'pot' },
    { id: 'pot-jambu', accepts: ['f-jambu'], cap: 1, x: 228, y: 352, r: 28, label: 'pot', band: '#FF8FB1', kind: 'pot' },
    { id: 'plant', accepts: ['can'], cap: 1, x: 236, y: 268, r: 32, label: 'tanaman layu', kind: 'plant' },
  ],
  intro: [
    { text: 'Hai! Aku punya masalah kecil. Bisa bantu aku?', mood: 'wave' },
    { text: 'Aku ingin taman ini jadi indah lagi. Tapi beberapa benda hilang!', mood: 'sad' },
    { text: 'Cari tiga bunga, satu penyiram, dan satu kupu-kupu yang bersembunyi. Ketuk bendanya kalau ketemu!', mood: 'point' },
    { text: 'Lalu seret bunga ke pot yang warna garisnya sama, dan seret penyiram ke tanaman yang layu. Waktumu 90 detik!', mood: 'excited' },
  ],
  missions: [
    { id: 'm1', text: 'Cari 3 bunga yang tersembunyi', done: (s) => has(s, 'f-merah', 'f-kuning', 'f-jambu') },
    { id: 'm2', text: 'Cari penyiram tanaman', done: (s) => has(s, 'can') },
    { id: 'm3', text: 'Seret bunga ke pot yang warnanya sama', done: (s) => filled(s, 'pot-merah') && filled(s, 'pot-kuning') && filled(s, 'pot-jambu') },
    { id: 'm4', text: 'Seret penyiram ke tanaman yang layu', done: (s) => filled(s, 'plant') },
    { id: 'm5', text: 'Temukan kupu-kupu yang tersembunyi', done: (s) => has(s, 'kupu') },
  ],
  win: 'Wow! Tamanku jadi indah lagi. Terima kasih!',
  afterFound: (o, s) => (o.kind === 'flower' && has(s, 'f-merah', 'f-kuning', 'f-jambu') ? 'Semua bunga sudah ketemu! Sekarang letakkan di pot yang kosong.' : undefined),
};

/* ───────── Level 2: Kamar Berantakan ───────── */

export const LEVEL2: KLevel = {
  id: 'kamar',
  title: 'Kamar Berantakan',
  desc: 'Kamarnya berantakan! Temukan buku, boneka, dua mainan, dan kunci, lalu rapikan semuanya.',
  scene: 'kamar',
  bestKey: 'komik-kamar',
  seconds: 80,
  objs: [
    { id: 'buku', kind: 'book', name: 'buku', label: 'Buku', x: 112, y: 264, hints: ['Ada buku yang terselip di dekat tempat tidur.', 'Lihat di bawah tempat tidur, di sisi kanan.'], placeHint: 'Seret buku ke rak di dinding.' },
    { id: 'boneka', kind: 'doll', name: 'boneka', label: 'Boneka', x: 252, y: 232, hints: ['Boneka itu mengintip dari balik perabot besar.', 'Lihat di samping lemari, sisi kiri.'], placeHint: 'Seret boneka ke tempat tidur.' },
    { id: 'balok', kind: 'block', name: 'balok mainan', label: 'Balok', x: 60, y: 112, hints: ['Ada mainan yang bersembunyi di dekat jendela.', 'Lihat di lipatan tirai jendela.'], placeHint: 'Seret mainan ke kotak mainan di lantai.' },
    { id: 'mobil', kind: 'car', name: 'mobil mainan', label: 'Mobil', x: 232, y: 286, hints: ['Mobil mainan itu menyelinap ke bawah sesuatu di lantai.', 'Lihat ujung karpet di lantai.'], placeHint: 'Seret mainan ke kotak mainan di lantai.' },
    { id: 'kunci', kind: 'key', name: 'kunci', label: 'Kunci', x: 38, y: 205, hints: ['Kunci kecil itu menyelip di tempat yang empuk.', 'Lihat di balik bantal di tempat tidur.'], placeHint: 'Kunci itu untuk lemari yang terkunci. Seret ke lemari.' },
  ],
  targets: [
    { id: 'rak', accepts: ['buku'], cap: 1, x: 192, y: 150, r: 36, label: 'rak buku', kind: 'shelf' },
    { id: 'kasur', accepts: ['boneka'], cap: 1, x: 68, y: 222, r: 36, label: 'tempat tidur', kind: 'bed' },
    { id: 'kotak', accepts: ['balok', 'mobil'], cap: 2, x: 184, y: 350, r: 38, label: 'kotak mainan', kind: 'box' },
    { id: 'lemari', accepts: ['kunci'], cap: 1, x: 304, y: 200, r: 34, label: 'lemari', kind: 'wardrobe' },
  ],
  intro: [
    { text: 'Aduh! Kamarku berantakan. Bisa bantu merapikannya?', mood: 'sad' },
    { text: 'Cari buku, boneka, dua mainan, dan kunci lemari yang hilang. Ketuk bendanya kalau ketemu!', mood: 'point' },
    { text: 'Buku ke rak, boneka ke tempat tidur, mainan ke kotak, dan kunci ke lemari. Waktumu 80 detik!', mood: 'excited' },
  ],
  missions: [
    { id: 'm1', text: 'Temukan buku yang tersembunyi', done: (s) => has(s, 'buku') },
    { id: 'm2', text: 'Seret buku ke rak', done: (s) => filled(s, 'rak') },
    { id: 'm3', text: 'Cari boneka dan taruh di tempat tidur', done: (s) => filled(s, 'kasur') },
    { id: 'm4', text: 'Letakkan 2 mainan ke dalam kotak', done: (s) => filled(s, 'kotak', 2) },
    { id: 'm5', text: 'Temukan kunci dan buka lemari', done: (s) => filled(s, 'lemari') },
  ],
  win: 'Yeay! Kamarku rapi dan wangi. Terima kasih banyak!',
  afterFound: (o) => {
    if (o.kind === 'book') return 'Bukunya ketemu! Seret ke rak di dinding.';
    if (o.kind === 'doll') return 'Bonekanya ketemu! Dia ingin tidur di kasur.';
    if (o.kind === 'key') return 'Kuncinya ketemu! Coba buka lemari yang terkunci.';
    return undefined;
  },
};

export const LEVELS: KLevel[] = [LEVEL1, LEVEL2];

/* ───────── Kemajuan di dalam satu permainan ───────── */

export const placedCount = (s: KState): number => Object.values(s.placed).reduce((n, a) => n + a.length, 0);
export const isPlaced = (s: KState, id: string): boolean => Object.values(s.placed).some((a) => a.includes(id));
export const missionsDone = (l: KLevel, s: KState): boolean[] => l.missions.map((m) => m.done(s));

/** Benda di daftar bawah: 'tersembunyi' (belum ketemu), 'siap' (bisa diseret), 'selesai'. */
export function chipState(s: KState, o: KObj): 'tersembunyi' | 'siap' | 'selesai' {
  if (!s.found.includes(o.id)) return 'tersembunyi';
  if (!o.placeHint) return 'selesai';
  return isPlaced(s, o.id) ? 'selesai' : 'siap';
}

/** Benda yang belum ditemukan, berurutan sesuai daftar (untuk petunjuk). */
export const nextHiddenObj = (l: KLevel, s: KState): KObj | undefined => l.objs.find((o) => !s.found.includes(o.id));

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
export const scoreFor = (found: number, placed: number, left: number, helps: number): number => Math.max(0, found * 50 + placed * 50 + Math.floor(left) * 2 - helps * 30);

export function resultFor(l: KLevel, s: KState, left: number, helps: number, done: boolean, firstTime: boolean): KResult {
  const stars = starsFor(done, left, l.seconds, helps);
  const score = scoreFor(s.found.length, placedCount(s), done ? left : 0, helps);
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
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const SAY = {
  found: (name: string) => pick([`Wah! Kamu menemukan ${name}!`, `Yeay, ${name} ketemu!`, `Hebat! ${cap(name)} sudah ketemu.`]),
  foundButterfly: () => pick(['Kupu-kupunya ketemu! Cantik sekali.', 'Wah, matamu jeli! Kupu-kupu ungu itu ketemu.']),
  missTap: () => pick(['Hmm, belum ada apa-apa di situ. Coba cari di tempat lain.', 'Bukan di sini. Coba perhatikan lagi!']),
  missMany: () => 'Tenang, pelan-pelan saja. Lihat sudut-sudut ya.',
  placed: (name: string) => pick([`Pas sekali! ${cap(name)} sudah di tempatnya.`, `Cantik! ${cap(name)} cocok di situ.`, `Rapi! ${cap(name)} sudah beres.`]),
  watered: () => 'Segar! Tanamanku hidup lagi. Terima kasih!',
  unlocked: () => 'Klik! Lemarinya terbuka. Wah, isinya bagus!',
  urgent: () => 'Ayo, sedikit lagi! Jangan sampai waktunya habis!',
  lose: () => 'Yah, waktunya habis. Tidak apa-apa, ayo coba lagi!',
  paused: () => 'Istirahat sebentar. Waktu berhenti dulu.',
  start: () => 'Ayo mulai! Ketuk benda yang kamu temukan.',
};

/** Jawaban saat benda dilepas di tempat yang salah. */
export function rejectLine(o: KObj, t: KTarget): string {
  if (t.kind === 'plant' && o.kind === 'flower') return 'Tanaman layu itu butuh air, bukan bunga. Bunga masuk pot yang kosong, ya.';
  if (t.kind === 'pot' && o.kind === 'can') return 'Pot kosong itu butuh bunga. Penyiramnya untuk tanaman yang layu.';
  if (t.kind === 'pot' && o.kind === 'flower') return `Belum cocok. ${cap(o.name)} ke pot yang garisnya berwarna sama, ya.`;
  if (t.kind === 'wardrobe') return 'Lemari itu terkunci. Cari kuncinya dulu, ya.';
  return `${cap(o.name)} belum cocok di ${t.label}. Coba tempat lain!`;
}
