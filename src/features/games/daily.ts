import { bankContents } from '@/data/bank';
import type { LearningContent } from '@/types';

/** Tanggal lokal (YYYY-MM-DD). Dipakai sebagai seed tantangan harian: tanpa data baru di server atau perangkat. */
export function localDayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pengacak berbiji (mulberry32): biji sama → urutan sama. */
export function seededRandom(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ambil n unsur acak berbiji tanpa pengulangan (Fisher–Yates). */
export function seededSample<T>(arr: T[], n: number, seed: string): T[] {
  const rnd = seededRandom(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/** Paket bank soal nyata untuk tantangan hari ini (sama untuk semua murid di tanggal yang sama). */
export function dailyPack(day: string = localDayKey()): LearningContent | null {
  const pool = bankContents.filter((c) => c.questions.length >= 10);
  if (pool.length === 0) return null;
  return pool[hash(`pintara-harian-${day}`) % pool.length];
}
