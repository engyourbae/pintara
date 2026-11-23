import type { ReactNode } from 'react';

/**
 * Gambar vektor Komik Pintar (tanpa berkas gambar: ringan, tajam di layar apa pun).
 * Karakter dipecah per bagian: lengan berputar di bahu dan siku (peralihan pose halus lewat CSS transition),
 * kepala miring pelan, kedip tidak teratur, mulut membuka-menutup, ekspresi bertukar dengan memudar.
 * Pemain perempuan dan pemandu SELALU berhijab (rambut tidak pernah terlihat).
 */

export type Mood = 'idle' | 'talk' | 'happy' | 'sad' | 'surprised' | 'think' | 'wave' | 'excited' | 'point' | 'confused';
export type Who = 'guide' | 'boy' | 'girl';

const INK = '#33432F';
const CREAM = '#FBF3DC';
const CREAM_D = '#EBDDB8';
const DGREEN = '#2E6B34';
const MOUTH = '#B8372E';

const LOOK = {
  guide: { hijab: '#52BE4B', light: '#86DD74', dark: '#2F8F3A', iris: '#58B84E', irisD: '#1F6E2C', cuff: '#52BE4B' },
  girl: { hijab: '#BDE68F', light: '#DDF4B8', dark: '#8DC869', iris: '#9A6A48', irisD: '#4B2C1C', cuff: '#A7D977' },
  boy: { hijab: '#4A3024', light: '#7A563F', dark: '#33201A', iris: '#9A6A48', irisD: '#4B2C1C', cuff: '#52BE4B' },
} as const;

interface ArmPose {
  up: number;
  low: number;
}
/** Sudut (derajat) lengan atas di bahu dan lengan bawah di siku. Kiri: positif = ke luar/atas. Kanan: negatif = ke luar/atas. */
const POSE: Record<Mood, { l: ArmPose; r: ArmPose }> = {
  idle: { l: { up: 5, low: -6 }, r: { up: -5, low: 6 } },
  talk: { l: { up: 5, low: -6 }, r: { up: -34, low: 38 } },
  happy: { l: { up: 26, low: -52 }, r: { up: -26, low: 52 } },
  sad: { l: { up: 4, low: -64 }, r: { up: -4, low: 64 } },
  surprised: { l: { up: 40, low: -120 }, r: { up: -40, low: 120 } },
  think: { l: { up: 5, low: -6 }, r: { up: -40, low: 136 } },
  wave: { l: { up: 5, low: -6 }, r: { up: -150, low: -8 } },
  excited: { l: { up: 160, low: -8 }, r: { up: -160, low: 8 } },
  point: { l: { up: 5, low: -6 }, r: { up: -84, low: 4 } },
  confused: { l: { up: 5, low: -6 }, r: { up: -34, low: 108 } },
};
const EASE = '.5s cubic-bezier(.34,1.45,.5,1)';

function Arm({ x, up, low, sleeve, cuff, wave, id }: { x: number; up: number; low: number; sleeve: string; cuff: string; wave?: boolean; id: string }) {
  return (
    <g className="km-arm" style={{ transform: `rotate(${up}deg)`, transformOrigin: `${x}px 105px`, transition: `transform ${EASE}` }}>
      <g className="km-arm" style={{ transform: `rotate(${low}deg)`, transformOrigin: `${x}px 118px`, transition: `transform ${EASE}` }}>
        <g className={wave ? 'km-wave2' : undefined} style={{ transformOrigin: `${x}px 118px` }}>
          <rect x={x - 3.9} y={116} width={7.8} height={17} rx={3.9} fill={sleeve} stroke={INK} strokeWidth={1.7} />
          <rect x={x - 4.1} y={127} width={8.2} height={5} rx={2} fill={cuff} stroke={INK} strokeWidth={1.4} />
          <circle cx={x} cy={136.5} r={5.3} fill={`url(#${id}-skin)`} stroke={INK} strokeWidth={1.7} />
          <path d={`M${x - 2} 134.5 Q${x} 133.4 ${x + 2} 134.5`} fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" opacity={0.7} />
        </g>
      </g>
      <rect x={x - 4.3} y={103} width={8.6} height={17} rx={4.3} fill={sleeve} stroke={INK} strokeWidth={1.7} />
      <circle cx={x} cy={118} r={3.5} fill={sleeve} />
    </g>
  );
}

