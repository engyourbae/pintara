import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cn } from '@/utils/cn';

/** Pembungkus halaman dalam mode: lebar, jarak, dan animasi masuk yang seragam. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('mx-auto w-full max-w-5xl animate-naik space-y-6 px-4 py-6 sm:py-8', className)}>{children}</main>;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Elemen di kanan judul (mis. SampleBadge). */
  aside?: ReactNode;
}

export function PageHeader({ title, subtitle, icon, aside }: HeaderProps) {
  return (
    <header className="flex items-start gap-3">
      {icon && (
        <span className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aksen-muda text-aksen-tua">
          <Icon name={icon} size={26} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-tinta/80">{subtitle}</p>}
      </div>
      {aside}
    </header>
  );
}

/** Angka ringkas dengan ikon. Tinggi dan susunan selalu sama. */
export function Stat({ icon, value, label }: { icon: IconName; value: string | number; label: string }) {
  return (
    <div className="stiker flex flex-col items-center gap-1 rounded-3xl bg-gading px-2 py-4 text-center">
      <Icon name={icon} size={26} className="text-aksen-tua" />
      <p className="font-display text-2xl font-semibold leading-none">{value}</p>
      <p className="text-sm font-semibold text-tinta/75">{label}</p>
    </div>
  );
}
