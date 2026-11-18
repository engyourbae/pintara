import { Button, Card, Icon, Page, PageHeader, useConfirm } from '@/components/ui';
import { progressActions } from '@/hooks/useProgress';

export function ParentSettings() {
  const confirm = useConfirm();
  return (
    <Page>
      <PageHeader title="Pengaturan" subtitle="Data dan privasi." icon="settings" />
      <Card tone="langit" className="flex items-start gap-3">
        <Icon name="shield" size={26} className="mt-0.5 shrink-0" />
        <p>
          Kemajuan anak di menu Perkembangan diambil dari akun anak, bukan dari perangkat ini. Hapus data di bawah hanya memengaruhi data tamu di perangkat ini.
        </p>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-xl">Hapus data belajar</h2>
        <p>Menghapus nama, XP, bintang, dan skor game di perangkat ini. Tidak bisa dibatalkan.</p>
        <Button
          variant="sekunder"
          onClick={async () => {
            const ok = await confirm({
              title: 'Hapus data belajar?',
              message: 'Nama, XP, bintang, dan skor game di perangkat ini akan dihapus dan tidak bisa dikembalikan.',
              confirmLabel: 'Hapus',
              danger: true,
            });
            if (ok) progressActions.reset();
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
