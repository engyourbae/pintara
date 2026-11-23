import { GardenBack, SCENE_H, SCENE_W } from './KomikArt';
import { INK, ObjArt, type SceneProps } from './KomikScenes';
import type { KObj } from './komikData';

/** Adegan level 3 sampai 6: dapur, kelas, pantai, kebun sayur. */

function helpers({ objs, hidden, placed }: SceneProps) {
  const o = (id: string): KObj => objs.find((x) => x.id === id) as KObj;
  const hid = (id: string) => (hidden(id) ? <ObjArt key={id} o={o(id)} x={o(id).x} y={o(id).y} /> : null);
  const put = (t: string, id: string, x: number, y: number, s = 1) => (placed[t]?.includes(id) ? <ObjArt key={`${t}-${id}`} o={o(id)} x={x} y={y} s={s} /> : null);
  return { o, hid, put };
}

const line = { stroke: INK, strokeWidth: 1.8, strokeLinejoin: 'round' as const };

/* ───────── Level 3: dapur ───────── */
export function KitchenScene(p: SceneProps) {
  const { hid, put } = helpers(p);
  return (
    <g>
      <rect width={SCENE_W} height={250} fill="#E3F5EE" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 45} 0 V250`} stroke="#C5E6DA" strokeWidth={1.4} />)}
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${i * 45} H${SCENE_W}`} stroke="#C5E6DA" strokeWidth={1.4} />)}
      <rect y={250} width={SCENE_W} height={SCENE_H - 250} fill="#E9C99A" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 52} 250 L${i * 52 - 40} ${SCENE_H}`} stroke="#D3AE7A" strokeWidth={1.4} />)}
      {/* jendela */}
      <g {...line}>
        <rect x={130} y={26} width={80} height={74} rx={4} fill="#fff" />
        <rect x={136} y={32} width={68} height={62} fill="#A9DDF6" />
        <path d="M170 32 V94 M136 63 H204" stroke="#fff" strokeWidth={4} />
        <rect x={124} y={98} width={92} height={8} rx={2} fill="#D9A66B" />
      </g>
      {hid('gelas')}
      {/* rak dinding */}
      <g {...line}>
        <rect x={246} y={112} width={100} height={7} rx={2} fill="#B9855A" />
        <path d="M254 119 V128 M338 119 V128" stroke="#8A6340" strokeWidth={3} />
        <path d="M262 112 q0 -14 12 -14 q12 0 12 14Z" fill="#F0A0B8" />
      </g>
      {put('rak', 'gelas', 306, 100)}
      {put('rak', 'piring', 328, 102, 0.85)}
      {/* meja dapur */}
      <g {...line}>
        <rect x={110} y={166} width={250} height={86} fill="#F2D9A8" />
        <rect x={104} y={160} width={256} height={10} rx={3} fill="#C99B55" />
        <rect x={195} y={184} width={80} height={26} rx={4} fill="#E5C386" />
        <rect x={228} y={194} width={14} height={5} rx={2.4} fill="#8A6340" />
        <path d="M122 176 H186 M122 196 V248 M284 176 H350 M284 196 V248" fill="none" strokeWidth={1.2} stroke="#C99B55" />
        <path d="M258 160 q12 -12 24 0" fill="none" />
        <rect x={266} y={158} width={64} height={4} fill="#C5D1DA" />
        <ellipse cx={298} cy={162} rx={26} ry={4} fill="#9AB0C0" strokeWidth={1.2} />
      </g>
      {hid('pisang')}
      {hid('sendok')}
      {put('laci', 'sendok', 235, 192)}
      {hid('piring')}
      {/* meja bulat dan keranjang */}
      <g {...line}>
        <ellipse cx={190} cy={354} rx={52} ry={14} fill="#C99B55" />
        <rect x={184} y={354} width={12} height={36} fill="#B9855A" />
        <path d="M156 326 H224 L216 350 Q190 356 164 350Z" fill="#E8B04A" />
        <path d="M160 334 H220 M163 342 H217" fill="none" strokeWidth={1.2} stroke="#B9855A" />
      </g>
      {put('keranjang', 'apel', 176, 322)}
      {put('keranjang', 'pisang', 206, 324)}
      {hid('apel')}
      {p.chars}
    </g>
  );
}

/* ───────── Level 4: kelas ───────── */
export function SchoolScene(p: SceneProps) {
  const { hid, put } = helpers(p);
  return (
    <g>
      <rect width={SCENE_W} height={252} fill="#FFF1D2" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 40 + 18} width={14} height={252} fill="#F8E0A8" opacity={0.45} />)}
      <rect y={248} width={SCENE_W} height={9} fill="#A8744A" stroke={INK} strokeWidth={1.4} />
      <rect y={257} width={SCENE_W} height={SCENE_H - 257} fill="#D9A66B" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${275 + i * 28} H${SCENE_W}`} stroke="#B98652" strokeWidth={1.2} opacity={0.6} />)}
      {/* papan tulis */}
      <g {...line}>
        <rect x={90} y={26} width={200} height={86} rx={4} fill="#3F7A55" />
        <rect x={84} y={20} width={212} height={98} rx={6} fill="none" stroke="#B9855A" strokeWidth={6} />
        <rect x={100} y={112} width={180} height={6} fill="#B9855A" />
      </g>
      <text x={118} y={76} fontSize={30} fontWeight={800} fill="#fff" opacity={0.9}>A B C</text>
      <text x={118} y={100} fontSize={16} fontWeight={800} fill="#FFE9A8">1 + 2 = 3</text>
      {hid('penghapus')}
      {/* jam */}
      <g {...line}>
        <circle cx={324} cy={50} r={17} fill="#fff" />
        <path d="M324 50 V40 M324 50 L332 54" fill="none" strokeLinecap="round" />
      </g>
      {/* gantungan tas */}
      <g {...line}>
        <rect x={12} y={126} width={60} height={8} rx={3} fill="#B9855A" />
        <path d="M24 134 v8 M40 134 v8 M56 134 v8" strokeWidth={3} />
      </g>
      {put('gantung', 'tas', 40, 154, 1.2)}
      {hid('bola')}
      {/* rak buku */}
      <g {...line}>
        <rect x={290} y={122} width={64} height={142} rx={3} fill="#C99B55" />
        <rect x={296} y={128} width={52} height={130} fill="#8A6340" />
        <path d="M296 160 H348 M296 196 H348 M296 230 H348" strokeWidth={4} stroke="#B9855A" />
        <rect x={300} y={138} width={9} height={22} fill="#6CB6F2" />
        <rect x={310} y={142} width={8} height={18} fill="#F5C242" />
        <rect x={322} y={176} width={9} height={20} fill="#7BD66A" />
      </g>
      {put('rak', 'buku', 320, 214, 1.1)}
      {hid('tas')}
      {/* keranjang bola */}
      <g {...line}>
        <path d="M134 204 H186 L180 232 Q160 236 140 232Z" fill="#E8B04A" />
        <path d="M138 214 H182 M140 224 H180" fill="none" strokeWidth={1.1} stroke="#B9855A" />
      </g>
      {put('keranjang', 'bola', 160, 200, 0.9)}
      {/* meja */}
      <g {...line}>
        <rect x={118} y={294} width={144} height={14} rx={3} fill="#E5C386" />
        <rect x={128} y={308} width={10} height={44} fill="#B9855A" />
        <rect x={242} y={308} width={10} height={44} fill="#B9855A" />
        <rect x={176} y={274} width={48} height={20} rx={5} fill="#FF8FB1" />
        <path d="M176 284 H224" strokeWidth={1.2} fill="none" />
      </g>
      {put('kotakpensil', 'pensil', 190, 268, 0.9)}
      {put('kotakpensil', 'penghapus', 214, 270, 0.8)}
      {hid('buku')}
      {hid('pensil')}
      {p.chars}
    </g>
  );
}

