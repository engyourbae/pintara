import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ButtonLink, Card, Icon } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { useAuth } from '@/hooks/useAuth';
import { friendlyError, registerAdult } from '@/services/firebase/auth';
import { cn } from '@/utils/cn';
import { AuthShell, Field, FormError } from './parts';

type AdultRole = 'parent' | 'teacher';

const CHOICES: { role: AdultRole; label: string; note: string }[] = [
  { role: 'parent', label: 'Orang tua / wali', note: 'Membuat akun anak dan mengatur izin.' },
  { role: 'teacher', label: 'Guru', note: 'Perlu diverifikasi pengelola sebelum aktif.' },
];

/** Pendaftaran hanya untuk orang dewasa. Akun anak dibuat dari Ruang Orang Tua. */
export function RegisterPage() {
  const { status, user, refresh } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<AdultRole>('parent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'ready' && user) navigate(MODE_BASE[user.role], { replace: true });
  }, [status, user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== again) {
      setError('Sandi dan pengulangannya tidak sama.');
      return;
    }
    setBusy(true);
    try {
      await registerAdult({ role, displayName: name, email, password });
      await refresh();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (status === 'disabled') {
    return (
      <AuthShell>
        <Card tone="catatan" className="space-y-3">
          <h1 className="text-2xl">Pendaftaran belum tersedia</h1>
          <p>Firebase belum dikonfigurasi di versi ini.</p>
          <ButtonLink to="/">Kembali</ButtonLink>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div>
        <h1 className="text-3xl">Daftar</h1>
        <p className="text-tinta/80">Untuk orang tua dan guru.</p>
      </div>

      <form onSubmit={submit} className="stiker space-y-4 rounded-3xl bg-gading p-5">
        <fieldset>
          <legend className="font-display text-lg font-semibold">Saya adalah</legend>
          <div className="mt-2 grid gap-3">
            {CHOICES.map((c) => (
              <button
                key={c.role}
                type="button"
                aria-pressed={role === c.role}
                onClick={() => setRole(c.role)}
                className={cn(
                  'flex min-h-[64px] flex-col items-start justify-center rounded-2xl border-2 border-tinta px-4 py-2 text-left transition active:translate-y-0.5',
                  role === c.role ? 'bg-hijau-100 shadow-stiker ring-4 ring-aksen/40' : 'bg-white',
                )}
              >
                <span className="font-display text-lg font-semibold">{c.label}</span>
                <span className="text-sm text-tinta/80">{c.note}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Nama" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoComplete="name" required />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          required
          hint="Email tidak ditampilkan kepada pengguna lain."
        />
        <Field
          label="Sandi"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
          hint="Minimal 8 karakter."
        />
        <Field
          label="Ulangi sandi"
          type="password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          autoComplete="new-password"
          required
        />
        <FormError message={error} />
        <Button type="submit" size="lg" block disabled={busy}>
          {busy ? 'Mendaftarkan…' : 'Daftar'}
        </Button>
      </form>

      <Card tone="langit" className="flex items-start gap-3">
        <Icon name="shield" size={24} className="mt-0.5 shrink-0" />
        <p>Anak tidak mendaftar sendiri. Orang tua membuat akun anak setelah masuk.</p>
      </Card>

      <p className="text-center">
        Sudah punya akun?{' '}
        <Link to="/masuk" className="font-bold text-langit-700 underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
