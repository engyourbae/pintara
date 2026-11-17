import { deleteApp, FirebaseError, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { firebaseOptions } from './config';
import { getDb, getFirebaseAuth } from './client';
import type { AppUser, ChildSummary, Grade } from '@/types';

/**
 * Layanan akun. Urutan penulisan MENGIKUTI aturan di firebase/firebase.rules
 * (lihat docs/keamanan.md, bagian "Urutan penulisan yang diwajibkan rules").
 */

/** Domain email sintetis untuk akun anak. Hanya dipakai internal; anak tidak punya email asli. */
export const CHILD_EMAIL_DOMAIN = 'anak.pintara.invalid';
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const PIN_RE = /^\d{6}$/;

/** Galat yang pesannya aman ditampilkan langsung ke pengguna. */
export class UserFacingError extends Error {}

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${CHILD_EMAIL_DOMAIN}`;
}

/** Orang dewasa masuk dengan email; anak dengan nama pengguna. */
export function identifierToEmail(identifier: string): string {
  const v = identifier.trim().toLowerCase();
  return v.includes('@') ? v : usernameToEmail(v);
}

/** Nama pengguna acak bawaan (mis. pnt_k7q2x9) agar tidak mudah ditebak. */
export function randomUsername(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return 'pnt_' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** Ubah galat Firebase menjadi kalimat Indonesia yang ramah. */
export function friendlyError(e: unknown): string {
  if (e instanceof UserFacingError) return e.message;
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Nama pengguna/email atau sandi salah.';
      case 'auth/email-already-in-use':
        return 'Email ini sudah terdaftar. Coba masuk.';
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/weak-password':
        return 'Sandi terlalu lemah.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
      case 'auth/network-request-failed':
      case 'unavailable':
        return 'Tidak ada koneksi internet. Coba lagi saat online.';
      case 'auth/operation-not-allowed':
        return 'Masuk dengan email/sandi belum diaktifkan di Firebase Console (Authentication > Sign-in method).';
      case 'permission-denied':
        return 'Ditolak oleh aturan keamanan data. Pastikan rules terbaru sudah di-publish.';
      default:
        return `Terjadi kesalahan (${e.code}).`;
    }
  }
  return 'Terjadi kesalahan. Coba lagi.';
}

// ───────────────────────── Sesi ─────────────────────────

export function watchAuth(cb: (uid: string | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), (u) => cb(u ? u.uid : null));
}

export function currentUid(): string | null {
  return getFirebaseAuth().currentUser?.uid ?? null;
}

export async function signInWithIdentifier(identifier: string, secret: string): Promise<void> {
  await signInWithEmailAndPassword(getFirebaseAuth(), identifierToEmail(identifier), secret);
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

function toGrade(v: unknown): Grade | undefined {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 6 ? (v as Grade) : undefined;
}

/** Baca profil akun. Null bila dokumen `users/{uid}` belum ada (mis. pendaftaran terputus). */
export async function fetchAppUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(getDb(), 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  const role = d.role;
  if (role !== 'student' && role !== 'parent' && role !== 'teacher') return null;
  return {
    uid,
    role,
    displayName: typeof d.displayName === 'string' ? d.displayName : '',
    teacherVerified: d.teacherVerified === true,
    parentUid: typeof d.parentUid === 'string' ? d.parentUid : undefined,
    grade: toGrade(d.grade),
  };
}

// ───────────────────────── Pendaftaran orang tua / guru ─────────────────────────

export interface AdultSignup {
  role: 'parent' | 'teacher';
  displayName: string;
  email: string;
  password: string;
}

export async function registerAdult(input: AdultSignup): Promise<void> {
  const displayName = input.displayName.trim();
  if (displayName.length < 1 || displayName.length > 30) {
    throw new UserFacingError('Nama harus 1–30 karakter.');
  }
  if (input.password.length < 8) throw new UserFacingError('Sandi minimal 8 karakter.');

  const auth = getFirebaseAuth();
  const db = getDb();
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim().toLowerCase(), input.password);
  const uid = cred.user.uid;
  try {
    // users/{uid} dulu; dokumen lain mensyaratkan ini sudah ada.
    await setDoc(doc(db, 'users', uid), {
      role: input.role,
      displayName,
      teacherVerified: false,
      createdAt: serverTimestamp(),
    });
    if (input.role === 'parent') {
      await setDoc(doc(db, 'parent_accounts', uid), { createdAt: serverTimestamp() });
    }
  } catch (e) {
    // Jangan tinggalkan akun Auth yatim tanpa profil.
    await deleteUser(cred.user).catch(() => undefined);
    throw e;
  }
}

// ───────────────────────── Akun anak (dibuat orang tua) ─────────────────────────

export interface ChildSignup {
  displayName: string;
  username: string;
  pin: string;
  grade?: Grade;
}

export async function createChildAccount(input: ChildSignup): Promise<{ uid: string; username: string }> {
  const parentUid = currentUid();
  if (!parentUid) throw new UserFacingError('Sesi berakhir. Silakan masuk lagi.');

  const displayName = input.displayName.trim();
  const username = input.username.trim().toLowerCase();
  if (displayName.length < 1 || displayName.length > 30) throw new UserFacingError('Nama panggilan harus 1–30 karakter.');
  if (!USERNAME_RE.test(username)) {
    throw new UserFacingError('Nama pengguna 3–20 karakter: huruf kecil, angka, atau garis bawah.');
  }
  if (!PIN_RE.test(input.pin)) throw new UserFacingError('PIN harus 6 angka.');

  const db = getDb();
  // Cek awal (bukan jaminan; rules tetap menolak bila bentrok).
  if ((await getDoc(doc(db, 'usernames', username))).exists()) {
    throw new UserFacingError('Nama pengguna sudah dipakai. Coba yang lain.');
  }

  // Instance Firebase terpisah agar sesi orang tua tidak tergantikan oleh sesi anak.
  const app2 = initializeApp(firebaseOptions, `buat-anak-${Date.now()}`);
  const auth2 = initializeAuth(app2, { persistence: inMemoryPersistence });
  const db2 = getFirestore(app2);
  let child: User | null = null;
  const childRef = (uid: string) => doc(db, 'parent_accounts', parentUid, 'children', uid);

  try {
    try {
      child = (await createUserWithEmailAndPassword(auth2, usernameToEmail(username), input.pin)).user;
    } catch (e) {
      if (e instanceof FirebaseError && e.code === 'auth/email-already-in-use') {
        throw new UserFacingError('Nama pengguna sudah dipakai. Coba yang lain.');
      }
      throw e;
    }
    const uid = child.uid;

    // (a) orang tua mencatat anak beserta izinnya (default: pertemanan & multiplayer MATI).
    await setDoc(childRef(uid), {
      displayName,
      friendsEnabled: false,
      multiplayerEnabled: false,
      dailyLimitMinutes: 60,
    });

    // (b) akun anak membuat dokumen users miliknya (rules memeriksa (a) sudah ada).
    await setDoc(doc(db2, 'users', uid), {
      role: 'student',
      displayName,
      teacherVerified: false,
      createdAt: serverTimestamp(),
      parentUid,
      ...(input.grade ? { grade: input.grade } : {}),
    });

    // (c) nama pengguna unik + profil publik minimal, satu batch.
    const batch = writeBatch(db2);
    batch.set(doc(db2, 'usernames', username), { uid, createdAt: serverTimestamp() });
    batch.set(doc(db2, 'user_profiles', uid), { username, avatarId: 'bintang' });
    await batch.commit();

    return { uid, username };
  } catch (e) {
    // Pembersihan sebisanya. Urutan: dokumen dulu, akun Auth terakhir (setelah itu izin hilang).
    if (child) {
      const uid = child.uid;
      await deleteDoc(doc(db2, 'user_profiles', uid)).catch(() => undefined);
      await deleteDoc(doc(db2, 'usernames', username)).catch(() => undefined);
      await deleteDoc(doc(db2, 'users', uid)).catch(() => undefined);
      await deleteDoc(childRef(uid)).catch(() => undefined);
      await deleteUser(child).catch(() => undefined);
    }
    throw e;
  } finally {
    await signOut(auth2).catch(() => undefined);
    await deleteApp(app2).catch(() => undefined);
  }
}

// ───────────────────────── Daftar & izin anak ─────────────────────────

export async function listChildren(parentUid: string): Promise<ChildSummary[]> {
  const db = getDb();
  const snap = await getDocs(collection(db, 'parent_accounts', parentUid, 'children'));
  const rows = await Promise.all(
    snap.docs.map(async (c): Promise<ChildSummary> => {
      const d = c.data();
      const profile = await getDoc(doc(db, 'user_profiles', c.id)).catch(() => null);
      const username = profile?.exists() && typeof profile.data().username === 'string' ? (profile.data().username as string) : '';
      return {
        uid: c.id,
        displayName: typeof d.displayName === 'string' ? d.displayName : 'Anak',
        username,
        friendsEnabled: d.friendsEnabled === true,
        multiplayerEnabled: d.multiplayerEnabled === true,
        dailyLimitMinutes: typeof d.dailyLimitMinutes === 'number' ? d.dailyLimitMinutes : 60,
      };
    }),
  );
  return rows.sort((a, b) => a.displayName.localeCompare(b.displayName, 'id'));
}

/** Rules mewajibkan seluruh field izin ditulis ulang bersama (bukan patch sebagian). */
export async function saveChildSettings(parentUid: string, c: ChildSummary): Promise<void> {
  await setDoc(doc(getDb(), 'parent_accounts', parentUid, 'children', c.uid), {
    displayName: c.displayName,
    friendsEnabled: c.friendsEnabled,
    multiplayerEnabled: c.multiplayerEnabled,
    dailyLimitMinutes: c.dailyLimitMinutes,
  });
}
