import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, ButtonLink, Card, ChoiceGroup, Icon, Page, PageHeader, ProgressBar, useConfirm } from '@/components/ui';
import { Field, FormError } from '@/features/auth/parts';
import { MODE_BASE } from '@/app/navigation';
import { sampleCategories, sampleContents } from '@/data/sample';
import { friendlyError } from '@/services/firebase/auth';
import { addMission, deleteClassCascade, deleteMission, listMembers, listMissions, listResults, pruneClassResults, setMemberStatus, updateClass } from '@/services/firebase/classes';
import { GAME_MISSIONS, resultKeyOf, resultTitle } from '@/data/missions';
import { useAuth } from '@/hooks/useAuth';
import { listMyClasses } from '@/services/firebase/classes';
import type { Grade } from '@/types';
import { copyText, inviteUrl } from '@/utils/share';
import { ContentPicker, type PickItem } from './ContentPicker';
import { TeacherQuizPanel } from './TeacherQuizPanel';
import { useLoad } from './useTeacherData';

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];
type Kind = 'quiz' | 'game';
const categoryName = (id: string) => sampleCategories.find((c) => c.id === id)?.name ?? '';
const QUIZ_ITEMS: PickItem[] = sampleContents.map((x) => ({ id: x.id, title: x.title.replace(' (contoh)', ''), sub: `${categoryName(x.categoryId)} · Kelas ${x.grades.join(', ')}` }));

