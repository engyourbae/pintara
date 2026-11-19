/** Layar memuat yang ceria: logo melayang + tiga titik memantul. Dipakai bersama splash di index.html agar peralihannya mulus. */
export function LoadingScreen({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[70vh] flex-col items-center justify-center gap-5 p-6 text-center">
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={88} height={88} className="muat-logo" />
      <p className="font-display text-xl font-semibold">{label}</p>
      <span className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="muat-dot h-3 w-3 rounded-full border-2 border-tinta bg-kuning-500" style={{ animationDelay: `${i * 140}ms` }} />
        ))}
      </span>
    </div>
  );
}
