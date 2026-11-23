import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, CheckRow, Card, ChoiceGroup, Icon, Page, PageHeader, useConfirm } from '@/components/ui';
import { Field, FormError } from '@/features/auth/parts';
import { useAuth } from '@/hooks/useAuth';
import {
  createChildAccount,
  friendlyError,
  listChildren,
  PIN_RE,
  randomUsername,
  saveChildSettings,
} from '@/services/firebase/auth';
import { deleteChildAccount } from '@/services/firebase/childDelete';
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

function ChildCard({
  child,
  parentUid,
  onSaved,
  onDeleted,
}: {
  child: ChildSummary;
  parentUid: string;
  onSaved: (c: ChildSummary) => void;
  onDeleted: (uid: string, note: string) => void;
}) {
  const ask = useConfirm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [delOpen, setDelOpen] = useState(false);
  const [delPin, setDelPin] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delStep, setDelStep] = useState('');

  async function remove(withPin: boolean) {
    const ok = await ask({
      title: `Hapus akun ${child.displayName}?`,
      message: withPin
        ? 'Semua data anak ini dihapus permanen: progres, riwayat, keanggotaan kelas, pertemanan, dan akun masuknya. Tidak bisa dibatalkan.'
        : 'Data anak dihapus (progres, riwayat, keanggotaan kelas, profil). Akun masuknya TIDAK bisa dihapus tanpa PIN: nama pengguna tetap terpakai dan sisa pertemanan tidak ikut terhapus. Tidak bisa dibatalkan.',
      confirmLabel: 'Ya, hapus',
      cancelLabel: 'Batal',
      danger: true,
    });
    if (!ok) return;
    setDelBusy(true);
    setError('');
    setDelStep('');
    try {
      const res = await deleteChildAccount({ uid: child.uid, username: child.username }, withPin ? delPin : null, setDelStep);
      onDeleted(
        child.uid,
        res.authDeleted
          ? `Akun ${child.displayName} dan semua datanya sudah dihapus.`
          : `Data ${child.displayName} sudah dihapus. Akun masuknya tidak bisa dihapus tanpa PIN, jadi nama pengguna ${child.username || 'itu'} tetap terpakai.`,
      );
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setDelBusy(false);
      setDelStep('');
    }
  }

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
        <ChoiceGroup
          label="Batas waktu bermain per hari"
          value={child.dailyLimitMinutes}
          disabled={saving}
          onChange={(m) => void update({ dailyLimitMinutes: m })}
          options={(LIMITS.includes(child.dailyLimitMinutes) ? LIMITS : [child.dailyLimitMinutes, ...LIMITS]).map((m) => ({ value: m, label: `${m} mnt` }))}
        />
        <p className="mt-1 text-sm text-tinta/75">Pencatatan batas waktu belum aktif; nilai ini disimpan untuk fitur berikutnya.</p>
      </div>
      <FormError message={error} />
      {!delOpen ? (
        <Button variant="ghost" onClick={() => setDelOpen(true)}>
          <Icon name="trash" size={20} /> Hapus akun anak
        </Button>
      ) : (
        <div className="space-y-3 rounded-2xl border-2 border-merah-600 bg-merah-100 p-4">
          <p className="font-semibold">Hapus akun {child.displayName}</p>
          <p className="text-sm">Masukkan PIN anak agar akun masuknya ikut terhapus. Penghapusan tidak bisa dibatalkan.</p>
          <Field
            label="PIN anak (6 angka)"
            value={delPin}
            onChange={(e) => setDelPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="off"
            disabled={delBusy}
          />
          {delBusy && delStep && <p role="status" className="text-sm font-semibold">{delStep}</p>}
          <Button block disabled={delBusy || !PIN_RE.test(delPin)} onClick={() => void remove(true)}>
            {delBusy ? 'Menghapus…' : 'Hapus akun dan semua datanya'}
          </Button>
          <Button variant="sekunder" block disabled={delBusy} onClick={() => void remove(false)}>
            Lupa PIN: hapus datanya saja
          </Button>
          <Button variant="ghost" block disabled={delBusy} onClick={() => { setDelOpen(false); setDelPin(''); setError(''); }}>
            Batal
          </Button>
        </div>
      )}
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
  const [removedNote, setRemovedNote] = useState('');

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
      {removedNote && (
        <p role="status" className="flex items-start gap-2 rounded-2xl border-2 border-tinta bg-hijau-100 px-4 py-3 font-semibold">
          <Icon name="check" size={20} className="mt-0.5 shrink-0 text-aksen-tua" />
          <span>{removedNote}</span>
        </p>
      )}
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
          onDeleted={(uid, note) => {
            setChildren((list) => list?.filter((x) => x.uid !== uid) ?? null);
            setRemovedNote(note);
          }}
        />
      ))}

      <form onSubmit={submit} className="stiker space-y-4 rounded-3xl bg-gading p-5">
        <h2 className="text-xl">Tambah akun anak</h2>
        <Field label="Nama panggilan" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} required />
        <ChoiceGroup
          label="Kelas (boleh dikosongkan)"
          value={grade}
          onChange={setGrade}
          options={[{ value: '' as Grade | '', label: 'Belum' }, ...GRADES.map((g) => ({ value: g as Grade | '', label: String(g) }))]}
        />
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
        <CheckRow checked={consent} onChange={setConsent}>
          Saya orang tua atau wali anak ini dan mengizinkan anak memakai PINTARA.
        </CheckRow>
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
