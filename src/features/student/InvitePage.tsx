import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ButtonLink, Card, Mascot } from '@/components/ui';
import { MODE_BASE } from '@/app/navigation';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthShell } from '@/features/auth/parts';
import { useAuth } from '@/hooks/useAuth';
import { saveInvite } from '@/utils/share';

/** Tujuan tautan undangan kelas (#/gabung/KODE). Hanya menyimpan kode; bergabung tetap lewat tombol di Beranda murid. */
export function InvitePage() {
  const { code = '' } = useParams();
  const { status, user } = useAuth();
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const valid = clean.length === 6;

  useEffect(() => {
    if (valid) saveInvite(clean);
  }, [valid, clean]);

  if (status === 'loading') return <LoadingScreen />;
  if (valid && status === 'ready' && user?.role === 'student') return <Navigate to={MODE_BASE.student} replace />;

  return (
    <AuthShell>
      <Card tone="langit" className="flex flex-col items-center gap-4 text-center">
        <Mascot size={90} mood="hore" />
        {!valid ? (
          <>
            <h1 className="text-2xl">Tautan undangan tidak valid</h1>
            <p>Minta guru mengirim ulang tautan atau kode kelasnya.</p>
            <ButtonLink to="/" variant="sekunder" block>Ke beranda</ButtonLink>
          </>
        ) : status === 'ready' && user ? (
          <>
            <h1 className="text-2xl">Undangan untuk murid</h1>
            <p>Tautan ini dipakai oleh akun murid. Akunmu bukan akun murid.</p>
            <ButtonLink to={MODE_BASE[user.role]} variant="sekunder" block>Kembali</ButtonLink>
          </>
        ) : (
          <>
            <h1 className="text-2xl">Undangan masuk kelas</h1>
            <p>Masuk dengan akun muridmu. Kode kelas <strong className="tracking-widest">{clean}</strong> akan terisi otomatis, lalu guru menyetujui.</p>
            <ButtonLink to="/masuk" block>Masuk akun murid</ButtonLink>
          </>
        )}
      </Card>
    </AuthShell>
  );
}
