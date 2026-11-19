import { lazy, Suspense, type ReactElement, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MODE_BASE, NAV } from './navigation';
import { LoadingScreen } from '@/components/LoadingScreen';
import { SplashGate } from '@/components/SplashGate';
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
import { ParentSettings } from '@/features/parent/ParentPages';
import { ConfirmProvider } from '@/components/ui';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ProgressBridge } from '@/features/auth/ProgressBridge';
import { RequireRole } from '@/features/auth/RequireRole';
import type { Role } from '@/types';

/** Halaman akun dimuat saat dibutuhkan (membawa SDK Firebase), supaya mode tamu tetap ringan. */
const StudentClass = lazy(() => import('@/features/student/StudentClass').then((m) => ({ default: m.StudentClass })));
const TeacherQuizPlay = lazy(() => import('@/features/student/TeacherQuizPlay').then((m) => ({ default: m.TeacherQuizPlay })));
const InvitePage = lazy(() => import('@/features/student/InvitePage').then((m) => ({ default: m.InvitePage })));
const DuelPage = lazy(() => import('@/features/games/DuelPage').then((m) => ({ default: m.DuelPage })));
const MasukPage = lazy(() => import('@/features/auth/MasukPage').then((m) => ({ default: m.MasukPage })));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const FriendsPage = lazy(() => import('@/features/friends/FriendsPage').then((m) => ({ default: m.FriendsPage })));
const ChildAccounts = lazy(() => import('@/features/parent/ChildAccounts').then((m) => ({ default: m.ChildAccounts })));

// Halaman guru dan orang tua memakai data akun (Firestore), jadi dimuat saat dibutuhkan.
const TeacherHome = lazy(() => import('@/features/teacher/TeacherPages').then((m) => ({ default: m.TeacherHome })));
const TeacherClasses = lazy(() => import('@/features/teacher/TeacherPages').then((m) => ({ default: m.TeacherClasses })));
const TeacherQuizzes = lazy(() => import('@/features/teacher/TeacherPages').then((m) => ({ default: m.TeacherQuizzes })));
const TeacherResults = lazy(() => import('@/features/teacher/TeacherPages').then((m) => ({ default: m.TeacherResults })));
const ClassDetail = lazy(() => import('@/features/teacher/ClassDetail').then((m) => ({ default: m.ClassDetail })));
const ClassroomLive = lazy(() => import('@/features/classroom/ClassroomLive').then((m) => ({ default: m.ClassroomLive })));
const ParentHome = lazy(() => import('@/features/parent/ChildProgress').then((m) => ({ default: m.ParentHome })));
const ParentProgress = lazy(() => import('@/features/parent/ChildProgress').then((m) => ({ default: m.ParentProgress })));

const ROLES: Role[] = ['student', 'teacher', 'parent'];

/** Halaman yang sudah dibangun, per mode dan path menu. Yang belum ada jatuh ke PlaceholderPage. */
const PAGES: Record<Role, Record<string, ReactElement>> = {
  student: { '': <StudentHome />, belajar: <LearnList />, game: <GameMenu />, teman: <FriendsPage />, profil: <StudentProfile /> },
  teacher: { '': <TeacherHome />, kelas: <TeacherClasses />, kuis: <TeacherQuizzes />, langsung: <ClassroomLive />, hasil: <TeacherResults /> },
  parent: { '': <ParentHome />, perkembangan: <ParentProgress />, anak: <ChildAccounts />, pengaturan: <ParentSettings /> },
};

/** Halaman awal/pilih ruang hanya untuk yang belum masuk. Yang sudah masuk langsung ke ruangnya. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  if (status === 'loading') return <p role="status" className="p-6 text-center font-display text-xl">Memuat…</p>;
  if (status === 'ready' && user) return <Navigate to={MODE_BASE[user.role]} replace />;
  return <>{children}</>;
}

/**
 * HashRouter dipilih agar aman di GitHub Pages (tanpa fallback SPA) dan PWA.
 * Ruang guru dan orang tua dibatasi lewat <RequireRole> (peran dibaca dari Firestore). Ini hanya UX;
 * keamanan data yang sebenarnya ada di Security Rules. Ruang anak tetap terbuka sebagai mode tamu.
 */
export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ProgressBridge />
        <SplashGate />
        <ConfirmProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<GuestOnly><LandingPage /></GuestOnly>} />
            <Route path="/ruang" element={<GuestOnly><ChooseSpacePage /></GuestOnly>} />
            <Route path="/masuk" element={<MasukPage />} />
            <Route path="/daftar" element={<RegisterPage />} />
            <Route path="/gabung/:code" element={<InvitePage />} />
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
                {role === 'teacher' && (
                  <>
                    <Route path="kelas/:classId" element={<ClassDetail />} />
                    <Route path="kuis/:contentId" element={<QuizPage base={`${MODE_BASE.teacher}/kuis`} preview />} />
                  </>
                )}
                {role === 'student' && (
                  <>
                    <Route path="belajar/:contentId" element={<QuizPage />} />
                    <Route path="kelas/:classId" element={<StudentClass />} />
                    <Route path="kelas/:classId/kuis/:quizId" element={<TeacherQuizPlay />} />
                    <Route path="game/kilat-hitung" element={<KilatHitung />} />
                    <Route path="game/duel/:roomId" element={<DuelPage />} />
                    <Route path="game/susun-kata" element={<SusunKata />} />
                    <Route path="game/teka-pola" element={<TekaPola />} />
                  </>
                )}
              </Route>
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        </ConfirmProvider>
      </AuthProvider>
    </HashRouter>
  );
}
