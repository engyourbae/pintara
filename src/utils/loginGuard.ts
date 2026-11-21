/**
 * Jeda bertingkat setelah salah sandi (pencegah tebak-tebakan sandi/PIN dari perangkat ini).
 *
 * BATAS JUJUR: ini perlindungan di sisi klien (localStorage). Ia menghentikan tebakan dari layar aplikasi dan salah
 * ketik berulang, tetapi TIDAK menghentikan penyerang yang memanggil API langsung, menghapus data peramban, atau
 * memakai perangkat lain, dan bisa dilewati dengan memajukan jam perangkat. Pembatasan di server dilakukan Firebase
 * Auth sendiri (galat `auth/too-many-requests`); kunci akun sungguhan butuh Cloud Functions (tidak ada di paket Spark).
 * Tidak ada rahasia yang disimpan: hanya sidik jari (hash) nama pengguna, jumlah salah, dan waktu buka.
 */

const KEY = 'pintara:loginlock:v1';
const DEVICE = '*perangkat*';
const MAX_ENTRIES = 30;
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Tangga jeda: setelah `fails` salah berturut-turut, tunggu `ms`. Akun: mulai di 5 salah. */
export const LOCK_LADDER: readonly { fails: number; ms: number }[] = [
  { fails: 5, ms: 30 * SEC },
  { fails: 6, ms: 2 * MIN },
  { fails: 7, ms: 10 * MIN },
  { fails: 8, ms: HOUR },
  { fails: 9, ms: 6 * HOUR },
  { fails: 10, ms: DAY },
  { fails: 11, ms: 3 * DAY },
];
export const FREE_ATTEMPTS = LOCK_LADDER[0].fails - 1;
/** Hitungan salah per perangkat (semua akun) baru memicu jeda setelah selisih ini, agar salah ketik di banyak akun tidak ikut terkunci. */
const DEVICE_OFFSET = 5;
/** Hitungan salah dilupakan bila percobaan terakhir sudah selama ini. */
const ACCOUNT_FORGET = 7 * DAY;
const DEVICE_FORGET = DAY;
/** Jeda dari server Firebase (too-many-requests): minimal sekian. */
export const SERVER_THROTTLE_MS = 5 * MIN;

interface Entry {
  n: number;
  last: number;
  until: number;
}
type Store = Record<string, Entry>;

let memory: Store = {};
const hasStorage = () => {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
};
function read(): Store {
  if (!hasStorage()) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as Store) : {};
    return v && typeof v === 'object' ? v : {};
  } catch {
    return memory;
  }
}
function write(s: Store) {
  memory = s;
  if (!hasStorage()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* penyimpanan penuh/diblokir: tetap berlaku selama aplikasi terbuka */
  }
}

/** Nama pengguna/email dinormalkan lalu di-hash (FNV-1a) supaya tidak tersimpan terbaca. */
export function loginKey(identifier: string): string {
  const t = identifier.trim().toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `a:${(h >>> 0).toString(16)}`;
}

/** Lama jeda untuk sekian salah (0 = belum terkunci). */
export function waitFor(fails: number, offset = 0): number {
  const eff = fails - offset;
  let ms = 0;
  for (const step of LOCK_LADDER) if (eff >= step.fails) ms = step.ms;
  return ms;
}

export interface LockState {
  locked: boolean;
  remainingMs: number;
  /** Jumlah salah berturut-turut untuk akun ini. */
  failures: number;
  /** Sisa kesempatan sebelum jeda pertama (0 bila sudah pernah terkunci). */
  attemptsLeft: number;
}

function fresh(e: Entry | undefined, now: number, forget: number): Entry {
  if (!e || typeof e.n !== 'number') return { n: 0, last: 0, until: 0 };
  return now - e.last > forget && now >= e.until ? { n: 0, last: 0, until: 0 } : e;
}

/** Sisa jeda; dibatasi ke jeda wajar untuk hitungan itu agar jam yang dimundurkan tidak memperpanjang kunci tanpa batas. */
function remaining(e: Entry, now: number, offset: number): number {
  const cap = Math.max(waitFor(e.n, offset), SERVER_THROTTLE_MS);
  return Math.min(Math.max(0, e.until - now), cap);
}

export function checkLock(identifier: string, now: number = Date.now()): LockState {
  const s = read();
  const acc = fresh(s[loginKey(identifier)], now, ACCOUNT_FORGET);
  const dev = fresh(s[DEVICE], now, DEVICE_FORGET);
  const remainingMs = Math.max(remaining(acc, now, 0), remaining(dev, now, DEVICE_OFFSET));
  return { locked: remainingMs > 0, remainingMs, failures: acc.n, attemptsLeft: acc.n >= FREE_ATTEMPTS + 1 ? 0 : Math.max(0, FREE_ATTEMPTS + 1 - acc.n) };
}

