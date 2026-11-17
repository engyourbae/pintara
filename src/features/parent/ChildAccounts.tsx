import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, Card, Icon, Page, PageHeader } from '@/components/ui';
import { Field, FormError } from '@/features/auth/parts';
import { useAuth } from '@/hooks/useAuth';
import {
  createChildAccount,
  friendlyError,
  listChildren,
  randomUsername,
  saveChildSettings,
} from '@/services/firebase/auth';
import type { ChildSummary, Grade } from '@/types';
import { cn } from '@/utils/cn';

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];
const LIMITS = [30, 60, 90, 120];

function Toggle({ label, desc, on, disabled, onChange }: { label: string; desc: string; on: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-tinta/75">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!on)}
        className={cn(
          'relative h-8 w-14 shrink-0 rounded-full border-2 border-tinta transition disabled:opacity-50',
          on ? 'bg-aksen' : 'bg-white',
        )}
      >
        <span
          className={cn('absolute top-0.5 h-6 w-6 rounded-full border-2 border-tinta bg-gading transition-all', on ? 'left-[26px]' : 'left-0.5')}
        />
      </button>
    </div>
  );
}

function ChildCard({ child, parentUid, onSaved }: { child: ChildSummary; parentUid: string; onSaved: (c: ChildSummary) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function update(patch: Partial<ChildSummary>) {
    setSaving(true);
    setError('');
    try {
      const next = { ...child, ...patch };
      await saveChildSettings(parentUid, next);
      onSaved(next);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-semibold">{child.displayName}</p>
          <p className="text-sm text-tinta/75">
            Nama pengguna: <span className="font-bold">{child.username || '—'}</span>
          </p>
        </div>
        <Badge tone="hijau">Akun anak</Badge>
      </div>
      <Toggle
        label="Boleh berteman"
        desc="Anak bisa mengirim dan menerima permintaan teman."
        on={child.friendsEnabled}
        disabled={saving}
        onChange={(v) => void update({ friendsEnabled: v })}
      />
      <Toggle
        label="Boleh main bersama"
        desc="Anak bisa mengundang teman dan ikut permainan online."
        on={child.multiplayerEnabled}
        disabled={saving}
        onChange={(v) => void update({ multiplayerEnabled: v })}
      />
      <div>
        <label htmlFor={`batas-${child.uid}`} className="font-semibold">
          Batas waktu bermain per hari
        </label>
        <select
          id={`batas-${child.uid}`}
          value={child.dailyLimitMinutes}
          disabled={saving}
          onChange={(e) => void update({ dailyLimitMinutes: Number(e.target.value) })}
          className="mt-1 h-12 w-full rounded-2xl border-2 border-tinta bg-white px-4 text-lg"
        >
          {!LIMITS.includes(child.dailyLimitMinutes) && <option value={child.dailyLimitMinutes}>{child.dailyLimitMinutes} menit</option>}
          {LIMITS.map((m) => (
            <option key={m} value={m}>
              {m} menit
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-tinta/75">Pencatatan batas waktu belum aktif; nilai ini disimpan untuk fitur berikutnya.</p>
      </div>
      <FormError message={error} />
    </Card>
  );
}

/** Orang tua membuat dan mengatur akun anak. Seluruh izin ditegakkan Security Rules, bukan layar ini. */
export function ChildAccounts() {
  const { user } = useAuth();
  const parentUid = user?.uid ?? '';
  const [children, setChildren] = useState<ChildSummary[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [username, setUsername] = useState(() => randomUsername());
  const [pin, setPin] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState('');

  const reload = useCallback(async () => {
    if (!parentUid) return;
    try {
      setChildren(await listChildren(parentUid));
      setLoadError('');
    } catch (e) {
      setLoadError(friendlyError(e));
    }
  }, [parentUid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setCreated('');
    setBusy(true);
    try {
      const res = await createChildAccount({ displayName: name, username, pin, grade: grade === '' ? undefined : grade });
      setCreated(res.username);
      setName('');
      setGrade('');
      setPin('');
      setConsent(false);
      setUsername(randomUsername());
      await reload();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <PageHeader title="Akun Anak" subtitle="Buat akun anak dan atur izinnya." icon="user" />

      {loadError && <FormError message={loadError} />}
      {children === null && !loadError && <p role="status">Memuat…</p>}
      {children?.length === 0 && (
        <Card tone="catatan">
          <p>Belum ada akun anak. Buat yang pertama di bawah.</p>
        </Card>
      )}
      {children?.map((c) => (
        <ChildCard
          key={c.uid}
          child={c}
          parentUid={parentUid}
          onSaved={(next) => setChildren((list) => list?.map((x) => (x.uid === next.uid ? next : x)) ?? null)}
        />
      ))}

      <form onSubmit={submit} className="stiker space-y-4 rounded-3xl bg-gading p-5">
        <h2 className="text-xl">Tambah akun anak</h2>
        <Field label="Nama panggilan" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} required />
        <div>
          <label htmlFor="kelas-anak" className="block font-display text-lg font-semibold">
            Kelas (boleh dikosongkan)
          </label>
          <select
            id="kelas-anak"
            value={grade}
            onChange={(e) => setGrade(e.target.value === '' ? '' : (Number(e.target.value) as Grade))}
            className="mt-1 h-12 w-full rounded-2xl border-2 border-tinta bg-white px-4 text-lg"
          >
            <option value="">Belum dipilih</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                Kelas {g}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Nama pengguna"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          autoCapitalize="none"
          spellCheck={false}
          pattern="[a-z0-9_]{3,20}"
          required
          hint="Acak agar tidak mudah ditebak. Boleh diganti: huruf kecil, angka, garis bawah (3–20)."
        />
        <Field
          label="PIN anak (6 angka)"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="off"
          pattern="\d{6}"
          required
          hint="Catat PIN ini. PIN tidak bisa dilihat lagi setelah akun dibuat."
        />
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-6 w-6 shrink-0 accent-[#478f3a]"
          />
          <span>Saya orang tua atau wali anak ini dan mengizinkan anak memakai PINTARA.</span>
        </label>
        <FormError message={error} />
        {created && (
          <p role="status" className="flex items-start gap-2 rounded-2xl border-2 border-tinta bg-hijau-100 px-4 py-3 font-semibold">
            <Icon name="check" size={20} className="mt-0.5 shrink-0 text-aksen-tua" />
            <span>
              Akun dibuat. Anak masuk dengan nama pengguna <span className="font-bold">{created}</span> dan PIN yang tadi diisi.
            </span>
          </p>
        )}
        <Button type="submit" size="lg" block disabled={busy || !consent}>
          {busy ? 'Membuat akun…' : 'Buat akun anak'}
        </Button>
      </form>

      <Card tone="langit" className="flex items-start gap-3">
        <Icon name="shield" size={24} className="mt-0.5 shrink-0" />
        <p>Pertemanan dan main bersama MATI secara bawaan. Aktifkan hanya bila Anda setuju. Tidak ada obrolan bebas antar-anak.</p>
      </Card>
    </Page>
  );
}
