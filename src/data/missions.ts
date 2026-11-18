import { sampleContents } from '@/data/sample';
import type { Mission } from '@/types';

/** Game yang dapat dijadikan misi kelas. `keys` = kunci skor di kemajuan lokal (gameBest). */
export const GAME_MISSIONS = [
  { id: 'kilat-hitung', title: 'Kilat Hitung', keys: ['kilat-mudah', 'kilat-sedang', 'kilat-seru'] },
  { id: 'susun-kata', title: 'Susun Kata', keys: ['susun-kata'] },
  { id: 'teka-pola', title: 'Teka Pola', keys: ['teka-pola'] },
] as const;

/** Kunci hasil kelas untuk sebuah misi (kuis memakai id kuis; game memakai awalan game_). */
export const resultKeyOf = (m: Pick<Mission, 'kind' | 'contentId'>) => (m.kind === 'game' ? `game_${m.contentId}` : m.contentId);

/** Id game dari kunci skor lokal (kilat-mudah -> kilat-hitung). */
export function gameIdOfKey(key: string): string {
  return GAME_MISSIONS.find((g) => (g.keys as readonly string[]).includes(key))?.id ?? key;
}

/** Judul ramah untuk kunci hasil (kuis atau game). */
export function resultTitle(key: string): string {
  if (key.startsWith('game_')) return GAME_MISSIONS.find((g) => g.id === key.slice(5))?.title ?? key;
  return (sampleContents.find((c) => c.id === key)?.title ?? key).replace(' (contoh)', '');
}
