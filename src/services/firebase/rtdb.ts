import { getDatabase, type Database } from 'firebase/database';
import { requireApp } from './client';

/**
 * Realtime Database dipisah dari client.ts: hanya duel dan pertemanan yang memakainya, jadi SDK-nya
 * tidak ikut diunduh saat aplikasi memeriksa akun di awal (penting di jaringan lambat).
 */
export const getRtdb = (): Database => getDatabase(requireApp());
