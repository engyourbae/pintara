import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ButtonLink, Card, Icon, Page, PageHeader, useConfirm } from '@/components/ui';
import { Field, FormError } from '@/features/auth/parts';
import { GameInvites } from './GameInvites';
import { AVATARS, useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { MODE_BASE } from '@/app/navigation';
import { friendlyError } from '@/services/firebase/auth';
import { inviteFriend, multiplayerFlags } from '@/services/firebase/duel';
import {
  acceptRequest,
  blockUser,
  cancelRequest,
  declineRequest,
  isFriendsEnabled,
  loadFriends,
  removeFriend,
  sendFriendRequest,
  unblockUser,
  type FriendsData,
  type PublicProfile,
  ensureMirror,
} from '@/services/firebase/friends';
import { cn } from '@/utils/cn';

function Avatar({ id }: { id: string }) {
  const a = AVATARS.find((x) => x.id === id) ?? AVATARS[0];
  return (
    <span className={cn('stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-full', a.bg)}>
      <Icon name={a.icon} size={24} />
    </span>
  );
}

function Row({ p, children }: { p: PublicProfile; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3">
      <Avatar id={p.avatarId} />
      <span className="min-w-0 flex-1 truncate font-bold">{p.username}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </li>
  );
}

function Notice({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Page>
      <PageHeader title="Teman" subtitle="Ruang Anak" icon="users" />
      <Card tone="catatan" className="space-y-3">
        <h2 className="text-xl">{title}</h2>
        <p>{text}</p>
        {action}
      </Card>
    </Page>
  );
}

export function FriendsPage() {
  const { status, user } = useAuth();
  if (status === 'disabled') {
    return <Notice title="Belum tersedia" text="Firebase belum dikonfigurasi, jadi pertemanan belum bisa dipakai." />;
  }
  if (status === 'loading') return <Page><p role="status">Memuat…</p></Page>;
  if (status !== 'ready' || !user) {
    return (
      <Notice
        title="Masuk dulu ya"
        text="Teman hanya untuk akun anak. Minta orang tua membuatkan akun, lalu masuk dengan nama pengguna dan PIN."
        action={<ButtonLink to="/masuk">Masuk</ButtonLink>}
      />
    );
  }
  if (user.role !== 'student' || !user.parentUid) {
    return <Notice title="Khusus akun anak" text="Pertemanan hanya tersedia untuk akun anak yang dibuat oleh orang tua." />;
  }
  return <FriendsInner me={user.uid} parentUid={user.parentUid} />;
}

function FriendsInner({ me, parentUid }: { me: string; parentUid: string }) {
  const confirm = useConfirm();
  const nav = useNavigate();
  const { user } = useAuth();
  const progress = useProgress();
  const [mpAllowed, setMpAllowed] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [data, setData] = useState<FriendsData | null>(null);
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const reload = useCallback(async () => {
    try {
      setData(await loadFriends(me));
    } catch (e) {
      setError(friendlyError(e));
    }
  }, [me]);

  useEffect(() => {
    isFriendsEnabled(parentUid, me)
      .then((ok) => {
        setAllowed(ok);
        if (ok) void reload();
      })
      .catch((e) => {
        setError(friendlyError(e));
        setAllowed(false);
      });
  }, [parentUid, me, reload]);

  useEffect(() => {
    multiplayerFlags(parentUid, me)
      .then((f) => setMpAllowed(f.friends && f.multiplayer))
      .catch(() => setMpAllowed(false));
  }, [parentUid, me]);

  async function invite(p: PublicProfile) {
    setError('');
    setInfo('');
    setBusy(true);
    try {
      await ensureMirror(me).catch(() => undefined);
      const roomId = await inviteFriend(me, user?.displayName ?? '', progress.avatar, p.uid);
      nav(`${MODE_BASE.student}/game/duel/${roomId}`);
    } catch (e) {
      setError(
        e instanceof Error && e.message === 'INVITE_DENIED'
          ? 'Belum bisa mengajak. Minta temanmu membuka aplikasi PINTARA dulu, lalu coba lagi.'
          : friendlyError(e),
      );
    } finally {
      setBusy(false);
    }
  }

  /** Jalankan satu aksi, tampilkan galat ramah, lalu muat ulang daftar. */
  async function run(action: () => Promise<unknown>, done = '') {
    setError('');
    setInfo('');
    setBusy(true);
    try {
      await action();
      if (done) setInfo(done);
      await reload();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = username.trim().toLowerCase();
    if (data?.friends.some((f) => f.username === name)) return setError('Kalian sudah berteman.');
    if (data?.outgoing.some((f) => f.username === name)) return setError('Permintaan sudah dikirim.');
    if (data?.incoming.some((f) => f.username === name)) return setError('Dia sudah mengirim permintaan padamu. Lihat Permintaan masuk.');
    void run(async () => {
      await sendFriendRequest(me, name);
      setUsername('');
    }, 'Permintaan terkirim. Tunggu dia menerima ya.');
  }

  if (allowed === null && !error) return <Page><p role="status">Memuat…</p></Page>;
  if (!allowed) {
    return (
      <Notice
        title="Perlu izin orang tua"
        text={error || 'Minta orang tuamu membuka menu Anak di Ruang Orang Tua, lalu menyalakan "Boleh berteman".'}
      />
    );
  }

  return (
    <Page>
      <PageHeader title="Teman" subtitle="Cari teman dengan nama penggunanya." icon="users" />
      <FormError message={error} />
      {info && (
        <p role="status" className="rounded-2xl border-2 border-tinta bg-hijau-100 px-4 py-3 font-semibold">
          {info}
        </p>
      )}

      <form onSubmit={submit} className="stiker space-y-3 rounded-3xl bg-gading p-5">
        <Field
          label="Nama pengguna temanmu"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          autoCapitalize="none"
          spellCheck={false}
          required
          hint="Minta temanmu menyebutkan nama penggunanya."
        />
        <Button type="submit" block disabled={busy}>
          Kirim permintaan
        </Button>
      </form>

      <GameInvites />

      {data === null ? (
        <p role="status">Memuat daftar…</p>
      ) : (
        <>
          {data.incoming.length > 0 && (
            <Card tone="catatan" className="space-y-3">
              <h2 className="text-xl">Permintaan masuk</h2>
              <ul className="space-y-3">
                {data.incoming.map((p) => (
                  <Row key={p.uid} p={p}>
                    <Button disabled={busy} onClick={() => void run(() => acceptRequest(me, p.uid))}>
                      Terima
                    </Button>
                    <Button variant="sekunder" disabled={busy} onClick={() => void run(() => declineRequest(me, p.uid))}>
                      Tolak
                    </Button>
                  </Row>
                ))}
              </ul>
            </Card>
          )}

          <Card className="space-y-3">
            <h2 className="text-xl">Teman-temanku</h2>
            {data.friends.length === 0 ? (
              <p>Belum ada teman. Kirim permintaan di atas.</p>
            ) : (
              <ul className="space-y-3">
                {data.friends.map((p) => (
                  <Row key={p.uid} p={p}>
                    {mpAllowed && (
                      <Button disabled={busy} onClick={() => void invite(p)}>
                        Undang main
                      </Button>
                    )}
                    <Button
                      variant="sekunder"
                      disabled={busy}
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Hapus ${p.username}?`,
                          message: 'Kalian tidak lagi berteman. Kalian bisa berteman lagi nanti.',
                          confirmLabel: 'Hapus',
                          danger: true,
                        });
                        if (ok) void run(() => removeFriend(me, p.uid));
                      }}
                    >
                      Hapus
                    </Button>
                    <Button
                      variant="sekunder"
                      disabled={busy}
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Blokir ${p.username}?`,
                          message: 'Dia tidak bisa mengirim permintaan atau mengajakmu bermain. Kamu bisa membuka blokir kapan saja.',
                          confirmLabel: 'Blokir',
                          danger: true,
                        });
                        if (ok) void run(() => blockUser(me, p.uid));
                      }}
                    >
                      Blokir
                    </Button>
                  </Row>
                ))}
              </ul>
            )}
            <p className="text-sm text-tinta/75">{mpAllowed ? 'Status online belum tersedia.' : 'Main bersama belum diizinkan orang tuamu. Status online belum tersedia.'}</p>
          </Card>

          {data.outgoing.length > 0 && (
            <Card className="space-y-3">
              <h2 className="text-xl">Menunggu jawaban</h2>
              <ul className="space-y-3">
                {data.outgoing.map((p) => (
                  <Row key={p.uid} p={p}>
                    <Button variant="sekunder" disabled={busy} onClick={() => void run(() => cancelRequest(me, p.uid))}>
                      Batalkan
                    </Button>
                  </Row>
                ))}
              </ul>
            </Card>
          )}

          {data.blocked.length > 0 && (
            <Card className="space-y-3">
              <h2 className="text-xl">Diblokir</h2>
              <ul className="space-y-3">
                {data.blocked.map((p) => (
                  <Row key={p.uid} p={p}>
                    <Button variant="sekunder" disabled={busy} onClick={() => void run(() => unblockUser(me, p.uid))}>
                      Buka blokir
                    </Button>
                  </Row>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      <Card tone="langit" className="flex items-start gap-3">
        <Icon name="shield" size={24} className="mt-0.5 shrink-0" />
        <p>
          Tidak ada obrolan di PINTARA. Jangan bagikan nama asli, alamat, atau nomor telepon. Ada yang tidak nyaman?
          Blokir dan ceritakan ke orang tuamu. <Link to={MODE_BASE.student} className="font-bold underline">Kembali</Link>
        </p>
      </Card>
    </Page>
  );
}
