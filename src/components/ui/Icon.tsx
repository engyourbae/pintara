/** Set ikon garis konsisten (24x24, stroke 2, ujung membulat). Tambah ikon baru di sini saja. */
const PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
  book: 'M4 4h12a3 3 0 013 3v13H7a3 3 0 01-3-3V4zM8 8h7M8 12h5',
  game: 'M6 8h12a3 3 0 013 3v3a3 3 0 01-5.2 2L14 14h-4l-1.8 2A3 3 0 013 14v-3a3 3 0 013-3zM8 10.5v3M6.5 12h3M16 11.5h.01M18 13.5h.01',
  users: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M17 11a2.5 2.5 0 100-5M17 14a5 5 0 014 5',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  board: 'M3 4h18v12H3zM8 20l2-4M16 20l-2-4M7 9h6',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
  settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  check: 'M5 12l5 5 9-10',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 018 0v3',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z',
  pencil: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
  offline: 'M3 3l18 18M5 12a10 10 0 012-1.5M9 16a5 5 0 016 0M12 20h.01',
} as const;

export type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  /** Isi hanya jika ikon berdiri sendiri tanpa teks; selain itu disembunyikan dari pembaca layar. */
  label?: string;
}

export function Icon({ name, size = 24, className, label }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
