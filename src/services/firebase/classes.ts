import {
  collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
  type DocumentReference,
} from 'firebase/firestore';
import { resultKeyOf } from '@/data/missions';
import type { Mission } from '@/types';
import type { ChildItem, ChildProgress, ChildSummary, ClassInfo, Grade, MemberRow, MemberStatus, MyMembership, ResultRow } from '@/types';
import { getDb } from './client';

/** Kode kelas 6 karakter tanpa huruf/angka yang mudah tertukar (0/O, 1/I). */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (n) => CODE_CHARS[n % CODE_CHARS.length]).join('');

export const normalizeCode = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

function toClass(id: string, d: Record<string, unknown>): ClassInfo {
  return {
    id,
    name: typeof d.name === 'string' ? d.name : 'Kelas',
    grade: (typeof d.grade === 'number' ? d.grade : 1) as Grade,
    joinCode: typeof d.joinCode === 'string' ? d.joinCode : '',
    archived: d.archived === true,
  };
}

// ───────── Guru ─────────

export async function listMyClasses(teacherUid: string): Promise<ClassInfo[]> {
  const snap = await getDocs(query(collection(getDb(), 'classes'), where('teacherUid', '==', teacherUid)));
  return snap.docs.map((d) => toClass(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name, 'id', { numeric: true }));
}

