import type { ReactElement } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { MODE_BASE, NAV } from './navigation';
import { ModeLayout } from '@/layouts/ModeLayout';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { LandingPage } from '@/pages/LandingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DesignSystemPage } from '@/pages/DesignSystemPage';
import { StudentHome, StudentProfile } from '@/features/student/StudentPages';
import { LearnList, QuizPage } from '@/features/learning/LearnPages';
import { GameMenu, KilatHitung } from '@/features/games/GamePages';
import { TeacherClasses, TeacherHome, TeacherQuizzes, TeacherResults } from '@/features/teacher/TeacherPages';
import { ParentHome, ParentProgress, ParentSettings } from '@/features/parent/ParentPages';
import type { Role } from '@/types';

const ROLES: Role[] = ['student', 'teacher', 'parent'];

/** Halaman yang sudah dibangun, per mode dan path menu. Yang belum ada jatuh ke PlaceholderPage. */
const PAGES: Record<Role, Record<string, ReactElement>> = {
  student: { '': <StudentHome />, belajar: <LearnList />, game: <GameMenu />, profil: <StudentProfile /> },
  teacher: { '': <TeacherHome />, kelas: <TeacherClasses />, kuis: <TeacherQuizzes />, hasil: <TeacherResults /> },
  parent: { '': <ParentHome />, perkembangan: <ParentProgress />, pengaturan: <ParentSettings /> },
};

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
              </>
            )}
          </Route>
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}
