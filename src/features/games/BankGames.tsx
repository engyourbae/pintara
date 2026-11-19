import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, Button, ButtonLink, Card, Icon, Mascot, Page, PageHeader, ProgressBar } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { GROUPS } from '@/data/groups';
import { sampleCategories, sampleContents } from '@/data/sample';
import { progressActions, starsFor, useProgress } from '@/hooks/useProgress';
import { cn } from '@/utils/cn';
import type { CategoryGroup, LearningContent, QuizQuestion } from '@/types';
import { localDayKey, seededSample } from './daily';
import { QUICK_LIMIT, comboBonusXp, quickPoints, starsOfBest } from './scoring';

const GAME = `${MODE_BASE.student}/game`;
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const TOTAL = 10;
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const groupOf = (c: LearningContent): CategoryGroup => sampleCategories.find((x) => x.id === c.categoryId)?.group ?? 'sekolah';
const cleanTitle = (c: LearningContent) => c.title.replace(' (contoh)', '');

function StarsRow({ count, size = 20 }: { count: number; size?: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${count} dari 3 bintang`}>
      {[0, 1, 2].map((i) => (
        <Icon key={i} name="star" size={size} className={i < count ? 'fill-kuning-500' : 'text-tinta/25'} />
      ))}
    </span>
  );
}

function ExitButton() {
  return (
    <Link
      to={GAME}
      aria-label="Keluar dari game"
      className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none"
    >
      <Icon name="close" />
    </Link>
  );
}

// ───────── Kuis Kilat Paket ─────────

interface Item {
  q: QuizQuestion;
  order: number[]; // urutan pilihan (indeks asli), diacak per sesi
}

function makeItems(content: LearningContent, daily: boolean): Item[] {
  const qs = daily ? seededSample(content.questions, TOTAL, `${localDayKey()}|${content.id}`) : shuffle(content.questions).slice(0, TOTAL);
  return qs.map((q) => ({ q, order: shuffle(q.options.map((_, i) => i)) }));
}

export function KuisKilatPaket() {
  const p = useProgress();
  const [params, setParams] = useSearchParams();
  const fromLink = sampleContents.find((c) => c.id === params.get('paket'));
  const isDaily = params.get('harian') === '1' && !!fromLink;
  const [content, setContent] = useState<LearningContent | null>(fromLink ?? null);
  const [items, setItems] = useState<Item[]>(() => (fromLink ? makeItems(fromLink, isDaily) : []));
  const [group, setGroup] = useState<CategoryGroup | 'semua'>('semua');
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null); // indeks asli; -1 = waktu habis
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [right, setRight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bonusXp, setBonusXp] = useState(0);
  const [gained, setGained] = useState(0);
  const [done, setDone] = useState<{ xp: number; best: boolean } | null>(null);
  const startRef = useRef(Date.now());

  const playing = !!content && items.length > 0 && !done;
  const item = items[i];
  const answered = picked !== null;

  function begin(c: LearningContent, daily = false) {
    setContent(c);
    setItems(makeItems(c, daily));
    setI(0);
    setPicked(null);
    setElapsed(0);
    setScore(0);
    setRight(0);
    setStreak(0);
    setBestStreak(0);
    setBonusXp(0);
    setGained(0);
    setDone(null);
  }

  function changePack() {
    setContent(null);
    setItems([]);
    setDone(null);
    if (params.get('paket')) setParams({}, { replace: true });
  }

  function choose(opt: number) {
    if (!playing || answered) return;
    const secs = (Date.now() - startRef.current) / 1000;
    const ok = opt === item.q.answerIndex;
    setElapsed(secs);
    setPicked(opt);
    if (ok) {
      const pts = quickPoints(true, secs);
      const nextStreak = streak + 1;
      setGained(pts);
      setScore((s) => s + pts);
      setRight((r) => r + 1);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setBonusXp((x) => x + comboBonusXp(nextStreak));
    } else {
      setGained(0);
      setStreak(0);
    }
  }

  // Waktu per soal: mulai saat soal tampil, berhenti saat dijawab.
  useEffect(() => {
    if (!playing || answered) return;
    startRef.current = Date.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      const s = (Date.now() - startRef.current) / 1000;
      if (s >= QUICK_LIMIT) {
        setElapsed(QUICK_LIMIT);
        setGained(0);
        setStreak(0);
        setPicked(-1);
      } else setElapsed(s);
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, answered, i]);

  function next() {
    if (i + 1 < items.length) {
      setI(i + 1);
      setPicked(null);
      return;
    }
    const xp = right * 3 + bonusXp;
    const wasBest = score > (p.gameBest['kuis-kilat'] ?? 0);
    progressActions.recordGame('kuis-kilat', score, xp);
    setDone({ xp, best: wasBest });
  }

  // Jawaban benar lanjut sendiri; salah/waktu habis menunggu anak membaca penjelasan.
  useEffect(() => {
    if (!answered || picked !== item?.q.answerIndex) return;
    const id = window.setTimeout(next, 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, picked, i]);

  const list = useMemo(() => sampleContents.filter((c) => group === 'semua' || groupOf(c) === group), [group]);

  if (!content) {
    return (
      <Page className="max-w-2xl">
        <PageHeader title="Kuis Kilat" subtitle="10 soal acak dari paket pilihanmu. Makin cepat, makin banyak poin." icon="book" />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter kelompok">
          {[{ id: 'semua' as const, label: 'Semua', icon: 'star' as const }, ...GROUPS].map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => setGroup(g.id)}
              className={cn(
                'flex h-11 shrink-0 items-center gap-2 rounded-full border-2 border-tinta px-4 font-display font-semibold transition',
                group === g.id ? 'bg-aksen text-white shadow-stiker-sm' : 'bg-gading',
              )}
            >
              <Icon name={g.icon} size={18} />
              {g.label}
            </button>
          ))}
        </div>
        <ul className="grid gap-3">
          {list.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => begin(c)}
                className="stiker flex min-h-[64px] w-full items-center gap-3 rounded-2xl bg-gading p-3 text-left transition active:translate-y-1 active:shadow-none"
              >
                <span className="min-w-0 flex-1 font-display text-lg font-semibold leading-snug">{cleanTitle(c)}</span>
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
    const stars = starsFor(right, items.length);
    return (
      <Page className="max-w-2xl">
        <Card tone="catatan" className="flex flex-col items-center gap-4 py-8 text-center">
          <Mascot size={120} mood="hore" className="animate-melayang" />
          <h1 className="text-3xl">{done.best ? 'Skor terbaik baru!' : 'Selesai!'}</h1>
          <StarsRow count={stars} size={48} />
          <p className="text-lg">
            Skor <strong>{score}</strong> · Benar {right} dari {items.length} · Beruntun terbaik {bestStreak} · <strong>+{done.xp} XP</strong>
          </p>
          {isDaily && <p className="text-sm text-tinta/75">Tantangan hari ini: soalnya sama untuk semua murid hari ini. Belum ada hadiah khusus.</p>}
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button variant="sekunder" block onClick={() => begin(content, isDaily)}>
              Main lagi
            </Button>
            <Button block onClick={changePack}>
              Ganti paket
            </Button>
          </div>
          <ButtonLink to={GAME} variant="ghost">
            Kembali ke menu game
          </ButtonLink>
        </Card>
      </Page>
    );
  }

  if (!item) return null;
  const right1 = picked === item.q.answerIndex;
  return (
    <Page className="max-w-2xl">
      <div className="flex items-center gap-3">
        <ExitButton />
        <div className="min-w-0 flex-1">
          <ProgressBar value={answered ? 0 : Math.max(0, QUICK_LIMIT - elapsed)} max={QUICK_LIMIT} label="Sisa waktu" />
        </div>
        <span className="flex items-center gap-1 font-display text-lg font-semibold">
          <Icon name="clock" size={20} />
          {Math.ceil(Math.max(0, QUICK_LIMIT - elapsed))}
        </span>
      </div>
      <div className="flex items-center justify-between font-display font-semibold">
        <span>
          Soal {i + 1}/{items.length}
        </span>
        <span className="flex items-center gap-2">
          {streak >= 2 && (
            <span key={streak} className="animate-pop flex items-center gap-1 rounded-full border-2 border-tinta bg-jingga-300 px-2 py-0.5 text-sm">
              <Icon name="flame" size={16} />×{streak}
            </span>
          )}
          Skor {score}
        </span>
      </div>
      <Card key={i} className="animate-pop space-y-1">
        <p className="text-sm font-bold text-aksen-tua">{isDaily ? 'Tantangan hari ini · ' : ''}{cleanTitle(content)}</p>
        <h1 className="text-2xl leading-snug">{item.q.prompt}</h1>
      </Card>
      <ul className="grid gap-3">
        {item.order.map((opt, pos) => {
          const ok = opt === item.q.answerIndex;
          const chosen = opt === picked;
          return (
            <li key={opt}>
              <button
                type="button"
                disabled={answered}
                onClick={() => choose(opt)}
                className={cn(
                  'flex min-h-[64px] w-full items-center gap-3 rounded-2xl border-2 border-tinta p-3 text-left text-lg font-semibold transition',
                  !answered && 'bg-gading shadow-stiker active:translate-y-1 active:shadow-none',
                  answered && ok && 'bg-hijau-100 shadow-stiker',
                  answered && chosen && !ok && 'animate-getar bg-merah-100',
                  answered && !ok && !chosen && 'opacity-50',
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-tinta bg-white font-display">{LETTERS[pos]}</span>
                {item.q.options[opt]}
              </button>
            </li>
          );
        })}
      </ul>
      {answered && (
        <Card tone="catatan" className="space-y-3">
          <p key={`${i}-${picked}`} className={cn('font-display text-2xl font-semibold', right1 ? 'animate-pop text-hijau-700' : 'animate-getar text-aksen-tua')}>
            {right1 ? `Benar! +${gained} poin (${Math.max(0.1, Math.round(elapsed * 10) / 10)} dtk)` : picked === -1 ? 'Waktu habis' : 'Belum tepat'}
          </p>
          {!right1 && (
            <>
              <p className="text-lg">{item.q.explanation}</p>
              <Button size="lg" block onClick={next}>
                {i + 1 < items.length ? 'Soal berikutnya' : 'Lihat hasil'}
                <Icon name="arrow" size={22} />
              </Button>
            </>
          )}
        </Card>
      )}
    </Page>
  );
}

// ───────── Benar atau Salah Kilat ─────────

const BS_SECONDS = 30;
const BS_LIVES = 3;

interface Statement {
  title: string;
  prompt: string;
  shown: string;
  truth: boolean;
}

function makeStatement(used: Set<string>): Statement {
  for (let tries = 0; tries < 40; tries++) {
    const c = sampleContents[Math.floor(Math.random() * sampleContents.length)];
    const qi = Math.floor(Math.random() * c.questions.length);
    const key = `${c.id}:${qi}`;
    if (used.has(key) && tries < 39) continue;
    used.add(key);
    const q = c.questions[qi];
    const truth = Math.random() < 0.5;
    const wrong = q.options.filter((_, k) => k !== q.answerIndex);
    return { title: cleanTitle(c), prompt: q.prompt, shown: truth ? q.options[q.answerIndex] : wrong[Math.floor(Math.random() * wrong.length)], truth };
  }
  throw new Error('NO_STATEMENT');
}

export function BenarSalahKilat() {
  const p = useProgress();
  const used = useRef(new Set<string>());
  const deadline = useRef(0);
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [st, setSt] = useState<Statement | null>(null);
  const [left, setLeft] = useState(BS_SECONDS);
  const [lives, setLives] = useState(BS_LIVES);
  const [score, setScore] = useState(0);
  const [right, setRight] = useState(0);
  const [flash, setFlash] = useState<null | boolean>(null); // hasil jawaban terakhir (benar/salah)
  const [result, setResult] = useState<{ xp: number; best: boolean } | null>(null);
  const finished = useRef(false);

  function start() {
    used.current = new Set();
    deadline.current = Date.now() + BS_SECONDS * 1000;
    finished.current = false;
    setSt(makeStatement(used.current));
    setLeft(BS_SECONDS);
    setLives(BS_LIVES);
    setScore(0);
    setRight(0);
    setFlash(null);
    setResult(null);
    setPhase('play');
  }

  function finish(finalScore: number, finalRight: number) {
    if (finished.current) return;
    finished.current = true;
    const xp = Math.min(30, finalRight * 2);
    const best = finalScore > (p.gameBest['benar-salah'] ?? 0);
    progressActions.recordGame('benar-salah', finalScore, xp);
    setResult({ xp, best });
    setPhase('done');
  }

  // Jam 30 detik berjalan terus, termasuk saat umpan balik singkat.
  useEffect(() => {
    if (phase !== 'play') return;
    const id = window.setInterval(() => {
      const s = Math.max(0, (deadline.current - Date.now()) / 1000);
      setLeft(s);
      if (s <= 0) finish(score, right);
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, score, right]);

  function answer(choice: boolean) {
    if (phase !== 'play' || flash !== null || !st) return;
    const ok = choice === st.truth;
    setFlash(ok);
    const nextScore = ok ? score + 10 : score;
    const nextRight = ok ? right + 1 : right;
    const nextLives = ok ? lives : lives - 1;
    if (ok) {
      setScore(nextScore);
      setRight(nextRight);
    } else setLives(nextLives);
    window.setTimeout(() => {
      if (finished.current) return;
      if (nextLives <= 0) return finish(nextScore, nextRight);
      setSt(makeStatement(used.current));
      setFlash(null);
    }, 450);
  }

  const best = p.gameBest['benar-salah'] ?? 0;

  if (phase === 'intro') {
    return (
      <Page className="max-w-2xl">
        <PageHeader title="Benar atau Salah Kilat" subtitle="Soal dan jawabannya sudah ada. Tebak: jawabannya benar atau salah?" icon="check" />
        <Card className="space-y-3">
          <ul className="space-y-2 text-lg">
            <li>⏱ {BS_SECONDS} detik, secepat mungkin.</li>
            <li>❤️ {BS_LIVES} nyawa. Salah menjawab = nyawa berkurang.</li>
            <li>⭐ Tiap jawaban benar +10 poin.</li>
          </ul>
          {best > 0 && (
            <p className="flex items-center gap-2 font-bold text-aksen-tua">
              Skor terbaik: {best} <StarsRow count={starsOfBest('benar-salah', best)} size={18} />
            </p>
          )}
          <p className="text-sm text-tinta/75">Soal diambil dari bank soal. Sebagian teks ditulis AI dan belum ditinjau guru.</p>
          <Button size="lg" block onClick={start}>
            <Icon name="play" size={22} />
            Mulai
          </Button>
        </Card>
        <ButtonLink to={GAME} variant="sekunder">
          Kembali
        </ButtonLink>
      </Page>
    );
  }

  if (phase === 'done' && result) {
    const stars = starsOfBest('benar-salah', score);
    return (
      <Page className="max-w-2xl">
        <Card tone="catatan" className="flex flex-col items-center gap-4 py-8 text-center">
          <Mascot size={120} mood="hore" className="animate-melayang" />
          <h1 className="text-3xl">{result.best ? 'Skor terbaik baru!' : 'Selesai!'}</h1>
          <StarsRow count={stars} size={48} />
          <p className="text-lg">
            Skor <strong>{score}</strong> · {right} jawaban benar · <strong>+{result.xp} XP</strong>
          </p>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button variant="sekunder" block onClick={start}>
              Main lagi
            </Button>
            <ButtonLink to={GAME} block>
              Menu game
            </ButtonLink>
          </div>
        </Card>
      </Page>
    );
  }

  if (!st) return null;
  return (
    <Page className="max-w-2xl">
      <div className="flex items-center gap-3">
        <ExitButton />
        <div className="min-w-0 flex-1">
          <ProgressBar value={left} max={BS_SECONDS} label="Sisa waktu" />
        </div>
        <span className="flex items-center gap-1 font-display text-lg font-semibold">
          <Icon name="clock" size={20} />
          {Math.ceil(left)}
        </span>
      </div>
      <div className="flex items-center justify-between font-display font-semibold">
        <span className="flex gap-1" role="img" aria-label={`${lives} nyawa`}>
          {Array.from({ length: BS_LIVES }, (_, k) => (
            <Icon key={k} name="heart" size={24} className={k < lives ? 'fill-merah-600 text-merah-600' : 'text-tinta/25'} />
          ))}
        </span>
        <span>Skor {score}</span>
      </div>
      <Card key={`${st.prompt}-${st.shown}`} className="animate-pop space-y-3 text-center">
        <Badge tone="netral">{st.title}</Badge>
        <p className="text-xl leading-snug">{st.prompt}</p>
        <p className="font-display text-3xl font-semibold">
          <span className="text-tinta/70">Jawaban: </span>
          {st.shown}
        </p>
        <p className="text-tinta/80">Apakah jawaban itu benar?</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={flash !== null}
          onClick={() => answer(true)}
          className={cn(
            'flex h-20 items-center justify-center gap-2 rounded-2xl border-2 border-tinta font-display text-2xl font-semibold transition',
            flash === null && 'bg-hijau-300 shadow-stiker active:translate-y-1 active:shadow-none',
            flash !== null && st.truth && 'bg-hijau-100 shadow-stiker',
            flash !== null && !st.truth && 'bg-gading opacity-50',
          )}
        >
          <Icon name="check" size={28} />
          Benar
        </button>
        <button
          type="button"
          disabled={flash !== null}
          onClick={() => answer(false)}
          className={cn(
            'flex h-20 items-center justify-center gap-2 rounded-2xl border-2 border-tinta font-display text-2xl font-semibold transition',
            flash === null && 'bg-jingga-300 shadow-stiker active:translate-y-1 active:shadow-none',
            flash !== null && !st.truth && 'bg-hijau-100 shadow-stiker',
            flash !== null && st.truth && 'bg-gading opacity-50',
          )}
        >
          <Icon name="close" size={28} />
          Salah
        </button>
      </div>
      <p aria-live="polite" className="h-6 text-center font-bold">
        {flash === null ? '' : flash ? 'Tepat!' : 'Ups, belum tepat'}
      </p>
    </Page>
  );
}
