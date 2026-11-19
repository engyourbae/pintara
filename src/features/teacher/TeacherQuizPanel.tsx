import { useState } from 'react';
import { Badge, Button, Card, Icon, ProgressBar, useConfirm } from '@/components/ui';
import { Field, FormError } from '@/features/auth/parts';
import { friendlyError } from '@/services/firebase/auth';
import {
  MAX_TQ_QUESTIONS, createTeacherQuiz, deleteTeacherQuiz, listTeacherQuizzes, loadQuizReview, resetStudentAnswer, shareQuizScores,
  type TQuestionDraft, type TeacherQuiz,
} from '@/services/firebase/teacherQuizzes';
import type { MemberRow } from '@/types';
import { useLoad } from './useTeacherData';

const LETTERS = ['A', 'B', 'C', 'D'];
const blank = (): TQuestionDraft => ({ prompt: '', options: ['', '', ''], correct: -1 });

type View = { t: 'list' } | { t: 'edit' } | { t: 'result'; quiz: TeacherQuiz };

/** Kuis buatan guru untuk satu kelas: buat, lihat benar/salah per murid, bagikan nilai. */
export function TeacherQuizPanel({ classId, members }: { classId: string; members: MemberRow[] }) {
  const confirm = useConfirm();
  const quizzes = useLoad(() => listTeacherQuizzes(classId), [classId]);
  const [view, setView] = useState<View>({ t: 'list' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(fn: () => Promise<void>, after?: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      if (after) await after();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  if (view.t === 'edit') {
    return (
      <QuizEditor
        busy={busy}
        error={error}
        onCancel={() => { setError(''); setView({ t: 'list' }); }}
        onSave={(input) => void run(() => createTeacherQuiz(classId, input), async () => { await quizzes.reload(); setView({ t: 'list' }); })}
      />
    );
  }
  if (view.t === 'result') {
    return <QuizResult classId={classId} quiz={view.quiz} members={members} onBack={() => setView({ t: 'list' })} />;
  }

  const list = quizzes.data ?? [];
  return (
    <Card className="space-y-3">
      <h2 className="text-xl">Kuis buatan guru</h2>
      <p className="text-sm text-tinta/80">Tulis soal sendiri. Murid mengerjakan sekali, lalu kamu melihat siapa yang benar dan salah di tiap soal.</p>
      <FormError message={error || quizzes.error} />
      {quizzes.loading ? (
        <p role="status">Memuat kuis…</p>
      ) : list.length === 0 ? (
        <p>Belum ada kuis buatanmu.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-2 rounded-2xl border-2 border-tinta bg-white px-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{q.title}</p>
                <p className="text-sm text-tinta/75">{q.count} soal</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="sekunder" onClick={() => setView({ t: 'result', quiz: q })}>Hasil</Button>
                <button
                  type="button"
                  aria-label={`Hapus kuis ${q.title}`}
                  disabled={busy}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-tinta bg-gading"
                  onClick={async () => {
                    const ok = await confirm({ title: 'Hapus kuis?', message: `Kuis "${q.title}" beserta jawaban dan nilai murid akan dihapus.`, confirmLabel: 'Hapus', danger: true });
                    if (ok) void run(() => deleteTeacherQuiz(classId, q.id), quizzes.reload);
                  }}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button block onClick={() => setView({ t: 'edit' })}>
        <Icon name="pencil" size={20} />
        Buat kuis baru
      </Button>
    </Card>
  );
}

// ───────── Editor ─────────

function QuizEditor({ busy, error, onSave, onCancel }: {
  busy: boolean;
  error: string;
  onSave: (v: { title: string; note: string; questions: TQuestionDraft[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [qs, setQs] = useState<TQuestionDraft[]>([blank()]);
  const [problem, setProblem] = useState('');

  const patch = (i: number, fn: (q: TQuestionDraft) => TQuestionDraft) => setQs((all) => all.map((q, k) => (k === i ? fn(q) : q)));

  function save() {
    if (!title.trim()) return setProblem('Isi judul kuis dulu.');
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      const opts = q.options.map((o) => o.trim());
      if (!q.prompt.trim()) return setProblem(`Soal ${i + 1}: pertanyaannya masih kosong.`);
      if (opts.some((o) => !o)) return setProblem(`Soal ${i + 1}: ada pilihan yang kosong. Isi atau hapus pilihan itu.`);
      if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) return setProblem(`Soal ${i + 1}: ada dua pilihan yang sama.`);
      if (q.correct < 0 || q.correct >= opts.length) return setProblem(`Soal ${i + 1}: tandai satu jawaban yang benar.`);
    }
    setProblem('');
    onSave({ title, note, questions: qs });
  }

  return (
    <div className="space-y-4">
      <Card tone="catatan" className="space-y-3">
        <h2 className="text-xl">Kuis baru</h2>
        <Field label="Judul kuis" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
        <Field label="Pesan untuk murid (boleh kosong)" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
      </Card>

      {qs.map((q, i) => (
        <Card key={i} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-lg font-semibold">Soal {i + 1}</p>
            {qs.length > 1 && (
              <button
                type="button"
                aria-label={`Hapus soal ${i + 1}`}
                className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-tinta bg-gading"
                onClick={() => setQs((all) => all.filter((_, k) => k !== i))}
              >
                <Icon name="trash" size={18} />
              </button>
            )}
          </div>
          <Field label="Pertanyaan" value={q.prompt} maxLength={200} onChange={(e) => patch(i, (x) => ({ ...x, prompt: e.target.value }))} />
          <p className="text-sm text-tinta/80">Tekan tanda centang di samping pilihan yang benar.</p>
          {q.options.map((o, k) => {
            const on = q.correct === k;
            return (
              <div key={k} className="flex items-end gap-2">
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`Jadikan pilihan ${LETTERS[k]} sebagai jawaban benar`}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-tinta ${on ? 'bg-hijau-300 text-tinta' : 'bg-white text-tinta/40'}`}
                  onClick={() => patch(i, (x) => ({ ...x, correct: k }))}
                >
                  <Icon name="check" size={22} />
                </button>
                <div className="min-w-0 flex-1">
                  <Field label={`Pilihan ${LETTERS[k]}`} value={o} maxLength={80} onChange={(e) => patch(i, (x) => ({ ...x, options: x.options.map((v, n) => (n === k ? e.target.value : v)) }))} />
                </div>
                {q.options.length > 2 && (
                  <button
                    type="button"
                    aria-label={`Hapus pilihan ${LETTERS[k]}`}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-tinta bg-gading"
                    onClick={() => patch(i, (x) => ({ ...x, options: x.options.filter((_, n) => n !== k), correct: x.correct === k ? -1 : x.correct > k ? x.correct - 1 : x.correct }))}
                  >
                    <Icon name="close" size={18} />
                  </button>
                )}
              </div>
            );
          })}
          {q.options.length < 4 && (
            <Button variant="sekunder" onClick={() => patch(i, (x) => ({ ...x, options: [...x.options, ''] }))}>Tambah pilihan</Button>
          )}
        </Card>
      ))}

      <Button variant="sekunder" block disabled={qs.length >= MAX_TQ_QUESTIONS} onClick={() => setQs((all) => [...all, blank()])}>
        Tambah soal ({qs.length}/{MAX_TQ_QUESTIONS})
      </Button>
      <FormError message={problem || error} />
      <div className="flex flex-wrap gap-2">
        <Button size="lg" disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan kuis'}</Button>
        <Button variant="sekunder" size="lg" disabled={busy} onClick={onCancel}>Batal</Button>
      </div>
    </div>
  );
}

// ───────── Hasil: benar/salah per murid ─────────

function QuizResult({ classId, quiz, members, onBack }: { classId: string; quiz: TeacherQuiz; members: MemberRow[]; onBack: () => void }) {
  const confirm = useConfirm();
  const review = useLoad(() => loadQuizReview(classId, quiz.id), [classId, quiz.id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shared, setShared] = useState(false);

  const key = review.data?.key ?? null;
  const total = quiz.count;
  const byUid = new Map((review.data?.answers ?? []).map((a) => [a.uid, a.answers]));
  const rows = members.map((m) => {
    const ans = byUid.get(m.uid);
    if (!ans || !key) return { m, sent: !!ans, marks: [] as boolean[], correct: 0 };
    const marks = quiz.questions.map((_, i) => ans[i] === key[i]);
    return { m, sent: true, marks, correct: marks.filter(Boolean).length };
  });
  const sent = rows.filter((r) => r.sent);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <button type="button" onClick={onBack} className="min-h-[48px] font-semibold underline">← Kembali ke daftar kuis</button>
      <div>
        <h2 className="text-xl">{quiz.title}</h2>
        <p className="text-sm text-tinta/75">{sent.length} dari {members.length} murid sudah mengirim · {total} soal</p>
      </div>
      <FormError message={error || review.error} />
      {review.loading ? (
        <p role="status">Memuat jawaban…</p>
      ) : !key ? (
        <p className="rounded-xl bg-kuning-100 px-3 py-2 text-sm">Kunci jawaban kuis ini tidak ditemukan, jadi benar/salah belum bisa dihitung.</p>
      ) : (
        <>
          {sent.length > 0 && (
            <div className="space-y-2">
              <p className="font-display text-lg font-semibold">Per soal</p>
              <ul className="space-y-2">
                {quiz.questions.map((q, i) => {
                  const n = sent.filter((r) => r.marks[i]).length;
                  return (
                    <li key={i} className="space-y-1">
                      <p className="text-sm"><span className="font-semibold">Soal {i + 1}</span> · {n} dari {sent.length} benar <span className="text-tinta/70">— {q.prompt}</span></p>
                      <ProgressBar value={Math.round((n / sent.length) * 100)} label={`Soal ${i + 1}: ${n} dari ${sent.length} benar`} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="space-y-3">
            <p className="font-display text-lg font-semibold">Per murid</p>
            {rows.length === 0 && <p>Belum ada murid di kelas ini.</p>}
            <ul className="space-y-3">
              {rows.map(({ m, sent: ok, marks, correct }) => {
                const wrong = marks.map((v, i) => (v ? 0 : i + 1)).filter(Boolean);
                return (
                  <li key={m.uid} className="space-y-1 rounded-2xl border-2 border-tinta bg-white px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-semibold">{m.displayName}</span>
                      {ok ? <Badge tone={correct / total >= 0.67 ? 'hijau' : 'jingga'}>{correct}/{total} benar</Badge> : <Badge tone="netral">Belum mengirim</Badge>}
                    </div>
                    {ok && (
                      <>
                        <ul className="flex flex-wrap gap-1" aria-label={`Hasil ${m.displayName} per soal`}>
                          {marks.map((v, i) => (
                            <li
                              key={i}
                              aria-label={`Soal ${i + 1} ${v ? 'benar' : 'salah'}`}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 border-tinta text-sm font-bold ${v ? 'bg-hijau-300 text-tinta' : 'bg-jingga-300 text-tinta'}`}
                            >
                              {v ? '✓' : '✗'}
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm text-tinta/80">{wrong.length === 0 ? 'Semua benar.' : `Salah di soal: ${wrong.join(', ')}`}</p>
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={async () => {
                            const yes = await confirm({ title: 'Beri kesempatan ulang?', message: `Jawaban dan nilai ${m.displayName} dihapus supaya bisa mengerjakan lagi.`, confirmLabel: 'Hapus jawaban', danger: true });
                            if (yes) await act(async () => { await resetStudentAnswer(classId, quiz.id, m.uid); await review.reload(); });
                          }}
                        >
                          Kesempatan ulang
                        </Button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <Button
            block
            disabled={busy || sent.length === 0}
            onClick={() => void act(async () => {
              await shareQuizScores(classId, quiz.id, sent.map((r) => ({ uid: r.m.uid, correct: r.correct, total })));
              setShared(true);
            })}
          >
            {shared ? 'Nilai terbagikan ✓ (tekan lagi untuk memperbarui)' : 'Bagikan nilai ke murid'}
          </Button>
          <p className="text-sm text-tinta/75">Murid hanya melihat skornya setelah kamu membagikan nilai. Kunci jawaban tidak pernah dikirim ke murid.</p>
        </>
      )}
    </Card>
  );
}