const V = ({ on, children }: { on: boolean; children: ReactNode }) => <g style={{ opacity: on ? 1 : 0, transition: 'opacity .16s ease' }}>{children}</g>;

function Eye({ cx, id, look }: { cx: number; id: string; look: (typeof LOOK)['guide'] }) {
  const cy = 68;
  const flick = cx < 60 ? -1 : 1;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={7.6} ry={9.2} fill="#fff" stroke={INK} strokeWidth={1.2} />
      <ellipse cx={cx} cy={cy + 0.6} rx={6.4} ry={8.2} fill={`url(#${id}-iris)`} />
      <ellipse cx={cx} cy={cy + 1.2} rx={3.3} ry={4.6} fill="#18241A" />
      <ellipse cx={cx} cy={cy + 6} rx={4.2} ry={1.8} fill={look.iris} opacity={0.55} />
      <circle cx={cx - 2.4} cy={cy - 3.2} r={2.7} fill="#fff" />
      <circle cx={cx + 2.3} cy={cy + 3.6} r={1.2} fill="#fff" />
      <path d={`M${cx - 8} ${cy - 2.5} Q${cx} ${cy - 12.5} ${cx + 8} ${cy - 2.5}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      <path d={`M${cx + flick * 7.4} ${cy - 3.2} q${flick * 3.2} -0.6 ${flick * 4} 1.6`} fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
}

function Face({ mood, id, look }: { mood: Mood; id: string; look: (typeof LOOK)['guide'] }) {
  const happy = mood === 'happy' || mood === 'excited';
  const t = mood === 'think' ? 'translate(2.2px,-2.6px)' : mood === 'sad' ? 'translate(0,1.8px)' : mood === 'confused' ? 'translate(-1.4px,-1px)' : 'translate(0,0)';
  const sc = mood === 'surprised' ? 1.1 : 1;
  const line = { fill: 'none', stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <g>
      <ellipse cx={38.5} cy={77} rx={7} ry={4.4} fill={`url(#${id}-blush)`} />
      <ellipse cx={81.5} cy={77} rx={7} ry={4.4} fill={`url(#${id}-blush)`} />
      {/* alis */}
      <g {...line} strokeWidth={2} opacity={0.75}>
        <V on={mood === 'idle' || mood === 'talk' || mood === 'wave' || mood === 'point' || mood === 'think'}><path d="M39.5 57 Q46.5 54 53.5 57" /><path d="M66.5 57 Q73.5 54 80.5 57" /></V>
        <V on={mood === 'sad'}><path d="M39.5 60.5 L53 55.5" /><path d="M80.5 60.5 L67 55.5" /></V>
        <V on={mood === 'surprised'}><path d="M39.5 53.5 Q46.5 49 53.5 53.5" /><path d="M66.5 53.5 Q73.5 49 80.5 53.5" /></V>
        <V on={mood === 'confused'}><path d="M39.5 58.5 Q46.5 56.5 53.5 58.5" /><path d="M66.5 54 Q73.5 47.5 80.5 54" /></V>
      </g>
      {/* mata */}
      <V on={!happy}>
        <g className="km-blink" style={{ transformOrigin: '60px 68px' }}>
          <g style={{ transform: `${t} scale(${sc})`, transformOrigin: '60px 68px', transition: 'transform .35s cubic-bezier(.3,1.3,.5,1)' }}>
            <Eye cx={46.5} id={id} look={look} />
            <Eye cx={73.5} id={id} look={look} />
            {mood === 'sad' && <path d="M40 76 Q37.5 82 40.5 84 Q43 82 40 76Z" fill="#9AD8F4" stroke={INK} strokeWidth={0.9} />}
          </g>
        </g>
      </V>
      <V on={happy}>
        <g {...line} strokeWidth={3}>
          <path d="M39 70 Q46.5 59 54 70" />
          <path d="M66 70 Q73.5 59 81 70" />
        </g>
      </V>
      {/* mulut */}
      <V on={mood === 'idle' || mood === 'point'}><path d="M53 78.5 Q60 85.5 67 78.5" {...line} /></V>
      <V on={mood === 'talk'}>
        <g className="km-talk" style={{ transformOrigin: '60px 78px' }}>
          <path d="M53.5 77 Q60 77.5 66.5 77 Q65 88 60 88 Q55 88 53.5 77Z" fill={MOUTH} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
          <ellipse cx={60} cy={85} rx={3.8} ry={2} fill="#F58A94" />
        </g>
      </V>
      <V on={happy || mood === 'wave'}>
        <path d="M50.5 76.5 Q60 92 69.5 76.5Z" fill={MOUTH} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
        <path d="M54 83.5 Q60 89.5 66 83.5 Q60 80.5 54 83.5Z" fill="#F58A94" />
        <path d="M52.5 77 Q60 79.6 67.5 77" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      </V>
      <V on={mood === 'sad'}><path d="M54 85 Q60 78.5 66 85" {...line} /></V>
      <V on={mood === 'surprised'}><ellipse cx={60} cy={82.5} rx={3.9} ry={5.2} fill={MOUTH} stroke={INK} strokeWidth={1.5} /></V>
      <V on={mood === 'confused'}><path d="M52.5 82 Q56.5 76.5 60 82 T67.5 82" {...line} /></V>
      <V on={mood === 'think'}><path d="M55 80 Q61 84 68 78.5" {...line} /></V>
    </g>
  );
}

/* ───────── Hijab (pemandu dan pemain perempuan) ───────── */
const HIJAB_BACK = 'M60 10 C32 10 19 34 20 62 C21 82 28 94 35 102 L85 102 C92 94 99 82 100 62 C101 34 88 10 60 10Z';
const FACE = 'M30 62 C30 41 44 32 60 32 C76 32 90 41 90 62 C90 80 77 92 60 92 C43 92 30 80 30 62Z';
const RING = 'M60 16 C34 16 24 37 25 62 C26 78 33 89 41 94 L79 94 C87 89 94 78 95 62 C96 37 86 16 60 16Z M33.5 62 C33.5 45 45 36.5 60 36.5 C75 36.5 86.5 45 86.5 62 C86.5 77 76 88.5 60 88.5 C44 88.5 33.5 77 33.5 62Z';

function HijabBack({ id, look }: { id: string; look: (typeof LOOK)['guide'] }) {
  return (
    <g strokeLinejoin="round">
      <path d={HIJAB_BACK} fill={look.dark} stroke={INK} strokeWidth={2} />
      <path d="M60 8 C31 9 17 34 18 62 C19 80 26 92 34 101" fill="none" stroke={look.hijab} strokeWidth={5} opacity={0.5} />
      <path d="M36 90 Q60 106 84 90 L90 113 Q60 124 30 113Z" fill={`url(#${id}-hj)`} stroke={INK} strokeWidth={2} />
      <path d="M46 100 Q50 108 48 117 M60 102 L60 119 M74 100 Q70 108 72 117" fill="none" stroke={look.dark} strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
      <path d="M36 99 Q60 110 84 99" fill="none" stroke={look.light} strokeWidth={2.2} strokeLinecap="round" opacity={0.7} />
    </g>
  );
}

function HijabRing({ id, look }: { id: string; look: (typeof LOOK)['guide'] }) {
  return (
    <g strokeLinejoin="round">
      <path d={RING} fillRule="evenodd" fill={`url(#${id}-hj)`} stroke={INK} strokeWidth={1.9} />
      <path d="M36 54 Q40 41 54 38.5" fill="none" stroke={look.dark} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
      <path d="M33 32 Q44 20 62 19" fill="none" stroke={look.light} strokeWidth={3.4} strokeLinecap="round" opacity={0.75} />
      <path d="M26 66 Q28 84 40 94" fill="none" stroke={look.dark} strokeWidth={1.8} strokeLinecap="round" opacity={0.5} />
      <path d="M94 66 Q92 84 80 94" fill="none" stroke={look.dark} strokeWidth={1.8} strokeLinecap="round" opacity={0.5} />
    </g>
  );
}

function BoyHair({ id }: { id: string }) {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M27 66 C21 32 40 7 62 8 C86 8 100 32 93 66 C91 56 88 49 83 45 C79 52 73 50 69 42 C64 52 56 50 52 42 C48 50 41 49 37 45 C32 50 28 57 27 66Z" fill={`url(#${id}-hj)`} stroke={INK} strokeWidth={2} />
      <path d="M27 64 C24 71 26 79 31 82 C32 74 31 69 33 62Z" fill={`url(#${id}-hj)`} stroke={INK} strokeWidth={1.8} />
      <path d="M93 64 C96 71 94 79 89 82 C88 74 89 69 87 62Z" fill={`url(#${id}-hj)`} stroke={INK} strokeWidth={1.8} />
      <path d="M60 9 Q58 1 65 -1 Q64 4 67 9Z" fill={`url(#${id}-hj)`} stroke={INK} strokeWidth={1.5} />
      <path d="M38 26 Q50 14 68 17" fill="none" stroke="#9A7258" strokeWidth={4.5} opacity={0.55} />
      <path d="M45 46 Q47 40 50 38 M62 47 Q64 40 66 38" fill="none" stroke="#2A1812" strokeWidth={1.4} opacity={0.5} />
    </g>
  );
}