/* ───────── Level 5: pantai ───────── */
export function BeachScene(p: SceneProps) {
  const { hid, put } = helpers(p);
  const castle = p.placed.istana?.length ?? 0;
  return (
    <g>
      <defs>
        <linearGradient id="kp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FD3F5" />
          <stop offset="1" stopColor="#D8F2FF" />
        </linearGradient>
      </defs>
      <rect width={SCENE_W} height={160} fill="url(#kp-sky)" />
      <circle cx={308} cy={52} r={24} fill="#FFD84D" stroke={INK} strokeWidth={1.8} />
      <g className="km-cloud" fill="#fff" opacity={0.9}>
        <ellipse cx={90} cy={50} rx={30} ry={11} />
        <ellipse cx={112} cy={42} rx={20} ry={11} />
      </g>
      <rect y={150} width={SCENE_W} height={82} fill="#3FB8D8" />
      {Array.from({ length: 4 }, (_, i) => <path key={i} d={`M${20 + i * 90} ${172 + (i % 2) * 20} q12 -9 24 0 q12 9 24 0`} fill="none" stroke="#9BE3F2" strokeWidth={2.4} strokeLinecap="round" />)}
      <path d="M0 226 Q60 214 130 228 Q200 240 260 222 Q320 212 360 226 V420 H0Z" fill="#F5DE9A" />
      <path d="M0 236 Q60 224 130 238 Q200 250 260 232 Q320 222 360 236" fill="none" stroke="#fff" strokeWidth={3} opacity={0.8} />
      {hid('topi')}
      {/* batu kiri */}
      <g {...line}>
        <path d="M6 262 Q10 238 30 236 Q50 238 54 262Z" fill="#9AA7B3" />
        <path d="M34 262 Q36 248 48 248 Q60 250 62 262Z" fill="#B7C2CC" />
      </g>
      {hid('kerang')}
      {hid('bintang')}
      {/* pohon kelapa */}
      <g {...line}>
        <path d="M318 262 Q322 220 312 176" fill="none" stroke="#B9855A" strokeWidth={9} />
        <path d="M312 176 Q290 160 272 174 Q292 168 312 180Z M312 176 Q330 156 350 168 Q332 166 312 180Z M312 176 Q304 150 318 138 Q316 160 314 178Z" fill="#5FBE48" />
      </g>
      {hid('ember')}
      {/* payung */}
      <g {...line}>
        <path d="M300 258 V212" strokeWidth={3} />
        <path d="M270 214 Q300 184 330 214Z" fill="#F0506E" />
        <path d="M284 214 Q290 196 300 192 Q310 196 316 214" fill="none" stroke="#fff" strokeWidth={2} />
      </g>
      {put('payung', 'topi', 300, 190, 0.8)}
      {/* keranjang pantai */}
      <g {...line}>
        <path d="M126 290 H176 L170 316 Q150 320 132 316Z" fill="#E8B04A" />
        <path d="M130 300 H172" fill="none" strokeWidth={1.1} stroke="#B9855A" />
      </g>
      {put('keranjang', 'ember', 140, 282, 0.9)}
      {put('keranjang', 'sekop', 164, 282, 0.9)}
      {/* istana pasir */}
      <g {...line}>
        <path d="M170 372 L176 336 H234 L240 372 Q205 380 170 372Z" fill="#F0C873" />
        <path d="M176 336 V326 H186 V336 M196 336 V322 H206 V336 M216 336 V326 H226 V336" fill="#F0C873" />
        <path d="M200 372 V356 Q205 348 210 356 V372" fill="#C99B55" strokeWidth={1.2} />
      </g>
      {castle > 0 && put('istana', 'kerang', 184, 346, 0.7)}
      {castle > 0 && put('istana', 'bintang', 226, 350, 0.7)}
      {hid('sekop')}
      {p.chars}
    </g>
  );
}

