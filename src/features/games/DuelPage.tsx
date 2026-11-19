import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, ButtonLink, Card, Icon, Mascot, Page, ProgressBar, useConfirm } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/hooks/useAuth';
import { AVATARS, progressActions } from '@/hooks/useProgress';
import {
  DUEL_LIMIT,
  DUEL_TOTAL,
  deleteRoom,
  finishRoom,
  hostStart,
  multiplayerFlags,
  sendAnswer,
  serverOffset,
  setPhase,
  subscribeRoom,
  type DuelPhase,
  type DuelPlayer,
  type DuelRoom,
} from '@/services/firebase/duel';
import { cn } from '@/utils/cn';
import { correctIndex, makeDuelQuestions, scoreAll } from './duelCore';

const TEMAN = `${MODE_BASE.student}/teman`;
const STALE_MS = 45000;

export function DuelPage() {
  const { roomId = '' } = useParams();
  const { status, user } = useAuth();
  if (status === 'loading') return <LoadingScreen />;
  if (status !== 'ready' || !user || user.role !== 'student' || !user.parentUid) {
    return (
      <Page className="max-w-2xl">
        <Card tone="catatan" className="space-y-3 text-center">
          <h1 className="text-2xl">Khusus akun anak</h1>
          <p>Duel hanya bisa dimainkan dengan akun anak yang dibuat orang tua.</p>
          <ButtonLink to="/masuk">Masuk</ButtonLink>
        </Card>
      </Page>
    );
  }
  return <DuelRoomView key={roomId} me={user.uid} parentUid={user.parentUid} roomId={roomId} />;
}

function PlayerChip({ p, score, you }: { p?: DuelPlayer; score: number; you?: boolean }) {
  const a = AVATARS.find((x) => x.id === p?.avatarId) ?? AVATARS[0];
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className={cn('stiker flex h-10 w-10 shrink-0 items-center justify-center rounded-full', a.bg)}>
        <Icon name={a.icon} size={20} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{you ? 'Kamu' : (p?.name ?? 'Teman')}</span>
        <span className="block font-display text-lg font-semibold leading-none">{score}</span>
      </span>
    </div>
  );
}

function Notice({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <Page className="max-w-2xl">
      <Card tone="catatan" className="space-y-3 text-center">
        <h1 className="text-2xl">{title}</h1>
        <p>{text}</p>
        {children}
      </Card>
    </Page>
  );
}

