/**
 * Suara karakter Komik Pintar: ucapan tak bermakna ("Hiii-buup!") yang dibuat langsung di perangkat lewat WebAudio.
 * Tanpa berkas audio, tanpa unduhan, tanpa suara Google/TTS. Teks dialog tetap tampil sebagai tulisan.
 * Pengaturan hanya di perangkat ini. Mutu suara belum diuji di ponsel nyata.
 */
const KEY = 'pintara:komik:suara';

export type Vokal = 'sapa' | 'senang' | 'terkejut' | 'bingung' | 'berhasil' | 'kecewa' | 'idle' | 'bicara';
export type Penutur = 'guide' | 'boy' | 'girl';

const FRASA: Record<Exclude<Vokal, 'bicara'>, string[]> = {
  sapa: ['Hiii-buup!', 'Hiii-bli!'],
  senang: ['Yipiii!', 'Yip-yipii!'],
  terkejut: ['Woop?!', 'Wuuop?!'],
  bingung: ['Mmm... blup?', 'Hmm-blup?'],
  berhasil: ['Yaa-bii!', 'Yaaay-bii!'],
  kecewa: ['Aww-bup...', 'Awww-bup...'],
  idle: ['Hmm-bli...', 'Mmm-bla...'],
};
const PENGGALAN = ['bli', 'bla', 'blu', 'bub', 'lup', 'pip', 'bop', 'mmi', 'wa', 'yu', 'nub', 'hii', 'bee'];

/** Tinggi nada dasar (Hz) dan kecerahan per penutur. */
const SUARA: Record<Penutur, { base: number; vol: number }> = {
  guide: { base: 520, vol: 1 },
  girl: { base: 440, vol: 0.9 },
  boy: { base: 330, vol: 0.9 },
};

/** Bentuk nada per penggalan (pengali nada), diulang bila penggalan lebih banyak. */
const KONTUR: Record<Vokal, number[]> = {
  sapa: [1, 1.32],
  senang: [1, 1.26, 1.5],
  terkejut: [0.95, 1.5],
  bingung: [1, 0.9, 1.35],
  berhasil: [1, 1.5],
  kecewa: [1, 0.86, 0.7],
  idle: [0.9, 0.82],
  bicara: [1, 1.12, 0.95, 1.2],
};

/** Formant kasar tiap vokal: [F1, F2]. */
const FORMANT: Record<string, [number, number]> = { a: [800, 1250], i: [320, 2300], u: [340, 900], o: [520, 920], e: [520, 1850] };

type Ctx = AudioContext;
let ctx: Ctx | null = null;
let last = 0;
let active: { master: GainNode; stops: OscillatorNode[] } | null = null;

const AC = (): typeof AudioContext | undefined =>
  typeof window === 'undefined' ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

export const suaraTersedia = (): boolean => Boolean(AC());

export function suaraAktif(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

/** Panggil dari ketukan pemain (mis. tombol Mulai) agar peramban mengizinkan suara. */
export function siapkanSuara(): void {
  const C = AC();
  if (!C) return;
  try {
    ctx ??= new C();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* abaikan */
  }
}

export function stopBicara(): void {
  const a = active;
  active = null;
  if (!a || !ctx) return;
  try {
    const t = ctx.currentTime;
    a.master.gain.cancelScheduledValues(t);
    a.master.gain.setTargetAtTime(0, t, 0.015);
    a.stops.forEach((o) => {
      try {
        o.stop(t + 0.08);
      } catch {
        /* sudah berhenti */
      }
    });
  } catch {
    /* abaikan */
  }
}

export function aturSuara(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* abaikan */
  }
  if (!on) stopBicara();
}

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

/** Pecah "Mmm... blup?" menjadi penggalan beserta tanda akhirnya. */
function pecah(teks: string): { huruf: string; tanda: string }[] {
  return teks
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((tok) => ({ huruf: tok.toLowerCase().replace(/[^a-z]/g, ''), tanda: tok.replace(/[a-z]/gi, '') }))
    .filter((t) => t.huruf.length > 0);
}

