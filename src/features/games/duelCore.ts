import { DUEL_TOTAL, type DuelAnswer, type DuelQuestion } from '@/services/firebase/duel';

const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

/** Hasil hitungan dari teks soal ("12 + 7", "9 − 4", "6 × 8"). null bila bukan format ini. */
export function solve(prompt: string): number | null {
  const m = /^(\d+) ([+−×]) (\d+)$/.exec(prompt.trim());
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  return m[2] === '+' ? a + b : m[2] === '−' ? a - b : a * b;
}

/** Indeks pilihan yang benar; -1 bila tidak bisa dihitung. */
export function correctIndex(q: DuelQuestion): number {
  const answer = solve(q.prompt);
  return answer === null ? -1 : q.options.findIndex((o) => Number(o) === answer);
}

/** 10 soal campuran: tambah, kurang, kali (diatur berselang-seling), masing-masing 4 pilihan. */
export function makeDuelQuestions(): DuelQuestion[] {
  return Array.from({ length: DUEL_TOTAL }, (_, i) => {
    let prompt: string;
    let answer: number;
    if (i % 3 === 0) {
      const a = rand(5, 40);
      const b = rand(3, 40);
      prompt = `${a} + ${b}`;
      answer = a + b;
    } else if (i % 3 === 1) {
      const a = rand(15, 60);
      const b = rand(3, a - 1);
      prompt = `${a} − ${b}`;
      answer = a - b;
    } else {
      const a = rand(2, 9);
      const b = rand(2, 9);
      prompt = `${a} × ${b}`;
      answer = a * b;
    }
    const set = new Set<number>([answer]);
    while (set.size < 4) {
      const d = answer + rand(-8, 8);
      if (d >= 0) set.add(d);
    }
    return { prompt, options: shuffle([...set]).map(String) };
  });
}

export interface DuelScore {
  score: number;
  correct: number;
}

/**
 * Skor dari jawaban yang tercatat: benar = 100. Bila kedua pemain benar, yang lebih cepat (cap waktu server) dapat +20.
 * `upTo` = indeks soal terakhir yang dihitung (inklusif).
 */
export function scoreAll(uids: string[], questions: (DuelQuestion | null)[], answers: Record<string, DuelAnswer>[], upTo: number): Record<string, DuelScore> {
  const out: Record<string, DuelScore> = Object.fromEntries(uids.map((u) => [u, { score: 0, correct: 0 }]));
  for (let i = 0; i <= upTo && i < questions.length; i++) {
    const q = questions[i];
    if (!q) continue;
    const ci = correctIndex(q);
    if (ci < 0) continue;
    const right = uids.filter((u) => answers[i]?.[u]?.choice === ci);
    right.forEach((u) => {
      out[u].score += 100;
      out[u].correct += 1;
    });
    if (right.length === 2) {
      const [a, b] = right;
      const ta = answers[i][a].at;
      const tb = answers[i][b].at;
      if (ta !== tb) out[ta < tb ? a : b].score += 20;
    }
  }
  return out;
}
