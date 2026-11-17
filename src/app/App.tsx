import { lazy, Suspense, type ReactElement } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { MODE_BASE, NAV } from './navigation';
import { ModeLayout } from '@/layouts/ModeLayout';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { LandingPage } from '@/pages/LandingPage';
import { ChooseSpacePage } from '@/pages/ChooseSpacePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DesignSystemPage } from '@/pages/DesignSystemPage';
import { StudentHome, StudentProfile } from '@/features/student/StudentPages';
import { LearnList, QuizPage } from '@/features/learning/LearnPages';
import { GameMenu, KilatHitung } from '@/features/games/GamePages';
import { SusunKata, TekaPola } from '@/features/games/WordPatternGames';
import { TeacherClasses, TeacherHome, TeacherQuizzes, TeacherResults } from '@/features/teacher/TeacherPages';
import { ParentHome, ParentProgress, ParentSettings } from '@/features/parent/ParentPages';
import { AuthProvider } from '@/hooks/useAuth';
import { RequireRole } from '@/features/auth/RequireRole';
import type { Role } from '@/types';

/** Halaman akun dimuat saat dibutuhkan (membawa SDK Firebase), supaya mode tamu tetap ringan. */
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const FriendsPage = lazy(() => import('@/features/friends/FriendsPage').then((m) => ({ default: m.FriendsPage })));
const ChildAccounts = lazy(() => import('@/features/parent/ChildAccounts').then((m) => ({ default: m.ChildAccounts })));

const ROLES: Role[] = ['student', 'teacher', 'parent'];

/** Halaman yang sudah dibangun, per mode dan path menu. Yang belum ada jatuh ke PlaceholderPage. */
const PAGES: Record<Role, Record<string, ReactElement>> = {
  student: { '': <StudentHome />, belajar: <LearnList />, game: <GameMenu />, teman: <FriendsPage />, profil: <StudentProfile /> },
  teacher: { '': <TeacherHome />, kelas: <TeacherClasses />, kuis: <TeacherQuizzes />, hasil: <TeacherResults /> },
  parent: { '': <ParentHome />, perkembangan: <ParentProgress />, anak: <ChildAccounts />, pengaturan: <ParentSettings /> },
};

/**
 * HashRouter dipilih agar aman di GitHub Pages (tanpa fallback SPA) dan PWA.
 * Ruang guru dan orang tua dibatasi lewat <RequireRole> (peran dibaca dari Firestore). Ini hanya UX;
 * keamanan data yang sebenarnya ada di Security Rules. Ruang anak tetap terbuka sebagai mode tamu.
 */
export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Suspense fallback={<p role="status" className="p-6 text-center font-display text-xl">Memuat…</p>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/ruang" element={<ChooseSpacePage />} />
            <Route path="/masuk" element={<LoginPage />} />
            <Route path="/daftar" element={<RegisterPage />} />
            <Route path="/desain" element={<DesignSystemPage />} />
            {ROLES.map((role) => (
              <Route
                key={role}
                path={MODE_BASE[role]}
                element={
                  role === 'student' ? (
                    <ModeLayout role={role} />
                  ) : (
                    <RequireRole role={role}>
                      <ModeLayout role={role} />
                    </RequireRole>
                  )
                }
              >
                {NAV[role].map((item) => {
                  const page = PAGES[role][item.path] ?? <PlaceholderPage role={role} title={item.label} phase={item.phase} />;
                  return item.path === '' ? (
                    <Route key="beranda" index element={page} />
                  ) : (
                    <Route key={item.path} path={item.path} element={page} />
                  );
                })}
                {role === 'student' && (
                  <>
                    <Route path="belajar/:contentId" element={<QuizPage />} />
                    <Route path="game/kilat-hitung" element={<KilatHitung />} />
                    <Route path="game/susun-kata" element={<SusunKata />} />
                    <Route path="game/teka-pola" element={<TekaPola />} />
                  </>
                )}
              </Route>
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </HashRouter>
  );
}
