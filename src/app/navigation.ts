import type { Role } from '@/types';

export interface NavItem {
  path: string;
  label: string;
  /** Fase yang akan membangun halaman ini. */
  phase: 'E' | 'F';
}

/** Navigasi tiap mode. Satu sumber untuk router dan layout (Fase D/E). */
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
    { path: '', label: 'Beranda', phase: 'E' },
    { path: 'belajar', label: 'Belajar', phase: 'E' },
    { path: 'game', label: 'Permainan', phase: 'E' },
    { path: 'teman', label: 'Teman', phase: 'F' },
    { path: 'profil', label: 'Profil', phase: 'E' },
  ],
  teacher: [
    { path: '', label: 'Beranda', phase: 'E' },
    { path: 'kelas', label: 'Kelas', phase: 'E' },
    { path: 'kuis', label: 'Kuis', phase: 'E' },
    { path: 'hasil', label: 'Hasil', phase: 'E' },
  ],
  parent: [
    { path: '', label: 'Beranda', phase: 'E' },
    { path: 'perkembangan', label: 'Perkembangan', phase: 'E' },
    { path: 'pengaturan', label: 'Pengaturan', phase: 'E' },
  ],
};
