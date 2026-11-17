import { Link } from 'react-router-dom';
import { Badge, ButtonLink, Card, Icon, Logo, Mascot, SampleBadge, Sparkle, type IconName } from '@/components/ui';
import { MODE_BASE, MODE_LABEL } from '@/app/navigation';
import { GROUPS } from '@/data/groups';
import { sampleCategories, sampleContents } from '@/data/sample';
import { isFirebaseConfigured } from '@/services/firebase/config';
import type { Role } from '@/types';

const ROLES: Role[] = ['student', 'teacher', 'parent'];

const ROLE_INFO: Record<Role, { icon: IconName; desc: string }> = {
  student: { icon: 'book', desc: 'Belajar lewat kuis dan permainan seru.' },
  teacher: { icon: 'board', desc: 'Atur kelas, siapkan kuis, lihat hasil.' },
  parent: { icon: 'users', desc: 'Pantau perkembangan dan atur data anak.' },
};

const STEPS: { icon: IconName; title: string; text: string; bg: string }[] = [
  { icon: 'book', title: 'Belajar', text: 'Materi SD dipecah jadi soal pendek, lengkap dengan penjelasan.', bg: 'bg-hijau-100' },
  { icon: 'game', title: 'Bermain', text: 'Game edukasi untuk melatih yang sudah dipelajari.', bg: 'bg-kuning-100' },
  { icon: 'star', title: 'Berkembang', text: 'Bintang dan level menunjukkan kemajuan setiap hari.', bg: 'bg-langit-100' },
];

