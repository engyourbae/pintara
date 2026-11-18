import { ref, remove, set } from 'firebase/database';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getDb, getRtdb } from './client';
import { UserFacingError } from './auth';

/**
 * Layanan admin. Hak admin berasal dari dokumen `admins/{uid}` (dibuat manual di Console) dan
 * ditegakkan Security Rules; pengecekan di sini hanya agar tampilan tepat.
 */

export type TeacherState = 'pending' | 'approved' | 'rejected';

export interface TeacherRow {
  uid: string;
  displayName: string;
  state: TeacherState;
  createdAt: Date | null;
}

export async function isAdmin(uid: string): Promise<boolean> {
  return (await getDoc(doc(getDb(), 'admins', uid))).exists();
}

export async function listTeachers(): Promise<TeacherRow[]> {
  const snap = await getDocs(query(collection(getDb(), 'users'), where('role', '==', 'teacher')));
  return snap.docs
    .map((d): TeacherRow => {
      const x = d.data();
      const ts = x.createdAt;
      return {
        uid: d.id,
        displayName: typeof x.displayName === 'string' ? x.displayName : '(tanpa nama)',
        state: x.teacherVerified === true ? 'approved' : x.teacherRejected === true ? 'rejected' : 'pending',
        createdAt: ts && typeof ts.toDate === 'function' ? (ts.toDate() as Date) : null,
      };
    })
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

/** Firestore dulu (sumber kebenaran), lalu Realtime Database (dipakai rules kelas langsung). */
export async function setTeacherState(uid: string, state: 'approved' | 'rejected' | 'pending'): Promise<void> {
  await updateDoc(doc(getDb(), 'users', uid), {
    teacherVerified: state === 'approved',
    teacherRejected: state === 'rejected',
  });
  try {
    const node = ref(getRtdb(), `verified_teachers/${uid}`);
    if (state === 'approved') await set(node, true);
    else await remove(node);
  } catch {
    throw new UserFacingError(
      'Status tersimpan di Firestore, tetapi gagal menulis Realtime Database. Periksa rules Realtime Database (node verified_teachers) lalu coba lagi.',
    );
  }
}
