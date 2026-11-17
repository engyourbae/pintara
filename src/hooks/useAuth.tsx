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

/** Modul Firebase dimuat saat dibutuhkan agar mode tamu tidak menunggu unduhan SDK. */
const loadService = () => import('@/services/firebase/auth');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: AuthStatus; user: AppUser | null }>({
    status: isFirebaseConfigured ? 'loading' : 'disabled',
    user: null,
  });
  /** Hanya hasil pemuatan terbaru yang dipakai (hindari hasil lama menimpa yang baru). */
  const seq = useRef(0);

  const load = useCallback(async (uid: string | null) => {
    const n = ++seq.current;
    if (!uid) {
      setState({ status: 'signedOut', user: null });
      return;
    }
    try {
      const svc = await loadService();
      const user = await svc.fetchAppUser(uid);
      if (n !== seq.current) return;
      setState(user ? { status: 'ready', user } : { status: 'noProfile', user: null });
    } catch {
      if (n !== seq.current) return;
      setState({ status: 'error', user: null });
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
