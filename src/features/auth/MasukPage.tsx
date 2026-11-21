import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, ButtonLink, Card, Icon, Mascot } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { useAuth } from '@/hooks/useAuth';
import { friendlyError, registerAdult, signInWithGoogle, signInWithIdentifier } from '@/services/firebase/auth';
import { passwordOk } from '@/utils/password';
import { AuthShell, Field, FormError, GoogleButton, PasswordField } from './parts';
import { ForgotPassword } from './ForgotPassword';
import { LoginLockNotice, useLoginLock } from './LoginLock';
import { cn } from '@/utils/cn';

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

  const [busy, setBusy] = useState<'' | 'google' | 'form' | 'baru-form' | 'guru-google' | 'guru-form'>('');
  const [main, setMain] = useState<'masuk' | 'baru'>('masuk');
  const [pName, setPName] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPass, setPPass] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  const [teacherOpen, setTeacherOpen] = useState(false);
  const [mode, setMode] = useState<TeacherMode>('masuk');
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPass, setTPass] = useState('');
  const [tError, setTError] = useState('');
  const lockMain = useLoginLock(identifier);
  const lockTeacher = useLoginLock(tEmail);

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

  async function submitParentNew(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!passwordOk(pPass)) {
      setError('Sandi belum memenuhi semua syarat.');
      return;
    }
    setBusy('baru-form');
    try {
      await registerAdult({ role: 'parent', displayName: pName, email: pEmail, password: pPass });
      await refresh();
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

  const profileCards = (
    <>
      {status === 'noProfile' && !busy && (
        <Card tone="catatan" className="space-y-3">
          <p>Akun ini belum punya profil. Keluar, lalu masuk lagi dengan Google untuk membuatnya otomatis.</p>
          <Button variant="sekunder" size="lg" block onClick={() => void signOut()}>Keluar</Button>
        </Card>
      )}
      {status === 'error' && <FormError message="Profil akun belum bisa dimuat. Periksa koneksi lalu muat ulang." />}
    </>
  );

  // Mode guru: hanya panel guru yang tampil (naik ke atas), dengan tombol kembali.
  if (teacherOpen) {
    return (
      <AuthShell>
        <Button variant="sekunder" size="lg" block onClick={() => { setTeacherOpen(false); setTError(''); }}>
          <Icon name="arrow" size={20} className="rotate-180" />
          Kembali
        </Button>
        <div className="flex items-center gap-4">
          <Mascot size={72} mood="halo" className="shrink-0" />
          <div>
            <h1 className="text-3xl">Untuk guru</h1>
            <p className="text-tinta/80">Masuk atau buat akun guru.</p>
          </div>
        </div>
        {profileCards}
        <section aria-label="Guru" className="stiker space-y-4 rounded-3xl bg-gading p-5">
          <div role="radiogroup" aria-label="Pilihan guru" className="grid grid-cols-2 gap-3">
            {(['masuk', 'daftar'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => { setMode(m); setTError(''); }}
                className={cn(
                  'h-14 rounded-2xl border-2 border-tinta px-3 font-display text-lg font-semibold transition active:translate-y-0.5',
                  mode === m ? 'bg-aksen text-white shadow-stiker' : 'bg-white text-tinta',
                )}
              >
                {m === 'masuk' ? 'Masuk' : 'Daftar baru'}
              </button>
            ))}
          </div>
          <GoogleButton label={mode === 'masuk' ? 'Masuk dengan Google' : 'Daftar dengan Google'} busy={busy === 'guru-google'} onClick={() => void google('teacher')} />
          <div className="flex items-center gap-3" aria-hidden>
            <span className="h-0.5 flex-1 bg-tinta/20" />
            <span className="text-sm font-bold text-tinta/70">atau email</span>
            <span className="h-0.5 flex-1 bg-tinta/20" />
          </div>
          <form onSubmit={submitTeacher} className="space-y-3">
            {mode === 'daftar' && <Field label="Nama" value={tName} onChange={(e) => setTName(e.target.value)} maxLength={30} autoComplete="name" required />}
            <Field label="Email" type="email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} autoComplete="email" autoCapitalize="none" required />
            <PasswordField label="Sandi" value={tPass} onChange={setTPass} autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'} required checklist={mode === 'daftar'} />
            <FormError message={tError} />
            {mode === 'masuk' && <LoginLockNotice lock={lockTeacher} />}
            <Button type="submit" size="lg" block disabled={busy !== '' || (mode === 'masuk' && lockTeacher.locked) || (mode === 'daftar' && !passwordOk(tPass))}>
              {busy === 'guru-form' ? 'Memproses…' : mode === 'masuk' ? 'Masuk sebagai guru' : 'Daftar sebagai guru'}
            </Button>
          </form>
          {mode === 'masuk' && <ForgotPassword initialEmail={tEmail} />}
          {mode === 'daftar' && (
            <p className="flex items-start gap-2 text-sm">
              <Icon name="shield" size={18} className="mt-0.5 shrink-0" />
              Demi keamanan anak, akun guru aktif setelah diverifikasi pengelola PINTARA.
            </p>
          )}
        </section>
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

      {profileCards}

      <section aria-label="Masuk orang tua dan murid" className="stiker space-y-4 rounded-3xl bg-gading p-5">
        <div role="radiogroup" aria-label="Masuk atau akun baru" className="grid grid-cols-2 gap-3">
          {(['masuk', 'baru'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={main === m}
              onClick={() => { setMain(m); setError(''); }}
              className={cn(
                'h-14 rounded-2xl border-2 border-tinta px-3 font-display text-lg font-semibold transition active:translate-y-0.5',
                main === m ? 'bg-aksen text-white shadow-stiker' : 'bg-white text-tinta',
              )}
            >
              {m === 'masuk' ? 'Masuk' : 'Akun baru'}
            </button>
          ))}
        </div>

        {main === 'masuk' ? (
          <>
            <GoogleButton big label="Masuk dengan Google" busy={busy === 'google'} onClick={() => void google('parent')} />
            <p className="text-center text-sm text-tinta/80">Orang tua: masuk tanpa sandi dengan akun Google.</p>
            <FormError message={error} />

            <div className="flex items-center gap-3" aria-hidden>
              <span className="h-0.5 flex-1 bg-tinta/20" />
              <span className="text-sm font-bold text-tinta/70">atau murid</span>
              <span className="h-0.5 flex-1 bg-tinta/20" />
            </div>

            <form onSubmit={submitMain} className="space-y-3">
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
              <LoginLockNotice lock={lockMain} />
              <Button type="submit" size="lg" block disabled={busy !== '' || lockMain.locked}>
                {busy === 'form' ? 'Memeriksa…' : 'Masuk'}
              </Button>
            </form>
            <ForgotPassword initialEmail={identifier} />
          </>
        ) : (
          <>
            <p className="rounded-2xl bg-langit-100 px-4 py-3 text-sm">
              Akun baru untuk <strong>orang tua atau wali</strong>. Murid tidak mendaftar sendiri: orang tua membuat akun anak setelah masuk, di menu Anak.
            </p>
            <GoogleButton big label="Daftar dengan Google" busy={busy === 'google'} onClick={() => void google('parent')} />
            <div className="flex items-center gap-3" aria-hidden>
              <span className="h-0.5 flex-1 bg-tinta/20" />
              <span className="text-sm font-bold text-tinta/70">atau email</span>
              <span className="h-0.5 flex-1 bg-tinta/20" />
            </div>
            <form onSubmit={submitParentNew} className="space-y-3">
              <Field label="Nama" value={pName} onChange={(e) => setPName(e.target.value)} maxLength={30} autoComplete="name" required />
              <Field label="Email" type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} autoComplete="email" autoCapitalize="none" required hint="Email tidak ditampilkan kepada pengguna lain." />
              <PasswordField label="Sandi" value={pPass} onChange={setPPass} autoComplete="new-password" required checklist />
              <FormError message={error} />
              <Button type="submit" size="lg" block disabled={busy !== '' || !passwordOk(pPass)}>
                {busy === 'baru-form' ? 'Mendaftarkan…' : 'Daftar sebagai orang tua'}
              </Button>
            </form>
          </>
        )}
      </section>

      <Button variant="sekunder" size="lg" block onClick={() => setTeacherOpen(true)}>
        <Icon name="board" size={22} />
        Saya guru
      </Button>

      <ButtonLink to={MODE_BASE.student} variant="ghost" size="lg" block>
        Coba tanpa akun
      </ButtonLink>
    </AuthShell>
  );
}
