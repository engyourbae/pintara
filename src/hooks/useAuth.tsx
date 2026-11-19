import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { isFirebaseConfigured } from '@/services/firebase/config';
import type { AppUser } from '@/types';

/**
 * Status sesi:
 * - disabled   : Firebase belum dikonfigurasi (aplikasi tetap jalan sebagai mode tamu).
 * - loading    : memeriksa sesi.
 * - signedOut  : belum masuk.
 * - noProfile  : sudah masuk di Firebase Auth tetapi dokumen `users/{uid}` belum ada.
 * - ready      : masuk dan profil terbaca.
 * - error      : gagal membaca profil (mis. offline atau rules menolak).
 */
export type AuthStatus = 'disabled' | 'loading' | 'signedOut' | 'noProfile' | 'ready' | 'error';

interface AuthValue {
  status: AuthStatus;
  user: AppUser | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Salinan profil terakhir (hanya uid, peran, nama; bukan rahasia) agar tetap masuk saat offline.
 * Ini murni UX: keamanan data tetap dijaga Security Rules. Dihapus saat keluar akun.
 */
const CACHE_KEY = 'pintara:auth-user:v1';
function readCache(uid: string): AppUser | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const u = raw ? (JSON.parse(raw) as AppUser) : null;
    return u && u.uid === uid && typeof u.role === 'string' ? u : null;
  } catch {
    return null;
  }
}
function writeCache(user: AppUser | null) {
  try {
    if (user) localStorage.setItem(CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // penyimpanan tidak tersedia: abaikan
  }
}
/** Galat karena tidak ada koneksi (bukan karena Rules menolak). */
function isOfflineError(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : '';
  return code === 'unavailable' || code === 'deadline-exceeded' || code.endsWith('/network-request-failed');
}

/** Modul Firebase dimuat saat dibutuhkan agar mode tamu tidak menunggu unduhan SDK. */
const loadService = () => import('@/services/firebase/auth');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: AuthStatus; user: AppUser | null }>({
    status: isFirebaseConfigured ? 'loading' : 'disabled',
    user: null,
  });
  /** Hanya hasil pemuatan terbaru yang dipakai (hindari hasil lama menimpa yang baru). */
  const seq = useRef(0);
  /** True bila profil sekarang berasal dari salinan (offline); dimuat ulang saat online lagi. */
  const fromCache = useRef(false);

  const load = useCallback(async (uid: string | null) => {
    const n = ++seq.current;
    if (!uid) {
      writeCache(null);
      fromCache.current = false;
      setState({ status: 'signedOut', user: null });
      return;
    }
    // Offline dan ada salinan profil: langsung masuk tanpa menunggu waktu habis.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = readCache(uid);
      if (cached) {
        fromCache.current = true;
        setState({ status: 'ready', user: cached });
        return;
      }
    }
    try {
      const svc = await loadService();
      const user = await svc.fetchAppUser(uid);
      if (n !== seq.current) return;
      writeCache(user);
      fromCache.current = false;
      setState(user ? { status: 'ready', user } : { status: 'noProfile', user: null });
    } catch (e) {
      if (n !== seq.current) return;
      const cached = isOfflineError(e) ? readCache(uid) : null;
      fromCache.current = cached !== null;
      setState(cached ? { status: 'ready', user: cached } : { status: 'error', user: null });
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let off: (() => void) | undefined;
    let cancelled = false;
    loadService()
      .then((svc) => {
        if (cancelled) return;
        off = svc.watchAuth((uid) => void load(uid));
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', user: null });
      });
    return () => {
      cancelled = true;
      off?.();
    };
  }, [load]);

  const refresh = useCallback(async () => {
    const svc = await loadService();
    await load(svc.currentUid());
  }, [load]);

  // Kembali online: segarkan profil bila sebelumnya memakai salinan.
  useEffect(() => {
    const onOnline = () => {
      if (fromCache.current) void refresh().catch(() => undefined);
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refresh]);

  const signOut = useCallback(async () => {
    const svc = await loadService();
    await svc.signOutUser();
  }, []);

  const value = useMemo<AuthValue>(() => ({ ...state, refresh, signOut }), [state, refresh, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>.');
  return ctx;
}
