import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { progressActions } from '@/hooks/useProgress';

/**
 * Menghubungkan akun dengan kemajuan belajar: tiap akun siswa punya data sendiri di perangkat,
 * dan disalin otomatis ke Firestore agar guru/orang tua dapat melihatnya. Tidak menampilkan apa pun.
 */
export function ProgressBridge() {
  const { status, user } = useAuth();
  const uid = status === 'ready' && user?.role === 'student' ? user.uid : null;

  useEffect(() => {
    progressActions.switchOwner(uid ?? 'guest');
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    import('@/services/firebase/progressSync')
      .then((m) => {
        if (!cancelled) stop = m.startProgressSync(uid);
      })
      .catch((e) => console.warn('[sync] modul gagal dimuat', e));
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [uid]);

  return null;
}
