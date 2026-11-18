import { createContext, useCallback, useContext, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { buttonClasses } from './Button';
import { Mascot } from './Mascot';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Aksi yang sulit dibatalkan: tombol konfirmasi berwarna kuning (perhatian). */
  danger?: boolean;
}

type Ask = (options: ConfirmOptions) => Promise<boolean>;
interface Pending {
  options: ConfirmOptions;
  resolve: (ok: boolean) => void;
}

const ConfirmContext = createContext<Ask | null>(null);

/** Pengganti window.confirm: dialog bergaya PINTARA, bukan dialog bawaan browser. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const ref = useRef<Pending | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const ask = useCallback<Ask>((options) => {
    return new Promise<boolean>((resolve) => {
      ref.current?.resolve(false); // dialog sebelumnya (jika ada) dianggap dibatalkan
      const next = { options, resolve };
      ref.current = next;
      setPending(next);
    });
  }, []);

  const close = useCallback((ok: boolean) => {
    ref.current?.resolve(ok);
    ref.current = null;
    setPending(null);
  }, []);

  // Saat terbuka: kunci gulir, fokus ke "Batal" (pilihan aman), kembalikan fokus saat tertutup.
  useEffect(() => {
    if (!pending) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [pending]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close(false);
    } else if (e.key === 'Tab') {
      // Fokus hanya berputar di antara dua tombol dialog.
      e.preventDefault();
      (document.activeElement === cancelRef.current ? confirmRef : cancelRef).current?.focus();
    }
  }

  const o = pending?.options;
  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {o && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/60 p-4 sm:items-center"
          onMouseDown={(e) => e.target === e.currentTarget && close(false)}
          onKeyDown={onKeyDown}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="konfirmasi-judul"
            aria-describedby={o.message ? 'konfirmasi-isi' : undefined}
            className="stiker w-full max-w-sm animate-pop space-y-4 rounded-3xl bg-gading p-5"
          >
            <div className="flex items-center gap-3">
              <Mascot size={64} className="shrink-0" />
              <h2 id="konfirmasi-judul" className="text-2xl leading-tight">
                {o.title}
              </h2>
            </div>
            {o.message && (
              <p id="konfirmasi-isi" className="text-tinta/85">
                {o.message}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className={buttonClasses({ variant: 'sekunder' })}
              >
                {o.cancelLabel ?? 'Batal'}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={() => close(true)}
                className={buttonClasses({ variant: o.danger ? 'aksi' : 'utama' })}
              >
                {o.confirmLabel ?? 'Ya'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Ask {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm harus dipakai di dalam <ConfirmProvider>.');
  return ctx;
}
