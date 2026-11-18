import type { LearningContent } from '@/types';

/**
 * Bank soal NYATA, ditambah bertahap. Tiap berkas di `batches/*.json` berisi larik paket kuis (lihat docs/BANK_SOAL.md).
 * Urutan paket mengikuti nama berkas. Jangan mengubah `id` paket yang sudah dipakai (kemajuan murid dan misi kelas memakainya);
 * bila isi soal direvisi, naikkan `version`.
 */
const modules = import.meta.glob('./batches/*.json', { eager: true, import: 'default' }) as Record<string, LearningContent[]>;

export const bankContents: LearningContent[] = Object.keys(modules)
  .sort()
  .flatMap((key) => modules[key]);
