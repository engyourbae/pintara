import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/** Splash (di index.html) baru dihapus setelah status akun selesai diperiksa, bukan sekadar saat React pertama tampil. */
const MIN_SPLASH_MS = 900;
/** Batas keras: splash tidak boleh menutupi aplikasi selamanya, apa pun yang terjadi. */
const MAX_SPLASH_MS = 14000;

function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.classList.add('bye');
  window.setTimeout(() => splash.remove(), 400);
}

export function SplashGate() {
  const { status } = useAuth();
  useEffect(() => {
    if (status === 'loading') return;
    const id = window.setTimeout(hideSplash, Math.max(0, MIN_SPLASH_MS - performance.now()));
    return () => window.clearTimeout(id);
  }, [status]);
  useEffect(() => {
    const id = window.setTimeout(hideSplash, Math.max(0, MAX_SPLASH_MS - performance.now()));
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
