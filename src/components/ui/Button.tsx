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
  utama: 'bg-aksen text-white border-b-4 border-aksen-tua',
  sekunder: 'bg-gading text-aksen-tua border-2 border-aksen',
  aksi: 'bg-jingga-600 text-white border-b-4 border-[#A8550F]',
  ghost: 'bg-transparent text-aksen-tua hover:bg-aksen-muda',
};

const SIZE: Record<Size, string> = {
  md: 'min-h-tap px-5 text-lg',
  lg: 'min-h-[56px] px-7 text-xl',
};

/** Teks tombol selalu tebal dan besar agar kontras tetap memadai. Area sentuh minimal 48px. */
export function buttonClasses({ variant = 'utama', size = 'md', block = false }: StyleProps = {}): string {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 rounded-2xl font-bold',
    'transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50',
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
