import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/utils/cn';

type Variant = 'utama' | 'sekunder' | 'aksi' | 'ghost';
type Size = 'md' | 'lg';

interface StyleProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const VARIANT: Record<Variant, string> = {
  utama: 'border-tinta bg-aksen text-white shadow-stiker',
  sekunder: 'border-tinta bg-gading text-tinta shadow-stiker',
  aksi: 'border-tinta bg-kuning-500 text-tinta shadow-stiker',
  ghost: 'border-transparent bg-transparent text-aksen-tua hover:bg-aksen-muda',
};

/** Tinggi tetap per ukuran: semua tombol sejenis selalu sama besar. */
const SIZE: Record<Size, string> = {
  md: 'h-12 px-5 text-base',
  lg: 'h-14 px-7 text-lg',
};

/** Teks tombol tebal agar kontras memadai. Area sentuh minimal 48px. */
export function buttonClasses({ variant = 'utama', size = 'md', block = false }: StyleProps = {}): string {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-2 font-display font-semibold',
    'transition duration-150 hover:brightness-105 active:translate-y-1 active:shadow-none',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0',
    VARIANT[variant],
    SIZE[size],
    block && 'w-full',
  );
}

export function Button({
  variant,
  size,
  block,
  className,
  type = 'button',
  ...rest
}: StyleProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cn(buttonClasses({ variant, size, block }), className)} {...rest} />;
}

export function ButtonLink({ variant, size, block, className, ...rest }: StyleProps & LinkProps) {
  return <Link className={cn(buttonClasses({ variant, size, block }), className)} {...rest} />;
}
