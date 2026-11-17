import { HashRouter, Route, Routes } from 'react-router-dom';
import { MODE_BASE, NAV } from './navigation';
import { ModeLayout } from '@/layouts/ModeLayout';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { LandingPage } from '@/pages/LandingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DesignSystemPage } from '@/pages/DesignSystemPage';
import type { Role } from '@/types';

const ROLES: Role[] = ['student', 'teacher', 'parent'];

/**
 * HashRouter dipilih agar aman di GitHub Pages (tanpa fallback SPA) dan PWA.
 * Catatan: pembatasan akses per role BELUM aktif; ditegakkan di Fase F lewat Security Rules.
 * Route guard di frontend hanya untuk UX, bukan keamanan.
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/desain" element={<DesignSystemPage />} />
        {ROLES.map((role) => (
          <Route key={role} path={MODE_BASE[role]} element={<ModeLayout role={role} />}>
            {NAV[role].map((item) => {
              const page = <PlaceholderPage role={role} title={item.label} phase={item.phase} />;
              return item.path === '' ? (
                <Route key="beranda" index element={page} />
              ) : (
                <Route key={item.path} path={item.path} element={page} />
              );
            })}
          </Route>
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}
