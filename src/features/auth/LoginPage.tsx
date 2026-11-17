import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, ButtonLink, Card, Icon, Mascot } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { useAuth } from '@/hooks/useAuth';
import { friendlyError, signInWithIdentifier } from '@/services/firebase/auth';
import { AuthShell, Field, FormError, PasswordField } from './parts';

export function LoginPage() {
  const { status, user, signOut } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Setelah profil terbaca, arahkan ke ruang sesuai peran (peran berasal dari database, bukan dari pilihan).
  useEffect(() => {
    if (status === 'ready' && user) {
      const base = MODE_BASE[user.role];
      navigate(from && from.startsWith(base) ? from : base, { replace: true });
    }
  }, [status, user, from, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signInWithIdentifier(identifier, secret);
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
          <h1 className="text-2xl">Masuk belum tersedia</h1>
          <p>Firebase belum dikonfigurasi di versi ini. Kamu tetap bisa belajar sebagai tamu.</p>
          <ButtonLink to={MODE_BASE.student}>Belajar sebagai tamu</ButtonLink>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex items-center gap-4">
        <Mascot size={84} mood="hore" className="shrink-0 animate-goyang" />
        <div>
          <h1 className="text-3xl">Masuk</h1>
          <p className="text-tinta/80">Selamat datang kembali!</p>
        </div>
      </div>

      {status === 'noProfile' && (
        <Card tone="catatan" className="space-y-3">
          <p>Akun ini belum punya profil (pendaftaran sebelumnya terputus). Keluar, lalu daftar ulang dengan email yang sama setelah akun lama dihapus di Console.</p>
          <Button variant="sekunder" onClick={() => void signOut()}>
            Keluar
          </Button>
        </Card>
      )}
      {status === 'error' && <FormError message="Profil akun belum bisa dimuat. Periksa koneksi dan Security Rules." />}

      <form onSubmit={submit} className="stiker space-y-4 rounded-3xl bg-gading p-5">
        <Field
          label="Nama pengguna atau email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          hint="Anak: pakai nama pengguna dari orang tua. Orang tua dan guru: pakai email."
        />
        <PasswordField label="Sandi atau PIN" value={secret} onChange={setSecret} autoComplete="current-password" required />
        <FormError message={error} />
        <Button type="submit" size="lg" block disabled={busy}>
          {busy ? 'Memeriksa…' : 'Masuk'}
        </Button>
      </form>

      <Card tone="langit" className="flex items-start gap-3">
        <Icon name="shield" size={24} className="mt-0.5 shrink-0" />
        <p>Akun anak dibuat oleh orang tua atau wali. Anak tidak perlu email.</p>
      </Card>

      <p className="text-center">
        Orang tua atau guru baru?{' '}
        <Link to="/daftar" className="font-bold text-langit-700 underline underline-offset-4">
          Daftar
        </Link>
      </p>
      <p className="text-center">
        <Link to={MODE_BASE.student} className="font-bold text-langit-700 underline underline-offset-4">
          Coba tanpa akun
        </Link>
      </p>
    </AuthShell>
  );
}
