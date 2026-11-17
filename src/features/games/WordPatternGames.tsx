import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, ButtonLink, Card, Icon, Mascot, Page, ProgressBar } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { progressActions } from '@/hooks/useProgress';
import { cn } from '@/utils/cn';

const GAME = `${MODE_BASE.student}/game`;
const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function GameTop({ progress, label, right }: { progress: number; label: string; right: string }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          to={GAME}
          aria-label="Keluar dari game"
          className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none"
        >
          <Icon name="close" />
        </Link>
        <div className="min-w-0 flex-1">
          <ProgressBar value={progress} label="Kemajuan game" />
        </div>
      </div>
      <div className="flex items-center justify-between font-display font-semibold">
        <span>{label}</span>
        <span>{right}</span>
      </div>
    </>
  );
}

function GameResult(props: { title: string; score: number; right: number; total: number; gained: number; onAgain: () => void }) {
  return (
    <Page className="max-w-2xl">
      <Card tone="catatan" className="flex flex-col items-center gap-4 py-8 text-center">
        <Mascot size={120} mood="hore" className="animate-melayang" />
        <h1 className="text-3xl">{props.title}</h1>
        <p className="text-lg">
          Skor <strong>{props.score}</strong> · Benar {props.right} dari {props.total} · <strong>+{props.gained} XP</strong>
        </p>
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <Button variant="sekunder" block onClick={props.onAgain}>
            Main lagi
          </Button>
          <ButtonLink to={GAME} block>
            Pilih game
          </ButtonLink>
        </div>
      </Card>
    </Page>
  );
}

/* ───────────────────────── Susun Kata ───────────────────────── */

const WORDS: [string, string][] = [
  ['BUKU', 'Dibaca di sekolah'],
  ['MEJA', 'Tempat menaruh buku saat belajar'],
  ['KUCING', 'Hewan berkumis yang suka mengeong'],
  ['SEKOLAH', 'Tempat kamu belajar bersama guru'],
  ['PENSIL', 'Dipakai untuk menulis, bisa dihapus'],
  ['SEPEDA', 'Kendaraan roda dua yang dikayuh'],
  ['BUNGA', 'Tumbuh di taman, harum dan berwarna'],
  ['APEL', 'Buah bulat, bisa merah atau hijau'],
  ['RUMAH', 'Tempat tinggal keluarga'],
  ['IKAN', 'Hidup di air dan bernapas dengan insang'],
  ['MATAHARI', 'Bersinar di langit pada siang hari'],
  ['GURU', 'Orang yang mengajar di kelas'],
  ['BOLA', 'Bulat, ditendang saat main sepak bola'],
  ['LAMPU', 'Menerangi ruangan saat gelap'],
  ['KELAS', 'Ruangan tempat siswa belajar'],
];
const WORD_ROUNDS = 6;

function scramble(word: string): string[] {
  const letters = word.split('');
  let s = shuffle(letters);
  while (s.join('') === word) s = shuffle(letters);
  return s;
}

type WordStatus = 'main' | 'benar' | 'salah' | 'terbuka';

