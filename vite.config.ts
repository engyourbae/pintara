import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Base path untuk GitHub Pages. Contoh: https://<user>.github.io/pintara/ -> '/pintara/'
// Atur lewat VITE_BASE_PATH (lihat .env.example). Default '/pintara/'.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/pintara/';

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    // Plugin PWA (vite-plugin-pwa) ditambahkan pada Fase G.
  };
});
