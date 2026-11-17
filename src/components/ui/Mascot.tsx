import { cn } from '@/utils/cn';

type Mood = 'halo' | 'hore' | 'semangat';

interface Props {
  size?: number;
  mood?: Mood;
  className?: string;
  /** Isi bila maskot bermakna sendiri; selain itu dianggap hiasan. */
  label?: string;
}

/** Maskot "Pinta" si burung hantu. Karakter orisinal PINTARA. Mata berkedip lewat animasi CSS. */
export function Mascot({ size = 200, mood = 'halo', className, label }: Props) {
  const wingsUp = mood === 'hore';
  const eyeY = mood === 'semangat' ? 84 : 86;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <g stroke="#2A3328" strokeWidth="4">
        {/* telinga bulu */}
        <path d="M52 52L60 20L90 44Z" fill="#478F3A" />
        <path d="M148 52L140 20L110 44Z" fill="#478F3A" />
        {/* kaki */}
        <ellipse cx="82" cy="186" rx="13" ry="6" fill="#F28A3B" strokeWidth="3" />
        <ellipse cx="118" cy="186" rx="13" ry="6" fill="#F28A3B" strokeWidth="3" />
        {/* sayap */}
        {wingsUp ? (
          <>
            <path d="M44 120Q14 96 22 62Q44 74 56 104Z" fill="#478F3A" />
            <path d="M156 120Q186 96 178 62Q156 74 144 104Z" fill="#478F3A" />
          </>
        ) : (
          <>
            <path d="M42 108Q22 140 40 170Q56 152 54 118Z" fill="#478F3A" />
            <path d="M158 108Q178 140 160 170Q144 152 146 118Z" fill="#478F3A" />
          </>
        )}
        {/* badan */}
        <ellipse cx="100" cy="112" rx="62" ry="70" fill="#5BAA4B" />
        <ellipse cx="100" cy="132" rx="38" ry="42" fill="#FFFDF6" strokeWidth="0" />
        <path d="M82 124q6 6 12 0M106 124q6 6 12 0M88 142q6 6 12 0M100 142q6 6 12 0" fill="none" stroke="#9FD093" strokeWidth="3" />
        {/* pensil terselip di telinga */}
        <g transform="rotate(28 156 38)">
          <rect x="150" y="6" width="11" height="40" rx="2" fill="#F5C000" strokeWidth="3" />
          <path d="M150 46h11l-5.5 9z" fill="#FFE0B0" strokeWidth="3" />
        </g>
      </g>
      {/* mata */}
      <g className="animate-kedip" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <circle cx="76" cy={eyeY} r="21" fill="#FFFDF6" stroke="#2A3328" strokeWidth="4" />
        <circle cx="124" cy={eyeY} r="21" fill="#FFFDF6" stroke="#2A3328" strokeWidth="4" />
        <circle cx="80" cy={eyeY + 2} r="9" fill="#2A3328" />
        <circle cx="120" cy={eyeY + 2} r="9" fill="#2A3328" />
        <circle cx="83" cy={eyeY - 1} r="3.2" fill="#FFFDF6" />
        <circle cx="123" cy={eyeY - 1} r="3.2" fill="#FFFDF6" />
      </g>
      {/* paruh */}
      <path d="M91 104L109 104L100 118Z" fill="#F5C000" stroke="#2A3328" strokeWidth="3.5" />
      {/* pipi */}
      <ellipse cx="58" cy="108" rx="7" ry="4.5" fill="#FFB27A" opacity="0.8" />
      <ellipse cx="142" cy="108" rx="7" ry="4.5" fill="#FFB27A" opacity="0.8" />
    </svg>
  );
}

/** Bintang hiasan kecil. */
export function Sparkle({ className, size = 28, color = '#F5C000' }: { className?: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={cn('animate-berkilau', className)}>
      <path d="M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6z" fill={color} stroke="#2A3328" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
