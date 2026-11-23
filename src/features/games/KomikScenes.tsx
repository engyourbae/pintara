import type { ReactNode } from 'react';
import { Bench, Bush, Butterfly, Flower, GardenBack, Pot, SCENE_H, SCENE_W, Tree, WateringCan, WiltedPlant } from './KomikArt';
import { Item } from './KomikItems';
import type { KObj } from './komikData';

export const INK = '#33432F';

/* ───────── Benda (digambar di tengah 0,0; muat dalam ±22) ───────── */

function Book({ s = 1 }: { s?: number }) {
  return (
    <g transform={`rotate(-8) scale(${s})`} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
      <rect x={-10} y={-8} width={20} height={16} rx={2} fill="#E8574A" />
      <rect x={7} y={-7} width={3.5} height={14} fill="#FFF4D6" />
      <rect x={-10} y={-8} width={4} height={16} rx={1.5} fill="#C73F34" />
      <path d="M-2 -3 h7 M-2 1 h5" stroke="#FFE9A8" strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </g>
  );
}
function Doll({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-6 -2 L6 -2 L9 12 Q0 15 -9 12Z" fill="#FF8FB1" />
      <rect x={-5} y={11} width={4} height={6} rx={1.6} fill="#FFE2CC" />
      <rect x={1} y={11} width={4} height={6} rx={1.6} fill="#FFE2CC" />
      <path d="M-6 0 L-11 6 M6 0 L11 6" fill="none" strokeWidth={3} stroke="#FFE2CC" />
      <circle cx={-12} cy={-9} r={3.4} fill="#F5A04A" />
      <circle cx={12} cy={-9} r={3.4} fill="#F5A04A" />
      <circle cx={0} cy={-9} r={7.6} fill="#FFE2CC" />
      <path d="M-7.4 -11 Q0 -20 7.4 -11 Q0 -14 -7.4 -11Z" fill="#F5A04A" />
      <circle cx={-2.8} cy={-8} r={1} fill={INK} stroke="none" />
      <circle cx={2.8} cy={-8} r={1} fill={INK} stroke="none" />
      <path d="M-2 -5 Q0 -3.4 2 -5" fill="none" strokeWidth={1.1} />
      <path d="M-3 -1.5 l3 2 3 -2 v3 l-3 -1 -3 1z" fill="#FFD84D" strokeWidth={0.9} />
    </g>
  );
}
function Block({ s = 1 }: { s?: number }) {
  return (
    <g transform={`rotate(6) scale(${s})`} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
      <path d="M-9 -6 L-4 -11 L11 -11 L6 -6Z" fill="#8CC8FF" />
      <path d="M6 -6 L11 -11 L11 5 L6 10Z" fill="#2F86D6" />
      <rect x={-9} y={-6} width={15} height={16} fill="#4FA6F0" />
      <text x={-1.5} y={6} fontSize={11} fontWeight={800} textAnchor="middle" fill="#fff" stroke="none">A</text>
    </g>
  );
}
function Car({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
      <path d="M-13 3 L-11 -3 Q-9 -8 -4 -8 L4 -8 Q9 -8 11 -3 L13 3 Q13 7 10 7 L-10 7 Q-13 7 -13 3Z" fill="#F0506E" />
      <path d="M-7 -3 L-4 -6.5 L0 -6.5 L0 -3Z M2 -3 L2 -6.5 L5 -6.5 L8 -3Z" fill="#CDEBFF" strokeWidth={1} />
      <circle cx={-7} cy={7.5} r={3.6} fill="#3B3F46" />
      <circle cx={7} cy={7.5} r={3.6} fill="#3B3F46" />
      <circle cx={-7} cy={7.5} r={1.3} fill="#C9CED6" stroke="none" />
      <circle cx={7} cy={7.5} r={1.3} fill="#C9CED6" stroke="none" />
    </g>
  );
}
function Key({ s = 1 }: { s?: number }) {
  return (
    <g transform={`rotate(-20) scale(${s})`} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
      <circle cx={-8} cy={0} r={5.6} fill="#FFD84D" />
      <circle cx={-8} cy={0} r={2.2} fill="#FFF3B8" />
      <rect x={-3} y={-1.6} width={16} height={3.2} fill="#FFD84D" />
      <rect x={8} y={1} width={3} height={5} fill="#FFD84D" />
      <rect x={12.5} y={1} width={2.6} height={4} fill="#FFD84D" />
    </g>
  );
}

