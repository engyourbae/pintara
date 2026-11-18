import { useId, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cn } from '@/utils/cn';

interface Option<T> {
  value: T;
  label: string;
}

interface ChoiceProps<T extends string | number> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

/** Pilihan tunggal berupa tombol (pengganti <select> bawaan browser). Satu pilihan selalu terpilih. */
export function ChoiceGroup<T extends string | number>({ label, value, options, onChange, disabled }: ChoiceProps<T>) {
  const id = useId();
  return (
    <div>
      <p id={id} className="font-display text-lg font-semibold">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onChange(o.value)}
              className={cn(
                'min-h-[48px] min-w-[48px] rounded-2xl border-2 border-tinta px-4 font-display text-base font-semibold transition active:translate-y-0.5 disabled:opacity-50',
                on ? 'bg-aksen text-white shadow-stiker' : 'bg-white text-tinta',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Kotak centang bergaya PINTARA (pengganti <input type="checkbox"> bawaan browser). */
export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-start gap-3 text-left">
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-tinta',
          checked ? 'bg-aksen text-white' : 'bg-white',
        )}
      >
        {checked && <Icon name="check" size={18} />}
      </span>
      <span>{children}</span>
    </button>
  );
}
