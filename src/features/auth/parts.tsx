import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Logo } from '@/components/ui';
import { cn } from '@/utils/cn';

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
