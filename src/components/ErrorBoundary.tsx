import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/**
 * Penangkap galat tampilan. Tanpa ini, galat saat render (atau gagal memuat potongan kode setelah deploy baru)
 * membuat layar putih kosong. Sengaja tidak memakai router/komponen lain agar tetap tampil bila itu yang rusak.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PINTARA error:', error, info.componentStack);
    // Splash di index.html menutupi seluruh layar; buang agar pesan galat dan tombol Muat ulang terlihat.
    document.getElementById('splash')?.remove();
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div role="alert" style={{ maxWidth: 420, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif', color: '#2A3328' }}>
        <h1 style={{ fontSize: 26, margin: '24px 0 8px' }}>Ups, ada yang tidak beres</h1>
        <p>Halaman gagal dimuat. Coba muat ulang. Jika baru ada pembaruan, ini biasanya hilang setelah dimuat ulang.</p>
        <p style={{ fontSize: 13, wordBreak: 'break-word', background: '#FFF1BF', padding: 10, borderRadius: 12 }}>{error.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ height: 48, padding: '0 20px', borderRadius: 16, border: '2px solid #2A3328', background: '#478F3A', color: '#fff', fontSize: 16, fontWeight: 700 }}
        >
          Muat ulang
        </button>{' '}
        <a href={import.meta.env.BASE_URL} style={{ display: 'inline-block', padding: 12, color: '#2F74A5', fontWeight: 700 }}>
          Ke beranda
        </a>
      </div>
    );
  }
}
