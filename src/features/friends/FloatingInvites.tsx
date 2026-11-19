import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Icon } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { friendlyError } from '@/services/firebase/auth';
import { acceptInvite, cleanupMyDuel, declineInvite, multiplayerFlags, serverOffset, subscribeInvites, type DuelInvite } from '@/services/firebase/duel';
import {
  FRIENDS_CHANGED, acceptRequest, declineRequest, ensureMirror, listIncomingRequests, profileOf, type PublicProfile,
} from '@/services/firebase/friends';

const POLL_MS = 90_000;
const MAX_SHOWN = 2;

type Item =
  | { key: string; kind: 'friend'; p: PublicProfile }
  | { key: string; kind: 'game'; inv: DuelInvite };

/**
 * Kartu mengambang untuk anak: permintaan berteman dan ajakan main muncul di layar mana pun, tanpa kembali ke menu.
 * Hemat data: ajakan lewat langganan RTDB (sudah ada), permintaan teman lewat satu query tiap 90 dtk saat layar terlihat
 * (juga saat aplikasi dibuka kembali). Tidak tampil di dalam duel. "Nanti" menyembunyikan sampai ada yang baru.
 */
export function FloatingInvites() {
  const { status, user } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const progress = useProgress();
  const me = status === 'ready' && user?.role === 'student' && user.parentUid ? user : null;
  const uid = me?.uid;
  const parentUid = me?.parentUid;

  const [flags, setFlags] = useState({ friends: false, multiplayer: false });
  const [invites, setInvites] = useState<DuelInvite[]>([]);
  const [requests, setRequests] = useState<PublicProfile[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [hidden, setHidden] = useState<string[]>([]);

  const gameOn = flags.friends && flags.multiplayer;

  // Izin orang tua (sekali), lalu siapkan cermin teman dan bersihkan ruang duel lama.
  useEffect(() => {
    if (!uid || !parentUid) return;
    let cancelled = false;
    multiplayerFlags(parentUid, uid)
      .then((f) => {
        if (cancelled) return;
        setFlags(f);
        if (f.friends && f.multiplayer) {
          void ensureMirror(uid).catch(() => undefined);
          void cleanupMyDuel(uid).catch(() => undefined);
        }
      })
      .catch(() => setFlags({ friends: false, multiplayer: false }));
    return () => {
      cancelled = true;
    };
  }, [uid, parentUid]);

  // Ajakan main (RTDB).
  useEffect(() => {
    if (!uid || !gameOn) return;
    void serverOffset().then(setOffset);
    return subscribeInvites(uid, setInvites);
  }, [uid, gameOn]);

  // Permintaan teman: saat dibuka, tiap 90 dtk (hanya bila terlihat), saat kembali ke aplikasi, dan saat daftar teman berubah.
  const loadRequests = useCallback(async () => {
    if (!uid) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    try {
      setRequests(await listIncomingRequests(uid));
    } catch {
      /* diam: coba lagi pada putaran berikutnya */
    }
  }, [uid]);

  useEffect(() => {
    if (!uid || !flags.friends) return;
    void loadRequests();
    const tick = () => {
      if (document.visibilityState === 'visible') void loadRequests();
    };
    const id = window.setInterval(tick, POLL_MS);
    const onChange = (e: Event) => {
      if ((e as CustomEvent).detail !== 'floating') void loadRequests();
    };
    document.addEventListener('visibilitychange', tick);
    window.addEventListener(FRIENDS_CHANGED, onChange);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener(FRIENDS_CHANGED, onChange);
    };
  }, [uid, flags.friends, loadRequests]);

  const live = invites.filter((i) => i.expiresAt > Date.now() + offset);

  // Ajakan kedaluwarsa dihapus agar tidak menumpuk.
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

  const items: Item[] = [
    ...requests.map((p): Item => ({ key: `f:${p.uid}`, kind: 'friend', p })),
    ...(gameOn ? live.map((inv): Item => ({ key: `g:${inv.id}`, kind: 'game', inv })) : []),
  ].filter((i) => !hidden.includes(i.key));

  if (!uid || pathname.includes('/game/duel/') || (items.length === 0 && !error)) return null;

  const shown = items.slice(0, MAX_SHOWN);
  const more = items.length - shown.length;
  const nameOf = (inv: DuelInvite) => profiles[inv.from]?.username ?? 'Temanmu';

  async function act(key: string, fn: () => Promise<void>) {
    setError('');
    setBusy(key);
    try {
      await fn();
      window.dispatchEvent(new CustomEvent(FRIENDS_CHANGED, { detail: 'floating' }));
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy('');
    }
  }

  async function acceptGame(inv: DuelInvite) {
    setError('');
    setBusy(`g:${inv.id}`);
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
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-3"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      {shown.map((it) => {
        const isFriend = it.kind === 'friend';
        const label = isFriend ? `${it.p.username} ingin berteman denganmu` : `${nameOf(it.inv)} mengajak main Duel Kilat Hitung`;
        const off = busy === it.key;
        return (
          <div
            key={it.key}
            role="status"
            aria-live="polite"
            className="pointer-events-auto w-full max-w-md rounded-2xl border-2 border-tinta bg-langit-100 p-3 shadow-stiker"
          >
            <div className="flex items-start gap-2">
              <Icon name={isFriend ? 'users' : 'game'} size={24} className="mt-0.5 shrink-0" />
              <p className="min-w-0 flex-1 font-display text-base font-semibold leading-snug">{label}</p>
              <button
                type="button"
                aria-label="Nanti saja"
                onClick={() => setHidden((h) => [...h, it.key])}
                className="-mr-1 -mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                disabled={off}
                onClick={() =>
                  void (it.kind === 'friend'
                    ? act(it.key, async () => {
                        await acceptRequest(uid, it.p.uid);
                        setRequests((r) => r.filter((x) => x.uid !== it.p.uid));
                      })
                    : acceptGame(it.inv))
                }
              >
                Terima
              </Button>
              <Button
                variant="sekunder"
                disabled={off}
                onClick={() =>
                  void (it.kind === 'friend'
                    ? act(it.key, async () => {
                        await declineRequest(uid, it.p.uid);
                        setRequests((r) => r.filter((x) => x.uid !== it.p.uid));
                      })
                    : act(it.key, () => declineInvite(uid, it.inv.id)))
                }
              >
                Tolak
              </Button>
            </div>
          </div>
        );
      })}
      {more > 0 && (
        <p className="pointer-events-auto rounded-full border-2 border-tinta bg-gading px-3 py-1 text-sm font-bold">+{more} lagi</p>
      )}
      {error && (
        <div role="alert" className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border-2 border-tinta bg-kuning-100 p-3 font-semibold">
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" aria-label="Tutup pesan" onClick={() => setError('')} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
            <Icon name="close" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
