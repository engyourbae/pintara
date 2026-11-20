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

// ───────── Game kuis & memori (F28c) ─────────

/** Kuis Kilat Paket: batas waktu per soal (detik). Poin per jawaban benar sama dengan kuis tim. */
export const QUICK_LIMIT = 15;
export const quickPoints = (correct: boolean, seconds: number): number => teamQuizPoints(correct, seconds);

/** Bonus XP kecil untuk jawaban benar beruntun: 3–5 beruntun +1, 6 atau lebih +2 (per jawaban benar). */
export function comboBonusXp(streak: number): number {
  return streak >= 6 ? 2 : streak >= 3 ? 1 : 0;
}

/** Pasangan Memori: bintang dari jumlah langkah (satu langkah = membuka dua kartu). */
export function memoryStars(moves: number, pairs: number): number {
  return moves <= Math.ceil(pairs * 1.5) ? 3 : moves <= Math.ceil(pairs * 2.5) ? 2 : 1;
}
/** Skor tersimpan: bintang×100 + bonus waktu (0–60). Bintang terbaik = floor(skor/100). */
export const memoryScore = (stars: number, seconds: number): number => stars * 100 + Math.max(0, 60 - Math.floor(seconds));

/** Bintang terbaik untuk kunci skor game baru di menu. Game lama (kilat, susun kata, teka pola) tidak punya bintang. */
export function starsOfBest(key: string, best: number): number {
  if (best <= 0) return 0;
  if (key.startsWith('memori-')) return Math.min(3, Math.floor(best / 100));
  if (key === 'kuis-kilat') return best >= 135 ? 3 : best >= 90 ? 2 : 1;
  if (key === 'benar-salah') return best >= 100 ? 3 : best >= 60 ? 2 : 1;
  return 0;
}

// ───────── Satu sumber aturan untuk duel, kuis kilat, benar/salah, kilat hitung (F28d) ─────────

/** Teks aturan poin cepat yang sama di kuis tim, Kuis Kilat, dan layar aturan lain. */
export const SPEED_RULES = TEAM_QUIZ_RULES;

/** Duel 1 lawan 1 (hitung dan paket): benar = 100, bila keduanya benar yang lebih cepat +20. */
export const DUEL_CORRECT_POINTS = 100;
export const DUEL_FAST_BONUS = 20;
export const DUEL_RULES = `Benar = ${DUEL_CORRECT_POINTS} poin, yang lebih cepat dapat bonus +${DUEL_FAST_BONUS}.`;

/** Benar atau Salah Kilat. */
export const TF_SECONDS = 30;
export const TF_LIVES = 3;
export const TF_POINTS = 10;
export const TF_XP_CAP = 30;
export const tfXp = (correct: number): number => Math.min(TF_XP_CAP, correct * 2);

/** Kilat Hitung (game lama): 10 poin + sisa detik. Rumus dipertahankan agar skor terbaik lama tetap sebanding. */
export const kilatHitungPoints = (secondsLeft: number): number => 10 + Math.floor(secondsLeft);
