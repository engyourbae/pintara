import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { Field, FormError } from '@/features/auth/parts';
import { useAuth } from '@/hooks/useAuth';
import { friendlyError } from '@/services/firebase/auth';
import { joinClass, myMemberships } from '@/services/firebase/classes';
import type { MyMembership } from '@/types';

/** Siswa yang sudah masuk dapat bergabung ke kelas dengan kode dari guru. Guru harus menyetujui. */
export function JoinClassCard() {
  const { status, user } = useAuth();
  const uid = status === 'ready' && user?.role === 'student' ? user.uid : '';
  const [list, setList] = useState<MyMembership[] | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!uid) return;
    try {
      setList(await myMemberships(uid));
    } catch {
      setList([]);
    }
  }, [uid]);
  useEffect(() => {
    void reload();
  }, [reload]);

  if (!uid || !user) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await joinClass(uid, user?.displayName ?? '', code);
      setCode('');
      await reload();
    } catch (err) {
      const m = err instanceof Error ? err.message : '';
      setError(
        m === 'KODE_FORMAT' ? 'Kode kelas terdiri dari 6 huruf/angka.' : m === 'KODE_TIDAK_ADA' ? 'Kode tidak ditemukan. Periksa lagi dengan gurumu.' : friendlyError(err),
      );
    } finally {
      setBusy(false);
    }
  }

  const visible = (list ?? []).filter((m) => m.status !== 'removed');
  return (
    <Card tone="langit" className="space-y-3">
      <h2 className="text-xl">Kelasku</h2>
      {visible.length > 0 && (
        <ul className="space-y-2">
          {visible.map((m) => (
            <li key={m.classId} className="flex items-center justify-between gap-2">
              <span className="font-semibold">{m.status === 'active' ? (m.className ?? 'Kelas') : 'Kelas (menunggu guru)'}</span>
              <Badge tone={m.status === 'active' ? 'hijau' : 'kuning'}>{m.status === 'active' ? 'Anggota' : 'Menunggu persetujuan'}</Badge>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="space-y-2">
        <Field label="Kode kelas dari guru" value={code} maxLength={8} autoCapitalize="characters" autoComplete="off" placeholder="mis. K7M2QX" onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <FormError message={error} />
        <Button type="submit" disabled={busy || code.trim().length < 6}>{busy ? 'Mengirim…' : 'Gabung kelas'}</Button>
      </form>
    </Card>
  );
}
