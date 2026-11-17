import { cn } from '@/utils/cn';

/** Lambang PINTARA: buku terbuka dengan bintang. Sumber yang sama dengan public/favicon.svg. */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <rect x="2" y="5" width="36" height="34" rx="10" fill="#2A3328" />
      <rect x="2" y="2" width="36" height="34" rx="10" fill="#5BAA4B" stroke="#2A3328" strokeWidth="2.5" />
      <path d="M8 19Q14 16 20 19V33Q14 30 8 33Z" fill="#FFFDF6" stroke="#2A3328" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 19Q26 16 32 19V33Q26 30 20 33Z" fill="#FFFDF6" stroke="#2A3328" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(0 2)">
        <polygon
          points="20,3 21.53,6.9 25.7,7.1 22.47,9.8 23.5,13.9 20,11.6 16.5,13.9 17.53,9.8 14.3,7.1 18.47,6.9"
          fill="#F5C000"
          stroke="#2A3328"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Lambang + nama. `kecil` menyembunyikan nama di layar sempit bila perlu. */
export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-display font-bold tracking-wide text-tinta', className)}>
      <LogoMark size={size} />
      <span className="text-2xl leading-none">PINTARA</span>
    </span>
  );
}