function nada(c: Ctx, master: GainNode, stops: OscillatorNode[], huruf: string, tanda: string, t0: number, f0: number, ratio: number, akhir: boolean, redam: number): number {
  const vokal = huruf.match(/[aeiou]+/)?.[0] ?? 'u';
  const v = vokal[0];
  const panjangVokal = Math.min(4, vokal.length);
  let dur = 0.1 + 0.04 * (panjangVokal - 1) + (huruf.length > 3 ? 0.02 : 0);
  if (akhir && tanda.includes('.')) dur += 0.12;
  const f = f0 * ratio;
  const awal = /^[bp]/.test(huruf) ? 0.72 : /^[wyl]/.test(huruf) ? 0.85 : /^[mn]/.test(huruf) ? 0.9 : 1;
  const sengau = /^[mn]/.test(huruf);
  const [f1, f2] = FORMANT[v] ?? FORMANT.u;

  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  const vib = c.createOscillator();
  const vibG = c.createGain();
  vib.frequency.value = 6.5;
  vibG.gain.value = f * 0.012;
  vib.connect(vibG).connect(osc.frequency);
  osc.frequency.setValueAtTime(f * awal, t0);
  osc.frequency.exponentialRampToValueAtTime(f, t0 + 0.04);
  if (akhir && tanda.includes('?')) osc.frequency.exponentialRampToValueAtTime(f * 1.4, t0 + dur);
  else if (akhir && tanda.includes('.')) osc.frequency.exponentialRampToValueAtTime(f * 0.78, t0 + dur);
  else osc.frequency.exponentialRampToValueAtTime(f * 0.97, t0 + dur);

  const g = c.createGain();
  const puncak = (tanda.includes('!') ? 0.34 : 0.26) * redam;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(puncak, t0 + 0.012);
  g.gain.setTargetAtTime(puncak * 0.55, t0 + 0.04, 0.05);
  g.gain.setTargetAtTime(0.0001, t0 + dur - 0.025, 0.02);

  // dua puncak formant sejajar -> warna vokal
  const mix = c.createGain();
  mix.gain.value = 1;
  [f1, f2].forEach((fc, i) => {
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = sengau ? fc * 0.7 : fc;
    bp.Q.value = 5;
    const out = c.createGain();
    out.gain.value = i === 0 ? 1 : 0.55;
    osc.connect(bp).connect(out).connect(mix);
  });
  mix.connect(g).connect(master);
  osc.start(t0);
  vib.start(t0);
  osc.stop(t0 + dur + 0.05);
  vib.stop(t0 + dur + 0.05);
  stops.push(osc, vib);
  return dur;
}

/** Mainkan satu ucapan. Mengembalikan teks yang pantas ditampilkan sebagai gelembung suara (kosong untuk celoteh biasa). */
export function bicara(jenis: Vokal, siapa: Penutur = 'guide', opsi: { paksa?: boolean; teks?: string; kata?: number } = {}): string {
  const teks = jenis === 'bicara' ? '' : opsi.teks ?? pick(FRASA[jenis]);
  if (!suaraTersedia() || (!opsi.paksa && !suaraAktif())) return teks;
  const now = Date.now();
  if (now - last < 220 && jenis !== 'berhasil') return teks;
  last = now;
  try {
    siapkanSuara();
    const c = ctx;
    if (!c) return teks;
    stopBicara();
    let frasa = teks;
    if (jenis === 'bicara') {
      const n = Math.max(3, Math.min(7, Math.round((opsi.kata ?? 8) / 2.2)));
      frasa = Array.from({ length: n }, () => pick(PENGGALAN)).join('-');
    }
    const parts = pecah(frasa);
    const master = c.createGain();
    master.gain.value = (jenis === 'idle' ? 0.45 : 1) * SUARA[siapa].vol * 0.55;
    master.connect(c.destination);
    const stops: OscillatorNode[] = [];
    const kontur = KONTUR[jenis];
    let t = c.currentTime + 0.02;
    parts.forEach((p, i) => {
      const d = nada(c, master, stops, p.huruf, p.tanda, t, SUARA[siapa].base, kontur[i % kontur.length], i === parts.length - 1, jenis === 'idle' ? 0.8 : 1);
      t += d + 0.035;
    });
    active = { master, stops };
  } catch {
    /* suara tidak wajib */
  }
  return teks;
}
