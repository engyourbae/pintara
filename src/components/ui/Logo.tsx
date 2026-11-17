import { cn } from '@/utils/cn';

/** Logo sementara: pensil + nama. Dapat diganti aset final tanpa mengubah pemakai komponen. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-extrabold tracking-wide text-aksen-tua', className)}>
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="13" y="3" width="8" height="19" rx="1.5" transform="rotate(25 17 12)" fill="#F5C000" />
        <path d="M9.5 21.5l3.5-1.7 1 3.3-6 2.4z" fill="#FFE0B0" />
        <path d="M7.7 25.6l1.3-2.3 1.7.7z" fill="#2A3328" />
      </svg>
      <span className="text-2xl">PINTARA</span>
    </span>
  );
}
