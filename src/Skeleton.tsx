import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

/** Blok abu-abu berkilau lembut sebagai pengganti konten yang sedang dimuat. Dekoratif (disembunyikan dari pembaca layar). */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('sk rounded-2xl', className)} {...rest} />;
}

/** Kartu kerangka: satu judul kecil + beberapa baris. */
export function CardSkeleton({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('rounded-3xl border-2 border-tinta/15 bg-gading p-5', className)}>
      <Skeleton className="h-5 w-2/5" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-3/5' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}

/** Kerangka halaman: judul, dua tombol besar, lalu beberapa kartu. Dipakai sebagai cadangan Suspense saat halaman dimuat. */
export function PageSkeleton() {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <span className="sr-only">Memuat halaman…</span>
      <Skeleton className="h-9 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Skeleton className="h-14 rounded-3xl" />
        <Skeleton className="h-14 rounded-3xl" />
      </div>
      <CardSkeleton lines={3} />
      <CardSkeleton lines={2} />
      <CardSkeleton lines={2} />
    </div>
  );
}
