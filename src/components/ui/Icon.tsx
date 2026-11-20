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
  arrow: 'M5 12h14M13 6l6 6-6 6',
  play: 'M8 5v14l11-7z',
  trophy: 'M7 4h10v5a5 5 0 01-10 0zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 20h8',
  flame: 'M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  close: 'M6 6l12 12M18 6L6 18',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z',
  chip: 'M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4',
  calc: 'M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  eyeoff: 'M3 3l18 18M10.6 5.1A9.7 9.7 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 4M6.5 6.6A17 17 0 002 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 004.2 4.2',
  offline: 'M3 3l18 18M5 12a10 10 0 012-1.5M9 16a5 5 0 016 0M12 20h.01',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
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
