import type { ReactNode } from 'react';

/**
 * Gambar vektor Komik Pintar (tanpa berkas gambar: ringan, tajam di layar apa pun).
 * Karakter dipecah per bagian agar kedip, bicara, dan lambai bergerak sendiri-sendiri (CSS, bukan JavaScript).
 * Pemain perempuan dan pemandu SELALU berhijab (rambut tidak pernah terlihat).
 */

export type Mood = 'idle' | 'talk' | 'happy' | 'sad' | 'surprised' | 'think' | 'wave' | 'excited' | 'point' | 'confused';
export type Who = 'guide' | 'boy' | 'girl';

const INK = '#3A4A3A';
const SKIN = '#FFE2CC';
const CREAM = '#FBF3DC';
const DGREEN = '#2E6B34';
const MOUTH = '#C8473B';

const PAL = {
  guide: { cloth: '#4FB848', clothDark: '#2F8F3A', iris: '#3E9A3A' },
  girl: { cloth: '#B9E48E', clothDark: '#8DC869', iris: '#5B3A28' },
  boy: { cloth: '#4FB848', clothDark: '#2F8F3A', iris: '#6B4426' },
} as const;

type Pt = [number, number];
interface Pose {
  l: Pt[]; // bahu kiri (di layar) -> siku -> tangan
  r: Pt[];
  waveR?: boolean;
  cheer?: boolean;
}
const SL: Pt = [40, 104];
const SR: Pt = [80, 104];
const POSES: Record<Mood, Pose> = {
  idle: { l: [SL, [34, 118], [36, 130]], r: [SR, [86, 118], [84, 130]] },
  talk: { l: [SL, [34, 118], [36, 130]], r: [SR, [96, 108], [104, 100]] },
  happy: { l: [SL, [32, 114], [38, 120]], r: [SR, [88, 114], [82, 120]] },
  sad: { l: [SL, [40, 122], [52, 124]], r: [SR, [80, 122], [68, 124]] },
  surprised: { l: [SL, [28, 108], [30, 96]], r: [SR, [92, 108], [90, 96]] },
  think: { l: [SL, [34, 118], [36, 130]], r: [SR, [88, 106], [68, 90]] },
  wave: { l: [SL, [34, 118], [36, 130]], r: [SR, [94, 94], [98, 74]], waveR: true },
  excited: { l: [SL, [26, 92], [24, 70]], r: [SR, [94, 92], [96, 70]], cheer: true },
  point: { l: [SL, [34, 118], [36, 130]], r: [SR, [98, 104], [112, 98]] },
  confused: { l: [SL, [34, 118], [36, 130]], r: [SR, [90, 104], [76, 94]] },
};

function Arm({ pts, sleeve, cuff }: { pts: Pt[]; sleeve: string; cuff: string }) {
  const d = `M${pts[0][0]} ${pts[0][1]} L${pts[1][0]} ${pts[1][1]} L${pts[2][0]} ${pts[2][1]}`;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={INK} strokeWidth={11} fill="none" />
      <path d={d} stroke={sleeve} strokeWidth={7.5} fill="none" />
      <circle cx={pts[2][0]} cy={pts[2][1]} r={5.6} fill={SKIN} stroke={INK} strokeWidth={1.6} />
      <circle cx={pts[1][0] + (pts[2][0] - pts[1][0]) * 0.62} cy={pts[1][1] + (pts[2][1] - pts[1][1]) * 0.62} r={3.4} fill={cuff} />
    </g>
  );
}