interface ChibiProps {
  who: Who;
  mood?: Mood;
  size?: number;
  x?: number;
  y?: number;
  label?: string;
}

/** Karakter chibi. Tinggi 170, lebar 120 (viewBox). Tidak dikendalikan pemain: hanya idle dan bereaksi. */
export function Chibi({ who, mood = 'idle', size = 120, x, y, label }: ChibiProps) {
  const look = LOOK[who];
  const id = `cb-${who}`;
  const pose = POSE[mood];
  const girlish = who !== 'boy';
  const sleeve = CREAM;
  const hop = mood === 'excited' || mood === 'happy';
  return (
    <svg x={x} y={y} width={size} height={(size * 170) / 120} viewBox="-4 -8 128 182" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} overflow="visible">
      <defs>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF0E2" />
          <stop offset="1" stopColor="#FFD2B2" />
        </linearGradient>
        <linearGradient id={`${id}-hj`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={look.light} />
          <stop offset="0.55" stopColor={look.hijab} />
          <stop offset="1" stopColor={look.dark} />
        </linearGradient>
        <linearGradient id={`${id}-iris`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.irisD} />
          <stop offset="1" stopColor={look.iris} />
        </linearGradient>
        <radialGradient id={`${id}-blush`}>
          <stop offset="0" stopColor="#FF8FA3" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FF8FA3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-cloth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={girlish ? '#3C8A44' : '#3A8A3F'} />
          <stop offset="1" stopColor={DGREEN} />
        </linearGradient>
      </defs>
      <ellipse cx={60} cy={168} rx={32} ry={4.6} fill="#000" opacity={0.13} />
      <g className={hop ? (mood === 'excited' ? 'km-hop' : 'km-cheer') : undefined}>
        <g className="km-breathe">
          {/* jubah pemandu */}
          {who === 'guide' && (
            <g className="km-sway" style={{ transformOrigin: '60px 100px', transformBox: 'view-box' }}>
              <path d="M32 98 Q10 130 22 164 L98 164 Q110 130 88 98Z" fill="#2C7F3A" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
              <path d="M30 104 Q16 130 24 160" fill="none" stroke="#5FBE48" strokeWidth={3} opacity={0.5} strokeLinecap="round" />
              <path d="M26 140 Q22 154 26 164 M94 140 Q98 154 94 164" fill="none" stroke={look.dark} strokeWidth={1.6} opacity={0.5} strokeLinecap="round" />
            </g>
          )}
          {/* kaki dan bawahan */}
          <g stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
            {who === 'boy' ? (
              <>
                <path d="M41 126 L79 126 L81 160 L63 160 L60 139 L57 160 L39 160Z" fill={`url(#${id}-cloth)`} />
                <path d="M41 143 L51 143 L51 152 L41 152Z" fill="#2A5D30" strokeWidth={1.3} />
                <path d="M39 156 L57 156 M63 156 L81 156" stroke="#2A5D30" strokeWidth={2.4} fill="none" />
              </>
            ) : (
              <>
                <rect x={44} y={146} width={10} height={17} rx={3} fill={`url(#${id}-skin)`} />
                <rect x={66} y={146} width={10} height={17} rx={3} fill={`url(#${id}-skin)`} />
                <rect x={44} y={154} width={10} height={10} rx={2.5} fill="#fff" />
                <rect x={66} y={154} width={10} height={10} rx={2.5} fill="#fff" />
                <path d="M44 157 h10 M66 157 h10" stroke={look.hijab} strokeWidth={1.6} fill="none" />
                <path d="M37 123 L83 123 L99 157 Q60 166 21 157Z" fill={`url(#${id}-cloth)`} />
                <path d="M46 126 L40 160 M60 126 L60 163 M74 126 L80 160" stroke="#245A2B" strokeWidth={1.2} fill="none" opacity={0.7} />
                <path d="M24 151 Q60 160 96 151" fill="none" stroke="#9BDC78" strokeWidth={2.2} strokeLinecap="round" />
              </>
            )}
            {/* sepatu */}
            <ellipse cx={47} cy={164.5} rx={11.5} ry={5.6} fill="#fff" />
            <ellipse cx={73} cy={164.5} rx={11.5} ry={5.6} fill="#fff" />
            <path d="M38 164 Q47 159.5 56 164 M64 164 Q73 159.5 82 164" fill="none" stroke={look.cuff} strokeWidth={2.6} strokeLinecap="round" />
            <path d="M41 167 h12 M67 167 h12" stroke="#CFE6C0" strokeWidth={1.6} />
          </g>
          {/* badan */}
          <g stroke={INK} strokeWidth={1.9} strokeLinejoin="round">
            <path d="M38 99 Q60 94 82 99 L84 131 Q60 137 36 131Z" fill={CREAM} />
            <path d="M40 120 Q60 126 80 120 L81 131 Q60 137 39 131Z" fill={CREAM_D} stroke="none" opacity={0.7} />
            {who === 'boy' && (
              <>
                <path d="M36 98 Q60 114 84 98 Q86 108 60 116 Q34 108 36 98Z" fill={CREAM_D} />
                <path d="M47 118 Q60 124 73 118 L74 130 Q60 134 46 130Z" fill="#EFE2BC" strokeWidth={1.4} />
                <path d="M55 106 L54 117 M65 106 L66 117" stroke={look.cuff} strokeWidth={2} strokeLinecap="round" fill="none" />
                <path d="M43 99 L43 128 M77 99 L77 128" stroke="#8A6B3F" strokeWidth={4.4} strokeLinecap="round" fill="none" />
              </>
            )}
            {who === 'guide' && (
              <>
                <path d="M44 100 L55 100 L53 132 Q46 134 40 131Z" fill={`url(#${id}-hj)`} strokeWidth={1.5} />
                <path d="M76 100 L65 100 L67 132 Q74 134 80 131Z" fill={`url(#${id}-hj)`} strokeWidth={1.5} />
                <path d="M38 126 Q60 133 82 126" fill="none" stroke="#B98A4A" strokeWidth={3.4} />
                <path d="M33 112 Q60 144 92 112" fill="none" stroke="#B98A4A" strokeWidth={2.6} />
                <rect x={79} y={124} width={18} height={15} rx={3.4} fill="#C99B55" />
                <path d="M88 127 l1.9 3.8 4.2 .6 -3 2.9 .7 4.1 -3.8-2 -3.8 2 .7-4.1 -3-2.9 4.2-.6z" fill="#FFD84D" strokeWidth={0.8} />
              </>
            )}
          </g>
        </g>

        {/* kepala */}
        <g transform="translate(60 100) scale(1.07) translate(-60 -100)"><g className={mood === 'talk' ? 'km-nod' : 'km-head'} style={{ transformOrigin: '60px 100px' }}>
          {girlish ? (
            <>
              <HijabBack id={id} look={look} />
              <ellipse cx={60} cy={96} rx={27} ry={6} fill="#000" opacity={0.12} />
              <path d={FACE} fill={`url(#${id}-skin)`} stroke={INK} strokeWidth={1.8} />
              <path d="M34 48 Q60 38 86 48 Q84 40 60 36 Q38 40 34 48Z" fill="#E9B997" opacity={0.55} />
            </>
          ) : (
            <>
              <ellipse cx={30.5} cy={66} rx={4.6} ry={5.6} fill={`url(#${id}-skin)`} stroke={INK} strokeWidth={1.7} />
              <ellipse cx={89.5} cy={66} rx={4.6} ry={5.6} fill={`url(#${id}-skin)`} stroke={INK} strokeWidth={1.7} />
              <path d={FACE} fill={`url(#${id}-skin)`} stroke={INK} strokeWidth={1.9} />
            </>
          )}
          <Face mood={mood} id={id} look={look} />
          {girlish ? <HijabRing id={id} look={look} /> : <BoyHair id={id} />}
          {who === 'guide' && (
            <>
              <g className="km-sway" style={{ transformOrigin: '60px 16px', transformBox: 'view-box' }}>
                <path d="M60 16 Q47 -4 34 6 Q44 18 60 16Z" fill="#86DD5F" stroke={INK} strokeWidth={1.7} strokeLinejoin="round" />
                <path d="M60 16 Q72 -6 88 3 Q76 18 60 16Z" fill="#5FBE48" stroke={INK} strokeWidth={1.7} strokeLinejoin="round" />
                <path d="M58 15 Q48 6 40 8" fill="none" stroke="#2F8F3A" strokeWidth={1.1} opacity={0.7} />
              </g>
              <path transform="translate(88 40)" d="M0 -8.5 l2.5 5.3 5.7 .8 -4.2 4 1 5.7 -5-2.8 -5 2.8 1-5.7 -4.2-4 5.7-.8z" fill="#FFD84D" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
            </>
          )}
          {who === 'girl' && (
            <g transform="translate(88 41)" stroke={INK} strokeWidth={1.2}>
              {[[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]].map(([a, b]) => (
                <circle key={`${a}${b}`} cx={a} cy={b} r={3.8} fill="#fff" />
              ))}
              <circle r={2.6} fill="#FFD84D" />
            </g>
          )}
        </g></g>

        {/* lengan (di depan badan dan kepala) */}
        <Arm x={41} up={pose.l.up} low={pose.l.low} sleeve={sleeve} cuff={look.cuff} id={id} />
        <Arm x={79} up={pose.r.up} low={pose.r.low} sleeve={sleeve} cuff={look.cuff} wave={mood === 'wave'} id={id} />
      </g>
      {mood === 'think' && <text x={98} y={30} fontSize={22} fontWeight={800} fill="#E8A21A" stroke={INK} strokeWidth={0.8} className="km-float">?</text>}
      {mood === 'confused' && <text x={98} y={30} fontSize={22} fontWeight={800} fill="#E8A21A" stroke={INK} strokeWidth={0.8} className="km-float">?</text>}
      {mood === 'surprised' && <text x={100} y={30} fontSize={24} fontWeight={800} fill="#F26B21" stroke={INK} strokeWidth={0.8} className="km-float">!</text>}
      {hop && (
        <g fill="#FFD84D" stroke={INK} strokeWidth={0.9} className="km-twinkle">
          <path d="M108 38 l2 4.6 5 .6 -3.7 3.4 1 5 -4.3-2.5 -4.3 2.5 1-5 -3.7-3.4 5-.6z" />
          <path d="M6 44 l1.6 3.6 3.9.5 -2.9 2.7.8 3.9 -3.4-2 -3.4 2 .8-3.9 -2.9-2.7 3.9-.5z" />
        </g>
      )}
    </svg>
  );
}

