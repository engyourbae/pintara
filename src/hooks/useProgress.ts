import { useSyncExternalStore } from 'react';

/**
 * Kemajuan belajar mode tamu. Disimpan di perangkat (localStorage), tanpa Firebase.
 * Akan diganti penyimpanan IndexedDB + sinkronisasi saat login tersedia (Fase F/G).
 */
const KEY = 'pintara:progress:v1';

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
  /** Skor terbaik per game/tingkat. */
  gameBest: Record<string, number>;
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
  gameBest: {},
  streak: 0,
  lastDay: '',
};

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

let state: Progress = load();
const listeners = new Set<() => void>();

function save(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* penyimpanan penuh/diblokir: aplikasi tetap jalan tanpa menyimpan */
  }
  listeners.forEach((l) => l());
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

export const progressActions = {
  /** Mencatat hasil satu paket kuis. Mengembalikan bintang dan XP yang didapat. */
  recordQuiz(contentId: string, correct: number, total: number) {
    const stars = starsFor(correct, total);
    const gained = correct * 10 + (stars === 3 ? 10 : 0);
    save({
      ...state,
      ...touchStreak(state),
      xp: state.xp + gained,
      answered: state.answered + total,
      correct: state.correct + correct,
      stars: { ...state.stars, [contentId]: Math.max(state.stars[contentId] ?? 0, stars) },
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
  setProfile(name: string, avatar: string) {
    save({ ...state, name: name.slice(0, 20), avatar });
  },
  reset() {
    save({ ...EMPTY });
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, () => state);
}

/** Level naik tiap 100 XP. */
export function levelInfo(xp: number) {
  return { level: Math.floor(xp / 100) + 1, into: xp % 100 };
}

export function totalStars(p: Progress): number {
  return Object.values(p.stars).reduce((a, b) => a + b, 0);
}
