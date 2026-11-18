import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, Button, Card, Icon, Logo, useConfirm, type ConfirmOptions } from '@/components/ui';
import { FormError } from '@/features/auth/parts';
import { useAuth } from '@/hooks/useAuth';
import { friendlyError } from '@/services/firebase/auth';
import { isAdmin, listTeachers, setTeacherState, type TeacherRow, type TeacherState } from '@/services/firebase/admin';

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link to="/" aria-label="PINTARA, beranda" className="rounded-2xl">
          <Logo />
        </Link>
        <Badge tone="jingga">Pengelola</Badge>
      </header>
      <main className="mx-auto w-full max-w-3xl animate-naik space-y-5 px-4 pb-10 pt-2">{children}</main>
    </div>
  );
}

const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function Section({
  title,
  empty,
  rows,
  busy,
  actions,
}: {
  title: string;
  empty: string;
  rows: TeacherRow[];
  busy: boolean;
  actions: (t: TeacherRow) => ReactNode;
}) {
  return (
    <Card className="space-y-3">
      <h2 className="text-xl">
        {title} <span className="text-tinta/60">({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <p className="text-tinta/75">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((t) => (
            <li key={t.uid} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-tinta/20 bg-white p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{t.displayName}</p>
                <p className="text-sm text-tinta/70">
                  Daftar {fmt(t.createdAt)} · ID {t.uid.slice(0, 6)}
                </p>
              </div>
              <div className={busy ? 'pointer-events-none flex gap-2 opacity-60' : 'flex gap-2'}>{actions(t)}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function AdminPage() {
  const { status, user } = useAuth();
  const confirm = useConfirm();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<TeacherRow[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setRows(await listTeachers());
      setError('');
    } catch (e) {
      setError(friendlyError(e));
    }
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !user) return;
    isAdmin(user.uid)
      .then((ok) => {
        setAllowed(ok);
        if (ok) void reload();
      })
      .catch((e) => {
        setError(friendlyError(e));
        setAllowed(false);
      });
  }, [status, user, reload]);

  async function change(t: TeacherRow, state: TeacherState, ask?: ConfirmOptions) {
    if (ask && !(await confirm(ask))) return;
    setBusy(true);
    setError('');
    try {
      await setTeacherState(t.uid, state);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
      await reload();
    }
  }

  if (status === 'disabled') return <Shell><p>Firebase belum dikonfigurasi.</p></Shell>;
  if (status === 'loading') return <Shell><p role="status">Memeriksa akun…</p></Shell>;
  if (status === 'signedOut' || status === 'noProfile') return <Navigate to="/masuk" replace state={{ from: '/admin' }} />;
  if (allowed === null && !error) return <Shell><p role="status">Memeriksa hak pengelola…</p></Shell>;

  if (!allowed) {
    return (
      <Shell>
        <Card tone="catatan" className="space-y-2">
          <h1 className="text-2xl">Bukan akun pengelola</h1>
          <p>{error || 'Akun ini belum ditandai sebagai pengelola. Penandaan dilakukan satu kali lewat Firebase Console (lihat docs/keamanan.md).'}</p>
        </Card>
      </Shell>
    );
  }

  const by = (s: TeacherState) => (rows ?? []).filter((r) => r.state === s);

  return (
    <Shell>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">Persetujuan Guru</h1>
        <Button variant="sekunder" onClick={() => void reload()} disabled={busy}>
          Segarkan
        </Button>
      </div>
      <FormError message={error} />
      {rows === null ? (
        <p role="status">Memuat…</p>
      ) : (
        <>
          <Section
            title="Menunggu persetujuan"
            empty="Tidak ada guru yang menunggu."
            rows={by('pending')}
            busy={busy}
            actions={(t) => (
              <>
                <Button disabled={busy} onClick={() => void change(t, 'approved')}>
                  <Icon name="check" size={20} />
                  Setujui
                </Button>
                <Button variant="sekunder" disabled={busy} onClick={() => void change(t, 'rejected', { title: `Tolak ${t.displayName}?`, message: 'Guru ini tidak akan bisa memakai Ruang Guru. Bisa disetujui lagi nanti.', confirmLabel: 'Tolak', danger: true })}>
                  Tolak
                </Button>
              </>
            )}
          />
          <Section
            title="Guru aktif"
            empty="Belum ada guru aktif."
            rows={by('approved')}
            busy={busy}
            actions={(t) => (
              <Button variant="sekunder" disabled={busy} onClick={() => void change(t, 'pending', { title: `Cabut akses ${t.displayName}?`, message: 'Guru kembali ke daftar menunggu persetujuan.', confirmLabel: 'Cabut', danger: true })}>
                Cabut
              </Button>
            )}
          />
          <Section
            title="Ditolak"
            empty="Tidak ada."
            rows={by('rejected')}
            busy={busy}
            actions={(t) => (
              <Button variant="sekunder" disabled={busy} onClick={() => void change(t, 'approved')}>
                Setujui
              </Button>
            )}
          />
        </>
      )}
      <Card tone="langit" className="flex items-start gap-3">
        <Icon name="shield" size={24} className="mt-0.5 shrink-0" />
        <p>Identitas guru hanya berupa nama dan tanggal daftar (email sengaja tidak disimpan di profil). Pastikan nama sesuai sebelum menyetujui.</p>
      </Card>
    </Shell>
  );
}
