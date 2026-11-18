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
    // Dua aplikasi dari satu repo: utama (/) dan admin (/admin/). Masing-masing punya manifest & scope sendiri.
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin/index.html'),
        },
      },
    },
    // Plugin PWA (vite-plugin-pwa) ditambahkan pada Fase G.
  };
});