/* ───────────────────────── Benda di taman ───────────────────────── */

export const FLOWER_COLORS = { merah: '#F0506E', kuning: '#FFC83D', jambu: '#FF8FB1' } as const;
export type FlowerColor = keyof typeof FLOWER_COLORS;

export function Flower({ color, x, y, s = 1, stem = true }: { color: FlowerColor; x: number; y: number; s?: number; stem?: boolean }) {
  const c = FLOWER_COLORS[color];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
      {stem && <path d="M0 0 L0 20" stroke="#3E8E3A" strokeWidth={3} strokeLinecap="round" />}
      {stem && <path d="M0 14 Q-9 8 -11 12 Q-6 17 0 14Z" fill="#5FBE48" stroke={INK} strokeWidth={0.9} />}
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-7} rx={4.6} ry={6.4} fill={c} stroke={INK} strokeWidth={1} transform={`rotate(${a})`} />
      ))}
      <circle r={3.8} fill="#FFE27A" stroke={INK} strokeWidth={1} />
    </g>
  );
}

export function WateringCan({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
      <path d="M-12 -8 L12 -8 L10 12 Q0 15 -10 12Z" fill="#5DB7E8" />
      <path d="M12 -2 L26 -12 L28 -9 L14 4Z" fill="#4AA3D6" />
      <path d="M-12 -2 Q-24 -4 -20 6 Q-16 10 -11 6" fill="none" strokeWidth={3} />
      <path d="M-8 -8 Q0 -22 8 -8" fill="none" strokeWidth={2.6} />
      <ellipse cx={0} cy={-8} rx={12} ry={2.6} fill="#8FD3F4" />
    </g>
  );
}

