import { useState } from 'react';
import { buttonClasses, Icon } from '@/components/ui';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { applyWaitingUpdate } from '@/services/offline/sw';

/**
 * Spanduk "versi baru tersedia" dengan tombol Perbarui / Nanti. Aplikasi tidak pernah dimuat ulang otomatis,
 * supaya kuis yang sedang dikerjakan tidak hilang. "Nanti" menyembunyikannya sampai aplikasi dibuka lagi.
 */
export function UpdatePrompt() {
  const latest = useAppUpdate();
  const [later, setLater] = useState<string | null>(null);
  if (!latest || later === latest) return null;

  function update() {
    // Bila worker offline baru sudah menunggu, aktifkan lalu muat ulang; selain itu pakai cara versi (version.json).
    if (applyWaitingUpdate()) return;
    // Parameter berbeda memaksa peramban mengambil index.html terbaru; hash (rute) tetap dipertahankan.
    window.location.replace(`${window.location.pathname}?v=${latest}${window.location.hash}`);
  }

  return (
    <div
      role="alert"
      className="stiker fixed inset-x-3 bottom-[92px] z-50 mx-auto max-w-md space-y-3 rounded-3xl bg-kuning-100 p-4 md:bottom-4"
    >
      <div className="flex items-start gap-3">
        <Icon name="star" size={26} className="mt-0.5 shrink-0 text-aksen-tua" />
        <div>
          <p className="font-display text-lg font-semibold">Versi baru tersedia</p>
          <p className="text-sm">Perbarui untuk mendapat perbaikan terbaru. Selesaikan dulu kuis yang sedang berjalan bila ada.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setLater(latest)} className={buttonClasses({ variant: 'sekunder' })}>
          Nanti
        </button>
        <button type="button" onClick={update} className={buttonClasses({ variant: 'utama' })}>
          Perbarui
        </button>
      </div>
    </div>
  );
}
