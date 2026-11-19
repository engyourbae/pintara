import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { sampleContents } from '@/data/sample';
import { GAME_MISSIONS, gameIdOfKey } from '@/data/missions';
import { getProgress, progressActions, subscribeProgress } from '@/hooks/useProgress';
import type { QuizBest } from '@/types';
import { getDb } from './client';

/**
 * Menyalin kemajuan siswa (lokal) ke Firestore secukupnya: XP/level, hasil terbaik per kuis (untuk orang tua),
 * ringkasan kecil satu dokumen (skor game terbaik, rangkaian hari), dan hasil per kelas (untuk guru).
 * Tidak ada riwayat per soal/percobaan. Berjalan tiap kemajuan berubah dan saat internet kembali. Idempoten.
 * Hemat kuota: data server DIBACA SEKALI saat sesi dimulai (untuk memulihkan setelah data peramban terhapus)
 * dan setelah offline; selanjutnya hanya MENULIS bagian yang berubah.
 * Batas "XP naik maksimal 1000 per tulis" dan "skor tidak boleh turun" ditegakkan Security Rules.
 */

interface RemoteItem {
  bestScore: number;
  attempts: number;
}

const warn = (what: string, e: unknown) => console.warn(`[sync] ${what} gagal`, e);

interface Remote {
  exists: boolean;
  xp: number;
  items: Record<string, RemoteItem>;
  snapSig: string;
}

const snapshotSig = (d: { streak: number; lastDay: string; answered: number; correct: number; games: Record<string, number> }) => JSON.stringify(d);

async function pull(uid: string): Promise<Remote> {
  const db = getDb();
  const [prog, items, prof, snap] = await Promise.all([
    getDoc(doc(db, 'learning_progress', uid)),
    getDocs(collection(db, 'learning_progress', uid, 'items')),
    getDoc(doc(db, 'user_profiles', uid)).catch(() => null),
    getDoc(doc(db, 'learning_progress', uid, 'snapshot', 'main')).catch(() => null),
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
  const sd = snap?.exists() ? snap.data() : null;
  const games: Record<string, number> = {};
  if (sd && sd.games && typeof sd.games === 'object') {
    for (const [k, v] of Object.entries(sd.games as Record<string, unknown>)) if (typeof v === 'number') games[k] = v;
  }
  progressActions.mergeRemote({
    xp,
    items: merge,
    avatar,
    games,
    streak: sd && typeof sd.streak === 'number' ? sd.streak : undefined,
    lastDay: sd && typeof sd.lastDay === 'string' ? sd.lastDay : undefined,
    answered: sd && typeof sd.answered === 'number' ? sd.answered : undefined,
    correct: sd && typeof sd.correct === 'number' ? sd.correct : undefined,
  });
  const snapSig = sd
    ? snapshotSig({ streak: Number(sd.streak) || 0, lastDay: String(sd.lastDay ?? ''), answered: Number(sd.answered) || 0, correct: Number(sd.correct) || 0, games })
    : '';
  return { exists: prog.exists(), xp, items: remote, snapSig };
}

async function pushXp(uid: string, remote: Remote) {
  const { exists, xp: remoteXp } = remote;
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
  remote.exists = true;
  remote.xp = cur;
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
    remote[id] = { bestScore: Math.max(b.score, r?.bestScore ?? 0), attempts: Math.max(b.attempts, r?.attempts ?? 0, 1) };
  }
}

/** Ringkasan kecil satu dokumen. Ditulis hanya bila isinya berubah. */
async function pushSnapshot(uid: string, remote: Remote) {
  const p = getProgress();
  const games = Object.fromEntries(
    Object.entries(p.gameBest)
      .filter(([, v]) => v > 0)
      .slice(0, 40)
      .map(([k, v]) => [k, Math.round(v)]),
  );
  const d = { streak: Math.max(0, Math.round(p.streak)), lastDay: p.lastDay.slice(0, 10), answered: Math.max(0, Math.round(p.answered)), correct: Math.max(0, Math.round(p.correct)), games };
  const sig = snapshotSig(d);
  if (sig === remote.snapSig) return;
  await setDoc(doc(getDb(), 'learning_progress', uid, 'snapshot', 'main'), { ...d, updatedAt: serverTimestamp() });
  remote.snapSig = sig;
}

/** Hasil per kuis untuk setiap kelas yang sudah menyetujui siswa. Hanya yang berubah sejak terakhir. */
async function pushClassResults(uid: string, pushed: Map<string, string>, classIds: string[]) {
  const db = getDb();
  for (const classId of classIds) {
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
    // Hanya game yang bisa jadi misi kelas (GAME_MISSIONS); game lain tidak menambah dokumen hasil kelas.
    const missionIds = new Set<string>(GAME_MISSIONS.map((g) => g.id));
    const played = new Set(Object.entries(getProgress().gameBest).filter(([, v]) => v > 0).map(([k]) => gameIdOfKey(k)).filter((id) => missionIds.has(id)));
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
  let remote: Remote | null = null; // salinan data server; dibaca sekali per sesi
  let repull = false; // baca ulang setelah offline
  let classIds: string[] = [];
  let classesAt = 0;
  let snapOff = false; // ringkasan ditolak (mis. Rules belum di-publish): jangan coba terus

  async function run() {
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      if (!remote || repull) {
        remote = await pull(uid);
        repull = false;
      }
      if (stopped) return;
      await pushXp(uid, remote).catch((e) => warn('XP', e));
      await pushItems(uid, remote.items).catch((e) => warn('hasil kuis', e));
      if (!snapOff) {
        await pushSnapshot(uid, remote).catch((e) => {
          warn('ringkasan', e);
          snapOff = true;
        });
      }
      // Daftar kelas diperbarui paling sering tiap 5 menit (hemat pembacaan).
      if (Date.now() - classesAt > 5 * 60 * 1000) {
        const mem = await getDocs(query(collection(getDb(), 'class_members'), where('uid', '==', uid), where('status', '==', 'active')));
        classIds = mem.docs.map((m) => m.data().classId as string);
        classesAt = Date.now();
      }
      await pushClassResults(uid, pushed, classIds).catch((e) => warn('hasil kelas', e));
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

  const onOnline = () => {
    repull = true;
    classesAt = 0;
    schedule();
  };
  const off = subscribeProgress(schedule);
  window.addEventListener('online', onOnline);
  void run();
  return () => {
    stopped = true;
    clearTimeout(timer);
    off();
    window.removeEventListener('online', onOnline);
  };
}
