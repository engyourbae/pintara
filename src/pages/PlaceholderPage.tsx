import { ButtonLink, Card, Mascot, Page, PageHeader } from '@/components/ui';
import { MODE_BASE, MODE_LABEL } from '@/app/navigation';
import type { Role } from '@/types';

interface Props {
  role: Role;
  title: string;
  phase: 'E' | 'F';
}

/** Halaman yang memang belum dibangun. Jujur soal itu, tapi tetap ramah. */
export function PlaceholderPage({ role, title, phase }: Props) {
  return (
    <Page>
      <PageHeader title={title} subtitle={MODE_LABEL[role]} />
      <Card tone="catatan" className="flex flex-col items-center gap-4 py-8 text-center">
        <Mascot size={120} className="animate-melayang" />
        <div>
          <p className="font-display text-xl font-semibold">Segera hadir</p>
          <p className="mt-1 text-tinta/85">
            {phase === 'F'
              ? 'Fitur ini butuh akun dan keamanan data, jadi dibuat setelah login siap.'
              : 'Halaman ini sedang disiapkan.'}
          </p>
        </div>
        <ButtonLink to={MODE_BASE[role]} variant="sekunder">
          Kembali ke beranda
        </ButtonLink>
      </Card>
    </Page>
  );
}
