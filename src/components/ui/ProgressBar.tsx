interface Props {
  value: number;
  max?: number;
  label: string;
}

/** Bilah progres bergaya pensil warna. `label` wajib untuk aksesibilitas. */
export function ProgressBar({ value, max = 100, label }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className="h-4 w-full overflow-hidden rounded-full bg-white ring-2 ring-aksen-muda"
    >
      <div className="h-full rounded-full bg-kuning-500 transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}
