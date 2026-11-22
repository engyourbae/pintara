import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, ButtonLink, Card, Icon, Mascot, Page, PageHeader, ProgressBar, useConfirm } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { progressActions, useProgress } from '@/hooks/useProgress';
import { cn } from '@/utils/cn';
import { buildDoc, compose, previousOutputs, type Ln } from './kodeCompose';
import { KODE_TOTAL, TRACKS, type KLesson, type SqlTable } from './kodeData';

const GAME = `${MODE_BASE.student}/game`;
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
/** Papan ketik ponsel sering mengubah tanda kutip jadi lengkung; samakan dulu. */
const norm = (s: string) => s.replace(/[‘’`´]/g, "'").replace(/[“”]/g, '"');
/** Indeks karakter pertama yang salah, atau -1 bila awalan masih benar. */
function firstBad(typed: string, target: string): number {
  for (let i = 0; i < typed.length; i++) if (typed[i] !== target[i]) return i;
  return -1;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${count} dari 3 bintang`}>
      {[0, 1, 2].map((i) => (
        <Icon key={i} name="star" size={18} className={i < count ? 'fill-kuning-500' : 'text-tinta/25'} />
      ))}
    </span>
  );
}

/* ───────────────────────── Layar hasil ───────────────────────── */

function SqlTableView({ t, tone }: { t: SqlTable; tone?: 'hasil' }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-left font-mono text-sm', tone === 'hasil' && 'bg-hijau-50')}>
        <caption className="pb-1 text-left font-display font-semibold">Tabel {t.name}</caption>
        <thead>
          <tr>
            {t.cols.map((c) => (
              <th key={c} className="border-2 border-tinta bg-kuning-100 px-2 py-1">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.length === 0 && (
            <tr>
              <td colSpan={t.cols.length} className="border-2 border-tinta px-2 py-1 text-tinta/70">
                (kosong)
              </td>
            </tr>
          )}
          {t.rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j} className="border-2 border-tinta px-2 py-1">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TermScreen({ ti, li, shown, done }: { ti: number; li: number; shown: string[]; done: boolean }) {
  const track = TRACKS[ti];
  const lesson = track.lessons[li];
  const hist = previousOutputs(ti, li);
  let text: string;
  if (track.id === 'py') {
    text = [...hist.map((h) => h.out), done ? lesson.out ?? '' : ''].filter(Boolean).join('\n');
    if (!text) text = '(belum ada keluaran)';
  } else {
    const parts = hist.map((h) => [...h.cmds.map((c) => '$ ' + c), h.out].join('\n'));
    parts.push([...shown.map((c) => '$ ' + c), done ? lesson.out ?? '' : ''].filter(Boolean).join('\n'));
    text = parts.filter(Boolean).join('\n');
  }
  return (
    <div className="space-y-2">
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl border-2 border-tinta bg-tinta p-3 font-mono text-sm text-gading">{text}</pre>
      {!done && <p className="font-bold text-tinta/70">Keluaran pelajaran ini muncul setelah semua baris selesai kamu ketik.</p>}
      <p className="text-sm text-tinta/70">Keluaran ini simulasi untuk belajar.</p>
    </div>
  );
}

function SqlScreen({ lesson, done }: { lesson: KLesson; done: boolean }) {
  const s = lesson.sql;
  if (!s) return null;
  return (
    <div className="space-y-3">
      {s.before.map((t) => (
        <SqlTableView key={t.name} t={t} />
      ))}
      {done ? (
        <div className="space-y-1">
          <p className="font-bold text-hijau-700">Hasil: {s.caption}</p>
          <SqlTableView t={s.result} tone="hasil" />
        </div>
      ) : (
        <p className="font-bold text-tinta/70">Hasil muncul setelah semua baris selesai kamu ketik.</p>
      )}
      <p className="text-sm text-tinta/70">Ini simulasi untuk belajar, bukan database sungguhan.</p>
    </div>
  );
}

/** Seluruh berkas: pelengkap redup, baris pelajaran ini menyala. */
function KodeView({ ti, li, shown, indent, onPick }: { ti: number; li: number; shown: string[]; indent: number[]; onPick: (x: Ln) => void }) {
  const c = compose(ti, li);
  const rows = [
    ...c.before.map((x) => ({ ...x, cur: false })),
    ...shown.map((t, k) => ({ ...(c.lesson.lines.find((l) => l.c === t) ?? { r: undefined, w: undefined }), t, i: (indent[k] ?? 0) + c.ind, cur: true })),
    ...c.after.map((x) => ({ ...x, cur: false })),
  ];
  return (
    <ol aria-label="Kode lengkap" className="overflow-x-auto rounded-xl border-2 border-tinta bg-tinta p-3 font-mono text-sm">
      {rows.map((r, k) => (
        <li key={k}>
          <button
            type="button"
            onClick={() => onPick({ t: r.t, i: r.i, r: r.r, w: r.w })}
            className={cn('flex min-h-8 w-full gap-3 whitespace-pre rounded px-1 text-left', r.cur ? 'bg-kuning-300/25 font-bold text-gading' : 'text-gading/45')}
          >
            <span className="w-6 shrink-0 text-right opacity-60">{k + 1}</span>
            <span style={{ paddingLeft: `${r.i * 2}ch` }}>{r.t}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Layar({ ti, li, shown, indent, done }: { ti: number; li: number; shown: string[]; indent: number[]; done: boolean }) {
  const track = TRACKS[ti];
  const lesson = track.lessons[li];
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'hasil' | 'kode'>('hasil');
  const [sel, setSel] = useState<Ln | null>(null);
  const isTerm = track.id === 'py' || track.id === 'git';
  const textual = isTerm || track.id === 'sql';
  const doc = useMemo(() => (textual ? '' : buildDoc(ti, li, shown)), [textual, ti, li, shown]);
  const title = /<title>(.*?)<\/title>/.exec(doc)?.[1];
  const text = isTerm ? <TermScreen ti={ti} li={li} shown={shown} done={done} /> : <SqlScreen lesson={lesson} done={done} />;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const frame = (big: boolean) => (
    <iframe
      title="Layar hasil proyek"
      sandbox="allow-scripts allow-forms"
      srcDoc={doc}
      className={cn('w-full rounded-xl border-2 border-tinta bg-white', big ? 'h-full min-h-[320px]' : 'pointer-events-none h-36')}
      tabIndex={big ? 0 : -1}
    />
  );

  return (
    <>
      <div className="stiker overflow-hidden rounded-3xl bg-gading">
        <button
          type="button"
          onClick={() => {
            setTab('hasil');
            setSel(null);
            setOpen(true);
          }}
          className="flex min-h-12 w-full items-center justify-between gap-2 border-b-2 border-tinta bg-langit-100 px-4 py-2 text-left font-display font-semibold"
        >
          <span className="flex items-center gap-2">
            <Icon name="eye" size={22} /> Layar hasil
          </span>
          <span className="text-sm font-bold text-langit-700">Ketuk: hasil dan kode</span>
        </button>
        {title && <p className="border-b-2 border-tinta/20 px-4 py-1 text-sm">Judul tab: <strong>{title}</strong></p>}
        <div className="max-h-48 overflow-hidden p-2">{textual ? text : frame(false)}</div>
      </div>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Layar hasil dan kode" className="fixed inset-0 z-50 flex flex-col gap-3 bg-tinta/60 p-3">
          <div className="stiker flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded-3xl bg-gading p-3">
            <div className="flex items-center justify-between gap-2">
              <div role="tablist" aria-label="Pilih tampilan" className="flex gap-2">
                {(['hasil', 'kode'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={tab === k}
                    onClick={() => setTab(k)}
                    className={cn('stiker min-h-12 rounded-2xl px-4 font-display font-semibold', tab === k ? 'bg-kuning-300' : 'bg-gading')}
                  >
                    {k === 'hasil' ? 'Hasil' : 'Kode'}
                  </button>
                ))}
              </div>
              <Button variant="sekunder" onClick={() => setOpen(false)} aria-label="Tutup layar hasil">
                <Icon name="close" size={20} /> Tutup
              </Button>
            </div>
            {tab === 'kode' && (
              <p className="text-sm text-tinta/80">Ketuk baris mana pun untuk membaca kenapa baris itu ada di situ.</p>
            )}
            {tab === 'kode' && sel && (
              <Card tone="langit" aria-live="polite">
                <p>
                  <code className="break-all font-mono font-bold">{sel.t}</code>
                  {sel.r ? <span className="font-bold"> ({sel.r})</span> : null}
                </p>
                <p>{sel.w ?? 'Baris ini bagian dari kerangka.'}</p>
              </Card>
            )}
            {tab === 'kode' ? <KodeView ti={ti} li={li} shown={shown} indent={indent} onPick={setSel} /> : textual ? text : <div className="min-h-0 flex-1">{frame(true)}</div>}
          </div>
        </div>
      )}
    </>
  );
}

/** Kode pelajaran sebelumnya sebagai pelengkap: redup, tidak bisa diklik. */
function CtxBlock({ lines, start, label, onPick }: { lines: Ln[]; start: number; label: string; onPick: (x: Ln) => void }) {
  const [open, setOpen] = useState(lines.length <= 4);
  if (lines.length === 0) return null;
  return (
    <div className="rounded-xl bg-black/20 px-2 py-1">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-10 w-full items-center justify-between gap-2 text-left text-sm font-bold text-gading/80">
        <span>
          {label} ({lines.length} baris)
        </span>
        <span>{open ? 'Tutup' : 'Buka'}</span>
      </button>
      {open && (
        <ol className="font-mono text-xs text-gading/50">
          {lines.map((x, k) => (
            <li key={k}>
              <button type="button" onClick={() => onPick(x)} className="flex min-h-8 w-full gap-2 whitespace-pre-wrap break-all text-left">
                <span className="w-6 shrink-0 text-right opacity-70">{start + k + 1}</span>
                <span style={{ paddingLeft: `${x.i * 2}ch` }}>{x.t}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ───────────────────────── Satu pelajaran ───────────────────────── */

type Phase = 'susun' | 'ketik' | 'selesai';

interface PlayProps {
  ti: number;
  li: number;
  next: { label: string } | null;
  onExit: () => void;
  onNext: () => void;
  onAgain: () => void;
}

function LessonPlay({ ti, li, next, onExit, onNext, onAgain }: PlayProps) {
  const track = TRACKS[ti];
  const lesson = track.lessons[li];
  const cx = useMemo(() => compose(ti, li), [ti, li]);
  const p = useProgress();
  const confirm = useConfirm();
  const n = lesson.lines.length;
  const [order] = useState(() => shuffle(lesson.lines.map((_, i) => i)));
  const [slotTile, setSlotTile] = useState<(number | null)[]>(() => lesson.lines.map(() => null));
  const [pick, setPick] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('susun');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'bad' | 'info'; text: string }>({ kind: 'info', text: 'Ketuk satu kotak kode di bawah, lalu ketuk tempatnya di lembar kode.' });
  const [shake, setShake] = useState<number | null>(null);
  const [note, setNote] = useState<Ln | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [cur, setCur] = useState(0);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<{ stars: number; gained: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const curRowRef = useRef<HTMLLIElement>(null);

  const codes = slotTile.map((t) => (t === null ? '' : lesson.lines[t].c));
  const whyOf = (code: string) => lesson.lines.find((l) => l.c === code)?.w ?? '';
  const placedCount = slotTile.filter((t) => t !== null).length;
  const target = phase === 'ketik' ? codes[cur] ?? '' : '';

  const shownSlots = useMemo(() => {
    const upto = phase === 'selesai' ? n : phase === 'ketik' ? cur : n;
    return slotTile.slice(0, upto).flatMap((t, i) => (t === null ? [] : [i]));
  }, [phase, slotTile, cur, n]);
  const shown = useMemo(() => shownSlots.map((i) => lesson.lines[slotTile[i] as number].c), [shownSlots, slotTile, lesson]);
  const shownIndent = useMemo(() => shownSlots.map((i) => lesson.lines[i].i ?? 0), [shownSlots, lesson]);

  useEffect(() => {
    if (phase !== 'ketik') return;
    curRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    inputRef.current?.focus({ preventScroll: true });
  }, [phase, cur]);

  /** Kotak ini cocok bila kodenya sama, atau (untuk baris bebas urutan) kodenya masih tersisa di kelompoknya. */
  function fits(slot: number, code: string): boolean {
    const L = lesson.lines[slot];
    if (!L.g) return L.c === code;
    const idx = lesson.lines.map((_, i) => i).filter((i) => lesson.lines[i].g === L.g);
    const pool = idx.map((i) => lesson.lines[i].c);
    for (const i of idx) {
      const t = slotTile[i];
      if (t === null) continue;
      const k = pool.indexOf(lesson.lines[t].c);
      if (k >= 0) pool.splice(k, 1);
    }
    return pool.includes(code);
  }

  function place(slot: number) {
    if (phase !== 'susun') return;
    setNote(null);
    const here = slotTile[slot];
    if (here !== null) {
      setMsg({ kind: 'info', text: `${lesson.lines[here].c}: ${whyOf(lesson.lines[here].c)}` });
      return;
    }
    if (pick === null) {
      setMsg({ kind: 'info', text: `Pilih dulu satu kotak kode di bawah. Tempat ini untuk: ${lesson.lines[slot].r}.` });
      return;
    }
    const code = lesson.lines[pick].c;
    if (!fits(slot, code)) {
      setMistakes((m) => m + 1);
      setShake(slot);
      window.setTimeout(() => setShake(null), 450);
      setMsg({ kind: 'bad', text: `Belum pas. Tempat ini untuk: ${lesson.lines[slot].r}. Coba kotak lain.` });
      setPick(null);
      return;
    }
    const nextTiles = slotTile.map((t, i) => (i === slot ? pick : t));
    setSlotTile(nextTiles);
    setPick(null);
    if (nextTiles.every((t) => t !== null)) {
      setPhase('ketik');
      setMsg({ kind: 'ok', text: 'Susunannya sudah benar! Sekarang ketik tiap baris sendiri.' });
    } else {
      setMsg({ kind: 'ok', text: `Benar! ${whyOf(code)}` });
    }
  }

  function finish() {
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    const first = (p.kode?.[lesson.id] ?? 0) === 0;
    const gained = first ? 20 + stars * 5 : 0;
    const doneCount = track.lessons.filter((l) => l.id === lesson.id || (p.kode?.[l.id] ?? 0) > 0).length;
    progressActions.recordKode(lesson.id, stars, `kode-${track.id}`, doneCount, gained);
    setResult({ stars, gained });
    setPhase('selesai');
  }

  function onType(raw: string) {
    if (phase !== 'ketik') return;
    const v = norm(raw);
    if (v === target) {
      setTyped('');
      setNote(null);
      if (cur + 1 < n) setCur(cur + 1);
      else finish();
      return;
    }
    setTyped(v);
  }

  async function exit() {
    if (phase === 'selesai') return onExit();
    const ok = await confirm({ title: 'Keluar dari pelajaran?', message: 'Kemajuan pelajaran ini belum disimpan.', confirmLabel: 'Keluar', cancelLabel: 'Lanjut belajar', danger: true });
    if (ok) onExit();
  }

  if (phase === 'selesai' && result) {
    return (
      <Page className="max-w-2xl">
        <Card tone="catatan" className="flex flex-col items-center gap-4 py-8 text-center">
          <Mascot size={120} mood="hore" className="animate-melayang" />
          <h1 className="text-3xl">Pelajaran selesai!</h1>
          <Stars count={result.stars} />
          <p className="text-lg">
            {lesson.title} · salah menaruh kotak {mistakes} kali ·{' '}
            {result.gained > 0 ? <strong>+{result.gained} XP</strong> : <span>XP hanya diberikan saat pertama kali selesai</span>}
          </p>
          <p className="text-tinta/85">Kamu sudah bisa: {lesson.goal.charAt(0).toLowerCase() + lesson.goal.slice(1)}</p>
          <div className="w-full">
            <Layar ti={ti} li={li} shown={shown} indent={shownIndent} done />
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            {next && (
              <Button block onClick={onNext}>
                {next.label}
              </Button>
            )}
            <Button variant="sekunder" block onClick={onAgain}>
              Ulangi
            </Button>
            <Button variant="sekunder" block onClick={onExit} className={next ? 'sm:col-span-2' : ''}>
              Daftar pelajaran
            </Button>
          </div>
        </Card>
      </Page>
    );
  }

  const remaining = order.filter((t) => !slotTile.includes(t));

  return (
    <Page className="max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={exit}
          aria-label="Keluar dari pelajaran"
          className="stiker flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gading active:translate-y-1 active:shadow-none"
        >
          <Icon name="close" />
        </button>
        <div className="min-w-0 flex-1">
          <ProgressBar value={placedCount + (phase === 'ketik' ? cur : 0)} max={n * 2} label="Kemajuan pelajaran" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl leading-tight">{lesson.title}</h1>
        <p className="text-tinta/85">{lesson.goal}</p>
      </div>

      <Layar ti={ti} li={li} shown={shown} indent={shownIndent} done={false} />

      <Card tone="papan" className="space-y-2">
        <p className="font-display text-lg font-semibold">{phase === 'susun' ? 'Langkah 1: Susun kotak kode' : 'Langkah 2: Ketik kodenya'}</p>
        {(cx.before.length > 0 || cx.after.length > 0) && <p className="text-sm opacity-90">Baris redup adalah kode pelajaran lain sebagai pelengkap. Ketuk untuk membaca kenapa baris itu ada. Fokus ke baris bernomor yang bisa disusun dan diketik.</p>}
        <CtxBlock lines={cx.before} start={0} label="Pelengkap di atas" onPick={setNote} />
        <ol className="space-y-2" aria-label="Lembar kode">
          {lesson.lines.map((L, i) => {
            const tile = slotTile[i];
            const indent = { paddingLeft: `${((L.i ?? 0) + cx.ind) * 10}px` };
            const isCur = phase === 'ketik' && i === cur;
            const doneLine = phase === 'ketik' && i < cur;
            return (
              <li key={i} ref={isCur ? curRowRef : undefined} className="flex items-start gap-2">
                <span className="w-6 shrink-0 pt-3 text-right font-mono text-sm opacity-70">{cx.before.length + i + 1}</span>
                <div className="min-w-0 flex-1" style={indent}>
                  {phase === 'susun' && (
                    <button
                      type="button"
                      onClick={() => place(i)}
                      className={cn(
                        'flex min-h-12 w-full flex-col items-start justify-center rounded-xl border-2 px-3 py-1 text-left',
                        tile === null ? 'border-dashed border-white/60 bg-white/10 text-white' : 'border-tinta bg-hijau-100 text-tinta',
                        shake === i && 'animate-getar',
                      )}
                    >
                      {tile === null ? <span className="text-sm">{L.r}</span> : <code className="break-all font-mono text-sm font-bold">{lesson.lines[tile].c}</code>}
                    </button>
                  )}
                  {phase === 'ketik' && (
                    <div className={cn('rounded-xl border-2 px-3 py-2', isCur ? 'border-kuning-300 bg-white/15' : 'border-transparent')}>
                      {doneLine ? (
                        <button type="button" onClick={() => setNote({ t: codes[i], i: L.i ?? 0, r: L.r, w: whyOf(codes[i]) })} className="min-h-8 w-full text-left">
                          <code className="whitespace-pre-wrap break-all font-mono text-sm font-bold text-hijau-300">{codes[i]}</code>
                        </button>
                      ) : isCur ? (
                        <>
                          <code className="whitespace-pre-wrap break-all font-mono text-base" aria-label={`Ketik: ${codes[i]}`}>
                            {codes[i].split('').map((ch, k) => {
                              const t = typed[k];
                              const cls =
                                t === undefined
                                  ? cn('text-white/55', k === typed.length && 'border-b-2 border-kuning-300 text-white')
                                  : t === ch
                                    ? 'font-bold text-hijau-300'
                                    : 'bg-merah-100 font-bold text-merah-600';
                              return (
                                <span key={k} className={cls}>
                                  {ch}
                                </span>
                              );
                            })}
                          </code>
                        </>
                      ) : (
                        <code className="whitespace-pre-wrap break-all font-mono text-sm text-white/40">{codes[i]}</code>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <CtxBlock lines={cx.after} start={cx.before.length + n} label="Pelengkap di bawah" onPick={setNote} />
      </Card>

      <Card tone={msg.kind === 'bad' && !note ? 'catatan' : 'langit'} aria-live="polite" className="min-h-[72px]">
        {note ? (
          <div className="space-y-1">
            <p>
              <code className="break-all font-mono font-bold">{note.t}</code>
              {note.r ? <span className="font-bold"> ({note.r})</span> : null}
            </p>
            <p>{note.w}</p>
            <button type="button" onClick={() => setNote(null)} className="min-h-10 font-bold text-langit-700 underline">
              Tutup penjelasan
            </button>
          </div>
        ) : phase === 'ketik' ? (
          <p>
            <strong>Tentang baris {cx.before.length + cur + 1}:</strong> {whyOf(codes[cur] ?? '')}
          </p>
        ) : (
          <p className={cn(msg.kind === 'bad' && 'font-bold')}>{msg.text}</p>
        )}
      </Card>

      {phase === 'ketik' && (
        <div className="stiker sticky bottom-24 z-10 rounded-2xl bg-gading p-2">
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => onType(e.target.value)}
            maxLength={target.length}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="next"
            aria-label={`Ketik baris ${cur + 1}`}
            placeholder={`Ketik baris ${cur + 1} di sini`}
            className="h-12 w-full rounded-xl border-2 border-tinta bg-white px-3 font-mono text-base text-tinta"
          />
          {firstBad(typed, target) >= 0 && (
            <p role="alert" className="mt-1 px-1 font-bold text-merah-600">
              Salah ketik. Hapus huruf yang merah lalu coba lagi.
            </p>
          )}
        </div>
      )}

      {phase === 'susun' && (
        <section aria-label="Kotak kode" className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Kotak kode ({remaining.length})</h2>
          <ul className="flex flex-wrap gap-2">
            {remaining.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => setPick(pick === t ? null : t)}
                  aria-pressed={pick === t}
                  className={cn(
                    'stiker min-h-12 max-w-full break-all rounded-xl px-3 py-2 text-left font-mono text-sm transition active:translate-y-1 active:shadow-none',
                    pick === t ? 'bg-kuning-300' : 'bg-gading',
                  )}
                >
                  {lesson.lines[t].c}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}

/* ───────────────────────── Menu & pintu masuk ───────────────────────── */

export function KodePintar() {
  const p = useProgress();
  const [active, setActive] = useState<{ t: number; l: number; run: number } | null>(null);
  const kode = p.kode ?? {};
  const done = (id: string) => (kode[id] ?? 0) > 0;
  const trackDone = (t: number) => TRACKS[t].lessons.every((l) => done(l.id));
  const trackOpen = (t: number) => t === 0 || trackDone(t - 1);
  const lessonOpen = (t: number, l: number) => trackOpen(t) && (l === 0 || done(TRACKS[t].lessons[l - 1].id));
  const totalDone = TRACKS.reduce((s, t) => s + t.lessons.filter((l) => done(l.id)).length, 0);

  if (active) {
    const track = TRACKS[active.t];
    const lesson = track.lessons[active.l];
    const nextLesson: { t: number; l: number } | null =
      active.l + 1 < track.lessons.length ? { t: active.t, l: active.l + 1 } : active.t + 1 < TRACKS.length ? { t: active.t + 1, l: 0 } : null;
    return (
      <LessonPlay
        key={`${lesson.id}-${active.run}`}
        ti={active.t}
        li={active.l}
        next={nextLesson ? { label: nextLesson.t === active.t ? 'Pelajaran berikutnya' : `Mulai jalur ${TRACKS[nextLesson.t].title.split(':')[0]}` } : null}
        onExit={() => setActive(null)}
        onNext={() => nextLesson && setActive({ ...nextLesson, run: 0 })}
        onAgain={() => setActive({ ...active, run: active.run + 1 })}
      />
    );
  }

  return (
    <Page className="max-w-2xl">
      <PageHeader title="Kode Pintar" subtitle="Belajar coding dari nol, selangkah demi selangkah." icon="chip" aside={<Badge tone="kuning">{totalDone}/{KODE_TOTAL}</Badge>} />
      <Card tone="catatan" className="space-y-2">
        <p className="font-display text-lg font-semibold">Proyek: Tugas Pintar</p>
        <p>Kamu membangun satu aplikasi pencatat tugas dari awal: rangka (HTML), tampilan (CSS), gerak (JavaScript), logika (Python), gudang data (SQL), lalu menyimpannya (Git).</p>
        <p className="font-display text-lg font-semibold">Cara bermain</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Susun kotak kode ke tempat yang benar, seperti puzzle.</li>
          <li>Ketik kodenya sendiri. Huruf benar menyala hijau, huruf salah menyala merah.</li>
          <li>Ketuk "Layar hasil" untuk melihat hasil dan seluruh kodenya.</li>
          <li>Ketuk baris mana pun, termasuk yang redup, untuk membaca kenapa baris itu ada di situ.</li>
        </ol>
      </Card>

      {TRACKS.map((track, t) => {
        const open = trackOpen(t);
        const count = track.lessons.filter((l) => done(l.id)).length;
        return (
          <section key={track.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={cn('stiker flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', track.bg)}>
                <Icon name={open ? track.icon : 'lock'} size={30} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-semibold leading-tight">{track.title}</h2>
                <p className="text-tinta/80">{open ? track.desc : `Selesaikan jalur ${TRACKS[t - 1].title.split(':')[0]} dulu.`}</p>
              </div>
            </div>
            {open && <ProgressBar value={count} max={track.lessons.length} label={`Kemajuan jalur ${track.id}`} />}
            <ul className="grid gap-2">
              {track.lessons.map((lesson, l) => {
                const ok = lessonOpen(t, l);
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      disabled={!ok}
                      onClick={() => setActive({ t, l, run: 0 })}
                      className="stiker flex min-h-14 w-full items-center gap-3 rounded-2xl bg-gading px-4 py-2 text-left transition active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-tinta bg-kuning-100 font-display font-semibold">{l + 1}</span>
                      <span className="min-w-0 flex-1 font-display text-lg font-semibold leading-tight">{lesson.title}</span>
                      {ok ? <Stars count={kode[lesson.id] ?? 0} /> : <Icon name="lock" size={20} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <p className="text-sm text-tinta/70">Jalur baru ditambahkan bertahap.</p>
      <ButtonLink to={GAME} variant="sekunder">
        Kembali
      </ButtonLink>
    </Page>
  );
}
