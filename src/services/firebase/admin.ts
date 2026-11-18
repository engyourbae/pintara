import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from './client';

/**
 * Layanan admin. Hak admin berasal dari dokumen Firestore `admins/{uid}` atau `admins/{email}`
 * (dibuat manual di Console) dan ditegakkan Security Rules; pengecekan di sini hanya agar tampilan tepat.
 */

export type TeacherState = 'pending' | 'approved' | 'rejected';

export interface TeacherRow {
  uid: string;
  displayName: string;
  state: TeacherState;
  createdAt: Date | null;
}

export async function isAdmin(uid: string): Promise<boolean> {
  const db = getDb();
  if ((await getDoc(doc(db, 'admins', uid))).exists()) return true;
  const email = getFirebaseAuth().currentUser?.email?.toLowerCase();
  return email ? (await getDoc(doc(db, 'admins', email))).exists() : false;
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

/** Hanya Firestore. Node RTDB `verified_teachers` baru diperlukan saat kelas langsung dibangun. */
export async function setTeacherState(uid: string, state: TeacherState): Promise<void> {
  await updateDoc(doc(getDb(), 'users', uid), {
    teacherVerified: state === 'approved',
    teacherRejected: state === 'rejected',
  });
}
