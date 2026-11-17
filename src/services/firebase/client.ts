import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseOptions, isFirebaseConfigured } from './config';

/**
 * Inisialisasi lazy. Mode tamu & game single player TIDAK boleh memanggil ini,
 * sehingga aplikasi tetap berjalan tanpa Firebase (offline-first).
 */
function requireApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase belum dikonfigurasi. Isi .env.local (lihat .env.example).');
  }
  return getApps().length ? getApp() : initializeApp(firebaseOptions);
}

export const getFirebaseAuth = (): Auth => getAuth(requireApp());
export const getDb = (): Firestore => getFirestore(requireApp());
export const getRtdb = (): Database => getDatabase(requireApp());
