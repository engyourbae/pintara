/**
 * Pendaftaran service worker (offline) untuk aplikasi utama. Pembaruan TIDAK diterapkan otomatis:
 * worker baru menunggu sampai pengguna menekan "Perbarui" (lihat UpdatePrompt), supaya kuis yang sedang
 * dikerjakan tidak terputus. Aplikasi admin tidak memakai service worker.
 */
type Listener = () => void;

let waiting: ServiceWorker | null = null;
const listeners = new Set<Listener>();

function setWaiting(worker: ServiceWorker) {
  waiting = worker;
  listeners.forEach((l) => l());
}

export function hasWaitingUpdate(): boolean {
  return waiting !== null;
}

export function subscribeWaiting(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Mengaktifkan worker baru lalu memuat ulang (hash/rute dipertahankan). false bila tidak ada yang menunggu. */
export function applyWaitingUpdate(): boolean {
  if (!waiting) return false;
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
  waiting.postMessage({ type: 'SKIP_WAITING' });
  return true;
}

export function registerServiceWorker(): void {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((reg) => {
        // Hanya anggap "pembaruan" bila halaman ini sudah dikendalikan worker lama (bukan pemasangan pertama).
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener('statechange', () => {
            if (next.state === 'installed' && navigator.serviceWorker.controller) setWaiting(next);
          });
        });
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void reg.update().catch(() => undefined);
        });
      })
      .catch((e) => console.warn('[sw] gagal mendaftar', e));
  });
}
