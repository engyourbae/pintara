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

