import type { FirebaseOptions } from 'firebase/app';

const env = import.meta.env;

const options: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
};

const REQUIRED: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];

/** True hanya jika semua config wajib terisi. UI memakai ini agar tidak mengklaim integrasi aktif. */
export const isFirebaseConfigured = REQUIRED.every((k) => Boolean(options[k]));

export const firebaseOptions = options;
