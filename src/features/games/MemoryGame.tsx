import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, ButtonLink, Card, Icon, Mascot, Page, PageHeader } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { progressActions, useProgress } from '@/hooks/useProgress';
import { cn } from '@/utils/cn';
import { memoryScore, memoryStars, starsOfBest } from './scoring';

const GAME = `${MODE_BASE.student}/game`;

type Pair = [string, string];
interface Theme {
  id: string;
  label: string;
  desc: string;
  pairs: Pair[];
}

/** Pasangan kartu. Dibuat tangan agar jawabannya pasti (tidak ada pasangan ganda). */
const THEMES: Theme[] = [
  {
    id: 'inggris',
    label: 'Kata – Arti',
    desc: 'Kata B. Inggris dan artinya.',
    pairs: [['apple', 'apel'], ['book', 'buku'], ['cat', 'kucing'], ['dog', 'anjing'], ['house', 'rumah'], ['water', 'air'], ['school', 'sekolah'], ['teacher', 'guru'], ['red', 'merah'], ['fish', 'ikan']],
  },
  {
    id: 'pecahan',
    label: 'Pecahan – Desimal',
    desc: 'Cocokkan pecahan dengan bentuk desimalnya.',
    pairs: [['1/2', '0,5'], ['1/4', '0,25'], ['3/4', '0,75'], ['1/5', '0,2'], ['1/10', '0,1'], ['2/5', '0,4'], ['3/10', '0,3'], ['4/5', '0,8'], ['7/10', '0,7']],
  },
  {
    id: 'hewan',
    label: 'Hewan – Habitat',
    desc: 'Di mana hewan ini tinggal?',
    pairs: [['Unta', 'Gurun'], ['Beruang kutub', 'Kutub Utara'], ['Pinguin', 'Kutub Selatan'], ['Paus', 'Laut'], ['Orangutan', 'Hutan hujan'], ['Kelelawar', 'Gua'], ['Cacing tanah', 'Dalam tanah'], ['Singa', 'Savana'], ['Bebek', 'Kolam']],
  },
  {
    id: 'pancasila',
    label: 'Sila – Lambang',
    desc: 'Sila Pancasila dan lambangnya (5 pasang).',
    pairs: [['1 Ketuhanan', 'Bintang'], ['2 Kemanusiaan', 'Rantai'], ['3 Persatuan', 'Pohon beringin'], ['4 Kerakyatan', 'Kepala banteng'], ['5 Keadilan', 'Padi dan kapas']],
  },
];
const MIXED: Theme = { id: 'campur', label: 'Campur', desc: 'Pasangan dari semua tema.', pairs: THEMES.flatMap((t) => t.pairs) };
const ALL_THEMES = [...THEMES, MIXED];
const LEVELS = [4, 6, 8] as const;

