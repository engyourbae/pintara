import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Badge, Button, ButtonLink, Card, CheckRow, Icon, Page, PageHeader, ProgressBar, useConfirm } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { progressActions, useProgress } from '@/hooks/useProgress';
import { cn } from '@/utils/cn';
import { Chibi, SCENE_H, SCENE_W, type Mood, type Who } from './KomikArt';
import { GardenScene, ObjArt, RoomScene } from './KomikScenes';
import { BeachScene, FarmScene, KitchenScene, SchoolScene } from './KomikScenesBaru';
import {
  chipState,
  komikBest,
  LEVELS,
  missionsDone,
  nextHiddenObj,
  placedCount,
  rejectLine,
  resultFor,
  SAY,
  type KLevel,
  type KObj,
  type KResult,
  type KState,
  type KTarget,
} from './komikData';
import { aturSuara, bicara, siapkanSuara, stopBicara, suaraAktif, suaraTersedia, type Vokal } from './komikSuara';

const GAME = `${MODE_BASE.student}/game`;
const heroWho = (h: string): Who => (h === 'cewek' ? 'girl' : 'boy');
/** Suasana pemandu -> jenis suara gibberish. Suasana biasa (bicara, menunjuk) = celoteh pendek tanpa gelembung suara. */
const VOX: Partial<Record<Mood, Vokal>> = { wave: 'sapa', happy: 'senang', excited: 'senang', surprised: 'terkejut', confused: 'bingung', think: 'bingung', sad: 'kecewa' };

