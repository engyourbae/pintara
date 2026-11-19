import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, ChoiceGroup, Icon, ProgressBar } from '@/components/ui';
import { sampleContents } from '@/data/sample';
import { cn } from '@/utils/cn';
import { TEAM_QUIZ_BONUS_SECONDS, TEAM_QUIZ_RULES, TEAM_QUIZ_TIERS, teamQuizPoints, tierForSeconds } from '@/features/games/scoring';

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
  const [elapsed, setElapsed] = useState(0);
  const [gained, setGained] = useState(0);
  const startRef = useRef(Date.now());
  const answered = picked !== null;
  const running = started && !answered && index < (content?.questions.length ?? 0);

  // Hitung waktu tiap giliran: mulai saat soal tampil, berhenti saat dijawab.
  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    setElapsed(0);
    const t = window.setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 200);
    return () => window.clearInterval(t);
  }, [running, index]);

  const turns = teamNames.length;
  const order = useMemo(() => (content ? content.questions.map((_, i) => i % Math.max(turns, 1)) : []), [content, turns]);

  if (turns < 2) return <Card tone="catatan">Buat kelompok dulu di tab Kelompok (minimal 2 tim).</Card>;
  if (!content) return null;

  const reset = () => {
    setStarted(false);
    setIndex(0);
    setPicked(null);
    setGained(0);
    setScores(teamNames.map(() => 0));
  };

  if (!started) {
    return (
      <Card className="space-y-3">
        <ChoiceGroup label="Pilih kuis" value={quizId} onChange={setQuizId} options={sampleContents.map((c) => ({ value: c.id, label: c.title.replace(' (contoh)', '') }))} />
        <p>{teamNames.length} tim bergiliran menjawab. Makin cepat benar, makin besar poinnya.</p>
        <ul className="space-y-2">
          {TEAM_QUIZ_TIERS.map((t) => (
            <li key={t.label} className="flex items-center justify-between rounded-2xl border-2 border-tinta bg-kuning-100 px-4 py-2 text-lg font-semibold">
              <span>{Number.isFinite(t.maxSeconds) ? `⚡ ${t.label} · ≤${t.maxSeconds} detik` : `🐢 ${t.label} · lebih lambat`}</span>
              <span>+{t.points}</span>
            </li>
          ))}
        </ul>
        <p className="text-base">{TEAM_QUIZ_RULES}</p>
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
  const tier = tierForSeconds(elapsed, TEAM_QUIZ_TIERS);

  function choose(i: number) {
    if (answered) return;
    const seconds = (Date.now() - startRef.current) / 1000;
    const pts = teamQuizPoints(i === q.answerIndex, seconds);
    setElapsed(seconds);
    setGained(pts);
    setPicked(i);
    if (pts > 0) setScores((s) => s.map((v, k) => (k === team ? v + pts : v)));
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
      {!answered && (
        <div className="space-y-1">
          <div className="flex items-center justify-between font-display text-lg font-semibold">
            <span>⏱ {Math.floor(elapsed)} detik</span>
            <span key={tier.points} className="animate-pop rounded-full border-2 border-tinta bg-kuning-100 px-3 py-0.5">
              {tier.label} · +{tier.points}
            </span>
          </div>
          <ProgressBar value={Math.max(0, TEAM_QUIZ_BONUS_SECONDS - elapsed)} max={TEAM_QUIZ_BONUS_SECONDS} label="Sisa waktu bonus" />
        </div>
      )}
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
          <p key={picked} className={cn('font-display text-2xl font-semibold', gained > 0 ? 'animate-pop text-hijau-700' : 'animate-getar text-aksen-tua')}>
            {gained > 0 ? `${teamNames[team]} +${gained} poin! (${Math.max(0.1, Math.round(elapsed * 10) / 10)} dtk)` : 'Belum tepat, 0 poin.'}
          </p>
          <p className="text-lg">{q.explanation}</p>
          <Button size="lg" onClick={() => { setIndex(index + 1); setPicked(null); setGained(0); }}>
            {index + 1 < content.questions.length ? 'Soal berikutnya' : 'Lihat skor'}
            <Icon name="arrow" size={22} />
          </Button>
        </Card>
      )}
    </div>
  );
}
