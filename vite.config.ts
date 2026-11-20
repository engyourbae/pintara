import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
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

// Service worker offline untuk aplikasi utama (BUKAN admin). Ditulis ke dist/sw.js saat build, berisi daftar
// berkas yang di-cache di awal: HTML, JS/CSS aplikasi utama (termasuk potongan lazy), font Latin, dan ikon.
// Aplikasi admin dan version.json sengaja tidak ditangani (selalu lewat jaringan).
const STATIC_FILES = ['index.html', 'manifest.webmanifest', 'favicon.svg', 'logo.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

const serviceWorkerFile = (base: string): Plugin => ({
  name: 'pintara-service-worker',
  apply: 'build',
  writeBundle(options, bundle) {
    const files = new Set<string>();
    const walk = (name: string) => {
      const item = bundle[name];
      if (!item || files.has(name) || item.type !== 'chunk') return;
      files.add(name);
      item.imports.forEach(walk);
      item.dynamicImports.forEach(walk);
      item.viteMetadata?.importedCss.forEach((f) => files.add(f));
      item.viteMetadata?.importedAssets.forEach((f) => files.add(f));
    };
    for (const item of Object.values(bundle)) {
      if (item.type === 'chunk' && item.isEntry && item.name === 'main') walk(item.fileName);
    }
    // Font: hanya subset Latin yang dibutuhkan bahasa Indonesia; subset lain di-cache saat dipakai.
    const precache = [...files].filter((f) => !f.endsWith('.woff2') || f.includes('-latin-wght-normal'));
    const urls = ['', ...STATIC_FILES, ...precache].map((f) => base + f);
    const source = `// Dibuat otomatis oleh vite.config.ts. Jangan diedit.
const CACHE = 'pintara-${BUILD_ID}';
const BASE = ${JSON.stringify(base)};
const PRECACHE = ${JSON.stringify(urls)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pintara-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  const rel = url.pathname.slice(BASE.length);
  if (rel.startsWith('admin/') || rel === 'version.json' || rel === 'sw.js') return;

  if (req.mode === 'navigate') {
    // Jaringan dulu (agar versi baru terambil), tetapi jangan menunggu lebih dari 4 detik: bila jaringan lambat/menggantung
    // atau offline, pakai index.html tersimpan (berpasangan dengan berkas JS yang juga tersimpan). Tanpa salinan, tunggu jaringan.
    event.respondWith((async () => {
      const saved = () => caches.match(BASE + 'index.html', { ignoreSearch: true }).then((r) => r || caches.match(BASE));
      const net = fetch(req);
      const slow = new Promise((resolve) => setTimeout(() => resolve(null), 4000));
      try {
        const first = await Promise.race([net, slow]);
        if (first) return first;
        return (await saved()) || net;
      } catch (e) {
        return (await saved()) || Response.error();
      }
    })());
    return;
  }
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    }),
  );
});
`;
    fs.writeFileSync(path.join(options.dir ?? 'dist', 'sw.js'), source);
  },
});

// Base path untuk GitHub Pages. Contoh: https://<user>.github.io/pintara/ -> '/pintara/'
// Atur lewat VITE_BASE_PATH (lihat .env.example). Default '/pintara/'.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/pintara/';

  return {
    base,
    plugins: [react(), versionFile(), serviceWorkerFile(base)],
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
  };
});