/** Catat satu salah sandi (akun dan perangkat). Mengembalikan keadaan terbaru. */
export function recordFailure(identifier: string, now: number = Date.now()): LockState {
  const s = read();
  const key = loginKey(identifier);
  const acc = fresh(s[key], now, ACCOUNT_FORGET);
  const dev = fresh(s[DEVICE], now, DEVICE_FORGET);
  const a: Entry = { n: acc.n + 1, last: now, until: Math.max(acc.until, now + waitFor(acc.n + 1)) };
  const d: Entry = { n: dev.n + 1, last: now, until: Math.max(dev.until, now + waitFor(dev.n + 1, DEVICE_OFFSET)) };
  const next: Store = { ...s, [key]: a, [DEVICE]: d };
  // Batasi ukuran: buang entri akun yang paling lama.
  const keys = Object.keys(next).filter((k) => k !== DEVICE);
  if (keys.length > MAX_ENTRIES) {
    keys.sort((x, y) => next[x].last - next[y].last).slice(0, keys.length - MAX_ENTRIES).forEach((k) => delete next[k]);
  }
  write(next);
  return checkLock(identifier, now);
}

/** Masuk berhasil: hitungan akun itu dihapus. Hitungan perangkat TIDAK dihapus (agar tidak bisa direset dengan akun sendiri). */
export function recordSuccess(identifier: string): void {
  const s = read();
  const key = loginKey(identifier);
  if (!(key in s)) return;
  const next = { ...s };
  delete next[key];
  write(next);
}

/** Server Firebase menolak karena terlalu banyak percobaan: pastikan ada jeda minimal. */
export function recordServerThrottle(identifier: string, now: number = Date.now()): LockState {
  const s = read();
  const key = loginKey(identifier);
  const acc = fresh(s[key], now, ACCOUNT_FORGET);
  write({ ...s, [key]: { n: acc.n, last: now, until: Math.max(acc.until, now + SERVER_THROTTLE_MS) } });
  return checkLock(identifier, now);
}

/** "2 menit 10 detik", "1 jam 5 menit", "1 hari 2 jam" (dua satuan terbesar). */
export function formatWait(ms: number): string {
  const total = Math.max(1, Math.ceil(ms / SEC));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d} hari`);
  if (h) parts.push(`${h} jam`);
  if (m) parts.push(`${m} menit`);
  if (s && !d && !h) parts.push(`${s} detik`);
  return parts.slice(0, 2).join(' ') || '1 detik';
}

/** Hanya untuk pengujian. */
export function resetLoginGuardForTests(): void {
  memory = {};
  if (hasStorage()) {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* abaikan */
    }
  }
}

// ───────── Jeda permintaan reset sandi (agar tidak dipakai membanjiri email orang) ─────────

/** Setelah permintaan ke-n (dalam 24 jam) untuk satu email: tunggu sekian sebelum meminta lagi. */
export const RESET_LADDER_MS: readonly number[] = [MIN, 5 * MIN, 15 * MIN, HOUR, DAY];
const RESET_FORGET = DAY;
/** Hitungan per perangkat (semua email) mulai menahan setelah 5 permintaan. */
const RESET_DEVICE_OFFSET = 4;
const RESET_DEVICE = 'r:*perangkat*';

const resetKey = (email: string) => `r:${loginKey(email)}`;
const resetWait = (n: number, offset = 0) => {
  const i = n - offset;
  return i < 1 ? 0 : RESET_LADDER_MS[Math.min(i, RESET_LADDER_MS.length) - 1];
};

export interface ResetState {
  locked: boolean;
  remainingMs: number;
}

export function checkResetCooldown(email: string, now: number = Date.now()): ResetState {
  const s = read();
  const e = fresh(s[resetKey(email)], now, RESET_FORGET);
  const d = fresh(s[RESET_DEVICE], now, RESET_FORGET);
  const cap = RESET_LADDER_MS[RESET_LADDER_MS.length - 1];
  const remainingMs = Math.min(cap, Math.max(0, e.until - now, d.until - now));
  return { locked: remainingMs > 0, remainingMs };
}

/** Catat satu permintaan reset (email dan perangkat). */
export function recordResetRequest(email: string, now: number = Date.now()): ResetState {
  const s = read();
  const k = resetKey(email);
  const e = fresh(s[k], now, RESET_FORGET);
  const d = fresh(s[RESET_DEVICE], now, RESET_FORGET);
  write({
    ...s,
    [k]: { n: e.n + 1, last: now, until: Math.max(e.until, now + resetWait(e.n + 1)) },
    [RESET_DEVICE]: { n: d.n + 1, last: now, until: Math.max(d.until, now + resetWait(d.n + 1, RESET_DEVICE_OFFSET)) },
  });
  return checkResetCooldown(email, now);
}