export function ClassDetail() {
  const { classId = '' } = useParams();
  const { user } = useAuth();
  const confirm = useConfirm();
  const nav = useNavigate();
  const [notice, setNotice] = useState('');
  const cls = useLoad(async () => (await listMyClasses(user?.uid ?? '')).find((c) => c.id === classId) ?? null, [classId, user?.uid]);
  const members = useLoad(() => listMembers(classId), [classId]);
  const results = useLoad(() => listResults(classId), [classId]);
  const missions = useLoad(() => listMissions(classId), [classId]);
  const [kind, setKind] = useState<Kind>('quiz');
  const [pick, setPick] = useState('');
  const [note, setNote] = useState('');
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'kode' | 'tautan' | null>(null);

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

  async function copy(kind: 'kode' | 'tautan', text: string) {
    if (await copyText(text)) {
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } else {
      setError('Tidak bisa menyalin otomatis. Catat kodenya dan bagikan manual.');
    }
  }

  async function share(code: string, className: string) {
    const url = inviteUrl(code);
    const text = `Ayo gabung kelas "${className}" di PINTARA. Kode kelas: ${code}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Undangan kelas PINTARA', text, url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    await copy('tautan', `${text}\n${url}`);
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
  const assigned = new Set((missions.data ?? []).filter((m) => m.kind === kind).map((m) => m.contentId));
  const editing = name ?? c.name;
  const dirty = editing.trim() !== c.name && editing.trim().length > 0;

  return (
    <Page>
      <PageHeader title={c.name} subtitle={`Kelas ${c.grade}${c.archived ? ' · diarsipkan' : ''}`} icon="board" />
      <Link to={`${MODE_BASE.teacher}/kelas`} className="inline-flex items-center gap-1 font-semibold underline">Semua kelas</Link>
      <FormError message={error || members.error || results.error || missions.error} />
      {notice && <p role="status" className="rounded-2xl border-2 border-tinta bg-hijau-100 px-4 py-3 font-semibold">{notice}</p>}

      <Card tone="catatan" className="space-y-2">
        <p className="font-display text-lg font-semibold">Kode gabung kelas</p>
        <p className="font-display text-4xl font-bold tracking-[0.3em]" aria-label={`Kode ${c.joinCode.split('').join(' ')}`}>{c.joinCode}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="sekunder" onClick={() => void copy('kode', c.joinCode)}>{copied === 'kode' ? 'Kode tersalin ✓' : 'Salin kode'}</Button>
          <Button variant="sekunder" onClick={() => void copy('tautan', inviteUrl(c.joinCode))}>{copied === 'tautan' ? 'Tautan tersalin ✓' : 'Salin tautan'}</Button>
          <Button onClick={() => void share(c.joinCode, c.name)}>Bagikan undangan</Button>
        </div>
        <p className="text-sm">Siswa mengetik kode di Beranda akun mereka, atau membuka tautan undangan (kode terisi otomatis). Kamu tetap harus menyetujui tiap siswa. Bila tautan tersebar, arsipkan kelas agar tidak ada yang bisa bergabung.</p>
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

      <Card className="space-y-4">
        <h2 className="text-xl">Misi kelas</h2>
        <p className="text-sm text-tinta/80">Pilih kuis atau game yang harus dikerjakan murid. Misi muncul di halaman kelas murid.</p>
        {(missions.data ?? []).length === 0 ? (
          <p>Belum ada misi.</p>
        ) : (
          <ul className="space-y-2">
            {(missions.data ?? []).map((m) => {
              const done = new Set(res.filter((r) => r.quizId === resultKeyOf(m)).map((r) => r.uid));
              const n = active.filter((a) => done.has(a.uid)).length;
              return (
                <li key={m.id} className="flex items-center justify-between gap-2 rounded-2xl border-2 border-tinta bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{m.title}</p>
                    <p className="text-sm text-tinta/75">{m.kind === 'quiz' ? 'Kuis' : 'Game'} · {n} dari {active.length} murid selesai</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Hapus misi ${m.title}`}
                    disabled={busy}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-tinta bg-gading"
                    onClick={async () => {
                      const ok = await confirm({ title: 'Hapus misi?', message: `Misi "${m.title}" hilang dari halaman murid, dan hasil murid untuk misi ini ikut dihapus dari server. Pelajaran itu bisa ditugaskan lagi nanti.`, confirmLabel: 'Hapus', danger: true });
                      if (ok) void act(() => deleteMission(c.id, m), async () => { await missions.reload(); await results.reload(); });
                    }}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="space-y-3 rounded-2xl bg-kuning-100 p-3">
          <ChoiceGroup<Kind> label="Tambah misi" value={kind} onChange={(k) => { setKind(k); setPick(''); }} options={[{ value: 'quiz', label: 'Kuis' }, { value: 'game', label: 'Game' }]} />
          {kind === 'quiz' ? (
            <ContentPicker key="quiz" label="Pilih kuis" items={QUIZ_ITEMS} value={pick} onChange={setPick} disabledIds={assigned} />
          ) : (
            <ChoiceGroup
              label="Pilih game"
              value={pick}
              onChange={setPick}
              options={GAME_MISSIONS.map((g) => ({ value: g.id, label: assigned.has(g.id) ? `${g.title} (sudah ditugaskan)` : g.title, disabled: assigned.has(g.id) }))}
            />
          )}
          <Field label="Pesan untuk murid (boleh kosong)" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
          <Button
            disabled={!pick || busy}
            onClick={() =>
              void act(
                () => addMission(c.id, { kind, contentId: pick, title: resultTitle(kind === 'game' ? `game_${pick}` : pick), note }),
                async () => { setPick(''); setNote(''); await missions.reload(); },
              )
            }
          >
            Beri misi
          </Button>
        </div>
      </Card>

      <TeacherQuizPanel classId={c.id} members={active} />

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
                        <li key={r.quizId}><Badge tone={r.score >= 67 ? 'hijau' : 'jingga'}>{resultTitle(r.quizId)}: {r.score}</Badge></li>
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

      <Card className="space-y-3">
        <h2 className="text-xl">Kelola data kelas</h2>
        <p className="text-sm text-tinta/80">Supaya penyimpanan tidak penuh, hapus data yang tidak dipakai lagi.</p>
        <Button
          variant="sekunder"
          block
          disabled={busy}
          onClick={async () => {
            const ok = await confirm({ title: 'Bersihkan hasil lama?', message: 'Hasil murid dari kuis/game yang bukan misi kelas sekarang akan dihapus dari server. Misi dan nilai kuis guru tidak ikut terhapus.', confirmLabel: 'Bersihkan', danger: true });
            if (!ok) return;
            setBusy(true);
            setError('');
            setNotice('');
            try {
              const n = await pruneClassResults(c.id);
              setNotice(n === 0 ? 'Tidak ada hasil lama yang perlu dibersihkan.' : `${n} hasil lama dihapus.`);
              await results.reload();
            } catch (e) {
              setError(friendlyError(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Icon name="trash" size={20} />
          Bersihkan hasil lama
        </Button>
        <Button
          variant="sekunder"
          block
          disabled={busy}
          onClick={async () => {
            const ok = await confirm({
              title: `Hapus kelas "${c.name}"?`,
              message: 'Kelas, misi, kuis buatan guru beserta kunci dan jawaban, semua nilai, daftar murid, dan kode gabung akan dihapus permanen dari server. Murid tidak lagi tergabung di kelas ini. Tidak bisa dibatalkan.',
              confirmLabel: 'Hapus kelas',
              danger: true,
            });
            if (!ok) return;
            setBusy(true);
            setError('');
            try {
              await deleteClassCascade({ id: c.id, joinCode: c.joinCode });
              nav(`${MODE_BASE.teacher}/kelas`, { replace: true });
            } catch (e) {
              setError(friendlyError(e));
              setBusy(false);
            }
          }}
        >
          <Icon name="trash" size={20} />
          Hapus kelas
        </Button>
      </Card>
    </Page>
  );
}
