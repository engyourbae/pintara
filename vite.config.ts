import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// ID unik per build. Disisipkan ke aplikasi (__BUILD_ID__) dan ditulis ke version.json di hasil build,
// sehingga aplikasi yang sedang terbuka bisa tahu bila ada versi yang lebih baru.
const BUILD_ID = Date.now().toString(36);
const versionFile = (): Plugin => ({
  name: 'pintara-version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID }) });
  },
});

// Base path untuk GitHub Pages. Contoh: https://<user>.github.io/pintara/ -> '/pintara/'
// Atur lewat VITE_BASE_PATH (lihat .env.example). Default '/pintara/'.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/pintara/';

  return {
    base,
    plugins: [react(), versionFile()],
    define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
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
