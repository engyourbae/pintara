import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, ButtonLink, Card, Icon, Mascot, Page, PageHeader, ProgressBar, SampleBadge, SearchBox, Sparkle, matchesSearch } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { GROUPS, GROUP_BY_ID } from '@/data/groups';
import { isSampleContent, sampleCategories, sampleContents } from '@/data/sample';
import { progressActions, starsFor, useProgress } from '@/hooks/useProgress';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import type { CategoryGroup, LearningContent, QuizQuestion } from '@/types';
import { currentLevel, levelsOf, remainingOf } from './levels';

/** Duel membawa SDK Firebase; dimuat hanya saat tombol "Duel dengan teman" ditekan. */
const PackDuelPicker = lazy(() => import('@/features/friends/PackDuelPicker').then((m) => ({ default: m.PackDuelPicker })));
const BELAJAR = `${MODE_BASE.student}/belajar`;
const categoryName = (id: string) => sampleCategories.find((c) => c.id === id)?.name ?? id;
const groupOf = (c: LearningContent): CategoryGroup =>
  sampleCategories.find((x) => x.id === c.categoryId)?.group ?? 'sekolah';

function Stars({ count, size = 20 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${count} dari 3 bintang`}>
      {[0, 1, 2].map((i) => (
        <Icon key={i} name="star" size={size} className={i < count ? 'fill-kuning-500' : 'text-tinta/30'} />
      ))}
    </span>
  );
}

export function LearnList() {
  const p = useProgress();
  const [group, setGroup] = useState<CategoryGroup | 'semua'>('semua');
  const [search, setSearch] = useState('');
  const items = sampleContents.filter((c) => (group === 'semua' || groupOf(c) === group) && matchesSearch(`${c.title} ${categoryName(c.categoryId)}`, search));

  return (
    <Page>
      <PageHeader title="Belajar" subtitle="Pilih paket kuis, kumpulkan bintang." icon="book" aside={items.some(isSampleContent) ? <SampleBadge label="DATA SOAL" /> : undefined} />

      <SearchBox value={search} onChange={setSearch} label="Cari pelajaran" placeholder="Cari pelajaran, mis. pecahan…" />

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

      {items.length === 0 ? (
        <Card tone="catatan">{search.trim() ? `Tidak ada pelajaran yang cocok dengan "${search.trim()}".` : 'Belum ada paket kuis untuk kelompok ini. Isi lengkap menyusul.'}</Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((c, i) => {
            const g = GROUP_BY_ID[groupOf(c)];
            const lv = levelsOf(c, new Set(p.levelDone?.[c.id] ?? []));
            const cur = currentLevel(lv);
            return (
              <li key={c.id} className="animate-naik" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <Link
                  to={`${BELAJAR}/${c.id}`}
                  className="stiker flex h-full flex-col gap-3 rounded-3xl bg-gading p-4 transition active:translate-y-1 active:shadow-none"
                >
                  <div className="flex items-start gap-3">
                    <span className={cn('stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', g.bg)}>
                      <Icon name={g.icon} size={26} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold leading-snug">{c.title.replace(' (contoh)', '')}</p>
                      <p className="text-sm text-tinta/75">{categoryName(c.categoryId)}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="hijau">Kelas {c.grades.join(', ')}</Badge>
                      <Badge tone="netral">{c.questions.length} soal</Badge>
                      <Badge tone="langit">{cur === -1 ? 'Semua level selesai' : `Level ${cur + 1}/${lv.length}`}</Badge>
                    </div>
                    <Stars count={p.stars[c.id] ?? 0} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

interface QuizPageProps {
  /** Path daftar kuis tempat tombol "keluar/kembali" mengarah. Bawaan: ruang siswa. */
  base?: string;
  /** Pratinjau guru: tidak mencatat XP/bintang/hasil apa pun. */
  preview?: boolean;
}

export function QuizPage({ base = BELAJAR, preview = false }: QuizPageProps) {
  const { contentId } = useParams();
  const content = sampleContents.find((c) => c.id === contentId);
  if (!content) {
    return (
      <Page>
        <PageHeader title="Kuis tidak ditemukan" icon="book" />
        <ButtonLink to={base} variant="sekunder">
          Kembali ke daftar
        </ButtonLink>
      </Page>
    );
  }
  return <Quiz key={content.id} content={content} base={base} preview={preview} />;
}

interface Session {
  key: number;
  questions: QuizQuestion[];
}

/** Pembungkus: pilih level dulu (akun murid), lalu kerjakan soal level itu yang belum pernah dikerjakan. Pratinjau guru: semua soal. */
function Quiz({ content, base, preview }: { content: LearningContent; base: string; preview: boolean }) {
  const p = useProgress();
  const { status, user } = useAuth();
  const [duelOpen, setDuelOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(preview ? { key: 0, questions: content.questions } : null);
  const doneIds = useMemo(() => new Set(p.levelDone?.[content.id] ?? []), [p.levelDone, content.id]);
  const levels = useMemo(() => levelsOf(content, doneIds), [content, doneIds]);
  const cur = currentLevel(levels);
  // Duel hanya untuk akun anak (bukan pratinjau guru, bukan tamu).
  const canDuel = !preview && status === 'ready' && user?.role === 'student' && !!user.parentUid && content.questions.length >= 10;

  function start(i: number) {
    const level = levels[i];
    if (!level) return;
    const questions = shuffle(remainingOf(level, doneIds));
    if (questions.length === 0) return;
    setSession((s) => ({ key: (s?.key ?? 0) + 1, questions }));
  }

  // QuizRun/LevelPicker tetap terpasang (hanya disembunyikan) saat duel dibuka, supaya kemajuan sesi tidak hilang.
  return (
    <>
      <div hidden={duelOpen}>
        {session ? (
          <QuizRun
            key={session.key}
            content={content}
            questions={session.questions}
            base={base}
            preview={preview}
            canDuel={canDuel}
            onDuel={() => setDuelOpen(true)}
            nextLevel={preview || cur === -1 ? null : cur}
            onNextLevel={() => start(cur)}
            onPickLevel={() => setSession(null)}
          />
        ) : (
          <LevelPicker content={content} base={base} levels={levels} cur={cur} stars={p.stars[content.id] ?? 0} canDuel={canDuel} onStart={start} onDuel={() => setDuelOpen(true)} />
        )}
      </div>
      {duelOpen && (
        <Suspense fallback={<LoadingScreen label="Membuka duel…" />}>
          <PackDuelPicker content={content} onClose={() => setDuelOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

function LevelPicker({
  content, base, levels, cur, stars, canDuel, onStart, onDuel,
}: {
  content: LearningContent;
  base: string;
  levels: ReturnType<typeof levelsOf>;
  cur: number;
  stars: number;
  canDuel: boolean;
  onStart: (i: number) => void;
  onDuel: () => void;
}) {
  const total = content.questions.length;
  return (
    <Page className="max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          to={base}
          aria-label="Kembali ke daftar pelajaran"
          className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none"
        >
          <Icon name="close" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-semibold">{content.title.replace(' (contoh)', '')}</h1>
          <p className="text-tinta/75">
            {total} soal · {levels.length} level
          </p>
        </div>
        <Stars count={stars} />
      </div>

      {cur === -1 && (
        <Card tone="catatan" className="space-y-3">
          <p className="font-display text-xl font-semibold">Hebat! Semua {total} soal sudah kamu kerjakan.</p>
          <p>Mau berlatih lagi? Ulangi dari Level 1. Soalnya boleh muncul lagi.</p>
          <Button
            block
            onClick={() => {
              progressActions.resetLevels(content.id);
            }}
          >
            Ulangi dari awal
          </Button>
        </Card>
      )}

      <ul className="grid gap-3">
        {levels.map((l) => {
          const locked = cur !== -1 && l.index > cur;
          const isCur = l.index === cur;
          return (
            <li key={l.index}>
              <button
                type="button"
                disabled={!isCur}
                onClick={() => onStart(l.index)}
                aria-label={`Level ${l.index + 1}, ${l.questions.length} soal${l.complete ? ', selesai' : locked ? ', terkunci' : ''}`}
                className={cn(
                  'flex min-h-[72px] w-full items-center gap-4 rounded-3xl border-2 p-4 text-left transition',
                  isCur && 'stiker border-tinta bg-kuning-100 active:translate-y-1 active:shadow-none',
                  l.complete && 'border-tinta bg-hijau-100',
                  locked && 'cursor-not-allowed border-tinta/25 bg-tinta/10 text-tinta/45',
                )}
              >
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 font-display text-2xl font-semibold',
                    locked ? 'border-tinta/25' : 'border-tinta bg-white',
                  )}
                >
                  {l.index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-semibold">Level {l.index + 1}</span>
                  <span className="block">
                    {l.complete ? 'Selesai' : locked ? `Selesaikan Level ${l.index} dulu` : l.done > 0 ? `${l.done} dari ${l.questions.length} soal sudah dikerjakan` : `${l.questions.length} soal baru`}
                  </span>
                </span>
                <Icon name={l.complete ? 'check' : locked ? 'lock' : 'play'} size={26} className="shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-tinta/75">Soal yang sudah kamu kerjakan tidak muncul lagi sampai semua level selesai.</p>

      {canDuel && (
        <Button variant="sekunder" block onClick={onDuel}>
          <Icon name="game" size={22} />
          Duel dengan teman
        </Button>
      )}
    </Page>
  );
}

interface RunProps {
  content: LearningContent;
  questions: QuizQuestion[];
  base: string;
  preview: boolean;
  canDuel: boolean;
  onDuel: () => void;
  /** Indeks level berikutnya (0-based) bila masih ada; null bila tidak ada. */
  nextLevel: number | null;
  onNextLevel: () => void;
  onPickLevel: () => void;
}

function QuizRun({ content, questions, base, preview, canDuel, onDuel, nextLevel, onNextLevel, onPickLevel }: RunProps) {
  const total = questions.length;
  // Urutan pilihan diacak sekali per sesi agar jawaban benar tidak selalu di tempat yang sama.
  const orders = useMemo(() => questions.map((q) => shuffle(q.options.map((_, i) => i))), [questions]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<{ stars: number; gained: number } | null>(null);
  const recorded = useRef(false);

  const q = questions[index];
  const answered = picked !== null;
  const isRight = picked === q.answerIndex;

  function choose(optionIndex: number) {
    if (answered) return;
    setPicked(optionIndex);
    if (optionIndex === q.answerIndex) setCorrect((c) => c + 1);
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    if (!recorded.current) {
      recorded.current = true;
      if (preview) {
        setResult({ stars: starsFor(correct, total), gained: 0 });
      } else {
        setResult(progressActions.recordQuiz(content.id, correct, total));
        // Soal sesi ini dianggap sudah dikerjakan: tidak muncul lagi sampai semua soal paket selesai.
        progressActions.markLevelDone(content.id, questions.map((x) => x.id));
      }
    }
  }

  if (result) {
    return (
      <Page className="max-w-2xl">
        <Card tone="hijau" className="flex flex-col items-center gap-4 py-8 text-center">
          <Mascot size={130} mood="hore" className="animate-melayang" />
          <h1 className="text-3xl">{result.stars === 3 ? 'Sempurna!' : result.stars > 0 ? 'Kerja bagus!' : 'Ayo coba lagi!'}</h1>
          <div className="flex gap-1" role="img" aria-label={`${result.stars} dari 3 bintang`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="animate-pop" style={{ animationDelay: `${i * 180}ms` }}>
                <Icon name="star" size={52} className={i < result.stars ? 'fill-kuning-500' : 'text-tinta/25'} />
              </span>
            ))}
          </div>
          <p className="text-lg">
            Benar <strong>{correct}</strong> dari {total} soal
            {preview ? ' · pratinjau, tidak dicatat' : <> · <strong>+{result.gained} XP</strong></>}
          </p>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            {preview ? (
              <Button
                variant="sekunder"
                block
                onClick={() => {
                  recorded.current = false;
                  setResult(null);
                  setIndex(0);
                  setPicked(null);
                  setCorrect(0);
                }}
              >
                Ulangi
              </Button>
            ) : nextLevel !== null ? (
              <Button block onClick={onNextLevel}>
                Level {nextLevel + 1}
                <Icon name="arrow" size={22} />
              </Button>
            ) : (
              <Button block onClick={onPickLevel}>
                Selesai semua level
              </Button>
            )}
            <ButtonLink to={base} variant={preview ? 'utama' : 'sekunder'} block>
              {preview ? 'Kembali ke daftar kuis' : 'Pelajaran lain'}
            </ButtonLink>
          </div>
          {!preview && nextLevel !== null && (
            <Button variant="ghost" block onClick={onPickLevel}>
              Lihat semua level
            </Button>
          )}
          {canDuel && (
            <Button variant="aksi" block onClick={onDuel}>
              <Icon name="game" size={22} />
              Duel dengan teman
            </Button>
          )}
        </Card>
      </Page>
    );
  }

  return (
    <Page className="max-w-2xl">
      {preview && (
        <p className="rounded-2xl border-2 border-tinta bg-kuning-100 px-3 py-2 text-sm font-bold">
          Pratinjau guru: jawabanmu tidak mengubah data murid.
        </p>
      )}
      <div className="flex items-center gap-3">
        <Link
          to={base}
          aria-label="Keluar dari kuis"
          className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none"
        >
          <Icon name="close" />
        </Link>
        <div className="min-w-0 flex-1">
          <ProgressBar value={index + (answered ? 1 : 0)} max={total} label="Kemajuan kuis" />
        </div>
        <span className="font-display text-lg font-semibold">
          {index + 1}/{total}
        </span>
      </div>

      {canDuel && index === 0 && !answered && (
        <Button variant="sekunder" block onClick={onDuel}>
          <Icon name="game" size={22} />
          Duel dengan teman
        </Button>
      )}

      <Card key={index} className="animate-naik space-y-1">
        <p className="text-sm font-bold text-aksen-tua">{content.title.replace(' (contoh)', '')}</p>
        <h1 className="text-2xl leading-snug sm:text-3xl">{q.prompt}</h1>
      </Card>

      <ul className="grid gap-3">
        {orders[index].map((optIdx, pos) => {
          const right = optIdx === q.answerIndex;
          const chosen = optIdx === picked;
          return (
            <li key={optIdx} className="animate-naik" style={{ animationDelay: `${pos * 60}ms` }}>
              <button
                type="button"
                disabled={answered}
                onClick={() => choose(optIdx)}
                className={cn(
                  'flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-2 border-tinta p-3 text-left text-lg font-semibold transition',
                  !answered && 'bg-gading shadow-stiker active:translate-y-1 active:shadow-none',
                  answered && right && 'bg-hijau-100 shadow-stiker',
                  answered && chosen && !right && 'animate-getar bg-merah-100',
                  answered && !right && !chosen && 'bg-gading opacity-55',
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-tinta bg-white font-display">
                  {answered && right ? <Icon name="check" size={20} /> : answered && chosen ? <Icon name="close" size={20} /> : LETTERS[pos]}
                </span>
                <span className="min-w-0 flex-1">{q.options[optIdx]}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div aria-live="polite" className="animate-pop space-y-3">
          <Card tone={isRight ? 'hijau' : 'catatan'} className="relative flex items-start gap-3">
            <Mascot size={64} mood={isRight ? 'hore' : 'halo'} className="shrink-0" />
            <div>
              <p className="font-display text-xl font-semibold">{isRight ? 'Benar! Hebat!' : 'Belum tepat, tidak apa-apa.'}</p>
              <p>{q.explanation}</p>
            </div>
            {isRight && <Sparkle className="absolute right-3 top-3" />}
          </Card>
          <Button size="lg" block onClick={next}>
            {index + 1 < total ? 'Lanjut' : 'Lihat hasil'}
            <Icon name="arrow" size={22} />
          </Button>
        </div>
      )}
    </Page>
  );
}
