import { useMemo, useState } from 'react';
import { Badge, Button, Card, ChoiceGroup, Icon } from '@/components/ui';
import { sampleContents } from '@/data/sample';
import { cn } from '@/utils/cn';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Kuis tim untuk satu layar (proyektor/TV/tablet di kelas). Guru memegang perangkat: tim bergiliran
 * menjawab, guru mengetuk pilihan yang dipilih tim. Semua berjalan di perangkat ini, tanpa internet.
 */
export function TeamQuiz({ teamNames }: { teamNames: string[] }) {
  const [quizId, setQuizId] = useState(sampleContents[0]?.id ?? '');
  const [started, setStarted] = useState(false);
  const content = sampleContents.find((c) => c.id === quizId);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [scores, setScores] = useState<number[]>(() => teamNames.map(() => 0));

  const turns = teamNames.length;
  const order = useMemo(() => (content ? content.questions.map((_, i) => i % Math.max(turns, 1)) : []), [content, turns]);

  if (turns < 2) return <Card tone="catatan">Buat kelompok dulu di tab Kelompok (minimal 2 tim).</Card>;
  if (!content) return null;

  const reset = () => {
    setStarted(false);
    setIndex(0);
    setPicked(null);
    setScores(teamNames.map(() => 0));
  };

  if (!started) {
    return (
      <Card className="space-y-3">
        <ChoiceGroup label="Pilih kuis" value={quizId} onChange={setQuizId} options={sampleContents.map((c) => ({ value: c.id, label: c.title.replace(' (contoh)', '') }))} />
        <p>{teamNames.length} tim bergiliran menjawab. Jawaban benar +10 poin.</p>
        <Button size="lg" onClick={() => { setScores(teamNames.map(() => 0)); setStarted(true); }}>
          <Icon name="play" size={22} />
          Mulai
        </Button>
      </Card>
    );
  }

  const finished = index >= content.questions.length;
  if (finished) {
    const max = Math.max(...scores);
    return (
      <Card tone="hijau" className="space-y-4 text-center">
        <h2 className="text-3xl">Selesai!</h2>
        <ul className="space-y-2">
          {teamNames.map((t, i) => (
            <li key={t} className={cn('flex items-center justify-between rounded-2xl border-2 border-tinta bg-gading px-4 py-3 text-xl font-semibold', scores[i] === max && 'bg-kuning-100 shadow-stiker')}>
              <span>{scores[i] === max && '🏆 '}{t}</span>
              <span>{scores[i]}</span>
            </li>
          ))}
        </ul>
        <Button onClick={reset}>Main lagi</Button>
      </Card>
    );
  }

  const q = content.questions[index];
  const team = order[index];
  const answered = picked !== null;

  function choose(i: number) {
    if (answered) return;
    setPicked(i);
    if (i === q.answerIndex) setScores((s) => s.map((v, k) => (k === team ? v + 10 : v)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {teamNames.map((t, i) => (
          <Badge key={t} tone={i === team ? 'jingga' : 'netral'}>{t}: {scores[i]}</Badge>
        ))}
      </div>
      <Card className="space-y-2">
        <p className="font-display text-lg font-semibold text-aksen-tua">Giliran {teamNames[team]} · soal {index + 1}/{content.questions.length}</p>
        <h2 className="text-3xl leading-snug">{q.prompt}</h2>
      </Card>
      <ul className="grid gap-3 sm:grid-cols-2">
        {q.options.map((o, i) => {
          const right = i === q.answerIndex;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered}
                onClick={() => choose(i)}
                className={cn(
                  'flex min-h-[72px] w-full items-center gap-3 rounded-2xl border-2 border-tinta p-3 text-left text-xl font-semibold',
                  !answered && 'bg-gading shadow-stiker active:translate-y-1 active:shadow-none',
                  answered && right && 'bg-hijau-100 shadow-stiker',
                  answered && i === picked && !right && 'bg-merah-100',
                  answered && !right && i !== picked && 'opacity-55',
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-tinta bg-white font-display">{LETTERS[i]}</span>
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      {answered && (
        <Card tone="catatan" className="space-y-3">
          <p className="text-lg"><strong>{picked === q.answerIndex ? `Benar! ${teamNames[team]} +10.` : 'Belum tepat.'}</strong> {q.explanation}</p>
          <Button size="lg" onClick={() => { setIndex(index + 1); setPicked(null); }}>
            {index + 1 < content.questions.length ? 'Soal berikutnya' : 'Lihat skor'}
            <Icon name="arrow" size={22} />
          </Button>
        </Card>
      )}
    </div>
  );
}