/** Landing PINTARA. Teks di sini tidak boleh menjanjikan fitur yang belum ada (login, offline penuh, multiplayer). */
export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" aria-label="PINTARA, beranda" className="rounded-2xl">
          <Logo />
        </Link>
        <nav aria-label="Navigasi halaman" className="hidden items-center gap-1 font-display font-semibold md:flex">
          {[
            ['#ruang', 'Pilih ruang'],
            ['#cara', 'Cara kerja'],
            ['#materi', 'Materi'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="flex h-12 items-center rounded-2xl px-4 hover:bg-hijau-100">
              {label}
            </a>
          ))}
        </nav>
        <ButtonLink to="/masuk" variant="sekunder">
          Masuk
        </ButtonLink>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-4 pb-10 pt-4 sm:pt-8">
        {/* Hero */}
        <section aria-labelledby="judul" className="grid items-center gap-8 md:grid-cols-[1.15fr_1fr]">
          <div className="animate-naik space-y-5">
            <Badge tone="kuning">Untuk anak SD Indonesia</Badge>
            <h1 id="judul" className="text-[2.6rem] font-bold leading-[1.05] text-hijau-700 sm:text-6xl">
              Belajar Bersama, Berkembang Bersama!
            </h1>
            <p className="max-w-md text-lg">
              Kuis dan game edukasi yang menyenangkan, dengan ruang khusus untuk anak, guru, dan orang tua.
            </p>
            <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
              <ButtonLink to={MODE_BASE.student} size="lg" block>
                <Icon name="play" size={22} />
                Mulai Belajar
              </ButtonLink>
              <a
                href="#ruang"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-tinta bg-gading px-7 font-display text-lg font-semibold shadow-stiker transition active:translate-y-1 active:shadow-none"
              >
                Pilih Ruang
              </a>
            </div>
            <p className="text-sm text-tinta/70">Versi awal: belum perlu akun, kemajuan tersimpan di perangkat ini.</p>
          </div>

          <div className="relative mx-auto w-full max-w-sm animate-pop" style={{ animationDelay: '120ms' }}>
            <div className="stiker relative flex aspect-square items-center justify-center rounded-[2.5rem] bg-langit-100">
              <Mascot size={250} mood="hore" className="animate-melayang" label="Maskot PINTARA, burung hantu bernama Pinta" />
              <Sparkle className="absolute left-6 top-8" />
              <Sparkle className="absolute right-8 top-16" size={20} color="#FFDE6B" />
              <Sparkle className="absolute bottom-10 right-6" size={24} />
              <span className="stiker absolute -bottom-4 left-5 rounded-2xl bg-kuning-300 px-4 py-2 font-display font-semibold">
                Halo, aku Pinta!
              </span>
            </div>
          </div>
        </section>

        {/* Pilih ruang */}
        <section id="ruang" aria-labelledby="pilih-ruang" className="scroll-mt-4 space-y-4">
          <h2 id="pilih-ruang" className="text-3xl">
            Pilih ruangmu
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {ROLES.map((role, i) => (
              <li key={role} data-mode={role} className="animate-naik" style={{ animationDelay: `${i * 90}ms` }}>
                <Link
                  to={MODE_BASE[role]}
                  className="stiker group flex h-full items-center gap-4 rounded-3xl bg-gading p-4 transition active:translate-y-1 active:shadow-none md:flex-col md:items-start md:gap-3 md:p-5"
                >
                  <span className="stiker flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-aksen text-white">
                    <Icon name={ROLE_INFO[role].icon} size={28} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xl font-semibold text-aksen-tua">{MODE_LABEL[role]}</span>
                    <span className="block text-tinta/85">{ROLE_INFO[role].desc}</span>
                  </span>
                  <Icon name="arrow" className="shrink-0 text-aksen-tua transition group-hover:translate-x-1 md:self-end" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Cara kerja */}
        <section id="cara" aria-labelledby="cara-kerja" className="scroll-mt-4 space-y-4">
          <h2 id="cara-kerja" className="text-3xl">
            Cara kerjanya
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`stiker animate-naik rounded-3xl p-5 ${s.bg}`} style={{ animationDelay: `${i * 90}ms` }}>
                <div className="flex items-center gap-3">
                  <span className="stiker flex h-10 w-10 items-center justify-center rounded-full bg-gading font-display text-lg font-semibold">
                    {i + 1}
                  </span>
                  <Icon name={s.icon} size={26} />
                </div>
                <h3 className="mt-3 text-xl">{s.title}</h3>
                <p className="mt-1">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Materi */}
        <section id="materi" aria-labelledby="judul-materi" className="scroll-mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="judul-materi" className="text-3xl">
              Apa yang bisa dipelajari
            </h2>
            <SampleBadge />
          </div>
          <p className="text-tinta/85">
            {sampleCategories.length} kategori dalam {GROUPS.length} kelompok. Baru {sampleContents.length} paket kuis contoh yang bisa dicoba; isi
            lengkap menyusul.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {GROUPS.map((g) => (
              <Card key={g.id} className={`${g.bg} p-4`}>
                <h3 className="flex items-center gap-2 text-lg">
                  <Icon name={g.icon} />
                  {g.label}
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {sampleCategories
                    .filter((c) => c.group === g.id)
                    .map((c) => (
                      <li key={c.id} className="rounded-full border-2 border-tinta/25 bg-gading px-3 py-1 text-sm font-semibold">
                        {c.name}
                      </li>
                    ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* Ajakan */}
        <section aria-labelledby="ajakan">
          <Card tone="papan" className="flex flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:text-left">
            <Mascot size={96} mood="semangat" className="shrink-0 animate-goyang" />
            <div className="flex-1">
              <h2 id="ajakan" className="text-2xl">
                Siap belajar hari ini?
              </h2>
              <p className="opacity-90">Coba satu kuis pendek, kumpulkan bintang pertamamu.</p>
            </div>
            <ButtonLink to={`${MODE_BASE.student}/belajar`} variant="aksi" size="lg" className="w-full sm:w-auto">
              Coba Kuis
            </ButtonLink>
          </Card>
        </section>
      </main>

      <footer className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-8 text-sm text-tinta/75">
        <span className="font-display font-semibold">PINTARA</span>
        <span>Belajar Bersama, Berkembang Bersama!</span>
        <a href="#/desain" className="font-semibold underline">
          Halaman pengembang
        </a>
        {import.meta.env.DEV && <span>Firebase: {isFirebaseConfigured ? 'config terisi' : 'belum dikonfigurasi'}</span>}
      </footer>
    </div>
  );
}
