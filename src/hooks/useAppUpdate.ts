import { useEffect, useState } from 'react';
import { hasWaitingUpdate, subscribeWaiting } from '@/services/offline/sw';

const CHECK_EVERY_MS = 10 * 60 * 1000;

/**
 * Memeriksa apakah ada versi PINTARA yang lebih baru dari yang sedang terbuka. Membandingkan ID build di
 * aplikasi dengan version.json di server (selalu diambil tanpa cache). Tidak pernah memuat ulang sendiri.
 * Mengembalikan ID versi baru bila ada, selain itu null.
 */
export function useAppUpdate(): string | null {
  const [latest, setLatest] = useState<string | null>(null);
  const [swWaiting, setSwWaiting] = useState(hasWaitingUpdate());

  useEffect(() => subscribeWaiting(() => setSwWaiting(hasWaitingUpdate())), []);

  useEffect(() => {
    const current = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : '';
    if (!current || import.meta.env.DEV) return;
    let stopped = false;

    async function check() {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { id?: unknown };
        if (!stopped && typeof data.id === 'string' && data.id !== current) setLatest(data.id);
      } catch {
        /* offline atau gagal: abaikan, coba lagi nanti */
      }
    }

    const first = setTimeout(() => void check(), 4000);
    const timer = setInterval(() => void check(), CHECK_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      stopped = true;
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, []);

  return latest ?? (swWaiting ? 'sw' : null);
}
