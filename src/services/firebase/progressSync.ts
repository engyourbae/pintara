import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { sampleContents } from '@/data/sample';
import { gameIdOfKey } from '@/data/missions';
import { getProgress, progressActions, subscribeProgress } from '@/hooks/useProgress';
import type { QuizBest } from '@/types';
import { getDb } from './client';

/**
 * Menyalin kemajuan siswa (lokal) ke Firestore: XP, hasil per kuis (untuk orang tua), dan hasil per kelas
 * (untuk guru). Berjalan otomatis tiap kemajuan berubah dan saat internet kembali. Idempoten: aman diulang.
 * Batas "XP naik maksimal 1000 per tulis" dan "skor tidak boleh turun" ditegakkan Security Rules.
 */

interface RemoteItem {
  bestScore: number;
  attempts: number;
}

const warn = (what: string, e: unknown) => console.warn(`[sync] ${what} gagal`, e);

async function pull(uid: string) {
  const db = getDb();
  const [prog, items, prof] = await Promise.all([
    getDoc(doc(db, 'learning_progress', uid)),
    getDocs(collection(db, 'learning_progress', uid, 'items')),
    getDoc(doc(db, 'user_profiles', uid)).catch(() => null),
  ]);
  const xp = prog.exists() && typeof prog.data().xp === 'number' ? (prog.data().xp as number) : 0;
  const remote: Record<string, RemoteItem> = {};
  const merge: Record<string, QuizBest> = {};
  items.forEach((d) => {
    const x = d.data();
    if (typeof x.bestScore !== 'number' || typeof x.attempts !== 'number') return;
    remote[d.id] = { bestScore: x.bestScore, attempts: x.attempts };
    const content = sampleContents.find((c) => c.id === d.id);
    const total = content ? content.questions.length : 1;
    merge[d.id] = { score: x.bestScore, total, correct: Math.min(total, Math.round((x.bestScore * total) / 100)), attempts: x.attempts };
  });
  const avatar = prof?.exists() && typeof prof.data().avatarId === 'string' ? (prof.data().avatarId as string) : undefined;
  progressActions.mergeRemote({ xp, items: merge, avatar });
  return { prog, xp, remote };
}

async function pushXp(uid: string, exists: boolean, remoteXp: number) {
  const target = getProgress().xp;
  if (exists && target <= remoteXp) return;
  const ref = doc(getDb(), 'learning_progress', uid);
  let cur = remoteXp;
  if (!exists) {
    cur = Math.min(target, 1000);
    await setDoc(ref, { xp: cur, updatedAt: serverTimestamp() });
  }
  while (cur < target) {
    cur = Math.min(target, cur + 1000);
    await updateDoc(ref, { xp: cur, updatedAt: serverTimestamp() });
  }
}

async function pushItems(uid: string, remote: Record<string, RemoteItem>) {
  const db = getDb();
  for (const [id, b] of Object.entries(getProgress().quizBest)) {
    const r = remote[id];
    if (r && b.attempts <= r.attempts && b.score <= r.bestScore) continue;
    const content = sampleContents.find((c) => c.id === id);
    await setDoc(doc(db, 'learning_progress', uid, 'items', id), {
      bestScore: Math.max(b.score, r?.bestScore ?? 0),
      attempts: Math.max(b.attempts, r?.attempts ?? 0, 1),
      completed: true,
      version: content ? content.version : 1,
      lastPlayedAt: serverTimestamp(),
    });
  }
}

/** Hasil per kuis untuk setiap kelas yang sudah menyetujui siswa. Hanya yang berubah sejak terakhir. */
async function pushClassResults(uid: string, pushed: Map<string, string>) {
  const db = getDb();
  const mem = await getDocs(query(collection(db, 'class_members'), where('uid', '==', uid), where('status', '==', 'active')));
  for (const m of mem.docs) {
    const classId = m.data().classId as string;
    for (const [quizId, b] of Object.entries(getProgress().quizBest)) {
      const sig = `${b.score}|${b.attempts}`;
      if (pushed.get(`${classId}:${quizId}`) === sig) continue;
      await setDoc(doc(db, 'classes', classId, 'results', `${quizId}_${uid}`), {
        uid,
        quizId,
        score: b.score,
        correct: b.correct,
        total: b.total,
        updatedAt: serverTimestamp(),
      });
      pushed.set(`${classId}:${quizId}`, sig);
    }
    // Game: dianggap "selesai" bila pernah dimainkan (skor > 0). Skor asli game tetap di perangkat.
    const played = new Set(Object.entries(getProgress().gameBest).filter(([, v]) => v > 0).map(([k]) => gameIdOfKey(k)));
    for (const gameId of played) {
      const quizId = `game_${gameId}`;
      if (pushed.get(`${classId}:${quizId}`) === 'ok') continue;
      await setDoc(doc(db, 'classes', classId, 'results', `${quizId}_${uid}`), {
        uid, quizId, score: 100, correct: 1, total: 1, updatedAt: serverTimestamp(),
      });
      pushed.set(`${classId}:${quizId}`, 'ok');
    }
  }
}

/** Mulai sinkronisasi untuk satu akun siswa. Mengembalikan fungsi untuk menghentikannya. */
export function startProgressSync(uid: string): () => void {
  const pushed = new Map<string, string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let again = false;
  let stopped = false;

  async function run() {
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      const { prog, xp, remote } = await pull(uid);
      if (stopped) return;
      await pushXp(uid, prog.exists(), xp).catch((e) => warn('XP', e));
      await pushItems(uid, remote).catch((e) => warn('hasil kuis', e));
      await pushClassResults(uid, pushed).catch((e) => warn('hasil kelas', e));
    } catch (e) {
      warn('tarik data', e);
    } finally {
      running = false;
      if (again && !stopped) {
        again = false;
        schedule();
      }
    }
  }

  function schedule() {
    if (stopped) return;
    clearTimeout(timer);
    timer = setTimeout(() => void run(), 1500);
  }

  const off = subscribeProgress(schedule);
  window.addEventListener('online', schedule);
  void run();
  return () => {
    stopped = true;
    clearTimeout(timer);
    off();
    window.removeEventListener('online', schedule);
  };
}
