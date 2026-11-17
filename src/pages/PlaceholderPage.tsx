import { Link } from 'react-router-dom';
import { MODE_LABEL } from '@/app/navigation';
import type { Role } from '@/types';

interface Props {
  role: Role;
  title: string;
  phase: 'E' | 'F';
}

/** Halaman sementara. Jujur menyatakan belum dibangun. */
export function PlaceholderPage({ role, title, phase }: Props) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm font-semibold text-hijau-700">{MODE_LABEL[role]}</p>
      <h1 className="mt-1 text-3xl font-bold">{title}</h1>
      <p className="mt-4 rounded-2xl bg-kuning-100 p-4">
        Halaman ini belum dibuat. Rencana pembangunan: Fase {phase}.
      </p>
      <Link to="/" className="mt-6 inline-flex min-h-tap items-center rounded-2xl bg-hijau-500 px-5 font-semibold text-white">
        Kembali ke awal
      </Link>
    </main>
  );
}
