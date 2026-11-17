import type { Role } from '@/types';
import type { IconName } from '@/components/ui/Icon';

export interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  /** Fase yang akan membangun halaman ini. */
  phase: 'E' | 'F';
}

/** Navigasi tiap mode. Satu sumber untuk router dan layout. */
export const MODE_BASE: Record<Role, string> = {
  student: '/siswa',
  teacher: '/guru',
  parent: '/ortu',
};

export const MODE_LABEL: Record<Role, string> = {
  student: 'Ruang Anak',
  teacher: 'Ruang Guru',
  parent: 'Ruang Orang Tua',
};

export const NAV: Record<Role, NavItem[]> = {
  student: [
    { path: '', label: 'Beranda', icon: 'home', phase: 'E' },
    { path: 'belajar', label: 'Belajar', icon: 'book', phase: 'E' },
    { path: 'game', label: 'Permainan', icon: 'game', phase: 'E' },
    { path: 'teman', label: 'Teman', icon: 'users', phase: 'F' },
    { path: 'profil', label: 'Profil', icon: 'user', phase: 'E' },
  ],
  teacher: [
    { path: '', label: 'Beranda', icon: 'home', phase: 'E' },
    { path: 'kelas', label: 'Kelas', icon: 'board', phase: 'E' },
    { path: 'kuis', label: 'Kuis', icon: 'pencil', phase: 'E' },
    { path: 'hasil', label: 'Hasil', icon: 'chart', phase: 'E' },
  ],
  parent: [
    { path: '', label: 'Beranda', icon: 'home', phase: 'E' },
    { path: 'perkembangan', label: 'Perkembangan', icon: 'chart', phase: 'E' },
    { path: 'anak', label: 'Anak', icon: 'user', phase: 'F' },
    { path: 'pengaturan', label: 'Pengaturan', icon: 'settings', phase: 'E' },
  ],
};
