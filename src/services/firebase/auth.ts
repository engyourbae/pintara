import { checkLock, checkResetCooldown, formatWait, recordFailure, recordResetRequest, recordServerThrottle, recordSuccess } from '@/utils/loginGuard';
import { deleteApp, FirebaseError, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
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
import { passwordOk } from '@/utils/password';

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
      case 'auth/popup-blocked':
        return 'Jendela masuk Google diblokir peramban. Izinkan pop-up untuk situs ini lalu coba lagi.';
      case 'auth/unauthorized-domain':
        return 'Alamat situs ini belum diizinkan untuk masuk dengan Google. Tambahkan di Firebase Console > Authentication > Settings > Authorized domains.';
      case 'auth/account-exists-with-different-credential':
        return 'Email ini sudah terdaftar dengan cara masuk lain. Masuk dengan email dan sandi.';
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

const CREDENTIAL_ERRORS = new Set(['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials']);
const lockedMessage = (ms: number) => `Terlalu banyak percobaan salah. Demi keamanan, coba lagi dalam ${formatWait(ms)}.`;

/**
 * "Lupa sandi" untuk akun email (orang tua, guru, admin): Firebase mengirim email berisi TAUTAN untuk membuat sandi baru
 * (bukan kode OTP). Murid memakai nama pengguna tanpa email sungguhan, jadi tidak bisa memakai jalur ini. Selalu tampak
 * berhasil bila email tidak terdaftar (tidak membocorkan siapa yang punya akun). Ada jeda bertingkat per email dan per perangkat.
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith(`@${CHILD_EMAIL_DOMAIN}`)) {
    throw new UserFacingError('Isi alamat email yang valid. Murid masuk dengan nama pengguna dan PIN, bukan email.');
  }
  const wait = checkResetCooldown(email);
  if (wait.locked) throw new UserFacingError(`Tautan reset baru saja diminta. Coba lagi dalam ${formatWait(wait.remainingMs)}.`);
  const auth = getFirebaseAuth();
  auth.languageCode = 'id';
  // Jeda hanya dicatat bila Firebase benar-benar memproses permintaan (bukan saat gagal karena tidak ada internet).
  try {
    await sendPasswordResetEmail(auth, email);
    recordResetRequest(email);
  } catch (e) {
    if (e instanceof FirebaseError) {
      if (e.code === 'auth/user-not-found') {
        recordResetRequest(email);
        return;
      }
      if (e.code === 'auth/too-many-requests') {
        recordResetRequest(email);
        throw new UserFacingError('Terlalu banyak permintaan. Coba lagi nanti.');
      }
    }
    throw e;
  }
}

/**
 * Masuk dengan sandi/PIN. Dijaga jeda bertingkat bila salah berulang (lihat utils/loginGuard.ts untuk aturan dan
 * batasnya: perlindungan sisi klien, pembatasan server tetap oleh Firebase Auth).
 */
export async function signInWithIdentifier(identifier: string, secret: string): Promise<void> {
  const lock = checkLock(identifier);
  if (lock.locked) throw new UserFacingError(lockedMessage(lock.remainingMs));
  try {
    await signInWithEmailAndPassword(getFirebaseAuth(), identifierToEmail(identifier), secret);
    recordSuccess(identifier);
  } catch (e) {
    if (e instanceof FirebaseError) {
      if (CREDENTIAL_ERRORS.has(e.code)) {
        const s = recordFailure(identifier);
        if (s.locked) throw new UserFacingError(`Nama pengguna/email atau sandi salah. ${lockedMessage(s.remainingMs)}`);
      } else if (e.code === 'auth/too-many-requests') {
        throw new UserFacingError(lockedMessage(recordServerThrottle(identifier).remainingMs));
      }
    }
    throw e;
  }
}

/**
 * Ubah sandi akun yang sedang masuk (orang tua/guru: sandi; anak: PIN 6 angka).
 * Wajib memasukkan sandi lama (masuk ulang), lalu Firebase Auth menimpa sandi itu: tidak ada sandi lama yang tersisa.
 * Akun Google tidak punya sandi di sini. Jeda percobaan salah memakai loginGuard (per email Auth).
 */
export async function changePassword(oldSecret: string, newSecret: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const email = user?.email;
  if (!user || !email) throw new UserFacingError('Kamu belum masuk.');
  if (!user.providerData.some((p) => p.providerId === 'password')) {
    throw new UserFacingError('Akun ini masuk dengan Google, jadi tidak punya sandi di PINTARA. Atur lewat akun Google-mu.');
  }
  const isChild = email.endsWith('@' + CHILD_EMAIL_DOMAIN);
  if (isChild ? !PIN_RE.test(newSecret) : !passwordOk(newSecret)) {
    throw new UserFacingError(isChild ? 'PIN baru harus 6 angka.' : 'Sandi baru belum memenuhi semua syarat.');
  }
  if (newSecret === oldSecret) throw new UserFacingError('Sandi baru harus berbeda dari yang lama.');
  const lock = checkLock(email);
  if (lock.locked) throw new UserFacingError(lockedMessage(lock.remainingMs));
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, oldSecret));
  } catch (e) {
    if (e instanceof FirebaseError) {
      if (CREDENTIAL_ERRORS.has(e.code)) {
        const s = recordFailure(email);
        throw new UserFacingError(s.locked ? `Sandi lama salah. ${lockedMessage(s.remainingMs)}` : 'Sandi lama salah.');
      }
      if (e.code === 'auth/too-many-requests') throw new UserFacingError(lockedMessage(recordServerThrottle(email).remainingMs));
    }
    throw e;
  }
  recordSuccess(email);
  await updatePassword(user, newSecret);
}

/**
 * Masuk dengan akun Google (tanpa sandi). Bila akun belum punya profil, profil dibuat otomatis
 * dengan peran `newRole` (orang tua, atau guru yang masih harus diverifikasi pengelola).
 * Peran akun yang sudah ada tidak pernah diubah. Mengembalikan false bila pengguna menutup jendela Google.
 */
export async function signInWithGoogle(newRole: 'parent' | 'teacher'): Promise<boolean> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  let uid: string;
  let rawName: string;
  try {
    const cred = await signInWithPopup(auth, provider);
    uid = cred.user.uid;
    rawName = (cred.user.displayName || cred.user.email?.split('@')[0] || '').trim();
  } catch (e) {
    if (e instanceof FirebaseError && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return false;
    throw e;
  }
  const db = getDb();
  try {
    if ((await getDoc(doc(db, 'users', uid))).exists()) return true;
    const displayName = (rawName || (newRole === 'teacher' ? 'Guru' : 'Orang tua')).slice(0, 30);
    await setDoc(doc(db, 'users', uid), { role: newRole, displayName, teacherVerified: false, createdAt: serverTimestamp() });
    if (newRole === 'parent') await setDoc(doc(db, 'parent_accounts', uid), { createdAt: serverTimestamp() });
  } catch (e) {
    await signOut(auth).catch(() => undefined);
    throw e;
  }
  return true;
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
    teacherRejected: d.teacherRejected === true,
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
  if (!passwordOk(input.password)) {
    throw new UserFacingError('Sandi harus 8+ karakter dengan huruf besar, huruf kecil, angka, dan simbol.');
  }

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
