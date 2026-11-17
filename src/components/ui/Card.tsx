import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'kertas' | 'papan' | 'catatan';

const TONE: Record<Tone, string> = {
  kertas: 'rounded-3xl bg-gading shadow-kertas ring-2 ring-aksen-muda',
  papan: 'papan-tulis',
  catatan: 'rounded-3xl bg-kuning-100 shadow-kertas',
};

interface Props extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
}

export function Card({ tone = 'kertas', className, ...rest }: Props) {
  return <div className={cn(TONE[tone], 'p-5', className)} {...rest} />;
}