/** Gambar satu benda di (x, y). Dipakai di adegan, daftar bawah, dan benda yang sedang diseret. */
export function ObjArt({ o, x = 0, y = 0, s = 1 }: { o: KObj; x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {o.kind === 'flower' && o.color && <Flower color={o.color} x={0} y={0} s={0.95 * s} stem={s < 1.2} />}
      {o.kind === 'can' && <WateringCan x={0} y={0} s={0.9 * s} />}
      {o.kind === 'butterfly' && <Butterfly x={0} y={0} s={0.85 * s} />}
      {o.kind === 'book' && <Book s={s} />}
      {o.kind === 'doll' && <Doll s={0.9 * s} />}
      {o.kind === 'block' && <Block s={s} />}
      {o.kind === 'car' && <Car s={s} />}
      {o.kind === 'key' && <Key s={s} />}
      <Item kind={o.kind} s={s} />
    </g>
  );
}

/* ───────── Adegan ───────── */

export interface SceneProps {
  objs: KObj[];
  hidden: (id: string) => boolean;
  placed: Record<string, string[]>;
  chars: ReactNode;
}

export function GardenScene({ objs, hidden, placed, chars }: SceneProps) {
  const flowerOf = (t: string) => objs.find((o) => o.id === placed[t]?.[0])?.color;
  return (
    <GardenBack>
      <Tree x={52} y={190} />
      <Bench x={128} y={212} />
      {objs.filter((o) => hidden(o.id)).map((o) => <ObjArt key={o.id} o={o} x={o.x} y={o.y} s={o.id === 'f-kuning' ? 0.85 : 1} />)}
      <Bush x={316} y={248} s={0.9} />
      <Pot x={140} y={350} band="#F0506E" filled={flowerOf('pot-merah')} />
      <Pot x={184} y={350} band="#FFC83D" filled={flowerOf('pot-kuning')} />
      <Pot x={228} y={350} band="#FF8FB1" filled={flowerOf('pot-jambu')} />
      <WiltedPlant x={236} y={282} revived={Boolean(placed.plant?.length)} />
      {chars}
    </GardenBack>
  );
}

