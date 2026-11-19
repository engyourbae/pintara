/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Font dibundel lewat @fontsource (tanpa unduhan saat runtime, aman offline).
        sans: ['"Nunito Variable"', 'ui-rounded', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        display: ['"Fredoka Variable"', '"Nunito Variable"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        kertas: '0 2px 0 rgba(42,51,40,0.08), 0 6px 14px -6px rgba(42,51,40,0.18)',
        // Bayangan keras bergaya stiker: satu bahasa visual untuk kartu dan tombol.
        stiker: '0 4px 0 0 #2A3328',
        'stiker-sm': '0 2px 0 0 #2A3328',
      },
      colors: {
        // Aksen per mode (nilai diatur lewat CSS variable di styles/index.css, [data-mode]).
        aksen: { DEFAULT: 'var(--aksen)', tua: 'var(--aksen-tua)', muda: 'var(--aksen-muda)' },
        papan: '#2F4A3A',
        hijau: { 50: '#EEF7EC', 100: '#D9EDD4', 300: '#9FD093', 500: '#5BAA4B', 600: '#478F3A', 700: '#376F2E' },
        kuning: { 100: '#FFF1BF', 300: '#FFDE6B', 500: '#F5C000' },
        langit: { 100: '#DCEFFB', 300: '#9CCBEB', 500: '#4A9AD0', 700: '#2F74A5' },
        jingga: { 300: '#FFB27A', 500: '#F28A3B', 600: '#D9701F' },
        merah: { 100: '#FDE3DE', 600: '#B83A27' },
        krem: '#FBF6E9',
        gading: '#FFFDF6',
        tinta: '#2A3328',
      },
      minHeight: { tap: '48px' },
      minWidth: { tap: '48px' },
      keyframes: {
        naik: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pop: { '0%': { opacity: '0', transform: 'scale(0.6)' }, '70%': { transform: 'scale(1.08)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        melayang: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        goyang: { '0%,100%': { transform: 'rotate(-4deg)' }, '50%': { transform: 'rotate(4deg)' } },
        kedip: { '0%,43.5%,47%,90%,93.4%,94.6%,98%,100%': { transform: 'scaleY(1)' }, '45.2%,91.6%,96.2%': { transform: 'scaleY(0.1)' } },
        getar: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
        berkilau: { '0%,100%': { opacity: '0.35', transform: 'scale(0.85)' }, '50%': { opacity: '1', transform: 'scale(1.1)' } },
      },
      animation: {
        naik: 'naik 0.55s cubic-bezier(0.22,1,0.36,1) both',
        pop: 'pop 0.5s cubic-bezier(0.22,1,0.36,1) both',
        melayang: 'melayang 4s ease-in-out infinite',
        goyang: 'goyang 2.4s ease-in-out infinite',
        kedip: 'kedip 4.6s ease-in-out infinite',
        getar: 'getar 0.35s ease-in-out',
        berkilau: 'berkilau 2.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