function DuelRoomView({ me, parentUid, roomId }: { me: string; parentUid: string; roomId: string }) {
  const confirm = useConfirm();
  const nav = useNavigate();
  const [allowedOk, setAllowedOk] = useState<boolean | null>(null);
  const [room, setRoom] = useState<DuelRoom | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const recorded = useRef(false);
  const phaseRef = useRef<DuelPhase>('lobby');
  const lastChange = useRef(Date.now());

  useEffect(() => {
    multiplayerFlags(parentUid, me)
      .then((f) => setAllowedOk(f.friends && f.multiplayer))
      .catch(() => setAllowedOk(false));
  }, [parentUid, me]);

  useEffect(() => {
    if (!allowedOk) return;
    void serverOffset().then(setOffset);
    return subscribeRoom(
      roomId,
      (r) =>
        setRoom((prev) => {
          // Ruang dihapus setelah selesai: tetap tampilkan hasil terakhir yang sudah kita punya.
          const next = r === null && prev && prev.phase === 'finished' ? prev : r;
          phaseRef.current = next?.phase ?? 'lobby';
          return next;
        }),
      () => {
        if (phaseRef.current !== 'finished') setFailed(true);
      },
    );
  }, [allowedOk, roomId]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const players = room?.players ?? {};
  const uids = Object.keys(players);
  const oppUid = uids.find((u) => u !== me);
  const opp = oppUid ? players[oppUid] : undefined;
  const isHost = room?.hostUid === me;
  const phase = room?.phase ?? 'lobby';
  const index = room?.index ?? 0;
  const q = room?.questions[index] ?? null;
  const myAns = room?.answers[index]?.[me];
  const oppAns = oppUid ? room?.answers[index]?.[oppUid] : undefined;
  const answeredCount = Object.keys(room?.answers[index] ?? {}).length;
  const timeLeft = room && phase === 'question' ? Math.max(0, DUEL_LIMIT - (now + offset - room.startedAt) / 1000) : DUEL_LIMIT;

  // Tuan rumah menggerakkan alur: soal -> pembahasan -> soal berikutnya -> selesai.
  useEffect(() => {
    if (!room || !isHost || room.status !== 'playing') return;
    if (room.phase === 'question') {
      const all = answeredCount >= uids.length && uids.length > 0;
      const wait = all ? 600 : Math.max(0, room.startedAt + DUEL_LIMIT * 1000 - (Date.now() + offset)) + 300;
      const id = window.setTimeout(() => void setPhase(roomId, 'reveal', room.index, room.startedAt).catch(() => undefined), wait);
      return () => window.clearTimeout(id);
    }
    if (room.phase === 'reveal') {
      const id = window.setTimeout(() => {
        if (room.index + 1 < DUEL_TOTAL) void setPhase(roomId, 'question', room.index + 1, 'now').catch(() => undefined);
        else void finishRoom(roomId, room.index, room.startedAt).catch(() => undefined);
      }, 2400);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.phase, room?.status, room?.index, room?.startedAt, answeredCount, uids.length, isHost, offset]);

  // Deteksi lawan terputus: tidak ada perubahan apa pun terlalu lama.
  useEffect(() => {
    lastChange.current = Date.now();
  }, [room?.phase, room?.index, answeredCount, uids.length]);
  const stale = !!room && room.status === 'playing' && room.phase !== 'finished' && now - lastChange.current > STALE_MS;

  // Duel selesai: catat hasil dan XP sekali.
  useEffect(() => {
    if (!room || room.phase !== 'finished' || recorded.current) return;
    recorded.current = true;
    const s = scoreAll(Object.keys(room.players), room.questions, room.answers, DUEL_TOTAL - 1);
    const mine = s[me] ?? { score: 0, correct: 0 };
    const theirs = oppUid ? s[oppUid] : undefined;
    const won = !!theirs && mine.score > theirs.score;
    progressActions.recordGame('duel-kilat', mine.score, mine.correct * 3 + (won ? 5 : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.phase]);

  // Tuan rumah menghapus ruang beberapa detik setelah selesai (data tidak menumpuk).
  useEffect(() => {
    if (!isHost || room?.phase !== 'finished') return;
    const id = window.setTimeout(() => void deleteRoom(roomId, me), 8000);
    return () => window.clearTimeout(id);
  }, [isHost, room?.phase, roomId, me]);

  async function leave() {
    const live = !!room && room.phase !== 'finished' && room.status !== 'finished';
    if (live) {
      const ok = await confirm({
        title: 'Keluar dari duel?',
        message: isHost ? 'Duel ditutup untuk temanmu juga.' : 'Temanmu akan menunggu sampai waktu soal habis.',
        confirmLabel: 'Keluar',
        danger: true,
      });
      if (!ok) return;
    }
    if (room && (isHost || room.phase === 'finished')) void deleteRoom(roomId, me);
    nav(TEMAN);
  }

  async function start() {
    setError('');
    setStarting(true);
    try {
      await hostStart(roomId, makeDuelQuestions());
    } catch {
      setError('Belum bisa memulai. Coba lagi.');
    } finally {
      setStarting(false);
    }
  }

  function pick(i: number) {
    if (!room || room.phase !== 'question' || myAns || timeLeft <= 0) return;
    setError('');
    void sendAnswer(roomId, index, me, i).catch(() => setError('Jawabanmu belum terkirim. Coba lagi.'));
  }

  // ───────── Tampilan ─────────
  if (allowedOk === null) return <LoadingScreen label="Menyiapkan duel…" />;
  if (!allowedOk) {
    return (
      <Notice title="Main bersama belum diizinkan" text="Minta orang tuamu mengaktifkan pertemanan dan main bersama di pengaturan akunmu.">
        <ButtonLink to={TEMAN} variant="sekunder">Kembali</ButtonLink>
      </Notice>
    );
  }
  if (failed || room === null) {
    return (
      <Notice title="Ruang tidak ditemukan" text="Ruang duel ini sudah ditutup atau bukan untukmu.">
        <ButtonLink to={TEMAN} variant="sekunder">Kembali</ButtonLink>
      </Notice>
    );
  }
  if (room === undefined) return <LoadingScreen label="Membuka ruang…" />;
  if (!room.players[me]) {
    return (
      <Notice title="Kamu belum bergabung" text="Buka undangan dari halaman Beranda atau Teman, lalu tekan Terima.">
        <ButtonLink to={TEMAN} variant="sekunder">Kembali</ButtonLink>
      </Notice>
    );
  }
  if (room.status === 'finished' && room.phase !== 'finished') {
    return (
      <Notice title="Ruang ditutup" text="Duel ini dibatalkan atau sudah selesai.">
        <ButtonLink to={TEMAN} variant="sekunder">Kembali</ButtonLink>
      </Notice>
    );
  }

  const topBar = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => void leave()}
        aria-label="Keluar dari duel"
        className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none"
      >
        <Icon name="close" />
      </button>
      {room.phase === 'question' || room.phase === 'reveal' ? (
        <>
          <div className="min-w-0 flex-1">
            <ProgressBar value={room.phase === 'question' ? timeLeft : 0} max={DUEL_LIMIT} label="Sisa waktu" />
          </div>
          <span className="flex items-center gap-1 font-display text-lg font-semibold">
            <Icon name="clock" size={20} />
            {Math.ceil(timeLeft)}
          </span>
        </>
      ) : (
        <h1 className="font-display text-2xl font-semibold">Duel Kilat Hitung</h1>
      )}
    </div>
  );

  // Lobi
  if (room.phase === 'lobby') {
    return (
      <Page className="max-w-2xl">
        {topBar}
        <Card tone="langit" className="space-y-4 text-center">
          <Mascot size={100} mood="semangat" className="mx-auto animate-melayang" />
          <div className="flex items-center gap-3">
            <PlayerChip p={room.players[me]} score={0} you />
            <span className="font-display text-xl font-semibold">VS</span>
            {opp ? <PlayerChip p={opp} score={0} /> : <span className="flex-1 text-sm">Menunggu temanmu…</span>}
          </div>
          {isHost ? (
            <>
              <p>10 soal hitungan, adu cepat. Benar = 100 poin, yang lebih cepat dapat bonus +20.</p>
              <Button size="lg" block disabled={!opp || starting} onClick={() => void start()}>
                {opp ? 'Mulai duel' : 'Menunggu teman bergabung…'}
              </Button>
            </>
          ) : (
            <p>Menunggu {opp?.name ?? 'temanmu'} memulai duel…</p>
          )}
          {error && <p role="alert" className="font-bold text-merah-600">{error}</p>}
        </Card>
      </Page>
    );
  }

  const scores = scoreAll(uids, room.questions, room.answers, room.phase === 'question' ? index - 1 : room.phase === 'reveal' ? index : DUEL_TOTAL - 1);
  const mine = scores[me] ?? { score: 0, correct: 0 };
  const theirs = oppUid ? (scores[oppUid] ?? { score: 0, correct: 0 }) : { score: 0, correct: 0 };

  // Selesai
  if (room.phase === 'finished') {
    const won = mine.score > theirs.score;
    const draw = mine.score === theirs.score;
    return (
      <Page className="max-w-2xl">
        {topBar}
        <Card tone="catatan" className="flex flex-col items-center gap-4 py-8 text-center">
          <Mascot size={110} mood={won || draw ? 'hore' : 'halo'} className="animate-melayang" />
          <h2 className="text-3xl">{draw ? 'Seri!' : won ? 'Kamu menang!' : `${opp?.name ?? 'Temanmu'} menang`}</h2>
          <div className="flex w-full items-center gap-3">
            <PlayerChip p={room.players[me]} score={mine.score} you />
            <PlayerChip p={opp} score={theirs.score} />
          </div>
          <p>
            Kamu benar {mine.correct} dari {DUEL_TOTAL} · <strong>+{mine.correct * 3 + (won ? 5 : 0)} XP</strong>
          </p>
          <ButtonLink to={TEMAN} block>Kembali ke Teman</ButtonLink>
        </Card>
      </Page>
    );
  }

  // Soal / pembahasan
  if (!q) return <LoadingScreen label="Menyiapkan soal…" />;
  const reveal = room.phase === 'reveal';
  const ci = correctIndex(q);
  const mineRight = myAns?.choice === ci;
  const oppRight = oppAns?.choice === ci;
  const bonus = mineRight && oppRight && myAns && oppAns && myAns.at !== oppAns.at ? (myAns.at < oppAns.at ? 'mine' : 'opp') : null;
  return (
    <Page className="max-w-2xl">
      {topBar}
      <div className="flex items-center gap-3">
        <PlayerChip p={room.players[me]} score={mine.score} you />
        <PlayerChip p={opp} score={theirs.score} />
      </div>
      <div className="flex items-center justify-between font-display font-semibold">
        <span>Soal {index + 1}/{DUEL_TOTAL}</span>
        <span className="text-sm font-bold">
          {!reveal && oppAns ? `${opp?.name ?? 'Teman'} sudah menjawab` : ''}
        </span>
      </div>

      <Card key={index} className="animate-pop py-10 text-center">
        <p className="font-display text-6xl font-semibold">{q.prompt}</p>
        <p className="mt-1 text-tinta/70">= ?</p>
      </Card>

      <ul className="grid grid-cols-2 gap-3">
        {q.options.map((o, i) => {
          const chosen = myAns?.choice === i;
          const right = i === ci;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!!myAns || reveal || timeLeft <= 0}
                onClick={() => pick(i)}
                className={cn(
                  'flex h-20 w-full items-center justify-center rounded-2xl border-2 border-tinta font-display text-3xl font-semibold transition',
                  !myAns && !reveal && 'bg-gading shadow-stiker active:translate-y-1 active:shadow-none',
                  !reveal && chosen && 'bg-langit-100 shadow-stiker',
                  !reveal && myAns && !chosen && 'bg-gading opacity-60',
                  reveal && right && 'bg-hijau-100 shadow-stiker',
                  reveal && chosen && !right && 'animate-getar bg-merah-100',
                  reveal && !right && !chosen && 'bg-gading opacity-50',
                )}
              >
                {o}
              </button>
            </li>
          );
        })}
      </ul>

      <p role="status" className="min-h-[3rem] text-center font-bold">
        {!reveal && myAns && `Jawabanmu terkirim. Menunggu ${opp?.name ?? 'teman'}…`}
        {reveal && (
          <>
            {mineRight ? 'Benar! +100' : myAns ? 'Belum tepat.' : 'Waktu habis.'}
            {bonus === 'mine' && ' Kamu lebih cepat: +20'}
            <br />
            <span className="font-normal">
              {opp?.name ?? 'Teman'}: {oppAns ? (oppRight ? 'benar' : 'salah') : 'tidak menjawab'}
              {bonus === 'opp' && ' dan lebih cepat (+20)'}
            </span>
          </>
        )}
      </p>
      {error && <p role="alert" className="text-center font-bold text-merah-600">{error}</p>}
      {stale && (
        <Card tone="catatan" className="space-y-2 text-center">
          <p>Sepertinya {opp?.name ?? 'temanmu'} terputus. Kamu bisa keluar.</p>
          <Button variant="sekunder" onClick={() => void leave()}>Keluar</Button>
        </Card>
      )}
    </Page>
  );
}
