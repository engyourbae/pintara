import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Icon, Page, PageHeader, ProgressBar, useConfirm } from '@/components/ui';
import { FormError } from '@/features/auth/parts';
import { MODE_BASE } from '@/app/navigation';
import { useAuth } from '@/hooks/useAuth';
import { friendlyError } from '@/services/firebase/auth';
import { getTeacherQuiz, myTeacherAnswered, submitTeacherAnswers } from '@/services/firebase/teacherQuizzes';
import { useLoad } from '@/features/teacher/useTeacherData';

/** Murid mengerjakan kuis buatan guru. Sekali kirim; nilai muncul setelah guru membagikannya. */
export function TeacherQuizPlay() {
  const { classId = '', quizId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const back = `${MODE_BASE.student}/kelas/${classId}`;
  const data = useLoad(async () => {
    const [quiz, done] = await Promise.all([getTeacherQuiz(classId, quizId), myTeacherAnswered(classId, user?.uid ?? '')]);
    return { quiz, already: done.has(quizId) };
  }, [classId, quizId, user?.uid]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const quiz = data.data?.quiz ?? null;
  const exit = <Link to={back} className="inline-flex min-h-[48px] items-center font-semibold underline">← Keluar ke kelas</Link>;

  if (data.loading) return <Page className="max-w-2xl"><p role="status" className="font-display text-xl">Memuat kuis…</p></Page>;
  if (!quiz) {
    return (
      <Page className="max-w-2xl">
        {exit}
        <FormError message={data.error} />
        <Card tone="catatan">Kuis tidak ditemukan. Mungkin sudah dihapus gurumu.</Card>
      </Page>
    );
  }
  if (sent || data.data?.already) {
    return (
      <Page className="max-w-2xl">
        <PageHeader title={quiz.title} subtitle="Kuis dari gurumu" icon="book" />
        <Card tone="hijau" className="space-y-2">
          <p className="font-display text-xl font-semibold">Jawabanmu sudah terkirim ✓</p>
          <p>Nilaimu akan muncul di halaman kelas setelah gurumu membagikannya.</p>
        </Card>
        <Button size="lg" block onClick={() => navigate(back)}>Kembali ke kelas</Button>
      </Page>
    );
  }

  const q = quiz.questions[i];
  const last = i === quiz.count - 1;
  const picked = answers[i];

  async function send() {
    const ok = await confirm({ title: 'Kirim jawaban?', message: 'Jawaban hanya bisa dikirim satu kali.', confirmLabel: 'Kirim' });
    if (!ok || !user) return;
    setBusy(true);
    setError('');
    try {
      await submitTeacherAnswers(classId, user.uid, quizId, answers);
      setSent(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page className="max-w-2xl">
      {exit}
      <PageHeader title={quiz.title} subtitle={`Soal ${i + 1} dari ${quiz.count}`} icon="book" />
      <ProgressBar value={i + 1} max={quiz.count} label={`Soal ${i + 1} dari ${quiz.count}`} />
      <Card className="space-y-4">
        <p className="font-display text-xl font-semibold leading-snug">{q.prompt}</p>
        <div role="radiogroup" aria-label="Pilihan jawaban" className="space-y-2">
          {q.options.map((o, k) => {
            const on = picked === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setAnswers((a) => { const n = [...a]; n[i] = k; return n; })}
                className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border-2 border-tinta px-4 py-2 text-left font-display text-lg font-semibold transition active:translate-y-0.5 ${on ? 'bg-aksen text-white shadow-stiker' : 'bg-white text-tinta'}`}
              >
                {on && <Icon name="check" size={22} />}
                <span>{o}</span>
              </button>
            );
          })}
        </div>
      </Card>
      <FormError message={error} />
      <div className="flex gap-2">
        <Button variant="sekunder" size="lg" disabled={i === 0 || busy} onClick={() => setI(i - 1)}>Sebelumnya</Button>
        {last ? (
          <Button size="lg" className="flex-1" disabled={busy || Array.from({ length: quiz.count }).some((_, k) => answers[k] === undefined)} onClick={() => void send()}>
            {busy ? 'Mengirim…' : 'Kirim jawaban'}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" disabled={picked === undefined} onClick={() => setI(i + 1)}>Berikutnya</Button>
        )}
      </div>
    </Page>
  );
}
