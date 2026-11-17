import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, ButtonLink, Card, Icon, Mascot, Page, PageHeader, ProgressBar } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { progressActions, useProgress } from '@/hooks/useProgress';
import { cn } from '@/utils/cn';

const GAME = `${MODE_BASE.student}/game`;

const GAMES = [
  { to: `${GAME}/kilat-hitung`, title: 'Kilat Hitung', desc: '10 soal hitungan, jawab sebelum waktu habis.', icon: 'calc', bg: 'bg-kuning-500', keys: ['kilat-mudah', 'kilat-sedang', 'kilat-seru'] },
  { to: `${GAME}/susun-kata`, title: 'Susun Kata', desc: 'Susun huruf acak menjadi kata dari petunjuk.', icon: 'pencil', bg: 'bg-hijau-300', keys: ['susun-kata'] },
  { to: `${GAME}/teka-pola`, title: 'Teka Pola', desc: 'Tebak bentuk atau angka yang datang berikutnya.', icon: 'bulb', bg: 'bg-langit-300', keys: ['teka-pola'] },
] as const;

export function GameMenu() {
  const p = useProgress();
  return (
    <Page>
      <PageHeader title="Permainan" subtitle="Main sebentar, otak makin tajam." icon="game" />
      <ul className="grid gap-4">
        {GAMES.map((g, i) => {
          const best = Math.max(0, ...g.keys.map((k) => p.gameBest[k] ?? 0));
          return (
            <li key={g.to} className="animate-naik" style={{ animationDelay: `${i * 80}ms` }}>
              <Link
                to={g.to}
                className="stiker flex items-center gap-4 rounded-3xl bg-gading p-4 transition active:translate-y-1 active:shadow-none"
              >
                <span className={cn('stiker flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl', g.bg)}>
                  <Icon name={g.icon} size={34} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-semibold">{g.title}</span>
                  <span className="block text-tinta/85">{g.desc}</span>
                  {best > 0 && <span className="mt-1 block text-sm font-bold text-aksen-tua">Skor terbaik: {best}</span>}
                </span>
                <Icon name="arrow" className="shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}

type Level = 'mudah' | 'sedang' | 'seru';
interface Q {
  text: string;
  options: number[];
  answer: number;
}

const LEVELS: { id: Level; label: string; desc: string }[] = [
  { id: 'mudah', label: 'Mudah', desc: 'Tambah dan kurang sampai 10' },
  { id: 'sedang', label: 'Sedang', desc: 'Tambah dan kurang sampai 50' },
  { id: 'seru', label: 'Seru', desc: 'Perkalian 2 sampai 10' },
];

const TOTAL = 10;
const LIMIT = 10; // detik per soal

const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

function makeQ(level: Level): Q {
  let text: string;
  let answer: number;
  if (level === 'seru') {
    const a = rand(2, 10);
    const b = rand(2, 10);
    text = `${a} × ${b}`;
    answer = a * b;
  } else {
    const max = level === 'mudah' ? 10 : 50;
    if (Math.random() < 0.5) {
      const a = rand(1, max);
      const b = rand(1, max);
      text = `${a} + ${b}`;
      answer = a + b;
    } else {
      const a = rand(2, max);
      const b = rand(1, a);
      text = `${a} − ${b}`;
      answer = a - b;
    }
  }
  const set = new Set<number>([answer]);
  while (set.size < 4) {
    const d = answer + rand(-6, 6);
    if (d >= 0) set.add(d);
  }
  const options = [...set].sort(() => Math.random() - 0.5);
  return { text, options, answer };
}

export function KilatHitung() {
  const p = useProgress();
  const [level, setLevel] = useState<Level | null>(null);
  const [qs, setQs] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [time, setTime] = useState(LIMIT);
  const [score, setScore] = useState(0);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState<{ gained: number; best: boolean } | null>(null);

  function start(l: Level) {
    setLevel(l);
    setQs(Array.from({ length: TOTAL }, () => makeQ(l)));
    setI(0);
    setPicked(null);
    setTime(LIMIT);
    setScore(0);
    setRight(0);
    setDone(null);
  }

  const playing = level !== null && !done && qs.length > 0;
  const q = qs[i];

  function answer(value: number) {
    if (picked !== null || !q) return;
    setPicked(value);
    if (value === q.answer) {
      setRight((r) => r + 1);
      setScore((s) => s + 10 + Math.floor(time));
    }
  }

  // Hitung mundur per soal.
  useEffect(() => {
    if (!playing || picked !== null) return;
    const id = window.setInterval(() => setTime((t) => Math.max(0, t - 0.1)), 100);
    return () => window.clearInterval(id);
  }, [playing, picked, i]);

  // Waktu habis dihitung sebagai salah.
  useEffect(() => {
    if (playing && picked === null && time <= 0) setPicked(-1);
  }, [playing, picked, time]);

  // Pindah soal otomatis setelah jeda singkat; selesai setelah soal terakhir.
  useEffect(() => {
    if (picked === null || !level) return;
    const id = window.setTimeout(() => {
      if (i + 1 < TOTAL) {
        setI(i + 1);
        setPicked(null);
        setTime(LIMIT);
      } else {
        const gained = right * 5;
        const key = `kilat-${level}`;
        const wasBest = score > (p.gameBest[key] ?? 0);
        progressActions.recordGame(key, score, gained);
        setDone({ gained, best: wasBest });
      }
    }, 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  if (!level) {
    return (
      <Page className="max-w-2xl">
        <PageHeader title="Kilat Hitung" subtitle="Pilih tingkat kesulitan." icon="calc" />
        <ul className="grid gap-3">
          {LEVELS.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => start(l.id)}
                className="stiker flex min-h-[72px] w-full items-center gap-4 rounded-3xl bg-gading p-4 text-left transition active:translate-y-1 active:shadow-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-semibold">{l.label}</span>
                  <span className="block text-tinta/80">{l.desc}</span>
                </span>
                {(p.gameBest[`kilat-${l.id}`] ?? 0) > 0 && <Badge tone="kuning">Terbaik {p.gameBest[`kilat-${l.id}`]}</Badge>}
                <Icon name="play" />
              </button>
            </li>
          ))}
        </ul>
        <ButtonLink to={GAME} variant="sekunder">
          Kembali
        </ButtonLink>
      </Page>
    );
  }

  if (done) {
    return (
      <Page className="max-w-2xl">
        <Card tone="catatan" className="flex flex-col items-center gap-4 py-8 text-center">
          <Mascot size={120} mood="hore" className="animate-melayang" />
          <h1 className="text-3xl">{done.best ? 'Skor terbaik baru!' : 'Selesai!'}</h1>
          <p className="text-lg">
            Skor <strong>{score}</strong> · Benar {right} dari {TOTAL} · <strong>+{done.gained} XP</strong>
          </p>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button variant="sekunder" block onClick={() => start(level)}>
              Main lagi
            </Button>
            <Button block onClick={() => setLevel(null)}>
              Ganti tingkat
            </Button>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page className="max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          to={GAME}
          aria-label="Keluar dari game"
          className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none"
        >
          <Icon name="close" />
        </Link>
        <div className="min-w-0 flex-1">
          <ProgressBar value={time} max={LIMIT} label="Sisa waktu" />
        </div>
        <span className="flex items-center gap-1 font-display text-lg font-semibold">
          <Icon name="clock" size={20} />
          {Math.ceil(time)}
        </span>
      </div>

      <div className="flex items-center justify-between font-display font-semibold">
        <span>
          Soal {i + 1}/{TOTAL}
        </span>
        <span>Skor {score}</span>
      </div>

      <Card key={i} className="animate-pop py-10 text-center">
        <p className="font-display text-6xl font-semibold">{q.text}</p>
        <p className="mt-1 text-tinta/70">=  ?</p>
      </Card>

      <ul className="grid grid-cols-2 gap-3">
        {q.options.map((o) => {
          const isRight = o === q.answer;
          const chosen = o === picked;
          return (
            <li key={o}>
              <button
                type="button"
                disabled={picked !== null}
                onClick={() => answer(o)}
                className={cn(
                  'flex h-20 w-full items-center justify-center rounded-2xl border-2 border-tinta font-display text-3xl font-semibold transition',
                  picked === null && 'bg-gading shadow-stiker active:translate-y-1 active:shadow-none',
                  picked !== null && isRight && 'bg-hijau-100 shadow-stiker',
                  picked !== null && chosen && !isRight && 'animate-getar bg-merah-100',
                  picked !== null && !isRight && !chosen && 'bg-gading opacity-50',
                )}
              >
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="h-6 text-center font-bold">
        {picked === null ? '' : picked === q.answer ? 'Benar!' : picked === -1 ? 'Waktu habis' : `Jawaban benar: ${q.answer}`}
      </p>
    </Page>
  );
}
