import { Badge, Button, Card, Icon, Page, PageHeader, ProgressBar, Stat } from '@/components/ui';
import { levelInfo, progressActions, totalStars, useProgress } from '@/hooks/useProgress';
import { sampleContents } from '@/data/sample';

const TIPS = [
  'Temani anak belajar 15–20 menit saja, lalu beri jeda.',
  'Tanyakan "kenapa jawabannya begitu?" bukan hanya "benar atau salah?".',
  'Rayakan usaha, bukan hanya nilai. Bintang itu bonus.',
  'Pastikan anak cukup tidur dan makan sebelum belajar.',
];

export function ParentHome() {
  const p = useProgress();
  const { level } = levelInfo(p.xp);
  const accuracy = p.answered ? Math.round((p.correct / p.answered) * 100) : 0;
  return (
    <Page>
      <PageHeader title="Halo, Bapak/Ibu!" subtitle="Ringkasan belajar dari perangkat ini." icon="users" />
      <div className="grid grid-cols-3 gap-3">
        <Stat icon="trophy" value={`Lv ${level}`} label="Level" />
        <Stat icon="flame" value={p.streak} label="Hari berturut" />
        <Stat icon="check" value={`${accuracy}%`} label="Ketepatan" />
      </div>
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
  const p = useProgress();
  return (
    <Page>
      <PageHeader title="Perkembangan" subtitle="Bintang per paket kuis di perangkat ini." icon="chart" />
      <div className="grid grid-cols-3 gap-3">
        <Stat icon="trophy" value={p.xp} label="XP" />
        <Stat icon="star" value={totalStars(p)} label="Bintang" />
        <Stat icon="check" value={p.correct} label="Benar" />
      </div>
      <Card className="space-y-4">
        {sampleContents.map((c) => {
          const s = p.stars[c.id] ?? 0;
          return (
            <div key={c.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2 font-semibold">
                <span className="min-w-0 truncate">{c.title.replace(' (contoh)', '')}</span>
                {s === 0 ? <Badge tone="netral">Belum</Badge> : <Badge tone="kuning">{s} bintang</Badge>}
              </div>
              <ProgressBar value={s} max={3} label={`Bintang ${c.title}`} />
            </div>
          );
        })}
      </Card>
    </Page>
  );
}

export function ParentSettings() {
  return (
    <Page>
      <PageHeader title="Pengaturan" subtitle="Data dan privasi." icon="settings" />
      <Card tone="langit" className="flex items-start gap-3">
        <Icon name="shield" size={26} className="mt-0.5 shrink-0" />
        <p>
          Kemajuan belajar di halaman Perkembangan masih berasal dari perangkat ini dan belum disinkronkan ke akun anak.
        </p>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-xl">Hapus data belajar</h2>
        <p>Menghapus nama, XP, bintang, dan skor game di perangkat ini. Tidak bisa dibatalkan.</p>
        <Button
          variant="sekunder"
          onClick={() => {
            if (window.confirm('Hapus semua data belajar di perangkat ini?')) progressActions.reset();
          }}
        >
          <Icon name="trash" size={20} />
          Hapus data
        </Button>
      </Card>
      <Card tone="catatan" className="flex items-start gap-3">
        <Icon name="lock" size={24} className="mt-0.5 shrink-0" />
        <p>Akun anak, izin pertemanan, dan batas waktu bermain diatur di menu Anak.</p>
      </Card>
    </Page>
  );
}
