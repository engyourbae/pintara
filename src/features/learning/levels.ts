import type { LearningContent, QuizQuestion } from '@/types';

/** Jumlah soal per level. Level dibentuk dari urutan soal di paket (10 pertama = Level 1, dst.). */
export const LEVEL_SIZE = 10;

export interface LevelInfo {
  /** 0-based. */
  index: number;
  questions: QuizQuestion[];
  /** Jumlah soal level ini yang sudah dikerjakan. */
  done: number;
  complete: boolean;
}

/**
 * Bagi paket menjadi level berisi LEVEL_SIZE soal. Soal baru yang ditambahkan di akhir paket otomatis membentuk
 * level baru (atau mengisi level terakhir bila belum penuh); kemajuan lama tetap aman karena dicatat per id soal.
 */
export function levelsOf(content: LearningContent, doneIds: ReadonlySet<string>): LevelInfo[] {
  const out: LevelInfo[] = [];
  for (let i = 0; i < content.questions.length; i += LEVEL_SIZE) {
    const questions = content.questions.slice(i, i + LEVEL_SIZE);
    const done = questions.filter((q) => doneIds.has(q.id)).length;
    out.push({ index: i / LEVEL_SIZE, questions, done, complete: done === questions.length });
  }
  return out;
}

/** Level yang sedang dikerjakan (level pertama yang belum selesai). -1 bila semua level selesai. */
export function currentLevel(levels: LevelInfo[]): number {
  return levels.findIndex((l) => !l.complete);
}

/** Soal level yang belum dikerjakan; inilah yang tampil di sesi (soal yang sudah dikerjakan tidak muncul lagi). */
export const remainingOf = (level: LevelInfo, doneIds: ReadonlySet<string>): QuizQuestion[] => level.questions.filter((q) => !doneIds.has(q.id));
