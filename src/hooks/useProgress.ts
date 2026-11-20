import { useSyncExternalStore } from 'react';
import type { QuizBest } from '@/types';

/**
 * Kemajuan belajar. Disimpan di perangkat (localStorage), TERPISAH per pemilik:
 * 'guest' untuk mode tamu, atau uid akun siswa yang sedang masuk. Untuk akun siswa,
 * progressSync menyalin ke Firestore agar guru dan orang tua dapat melihatnya.
 * Akan diganti IndexedDB + antrean sinkronisasi di Fase G.
 */
const PREFIX = 'pintara:progress:v2:';
const OLD_KEY = 'pintara:progress:v1';

export interface AvatarOption {
  id: string;
  icon: 'star' | 'heart' | 'book' | 'game' | 'pencil' | 'chart';
  bg: string;
}

export const AVATARS: AvatarOption[] = [
  { id: 'bintang', icon: 'star', bg: 'bg-kuning-300' },
  { id: 'hati', icon: 'heart', bg: 'bg-jingga-300' },
  { id: 'buku', icon: 'book', bg: 'bg-hijau-300' },
  { id: 'game', icon: 'game', bg: 'bg-langit-300' },
  { id: 'pensil', icon: 'pencil', bg: 'bg-kuning-100' },
  { id: 'grafik', icon: 'chart', bg: 'bg-langit-100' },
];

export interface Progress {
  name: string;
  avatar: string;
  xp: number;
  answered: number;
  correct: number;
  /** Bintang terbaik (0-3) per paket kuis. */
  stars: Record<string, number>;
  /** Hasil terbaik dan jumlah percobaan per paket kuis. */
  quizBest: Record<string, QuizBest>;
  /** Skor terbaik per game/tingkat. */
  gameBest: Record<string, number>;
  /**
   * Id soal yang sudah dikerjakan per paket kuis (untuk level: soal yang sudah dikerjakan tidak muncul lagi sampai semua
   * soal paket selesai). Hanya di perangkat; tidak disalin ke Firebase agar data server tidak menumpuk.
   */
  levelDone: Record<string, string[]>;
  streak: number;
  lastDay: string;
}

const EMPTY: Progress = {
  name: '',
  avatar: 'bintang',
  xp: 0,
  answered: 0,
  correct: 0,
  stars: {},
  quizBest: {},
  gameBest: {},
  levelDone: {},
  streak: 0,
  lastDay: '',
};

