import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfirmProvider } from '@/components/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminPage } from '@/features/admin/AdminPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { AuthProvider } from '@/hooks/useAuth';
import '@/styles/index.css';
import '@/utils/noZoom';

/** Titik masuk aplikasi PINTARA Admin (terpisah dari aplikasi utama; dibangun dari repo yang sama). */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <ConfirmProvider>
            {/* Warna papan tulis (sama dengan Ruang Guru) sebagai identitas aplikasi admin. */}
            <div data-mode="teacher">
              <Routes>
                <Route path="/" element={<AdminPage />} />
                <Route path="/masuk" element={<LoginPage home="/" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </ConfirmProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
);
