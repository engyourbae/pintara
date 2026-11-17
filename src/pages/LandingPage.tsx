import { Badge, ButtonLink, Card, Icon, Logo, SampleBadge, type IconName } from '@/components/ui';
import { MODE_BASE, MODE_LABEL } from '@/app/navigation';
import { sampleCategories } from '@/data/sample';
import { isFirebaseConfigured } from '@/services/firebase/config';
import type { Role } from '@/types';

const ROLES: Role[] = ['student', 'teacher', 'parent'];

const ROLE_INFO: Record<Role, { icon: IconName; desc: string; cta: string }> = {
  student: {
    icon: 'book',
    desc: 'Belajar lewat soal bergambar dan permainan seru, selangkah demi selangkah.',
    cta: 'Masuk Ruang Anak',
  },
  teacher: {
    icon: 'board',
    desc: 'Atur kelas, siapkan kuis, dan lihat hasil belajar siswa dengan tampilan papan tulis.',
    cta: 'Masuk Ruang Guru',
  },
  parent: {
    icon: 'users',
    desc: 'Pantau perkembangan anak dan atur izin penggunaan dengan tenang.',
    cta: 'Masuk Ruang Orang Tua',
  },
};

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'book', title: 'Belajar', text: 'Materi SD dipecah menjadi soal pendek dengan penjelasan setelah menjawab.' },
  { icon: 'game', title: 'Bermain', text: 'Game edukasi untuk melatih apa yang sudah dipelajari.' },
  { icon: 'star', title: 'Berkembang', text: 'Progres tersimpan agar anak, guru, dan orang tua melihat kemajuannya.' },
];

/** Landing PINTARA (Fase D). Login, game, dan PWA belum ada; teks di sini tidak boleh menjanjikan lebih dari itu. */
export function LandingPage() {
  return (
    <div className="latar-kertas min-h-screen">
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:py-12">
        <section aria-labelledby="judul" className="space-y-4">
          <Logo />
          <h1 id="judul" className="text-4xl font-extrabold leading-tight text-hijau-700 sm:text-5xl">
            Belajar Bersama,
            <br />
            Berkembang Bersama!
          </h1>
          <p className="max-w-xl text-lg">
            Platform belajar dan game edukasi untuk anak SD Indonesia, dengan ruang khusus untuk anak, guru, dan orang tua.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink to={MODE_BASE.student} size="lg">
              <Icon name="pencil" />
              Mulai Belajar
            </ButtonLink>
            <Badge tone="kuning">Dalam pengembangan</Badge>
          </div>
        </section>

        <section aria-labelledby="pilih-ruang" className="space-y-3">
          <h2 id="pilih-ruang" className="text-2xl font-bold">
            Pilih ruangmu
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {ROLES.map((role) => {
              const info = ROLE_INFO[role];
              return (
                <li key={role} data-mode={role}>
                  <Card className="flex h-full flex-col gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-aksen-muda text-aksen-tua">
                      <Icon name={info.icon} size={28} />
                    </span>
                    <h3 className="text-xl font-bold text-aksen-tua">{MODE_LABEL[role]}</h3>
                    <p className="flex-1">{info.desc}</p>
                    <ButtonLink to={MODE_BASE[role]} block>
                      {info.cta}
                    </ButtonLink>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="cara-kerja" className="space-y-3">
          <h2 id="cara-kerja" className="text-2xl font-bold">
            Cara kerjanya
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Card tone="catatan" className="h-full">
                  <p className="flex items-center gap-2 text-lg font-bold">
                    <Icon name={s.icon} />
                    {i + 1}. {s.title}
                  </p>
                  <p className="mt-1">{s.text}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <Card tone="papan" className="space-y-2">
          <p className="text-xl font-bold">Yang sedang disiapkan</p>
          <p>
            Saat ini baru kerangka: belum ada masuk akun, game, atau mode offline. Kategori materi di bawah masih contoh,
            bukan kurikulum final.
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <SampleBadge />
            <span>{sampleCategories.length} kategori contoh siap dipakai untuk uji tampilan.</span>
          </p>
        </Card>

        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-4 text-sm text-tinta/80">
          <span>PINTARA</span>
          <a href="#/desain" className="font-semibold underline">
            Halaman pengembang
          </a>
          {import.meta.env.DEV && <span>Firebase: {isFirebaseConfigured ? 'config terisi' : 'belum dikonfigurasi'}</span>}
        </footer>
      </main>
    </div>
  );
}
