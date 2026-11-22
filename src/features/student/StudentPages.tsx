import { ChangePasswordCard } from '@/features/auth/ChangePasswordCard';
import { lazy, Suspense, useState } from 'react';
import { Badge, Button, ButtonLink, Card, CardSkeleton, Icon, Mascot, Page, PageHeader, ProgressBar, Stat, useConfirm } from '@/components/ui';
import { AVATARS, levelInfo, progressActions, totalStars, useProgress } from '@/hooks/useProgress';
import { MODE_BASE } from '@/app/navigation';
import { sampleContents } from '@/data/sample';
import { useAuth } from '@/hooks/useAuth';
/** Kartu gabung kelas membawa SDK Firebase; dimuat setelah halaman tampil agar layar awal tidak menunggu unduhan besar. */
const JoinClassCard = lazy(() => import('./JoinClassCard').then((m) => ({ default: m.JoinClassCard })));
import { cn } from '@/utils/cn';

const TIPS = [
  'Baca soal pelan-pelan, lalu pilih jawaban yang menurutmu paling tepat.',
  'Salah itu wajar. Penjelasan setelah menjawab membantumu mengerti.',
  'Belajar sebentar tiap hari lebih baik daripada lama sekali sehari.',
  'Istirahat sejenak ya, minum air dan regangkan badan.',
];

/** Nama tampilan: akun yang masuk memakai nama akunnya; mode tamu memakai nama lokal. */
function useStudentName(local: string): { name: string; fromAccount: boolean } {
  const { status, user } = useAuth();
  const acc = status === 'ready' && user?.role === 'student' ? user.displayName : '';
  return { name: acc || local, fromAccount: !!acc };
}

export function StudentHome() {
  const p = useProgress();
  const { name } = useStudentName(p.name);
  const { level, into } = levelInfo(p.xp);
  const next = sampleContents.find((c) => (p.stars[c.id] ?? 0) < 3) ?? sampleContents[0];
  const tip = TIPS[new Date().getDate() % TIPS.length];

  return (
    <Page>
      <Card tone="hijau" className="flex items-center gap-4">
        <Mascot size={92} mood="hore" className="shrink-0 animate-goyang" />
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="truncate text-2xl sm:text-3xl">Halo, {name || 'Teman'}!</h1>
          <div className="flex flex-wrap gap-2">
            <Badge tone="kuning">Level {level}</Badge>
            <Badge tone="jingga">
              <Icon name="flame" size={16} className="mr-1" />
              {p.streak} hari berturut
            </Badge>
          </div>
          <ProgressBar value={into} label={`Menuju level ${level + 1}`} />
          <p className="text-sm font-semibold">{100 - into} XP lagi menuju level {level + 1}</p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon="trophy" value={p.xp} label="XP" />
        <Stat icon="star" value={totalStars(p)} label="Bintang" />
        <Stat icon="check" value={p.correct} label="Jawaban benar" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ButtonLink to={`${MODE_BASE.student}/belajar/${next.id}`} size="lg" block>
          <Icon name="play" size={22} />
          Lanjut belajar
        </ButtonLink>
        <ButtonLink to={`${MODE_BASE.student}/game`} variant="aksi" size="lg" block>
          <Icon name="game" size={22} />
          Main game
        </ButtonLink>
      </div>

      <Suspense fallback={<CardSkeleton lines={2} />}>
        <JoinClassCard />
      </Suspense>

      <Card tone="catatan" className="flex items-start gap-3">
        <Icon name="bulb" size={26} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-display text-lg font-semibold">Tips hari ini</p>
          <p>{tip}</p>
        </div>
      </Card>
    </Page>
  );
}

export function StudentProfile() {
  const confirm = useConfirm();
  const p = useProgress();
  const { name: shownName, fromAccount } = useStudentName(p.name);
  const [name, setName] = useState(p.name);
  const { level } = levelInfo(p.xp);
  const avatar = AVATARS.find((a) => a.id === p.avatar) ?? AVATARS[0];

  return (
    <Page>
      <PageHeader title="Profil" subtitle="Atur namamu dan pilih avatar." icon="user" />

      <Card className="flex items-center gap-4">
        <span className={cn('stiker flex h-20 w-20 shrink-0 items-center justify-center rounded-full', avatar.bg)}>
          <Icon name={avatar.icon} size={40} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-2xl font-semibold">{shownName || 'Teman'}</p>
          <p className="text-tinta/80">
            Level {level} · {p.xp} XP · {totalStars(p)} bintang
          </p>
        </div>
      </Card>

      <Card className="space-y-4">
        {!fromAccount && (
        <div>
          <label htmlFor="nama" className="block font-display text-lg font-semibold">
            Namamu
          </label>
          <input
            id="nama"
            value={name}
            maxLength={20}
            onChange={(e) => {
              setName(e.target.value);
              progressActions.setProfile(e.target.value, p.avatar);
            }}
            placeholder="Tulis nama panggilan"
            className="mt-1 h-12 w-full rounded-2xl border-2 border-tinta bg-white px-4 text-lg"
          />
        </div>
        )}
        <fieldset>
          <legend className="font-display text-lg font-semibold">Pilih avatar</legend>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-pressed={a.id === p.avatar}
                aria-label={`Avatar ${a.id}`}
                onClick={() => progressActions.setProfile(p.name, a.id)}
                className={cn(
                  'flex h-16 items-center justify-center rounded-2xl border-2 border-tinta transition active:translate-y-0.5',
                  a.bg,
                  a.id === p.avatar ? 'shadow-stiker ring-4 ring-aksen/40' : 'opacity-85',
                )}
              >
                <Icon name={a.icon} size={30} />
              </button>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card tone="langit" className="flex items-start gap-3">
        <Icon name="shield" size={26} className="mt-0.5 shrink-0" />
        <p>
          {fromAccount
            ? 'Namamu mengikuti akunmu. Kemajuan belajarmu disalin ke akun agar guru dan orang tuamu bisa melihatnya.'
            : 'Namamu dan kemajuanmu hanya tersimpan di perangkat ini. Belum masuk akun, jadi tidak ada data yang dikirim ke internet.'}
        </p>
      </Card>

      <Button
        variant="sekunder"
        onClick={async () => {
          const ok = await confirm({
            title: 'Hapus kemajuan?',
            message: 'Nama, XP, bintang, dan skor game di perangkat ini akan dihapus dan tidak bisa dikembalikan.',
            confirmLabel: 'Hapus',
            danger: true,
          });
          if (ok) {
            progressActions.reset();
            setName('');
          }
        }}
      >
        <Icon name="trash" size={20} />
        Hapus kemajuan
      </Button>
      <ChangePasswordCard />
    </Page>
  );
}
