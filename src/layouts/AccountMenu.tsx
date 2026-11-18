import { useEffect, useRef, useState } from 'react';
import { Button, Icon, useConfirm } from '@/components/ui';
import { MODE_LABEL } from '@/app/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Menu akun di header: tombol "Keluar" sengaja tidak di header agar tidak tertekan tidak sengaja.
 * Keluar ada di dalam menu ini dan selalu meminta konfirmasi.
 */
export function AccountMenu() {
  const { user, signOut } = useAuth();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  if (!user) return null;

  async function logout() {
    setOpen(false);
    const ok = await confirm({
      title: 'Keluar dari akun?',
      message: 'Kamu perlu masuk lagi untuk membuka ruang ini. Kemajuan belajarmu tetap tersimpan.',
      confirmLabel: 'Ya, keluar',
      cancelLabel: 'Batal',
      danger: true,
    });
    if (ok) await signOut();
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label="Akun saya"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="stiker flex h-11 w-11 items-center justify-center rounded-full bg-aksen-muda text-aksen-tua active:translate-y-0.5 active:shadow-none"
      >
        <Icon name="user" size={24} />
      </button>
      {open && (
        <div className="stiker absolute right-0 top-full z-30 mt-2 w-64 space-y-3 rounded-2xl bg-gading p-4">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{user.displayName || 'Akun'}</p>
            <p className="text-sm text-tinta/75">{MODE_LABEL[user.role]}</p>
          </div>
          <Button variant="sekunder" block onClick={() => void logout()}>
            <Icon name="lock" size={20} />
            Keluar
          </Button>
        </div>
      )}
    </div>
  );
}