export function Butterfly({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeWidth={1}>
      <path d="M0 0 Q-14 -14 -13 -2 Q-12 8 0 3Z" fill="#B58CF0" />
      <path d="M0 0 Q14 -14 13 -2 Q12 8 0 3Z" fill="#9C6FE0" />
      <path d="M0 3 Q-9 10 -6 14 Q-2 12 0 5Z" fill="#E6C7FF" />
      <path d="M0 3 Q9 10 6 14 Q2 12 0 5Z" fill="#D2A9FF" />
      <ellipse cx={0} cy={2} rx={1.6} ry={6} fill="#4A3A5A" />
      <path d="M0 -4 Q-3 -9 -5 -9 M0 -4 Q3 -9 5 -9" fill="none" />
    </g>
  );
}

export function Pot({ x, y, band, filled }: { x: number; y: number; band: string; filled?: FlowerColor }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
      {filled && (
        <g className="km-grow">
          <path d="M0 0 L0 -20" stroke="#3E8E3A" strokeWidth={3} strokeLinecap="round" />
          <path d="M0 -8 Q-10 -14 -12 -9 Q-6 -5 0 -8Z" fill="#5FBE48" strokeWidth={0.9} />
          <Flower color={filled} x={0} y={-26} s={1.15} stem={false} />
        </g>
      )}
      <path d="M-15 0 L15 0 L11 26 Q0 29 -11 26Z" fill="#E0905A" />
      <rect x={-17} y={-4} width={34} height={8} rx={3} fill="#EDA06A" />
      <rect x={-16} y={-2} width={32} height={4} rx={2} fill={band} stroke="none" />
    </g>
  );
}

