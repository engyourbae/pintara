import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'hijau' | 'kuning' | 'langit' | 'jingga' | 'netral';

const TONE: Record<Tone, string> = {
  hijau: 'bg-hijau-100 text-hijau-700',
  kuning: 'bg-kuning-100 text-tinta',
  langit: 'bg-langit-100 text-langit-700',
  jingga: 'bg-jingga-300/40 text-[#8A4410]',
  netral: 'bg-white text-tinta ring-1 ring-tinta/20',
};

export function Badge({ tone = 'hijau', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-bold', TONE[tone])}>
      {children}
    </span>
  );
}

/** Wajib dipasang pada setiap data dummy agar tidak disangka data nyata. */
export function SampleBadge() {
  return (
    <span className="inline-flex items-center rounded-full border-2 border-dashed border-jingga-600 px-3 py-0.5 text-xs font-bold tracking-wide text-[#8A4410]">
      DATA CONTOH
    </span>
  );
}
