import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineNotice } from '@/components/OfflineNotice';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { registerServiceWorker } from '@/services/offline/sw';
import '@/styles/index.css';
import '@/utils/noZoom';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <OfflineNotice />
      <UpdatePrompt />
    </ErrorBoundary>
  </StrictMode>,
);

// Hapus splash setelah aplikasi tampil, tapi minimal ±0,6 dtk sejak halaman dibuka agar animasinya sempat terlihat.
const MIN_SPLASH_MS = 600;
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    const splash = document.getElementById('splash');
    if (!splash) return;
    window.setTimeout(() => {
      splash.classList.add('bye');
      window.setTimeout(() => splash.remove(), 350);
    }, Math.max(0, MIN_SPLASH_MS - performance.now()));
  }),
);
