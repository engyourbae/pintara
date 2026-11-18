import { Badge, ButtonLink, Card, Icon, Page, PageHeader, ProgressBar, Stat } from '@/components/ui';
import { FormError } from '@/features/auth/parts';
import { MODE_BASE } from '@/app/navigation';
import { sampleContents } from '@/data/sample';
import { useAuth } from '@/hooks/useAuth';
import { levelInfo } from '@/hooks/useProgress';
import { listChildren } from '@/services/firebase/auth';
import { loadChildProgress } from '@/services/firebase/classes';
import { useLoad } from '@/features/teacher/useTeacherData';
import type { ChildProgress } from '@/types';

const TIPS = [
  'Temani anak belajar 15–20 menit saja, lalu beri jeda.',
  'Tanyakan "kenapa jawabannya begitu?" bukan hanya "benar atau salah?".',
  'Rayakan usaha, bukan hanya nilai. Bintang itu bonus.',
  'Pastikan anak cukup tidur dan makan sebelum belajar.',
];

const titleOf = (id: string) => (sampleContents.find((c) => c.id === id)?.title ?? id).replace(' (contoh)', '');
const fmt = (d: Date | null) => (d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '');

function useChildren() {
  const { user } = useAuth();
  return useLoad<ChildProgress[]>(async () => {
    const kids = await listChildren(user?.uid ?? '');
    return Promise.all(kids.map((k) => loadChildProgress(k)));
  }, [user?.uid]);
}

const NOTE = 'Data diambil dari akun anak. Muncul setelah anak belajar saat online; bila belum ada, anak belum belajar atau belum tersinkron.';

export function ParentHome() {
  const { user } = useAuth();
  const q = useChildren();
  const kids = q.data ?? [];
  return (
    <Page>
      <PageHeader title={`Halo, ${user?.displayName || 'Bapak/Ibu'}!`} subtitle="Sampai mana anakmu belajar." icon="users" />
      <FormError message={q.error} />
      {q.loading ? (
        <p role="status">Memuat…</p>
      ) : kids.length === 0 ? (
        <Card tone="catatan" className="space-y-3">
          <p>Belum ada akun anak. Buat dulu agar kemajuannya bisa dipantau.</p>
          <ButtonLink to={`${MODE_BASE.parent}/anak`}>Buat akun anak</ButtonLink>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {kids.map((k) => {
            const done = k.items.length;
            const avg = done ? Math.round(k.items.reduce((a, i) => a + i.bestScore, 0) / done) : 0;
            return (
              <li key={k.child.uid}>
                <Card className="h-full space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="min-w-0 truncate text-xl">{k.child.displayName}</h2>
                    <Badge tone="kuning">Level {levelInfo(k.xp).level}</Badge>
                  </div>
                  <p className="text-sm">{k.xp} XP · {done} dari {sampleContents.length} paket kuis dikerjakan</p>
                  <ProgressBar value={avg} label={`Rata-rata nilai ${k.child.displayName}`} />
                  <p className="text-sm font-semibold">Rata-rata nilai terbaik: {done ? avg : '–'}</p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <ButtonLink to={`${MODE_BASE.parent}/perkembangan`} variant="sekunder" block>Lihat rincian perkembangan</ButtonLink>
      <Card tone="langit" className="space-y-2">
        <h2 className="text-xl">Tips mendampingi</h2>
        <ul className="space-y-2">
          {TIPS.map((t) => (
            <li key={t} className="flex items-start gap-3">
              <Icon name="heart" size={20} className="mt-1 shrink-0 text-aksen-tua" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>
    </Page>
  );
}

export function ParentProgress() {
  const q = useChildren();
  const kids = q.data ?? [];
  return (
    <Page>
      <PageHeader title="Perkembangan" subtitle="Hasil terbaik anak di tiap paket kuis." icon="chart" />
      <FormError message={q.error} />
      {q.loading ? (
        <p role="status">Memuat…</p>
      ) : kids.length === 0 ? (
        <Card tone="catatan">Belum ada akun anak.</Card>
      ) : (
        kids.map((k) => {
          const by = new Map(k.items.map((i) => [i.contentId, i]));
          return (
            <section key={k.child.uid} className="space-y-3">
              <h2 className="text-2xl">{k.child.displayName}</h2>
              <div className="grid grid-cols-3 gap-3">
                <Stat icon="trophy" value={k.xp} label="XP" />
                <Stat icon="check" value={k.items.length} label="Kuis dikerjakan" />
                <Stat icon="star" value={k.items.reduce((a, i) => a + (i.bestScore >= 100 ? 3 : i.bestScore >= 67 ? 2 : i.bestScore > 0 ? 1 : 0), 0)} label="Bintang" />
              </div>
              <Card className="space-y-4">
                {sampleContents.map((c) => {
                  const it = by.get(c.id);
                  return (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 font-semibold">
                        <span className="min-w-0 truncate">{titleOf(c.id)}</span>
                        {it ? <Badge tone={it.bestScore >= 67 ? 'hijau' : 'jingga'}>{it.bestScore} · {it.attempts}x{it.lastPlayedAt ? ` · ${fmt(it.lastPlayedAt)}` : ''}</Badge> : <Badge tone="netral">Belum</Badge>}
                      </div>
                      <ProgressBar value={it?.bestScore ?? 0} label={`Nilai terbaik ${titleOf(c.id)}`} />
                    </div>
                  );
                })}
              </Card>
            </section>
          );
        })
      )}
      <Card tone="catatan" className="flex items-start gap-3">
        <Icon name="shield" size={24} className="mt-0.5 shrink-0" />
        <p>{NOTE}</p>
      </Card>
    </Page>
  );
}
