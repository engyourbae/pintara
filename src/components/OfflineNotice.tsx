import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui';

/**
 * Pemberitahuan singkat saat koneksi berubah: tampil beberapa detik lalu hilang sendiri (tidak menutupi header,
 * tidak menetap). Kemajuan tetap tersimpan di perangkat dan dikirim saat online lagi.
 */
export function OfflineNotice() {
  const [msg, setMsg] = useState<'off' | 'on' | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const show = (m: 'off' | 'on') => {
      setMsg(m);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMsg(null), m === 'off' ? 3500 : 2200);
    };
    const goOff = () => show('off');
    const goOn = () => show('on');
    window.addEventListener('offline', goOff);
    window.addEventListener('online', goOn);
    if (!navigator.onLine) show('off');
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('offline', goOff);
      window.removeEventListener('online', goOn);
    };
  }, []);

  if (!msg) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 animate-naik"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
    >
      <span className={`stiker flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${msg === 'off' ? 'bg-kuning-100' : 'bg-hijau-100'}`}>
        <Icon name={msg === 'off' ? 'offline' : 'check'} size={18} />
        {msg === 'off' ? 'Offline: kemajuan tetap tersimpan' : 'Kembali online'}
      </span>
    </div>
  );
}
