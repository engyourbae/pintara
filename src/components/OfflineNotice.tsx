import { useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui';

function subscribe(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

/** Penanda kecil saat tidak ada internet. Kemajuan tetap tersimpan di perangkat dan dikirim saat online lagi. */
export function OfflineNotice() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div
      role="status"
      className="stiker pointer-events-none fixed left-1/2 top-2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-kuning-100 px-4 py-2 text-sm font-semibold"
    >
      <Icon name="offline" size={18} />
      Tanpa internet — kemajuan disimpan di perangkat
    </div>
  );
}