export function SusunKata() {
  const [words, setWords] = useState(() => shuffle(WORDS).slice(0, WORD_ROUNDS));
  const [r, setR] = useState(0);
  const [tiles, setTiles] = useState(() => scramble(words[0][0]));
  const [picked, setPicked] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [status, setStatus] = useState<WordStatus>('main');
  const [score, setScore] = useState(0);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState<number | null>(null);

  const [word, hint] = words[r];

  function restart() {
    const w = shuffle(WORDS).slice(0, WORD_ROUNDS);
    setWords(w);
    setR(0);
    setTiles(scramble(w[0][0]));
    setPicked([]);
    setTries(0);
    setStatus('main');
    setScore(0);
    setRight(0);
    setDone(null);
  }

  function pick(i: number) {
    if (status !== 'main' || picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length < word.length) return;
    const guess = next.map((k) => tiles[k]).join('');
    if (guess === word) {
      setStatus('benar');
      setScore((s) => s + (tries === 0 ? 15 : 8));
      setRight((x) => x + 1);
    } else {
      setTries(tries + 1);
      setStatus(tries + 1 >= 2 ? 'terbuka' : 'salah');
    }
  }

  useEffect(() => {
    if (status === 'main') return;
    const id = window.setTimeout(() => {
      if (status === 'salah') {
        setPicked([]);
        setStatus('main');
        return;
      }
      if (r + 1 < WORD_ROUNDS) {
        setR(r + 1);
        setTiles(scramble(words[r + 1][0]));
        setPicked([]);
        setTries(0);
        setStatus('main');
      } else {
        const gained = right * 6;
        progressActions.recordGame('susun-kata', score, gained);
        setDone(gained);
      }
    }, status === 'salah' ? 800 : 1100);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (done !== null) {
    return <GameResult title={right === WORD_ROUNDS ? 'Sempurna!' : 'Selesai!'} score={score} right={right} total={WORD_ROUNDS} gained={done} onAgain={restart} />;
  }

  const shown = status === 'terbuka' ? word.split('') : picked.map((k) => tiles[k]);
  return (
    <Page className="max-w-2xl">
      <GameTop progress={(r / WORD_ROUNDS) * 100} label={`Kata ${r + 1}/${WORD_ROUNDS}`} right={`Skor ${score}`} />

      <Card tone="langit" className="space-y-1 text-center">
        <p className="text-sm font-bold text-tinta/70">Petunjuk</p>
        <h1 className="text-2xl leading-snug">{hint}</h1>
      </Card>

      <div
        aria-live="polite"
        className={cn('flex flex-wrap justify-center gap-2', status === 'salah' && 'animate-getar')}
        aria-label="Jawabanmu"
      >
        {word.split('').map((_, i) => (
          <span
            key={i}
            className={cn(
              'flex h-14 w-12 items-center justify-center rounded-2xl border-2 border-tinta font-display text-3xl font-semibold',
              status === 'benar' ? 'bg-hijau-100' : status === 'salah' ? 'bg-merah-100' : status === 'terbuka' ? 'bg-kuning-100' : 'bg-white',
            )}
          >
            {shown[i] ?? ''}
          </span>
        ))}
      </div>
      <p className="h-6 text-center font-bold" aria-live="polite">
        {status === 'benar' ? 'Benar! Hebat!' : status === 'salah' ? 'Belum tepat, coba lagi' : status === 'terbuka' ? `Jawabannya: ${word}` : ''}
      </p>

      <ul className="flex flex-wrap justify-center gap-3">
        {tiles.map((ch, i) => (
          <li key={i}>
            <button
              type="button"
              disabled={status !== 'main' || picked.includes(i)}
              onClick={() => pick(i)}
              className="stiker flex h-14 w-12 items-center justify-center rounded-2xl bg-gading font-display text-3xl font-semibold transition active:translate-y-1 active:shadow-none disabled:opacity-30 disabled:shadow-none"
            >
              {ch}
            </button>
          </li>
        ))}
      </ul>

      <Button variant="sekunder" block disabled={status !== 'main' || picked.length === 0} onClick={() => setPicked(picked.slice(0, -1))}>
        Hapus huruf terakhir
      </Button>
    </Page>
  );
}

/* ───────────────────────── Teka Pola ───────────────────────── */

type Shape = 'lingkaran' | 'kotak' | 'segitiga' | 'bintang';
interface Token {
  shape: Shape;
  color: string;
}
type PolaQ =
  | { kind: 'bentuk'; seq: Token[]; options: Token[]; answer: number }
  | { kind: 'angka'; seq: number[]; options: number[]; answer: number };

const SHAPES: Shape[] = ['lingkaran', 'kotak', 'segitiga', 'bintang'];
const COLORS = ['#478F3A', '#F28A3B', '#4A9AD0', '#F5C000'];
const POLA_ROUNDS = 8;

function ShapeIcon({ t, size = 44 }: { t: Token; size?: number }) {
  const common = { fill: t.color, stroke: '#2A3328', strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" role="img" aria-label={`${t.shape}`}>
      {t.shape === 'lingkaran' && <circle cx="22" cy="22" r="17" {...common} />}
      {t.shape === 'kotak' && <rect x="6" y="6" width="32" height="32" rx="6" {...common} />}
      {t.shape === 'segitiga' && <polygon points="22,5 40,38 4,38" {...common} />}
      {t.shape === 'bintang' && (
        <polygon points="22,3 27,16 41,17 30,26 34,40 22,32 10,40 14,26 3,17 17,16" {...common} />
      )}
    </svg>
  );
}

function makePola(): PolaQ {
  if (Math.random() < 0.5) {
    const shapes = shuffle(SHAPES);
    const colors = shuffle(COLORS);
    const pool: Token[] = shapes.map((shape, i) => ({ shape, color: colors[i] }));
    const unitLen = rand(2, 3);
    const unit = pool.slice(0, unitLen);
    const len = unitLen * 2 + rand(0, unitLen - 1);
    const seq = Array.from({ length: len }, (_, i) => unit[i % unitLen]);
    const next = unit[len % unitLen];
    const options = shuffle(pool);
    return { kind: 'bentuk', seq, options, answer: options.findIndex((o) => o === next) };
  }
  const step = [2, 3, 4, 5, 10][rand(0, 4)];
  const up = Math.random() < 0.6;
  const start = up ? rand(1, 20) : rand(step * 6, step * 6 + 20);
  const seq = Array.from({ length: 5 }, (_, i) => start + (up ? 1 : -1) * step * i);
  const next = seq[4] + (up ? 1 : -1) * step;
  const set = new Set<number>([next]);
  const cand = shuffle([-2, -1, 1, 2, step, -step, step + 1]).map((d) => next + d);
  for (const c of cand) {
    if (set.size >= 4) break;
    if (c >= 0) set.add(c);
  }
  const options = shuffle([...set]);
  return { kind: 'angka', seq, options, answer: options.indexOf(next) };
}

export function TekaPola() {
  const [qs, setQs] = useState(() => Array.from({ length: POLA_ROUNDS }, makePola));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState<number | null>(null);
  const score = right * 10;
  const q = qs[i];

  function restart() {
    setQs(Array.from({ length: POLA_ROUNDS }, makePola));
    setI(0);
    setPicked(null);
    setRight(0);
    setDone(null);
  }

  function choose(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer) setRight((x) => x + 1);
  }

  useEffect(() => {
    if (picked === null) return;
    const id = window.setTimeout(() => {
      if (i + 1 < POLA_ROUNDS) {
        setI(i + 1);
        setPicked(null);
      } else {
        const gained = right * 5;
        progressActions.recordGame('teka-pola', right * 10, gained);
        setDone(gained);
      }
    }, 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  if (done !== null) {
    return (
      <GameResult
        title={right === POLA_ROUNDS ? 'Sempurna!' : 'Selesai!'}
        score={score}
        right={right}
        total={POLA_ROUNDS}
        gained={done}
        onAgain={restart}
      />
    );
  }

  return (
    <Page className="max-w-2xl">
      <GameTop progress={(i / POLA_ROUNDS) * 100} label={`Soal ${i + 1}/${POLA_ROUNDS}`} right={`Skor ${score}`} />

      <Card key={i} className="animate-pop space-y-3 text-center">
        <h1 className="text-xl">Apa yang selanjutnya?</h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {q.kind === 'bentuk'
            ? q.seq.map((t, k) => (
                <span key={k} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
                  <ShapeIcon t={t} />
                </span>
              ))
            : q.seq.map((n, k) => (
                <span key={k} className="flex h-14 min-w-14 items-center justify-center rounded-2xl bg-white px-2 font-display text-2xl font-semibold">
                  {n}
                </span>
              ))}
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-tinta bg-kuning-100 font-display text-3xl font-semibold">
            ?
          </span>
        </div>
      </Card>

      <ul className="grid grid-cols-2 gap-3">
        {(q.options as (Token | number)[]).map((o, idx) => {
          const isRight = idx === q.answer;
          const chosen = idx === picked;
          return (
            <li key={idx}>
              <button
                type="button"
                disabled={picked !== null}
                aria-label={typeof o === 'number' ? String(o) : o.shape}
                onClick={() => choose(idx)}
                className={cn(
                  'flex h-20 w-full items-center justify-center rounded-2xl border-2 border-tinta font-display text-3xl font-semibold transition',
                  picked === null && 'bg-gading shadow-stiker active:translate-y-1 active:shadow-none',
                  picked !== null && isRight && 'bg-hijau-100 shadow-stiker',
                  picked !== null && chosen && !isRight && 'animate-getar bg-merah-100',
                  picked !== null && !isRight && !chosen && 'bg-gading opacity-50',
                )}
              >
                {typeof o === 'number' ? o : <ShapeIcon t={o} size={48} />}
              </button>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="h-6 text-center font-bold">
        {picked === null ? '' : picked === q.answer ? 'Benar!' : 'Belum tepat, lihat jawaban yang benar.'}
      </p>
    </Page>
  );
}
