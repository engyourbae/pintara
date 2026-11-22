import { lazy, Suspense } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ButtonLink, Icon, Logo, PageSkeleton } from '@/components/ui';
import { AccountMenu } from './AccountMenu';
import { useAuth } from '@/hooks/useAuth';
import { MODE_BASE, MODE_LABEL, NAV } from '@/app/navigation';
import { cn } from '@/utils/cn';
import type { Role } from '@/types';

// Dimuat lazy supaya SDK Firebase tidak masuk bundel awal.
const FloatingInvites = lazy(() => import('@/features/friends/FloatingInvites').then((m) => ({ default: m.FloatingInvites })));

/**
 * Layar fokus: saat sedang mengerjakan sesuatu (kuis, game, misi kelas, pratinjau kuis guru) header dan bilah
 * menu disembunyikan supaya tampilan bersih dan tidak tersentuh tidak sengaja. Keluar lewat tombol di halaman itu.
 */
const FOCUS_SECTIONS: Record<Role, string[]> = {
  student: ['belajar', 'game', 'kelas'],
  teacher: ['kuis'],
  parent: [],
};

/**
 * Kerangka bersama untuk semua mode. Karakter mode (warna) hanya lewat `data-mode`.
 * Satu <nav>: bilah bawah di ponsel, bilah atas di layar lebar (hanya beda CSS, bukan dua navigasi).
 */
export function ModeLayout({ role }: { role: Role }) {
  const base = MODE_BASE[role];
  const { status, user } = useAuth();
  const signedIn = status === 'ready' && !!user;
  const { pathname } = useLocation();
  const rest = pathname.slice(base.length).split('/').filter(Boolean);
  const focus = rest.length >= 2 && FOCUS_SECTIONS[role].includes(rest[0]);

  const floating =
    role === 'student' && signedIn ? (
      <Suspense fallback={null}>
        <FloatingInvites />
      </Suspense>
    ) : null;

  // Sudah masuk sebagai peran lain (mis. orang tua membuka /siswa): kembalikan ke ruangnya sendiri.
  if (signedIn && user && user.role !== role) return <Navigate to={MODE_BASE[user.role]} replace />;

  if (focus) {
    return (
      <div data-mode={role} className="min-h-screen">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
        {floating}
      </div>
    );
  }

  return (
    <div data-mode={role} className="flex min-h-screen flex-col pb-[84px] md:pb-0">
      <header className="sticky top-0 z-20 border-b-2 border-tinta bg-gading">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link to={signedIn && user ? base : '/'} aria-label="PINTARA, beranda" className="rounded-2xl">
            <Logo size={34} className="[&>span]:text-xl" />
          </Link>
          <span className="hidden rounded-full border-2 border-tinta bg-aksen px-3 py-0.5 text-sm font-bold text-white sm:inline">
            {MODE_LABEL[role]}
          </span>

          <nav
            aria-label={`Menu ${MODE_LABEL[role]}`}
            className={cn(
              'fixed inset-x-0 bottom-0 z-20 flex border-t-2 border-tinta bg-gading px-1 pb-[env(safe-area-inset-bottom)]',
              'md:static md:ml-auto md:gap-1 md:border-0 md:bg-transparent md:px-0 md:pb-0',
            )}
          >
            {NAV[role].map((item) => (
              <NavLink
                key={item.path}
                to={item.path ? `${base}/${item.path}` : base}
                end={item.path === ''}
                className={({ isActive }) =>
                  cn(
                    'flex h-[72px] min-w-0 flex-1 flex-col items-center justify-center gap-1 text-xs font-bold transition',
                    'md:h-12 md:flex-none md:flex-row md:gap-2 md:rounded-2xl md:px-4 md:text-base',
                    isActive ? 'text-aksen-tua md:bg-aksen md:text-white' : 'text-tinta/80 md:hover:bg-aksen-muda',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200',
                        'md:h-auto md:w-auto',
                        isActive ? 'bg-aksen text-white md:bg-transparent' : '',
                      )}
                    >
                      <Icon name={item.icon} size={22} />
                    </span>
                    <span className="max-w-full truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {!signedIn && (
              <ButtonLink to="/ruang" variant="sekunder" aria-label="Ganti ruang: anak, guru, atau orang tua" className="h-11 px-3">
                <Icon name="home" size={22} />
                <span className="hidden sm:inline">Ganti ruang</span>
              </ButtonLink>
            )}
            {(status === 'signedOut' || status === 'disabled') && (
              <ButtonLink to="/masuk" variant="aksi" className="h-11 px-4">
                <Icon name="user" size={20} />
                Masuk
              </ButtonLink>
            )}
            {signedIn && <AccountMenu />}
          </div>
        </div>
      </header>

      <div className="flex-1">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </div>
      {floating}
    </div>
  );
}
