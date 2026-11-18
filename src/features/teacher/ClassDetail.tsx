import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, ButtonLink, Card, ChoiceGroup, Icon, Page, PageHeader, ProgressBar, useConfirm } from '@/components/ui';
import { Field, FormError } from '@/features/auth/parts';
import { MODE_BASE } from '@/app/navigation';
import { sampleContents } from '@/data/sample';
import { friendlyError } from '@/services/firebase/auth';
import { listMembers, listResults, setMemberStatus, updateClass } from '@/services/firebase/classes';
import { useAuth } from '@/hooks/useAuth';
import { listMyClasses } from '@/services/firebase/classes';
import type { Grade } from '@/types';
import { useLoad } from './useTeacherData';

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];

export function ClassDetail() {
  const { classId = '' } = useParams();
  const { user } = useAuth();
  const confirm = useConfirm();
  const cls = useLoad(async () => (await listMyClasses(user?.uid ?? '')).find((c) => c.id === classId) ?? null, [classId, user?.uid]);
  const members = useLoad(() => listMembers(classId), [classId]);
  const results = useLoad(() => listResults(classId), [classId]);
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function act(fn: () => Promise<void>, after: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await after();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  const c = cls.data;
  if (cls.loading) return <Page><p role="status" className="font-display text-xl">Memuat kelas…</p></Page>;
  if (!c) {
    return (
      <Page>
        <PageHeader title="Kelas tidak ditemukan" icon="board" />
        <FormError message={cls.error} />
        <ButtonLink to={`${MODE_BASE.teacher}/kelas`} variant="sekunder">Kembali</ButtonLink>
      </Page>
    );
  }

  const all = members.data ?? [];
  const pending = all.filter((m) => m.status === 'pending');
  const active = all.filter((m) => m.status === 'active');
  const res = results.data ?? [];
  const editing = name ?? c.name;
  const dirty = editing.trim() !== c.name && editing.trim().length > 0;

  return (
    <Page>
      <PageHeader title={c.name} subtitle={`Kelas ${c.grade}${c.archived ? ' · diarsipkan' : ''}`} icon="board" />
      <Link to={`${MODE_BASE.teacher}/kelas`} className="inline-flex items-center gap-1 font-semibold underline">Semua kelas</Link>
      <FormError message={error || members.error || results.error} />

      <Card tone="catatan" className="space-y-2">
        <p className="font-display text-lg font-semibold">Kode gabung kelas</p>
        <p className="font-display text-4xl font-bold tracking-[0.3em]" aria-label={`Kode ${c.joinCode.split('').join(' ')}`}>{c.joinCode}</p>
        <p className="text-sm">Siswa memasukkan kode ini di menu Beranda akun mereka. Kamu tetap harus menyetujui tiap siswa.</p>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl">Nama dan tingkat</h2>
        <Field label="Nama kelas" value={editing} maxLength={30} onChange={(e) => setName(e.target.value)} />
        <ChoiceGroup label="Tingkat" value={c.grade} disabled={busy} onChange={(g) => void act(() => updateClass(c.id, { grade: g }), cls.reload)} options={GRADES.map((g) => ({ value: g, label: `Kelas ${g}` }))} />
        <div className="flex flex-wrap gap-2">
          <Button disabled={!dirty || busy} onClick={() => void act(() => updateClass(c.id, { name: editing }), async () => { setName(null); await cls.reload(); })}>
            Simpan nama
          </Button>
          <Button
            variant="sekunder"
            disabled={busy}
            onClick={async () => {
              const ok = await confirm({
                title: c.archived ? 'Aktifkan kembali kelas?' : 'Arsipkan kelas?',
                message: c.archived ? 'Siswa baru bisa bergabung lagi dengan kode kelas.' : 'Kelas diarsipkan dan siswa baru tidak bisa bergabung. Data tetap tersimpan.',
                confirmLabel: c.archived ? 'Aktifkan' : 'Arsipkan',
              });
              if (ok) void act(() => updateClass(c.id, { archived: !c.archived }), cls.reload);
            }}
          >
            {c.archived ? 'Aktifkan kembali' : 'Arsipkan'}
          </Button>
        </div>
      </Card>

      {pending.length > 0 && (
        <Card tone="langit" className="space-y-3">
          <h2 className="text-xl">Menunggu persetujuan ({pending.length})</h2>
          <ul className="space-y-2">
            {pending.map((m) => (
              <li key={m.uid} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{m.displayName}</span>
                <span className="flex gap-2">
                  <Button disabled={busy} onClick={() => void act(() => setMemberStatus(c.id, m.uid, 'active'), members.reload)}>Setujui</Button>
                  <Button variant="sekunder" disabled={busy} onClick={() => void act(() => setMemberStatus(c.id, m.uid, 'removed'), members.reload)}>Tolak</Button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl">Murid ({active.length})</h2>
          <Badge tone="langit">Data nyata dari akun murid</Badge>
        </div>
        {active.length === 0 ? (
          <p>Belum ada murid yang disetujui. Bagikan kode kelas di atas.</p>
        ) : (
          <ul className="space-y-4">
            {active.map((m) => {
              const mine = res.filter((r) => r.uid === m.uid);
              const avg = mine.length ? Math.round(mine.reduce((a, r) => a + r.score, 0) / mine.length) : 0;
              return (
                <li key={m.uid} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 font-semibold">
                    <span className="min-w-0 truncate">{m.displayName}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {mine.length === 0 ? <Badge tone="netral">Belum mengerjakan</Badge> : <Badge tone="hijau">{mine.length} kuis · rata-rata {avg}</Badge>}
                      <button
                        type="button"
                        aria-label={`Keluarkan ${m.displayName}`}
                        disabled={busy}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-tinta bg-gading"
                        onClick={async () => {
                          const ok = await confirm({ title: 'Keluarkan murid?', message: `${m.displayName} tidak lagi menjadi anggota kelas ini.`, confirmLabel: 'Keluarkan', danger: true });
                          if (ok) void act(() => setMemberStatus(c.id, m.uid, 'removed'), members.reload);
                        }}
                      >
                        <Icon name="close" size={18} />
                      </button>
                    </span>
                  </div>
                  <ProgressBar value={avg} label={`Rata-rata ${m.displayName}`} />
                  {mine.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 pt-1">
                      {mine.map((r) => (
                        <li key={r.quizId}><Badge tone={r.score >= 67 ? 'hijau' : 'jingga'}>{(sampleContents.find((x) => x.id === r.quizId)?.title ?? r.quizId).replace(' (contoh)', '')}: {r.score}</Badge></li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-sm text-tinta/75">Nilai muncul setelah murid mengerjakan kuis saat online. Murid yang offline akan tersinkron nanti.</p>
      </Card>

      <ButtonLink to={`${MODE_BASE.teacher}/langsung?kelas=${c.id}`} block size="lg">
        <Icon name="play" size={22} />
        Mulai kelas langsung (1 perangkat)
      </ButtonLink>
    </Page>
  );
}
