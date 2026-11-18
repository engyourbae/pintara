import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, ChoiceGroup, Icon, Page, PageHeader } from '@/components/ui';
import { FormError } from '@/features/auth/parts';
import { useAuth } from '@/hooks/useAuth';
import { listMembers, listMyClasses } from '@/services/firebase/classes';
import { friendlyError } from '@/services/firebase/auth';
import { cn } from '@/utils/cn';
import { TeamQuiz } from './TeamQuiz';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Tab = 'acak' | 'kelompok' | 'kuis';

/**
 * Kelas langsung: dipakai guru di depan kelas dengan SATU perangkat. Daftar murid dari kelas
 * (yang sudah disetujui) dan/atau diketik manual. Semua alat berjalan lokal; tidak ada data yang dikirim.
 */
export function ClassroomLive() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [names, setNames] = useState<string[]>([]);
  const [absent, setAbsent] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<Tab>('acak');
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [source, setSource] = useState(params.get('kelas') ?? '');
  const [teamCount, setTeamCount] = useState(3);
  const [teams, setTeams] = useState<string[][]>([]);

  useEffect(() => {
    if (!user) return;
    listMyClasses(user.uid)
      .then((l) => setClasses(l.filter((c) => !c.archived).map((c) => ({ id: c.id, name: c.name }))))
      .catch((e) => setError(friendlyError(e)));
  }, [user]);

  useEffect(() => {
    if (!source) return;
    listMembers(source)
      .then((m) => {
        setNames(m.filter((x) => x.status === 'active').map((x) => x.displayName));
        setAbsent([]);
        setTeams([]);
      })
      .catch((e) => setError(friendlyError(e)));
  }, [source]);

  const present = names.filter((n) => !absent.includes(n));

  function add(e: FormEvent) {
    e.preventDefault();
    const parts = draft.split(/[,\n]/).map((s) => s.trim().slice(0, 30)).filter(Boolean);
    setNames((cur) => [...cur, ...parts.filter((p) => !cur.includes(p))]);
    setDraft('');
  }

  return (
    <Page>
      <PageHeader title="Kelas langsung" subtitle="Alat interaksi untuk satu perangkat di depan kelas." icon="play" />
      <FormError message={error} />

      <Card className="space-y-3">
        {classes.length > 0 && (
          <ChoiceGroup label="Ambil daftar dari kelas" value={source} onChange={setSource} options={classes.map((c) => ({ value: c.id, label: c.name }))} />
        )}
        <form onSubmit={add} className="flex gap-2">
          <input
            aria-label="Tambah nama murid"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tambah nama (pisahkan koma)"
            className="h-12 min-w-0 flex-1 rounded-2xl border-2 border-tinta bg-white px-4 text-lg"
          />
          <Button type="submit" disabled={!draft.trim()}>Tambah</Button>
        </form>
        {names.length === 0 ? (
          <p className="text-sm">Belum ada nama. Pilih kelas atau ketik nama murid.</p>
        ) : (
          <>
            <p className="text-sm font-semibold">Ketuk nama untuk menandai tidak hadir ({present.length} hadir dari {names.length}).</p>
            <ul className="flex flex-wrap gap-2">
              {names.map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    aria-pressed={!absent.includes(n)}
                    onClick={() => setAbsent((a) => (a.includes(n) ? a.filter((x) => x !== n) : [...a, n]))}
                    className={cn('min-h-[40px] rounded-full border-2 border-tinta px-3 font-semibold', absent.includes(n) ? 'bg-white line-through opacity-60' : 'bg-hijau-100')}
                  >
                    {n}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <ChoiceGroup<Tab>
        label="Alat"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'acak', label: 'Acak nama' },
          { value: 'kelompok', label: 'Kelompok' },
          { value: 'kuis', label: 'Kuis tim' },
        ]}
      />

      {tab === 'acak' && <RandomPicker names={present} />}
      {tab === 'kelompok' && <TeamMaker names={present} count={teamCount} setCount={setTeamCount} teams={teams} setTeams={setTeams} />}
      {tab === 'kuis' && <TeamQuiz key={teams.length} teamNames={teams.map((_, i) => `Tim ${i + 1}`)} />}
    </Page>
  );
}

function RandomPicker({ names }: { names: string[] }) {
  const [shown, setShown] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [fair, setFair] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => () => clearInterval(timer.current), []);

  const pool = fair ? names.filter((n) => !done.includes(n)) : names;

  function pick() {
    if (pool.length === 0 || spinning) return;
    setSpinning(true);
    const winner = pool[Math.floor(Math.random() * pool.length)];
    let ticks = 0;
    timer.current = setInterval(() => {
      ticks++;
      if (ticks >= 14) {
        clearInterval(timer.current);
        setShown(winner);
        setSpinning(false);
        setDone((d) => [...d, winner]);
      } else setShown(pool[Math.floor(Math.random() * pool.length)]);
    }, 90);
  }

  return (
    <Card tone="catatan" className="space-y-4 text-center">
      <div aria-live="polite" className="flex min-h-[140px] items-center justify-center">
        <p className={cn('font-display text-5xl font-bold leading-tight', spinning && 'opacity-60')}>{shown || '?'}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="lg" onClick={pick} disabled={pool.length === 0 || spinning}>
          <Icon name="star" size={22} />
          {names.length === 0 ? 'Tambah nama dulu' : pool.length === 0 ? 'Semua sudah terpilih' : 'Pilih murid'}
        </Button>
        {done.length > 0 && <Button variant="sekunder" size="lg" onClick={() => { setDone([]); setShown(''); }}>Ulang dari awal</Button>}
      </div>
      <label className="flex items-center justify-center gap-2 font-semibold">
        <input type="checkbox" checked={fair} onChange={(e) => setFair(e.target.checked)} className="sr-only" />
        <span aria-hidden className={cn('flex h-7 w-7 items-center justify-center rounded-lg border-2 border-tinta', fair ? 'bg-aksen text-white' : 'bg-white')}>{fair && <Icon name="check" size={18} />}</span>
        Tidak mengulang murid yang sudah terpilih ({done.length} terpilih)
      </label>
    </Card>
  );
}

function TeamMaker({ names, count, setCount, teams, setTeams }: { names: string[]; count: number; setCount: (n: number) => void; teams: string[][]; setTeams: (t: string[][]) => void }) {
  function make() {
    const n = Math.min(count, Math.max(names.length, 1));
    const out: string[][] = Array.from({ length: n }, () => []);
    shuffle(names).forEach((name, i) => out[i % n].push(name));
    setTeams(out);
  }
  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <ChoiceGroup label="Jumlah kelompok" value={count} onChange={setCount} options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))} />
        <Button size="lg" onClick={make} disabled={names.length < 2}>
          <Icon name="users" size={22} />
          {teams.length ? 'Acak ulang' : 'Bagi kelompok'}
        </Button>
        {names.length < 2 && <p className="text-sm">Perlu minimal 2 murid hadir.</p>}
      </Card>
      {teams.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {teams.map((t, i) => (
            <li key={i}>
              <Card className="h-full space-y-2">
                <div className="flex items-center justify-between"><h3 className="text-xl">Tim {i + 1}</h3><Badge tone="langit">{t.length} murid</Badge></div>
                <p>{t.join(', ')}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
