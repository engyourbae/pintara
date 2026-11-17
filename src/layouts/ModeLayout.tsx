import { Link, NavLink, Outlet } from 'react-router-dom';
import { Icon, Logo } from '@/components/ui';
import { MODE_BASE, MODE_LABEL, NAV } from '@/app/navigation';
import { cn } from '@/utils/cn';
import type { Role } from '@/types';

/**
 * Kerangka bersama untuk semua mode. Karakter mode (warna) hanya lewat `data-mode`.
 * Satu <nav>: bilah bawah di ponsel, bilah atas di layar lebar (hanya beda CSS, bukan dua navigasi).
 */
export function ModeLayout({ role }: { role: Role }) {
  const base = MODE_BASE[role];

  return (
    <div data-mode={role} className="flex min-h-screen flex-col pb-[76px] md:pb-0">
      <header className="sticky top-0 z-10 border-b-2 border-aksen-muda bg-gading">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
          <Link to="/" aria-label="PINTARA, kembali ke awal" className="rounded-2xl">
            <Logo />
          </Link>
          <span className="hidden font-bold text-aksen-tua sm:inline">{MODE_LABEL[role]}</span>

          <nav
            aria-label={`Menu ${MODE_LABEL[role]}`}
            className={cn(
              'fixed inset-x-0 bottom-0 flex border-t-2 border-aksen-muda bg-gading',
              'md:static md:ml-auto md:gap-1 md:border-0 md:bg-transparent',
            )}
          >
            {NAV[role].map((item) => (
              <NavLink
                key={item.path}
                to={item.path ? `${base}/${item.path}` : base}
                end={item.path === ''}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[64px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-bold',
                    'md:min-h-tap md:flex-none md:flex-row md:gap-2 md:rounded-2xl md:px-4 md:text-base',
                    isActive ? 'bg-aksen-muda text-aksen-tua' : 'text-tinta hover:bg-aksen-muda/60',
                  )
                }
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
