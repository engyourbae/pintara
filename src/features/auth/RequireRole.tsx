import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button, Card, Mascot } from '@/components/ui';
import { LoadingScreen } from '@/components/LoadingScreen';
import { MODE_BASE } from '@/app/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AuthShell } from './parts';
import type { Role } from '@/types';

/**
 * Pembatas tampilan per peran. INI HANYA UX: keamanan data tetap dijaga Security Rules,
 * bukan oleh pengecekan di sini. Bila Firebase belum dikonfigurasi, halaman tetap terbuka
 * seperti sebelumnya (hanya menampilkan data contoh).
 */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { status, user, signOut, refresh } = useAuth();
  const location = useLocation();

  if (status === 'disabled') return <>{children}</>;

  if (status === 'loading') return <LoadingScreen label="Memeriksa akun…" />;

  if (status === 'signedOut' || status === 'noProfile') {
    return <Navigate to="/masuk" replace state={{ from: location.pathname }} />;
  }

  if (status === 'error' || !user) {
    return (
      <AuthShell>
        <Card tone="catatan" className="space-y-3">
          <h1 className="text-2xl">Akun belum bisa dimuat</h1>
          <p>Periksa koneksi internet lalu muat ulang halaman. Jika terus terjadi, pastikan Security Rules sudah di-publish.</p>
          <Button onClick={() => window.location.reload()}>Muat ulang</Button>
        </Card>
      </AuthShell>
    );
  }

  if (user.role !== role) return <Navigate to={MODE_BASE[user.role]} replace />;

  if (role === 'teacher' && !user.teacherVerified) {
    return (
      <AuthShell>
        <Card tone="catatan" className="flex flex-col items-center gap-3 text-center">
          <Mascot size={110} className="animate-melayang" />
          <h1 className="text-2xl">{user.teacherRejected ? 'Pendaftaran guru ditolak' : 'Akun guru menunggu verifikasi'}</h1>
          <p>
            {user.teacherRejected
              ? 'Pengelola PINTARA belum dapat memverifikasi akun ini. Hubungi pengelola bila ini keliru.'
              : 'Demi keamanan anak, akun guru diaktifkan setelah diverifikasi oleh pengelola PINTARA. Setelah disetujui, tekan Periksa status.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => void refresh()}>Periksa status</Button>
            <Button variant="sekunder" onClick={() => void signOut()}>
              Keluar
            </Button>
          </div>
        </Card>
      </AuthShell>
    );
  }

  return <>{children}</>;
}
