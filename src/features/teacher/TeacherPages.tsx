import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, ButtonLink, Card, ChoiceGroup, Icon, Page, PageHeader, ProgressBar, Stat } from '@/components/ui';
import { Field, FormError } from '@/features/auth/parts';
import { MODE_BASE } from '@/app/navigation';
import { sampleCategories, sampleContents } from '@/data/sample';
import { useAuth } from '@/hooks/useAuth';
import { friendlyError } from '@/services/firebase/auth';
import { createClass, listMembers, listMyClasses, listResults } from '@/services/firebase/classes';
import type { Grade } from '@/types';
import { resultTitle } from '@/data/missions';
import { useLoad } from './useTeacherData';

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];
const titleOf = resultTitle;

export function TeacherHome() {
  const { user } = useAuth();
  const classes = useLoad(() => listMyClasses(user?.uid ?? ''), [user?.uid]);
  const stats = useLoad(async () => {
    const list = await listMyClasses(user?.uid ?? '');
    const m = await Promise.all(list.map((c) => listMembers(c.id)));
    const flat = m.flat();
    return { active: flat.filter((x) => x.status === 'active').length, pending: flat.filter((x) => x.status === 'pending').length };
  }, [user?.uid]);
  const list = classes.data ?? [];
  return (
    <Page>
      <PageHeader title={`Halo, ${user?.displayName || 'Guru'}!`} subtitle="Ringkasan kelasmu (data nyata dari akunmu)." icon="board" />
      <FormError message={classes.error} />
      <div className="grid grid-cols-3 gap-3">
        <Stat icon="board" value={list.filter((c) => !c.archived).length} label="Kelas" />
        <Stat icon="users" value={stats.data?.active ?? '–'} label="Murid" />
        <Stat icon="pencil" value={sampleContents.length} label="Paket kuis" />
      </div>
      {(stats.data?.pending ?? 0) > 0 && (
        <Card tone="catatan" className="flex items-center justify-between gap-3">
          <p className="font-semibold">{stats.data?.pending} murid menunggu persetujuanmu.</p>
          <ButtonLink to={`${MODE_BASE.teacher}/kelas`}>Buka kelas</ButtonLink>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <ButtonLink to={`${MODE_BASE.teacher}/langsung`} size="lg" block>
          <Icon name="play" size={22} />
          Kelas langsung
        </ButtonLink>
        <ButtonLink to={`${MODE_BASE.teacher}/hasil`} variant="aksi" size="lg" block>
          <Icon name="chart" size={22} />
          Lihat hasil murid
        </ButtonLink>
      </div>
    </Page>
  );
}

export function TeacherClasses() {
  const { user } = useAuth();
  const classes = useLoad(() => listMyClasses(user?.uid ?? ''), [user?.uid]);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !grade || !user) return;
    setBusy(true);
    setError('');
    try {
      await createClass(user.uid, name, grade);
      setName('');
      setGrade('');
      await classes.reload();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <PageHeader title="Kelas" subtitle="Buat kelas, bagikan kode, dan pantau muridmu." icon="board" />
      <form onSubmit={submit} className="stiker space-y-3 rounded-3xl bg-gading p-4">
        <h2 className="text-xl">Buat kelas baru</h2>
        <Field label="Nama kelas" value={name} maxLength={30} placeholder="mis. 3A Pagi" onChange={(e) => setName(e.target.value)} />
        <ChoiceGroup label="Tingkat" value={grade} onChange={setGrade} options={GRADES.map((g) => ({ value: g, label: `Kelas ${g}` }))} />
        <FormError message={error} />
        <Button type="submit" disabled={busy || !name.trim() || !grade}>{busy ? 'Membuat…' : 'Buat kelas'}</Button>
      </form>
      <FormError message={classes.error} />
      {classes.loading ? (
        <p role="status">Memuat…</p>
      ) : (classes.data ?? []).length === 0 ? (
        <Card tone="catatan">Belum ada kelas. Buat satu di atas.</Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-3">
          {(classes.data ?? []).map((c) => (
            <li key={c.id}>
              <Link to={`${MODE_BASE.teacher}/kelas/${c.id}`} className="stiker block h-full space-y-2 rounded-3xl bg-gading p-4 active:translate-y-1 active:shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="min-w-0 truncate text-xl">{c.name}</h2>
                  <Badge tone={c.archived ? 'netral' : 'hijau'}>{c.archived ? 'Arsip' : `Kelas ${c.grade}`}</Badge>
                </div>
                <p className="text-sm">Kode: <strong className="tracking-widest">{c.joinCode}</strong></p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

export function TeacherQuizzes() {
  return (
    <Page>
      <PageHeader title="Kuis" subtitle="Paket kuis yang tersedia. Mencoba kuis tidak mengubah data murid." icon="pencil" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {sampleContents.map((c) => (
          <li key={c.id}>
            <Card className="flex h-full flex-col gap-3 p-4">
              <div>
                <p className="font-display text-lg font-semibold leading-snug">{titleOf(c.id)}</p>
                <p className="text-sm text-tinta/75">{sampleCategories.find((x) => x.id === c.categoryId)?.name}</p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <Badge tone="hijau">Kelas {c.grades.join(', ')}</Badge>
                  <Badge tone="netral">{c.questions.length} soal</Badge>
                </div>
                <ButtonLink to={`${MODE_BASE.teacher}/kuis/${c.id}`} variant="sekunder">Coba</ButtonLink>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Page>
  );
}

export function TeacherResults() {
  const { user } = useAuth();
  const data = useLoad(async () => {
    const classes = (await listMyClasses(user?.uid ?? '')).filter((c) => !c.archived);
    return Promise.all(classes.map(async (c) => ({ c, members: (await listMembers(c.id)).filter((m) => m.status === 'active'), results: await listResults(c.id) })));
  }, [user?.uid]);
  const [open, setOpen] = useState('');
  const rows = data.data ?? [];
  const cur = rows.find((r) => r.c.id === open) ?? rows[0];

  return (
    <Page>
      <PageHeader title="Hasil" subtitle="Penguasaan murid per kuis (data nyata)." icon="chart" />
      <FormError message={data.error} />
      {data.loading ? (
        <p role="status">Memuat…</p>
      ) : !cur ? (
        <Card tone="catatan">Belum ada kelas aktif. Buat kelas di menu Kelas.</Card>
      ) : (
        <>
          <ChoiceGroup label="Kelas" value={cur.c.id} onChange={setOpen} options={rows.map((r) => ({ value: r.c.id, label: r.c.name }))} />
          {(() => {
            const byQuiz = new Map<string, number[]>();
            cur.results.forEach((r) => byQuiz.set(r.quizId, [...(byQuiz.get(r.quizId) ?? []), r.score]));
            return byQuiz.size === 0 ? (
              <Card tone="catatan">Belum ada hasil dari {cur.members.length} murid di kelas ini.</Card>
            ) : (
              <Card className="space-y-4">
                <h2 className="text-xl">Rata-rata per kuis</h2>
                {[...byQuiz].map(([id, s]) => {
                  const avg = Math.round(s.reduce((a, b) => a + b, 0) / s.length);
                  return (
                    <div key={id} className="space-y-1">
                      <div className="flex justify-between gap-2 font-semibold">
                        <span className="min-w-0 truncate">{titleOf(id)}</span>
                        <span className="shrink-0">{avg} · {s.length} murid</span>
                      </div>
                      <ProgressBar value={avg} label={`Rata-rata ${titleOf(id)}`} />
                    </div>
                  );
                })}
              </Card>
            );
          })()}
          <Card className="space-y-2">
            <h2 className="text-xl">Per murid</h2>
            {cur.members.length === 0 ? <p>Belum ada murid.</p> : (
              <ul className="space-y-1">
                {cur.members.map((m) => {
                  const mine = cur.results.filter((r) => r.uid === m.uid);
                  return (
                    <li key={m.uid} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-semibold">{m.displayName}</span>
                      <Badge tone={mine.length ? 'hijau' : 'netral'}>{mine.length ? `${mine.length} kuis` : 'Belum'}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </Page>
  );
}
