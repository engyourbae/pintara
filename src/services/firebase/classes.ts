import {
  collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
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
