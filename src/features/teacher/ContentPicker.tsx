import { useMemo, useState } from 'react';
import { Badge, SearchBox, matchesSearch } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface PickItem {
  id: string;
  title: string;
  sub?: string;
}

interface Props {
  label: string;
  items: PickItem[];
  value: string;
  onChange: (id: string) => void;
  /** Id yang sudah dipakai: tampil abu-abu dan tidak bisa dipilih lagi. */
  disabledIds?: ReadonlySet<string>;
  disabledLabel?: string;
}

/** Daftar pilihan dengan pencarian (untuk memilih pelajaran dari puluhan paket). */
export function ContentPicker({ label, items, value, onChange, disabledIds, disabledLabel = 'Sudah ditugaskan' }: Props) {
  const [search, setSearch] = useState('');
  const shown = useMemo(() => items.filter((x) => matchesSearch(`${x.title} ${x.sub ?? ''}`, search)), [items, search]);
  return (
    <div className="space-y-2">
      <p className="font-display text-lg font-semibold">{label}</p>
      <SearchBox value={search} onChange={setSearch} label={`Cari: ${label}`} placeholder="Cari pelajaran…" />
      <div role="radiogroup" aria-label={label} className="max-h-72 space-y-2 overflow-y-auto rounded-2xl pr-1">
        {shown.length === 0 ? (
          <p className="px-1 py-3 text-tinta/75">Tidak ada yang cocok.</p>
        ) : (
          shown.map((x) => {
            const off = disabledIds?.has(x.id) ?? false;
            const on = x.id === value;
            return (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={off}
                onClick={() => onChange(x.id)}
                className={cn(
                  'flex min-h-[52px] w-full items-center justify-between gap-2 rounded-2xl border-2 px-3 py-2 text-left font-display text-base font-semibold transition active:translate-y-0.5',
                  off ? 'cursor-not-allowed border-tinta/25 bg-tinta/10 text-tinta/45' : on ? 'border-tinta bg-aksen text-white shadow-stiker' : 'border-tinta bg-white text-tinta',
                )}
              >
                <span className="min-w-0">
                  <span className="block leading-snug">{x.title}</span>
                  {x.sub && <span className={cn('block text-sm font-normal', on ? 'text-white/85' : 'text-tinta/70')}>{x.sub}</span>}
                </span>
                {off && <Badge tone="netral">{disabledLabel}</Badge>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
