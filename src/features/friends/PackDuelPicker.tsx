import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Icon, Page } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { makePackInvite } from '@/features/games/duelCore';
import { DUEL_RULES } from '@/features/games/scoring';
import { useAuth } from '@/hooks/useAuth';
import { AVATARS, useProgress } from '@/hooks/useProgress';
import { friendlyError } from '@/services/firebase/auth';
import { inviteFriend, multiplayerFlags } from '@/services/firebase/duel';
import { ensureMirror, loadFriends, type PublicProfile } from '@/services/firebase/friends';
import { cn } from '@/utils/cn';
import type { LearningContent } from '@/types';

/**
 * "Duel dengan teman" dari paket kuis Belajar: pilih teman (hanya bila orang tua mengizinkan main bersama), lalu ruang
 * dibuat. Database hanya menyimpan id paket + 10 indeks soal; kunci jawaban tetap di bundel aplikasi kedua pemain.
 */
export function PackDuelPicker({ content, onClose }: { content: LearningContent; onClose: () => void }) {
  const { status, user } = useAuth();
  const nav = useNavigate();
  const progress = useProgress();
  const me = status === 'ready' && user?.role === 'student' && user.parentUid ? user : null;
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [friends, setFriends] = useState<PublicProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const title = content.title.replace(' (contoh)', '');

  useEffect(() => {
    if (!me?.parentUid) return;
    let cancelled = false;
    multiplayerFlags(me.parentUid, me.uid)
      .then(async (f) => {
        const ok = f.friends && f.multiplayer;
        if (!ok) return cancelled || setAllowed(false);
        const data = await loadFriends(me.uid);
        if (cancelled) return;
        setFriends(data.friends);
        setAllowed(true);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(friendlyError(e));
        setAllowed(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.uid, me?.parentUid]);

  async function invite(p: PublicProfile) {
    if (!me) return;
    const pack = makePackInvite(content);
    if (!pack) return setError('Paket ini belum bisa dipakai untuk duel.');
    setError('');
    setBusy(true);
    try {
      await ensureMirror(me.uid).catch(() => undefined);
      const roomId = await inviteFriend(me.uid, me.displayName ?? '', progress.avatar, p.uid, pack);
      nav(`${MODE_BASE.student}/game/duel/${roomId}`);
    } catch (e) {
      setError(
        e instanceof Error && e.message === 'INVITE_DENIED'
          ? 'Belum bisa mengajak. Minta temanmu membuka aplikasi PINTARA dulu, lalu coba lagi.'
          : friendlyError(e),
      );
      setBusy(false);
    }
  }

  return (
    <Page className="max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none"
        >
          <Icon name="close" />
        </button>
        <h1 className="min-w-0 truncate font-display text-2xl font-semibold">Duel dengan teman</h1>
      </div>
      <Card tone="langit" className="space-y-1">
        <p className="font-display text-lg font-semibold">{title}</p>
        <p>10 soal acak dari paket ini, adu cepat. {DUEL_RULES}</p>
      </Card>
      {!me ? (
        <Card tone="catatan">Duel hanya bisa dimainkan dengan akun anak yang dibuat orang tua.</Card>
      ) : allowed === null ? (
        <p role="status">Memuat teman…</p>
      ) : !allowed ? (
        <Card tone="catatan">{error || 'Main bersama belum diizinkan. Minta orang tuamu menyalakan "Boleh berteman" dan "Boleh main bersama".'}</Card>
      ) : friends.length === 0 ? (
        <Card tone="catatan">Belum ada teman. Tambah teman dulu di menu Teman.</Card>
      ) : (
        <Card className="space-y-3">
          <h2 className="text-xl">Pilih teman</h2>
          <ul className="space-y-3">
            {friends.map((p) => {
              const a = AVATARS.find((x) => x.id === p.avatarId) ?? AVATARS[0];
              return (
                <li key={p.uid} className="flex items-center gap-3">
                  <span className={cn('stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-full', a.bg)}>
                    <Icon name={a.icon} size={24} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-bold">{p.username}</span>
                  <Button disabled={busy} onClick={() => void invite(p)}>Ajak duel</Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      {error && allowed && (
        <p role="alert" className="font-bold text-merah-600">{error}</p>
      )}
    </Page>
  );
}
