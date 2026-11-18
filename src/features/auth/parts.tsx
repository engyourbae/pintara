import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Logo } from '@/components/ui';
import { cn } from '@/utils/cn';
import { PASSWORD_RULES } from '@/utils/password';

/** Kerangka halaman akun (di luar ModeLayout): logo, lalu satu kartu di tengah. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center px-4 py-4">
        <Link to="/" aria-label="PINTARA, beranda" className="rounded-2xl">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-md animate-naik space-y-5 px-4 pb-10 pt-2">{children}</main>
    </div>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

/** Kolom isian dengan label terhubung. Gaya sama dengan kolom nama di Profil. */
export function Field({ label, hint, id, className, ...rest }: FieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div>
      <label htmlFor={fid} className="block font-display text-lg font-semibold">
        {label}
      </label>
      <input
        id={fid}
        aria-describedby={hint ? `${fid}-hint` : undefined}
        className={cn('mt-1 h-12 w-full rounded-2xl border-2 border-tinta bg-white px-4 text-lg', className)}
        {...rest}
      />
      {hint && (
        <p id={`${fid}-hint`} className="mt-1 text-sm text-tinta/75">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Pesan galat yang dibacakan pembaca layar. */
export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl border-2 border-merah-600 bg-merah-100 px-4 py-3 font-semibold">
      <Icon name="close" size={20} className="mt-0.5 shrink-0 text-merah-600" />
      <span>{message}</span>
    </p>
  );
}

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Tampilkan daftar syarat sandi yang tercentang otomatis (untuk pendaftaran). */
  checklist?: boolean;
}

/** Kolom sandi dengan tombol mata (lihat/sembunyikan) dan, bila diminta, daftar syarat bercentang. */
export function PasswordField({ label, value, onChange, checklist = false, id, ...rest }: PasswordFieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={fid} className="block font-display text-lg font-semibold">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={fid}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={checklist ? `${fid}-syarat` : undefined}
          autoCapitalize="none"
          spellCheck={false}
          className="h-12 w-full rounded-2xl border-2 border-tinta bg-white pl-4 pr-14 text-lg"
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Sembunyikan sandi' : 'Lihat sandi'}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-2xl text-tinta/80"
        >
          <Icon name={show ? 'eyeoff' : 'eye'} size={24} />
        </button>
      </div>
      {checklist && (
        <ul id={`${fid}-syarat`} className="mt-2 grid gap-1.5" aria-label="Syarat sandi">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.id} className={cn('flex items-center gap-2 text-base', ok ? 'font-semibold text-hijau-700' : 'text-tinta/75')}>
                <span
                  aria-hidden
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-tinta',
                    ok ? 'bg-aksen text-white' : 'bg-white',
                  )}
                >
                  {ok && <Icon name="check" size={16} />}
                </span>
                <span>{r.label}</span>
                <span className="sr-only">{ok ? ', terpenuhi' : ', belum terpenuhi'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Tombol masuk Google sesuai pedoman tampilan Google (latar putih, logo G berwarna). */
export function GoogleButton({ label, busy, onClick, big = false }: { label: string; busy: boolean; onClick: () => void; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        // Ukuran sama dengan <Button size="lg"> supaya semua tombol di halaman masuk sejajar.
        'flex h-14 w-full items-center justify-center gap-3 whitespace-nowrap rounded-2xl border-2 border-tinta bg-white px-7 font-display text-lg font-semibold shadow-stiker transition active:translate-y-1 active:shadow-none disabled:opacity-60',
        big && 'text-lg',
      )}
    >
      <svg viewBox="0 0 48 48" width={26} height={26} aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      {busy ? 'Membuka Google…' : label}
    </button>
  );
}
