import { Link } from 'react-router-dom';
import { MODE_BASE, MODE_LABEL } from '@/app/navigation';
import { isFirebaseConfigured } from '@/services/firebase/config';
import type { Role } from '@/types';

const ROLES: Role[] = ['student', 'teacher', 'parent'];

/** Landing SEMENTARA (Fase B). Landing sebenarnya dibuat di Fase D. */
export function LandingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-bold text-hijau-700">PINTARA</h1>
      <p className="mt-1 text-lg">Belajar Bersama, Berkembang Bersama!</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {ROLES.map((role) => (
          <li key={role}>
            <Link
              to={MODE_BASE[role]}
              className="flex min-h-tap items-center justify-center rounded-2xl bg-gading p-4 text-center font-semibold shadow-sm ring-2 ring-hijau-300"
            >
              {MODE_LABEL[role]}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 rounded-2xl bg-langit-100 p-4 text-sm">
        Status Firebase: {isFirebaseConfigured ? 'config terisi (belum diuji)' : 'belum dikonfigurasi'}. Tahap pondasi: semua
        halaman masih kerangka.
      </p>
    </main>
  );
}
