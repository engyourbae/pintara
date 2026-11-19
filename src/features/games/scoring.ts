/**
 * Aturan poin cepat PINTARA. Satu tempat untuk konstanta agar kuis tim, game, dan duel
 * memakai bahasa yang sama (jawab cepat = poin lebih besar).
 */
export interface SpeedTier {
  /** Batas waktu (detik) sampai tingkat ini masih berlaku. */
  maxSeconds: number;
  points: number;
  label: string;
}

/** Kuis Tim Kelas Langsung: benar ≤5 dtk = 15, ≤10 dtk = 12, lebih lambat = 10; salah = 0. */
export const TEAM_QUIZ_TIERS: SpeedTier[] = [
  { maxSeconds: 5, points: 15, label: 'Kilat' },
  { maxSeconds: 10, points: 12, label: 'Cepat' },
  { maxSeconds: Infinity, points: 10, label: 'Tepat' },
];

/** Batas waktu terakhir yang masih memberi bonus (dipakai untuk bilah waktu). */
export const TEAM_QUIZ_BONUS_SECONDS = 10;

export function tierForSeconds(seconds: number, tiers: SpeedTier[]): SpeedTier {
  return tiers.find((t) => seconds <= t.maxSeconds) ?? tiers[tiers.length - 1];
}

/** Poin satu jawaban kuis tim. Salah selalu 0. */
export function teamQuizPoints(correct: boolean, seconds: number): number {
  return correct ? tierForSeconds(seconds, TEAM_QUIZ_TIERS).points : 0;
}

/** Teks aturan seragam untuk layar awal. */
export const TEAM_QUIZ_RULES = 'Benar ≤5 detik = 15 poin, ≤10 detik = 12 poin, lebih lambat = 10 poin. Salah = 0.';
