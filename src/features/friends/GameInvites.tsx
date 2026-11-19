import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { acceptInvite, cleanupMyDuel, declineInvite, multiplayerFlags, serverOffset, subscribeInvites, type DuelInvite } from '@/services/firebase/duel';
import { ensureMirror, profileOf, type PublicProfile } from '@/services/firebase/friends';

/** Kotak undangan main dari teman. Tidak tampil bila tidak ada undangan atau orang tua belum mengizinkan. */
export function GameInvites() {
  const { status, user } = useAuth();
  const nav = useNavigate();
  const progress = useProgress();
  const me = status === 'ready' && user?.role === 'student' && user.parentUid ? user : null;
  const [enabled, setEnabled] = useState(false);
  const [invites, setInvites] = useState<DuelInvite[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const uid = me?.uid;
  const parentUid = me?.parentUid;

  useEffect(() => {
    if (!uid || !parentUid) return;
    let cancelled = false;
    multiplayerFlags(parentUid, uid)
      .then((f) => {
        if (cancelled) return;
        const ok = f.friends && f.multiplayer;
        setEnabled(ok);
        if (ok) {
          void ensureMirror(uid).catch(() => undefined); // rules undangan butuh cermin teman di RTDB
          void cleanupMyDuel(uid).catch(() => undefined); // buang ruang duel lama yang ditinggalkan
        }
      })
      .catch(() => setEnabled(false));
    return () => {
      cancelled = true;
    };
  }, [uid, parentUid]);

  useEffect(() => {
    if (!uid || !enabled) return;
    void serverOffset().then(setOffset);
    return subscribeInvites(uid, setInvites);
  }, [uid, enabled]);

  const live = invites.filter((i) => i.expiresAt > Date.now() + offset);

  // Undangan kedaluwarsa dihapus agar tidak menumpuk.
  useEffect(() => {
    if (!uid) return;
    invites.filter((i) => i.expiresAt <= Date.now() + offset).forEach((i) => void declineInvite(uid, i.id).catch(() => undefined));
  }, [invites, offset, uid]);

  useEffect(() => {
    live.forEach((inv) => {
      if (profiles[inv.from]) return;
      void profileOf(inv.from).then((p) => setProfiles((m) => ({ ...m, [inv.from]: p })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invites]);

  if (!uid || !enabled || live.length === 0) return null;

  async function accept(inv: DuelInvite) {
    setError('');
    setBusy(inv.id);
    try {
      await acceptInvite(uid!, me?.displayName ?? '', progress.avatar, inv);
      nav(`${MODE_BASE.student}/game/duel/${inv.roomId}`);
    } catch {
      setError('Belum bisa bergabung. Mungkin ajakannya sudah ditutup.');
      void declineInvite(uid!, inv.id).catch(() => undefined);
    } finally {
      setBusy('');
    }
  }

  return (
    <Card tone="langit" className="space-y-3">
      <h2 className="text-xl">Teman mengajak main!</h2>
      <ul className="space-y-3">
        {live.map((inv) => (
          <li key={inv.id} className="flex flex-wrap items-center gap-3">
            <span className="min-w-0 flex-1 truncate font-bold">{profiles[inv.from]?.username ?? 'Temanmu'} · Duel Kilat Hitung</span>
            <div className="flex gap-2">
              <Button disabled={busy === inv.id} onClick={() => void accept(inv)}>Terima</Button>
              <Button variant="sekunder" disabled={busy === inv.id} onClick={() => void declineInvite(uid, inv.id).catch(() => undefined)}>
                Tolak
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="font-bold text-merah-600">{error}</p>}
    </Card>
  );
}
