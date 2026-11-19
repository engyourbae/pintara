import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/** Splash (di index.html) baru dihapus setelah status akun selesai diperiksa, bukan sekadar saat React pertama tampil. */
const MIN_SPLASH_MS = 900;

export function SplashGate() {
  const { status } = useAuth();
  useEffect(() => {
    if (status === 'loading') return;
    const splash = document.getElementById('splash');
    if (!splash) return;
    const id = window.setTimeout(() => {
      splash.classList.add('bye');
      window.setTimeout(() => splash.remove(), 400);
    }, Math.max(0, MIN_SPLASH_MS - performance.now()));
    return () => window.clearTimeout(id);
  }, [status]);
  return null;
}
