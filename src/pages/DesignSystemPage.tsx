import { Badge, Button, ButtonLink, Card, Icon, Logo, ProgressBar, SampleBadge, type IconName } from '@/components/ui';
import { MODE_LABEL } from '@/app/navigation';
import type { Role } from '@/types';

const ROLES: Role[] = ['student', 'teacher', 'parent'];
const ICONS: IconName[] = ['home', 'book', 'game', 'users', 'user', 'board', 'chart', 'settings', 'star', 'check', 'lock', 'heart', 'pencil', 'offline'];

function ModeSample({ role }: { role: Role }) {
  return (
    <section data-mode={role} className="rounded-3xl bg-krem p-4 ring-2 ring-tinta/10">
      <h2 className="mb-3 text-xl font-bold text-aksen-tua">{MODE_LABEL[role]}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <Button>Utama</Button>
        <Button variant="sekunder">Sekunder</Button>
        <Button variant="aksi">Aksi</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Nonaktif</Button>
        <Button size="lg">Besar</Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <Badge>Kelas 3</Badge>
            <SampleBadge />
          </div>
          <p className="font-bold">Kartu kertas</p>
          <div className="mt-3">
            <ProgressBar value={60} label="Progres contoh" />
          </div>
        </Card>
        <Card tone="papan">
          <p className="font-bold">Panel papan tulis</p>
          <p className="text-sm opacity-90">Untuk tampilan proyektor guru.</p>
        </Card>
        <Card tone="catatan">
          <p className="font-bold">Catatan tempel</p>
          <p className="text-sm">Untuk tips dan pengingat.</p>
        </Card>
      </div>
    </section>
  );
}

/** Halaman peragaan komponen untuk pengembang (bukan untuk pengguna akhir). */
export function DesignSystemPage() {
  return (
    <main className="latar-kertas min-h-screen">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Logo />
        <p className="text-lg">Belajar Bersama, Berkembang Bersama!</p>
        <Badge tone="langit">Halaman pengembang: design system</Badge>

        {ROLES.map((r) => (
          <ModeSample key={r} role={r} />
        ))}

        <Card>
          <h2 className="mb-3 text-xl font-bold">Ikon</h2>
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-7">
            {ICONS.map((n) => (
              <li key={n} className="flex flex-col items-center gap-1 text-sm">
                <Icon name={n} size={32} className="text-aksen-tua" />
                {n}
              </li>
            ))}
          </ul>
        </Card>

        <ButtonLink to="/" variant="sekunder">
          Kembali ke awal
        </ButtonLink>
      </div>
    </main>
  );
}
