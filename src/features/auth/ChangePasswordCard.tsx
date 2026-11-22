import { useState, type FormEvent } from 'react';
import { Button, Card, Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { PASSWORD_RULES } from '@/utils/password';
import { Field, FormError } from './parts';

/**
 * Ubah sandi (orang tua/guru) atau PIN (anak). Hanya muncul bila sudah masuk.
 * Layanan Firebase dimuat saat dipakai (aturan bundel awal).
 */
export function ChangePasswordCard() {
  const { status, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [oldS, setOldS] = useState('');
  const [newS, setNewS] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (status !== 'ready' || !user) return null;
  const isChild = user.role === 'student';
  const noun = isChild ? 'PIN' : 'sandi';

  function close() {
    setOpen(false);
    setOldS('');
    setNewS('');
    setAgain('');
    setError('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (newS !== again) {
      setError(`${isChild ? 'PIN' : 'Sandi'} baru dan ulangannya belum sama.`);
      return;
    }
    setBusy(true);
    try {
      const { changePassword, friendlyError } = await import('@/services/firebase/auth');
      try {
        await changePassword(oldS, newS);
        setDone(true);
        close();
      } catch (err) {
        setError(friendlyError(err));
      }
    } catch {
      setError('Tidak bisa memuat layanan akun. Periksa koneksi internet.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="text-xl">Ubah {noun}</h2>
      {done && !open && (
        <p role="status" className="flex items-start gap-2 rounded-2xl border-2 border-hijau-600 bg-hijau-100 px-4 py-3 font-semibold">
          <Icon name="check" size={20} className="mt-0.5 shrink-0 text-hijau-700" />
          <span>{isChild ? 'PIN' : 'Sandi'} sudah diganti. Pakai yang baru saat masuk berikutnya.</span>
        </p>
      )}
      {!open ? (
        <>
          <p>{isChild ? 'Ganti PIN 6 angka akunmu. Kamu perlu PIN yang lama.' : 'Ganti sandi akunmu. Kamu perlu sandi yang lama.'}</p>
          <Button
            variant="sekunder"
            onClick={() => {
              setDone(false);
              setOpen(true);
            }}
          >
            <Icon name="lock" size={20} />
            Ubah {noun}
          </Button>
        </>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <Field
            label={`${isChild ? 'PIN' : 'Sandi'} lama`}
            type="password"
            autoComplete="current-password"
            inputMode={isChild ? 'numeric' : undefined}
            maxLength={isChild ? 6 : 128}
            value={oldS}
            onChange={(e) => setOldS(e.target.value)}
            required
          />
          <Field
            label={`${isChild ? 'PIN' : 'Sandi'} baru`}
            type="password"
            autoComplete="new-password"
            inputMode={isChild ? 'numeric' : undefined}
            maxLength={isChild ? 6 : 128}
            hint={isChild ? '6 angka.' : undefined}
            value={newS}
            onChange={(e) => setNewS(e.target.value)}
            required
          />
          {!isChild && (
            <ul className="space-y-1 text-sm" aria-label="Syarat sandi">
              {PASSWORD_RULES.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <Icon name={r.test(newS) ? 'check' : 'close'} size={16} className={r.test(newS) ? 'text-hijau-700' : 'text-merah-600'} />
                  {r.label}
                </li>
              ))}
            </ul>
          )}
          <Field
            label={`Ulangi ${noun} baru`}
            type="password"
            autoComplete="new-password"
            inputMode={isChild ? 'numeric' : undefined}
            maxLength={isChild ? 6 : 128}
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            required
          />
          <FormError message={error} />
          <div className="flex gap-3">
            <Button type="submit" disabled={busy || !oldS || !newS || !again}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </Button>
            <Button type="button" variant="ghost" onClick={close} disabled={busy}>
              Batal
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
