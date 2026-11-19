import { Link, useParams } from 'react-router-dom';
import { Badge, ButtonLink, Card, Icon, Page, PageHeader } from '@/components/ui';
import { FormError } from '@/features/auth/parts';
import { MODE_BASE } from '@/app/navigation';
import { GAME_MISSIONS, resultKeyOf } from '@/data/missions';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { getClassForMember, listMissions, myClassResults } from '@/services/firebase/classes';
import { listTeacherQuizzes, myTeacherAnswered, tqResultKey } from '@/services/firebase/teacherQuizzes';
import { useLoad } from '@/features/teacher/useTeacherData';

/** Halaman kelas milik murid: daftar misi dari guru dan statusnya. */
export function StudentClass() {
  const { classId = '' } = useParams();
  const { user } = useAuth();
  const p = useProgress();
  const data = useLoad(async () => {
    const [cls, missions, results, tquizzes, answered] = await Promise.all([
      getClassForMember(classId),
      listMissions(classId),
      myClassResults(classId, user?.uid ?? ''),
      listTeacherQuizzes(classId).catch(() => []),
      myTeacherAnswered(classId, user?.uid ?? '').catch(() => new Set<string>()),
    ]);
    return { cls, missions, results, tquizzes, answered };
  }, [classId, user?.uid]);

  const d = data.data;
  return (
    <Page className="max-w-2xl">
      <PageHeader title={d?.cls?.name ?? 'Kelas'} subtitle="Misi dari gurumu." icon="board" />
      <Link to={MODE_BASE.student} className="font-semibold underline">← Beranda</Link>
      <FormError message={data.error} />
      {data.loading ? (
        <p role="status">Memuat misi…</p>
      ) : !d?.cls ? (
        <Card tone="catatan">Kelas tidak ditemukan atau kamu belum menjadi anggota.</Card>
      ) : d.missions.length === 0 && d.tquizzes.length === 0 ? (
        <Card tone="catatan" className="space-y-2">
          <p className="font-display text-lg font-semibold">Belum ada misi.</p>
          <p>Gurumu belum memberi tugas. Sambil menunggu, kamu bisa belajar bebas.</p>
          <ButtonLink to={`${MODE_BASE.student}/belajar`} variant="sekunder">Belajar bebas</ButtonLink>
        </Card>
      ) : (
        <ul className="space-y-3">
          {d.tquizzes.map((q) => {
            const sent = d.answered.has(q.id);
            const score = d.results[tqResultKey(q.id)];
            return (
              <li key={`tq-${q.id}`}>
                <Card tone={sent ? 'hijau' : 'kertas'} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kuning-300">
                      <Icon name="pencil" size={26} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold leading-snug">{q.title}</p>
                      <p className="text-sm text-tinta/75">Kuis dari guru · {q.count} soal</p>
                    </div>
                    <Badge tone={sent ? 'hijau' : 'jingga'}>{score !== undefined ? `Nilai ${score}` : sent ? 'Terkirim' : 'Belum'}</Badge>
                  </div>
                  {q.note && <p className="rounded-xl bg-kuning-100 px-3 py-2 text-sm">Pesan guru: {q.note}</p>}
                  {sent ? (
                    <p className="text-sm">{score !== undefined ? 'Gurumu sudah membagikan nilainya.' : 'Jawabanmu sudah terkirim. Tunggu gurumu membagikan nilai.'}</p>
                  ) : (
                    <ButtonLink to={`${MODE_BASE.student}/kelas/${classId}/kuis/${q.id}`} block>
                      <Icon name="play" size={20} />
                      Kerjakan sekarang
                    </ButtonLink>
                  )}
                </Card>
              </li>
            );
          })}
          {d.missions.map((m) => {
            let done = d.results[resultKeyOf(m)] !== undefined;
            let score: number | null = d.results[resultKeyOf(m)] ?? null;
            if (m.kind === 'quiz') {
              const local = p.quizBest[m.contentId];
              if (local) {
                done = true;
                score = Math.max(score ?? 0, local.score);
              }
            } else {
              const g = GAME_MISSIONS.find((x) => x.id === m.contentId);
              if (g && (g.keys as readonly string[]).some((k) => (p.gameBest[k] ?? 0) > 0)) done = true;
            }
            const to = m.kind === 'quiz' ? `${MODE_BASE.student}/belajar/${m.contentId}` : `${MODE_BASE.student}/game/${m.contentId}`;
            return (
              <li key={m.id}>
                <Card tone={done ? 'hijau' : 'kertas'} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kuning-300">
                      <Icon name={m.kind === 'quiz' ? 'book' : 'game'} size={26} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold leading-snug">{m.title}</p>
                      <p className="text-sm text-tinta/75">{m.kind === 'quiz' ? 'Kuis' : 'Game'}</p>
                    </div>
                    <Badge tone={done ? 'hijau' : 'jingga'}>{done ? (score !== null && m.kind === 'quiz' ? `Selesai · ${score}` : 'Selesai') : 'Belum'}</Badge>
                  </div>
                  {m.note && <p className="rounded-xl bg-kuning-100 px-3 py-2 text-sm">Pesan guru: {m.note}</p>}
                  <ButtonLink to={to} variant={done ? 'sekunder' : 'utama'} block>
                    <Icon name="play" size={20} />
                    {done ? 'Ulangi' : 'Kerjakan sekarang'}
                  </ButtonLink>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