function load(owner: string): Progress {
  try {
    let raw = localStorage.getItem(PREFIX + owner);
    if (!raw && owner === 'guest') raw = localStorage.getItem(OLD_KEY); // data tamu dari versi lama
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

let owner = 'guest';
let state: Progress = load(owner);
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function save(next: Progress) {
  state = next;
  try {
    localStorage.setItem(PREFIX + owner, JSON.stringify(next));
  } catch {
    /* penyimpanan penuh/diblokir: aplikasi tetap jalan tanpa menyimpan */
  }
  notify();
}

function dayString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Hitung ulang rentetan hari belajar berturut-turut. */
function touchStreak(p: Progress): Pick<Progress, 'streak' | 'lastDay'> {
  const today = dayString(new Date());
  if (p.lastDay === today) return { streak: p.streak, lastDay: today };
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return { streak: p.lastDay === dayString(y) ? p.streak + 1 : 1, lastDay: today };
}

export function starsFor(correct: number, total: number): number {
  if (total === 0) return 0;
  const r = correct / total;
  return r >= 1 ? 3 : r >= 0.67 ? 2 : r > 0 ? 1 : 0;
}

/** Bintang dari persen skor (dipakai saat menggabungkan data dari server). */
export const starsFromScore = (score: number): number => (score >= 100 ? 3 : score >= 67 ? 2 : score > 0 ? 1 : 0);

export interface RemoteProgress {
  xp: number;
  items: Record<string, QuizBest>;
  avatar?: string;
  /** Ringkasan kecil (opsional): skor game terbaik, rangkaian hari, hitungan jawaban. */
  games?: Record<string, number>;
  streak?: number;
  lastDay?: string;
  answered?: number;
  correct?: number;
}

export const progressActions = {
  /** Mencatat hasil satu paket kuis. Mengembalikan bintang dan XP yang didapat. */
  recordQuiz(contentId: string, correct: number, total: number) {
    const stars = starsFor(correct, total);
    const gained = correct * 10 + (stars === 3 ? 10 : 0);
    const prev = state.quizBest[contentId];
    const score = total > 0 ? Math.round((correct * 100) / total) : 0;
    const better = !prev || score >= prev.score;
    const quizBest: Record<string, QuizBest> =
      total > 0
        ? {
            ...state.quizBest,
            [contentId]: {
              score: better ? score : prev.score,
              correct: better ? correct : prev.correct,
              total: better ? total : prev.total,
              attempts: (prev?.attempts ?? 0) + 1,
            },
          }
        : state.quizBest;
    save({
      ...state,
      ...touchStreak(state),
      xp: state.xp + gained,
      answered: state.answered + total,
      correct: state.correct + correct,
      stars: { ...state.stars, [contentId]: Math.max(state.stars[contentId] ?? 0, stars) },
      quizBest,
    });
    return { stars, gained };
  },
  recordGame(gameId: string, score: number, gained: number) {
    save({
      ...state,
      ...touchStreak(state),
      xp: state.xp + gained,
      gameBest: { ...state.gameBest, [gameId]: Math.max(state.gameBest[gameId] ?? 0, score) },
    });
  },
  /** Tandai soal-soal ini selesai dikerjakan pada paket tersebut. */
  markLevelDone(contentId: string, ids: string[]) {
    const merged = Array.from(new Set([...(state.levelDone?.[contentId] ?? []), ...ids]));
    save({ ...state, levelDone: { ...(state.levelDone ?? {}), [contentId]: merged } });
  },
  /** Ulangi paket dari awal: semua soal boleh muncul lagi. */
  resetLevels(contentId: string) {
    const next = { ...(state.levelDone ?? {}) };
    delete next[contentId];
    save({ ...state, levelDone: next });
  },
  setProfile(name: string, avatar: string) {
    save({ ...state, name: name.slice(0, 20), avatar });
  },
  reset() {
    save({ ...EMPTY });
  },
  /** Ganti pemilik data (tamu <-> akun siswa). Tiap pemilik punya data sendiri di perangkat. */
  switchOwner(next: string) {
    if (next === owner) return;
    owner = next;
    state = load(next);
    notify();
  },
  /** Gabungkan data dari server ke lokal (ambil yang terbaik). Tidak menyimpan/memberi tahu bila tak ada perubahan. */
  mergeRemote(r: RemoteProgress) {
    const quizBest = { ...state.quizBest };
    const stars = { ...state.stars };
    let changed = false;
    for (const [id, it] of Object.entries(r.items)) {
      const cur = quizBest[id];
      const merged: QuizBest = !cur ? it : { ...(it.score > cur.score ? it : cur), attempts: Math.max(cur.attempts, it.attempts) };
      if (!cur || merged.score !== cur.score || merged.attempts !== cur.attempts) {
        quizBest[id] = merged;
        changed = true;
      }
      const s = starsFromScore(merged.score);
      if ((stars[id] ?? 0) < s) {
        stars[id] = s;
        changed = true;
      }
    }
    const xp = Math.max(state.xp, r.xp);
    if (xp !== state.xp) changed = true;
    const avatar = r.avatar && state.avatar === 'bintang' && r.avatar !== 'bintang' ? r.avatar : state.avatar;
    if (avatar !== state.avatar) changed = true;
    const gameBest = { ...state.gameBest };
    for (const [k, v] of Object.entries(r.games ?? {})) {
      if (typeof v === 'number' && v > (gameBest[k] ?? 0)) {
        gameBest[k] = v;
        changed = true;
      }
    }
    // Hari aktif terbaru menang (setelah data peramban terhapus, lokal kosong).
    let streak = state.streak;
    let lastDay = state.lastDay;
    if (r.lastDay && r.lastDay > state.lastDay) {
      streak = r.streak ?? state.streak;
      lastDay = r.lastDay;
      changed = true;
    }
    const answered = Math.max(state.answered, r.answered ?? 0);
    const correct = Math.max(state.correct, r.correct ?? 0);
    if (answered !== state.answered || correct !== state.correct) changed = true;
    if (changed) save({ ...state, xp, quizBest, stars, avatar, gameBest, streak, lastDay, answered, correct });
  },
};

export function getProgress(): Progress {
  return state;
}

export function subscribeProgress(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribeProgress, () => state);
}

/** Level naik tiap 100 XP. */
export function levelInfo(xp: number) {
  return { level: Math.floor(xp / 100) + 1, into: xp % 100 };
}

export function totalStars(p: Progress): number {
  return Object.values(p.stars).reduce((a, b) => a + b, 0);
}
