import { Badge, ButtonLink, Card, Icon, Page, PageHeader, ProgressBar, SampleBadge, Stat } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { sampleCategories, sampleContents } from '@/data/sample';

/** Semua angka kelas di bawah adalah CONTOH tampilan (belum ada akun/kelas nyata). */
const CLASSES = [
  { name: 'Kelas 3A', students: 26, avg: 74, done: 18 },
  { name: 'Kelas 3B', students: 24, avg: 68, done: 15 },
  { name: 'Kelas 4A', students: 28, avg: 81, done: 24 },
];

const AGENDA = [
  'Bagikan kuis Pecahan Sederhana ke Kelas 3A',
  'Tinjau hasil kuis Perkalian Kelas 3B',
  'Siapkan kuis Tata Surya untuk Kelas 4A',
];

export function TeacherHome() {
  return (
    <Page>
      <PageHeader title="Halo, Guru!" subtitle="Ringkasan kelasmu hari ini." icon="board" aside={<SampleBadge />} />
      <div className="grid grid-cols-3 gap-3">
        <Stat icon="board" value={CLASSES.length} label="Kelas" />
        <Stat icon="users" value={CLASSES.reduce((a, c) => a + c.students, 0)} label="Siswa" />
        <Stat icon="pencil" value={sampleContents.length} label="Paket kuis" />
      </div>
      <Card>
        <h2 className="text-xl">Agenda hari ini</h2>
        <ul className="mt-3 space-y-2">
          {AGENDA.map((a) => (
            <li key={a} className="flex items-start gap-3">
              <Icon name="check" size={22} className="mt-0.5 shrink-0 text-aksen" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </Card>
      <ButtonLink to={`${MODE_BASE.teacher}/kuis`} block size="lg">
        Lihat paket kuis
      </ButtonLink>
    </Page>
  );
}

export function TeacherClasses() {
  return (
    <Page>
      <PageHeader title="Kelas" subtitle="Daftar kelas dan kemajuannya." icon="board" aside={<SampleBadge />} />
      <ul className="grid gap-4 md:grid-cols-3">
        {CLASSES.map((c) => (
          <li key={c.name}>
            <Card className="h-full space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl">{c.name}</h2>
                <Badge tone="langit">{c.students} siswa</Badge>
              </div>
              <ProgressBar value={c.avg} label={`Rata-rata nilai ${c.name}`} />
              <p className="text-sm">
                Rata-rata <strong>{c.avg}</strong> · {c.done} dari {c.students} siswa sudah mengerjakan
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </Page>
  );
}

export function TeacherQuizzes() {
  return (
    <Page>
      <PageHeader title="Kuis" subtitle="Paket kuis yang tersedia." icon="pencil" aside={<SampleBadge />} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {sampleContents.map((c) => (
          <li key={c.id}>
            <Card className="flex h-full flex-col gap-3 p-4">
              <div>
                <p className="font-display text-lg font-semibold leading-snug">{c.title.replace(' (contoh)', '')}</p>
                <p className="text-sm text-tinta/75">{sampleCategories.find((x) => x.id === c.categoryId)?.name}</p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <Badge tone="hijau">Kelas {c.grades.join(', ')}</Badge>
                  <Badge tone="netral">{c.questions.length} soal</Badge>
                </div>
                <ButtonLink to={`${MODE_BASE.student}/belajar/${c.id}`} variant="sekunder">
                  Coba
                </ButtonLink>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Page>
  );
}

export function TeacherResults() {
  return (
    <Page>
      <PageHeader title="Hasil" subtitle="Penguasaan materi per topik (contoh)." icon="chart" aside={<SampleBadge />} />
      <Card className="space-y-4">
        {[
          ['Penjumlahan', 92],
          ['Perkalian dasar', 71],
          ['Pecahan sederhana', 54],
          ['Tata surya', 83],
        ].map(([topic, v]) => (
          <div key={topic} className="space-y-1">
            <div className="flex justify-between font-semibold">
              <span>{topic}</span>
              <span>{v}%</span>
            </div>
            <ProgressBar value={Number(v)} label={`Penguasaan ${topic}`} />
          </div>
        ))}
      </Card>
      <Card tone="catatan" className="flex items-start gap-3">
        <Icon name="bulb" size={24} className="mt-0.5 shrink-0" />
        <p>Topik dengan angka rendah, seperti pecahan, bisa diulang dengan contoh benda nyata sebelum kuis berikutnya.</p>
      </Card>
    </Page>
  );
}
