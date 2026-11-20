import { useId } from 'react';
import { Icon } from './Icon';
import { cn } from '@/utils/cn';

/** Huruf kecil tanpa aksen dan tanda baca berlebih, supaya "Pecahan" cocok dengan "pecahan". */
export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Semua kata pencarian harus ada di teks (urutan bebas). Pencarian kosong cocok dengan semuanya. */
export function matchesSearch(text: string, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const t = normalizeSearch(text);
  return q.split(' ').every((w) => t.includes(w));
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}

/** Kolom pencarian bergaya PINTARA, dengan tombol hapus. `label` dibacakan pembaca layar. */
export function SearchBox({ value, onChange, label, placeholder = 'Cari…', className }: Props) {
  const id = useId();
  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Icon name="search" size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tinta/60" />
      <input
        id={id}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        maxLength={40}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border-2 border-tinta bg-white pl-12 pr-12 text-lg"
      />
      {value && (
        <button
          type="button"
          aria-label="Hapus pencarian"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl"
        >
          <Icon name="close" size={20} />
        </button>
      )}
    </div>
  );
}