interface CardData {
  uid: number;
  pair: number;
  text: string;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function makeDeck(theme: Theme, pairs: number): CardData[] {
  const chosen = shuffle(theme.pairs).slice(0, pairs);
  const cards = chosen.flatMap(([a, b], i) => [
    { uid: i * 2, pair: i, text: a },
    { uid: i * 2 + 1, pair: i, text: b },
  ]);
  return shuffle(cards);
}

export function PasanganMemori() {
  const p = useProgress();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>(4);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [open, setOpen] = useState<number[]>([]); // uid kartu terbuka sementara
  const [matched, setMatched] = useState<number[]>([]); // nomor pasangan yang sudah cocok
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState<{ stars: number; xp: number; best: boolean } | null>(null);
  const startedAt = useRef(0);
  const locked = useRef(false);

  const maxPairs = theme ? theme.pairs.length : 0;
  const playing = deck.length > 0 && !done;

  function start(t: Theme, pairs: number) {
    const n = Math.min(pairs, t.pairs.length);
    setTheme(t);
    setDeck(makeDeck(t, n));
    setOpen([]);
    setMatched([]);
    setMoves(0);
    setSeconds(0);
    setDone(null);
    startedAt.current = 0;
    locked.current = false;
  }

  // Waktu berjalan sejak kartu pertama dibuka.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      if (startedAt.current) setSeconds((Date.now() - startedAt.current) / 1000);
    }, 250);
    return () => window.clearInterval(id);
  }, [playing]);

  function flip(c: CardData) {
    if (locked.current || done || open.includes(c.uid) || matched.includes(c.pair)) return;
    if (!startedAt.current) startedAt.current = Date.now();
    const next = [...open, c.uid];
    setOpen(next);
    if (next.length < 2) return;
    const [a, b] = next.map((u) => deck.find((d) => d.uid === u)!);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    locked.current = true;
    if (a.pair === b.pair) {
      window.setTimeout(() => {
        const all = [...matched, a.pair];
        setMatched(all);
        setOpen([]);
        locked.current = false;
        if (all.length === deck.length / 2) finish(nextMoves);
      }, 450);
    } else {
      window.setTimeout(() => {
        setOpen([]);
        locked.current = false;
      }, 900);
    }
  }

  function finish(finalMoves: number) {
    const secs = (Date.now() - startedAt.current) / 1000;
    const pairs = deck.length / 2;
    const stars = memoryStars(finalMoves, pairs);
    const key = `memori-${pairs <= 4 ? 4 : pairs <= 6 ? 6 : 8}`;
    const score = memoryScore(stars, secs);
    const xp = pairs + stars * 3;
    const best = score > (p.gameBest[key] ?? 0);
    progressActions.recordGame(key, score, xp);
    setSeconds(secs);
    setDone({ stars, xp, best });
  }

  const cols = deck.length <= 8 ? 'grid-cols-4' : deck.length <= 12 ? 'grid-cols-3' : 'grid-cols-4';
  const bestStars = useMemo(() => LEVELS.map((n) => starsOfBest(`memori-${n}`, p.gameBest[`memori-${n}`] ?? 0)), [p.gameBest]);

  if (!theme) {
    return (
      <Page className="max-w-2xl">
        <PageHeader title="Pasangan Memori" subtitle="Cari kartu yang berpasangan." icon="chip" />
        <Card className="space-y-3">
          <h2 className="text-xl">Berapa pasang?</h2>
          <div className="grid grid-cols-3 gap-3" role="group" aria-label="Tingkat kesulitan">
            {LEVELS.map((n, i) => (
              <button
                key={n}
                type="button"
                aria-pressed={level === n}
                onClick={() => setLevel(n)}
                className={cn(
                  'flex min-h-[64px] flex-col items-center justify-center rounded-2xl border-2 border-tinta font-display font-semibold transition',
                  level === n ? 'bg-kuning-300 shadow-stiker' : 'bg-gading',
                )}
              >
                <span className="text-2xl">{n}</span>
                <span className="text-xs">{bestStars[i] > 0 ? `${'★'.repeat(bestStars[i])}${'☆'.repeat(3 - bestStars[i])}` : 'pasang'}</span>
              </button>
            ))}
          </div>
        </Card>
        <h2 className="font-display text-xl font-semibold">Pilih tema</h2>
        <ul className="grid gap-3">
          {ALL_THEMES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => start(t, level)}
                className="stiker flex min-h-[72px] w-full items-center gap-4 rounded-3xl bg-gading p-4 text-left transition active:translate-y-1 active:shadow-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-semibold">{t.label}</span>
                  <span className="block text-tinta/80">{t.desc}</span>
                </span>
                {t.pairs.length < level && <Badge tone="netral">maks {t.pairs.length}</Badge>}
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
          <h1 className="text-3xl">{done.best ? 'Rekor baru!' : 'Semua cocok!'}</h1>
          <div className="flex gap-1" role="img" aria-label={`${done.stars} dari 3 bintang`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="animate-pop" style={{ animationDelay: `${i * 180}ms` }}>
                <Icon name="star" size={52} className={i < done.stars ? 'fill-kuning-500' : 'text-tinta/25'} />
              </span>
            ))}
          </div>
          <p className="text-lg">
            {moves} langkah · {Math.round(seconds)} detik · <strong>+{done.xp} XP</strong>
          </p>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button variant="sekunder" block onClick={() => start(theme, deck.length / 2)}>
              Main lagi
            </Button>
            <Button block onClick={() => { setTheme(null); setDeck([]); setDone(null); }}>
              Ganti tema
            </Button>
          </div>
          <ButtonLink to={GAME} variant="ghost">
            Kembali ke menu game
          </ButtonLink>
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
        <h1 className="min-w-0 flex-1 truncate font-display text-xl font-semibold">{theme.label}</h1>
        <span className="flex items-center gap-1 font-display text-lg font-semibold">
          <Icon name="clock" size={20} />
          {Math.floor(seconds)}
        </span>
      </div>
      <div className="flex items-center justify-between font-display font-semibold">
        <span>Langkah {moves}</span>
        <span>
          {matched.length}/{deck.length / 2} pasang
        </span>
      </div>
      <ul className={cn('grid gap-2', cols)}>
        {deck.map((c) => {
          const faceUp = open.includes(c.uid) || matched.includes(c.pair);
          const ok = matched.includes(c.pair);
          return (
            <li key={c.uid}>
              <button
                type="button"
                aria-label={faceUp ? c.text : 'Kartu tertutup'}
                aria-pressed={faceUp}
                onClick={() => flip(c)}
                className={cn(
                  'flex aspect-square min-h-[72px] w-full items-center justify-center rounded-2xl border-2 border-tinta p-1 text-center font-display font-semibold leading-tight transition',
                  !faceUp && 'bg-langit-300 shadow-stiker active:translate-y-1 active:shadow-none',
                  faceUp && !ok && 'animate-pop bg-kuning-100 shadow-stiker',
                  ok && 'bg-hijau-100',
                )}
              >
                {faceUp ? <span className={cn('break-words', c.text.length > 9 ? 'text-xs sm:text-base' : 'text-sm sm:text-lg')}>{c.text}</span> : <Icon name="star" size={26} className="text-white" />}
              </button>
            </li>
          );
        })}
      </ul>
      {maxPairs < level && <p className="text-center text-sm text-tinta/75">Tema ini hanya punya {maxPairs} pasang.</p>}
    </Page>
  );
}