export function WiltedPlant({ x, y, revived }: { x: number; y: number; revived: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-14 0 L14 0 L10 24 Q0 27 -10 24Z" fill="#E0905A" />
      <rect x={-16} y={-4} width={32} height={8} rx={3} fill="#EDA06A" />
      {revived ? (
        <g className="km-grow">
          <path d="M0 -4 L0 -34" stroke="#3E8E3A" strokeWidth={3.5} fill="none" />
          <path d="M0 -14 Q-16 -20 -18 -32 Q-4 -30 0 -14Z" fill="#6FD05A" />
          <path d="M0 -20 Q16 -26 18 -38 Q4 -36 0 -20Z" fill="#5FBE48" />
          <path d="M0 -34 Q-8 -46 0 -52 Q8 -46 0 -34Z" fill="#7FE06A" />
        </g>
      ) : (
        <g>
          <path d="M0 -4 Q2 -22 14 -26" stroke="#8A7A3A" strokeWidth={3} fill="none" />
          <path d="M14 -26 Q26 -22 28 -8 Q16 -12 14 -26Z" fill="#B8A25A" />
          <path d="M1 -12 Q-12 -14 -16 -4 Q-4 -2 1 -12Z" fill="#C7B56B" />
        </g>
      )}
    </g>
  );
}