function Wall() {
  return (
    <g>
      <defs>
        <linearGradient id="kr-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4DA" />
          <stop offset="1" stopColor="#FBE3B6" />
        </linearGradient>
        <linearGradient id="kr-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E3B27A" />
          <stop offset="1" stopColor="#CF9760" />
        </linearGradient>
      </defs>
      <rect width={SCENE_W} height={252} fill="url(#kr-wall)" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 40 + 18} y={0} width={14} height={252} fill="#F6D9A4" opacity={0.45} />)}
      <rect y={248} width={SCENE_W} height={9} fill="#A8744A" stroke={INK} strokeWidth={1.4} />
      <rect y={257} width={SCENE_W} height={SCENE_H - 257} fill="url(#kr-floor)" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${275 + i * 28} H${SCENE_W}`} stroke="#B98652" strokeWidth={1.2} opacity={0.6} />)}
    </g>
  );
}

export function RoomScene({ objs, hidden, placed, chars }: SceneProps) {
  const o = (id: string) => objs.find((x) => x.id === id)!;
  const hid = (id: string) => hidden(id) && <ObjArt key={id} o={o(id)} x={o(id).x} y={o(id).y} />;
  const opened = Boolean(placed.lemari?.length);
  return (
    <g>
      <Wall />
      {/* mobil menyelip di bawah ujung karpet */}
      {hid('mobil')}
      <ellipse cx={200} cy={335} rx={118} ry={44} fill="#8FD0E8" stroke={INK} strokeWidth={1.8} />
      <ellipse cx={200} cy={335} rx={98} ry={33} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="8 7" opacity={0.8} />
      {/* jendela, tirai, bingkai */}
      <g stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
        <rect x={38} y={34} width={84} height={84} rx={4} fill="#fff" />
        <rect x={44} y={40} width={72} height={72} fill="#A9DDF6" />
        <path d="M80 40 V112 M44 76 H116" stroke="#fff" strokeWidth={4} />
        <ellipse cx={92} cy={60} rx={14} ry={5} fill="#fff" stroke="none" opacity={0.9} />
        <rect x={34} y={114} width={92} height={7} rx={2} fill="#D9A66B" />
      </g>
      {hid('balok')}
      <path d="M32 28 Q50 34 56 40 Q64 80 58 126 L30 126Z" fill="#FF9DB8" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M40 40 Q46 80 42 124 M50 44 Q54 84 50 124" fill="none" stroke="#F27D9E" strokeWidth={1.8} />
      <rect x={140} y={40} width={44} height={36} rx={3} fill="#FFF" stroke={INK} strokeWidth={1.8} />
      <path d="M146 70 L158 54 L166 64 L172 58 L180 70Z" fill="#7BD66A" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <circle cx={170} cy={50} r={4} fill="#FFD84D" />
      {/* rak buku */}
      <g stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
        <rect x={140} y={140} width={105} height={7} rx={2} fill="#B9855A" />
        <rect x={140} y={168} width={105} height={7} rx={2} fill="#B9855A" />
        <path d="M152 147 V160 M233 147 V160" stroke="#8A6340" strokeWidth={3} fill="none" />
        <rect x={150} y={124} width={11} height={16} fill="#6CB6F2" />
        <rect x={161} y={127} width={9} height={13} fill="#F5C242" />
        <rect x={214} y={150} width={14} height={18} rx={3} fill="#F0A0B8" />
        <path d="M218 150 q3 -8 7 0" fill="none" />
      </g>
      {placed.rak?.length ? <ObjArt o={o('buku')} x={196} y={131} s={1.1} /> : null}
      {hid('boneka')}
      {/* lemari */}
      <g stroke={INK} strokeWidth={1.9} strokeLinejoin="round">
        <rect x={262} y={116} width={86} height={146} rx={4} fill="#B97B4A" />
        <rect x={268} y={122} width={74} height={134} rx={3} fill={opened ? '#3C2A25' : '#D79B5D'} />
        {opened ? (
          <>
            <path d="M268 122 L252 128 L252 252 L268 256Z" fill="#D79B5D" />
            <path d="M342 122 L358 128 L358 252 L342 256Z" fill="#D79B5D" />
            <path d="M275 160 H335 M275 200 H335" stroke="#5B433B" strokeWidth={2} />
            <path transform="translate(305 182)" d="M0 -13 l4 8.6 9.4 1.2 -6.9 6.5 1.8 9.3 -8.3-4.6 -8.3 4.6 1.8-9.3 -6.9-6.5 9.4-1.2z" fill="#FFD84D" />
          </>
        ) : (
          <>
            <path d="M305 122 V256" strokeWidth={2.4} />
            <rect x={290} y={186} width={30} height={30} rx={5} fill="#FFD84D" />
            <circle cx={305} cy={198} r={4} fill="#3C2A25" />
            <path d="M305 200 v8" stroke="#3C2A25" strokeWidth={3} strokeLinecap="round" />
          </>
        )}
        <rect x={266} y={258} width={10} height={6} fill="#8A5A34" />
        <rect x={334} y={258} width={10} height={6} fill="#8A5A34" />
      </g>
      {hid('buku')}
      {/* tempat tidur */}
      <g stroke={INK} strokeWidth={1.9} strokeLinejoin="round">
        <rect x={6} y={176} width={14} height={90} rx={4} fill="#B9855A" />
        <rect x={14} y={218} width={116} height={34} rx={6} fill="#8CC8FF" />
        <rect x={14} y={246} width={116} height={10} rx={3} fill="#B9855A" />
        <rect x={120} y={252} width={8} height={14} fill="#8A6340" />
        <rect x={18} y={252} width={8} height={14} fill="#8A6340" />
      </g>
      {hid('kunci')}
      <g stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
        <rect x={20} y={196} width={36} height={24} rx={9} fill="#FFFFFF" />
        <path d="M30 202 q8 -3 16 0" fill="none" stroke="#CFE6F5" strokeWidth={2} />
        <path d="M56 224 Q90 214 130 224 L130 236 Q90 246 56 236Z" fill="#5FA8E8" />
        <path d="M70 222 v18 M90 220 v20 M110 222 v18" stroke="#8CC8FF" strokeWidth={2} />
      </g>
      {placed.kasur?.length ? <ObjArt o={o('boneka')} x={76} y={208} s={1.35} /> : null}
      {/* kotak mainan */}
      {placed.kotak?.includes('balok') && <ObjArt o={o('balok')} x={170} y={330} s={1.15} />}
      {placed.kotak?.includes('mobil') && <ObjArt o={o('mobil')} x={200} y={332} s={1.15} />}
      <g stroke={INK} strokeWidth={1.9} strokeLinejoin="round">
        <path d="M148 338 H220 L216 376 Q184 380 152 376Z" fill="#FFB347" />
        <rect x={146} y={334} width={76} height={9} rx={3} fill="#FFCB6B" />
        <path d="M156 350 H212 M158 362 H210" stroke="#F58B2A" strokeWidth={2.2} fill="none" />
        <circle cx={184} cy={356} r={6} fill="#FFF3B8" />
      </g>
      {chars}
    </g>
  );
}
