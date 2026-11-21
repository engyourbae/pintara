import { useState, type FormEvent } from 'react';
import { Button, Icon } from '@/components/ui';
import { friendlyError, requestPasswordReset } from '@/services/firebase/auth';
import { formatWait } from '@/utils/loginGuard';
import { useResetCooldown } from './LoginLock';
import { Field, FormError } from './parts';

/**
 * "Lupa sandi?" untuk akun email (orang tua, guru, admin). Mengirim tautan buat sandi baru lewat email (bukan OTP).
 * Dipasang DI LUAR <form> masuk agar Enter di kolom email tidak mengirim form masuk.
 */
export function ForgotPassword({ initialEmail = '' }: { initialEmail?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const cooldown = useResetCooldown(email);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setEmail((v) => v || (initialEmail.includes('@') ? initialEmail.trim() : ''));
          setOpen(true);
        }}
        className="mx-auto flex min-h-[48px] items-center px-3 font-display text-base font-semibold text-aksen-tua underline"
      >
        Lupa sandi?
      </button>
    );
  }

  return (
    <section aria-label="Lupa sandi" className="stiker space-y-3 rounded-3xl bg-langit-100 p-5">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xl">Lupa sandi</h2>
        <button type="button" aria-label="Tutup" onClick={() => setOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon name="close" size={20} />
        </button>
      </div>
      <p className="text-sm">Untuk akun orang tua atau guru. Kami mengirim <strong>tautan</strong> (bukan kode) ke email untuk membuat sandi baru. Periksa juga folder spam.</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Email akun" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setSent(false); }} autoComplete="email" autoCapitalize="none" spellCheck={false} required />
        <FormError message={error} />
        {sent && (
          <p role="status" className="flex items-start gap-2 rounded-2xl border-2 border-tinta bg-hijau-100 px-4 py-3 font-semibold">
            <Icon name="check" size={20} className="mt-0.5 shrink-0" />
            <span>Jika email itu terdaftar, tautan reset sandi sudah dikirim. Buka emailnya lalu ikuti tautannya.</span>
          </p>
        )}
        <Button type="submit" size="lg" block disabled={busy || !email.trim() || cooldown.locked}>
          {busy ? 'Mengirim…' : cooldown.locked ? `Tunggu ${formatWait(cooldown.remainingMs)}` : sent ? 'Kirim ulang tautan' : 'Kirim tautan reset'}
        </Button>
      </form>
      <p className="text-sm text-tinta/80">Murid yang lupa PIN: minta bantuan orang tua atau wali.</p>
    </section>
  );
}
