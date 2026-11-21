import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui';
import { checkLock, checkResetCooldown, formatWait, type LockState, type ResetState } from '@/utils/loginGuard';

/** Keadaan jeda login untuk nama pengguna/email yang sedang diketik; diperbarui tiap detik saat dibutuhkan. */
export function useLoginLock(identifier: string): LockState {
  const [state, setState] = useState<LockState>(() => checkLock(identifier));
  useEffect(() => {
    const update = () =>
      setState((prev) => {
        const next = checkLock(identifier);
        const same = prev.locked === next.locked && Math.ceil(prev.remainingMs / 1000) === Math.ceil(next.remainingMs / 1000) && prev.failures === next.failures;
        return same ? prev : next;
      });
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [identifier]);
  return state;
}

/** Pesan jeda (hitung mundur) atau peringatan sisa percobaan. Tidak tampil bila belum ada yang salah. */
export function LoginLockNotice({ lock }: { lock: LockState }) {
  if (lock.locked) {
    return (
      <p className="flex items-start gap-2 rounded-2xl border-2 border-merah-600 bg-merah-100 px-4 py-3 font-semibold">
        <Icon name="lock" size={20} className="mt-0.5 shrink-0 text-merah-600" />
        <span>
          Dikunci sementara karena terlalu banyak salah. Coba lagi dalam <strong aria-live="off">{formatWait(lock.remainingMs)}</strong>.
        </span>
      </p>
    );
  }
  if (lock.failures >= 2 && lock.attemptsLeft > 0) {
    return (
      <p className="flex items-start gap-2 rounded-2xl border-2 border-tinta bg-kuning-100 px-4 py-3 text-sm font-semibold">
        <Icon name="shield" size={18} className="mt-0.5 shrink-0" />
        <span>
          Sandi sudah salah {lock.failures} kali. {lock.attemptsLeft} percobaan lagi sebelum dikunci sementara.
        </span>
      </p>
    );
  }
  return null;
}

/** Sisa jeda sebelum boleh meminta tautan reset lagi untuk email ini. */
export function useResetCooldown(email: string): ResetState {
  const [state, setState] = useState<ResetState>(() => checkResetCooldown(email));
  useEffect(() => {
    const update = () =>
      setState((prev) => {
        const next = checkResetCooldown(email);
        return prev.locked === next.locked && Math.ceil(prev.remainingMs / 1000) === Math.ceil(next.remainingMs / 1000) ? prev : next;
      });
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [email]);
  return state;
}
