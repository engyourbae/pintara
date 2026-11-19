import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { getDb } from './client';

/**
 * Kuis buatan guru. Soal disimpan TANPA kunci jawaban (`teacher_quizzes`), kunci ada di `quiz_keys` (hanya guru).
 * Murid mengirim jawaban mentah ke `quiz_answers` (sekali kirim). Guru yang menilai: benar/salah per soal terlihat di app guru,
 * lalu guru dapat membagikan nilai ke murid lewat koleksi `results` yang sudah ada (kunci `tq_<id kuis>`).
 */

export const MAX_TQ_QUESTIONS = 20;
export const tqResultKey = (quizId: string) => `tq_${quizId}`;

export interface TQuestion {
  prompt: string;
  options: string[];
}
export interface TQuestionDraft extends TQuestion {
  /** Indeks jawaban benar; -1 = belum dipilih. */
  correct: number;
}
export interface TeacherQuiz {
  id: string;
  title: string;
  note: string;
  count: number;
  questions: TQuestion[];
  t: number;
}
export interface TQAnswer {
  uid: string;
  answers: number[];
}

function toQuiz(id: string, x: Record<string, unknown>): TeacherQuiz | null {
  if (!Array.isArray(x.questions)) return null;
  const questions: TQuestion[] = [];
  for (const q of x.questions as unknown[]) {
    const r = q as { prompt?: unknown; options?: unknown };
    if (typeof r?.prompt !== 'string' || !Array.isArray(r.options)) return null;
    questions.push({ prompt: r.prompt, options: (r.options as unknown[]).map((o) => String(o)) });
  }
  const created = x.createdAt as { toMillis?: () => number } | undefined;
  return {
    id,
    title: typeof x.title === 'string' ? x.title : 'Kuis guru',
    note: typeof x.note === 'string' ? x.note : '',
    count: questions.length,
    questions,
    t: created && typeof created.toMillis === 'function' ? created.toMillis() : 0,
  };
}

export async function listTeacherQuizzes(classId: string): Promise<TeacherQuiz[]> {
  const snap = await getDocs(collection(getDb(), 'classes', classId, 'teacher_quizzes'));
  const out: TeacherQuiz[] = [];
  snap.forEach((d) => {
    const q = toQuiz(d.id, d.data());
    if (q) out.push(q);
  });
  return out.sort((a, b) => b.t - a.t);
}

export async function getTeacherQuiz(classId: string, quizId: string): Promise<TeacherQuiz | null> {
  const d = await getDoc(doc(getDb(), 'classes', classId, 'teacher_quizzes', quizId));
  return d.exists() ? toQuiz(d.id, d.data()) : null;
}

export async function createTeacherQuiz(classId: string, input: { title: string; note: string; questions: TQuestionDraft[] }): Promise<void> {
  const db = getDb();
  const ref = doc(collection(db, 'classes', classId, 'teacher_quizzes'));
  const batch = writeBatch(db);
  batch.set(ref, {
    title: input.title.trim().slice(0, 100),
    note: input.note.trim().slice(0, 200),
    count: input.questions.length,
    questions: input.questions.map((q) => ({ prompt: q.prompt.trim().slice(0, 200), options: q.options.map((o) => o.trim().slice(0, 80)) })),
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'classes', classId, 'quiz_keys', ref.id), { answers: input.questions.map((q) => q.correct) });
  await batch.commit();
}

/** Hapus kuis, kuncinya, jawaban murid, dan nilai yang pernah dibagikan (supaya data tidak menumpuk). */
export async function deleteTeacherQuiz(classId: string, quizId: string): Promise<void> {
  const db = getDb();
  const answers = await getDocs(query(collection(db, 'classes', classId, 'quiz_answers'), where('quizId', '==', quizId)));
  const batch = writeBatch(db);
  answers.forEach((a) => {
    batch.delete(a.ref);
    const uid = a.data().uid;
    if (typeof uid === 'string') batch.delete(doc(db, 'classes', classId, 'results', `${tqResultKey(quizId)}_${uid}`));
  });
  batch.delete(doc(db, 'classes', classId, 'quiz_keys', quizId));
  batch.delete(doc(db, 'classes', classId, 'teacher_quizzes', quizId));
  await batch.commit();
}

// ───────── Murid ─────────

/** Id kuis guru yang sudah dijawab murid ini. */
export async function myTeacherAnswered(classId: string, uid: string): Promise<Set<string>> {
  const snap = await getDocs(query(collection(getDb(), 'classes', classId, 'quiz_answers'), where('uid', '==', uid)));
  const s = new Set<string>();
  snap.forEach((d) => {
    const id = d.data().quizId;
    if (typeof id === 'string') s.add(id);
  });
  return s;
}

/** Kirim jawaban (sekali). Rules menolak kirim ulang; guru bisa memberi kesempatan ulang. */
export async function submitTeacherAnswers(classId: string, uid: string, quizId: string, answers: number[]): Promise<void> {
  await setDoc(doc(getDb(), 'classes', classId, 'quiz_answers', `${quizId}_${uid}`), {
    uid, quizId, answers, submittedAt: serverTimestamp(),
  });
}

// ───────── Guru ─────────

export interface QuizReview {
  key: number[] | null;
  answers: TQAnswer[];
}

export async function loadQuizReview(classId: string, quizId: string): Promise<QuizReview> {
  const db = getDb();
  const [k, a] = await Promise.all([
    getDoc(doc(db, 'classes', classId, 'quiz_keys', quizId)),
    getDocs(query(collection(db, 'classes', classId, 'quiz_answers'), where('quizId', '==', quizId))),
  ]);
  const raw = k.exists() ? k.data().answers : null;
  const key = Array.isArray(raw) ? (raw as unknown[]).map((n) => (typeof n === 'number' ? n : -1)) : null;
  const answers: TQAnswer[] = [];
  a.forEach((d) => {
    const x = d.data();
    if (typeof x.uid === 'string' && Array.isArray(x.answers)) {
      answers.push({ uid: x.uid, answers: (x.answers as unknown[]).map((n) => (typeof n === 'number' ? n : -1)) });
    }
  });
  return { key, answers };
}

/** Tulis nilai ke `results` supaya murid bisa melihat skornya (hanya guru yang boleh menulis nilai milik murid). */
export async function shareQuizScores(classId: string, quizId: string, rows: { uid: string; correct: number; total: number }[]): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  for (const r of rows) {
    batch.set(doc(db, 'classes', classId, 'results', `${tqResultKey(quizId)}_${r.uid}`), {
      uid: r.uid,
      quizId: tqResultKey(quizId),
      score: Math.round((r.correct / r.total) * 100),
      correct: r.correct,
      total: r.total,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

/** Beri satu murid kesempatan mengerjakan ulang: hapus jawaban dan nilainya. */
export async function resetStudentAnswer(classId: string, quizId: string, uid: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'classes', classId, 'results', `${tqResultKey(quizId)}_${uid}`)).catch(() => undefined);
  await deleteDoc(doc(db, 'classes', classId, 'quiz_answers', `${quizId}_${uid}`));
}