/* ───────── Level 6: kebun sayur ───────── */
export function FarmScene(p: SceneProps) {
  const { hid, put } = helpers(p);
  const bed = (x: number, y: number, w: number) => (
    <g key={`${x}-${y}`} {...line}>
      <rect x={x} y={y} width={w} height={22} rx={8} fill="#A9744A" />
      {Array.from({ length: Math.floor(w / 24) }, (_, i) => <path key={i} d={`M${x + 14 + i * 24} ${y + 4} q-4 -8 -8 -4 q4 8 8 4 q4 -8 8 -4 q-4 8 -8 4`} fill="#6CCB4E" strokeWidth={1} />)}
    </g>
  );
  return (
    <GardenBack>
      {bed(10, 204, 96)}
      {bed(236, 236, 114)}
      {bed(116, 226, 80)}
      {/* orang-orangan sawah */}
      <g {...line}>
        <path d="M52 188 V262" strokeWidth={4} stroke="#8A6340" />
        <path d="M24 214 H80" strokeWidth={4} stroke="#8A6340" />
        <circle cx={52} cy={196} r={10} fill="#F6E3B4" />
        <path d="M40 232 L64 232 L58 214 L46 214Z" fill="#F0506E" />
      </g>
      {put('orang', 'caping', 52, 186, 0.9)}
      {/* gudang */}
      <g {...line}>
        <rect x={296} y={184} width={58} height={48} fill="#C99B55" />
        <path d="M290 186 L325 160 L360 186Z" fill="#B24A3C" />
        <rect x={314} y={204} width={22} height={28} fill="#8A6340" />
      </g>
      {put('gudang', 'cangkul', 345, 200, 0.7)}
      {hid('jagung')}
      {hid('tomat')}
      {hid('wortel')}
      {hid('cangkul')}
      {hid('caping')}
      {/* keranjang panen */}
      <g {...line}>
        <path d="M152 328 H228 L220 362 Q190 368 160 362Z" fill="#E8B04A" />
        <path d="M156 340 H224 M158 351 H222" fill="none" strokeWidth={1.1} stroke="#B9855A" />
      </g>
      {put('keranjang', 'wortel', 168, 326, 0.9)}
      {put('keranjang', 'tomat', 190, 324, 0.9)}
      {put('keranjang', 'jagung', 212, 326, 0.9)}
      {p.chars}
    </GardenBack>
  );
}