function Stars3({ count, size = 20 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${count} dari 3 bintang`}>
      {[0, 1, 2].map((i) => (
        <Icon key={i} name="star" size={size} className={i < count ? 'fill-kuning-500' : 'text-tinta/25'} />
      ))}
    </span>
  );
}

function Speaker({ on = true, size = 22 }: { on?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
    </svg>
  );
}

function ObjIcon({ o, dim }: { o: KObj; dim?: boolean }) {
  return (
    <svg viewBox="-24 -24 48 48" width={38} height={38} aria-hidden className={dim ? 'opacity-35 grayscale' : undefined}>
      <ObjArt o={o} s={1.15} />
    </svg>
  );
}

/* ───────────────────────── Menu ───────────────────────── */

export function KomikPintar() {
  const p = useProgress();
  const [hero, setHero] = useState<string>(p.komikHero ?? '');
  const [suara, setSuara] = useState(suaraAktif());
  const [level, setLevel] = useState<KLevel | null>(null);

  if (level && hero) {
    return <Play key={level.id} hero={hero} level={level} onExit={() => setLevel(null)} />;
  }
  return (
    <Page>
      <PageHeader title="Komik Pintar" subtitle="Cari benda tersembunyi, seret ke tempatnya, dan bantu pemandu sebelum waktu habis." icon="search" />

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Pilih karakter</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['cowok', 'cewek'] as const).map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={hero === h}
              onClick={() => setHero(h)}
              className={cn('stiker flex flex-col items-center rounded-3xl p-3 transition active:translate-y-1 active:shadow-none', hero === h ? 'bg-hijau-100 ring-4 ring-aksen' : 'bg-gading')}
            >
              <Chibi who={heroWho(h)} mood={hero === h ? 'wave' : 'idle'} size={104} />
              <span className="font-display text-lg font-semibold">{h === 'cowok' ? 'Cowok' : 'Cewek'}</span>
            </button>
          ))}
        </div>
      </section>

      {suaraTersedia() ? (
        <CheckRow
          checked={suara}
          onChange={(v) => {
            setSuara(v);
            aturSuara(v);
            if (v) {
              siapkanSuara();
              bicara('sapa', 'guide', { paksa: true });
            }
          }}
        >
          Suara karakter: celoteh lucu ("Hiii-buup!")
        </CheckRow>
      ) : (
        <Card tone="catatan">
          <p>Perangkat ini tidak bisa memutar suara. Dialog tetap tampil sebagai teks.</p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Pilih level</h2>
        {LEVELS.map((l, i) => {
          const stars = p.komik?.[l.id] ?? 0;
          const open = i === 0 || (p.komik?.[LEVELS[i - 1].id] ?? 0) > 0;
          const best = (p.gameBest[l.bestKey] ?? 0) % 1000;
          return (
            <Card key={l.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl">Level {i + 1}: {l.title}</h3>
                <Badge tone="kuning">{l.seconds} detik</Badge>
              </div>
              <p className="text-tinta/85">{l.desc}</p>
              <p className="flex items-center gap-2 text-sm font-bold text-aksen-tua">
                <Stars3 count={stars} size={18} />
                {best > 0 && <span>Skor terbaik {best}</span>}
              </p>
              <Button
                size="lg"
                block
                disabled={!hero || !open}
                onClick={() => {
                  siapkanSuara();
                  progressActions.setKomikHero(hero);
                  setLevel(l);
                }}
              >
                <Icon name={open ? 'play' : 'lock'} size={22} /> {!open ? 'Selesaikan level sebelumnya' : hero ? 'Mulai main' : 'Pilih karakter dulu'}
              </Button>
            </Card>
          );
        })}
      </section>
      <ButtonLink to={GAME} variant="sekunder" block>
        Kembali ke Permainan
      </ButtonLink>
    </Page>
  );
}

/* ───────────────────────── Permainan ───────────────────────── */

type Phase = 'cerita' | 'main' | 'selesai' | 'gagal';
interface Drag {
  id: string;
  x: number;
  y: number;
  sx: number;
  sy: number;
  moved: boolean;
}
interface Fx {
  key: number;
  x: number;
  y: number;
  kind: 'ok' | 'miss' | 'fly';
}
/** Jari menutupi benda yang diseret; bayangan dan titik lepas diangkat sedikit ke atas jari. */
const LIFT = 38;

function Play({ hero, level, onExit }: { hero: string; level: KLevel; onExit: () => void }) {
  const L = level;
  const confirm = useConfirm();
  const playedBefore = (useProgress().komik?.[L.id] ?? 0) > 0;
  /** XP hanya pada penyelesaian pertama; ref ini berubah jadi false setelah kemenangan tercatat (juga untuk "Main lagi"). */
  const firstRef = useRef(!playedBefore);
  const [phase, setPhase] = useState<Phase>('cerita');
  const [intro, setIntro] = useState(0);
  const [st, setSt] = useState<KState>({ found: [], placed: {} });
  const [left, setLeft] = useState<number>(L.seconds);
  const [paused, setPaused] = useState(false);
  const [helps, setHelps] = useState(0);
  const [bubble, setBubble] = useState<{ text: string }>({ text: L.intro[0].text });
  const [guideMood, setGuideMood] = useState<Mood>(L.intro[0].mood);
  const [heroMood, setHeroMood] = useState<Mood>('idle');
  const [vox, setVox] = useState<{ text: string; key: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [fx, setFx] = useState<Fx[]>([]);
  const [ping, setPing] = useState<string | null>(null);
  const [shakeObj, setShakeObj] = useState<{ id: string; n: number } | null>(null);
  const [result, setResult] = useState<KResult | null>(null);
  const [suara, setSuara] = useState(suaraAktif());

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const idle = useRef(0);
  const hintStage = useRef(0);
  const misses = useRef(0);
  const urgentSaid = useRef(false);
  const finished = useRef(false);
  const lastVox = useRef(Date.now());
  const lastSay = useRef<{ v: Vokal; kata: number }>({ v: 'sapa', kata: 6 });
  const timers = useRef<number[]>([]);
  const stRef = useRef(st);
  stRef.current = st;
  const leftRef = useRef(left);
  leftRef.current = left;
  const helpsRef = useRef(helps);
  helpsRef.current = helps;
  const who = heroWho(hero);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      stopBicara();
    },
    [],
  );

  /** Pemandu berbicara: gelembung teks + suara gibberish sesuai suasana (+ gelembung suara kecil bila ada). */
  const say = useCallback(
    (text: string, mood: Mood = 'talk', vokal?: Vokal) => {
      setBubble({ text });
      setGuideMood(mood);
      const v = vokal ?? VOX[mood] ?? 'bicara';
      const kata = text.split(' ').length;
      lastSay.current = { v, kata };
      const pop = bicara(v, 'guide', { kata });
      if (pop) setVox({ text: pop, key: Date.now() + Math.random() });
      lastVox.current = Date.now();
      later(() => setGuideMood((m) => (m === mood ? 'idle' : m)), 3200);
    },
    [later],
  );
  const reactHero = useCallback(
    (mood: Mood, ms = 1800) => {
      setHeroMood(mood);
      later(() => setHeroMood((m) => (m === mood ? 'idle' : m)), ms);
    },
    [later],
  );
  const addFx = useCallback(
    (x: number, y: number, kind: Fx['kind']) => {
      const key = Date.now() + Math.random();
      setFx((f) => [...f, { key, x, y, kind }]);
      later(() => setFx((f) => f.filter((e) => e.key !== key)), kind === 'fly' ? 1200 : 700);
    },
    [later],
  );
  const progress = useCallback(() => {
    idle.current = 0;
    hintStage.current = 0;
  }, []);

  /* cerita pembuka */
  useEffect(() => {
    if (phase === 'cerita') {
      const line = L.intro[intro];
      setBubble({ text: line.text });
      setGuideMood(line.mood);
      const v: Vokal = intro === 0 ? 'sapa' : VOX[line.mood] ?? 'bicara';
      const pop = bicara(v, 'guide', { kata: line.text.split(' ').length });
      if (pop) setVox({ text: pop, key: Date.now() });
      lastSay.current = { v, kata: line.text.split(' ').length };
      lastVox.current = Date.now();
    }
  }, [phase, intro, L]);

  function start() {
    finished.current = false;
    urgentSaid.current = false;
    misses.current = 0;
    progress();
    setSt({ found: [], placed: {} });
    setLeft(L.seconds);
    setHelps(0);
    setSelected(null);
    setResult(null);
    setPaused(false);
    setPhase('main');
    setHeroMood('idle');
    say(SAY.start(), 'excited');
  }

  /* waktu berjalan */
  useEffect(() => {
    if (phase !== 'main' || paused) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1, (now - last) / 1000);
      last = now;
      idle.current += dt;
      setLeft((v) => Math.max(0, v - dt));
    }, 200);
    return () => window.clearInterval(id);
  }, [phase, paused]);

  /* gumaman kecil saat karakter diam lama (idle vocal), jarang agar tidak mengganggu */
  useEffect(() => {
    if (phase !== 'main' || paused) return;
    const id = window.setInterval(() => {
      if (Date.now() - lastVox.current > 9000) {
        lastVox.current = Date.now();
        const t = bicara('idle', 'guide');
        if (t) setVox({ text: t, key: Date.now() });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, paused]);

  /* aplikasi disembunyikan = jeda (waktu tidak jalan diam-diam) */
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        setPaused(true);
        stopBicara();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  const finish = useCallback(
    (done: boolean) => {
      if (finished.current) return;
      finished.current = true;
      const r = resultFor(L, stRef.current, leftRef.current, helpsRef.current, done, firstRef.current);
      setResult(r);
      setSelected(null);
      setDrag(null);
      dragRef.current = null;
      setPhase(done ? 'selesai' : 'gagal');
      if (done) {
        progressActions.recordKomik(L.id, r.stars, L.bestKey, komikBest(r.stars, r.score), r.gained, r.coins);
        firstRef.current = false;
        setHeroMood('excited');
        say(L.win, 'excited', 'berhasil');
        later(() => {
          const pop = bicara('berhasil', who);
          if (pop) setVox({ text: pop, key: Date.now() });
        }, 650);
      } else {
        setHeroMood('sad');
        say(SAY.lose(), 'sad', 'kecewa');
      }
    },
    [L, say, later, who],
  );

  const secLeft = Math.ceil(left);
  useEffect(() => {
    if (phase !== 'main') return;
    if (left <= 0) finish(false);
  }, [left, phase, finish]);

  /* peringatan waktu hampir habis dan petunjuk bertahap saat lama tidak ada kemajuan */
  useEffect(() => {
    if (phase !== 'main' || paused) return;
    if (secLeft <= 20 && secLeft > 0 && !urgentSaid.current) {
      urgentSaid.current = true;
      say(SAY.urgent(), 'surprised');
      return;
    }
    const cur = stRef.current;
    const hidden = nextHiddenObj(L, cur);
    const ready = L.objs.find((o) => chipState(cur, o) === 'siap');
    if (idle.current >= 28 && hintStage.current < 2) {
      hintStage.current = 2;
      if (ready) say(ready.placeHint, 'point');
      else if (hidden) say(hidden.hints[1], 'point');
    } else if (idle.current >= 14 && hintStage.current < 1) {
      hintStage.current = 1;
      if (ready) say(ready.placeHint, 'think');
      else if (hidden) say(hidden.hints[0], 'think');
    }
  }, [secLeft, phase, paused, say, L]);

  /* menang bila semua misi selesai */
  useEffect(() => {
    if (phase === 'main' && missionsDone(L, st).every(Boolean)) {
      const t = window.setTimeout(() => finish(true), 900);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [st, phase, finish, L]);

  /* ───── interaksi ───── */

  const active = phase === 'main' && !paused;

  function tapObj(o: KObj) {
    if (!active || st.found.includes(o.id)) return;
    const next: KState = { ...st, found: [...st.found, o.id] };
    setSt(next);
    progress();
    misses.current = 0;
    addFx(o.x, o.y, o.kind === 'butterfly' ? 'fly' : 'ok');
    reactHero('happy');
    const extra = L.afterFound?.(o, next);
    if (extra) say(extra, 'happy');
    else if (o.kind === 'butterfly') say(SAY.foundButterfly(), 'excited');
    else say(SAY.found(o.name), 'happy');
  }

  function tapMiss(e: ReactMouseEvent<SVGSVGElement>) {
    if (!active) return;
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return;
    addFx((e.clientX - ctm.e) / ctm.a, (e.clientY - ctm.f) / ctm.d, 'miss');
    misses.current += 1;
    if (misses.current % 6 === 0) say(SAY.missMany(), 'think');
    else if (misses.current % 3 === 0) say(SAY.missTap(), 'confused');
  }

  function tryDrop(objId: string, t: KTarget) {
    const o = L.objs.find((x) => x.id === objId);
    if (!o || !active) return;
    const room = (st.placed[t.id]?.length ?? 0) < t.cap;
    if (t.accepts.includes(objId) && room) {
      setSt((s) => ({ ...s, placed: { ...s.placed, [t.id]: [...(s.placed[t.id] ?? []), objId] } }));
      progress();
      addFx(t.x, t.y - 20, 'ok');
      reactHero('happy');
      if (t.kind === 'plant') say(SAY.watered(), 'excited');
      else if (t.kind === 'wardrobe') say(SAY.unlocked(), 'excited');
      else say(SAY.placed(o.name), 'happy');
    } else {
      setShakeObj({ id: objId, n: Date.now() });
      say(rejectLine(o, t), 'think');
      reactHero('confused');
    }
  }
  const dropRef = useRef(tryDrop);
  dropRef.current = tryDrop;

  function targetAt(cx: number, cy: number): KTarget | undefined {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return undefined;
    let best: KTarget | undefined;
    let bestD = Infinity;
    for (const t of L.targets) {
      const d = Math.hypot(cx - (ctm.a * t.x + ctm.e), cy - (ctm.d * t.y + ctm.f));
      if (d <= ctm.a * (t.r + 8) && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    return best;
  }
  const targetAtRef = useRef(targetAt);
  targetAtRef.current = targetAt;

  const unbindDrag = useRef<(() => void) | null>(null);
  useEffect(() => () => unbindDrag.current?.(), []);
  /** Pendengar dipasang SEKARANG (bukan lewat efek) agar ketukan singkat tidak terlewat sebelum pendengar terpasang. */
  function startDrag(e: ReactPointerEvent, id: string) {
    if (!active) return;
    unbindDrag.current?.();
    const d: Drag = { id, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
    dragRef.current = d;
    setDrag(d);
    const move = (ev: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      const nd = { ...cur, x: ev.clientX, y: ev.clientY, moved: cur.moved || Math.hypot(ev.clientX - cur.sx, ev.clientY - cur.sy) > 10 };
      dragRef.current = nd;
      setDrag(nd);
    };
    const end = (ev: PointerEvent, cancelled: boolean) => {
      unbindDrag.current?.();
      const cur = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!cur) return;
      if (!cur.moved) {
        setSelected((s) => (s === cur.id ? null : cur.id));
      } else if (!cancelled) {
        const t = targetAtRef.current(ev.clientX, ev.clientY - LIFT);
        if (t) dropRef.current(cur.id, t);
      }
    };
    const up = (ev: PointerEvent) => end(ev, false);
    const cancel = (ev: PointerEvent) => end(ev, true);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    unbindDrag.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      unbindDrag.current = null;
    };
  }

  function tapTarget(t: KTarget) {
    if (!active) return;
    if (selected) {
      const id = selected;
      setSelected(null);
      tryDrop(id, t);
    }
  }

  function help() {
    if (!active) return;
    setHelps((h) => h + 1);
    const hidden = nextHiddenObj(L, st);
    const ready = L.objs.find((o) => chipState(st, o) === 'siap');
    if (ready) {
      say(ready.placeHint, 'point');
    } else if (hidden) {
      say(hidden.hints[1], 'point');
      setPing(hidden.id);
      later(() => setPing(null), 2600);
    }
  }

  async function exit() {
    const wasPaused = paused;
    setPaused(true);
    const ok = await confirm({ title: 'Keluar dari permainan?', message: 'Kemajuan level ini belum disimpan.', confirmLabel: 'Keluar', cancelLabel: 'Lanjut main', danger: true });
    if (ok) onExit();
    else setPaused(wasPaused);
  }

  const done = missionsDone(L, st);
  const doneCount = done.filter(Boolean).length;
  const curMission = L.missions[done.findIndex((d) => !d)]?.text ?? 'Semua misi selesai!';
  const ended = phase === 'selesai' || phase === 'gagal';
  const urgent = phase === 'main' && secLeft <= 20;
  const sceneProps = {
    objs: L.objs,
    hidden: (id: string) => !st.found.includes(id),
    placed: st.placed,
    chars: (
      <>
        <Chibi who="guide" mood={guideMood} x={0} y={262} size={102} label="Pemandu hijau" />
        <Chibi who={who} mood={heroMood} x={258} y={286} size={94} label="Pemain" />
        {vox && (
          <text key={vox.key} className="km-vox" x={52} y={268} textAnchor="middle" fontSize={17} fontWeight={800} fill="#fff" stroke="#33432F" strokeWidth={4} paintOrder="stroke" strokeLinejoin="round" aria-hidden>
            {vox.text}
          </text>
        )}
      </>
    ),
  };

  return (
    <div className="mx-auto w-full max-w-md select-none space-y-3 px-3 py-3" style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      {/* atas */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => void exit()} aria-label="Keluar" className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none">
          <Icon name="close" size={22} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate font-display text-lg font-semibold leading-tight">{L.title}</p>
          <p className="text-sm text-tinta/75">Misi {doneCount}/{L.missions.length}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSuara(!suara);
            aturSuara(!suara);
          }}
          aria-label={suara ? 'Matikan suara karakter' : 'Nyalakan suara karakter'}
          aria-pressed={suara}
          className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none"
        >
          <Speaker on={suara} />
        </button>
        <button
          type="button"
          disabled={phase !== 'main'}
          onClick={() => {
            setPaused(true);
            stopBicara();
          }}
          aria-label="Jeda"
          className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kuning-300 active:translate-y-1 active:shadow-none disabled:opacity-40"
        >
          <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden><rect x={4} y={3} width={4} height={14} rx={1.5} fill="#2A3328" /><rect x={12} y={3} width={4} height={14} rx={1.5} fill="#2A3328" /></svg>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Icon name="clock" size={22} className={urgent ? 'text-merah-600' : ''} />
        <div className="flex-1"><ProgressBar value={left} max={L.seconds} label="Sisa waktu" /></div>
        <span className={cn('w-12 text-right font-display text-xl font-semibold tabular-nums', urgent && 'text-merah-600')} role="timer" aria-label={`Sisa ${secLeft} detik`}>{secLeft}</span>
      </div>

      {/* adegan */}
      <div className="stiker relative overflow-hidden rounded-3xl bg-langit-100" style={{ touchAction: 'manipulation' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
          className="block h-auto w-full select-none"
          role="img"
          aria-label="Ilustrasi komik. Ketuk benda yang tersembunyi untuk menemukannya."
          onClick={tapMiss}
        >
          {L.scene === 'taman' ? <GardenScene {...sceneProps} /> : L.scene === 'dapur' ? <KitchenScene {...sceneProps} /> : L.scene === 'kelas' ? <SchoolScene {...sceneProps} /> : L.scene === 'pantai' ? <BeachScene {...sceneProps} /> : L.scene === 'kebun' ? <FarmScene {...sceneProps} /> : <RoomScene {...sceneProps} />}

          {/* sasaran seret-letak */}
          {phase === 'main' &&
            L.targets.map((t) => (
              <g key={t.id}>
                {(selected || drag?.moved) && <circle cx={t.x} cy={t.y} r={t.r} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="6 5" opacity={0.95} />}
                <circle cx={t.x} cy={t.y} r={t.r} fill="#000" fillOpacity={0} onClick={(e) => { e.stopPropagation(); tapTarget(t); }} />
              </g>
            ))}
          {/* area ketuk benda tersembunyi (di atas segalanya) */}
          {phase === 'main' &&
            L.objs.map((o) =>
              st.found.includes(o.id) ? null : (
                <g key={o.id}>
                  {ping === o.id && <circle className="km-ping" cx={o.x} cy={o.y} r={24} fill="none" stroke="#FFD84D" strokeWidth={4} />}
                  <circle cx={o.x} cy={o.y} r={22} fill="#000" fillOpacity={0} onClick={(e) => { e.stopPropagation(); tapObj(o); }} />
                </g>
              ),
            )}
          {fx.map((f) =>
            f.kind === 'fly' ? (
              <g key={f.key} className="km-fly"><ObjArt o={L.objs.find((o) => o.kind === 'butterfly') ?? L.objs[0]} x={f.x} y={f.y} /></g>
            ) : (
              <circle key={f.key} className="km-pop" cx={f.x} cy={f.y} r={f.kind === 'ok' ? 20 : 9} fill={f.kind === 'ok' ? '#FFD84D' : 'none'} stroke="#fff" strokeWidth={3} opacity={f.kind === 'ok' ? 0.9 : 0.8} />
            ),
          )}
        </svg>

        {/* dialog pemandu: di bagian atas adegan, tidak menutupi benda penting */}
        <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-start gap-2">
          <div className="pointer-events-auto flex-1 rounded-2xl border-2 border-tinta bg-white px-3 py-2 text-[15px] font-semibold leading-snug shadow-stiker" role="status" aria-live="polite">
            {bubble.text}
            {phase === 'cerita' && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <button type="button" onClick={start} className="min-h-[44px] px-2 text-sm font-bold text-aksen-tua underline">Lewati cerita</button>
                <Button size="md" onClick={() => (intro + 1 < L.intro.length ? setIntro(intro + 1) : start())}>
                  {intro + 1 < L.intro.length ? 'Lanjut' : 'Mulai!'}
                </Button>
              </div>
            )}
          </div>
          {suaraTersedia() && (
            <button
              type="button"
              onClick={() => {
                const pop = bicara(lastSay.current.v, 'guide', { paksa: true, kata: lastSay.current.kata });
                if (pop) setVox({ text: pop, key: Date.now() });
              }}
              aria-label="Putar suara karakter lagi"
              className="pointer-events-auto stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none"
            >
              <Speaker />
            </button>
          )}
        </div>

        {paused && phase === 'main' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gading p-6 text-center">
            <p className="font-display text-2xl font-semibold">Jeda</p>
            <p>{SAY.paused()}</p>
            <Button size="lg" onClick={() => setPaused(false)}><Icon name="play" size={22} /> Lanjut main</Button>
            <Button variant="sekunder" onClick={() => void exit()}>Keluar</Button>
          </div>
        )}
      </div>

      {/* bawah: daftar benda, misi, bantuan */}
      {!ended ? (
        <Card className="space-y-3 !p-3">
          <ul className="grid grid-cols-5 gap-1.5" aria-label="Daftar benda yang dicari">
            {L.objs.map((o) => {
              const s = chipState(st, o);
              const draggable = s === 'siap' && active;
              const isDragging = drag?.id === o.id && drag.moved;
              return (
                <li key={shakeObj?.id === o.id ? `${o.id}-${shakeObj.n}` : o.id}>
                  <div
                    role={draggable ? 'button' : undefined}
                    tabIndex={draggable ? 0 : undefined}
                    aria-pressed={draggable ? selected === o.id : undefined}
                    aria-label={`${o.name}: ${s === 'tersembunyi' ? 'belum ditemukan' : s === 'siap' ? 'seret ke tempatnya atau ketuk lalu ketuk tempatnya' : 'selesai'}`}
                    onPointerDown={draggable ? (e) => startDrag(e, o.id) : undefined}
                    onKeyDown={draggable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(selected === o.id ? null : o.id); } } : undefined}
                    onDragStart={(e) => e.preventDefault()}
                    onMouseDown={draggable ? (e) => e.preventDefault() : undefined}
                    style={{ touchAction: draggable ? 'none' : undefined, WebkitUserSelect: 'none', userSelect: 'none' }}
                    className={cn(
                      'relative flex min-h-[72px] flex-col items-center justify-center rounded-2xl border-2 px-0.5 py-1 text-center',
                      s === 'siap' ? 'cursor-grab border-tinta bg-kuning-100' : 'border-tinta/30 bg-white',
                      selected === o.id && 'ring-4 ring-aksen',
                      isDragging && 'opacity-30',
                      shakeObj?.id === o.id && 'km-shake',
                    )}
                  >
                    <ObjIcon o={o} dim={s === 'tersembunyi'} />
                    <span className={cn('text-[11px] font-bold leading-tight', s === 'tersembunyi' && 'text-tinta/55')}>{o.label}</span>
                    {s === 'selesai' && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-tinta bg-hijau-500 text-white"><Icon name="check" size={12} /></span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">Misi: {curMission}</p>
            <Button variant="aksi" onClick={help} disabled={!active || phase !== 'main'}>
              <Icon name="bulb" size={20} /> Bantuan
            </Button>
          </div>
          {helps > 0 && <p className="text-xs text-tinta/70">Bantuan dipakai {helps}×. Bantuan mengurangi skor dan peluang bintang 3.</p>}
        </Card>
      ) : (
        result && <ResultCard r={result} win={phase === 'selesai'} found={st.found.length} totalObjs={L.objs.length} placed={placedCount(st)} missions={doneCount} totalMissions={L.missions.length} left={Math.ceil(left)} onAgain={start} />
      )}

      {drag?.moved && (
        <div className="pointer-events-none fixed z-50" style={{ left: drag.x - 32, top: drag.y - LIFT - 32, width: 64, height: 64 }}>
          <svg viewBox="-24 -24 48 48" width={64} height={64} aria-hidden>
            {(() => {
              const o = L.objs.find((x) => x.id === drag.id);
              return o ? <ObjArt o={o} s={1.5} /> : null;
            })()}
          </svg>
        </div>
      )}
    </div>
  );
}

function ResultCard({ r, win, found, totalObjs, placed, missions, totalMissions, left, onAgain }: { r: KResult; win: boolean; found: number; totalObjs: number; placed: number; missions: number; totalMissions: number; left: number; onAgain: () => void }): ReactNode {
  return (
    <Card tone={win ? 'hijau' : 'catatan'} className="space-y-3 text-center">
      <h2 className="text-2xl">{win ? 'Level selesai!' : 'Waktu habis'}</h2>
      {win && <div className="flex justify-center"><Stars3 count={r.stars} size={34} /></div>}
      <dl className="grid grid-cols-2 gap-2 text-left">
        <div className="rounded-2xl border-2 border-tinta bg-white p-2"><dt className="text-xs text-tinta/70">Skor</dt><dd className="font-display text-xl font-semibold">{r.score}</dd></div>
        <div className="rounded-2xl border-2 border-tinta bg-white p-2"><dt className="text-xs text-tinta/70">Sisa waktu</dt><dd className="font-display text-xl font-semibold">{win ? `${left} dtk` : '0 dtk'}</dd></div>
        <div className="rounded-2xl border-2 border-tinta bg-white p-2"><dt className="text-xs text-tinta/70">Benda ditemukan</dt><dd className="font-display text-xl font-semibold">{found}/{totalObjs}</dd></div>
        <div className="rounded-2xl border-2 border-tinta bg-white p-2"><dt className="text-xs text-tinta/70">Misi berhasil</dt><dd className="font-display text-xl font-semibold">{missions}/{totalMissions}</dd></div>
      </dl>
      <p className="text-sm text-tinta/75">Benda diletakkan: {placed}</p>
      {win ? (
        <p className="font-semibold">
          Koin +{r.coins} · {r.gained > 0 ? `XP +${r.gained}` : 'XP hanya untuk penyelesaian pertama'}
        </p>
      ) : (
        <p>Tidak apa-apa. Coba lagi, kamu pasti bisa!</p>
      )}
      <div className="grid gap-2">
        <Button size="lg" block onClick={onAgain}>{win ? 'Main lagi' : 'Coba lagi'}</Button>
        <ButtonLink to={GAME} variant="sekunder" block>Kembali ke Permainan</ButtonLink>
      </div>
    </Card>
  );
}
