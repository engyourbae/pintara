/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Font sistem: tidak butuh unduhan, aman untuk offline.
        sans: ['ui-rounded', '"Nunito"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        kertas: '0 2px 0 rgba(42,51,40,0.08), 0 6px 14px -6px rgba(42,51,40,0.18)',
      },
      colors: {
        // Aksen per mode (nilai diatur lewat CSS variable di styles/index.css, [data-mode]).
        aksen: { DEFAULT: 'var(--aksen)', tua: 'var(--aksen-tua)', muda: 'var(--aksen-muda)' },
        papan: '#2F4A3A',
        hijau: { 50: '#EEF7EC', 100: '#D9EDD4', 300: '#9FD093', 500: '#5BAA4B', 600: '#478F3A', 700: '#376F2E' },
        kuning: { 100: '#FFF1BF', 300: '#FFDE6B', 500: '#F5C000' },
        langit: { 100: '#DCEFFB', 300: '#9CCBEB', 500: '#4A9AD0', 700: '#2F74A5' },
        jingga: { 300: '#FFB27A', 500: '#F28A3B', 600: '#D9701F' },
        krem: '#FBF6E9',
        gading: '#FFFDF6',
        tinta: '#2A3328',
      },
      minHeight: { tap: '48px' },
      minWidth: { tap: '48px' },
    },
  },
  plugins: [],
};