function Eyes({ mood, iris }: { mood: Mood; iris: string }) {
  const happy = mood === 'happy' || mood === 'excited';
  if (happy) {
    return (
      <g fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round">
        <path d="M40 66 Q47 56 54 66" />
        <path d="M66 66 Q73 56 80 66" />
      </g>
    );
  }
  const big = mood === 'surprised';
  const rx = big ? 7.4 : 6.4;
  const ry = big ? 9 : 8;
  const px = mood === 'think' ? 2 : 0;
  const py = mood === 'think' ? -2.4 : mood === 'sad' ? 1.5 : 0;
  return (
    <g className="km-blink">
      {[47, 73].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={65} rx={rx} ry={ry} fill="#fff" stroke={INK} strokeWidth={1.6} />
          <ellipse cx={cx + px} cy={65.5 + py} rx={rx - 1.6} ry={ry - 1.4} fill={iris} />
          <ellipse cx={cx + px} cy={66 + py} rx={(rx - 1.6) * 0.55} ry={(ry - 1.4) * 0.6} fill="#1E2A1E" />
          <circle cx={cx + px - 2.2} cy={61.5 + py} r={2.2} fill="#fff" />
          <circle cx={cx + px + 2} cy={68 + py} r={1} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Brows({ mood }: { mood: Mood }) {
  const st = { fill: 'none', stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round' as const };
  if (mood === 'sad') return <g {...st}><path d="M40 52 L53 49" /><path d="M80 52 L67 49" /></g>;
  if (mood === 'surprised') return <g {...st}><path d="M41 47 Q47 43 53 47" /><path d="M67 47 Q73 43 79 47" /></g>;
  if (mood === 'confused') return <g {...st}><path d="M41 52 Q47 50 53 52" /><path d="M67 48 Q73 42 79 48" /></g>;
  if (mood === 'excited' || mood === 'happy') return null;
  return <g {...st} opacity={0.75}><path d="M41 52 Q47 49.5 53 52" /><path d="M67 52 Q73 49.5 79 52" /></g>;
}

function Mouth({ mood }: { mood: Mood }) {
  const line = { fill: 'none', stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round' as const };
  switch (mood) {
    case 'talk':
      return <ellipse className="km-talk" cx={60} cy={78} rx={5.2} ry={4} fill={MOUTH} stroke={INK} strokeWidth={1.4} />;
    case 'happy':
    case 'excited':
    case 'wave':
      return <path d="M51 73 Q60 88 69 73 Z" fill={MOUTH} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />;
    case 'sad':
      return <path d="M54 81 Q60 75 66 81" {...line} />;
    case 'surprised':
      return <ellipse cx={60} cy={79} rx={3.6} ry={4.6} fill={MOUTH} stroke={INK} strokeWidth={1.4} />;
    case 'confused':
      return <path d="M53 79 Q56.5 74.5 60 79 T67 79" {...line} />;
    case 'think':
      return <path d="M55 77 Q61 80 66 76" {...line} />;
    default:
      return <path d="M54 76 Q60 81.5 66 76" {...line} />;
  }
}

function Face({ mood, iris }: { mood: Mood; iris: string }) {
  return (
    <g>
      <Brows mood={mood} />
      <Eyes mood={mood} iris={iris} />
      <ellipse cx={39} cy={75} rx={5.5} ry={3.4} fill="#FF9E9E" opacity={0.5} />
      <ellipse cx={81} cy={75} rx={5.5} ry={3.4} fill="#FF9E9E" opacity={0.5} />
      <Mouth mood={mood} />
      {mood === 'sad' && <path d="M38 70 Q36 76 38.5 78 Q41 76 38 70Z" fill="#8FD0F0" stroke={INK} strokeWidth={0.8} />}
    </g>
  );
}

function Hijab({ color, dark, leaf }: { color: string; dark: string; leaf?: boolean }) {
  return (
    <g strokeLinejoin="round">
      {/* belakang kepala dan bahu */}
      <path d="M60 12 C28 12 17 38 19 62 C20 82 28 94 36 102 L84 102 C92 94 100 82 101 62 C103 38 92 12 60 12Z" fill={color} stroke={INK} strokeWidth={2} />
      <path d="M26 74 Q30 94 40 100" fill="none" stroke={dark} strokeWidth={2} opacity={0.5} />
      {leaf && (
        <g className="km-sway">
          <path d="M60 14 Q50 -2 40 6 Q48 16 60 14Z" fill="#7FD35A" stroke={INK} strokeWidth={1.6} />
          <path d="M60 14 Q68 -4 80 4 Q72 16 60 14Z" fill="#5FBE48" stroke={INK} strokeWidth={1.6} />
        </g>
      )}
    </g>
  );
}

/** Bagian depan hijab: bingkai wajah dan juntai dada. Digambar SETELAH wajah. */
function HijabFront({ color, dark }: { color: string; dark: string }) {
  return (
    <g strokeLinejoin="round">
      <path d="M31 62 C30 36 44 24 60 24 C76 24 90 36 89 62 C84 46 74 40 60 40 C46 40 36 46 31 62Z" fill={color} stroke={INK} strokeWidth={1.8} />
      <path d="M33 80 Q60 98 87 80 L95 112 Q60 126 25 112Z" fill={color} stroke={INK} strokeWidth={2} />
      <path d="M40 96 Q60 106 80 96" fill="none" stroke={dark} strokeWidth={1.8} opacity={0.55} />
    </g>
  );
}

function Shoes({ accent }: { accent: string }) {
  return (
    <g stroke={INK} strokeWidth={1.8}>
      <ellipse cx={47} cy={164} rx={11} ry={5.5} fill="#fff" />
      <ellipse cx={73} cy={164} rx={11} ry={5.5} fill="#fff" />
      <path d="M40 163 Q47 160 54 163" fill="none" stroke={accent} strokeWidth={2.4} />
      <path d="M66 163 Q73 160 80 163" fill="none" stroke={accent} strokeWidth={2.4} />
    </g>
  );
}

interface ChibiProps {
  who: Who;
  mood?: Mood;
  size?: number;
  /** Bila dipakai di dalam <svg> lain (adegan). */
  x?: number;
  y?: number;
  label?: string;
}

/** Karakter chibi. Tinggi 170, lebar 120 (viewBox). Tidak dikendalikan pemain: hanya idle dan bereaksi. */
export function Chibi({ who, mood = 'idle', size = 120, x, y, label }: ChibiProps) {
  const p = PAL[who];
  const pose = POSES[mood];
  const sleeveFor = who === 'boy' ? CREAM : who === 'guide' ? CREAM : CREAM;
  const accent = who === 'girl' ? '#7FBF55' : p.cloth;
  const inner = (
    <>
      <ellipse cx={60} cy={166} rx={34} ry={5} fill="#000" opacity={0.12} />
      <g className="km-breathe">
        {/* kaki dan bawahan */}
        <g stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
          {who === 'boy' ? (
            <>
              <path d="M41 126 L79 126 L80 160 L63 160 L60 138 L57 160 L40 160Z" fill={DGREEN} />
              <path d="M41 142 L50 142 L50 150 L41 150Z" fill="#245A2B" strokeWidth={1.2} />
            </>
          ) : (
            <>
              <rect x={44} y={146} width={10} height={16} fill={SKIN} />
              <rect x={66} y={146} width={10} height={16} fill={SKIN} />
              <rect x={44} y={154} width={10} height={9} fill="#fff" />
              <rect x={66} y={154} width={10} height={9} fill="#fff" />
              <path d="M38 124 L82 124 L96 156 Q60 164 24 156Z" fill={DGREEN} />
              <path d="M30 146 Q60 154 90 146" fill="none" stroke="#7FBF55" strokeWidth={1.8} />
            </>
          )}
        </g>
        <Shoes accent={accent} />
        {/* badan */}
        <g stroke={INK} strokeWidth={1.9} strokeLinejoin="round">
          <path d="M38 98 Q60 94 82 98 L84 130 Q60 134 36 130Z" fill={CREAM} />
          {who === 'boy' && <path d="M44 128 Q60 132 76 128" fill="none" stroke={p.cloth} strokeWidth={4} strokeLinecap="round" />}
          {who !== 'boy' && <path d="M38 124 Q60 130 82 124 L82 130 Q60 135 38 130Z" fill={p.clothDark} stroke="none" />}
        </g>
        {/* tas kecil pemandu */}
        {who === 'guide' && (
          <g stroke={INK} strokeWidth={1.6}>
            <path d="M34 112 Q60 142 90 112" fill="none" strokeWidth={2.6} stroke="#B98A4A" />
            <rect x={78} y={124} width={17} height={14} rx={3} fill="#C99B55" />
            <path d="M86.5 127 l1.8 3.7 4 .5 -2.9 2.8 .7 4 -3.6-1.9 -3.6 1.9 .7-4 -2.9-2.8 4-.5z" fill="#FFD84D" strokeWidth={0.8} />
          </g>
        )}
        {who === 'boy' && (
          <g>
            <path d="M44 98 L44 126" stroke="#8A6B3F" strokeWidth={4} strokeLinecap="round" />
            <path d="M76 98 L76 126" stroke="#8A6B3F" strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        {/* lengan kiri */}
        <Arm pts={pose.l} sleeve={sleeveFor} cuff={p.cloth} />
        {/* kepala */}
        <g className={mood === 'excited' ? 'km-cheer' : undefined}>
          {who === 'boy' ? (
            <>
              <circle cx={32} cy={64} r={5} fill={SKIN} stroke={INK} strokeWidth={1.6} />
              <circle cx={88} cy={64} r={5} fill={SKIN} stroke={INK} strokeWidth={1.6} />
              <ellipse cx={60} cy={62} rx={29} ry={28} fill={SKIN} stroke={INK} strokeWidth={2} />
            </>
          ) : (
            <>
              <Hijab color={p.cloth} dark={p.clothDark} leaf={who === 'guide'} />
              <ellipse cx={60} cy={63} rx={28.5} ry={27} fill={SKIN} stroke={INK} strokeWidth={1.8} />
            </>
          )}
          <Face mood={mood} iris={p.iris} />
          {who === 'boy' ? (
            <g stroke={INK} strokeWidth={1.9} strokeLinejoin="round" fill="#4A3024">
              <path d="M29 58 C26 28 44 12 62 14 C82 12 96 30 91 58 C88 46 82 38 72 36 C68 44 54 42 49 35 C40 38 33 46 29 58Z" />
              <path d="M44 16 Q40 4 52 8 Q54 12 52 16Z" />
              <path d="M64 14 Q70 2 78 10 Q76 14 74 16Z" />
            </g>
          ) : (
            <HijabFront color={p.cloth} dark={p.clothDark} />
          )}
          {who === 'guide' && (
            <path transform="translate(86 36)" d="M0 -8 l2.4 5 5.4.7 -4 3.8 1 5.4 -4.8-2.6 -4.8 2.6 1-5.4 -4-3.8 5.4-.7z" fill="#FFD84D" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
          )}
          {who === 'girl' && (
            <g transform="translate(86 38)" stroke={INK} strokeWidth={1.2}>
              <circle cx={-3} cy={-3} r={3.6} fill="#fff" /><circle cx={3} cy={-3} r={3.6} fill="#fff" />
              <circle cx={-3} cy={3} r={3.6} fill="#fff" /><circle cx={3} cy={3} r={3.6} fill="#fff" />
              <circle cx={0} cy={0} r={2.4} fill="#FFD84D" />
            </g>
          )}
        </g>
        {/* lengan kanan (di depan hijab) */}
        {pose.waveR ? (
          <g className="km-wave" style={{ transformOrigin: '80px 104px' }}>
            <Arm pts={pose.r} sleeve={sleeveFor} cuff={p.cloth} />
          </g>
        ) : (
          <Arm pts={pose.r} sleeve={sleeveFor} cuff={p.cloth} />
        )}
      </g>
      {mood === 'think' && <text x={96} y={36} fontSize={22} fontWeight={800} fill="#E8A21A" stroke={INK} strokeWidth={0.8}>?</text>}
      {mood === 'confused' && <text x={92} y={34} fontSize={22} fontWeight={800} fill="#E8A21A" stroke={INK} strokeWidth={0.8}>?</text>}
      {mood === 'surprised' && <text x={94} y={34} fontSize={24} fontWeight={800} fill="#F26B21" stroke={INK} strokeWidth={0.8}>!</text>}
      {(mood === 'excited' || mood === 'happy') && (
        <g fill="#FFD84D" stroke={INK} strokeWidth={0.9}>
          <path d="M104 40 l2 4.6 5 .6 -3.7 3.4 1 5 -4.3-2.5 -4.3 2.5 1-5 -3.7-3.4 5-.6z" />
          <path d="M12 46 l1.6 3.6 3.9.5 -2.9 2.7.8 3.9 -3.4-2 -3.4 2 .8-3.9 -2.9-2.7 3.9-.5z" />
        </g>
      )}
    </>
  );
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={(size * 170) / 120}
      viewBox="0 0 120 170"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      overflow="visible"
    >
      {inner}
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