/* ───────────────────────── Latar taman ───────────────────────── */

export const SCENE_W = 360;
export const SCENE_H = 420;

/** Latar taman (statis kecuali awan dan daun pohon yang bergoyang pelan). Benda tersembunyi digambar oleh pemanggil lewat `behind` dan `front`. */
export function GardenBack({ children }: { children?: ReactNode }) {
  return (
    <g>
      <defs>
        <linearGradient id="km-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ED8F5" />
          <stop offset="1" stopColor="#E6F6E2" />
        </linearGradient>
        <linearGradient id="km-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FD36A" />
          <stop offset="1" stopColor="#6CBF55" />
        </linearGradient>
      </defs>
      <rect width={SCENE_W} height={SCENE_H} fill="url(#km-sky)" />
      <g className="km-cloud" fill="#fff" opacity={0.9}>
        <ellipse cx={90} cy={64} rx={30} ry={11} />
        <ellipse cx={112} cy={56} rx={20} ry={11} />
        <ellipse cx={270} cy={104} rx={26} ry={9} />
        <ellipse cx={288} cy={97} rx={16} ry={9} />
      </g>
      <path d="M0 176 Q80 130 170 164 Q260 128 360 166 L360 230 L0 230Z" fill="#A6DE86" />
      {/* pagar */}
      <g stroke={INK} strokeWidth={1.6}>
        {Array.from({ length: 13 }, (_, i) => (
          <path key={i} d={`M${6 + i * 28} 196 L${6 + i * 28} 164 L${14 + i * 28} 156 L${22 + i * 28} 164 L${22 + i * 28} 196Z`} fill="#FFF6E4" />
        ))}
        <rect x={0} y={172} width={360} height={7} fill="#F3E3C4" />
        <rect x={0} y={186} width={360} height={7} fill="#F3E3C4" />
      </g>
      <rect y={196} width={SCENE_W} height={SCENE_H - 196} fill="url(#km-grass)" />
      {/* jalan setapak */}
      <path d="M110 420 Q150 330 200 292 Q240 262 250 230 L292 230 Q300 280 250 330 Q220 380 250 420Z" fill="#F1DFA8" opacity={0.85} />
      {children}
    </g>
  );
}

