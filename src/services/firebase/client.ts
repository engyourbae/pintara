import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { firebaseOptions, isFirebaseConfigured } from './config';

/**
 * Inisialisasi lazy. Mode tamu & game single player TIDAK boleh memanggil ini,
 * sehingga aplikasi tetap berjalan tanpa Firebase (offline-first).
 */
export function requireApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase belum dikonfigurasi. Isi .env.local (lihat .env.example).');
  }
  return getApps().length ? getApp() : initializeApp(firebaseOptions);
}

export const getFirebaseAuth = (): Auth => getAuth(requireApp());
let dbInstance: Firestore | null = null;
/**
 * Firestore dengan deteksi otomatis koneksi: bila jaringan/perangkat memblokir WebChannel (streaming),
 * SDK beralih ke long-polling. Tanpa ini, sebagian jaringan seluler membuat permintaan menggantung tanpa galat.
 */
export const getDb = (): Firestore => {
  if (dbInstance) return dbInstance;
  const app = requireApp();
  try {
    dbInstance = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    dbInstance = getFirestore(app);
  }
  return dbInstance;
};
