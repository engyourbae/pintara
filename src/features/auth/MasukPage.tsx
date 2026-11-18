import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, ButtonLink, Card, ChoiceGroup, Icon, Mascot } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { useAuth } from '@/hooks/useAuth';
import { friendlyError, registerAdult, signInWithGoogle, signInWithIdentifier } from '@/services/firebase/auth';
import { passwordOk } from '@/utils/password';
import { AuthShell, Field, FormError, GoogleButton, PasswordField } from './parts';

type TeacherMode = 'masuk' | 'daftar';

/**
 * Satu halaman masuk untuk semua. Besar di atas: orang tua dan murid (Google, atau nama pengguna + PIN).
 * Di bawah, kecil: guru (masuk atau daftar). Setelah masuk, pengguna langsung ke ruangnya dan tetap masuk
 * sampai menekan Keluar.
 */
export function MasukPage() {
  const { status, user, signOut, refresh } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;

  const [busy, setBusy] = useState<'' | 'google' | 'form' | 'guru-google' | 'guru-form'>('');
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  const [teacherOpen, setTeacherOpen] = useState(false);
  const [mode, setMode] = useState<TeacherMode>('masuk');
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPass, setTPass] = useState('');
  const [tError, setTError] = useState('');

  useEffect(() => {
    if (status === 'ready' && user) {
      const base = MODE_BASE[user.role];
      navigate(from && from.startsWith(base) ? from : base, { replace: true });
    }
  }, [status, user, from, navigate]);

  async function google(role: 'parent' | 'teacher') {
    const teacher = role === 'teacher';
    (teacher ? setTError : setError)('');
    setBusy(teacher ? 'guru-google' : 'google');
    try {
      if (await signInWithGoogle(role)) await refresh();
    } catch (e) {
      (teacher ? setTError : setError)(friendlyError(e));
    } finally {
      setBusy('');
    }
  }

  async function submitMain(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy('form');
    try {
      await signInWithIdentifier(identifier, secret);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy('');
    }
  }

  async function submitTeacher(e: FormEvent) {
    e.preventDefault();
    setTError('');
    if (mode === 'daftar' && !passwordOk(tPass)) {
      setTError('Sandi belum memenuhi semua syarat.');
      return;
    }
    setBusy('guru-form');
    try {
      if (mode === 'masuk') await signInWithIdentifier(tEmail, tPass);
      else {
        await registerAdult({ role: 'teacher', displayName: tName, email: tEmail, password: tPass });
        await refresh();
      }
    } catch (err) {
      setTError(friendlyError(err));
    } finally {
      setBusy('');
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
          <h1 className="text-3xl">Selamat datang!</h1>
          <p className="text-tinta/80">Masuk untuk lanjut belajar.</p>
        </div>
      </div>

      {status === 'noProfile' && !busy && (
        <Card tone="catatan" className="space-y-3">
          <p>Akun ini belum punya profil. Keluar, lalu masuk lagi dengan Google untuk membuatnya otomatis.</p>
          <Button variant="sekunder" onClick={() => void signOut()}>Keluar</Button>
        </Card>
      )}
      {status === 'error' && <FormError message="Profil akun belum bisa dimuat. Periksa koneksi lalu muat ulang." />}

      <section aria-label="Masuk orang tua dan murid" className="stiker space-y-4 rounded-3xl bg-gading p-5">
        <GoogleButton big label="Masuk dengan Google" busy={busy === 'google'} onClick={() => void google('parent')} />
        <p className="text-center text-sm text-tinta/80">Orang tua: baru pertama kali? Akun dibuat otomatis, tanpa sandi.</p>
        <FormError message={error} />

        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-0.5 flex-1 bg-tinta/20" />
          <span className="text-sm font-bold text-tinta/70">atau</span>
          <span className="h-0.5 flex-1 bg-tinta/20" />
        </div>

        <form onSubmit={submitMain} className="space-y-3">
          <p className="font-display text-lg font-semibold">Murid: pakai nama pengguna</p>
          <Field
            label="Nama pengguna atau email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            hint="Nama pengguna diberikan orang tuamu."
          />
          <PasswordField label="PIN atau sandi" value={secret} onChange={setSecret} autoComplete="current-password" required />
          <Button type="submit" size="lg" block disabled={busy !== ''}>
            {busy === 'form' ? 'Memeriksa…' : 'Masuk'}
          </Button>
        </form>
      </section>

      <section aria-label="Guru">
        <button
          type="button"
          aria-expanded={teacherOpen}
          onClick={() => setTeacherOpen((o) => !o)}
          className="flex min-h-[48px] w-full items-center justify-between rounded-2xl border-2 border-tinta bg-white px-4 font-display text-base font-semibold"
        >
          <span className="flex items-center gap-2">
            <Icon name="board" size={22} />
            Saya guru
          </span>
          <Icon name="arrow" size={20} className={teacherOpen ? 'rotate-90 transition' : 'transition'} />
        </button>

        {teacherOpen && (
          <div className="stiker mt-3 space-y-4 rounded-3xl bg-gading p-5">
            <ChoiceGroup<TeacherMode>
              label="Guru"
              value={mode}
              onChange={(m) => { setMode(m); setTError(''); }}
              options={[{ value: 'masuk', label: 'Masuk' }, { value: 'daftar', label: 'Daftar guru baru' }]}
            />
            <GoogleButton label={mode === 'masuk' ? 'Masuk guru dengan Google' : 'Daftar guru dengan Google'} busy={busy === 'guru-google'} onClick={() => void google('teacher')} />
            <p className="text-center text-sm text-tinta/80">atau pakai email dan sandi</p>
            <form onSubmit={submitTeacher} className="space-y-3">
              {mode === 'daftar' && <Field label="Nama" value={tName} onChange={(e) => setTName(e.target.value)} maxLength={30} autoComplete="name" required />}
              <Field label="Email" type="email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} autoComplete="email" autoCapitalize="none" required />
              <PasswordField label="Sandi" value={tPass} onChange={setTPass} autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'} required checklist={mode === 'daftar'} />
              <FormError message={tError} />
              <Button type="submit" size="lg" block disabled={busy !== '' || (mode === 'daftar' && !passwordOk(tPass))}>
                {busy === 'guru-form' ? 'Memproses…' : mode === 'masuk' ? 'Masuk sebagai guru' : 'Daftar sebagai guru'}
              </Button>
            </form>
            {mode === 'daftar' && (
              <p className="flex items-start gap-2 text-sm">
                <Icon name="shield" size={18} className="mt-0.5 shrink-0" />
                Demi keamanan anak, akun guru aktif setelah diverifikasi pengelola PINTARA.
              </p>
            )}
          </div>
        )}
      </section>

      <p className="text-center">
        <Link to={MODE_BASE.student} className="font-bold text-langit-700 underline underline-offset-4">
          Coba tanpa akun
        </Link>
      </p>
    </AuthShell>
  );
}
