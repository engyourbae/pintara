import { deleteApp, FirebaseError, initializeApp, type FirebaseApp } from 'firebase/app';
import { deleteUser, inMemoryPersistence, initializeAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { get, getDatabase, ref, remove } from 'firebase/database';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
  writeBatch,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import { checkLock, formatWait, recordFailure, recordServerThrottle, recordSuccess } from '@/utils/loginGuard';
import { firebaseOptions } from './config';
import { getDb } from './client';
import { currentUid, PIN_RE, UserFacingError, usernameToEmail } from './auth';

/**
 * Hapus akun anak oleh orang tua (F30a-1). Dua jalur:
 *  - DENGAN PIN: semua data anak dihapus, termasuk akun masuknya (Firebase Auth) lewat sesi anak di instance terpisah.
 *  - LUPA PIN: hanya data yang boleh dihapus orang tua (lihat firebase.rules). Akun Auth anak TIDAK bisa dihapus tanpa
 *    Admin SDK, jadi tetap ada (yatim) dan nama penggunanya tetap terpakai. Sisa pertemanan anak tidak ikut terhapus.
 * Semua langkah idempoten: bila terputus, ulangi dari awal. Urutan penting: dokumen `users/{anak}` DIHAPUS PALING AKHIR
 * di sisi orang tua, karena Rules membaca dokumen itu (parentUid) untuk mengizinkan penghapusan data lain milik anak.
 */

export interface ChildTarget {
  uid: string;
  username: string;
}

export interface DeleteResult {
  /** True bila akun masuk (Firebase Auth) anak ikut terhapus. */
  authDeleted: boolean;
}

const CREDENTIAL_ERRORS = new Set(['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials']);

async function deleteRefs(db: Firestore, refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

/** Hapus satu per satu; dokumen yang ditolak Rules (bukan milik penghapus) dilewati, galat lain tetap dilempar. */
async function deleteEach(refs: DocumentReference[]): Promise<void> {
  for (const r of refs) {
    try {
      await deleteDoc(r);
    } catch (e) {
      if (!(e instanceof FirebaseError && e.code === 'permission-denied')) throw e;
    }
  }
}

const idsOf = async (db: Firestore, path: string, field: string, value: string) =>
  (await getDocs(query(collection(db, path), where(field, '==', value)))).docs.map((d) => d.ref);

/** Sisi anak (sesi anak): permintaan teman, pertemanan, blokir, undangan, dan simpul Realtime Database miliknya. */
async function cleanChildSide(db2: Firestore, rtdbApp: FirebaseApp, uid: string): Promise<void> {
  const [reqFrom, reqTo, friendships, blocked, invFrom, invTo] = await Promise.all([
    idsOf(db2, 'friend_requests', 'fromUid', uid),
    idsOf(db2, 'friend_requests', 'toUid', uid),
    (async () => (await getDocs(query(collection(db2, 'friendships'), where('uids', 'array-contains', uid)))).docs.map((d) => d.ref))(),
    idsOf(db2, 'blocked_users', 'blockerUid', uid),
    idsOf(db2, 'game_invitations', 'fromUid', uid),
    idsOf(db2, 'game_invitations', 'toUid', uid),
  ]);
  await deleteRefs(db2, [...friendships, ...blocked]);
  // Bisa ditolak untuk sebagian (mis. permintaan berstatus declined milik pengirim): dilewati.
  await deleteEach([...reqFrom, ...reqTo, ...invFrom, ...invTo]);

  // Realtime Database: sebisanya (ruang duel yang ditinggalkan dan cermin teman/blokir/kehadiran/notifikasi).
  try {
    const rtdb = getDatabase(rtdbApp);
    const room = (await get(ref(rtdb, `duel_active/${uid}`))).val();
    if (typeof room === 'string') await remove(ref(rtdb, `rooms/${room}`)).catch(() => undefined);
    await Promise.all(['duel_active', 'friends', 'blocked', 'presence', 'notifications'].map((n) => remove(ref(rtdb, `${n}/${uid}`)).catch(() => undefined)));
  } catch {
    /* RTDB tidak tersedia: lewati. Sisanya kecil dan tidak berisi data pribadi. */
  }
}

/** Sisi orang tua: data anak yang diizinkan Rules untuk dihapus orang tua. Dokumen `users/{anak}` paling akhir. */
async function cleanParentSide(db: Firestore, uid: string, onStep: (s: string) => void): Promise<void> {
  const userRef = doc(db, 'users', uid);
  // Tanpa dokumen users, Rules tidak bisa mengenali orang tua: berarti langkah ini sudah pernah selesai.
  if (!(await getDoc(userRef)).exists()) return;

  onStep('Menghapus data kelas…');
  const members = await getDocs(query(collection(db, 'class_members'), where('uid', '==', uid)));
  for (const m of members.docs) {
    const classId = m.data().classId;
    if (typeof classId !== 'string') continue;
    for (const sub of ['results', 'quiz_answers']) {
      await deleteRefs(db, await idsOf(db, `classes/${classId}/${sub}`, 'uid', uid));
    }
  }
  await deleteRefs(db, members.docs.map((d) => d.ref));

  onStep('Menghapus riwayat dan progres…');
  await deleteRefs(db, await idsOf(db, 'game_sessions', 'uid', uid));
  for (const sub of ['items', 'snapshot', 'badges']) {
    const snap = await getDocs(collection(db, 'learning_progress', uid, sub));
    await deleteRefs(db, snap.docs.map((d) => d.ref));
  }
  await deleteDoc(doc(db, 'learning_progress', uid));

  onStep('Menghapus nama pengguna dan profil…');
  const profile = await getDoc(doc(db, 'user_profiles', uid));
  const name = profile.exists() && typeof profile.data().username === 'string' ? (profile.data().username as string) : '';
  if (name) {
    const un = await getDoc(doc(db, 'usernames', name));
    if (un.exists() && un.data().uid === uid) await deleteDoc(un.ref);
  }
  await deleteDoc(doc(db, 'user_profiles', uid));
  await deleteDoc(userRef); // PALING AKHIR
}

/**
 * Hapus akun anak. `pin` diisi = jalur lengkap; `pin` null = jalur "lupa PIN" (akun masuk anak tetap ada).
 * Hanya dipanggil dari layar orang tua; izin sebenarnya ditegakkan Security Rules.
 */
export async function deleteChildAccount(
  child: ChildTarget,
  pin: string | null,
  onStep: (s: string) => void = () => undefined,
): Promise<DeleteResult> {
  const parentUid = currentUid();
  if (!parentUid) throw new UserFacingError('Sesi berakhir. Silakan masuk lagi.');
  const db = getDb();

  if (pin === null) {
    await cleanParentSide(db, child.uid, onStep);
    await deleteDoc(doc(db, 'parent_accounts', parentUid, 'children', child.uid));
    return { authDeleted: false };
  }

  if (!PIN_RE.test(pin)) throw new UserFacingError('PIN harus 6 angka.');
  if (!child.username) throw new UserFacingError('Nama pengguna anak tidak diketahui, jadi PIN tidak bisa dicoba. Pakai "Lupa PIN".');
  const lock = checkLock(child.username);
  if (lock.locked) throw new UserFacingError(`Terlalu banyak PIN salah. Coba lagi dalam ${formatWait(lock.remainingMs)} atau pakai "Lupa PIN".`);

  // Instance Firebase terpisah agar sesi orang tua tidak tergantikan.
  const app2 = initializeApp(firebaseOptions, `hapus-anak-${Date.now()}`);
  const auth2 = initializeAuth(app2, { persistence: inMemoryPersistence });
  const db2 = getFirestore(app2);
  try {
    onStep('Memeriksa PIN…');
    try {
      await signInWithEmailAndPassword(auth2, usernameToEmail(child.username), pin);
    } catch (e) {
      if (e instanceof FirebaseError) {
        if (CREDENTIAL_ERRORS.has(e.code)) {
          const s = recordFailure(child.username);
          throw new UserFacingError(s.locked ? `PIN salah. Coba lagi dalam ${formatWait(s.remainingMs)}.` : 'PIN salah. Periksa lagi, atau pakai "Lupa PIN".');
        }
        if (e.code === 'auth/too-many-requests') {
          throw new UserFacingError(`Terlalu banyak percobaan. Coba lagi dalam ${formatWait(recordServerThrottle(child.username).remainingMs)}.`);
        }
      }
      throw e;
    }
    recordSuccess(child.username);
    const me = auth2.currentUser;
    if (!me || me.uid !== child.uid) throw new UserFacingError('Akun yang cocok dengan PIN ini bukan akun anak tersebut. Tidak ada yang dihapus.');

    onStep('Menghapus pertemanan…');
    await cleanChildSide(db2, app2, child.uid);
    await cleanParentSide(db, child.uid, onStep);

    onStep('Menghapus akun masuk…');
    await deleteUser(me);
    await deleteDoc(doc(db, 'parent_accounts', parentUid, 'children', child.uid));
    return { authDeleted: true };
  } finally {
    await signOut(auth2).catch(() => undefined);
    await deleteApp(app2).catch(() => undefined);
  }
}
