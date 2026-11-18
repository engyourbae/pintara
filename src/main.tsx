import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import '@/styles/index.css';
import '@/utils/noZoom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <UpdatePrompt />
    </ErrorBoundary>
  </StrictMode>,
);
