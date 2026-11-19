import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { LoadingOwl } from '@/components/LoadingOwl';

const TIPS = ['Pinta lagi menyiapkan pensil…', 'Menata buku pelajaran…', 'Mengasah otak biar tajam…', 'Menghitung bintang…'];
const STEP_MS = 2600;

/**
 * Layar memuat dengan Pinta si burung hantu. Bila lama (>10 dtk) muncul pesan sabar, dan >20 dtk tombol "Muat ulang"
 * agar perangkat yang macet tidak terjebak di layar ini. Tampilannya sama dengan splash di index.html.
 */
export function LoadingScreen({ label = 'Memuat…' }: { label?: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), STEP_MS);
    return () => window.clearInterval(id);
  }, []);
  const elapsed = tick * STEP_MS;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 p-6 text-center">
      <LoadingOwl />
      <p role="status" className="font-display text-xl font-semibold">{label}</p>
      <p aria-hidden="true" className="min-h-[2.6em] max-w-xs text-tinta/75">
        {elapsed > 10000 ? 'Koneksi atau perangkat agak lambat. Sabar ya, Pinta masih berusaha!' : TIPS[tick % TIPS.length]}
      </p>
      {elapsed > 20000 && (
        <Button variant="sekunder" onClick={() => window.location.reload()}>
          Muat ulang
        </Button>
      )}
    </div>
  );
}