/** Kelas dan kode ditulis dalam satu batch (Rules memeriksa keduanya bersama). Mengulang bila kode bentrok. */
export async function createClass(teacherUid: string, name: string, grade: Grade): Promise<void> {
  const db = getDb();
  let lastError: unknown;
  for (let i = 0; i < 4; i++) {
    const code = makeCode();
    const ref = doc(collection(db, 'classes'));
    const batch = writeBatch(db);
    batch.set(ref, { name: name.trim(), grade, teacherUid, joinCode: code, archived: false, createdAt: serverTimestamp() });
    batch.set(doc(db, 'class_codes', code), { classId: ref.id, teacherUid });
    try {
      await batch.commit();
      return;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function updateClass(id: string, patch: { name?: string; grade?: Grade; archived?: boolean }): Promise<void> {
  const clean: { name?: string; grade?: Grade; archived?: boolean } = { ...patch };
  if (typeof patch.name === 'string') clean.name = patch.name.trim();
  await updateDoc(doc(getDb(), 'classes', id), clean);
}

export async function listMembers(classId: string): Promise<MemberRow[]> {
  const snap = await getDocs(query(collection(getDb(), 'class_members'), where('classId', '==', classId)));
  return snap.docs
    .map((d): MemberRow => {
      const x = d.data();
      return {
        uid: typeof x.uid === 'string' ? x.uid : d.id,
        displayName: typeof x.displayName === 'string' ? x.displayName : 'Siswa',
        status: (x.status as MemberStatus) ?? 'pending',
        groupId: typeof x.groupId === 'string' ? x.groupId : undefined,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'id'));
}

export async function setMemberStatus(classId: string, uid: string, status: 'active' | 'removed'): Promise<void> {
  await updateDoc(doc(getDb(), 'class_members', `${classId}_${uid}`), { status });
}

/**
 * Keluarkan/tolak murid = hapus fisik: hasil dan jawaban kuisnya di kelas ini ikut dihapus, dokumen anggota paling akhir.
 * Murid bisa mendaftar lagi dengan kode (tetap perlu disetujui guru).
 */
export async function removeMember(classId: string, uid: string): Promise<void> {
  const db = getDb();
  for (const sub of ['results', 'quiz_answers'] as const) {
    const snap = await getDocs(query(collection(db, 'classes', classId, sub), where('uid', '==', uid)));
    await deleteRefs(snap.docs.map((d) => d.ref));
  }
  await deleteRefs([doc(db, 'class_members', `${classId}_${uid}`)]);
}

export async function listResults(classId: string): Promise<ResultRow[]> {
  const snap = await getDocs(collection(getDb(), 'classes', classId, 'results'));
  const rows: ResultRow[] = [];
  snap.forEach((d) => {
    const x = d.data();
    if (typeof x.uid === 'string' && typeof x.quizId === 'string' && typeof x.score === 'number') {
      rows.push({ uid: x.uid, quizId: x.quizId, score: x.score, correct: Number(x.correct) || 0, total: Number(x.total) || 0 });
    }
  });
  return rows;
}

// ───────── Siswa ─────────

export async function joinClass(uid: string, displayName: string, rawCode: string): Promise<void> {
  const code = normalizeCode(rawCode);
  if (code.length !== 6) throw new Error('KODE_FORMAT');
  const db = getDb();
  const c = await getDoc(doc(db, 'class_codes', code));
  if (!c.exists() || typeof c.data().classId !== 'string') throw new Error('KODE_TIDAK_ADA');
  const classId = c.data().classId as string;
  await setDoc(doc(db, 'class_members', `${classId}_${uid}`), {
    classId, uid, code, status: 'pending', joinedAt: serverTimestamp(), displayName: displayName.slice(0, 30) || 'Siswa',
  });
}

export async function myMemberships(uid: string): Promise<MyMembership[]> {
  const db = getDb();
  const snap = await getDocs(query(collection(db, 'class_members'), where('uid', '==', uid)));
  return Promise.all(
    snap.docs.map(async (d): Promise<MyMembership> => {
      const classId = d.data().classId as string;
      const status = d.data().status as MemberStatus;
      if (status !== 'active') return { classId, status };
      const cls = await getDoc(doc(db, 'classes', classId)).catch(() => null);
      return { classId, status, className: cls?.exists() ? toClass(cls.id, cls.data()).name : undefined };
    }),
  );
}

// ───────── Orang tua ─────────

export async function loadChildProgress(child: ChildSummary): Promise<ChildProgress> {
  const db = getDb();
  const [prog, items] = await Promise.all([
    getDoc(doc(db, 'learning_progress', child.uid)),
    getDocs(collection(db, 'learning_progress', child.uid, 'items')),
  ]);
  const list: ChildItem[] = [];
  items.forEach((d) => {
    const x = d.data();
    if (typeof x.bestScore !== 'number') return;
    list.push({
      contentId: d.id,
      bestScore: x.bestScore,
      attempts: typeof x.attempts === 'number' ? x.attempts : 1,
      lastPlayedAt: x.lastPlayedAt && typeof x.lastPlayedAt.toDate === 'function' ? x.lastPlayedAt.toDate() : null,
    });
  });
  return { child, xp: prog.exists() && typeof prog.data().xp === 'number' ? prog.data().xp : 0, items: list };
}

// ───────── Misi kelas ─────────

export async function listMissions(classId: string): Promise<Mission[]> {
  const snap = await getDocs(collection(getDb(), 'classes', classId, 'quizzes'));
  return snap.docs
    .map((d) => {
      const x = d.data();
      const t = x.createdAt && typeof x.createdAt.toMillis === 'function' ? (x.createdAt.toMillis() as number) : 0;
      return {
        t,
        m: {
          id: d.id,
          kind: x.kind === 'game' ? 'game' : 'quiz',
          contentId: typeof x.contentId === 'string' ? x.contentId : '',
          title: typeof x.title === 'string' ? x.title : 'Misi',
          note: typeof x.note === 'string' ? x.note : '',
        } as Mission,
      };
    })
    .filter((r) => r.m.contentId)
    .sort((a, b) => b.t - a.t)
    .map((r) => r.m);
}

export async function addMission(classId: string, m: Omit<Mission, 'id'>): Promise<void> {
  await setDoc(doc(collection(getDb(), 'classes', classId, 'quizzes')), {
    title: m.title.slice(0, 100),
    kind: m.kind,
    contentId: m.contentId,
    note: m.note.trim().slice(0, 200),
    createdAt: serverTimestamp(),
  });
}

/** Hapus dokumen bertahap (batas Firestore 500 per batch). Mengembalikan jumlah yang dihapus. */
async function deleteRefs(refs: DocumentReference[]): Promise<number> {
  const db = getDb();
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  return refs.length;
}

/** Hapus misi beserta hasil murid untuk misi itu (supaya data tidak menumpuk). */
export async function deleteMission(classId: string, m: Pick<Mission, 'id' | 'kind' | 'contentId'>): Promise<void> {
  const db = getDb();
  const res = await getDocs(query(collection(db, 'classes', classId, 'results'), where('quizId', '==', resultKeyOf(m))));
  await deleteRefs([...res.docs.map((d) => d.ref), doc(db, 'classes', classId, 'quizzes', m.id)]);
}

/**
 * Hapus hasil yang tidak lagi dipakai: hasil dari kuis/game yang bukan misi kelas sekarang dan bukan nilai kuis guru yang
 * masih ada. Mengembalikan jumlah dokumen yang dihapus.
 */
export async function pruneClassResults(classId: string): Promise<number> {
  const db = getDb();
  const [missions, tq, results] = await Promise.all([
    listMissions(classId),
    getDocs(collection(db, 'classes', classId, 'teacher_quizzes')),
    getDocs(collection(db, 'classes', classId, 'results')),
  ]);
  const keep = new Set<string>([...missions.map(resultKeyOf), ...tq.docs.map((d) => `tq_${d.id}`)]);
  const stale = results.docs.filter((d) => !keep.has(String(d.data().quizId))).map((d) => d.ref);
  return deleteRefs(stale);
}

/** Kelas langsung memakai Realtime Database sementara; bersihkan sisanya sebisa mungkin (galat diabaikan). */
const LIVE_NODES = ['roster', 'state', 'question', 'groups', 'teams', 'meta'] as const;
async function clearLiveClass(classId: string): Promise<void> {
  try {
    const [{ ref, remove }, { getRtdb }] = await Promise.all([import('firebase/database'), import('./rtdb')]);
    const rtdb = getRtdb();
    for (const node of LIVE_NODES) await remove(ref(rtdb, `class_live/${classId}/${node}`)).catch(() => undefined);
  } catch {
    /* RTDB tidak dikonfigurasi atau ditolak: tidak apa-apa, datanya sementara */
  }
}

/**
 * Hapus kelas sepenuhnya: misi, kuis guru + kuncinya, jawaban, hasil, anggota, kode gabung, dan sisa kelas langsung.
 * Urutan penting: Rules memeriksa dokumen kelas, jadi dokumen kelas dihapus PALING AKHIR.
 */
export async function deleteClassCascade(c: { id: string; joinCode: string }): Promise<void> {
  const db = getDb();
  for (const sub of ['quizzes', 'quiz_keys', 'teacher_quizzes', 'quiz_answers', 'results'] as const) {
    const snap = await getDocs(collection(db, 'classes', c.id, sub));
    await deleteRefs(snap.docs.map((d) => d.ref));
  }
  const members = await getDocs(query(collection(db, 'class_members'), where('classId', '==', c.id)));
  await deleteRefs(members.docs.map((d) => d.ref));
  await clearLiveClass(c.id);
  await deleteRefs([doc(db, 'class_codes', c.joinCode), doc(db, 'classes', c.id)]);
}

// ───────── Kelas milik siswa ─────────

export async function getClassForMember(classId: string): Promise<ClassInfo | null> {
  const d = await getDoc(doc(getDb(), 'classes', classId));
  return d.exists() ? toClass(d.id, d.data()) : null;
}

/** Hasil milik siswa sendiri di satu kelas (kunci hasil -> skor). */
export async function myClassResults(classId: string, uid: string): Promise<Record<string, number>> {
  const snap = await getDocs(query(collection(getDb(), 'classes', classId, 'results'), where('uid', '==', uid)));
  const out: Record<string, number> = {};
  snap.forEach((d) => {
    const x = d.data();
    if (typeof x.quizId === 'string' && typeof x.score === 'number') out[x.quizId] = x.score;
  });
  return out;
}
