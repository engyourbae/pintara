import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Halaman tidak ditemukan</h1>
      <Link to="/" className="mt-6 inline-flex min-h-tap items-center rounded-2xl bg-hijau-500 px-5 font-semibold text-white">
        Kembali ke awal
      </Link>
    </main>
  );
}
