import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, ButtonLink, Card, Icon, Mascot, Page, PageHeader, ProgressBar, SampleBadge, Sparkle } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { GROUPS, GROUP_BY_ID } from '@/data/groups';
import { sampleCategories, sampleContents } from '@/data/sample';
import { progressActions, useProgress } from '@/hooks/useProgress';
import { cn } from '@/utils/cn';
import type { CategoryGroup, LearningContent } from '@/types';

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
  const items = sampleContents.filter((c) => group === 'semua' || groupOf(c) === group);

  return (
    <Page>
      <PageHeader title="Belajar" subtitle="Pilih paket kuis, kumpulkan bintang." icon="book" aside={<SampleBadge />} />

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
        <Card tone="catatan">Belum ada paket kuis untuk kelompok ini. Isi lengkap menyusul.</Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((c, i) => {
            const g = GROUP_BY_ID[groupOf(c)];
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

export function QuizPage() {
  const { contentId } = useParams();
  const content = sampleContents.find((c) => c.id === contentId);
  if (!content) {
    return (
      <Page>
        <PageHeader title="Kuis tidak ditemukan" icon="book" />
        <ButtonLink to={BELAJAR} variant="sekunder">
          Kembali ke daftar
        </ButtonLink>
      </Page>
    );
  }
  return <Quiz key={content.id} content={content} />;
}

function Quiz({ content }: { content: LearningContent }) {
  const total = content.questions.length;
  // Urutan pilihan diacak sekali per sesi agar jawaban benar tidak selalu di tempat yang sama.
  const orders = useMemo(() => content.questions.map((q) => shuffle(q.options.map((_, i) => i))), [content]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<{ stars: number; gained: number } | null>(null);
  const recorded = useRef(false);

  const q = content.questions[index];
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
      setResult(progressActions.recordQuiz(content.id, correct, total));
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
            Benar <strong>{correct}</strong> dari {total} soal · <strong>+{result.gained} XP</strong>
          </p>
          <div className="grid w-full gap-3 sm:grid-cols-2">
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
            <ButtonLink to={BELAJAR} block>
              Pelajaran lain
            </ButtonLink>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page className="max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          to={BELAJAR}
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
