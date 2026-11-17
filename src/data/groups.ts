import type { CategoryGroup } from '@/types';
import type { IconName } from '@/components/ui/Icon';

export interface GroupInfo {
  id: CategoryGroup;
  label: string;
  icon: IconName;
  /** Kelas warna latar kartu/chip untuk kelompok ini. */
  bg: string;
}

/** Label dan ikon kelompok kategori. Satu sumber untuk landing dan halaman belajar. */
export const GROUPS: GroupInfo[] = [
  { id: 'sekolah', label: 'Pelajaran Sekolah', icon: 'book', bg: 'bg-hijau-100' },
  { id: 'pengetahuan-umum', label: 'Pengetahuan Umum', icon: 'globe', bg: 'bg-langit-100' },
  { id: 'keterampilan-hidup', label: 'Keterampilan Hidup', icon: 'heart', bg: 'bg-jingga-300/40' },
  { id: 'berpikir', label: 'Melatih Berpikir', icon: 'bulb', bg: 'bg-kuning-100' },
  { id: 'literasi-digital', label: 'Literasi Digital', icon: 'chip', bg: 'bg-langit-100' },
];

export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g])) as Record<CategoryGroup, GroupInfo>;
