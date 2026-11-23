import type { KObjKind } from './komikData';

const INK = '#33432F';

/** Benda-benda untuk level 3 sampai 6. Digambar di tengah 0,0; muat dalam ±22. */
export function Item({ kind, s = 1 }: { kind: KObjKind; s?: number }) {
  const g = { stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  switch (kind) {
    case 'apple':
      return (
        <g transform={`scale(${s})`} {...g}>
          <path d="M0 -6 Q-11 -9 -11 2 Q-11 12 -4 12 Q0 10 4 12 Q11 12 11 2 Q11 -9 0 -6Z" fill="#E8453C" />
          <path d="M0 -6 Q1 -11 4 -13" fill="none" />
          <path d="M2 -9 Q8 -15 13 -10 Q8 -6 2 -9Z" fill="#6CCB4E" strokeWidth={1.1} />
          <path d="M-7 -1 Q-7 -4 -4 -5" fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.8} />
        </g>
      );
    case 'banana':
      return (
        <g transform={`rotate(-14) scale(${s})`} {...g}>
          <path d="M-14 -4 Q-4 10 12 2 Q14 0 15 -4 Q4 3 -9 -9 Q-14 -9 -14 -4Z" fill="#FFD84D" />
          <path d="M-14 -4 Q-15 -9 -11 -11 L-9 -9" fill="#8A6B3F" strokeWidth={1.2} />
          <path d="M15 -4 l2 -2" strokeWidth={2} />
        </g>
      );
    case 'glass':
      return (
        <g transform={`scale(${s})`} {...g}>
          <path d="M-8 -11 L8 -11 L6 11 Q0 13 -6 11Z" fill="#DDF3FF" />
          <path d="M-7 -2 L7 -2 L6 11 Q0 13 -6 11Z" fill="#7CC8F2" strokeWidth={1} />
          <path d="M-4 -8 L-3 6" stroke="#fff" strokeWidth={1.6} opacity={0.85} fill="none" />
        </g>
      );
    case 'plate':
      return (
        <g transform={`scale(${s})`} {...g}>
          <ellipse cx={0} cy={2} rx={15} ry={9} fill="#fff" />
          <ellipse cx={0} cy={2} rx={9.5} ry={5.6} fill="#FFE9B8" strokeWidth={1} />
          <path d="M-10 -2 Q-6 -5 -2 -4" fill="none" stroke="#fff" strokeWidth={1.4} opacity={0.9} />
        </g>
      );
    case 'spoon':
      return (
        <g transform={`rotate(-35) scale(${s})`} {...g}>
          <path d="M-1.6 -2 L1.6 -2 L1.2 14 Q0 15.5 -1.2 14Z" fill="#CFD6DE" />
          <ellipse cx={0} cy={-8} rx={5.4} ry={7.4} fill="#E4E9EF" />
          <path d="M-2.4 -11 Q-2.4 -14 0 -14.6" fill="none" stroke="#fff" strokeWidth={1.4} />
        </g>
      );
    case 'pencil':
      return (
        <g transform={`rotate(-30) scale(${s})`} {...g}>
          <rect x={-14} y={-3.6} width={20} height={7.2} fill="#FFC83D" />
          <path d="M6 -3.6 L15 0 L6 3.6Z" fill="#F3D2A6" />
          <path d="M12 -1.4 L15 0 L12 1.4Z" fill="#33432F" stroke="none" />
          <rect x={-18} y={-3.6} width={4.6} height={7.2} rx={1.4} fill="#FF8FB1" />
          <rect x={-14} y={-3.6} width={2.6} height={7.2} fill="#B9C2CC" strokeWidth={1} />
        </g>
      );
    case 'eraser':
      return (
        <g transform={`rotate(10) scale(${s})`} {...g}>
          <rect x={-11} y={-6.5} width={22} height={13} rx={3} fill="#FF8FB1" />
          <rect x={-11} y={-6.5} width={9} height={13} rx={3} fill="#6CB6F2" />
          <path d="M-2 -6.5 V6.5" strokeWidth={1.2} />
        </g>
      );
    case 'bag':
      return (
        <g transform={`scale(${s})`} {...g}>
          <path d="M-6 -12 Q0 -17 6 -12" fill="none" strokeWidth={2.2} />
          <path d="M-11 -9 Q0 -14 11 -9 L12 12 Q0 15 -12 12Z" fill="#F0506E" />
          <path d="M-9 1 Q0 -2 9 1 L9.6 10 Q0 12.4 -9.6 10Z" fill="#C73F5A" strokeWidth={1.1} />
          <rect x={-3} y={3.4} width={6} height={4} rx={1.2} fill="#FFD84D" strokeWidth={1} />
        </g>
      );
    case 'ball':
      return (
        <g transform={`scale(${s})`} {...g}>
          <circle r={12} fill="#FF8A3D" />
          <path d="M-12 0 H12 M0 -12 V12 M-8.5 -8.5 Q0 0 -8.5 8.5 M8.5 -8.5 Q0 0 8.5 8.5" fill="none" strokeWidth={1.2} />
        </g>
      );
    case 'shell':
      return (
        <g transform={`scale(${s})`} {...g}>
          <path d="M0 11 L-12 -2 Q-10 -12 0 -12 Q10 -12 12 -2Z" fill="#FFB8C9" />
          <path d="M0 11 L-6 -10 M0 11 L0 -12 M0 11 L6 -10" fill="none" strokeWidth={1.1} />
          <rect x={-4.4} y={10} width={8.8} height={3.4} rx={1.4} fill="#F5D7B0" strokeWidth={1.1} />
        </g>
      );
    case 'starfish':
      return (
        <g transform={`rotate(12) scale(${s})`} {...g}>
          <path d="M0 -13 L3.6 -4.2 L13 -3.6 L5.8 2.4 L8.2 11.6 L0 6.6 L-8.2 11.6 L-5.8 2.4 L-13 -3.6 L-3.6 -4.2Z" fill="#FF9A3D" />
          <circle cx={0} cy={-2} r={1} fill="#FFE2B8" stroke="none" />
          <circle cx={-4} cy={1} r={0.9} fill="#FFE2B8" stroke="none" />
          <circle cx={4} cy={1} r={0.9} fill="#FFE2B8" stroke="none" />
        </g>
      );
    case 'bucket':
      return (
        <g transform={`scale(${s})`} {...g}>
          <path d="M-10 -8 Q0 -22 10 -8" fill="none" strokeWidth={1.8} />
          <path d="M-11 -8 L11 -8 L8 11 Q0 13.4 -8 11Z" fill="#4FA6F0" />
          <rect x={-11.6} y={-9.4} width={23.2} height={4.4} rx={2} fill="#F0506E" />
          <path d="M-5 -2 L-4 8" stroke="#fff" strokeWidth={1.6} opacity={0.75} fill="none" />
        </g>
      );
    case 'spade':
      return (
        <g transform={`rotate(25) scale(${s})`} {...g}>
          <rect x={-1.8} y={-15} width={3.6} height={15} rx={1.8} fill="#B9855A" />
          <rect x={-5.4} y={-17} width={10.8} height={3.6} rx={1.8} fill="#8A6340" />
          <path d="M-7 0 L7 0 L6 10 Q0 15 -6 10Z" fill="#F0506E" />
        </g>
      );
    case 'hat':
      return (
        <g transform={`scale(${s})`} {...g}>
          <ellipse cx={0} cy={4} rx={19} ry={6.4} fill="#F5D28A" />
          <path d="M-10 3 Q-10 -12 0 -12 Q10 -12 10 3 Q0 7 -10 3Z" fill="#FBE3A6" />
          <path d="M-10 0 Q0 4 10 0" fill="none" stroke="#F0506E" strokeWidth={3} />
        </g>
      );
    case 'carrot':
      return (
        <g transform={`rotate(-30) scale(${s})`} {...g}>
          <path d="M-6 -6 L6 -6 L1 15 Q0 16 -1 15Z" fill="#FF8A3D" />
          <path d="M-3 -1 H1 M-2 4 H1.4" fill="none" strokeWidth={1} />
          <path d="M0 -6 Q-9 -10 -6 -15 Q-1 -12 0 -6 Q0 -16 3 -17 Q4 -11 0 -6 Q7 -12 11 -8 Q7 -5 0 -6Z" fill="#5FBE48" strokeWidth={1.1} />
        </g>
      );
    case 'tomato':
      return (
        <g transform={`scale(${s})`} {...g}>
          <path d="M0 -8 Q-13 -9 -12 2 Q-11 12 0 12 Q11 12 12 2 Q13 -9 0 -8Z" fill="#E8453C" />
          <path d="M0 -8 L-5 -11 L-2 -6 L-7 -6 L-1 -4 M0 -8 L5 -11 L2 -6 L7 -6 L1 -4Z" fill="#5FBE48" strokeWidth={1.1} />
          <path d="M-8 0 Q-8 -3 -5 -4" fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.8} />
        </g>
      );
    case 'corn':
      return (
        <g transform={`rotate(-12) scale(${s})`} {...g}>
          <ellipse cx={0} cy={-3} rx={6.2} ry={12} fill="#FFD84D" />
          <path d="M-3 -12 V6 M0 -14 V8 M3 -12 V6 M-6 -6 H6 M-6 -1 H6 M-5 4 H5" fill="none" strokeWidth={0.8} />
          <path d="M-10 14 Q-12 -2 -1 -6 Q-1 6 3 14Z" fill="#6CCB4E" />
          <path d="M10 14 Q12 -2 1 -6 Q1 6 -3 14Z" fill="#4FB43C" />
        </g>
      );
    case 'hoe':
      return (
        <g transform={`rotate(35) scale(${s})`} {...g}>
          <rect x={-1.8} y={-17} width={3.6} height={30} rx={1.8} fill="#B9855A" />
          <path d="M-8 11 L8 11 L8 16 L2 14 L-2 14 L-8 16Z" fill="#9AA7B3" />
        </g>
      );
    case 'cone':
      return (
        <g transform={`scale(${s})`} {...g}>
          <path d="M0 -13 L17 6 Q0 11 -17 6Z" fill="#F5D28A" />
          <path d="M0 -13 L-7 8 M0 -13 L7 8 M0 -13 L0 9" fill="none" strokeWidth={0.9} />
          <path d="M-12 3 Q0 8 12 3" fill="none" stroke="#F0506E" strokeWidth={2.4} />
        </g>
      );
    default:
      return null;
  }
}
