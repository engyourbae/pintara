import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'kertas' | 'papan' | 'catatan' | 'langit' | 'hijau';

const TONE: Record<Tone, string> = {
  kertas: 'rounded-3xl bg-gading stiker',
  papan: 'papan-tulis stiker',
  catatan: 'rounded-3xl bg-kuning-100 stiker',
  langit: 'rounded-3xl bg-langit-100 stiker',
  hijau: 'rounded-3xl bg-hijau-100 stiker',
};

interface Props extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
}

export function Card({ tone = 'kertas', className, ...rest }: Props) {
  return <div className={cn(TONE[tone], 'p-5', className)} {...rest} />;
}
