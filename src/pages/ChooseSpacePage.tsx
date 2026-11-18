import { Link } from 'react-router-dom';
import { ButtonLink, Card, Icon, Logo, type IconName } from '@/components/ui';
import { MODE_BASE, MODE_LABEL } from '@/app/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types';

const SPACES: { role: Role; icon: IconName; desc: string; tone: 'hijau' | 'kertas' | 'langit' }[] = [
  { role: 'student', icon: 'book', desc: 'Belajar dan bermain. Bisa dicoba tanpa akun.', tone: 'hijau' },
  { role: 'teacher', icon: 'board', desc: 'Kelas, kuis, dan hasil. Perlu akun guru.', tone: 'kertas' },
  { role: 'parent', icon: 'users', desc: 'Pantau anak dan atur izin. Perlu akun orang tua.', tone: 'langit' },
];

/** Pintu utama antar-ruang. Dapat dibuka dari tombol "Ganti ruang" di setiap mode. */
export function ChooseSpacePage() {
  const { status, user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" aria-label="PINTARA, beranda" className="rounded-2xl">
          <Logo />
        </Link>
        {status === 'ready' && user ? null : (
          <ButtonLink to="/masuk" variant="aksi" className="h-11 px-4">
            <Icon name="user" size={20} />
            Masuk
          </ButtonLink>
        )}
      </header>
      <main className="mx-auto w-full max-w-3xl animate-naik space-y-5 px-4 pb-10 pt-2">
        <div>
          <h1 className="text-3xl">Pilih ruang</h1>
          <p className="text-tinta/80">Mau masuk sebagai siapa?</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {SPACES.map((s) => (
            <Card key={s.role} tone={s.tone} className="flex flex-col gap-3">
              <Icon name={s.icon} size={34} />
              <h2 className="text-xl">{MODE_LABEL[s.role]}</h2>
              <p className="flex-1 text-tinta/85">{s.desc}</p>
              <ButtonLink to={MODE_BASE[s.role]} block>
                Buka
              </ButtonLink>
            </Card>
          ))}
        </div>
        <p className="text-center text-sm">
          <Link to="/admin" className="font-semibold text-tinta/70 underline underline-offset-4">
            Pengelola
          </Link>
        </p>
      </main>
    </div>
  );
}