export function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
      <path d="M-9 70 L-6 20 L6 20 L10 70Z" fill="#B9855A" />
      <g className="km-sway">
        <circle cx={0} cy={-6} r={40} fill="#4FB848" />
        <circle cx={-26} cy={16} r={26} fill="#5FC453" />
        <circle cx={26} cy={14} r={28} fill="#46A843" />
        <circle cx={-8} cy={-20} r={7} fill="#79D966" stroke="none" opacity={0.7} />
      </g>
    </g>
  );
}

export function Bench({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
      <rect x={-6} y={14} width={8} height={44} rx={2} fill="#9C6B3F" />
      <rect x={78} y={14} width={8} height={44} rx={2} fill="#9C6B3F" />
      <rect x={-12} y={0} width={104} height={14} rx={4} fill="#D79B5D" />
      <rect x={-12} y={-30} width={104} height={9} rx={3} fill="#D79B5D" />
      <rect x={-12} y={-18} width={104} height={9} rx={3} fill="#C98B4D" />
      <rect x={-4} y={-32} width={6} height={32} fill="#9C6B3F" />
      <rect x={76} y={-32} width={6} height={32} fill="#9C6B3F" />
    </g>
  );
}

/** Semak depan (menutupi sebagian bunga merah agar tidak terlalu mudah, tetapi tetap terlihat sebagian). */
export function Bush({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeWidth={1.8}>
      <circle cx={-22} cy={0} r={20} fill="#3FA845" />
      <circle cx={4} cy={-8} r={25} fill="#4FB848" />
      <circle cx={28} cy={2} r={19} fill="#44AA46" />
    </g>
  );
}
