/** iOS Safari mengabaikan user-scalable=no; cegah gestur cubit-zoom secara eksplisit. Impor sekali di tiap titik masuk. */
['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }),
);

/** Tahan lama pada tautan/gambar/teks tidak memunculkan menu peramban (Salin URL, Penelusuran web, dst.). Kolom isian tetap normal. */
document.addEventListener('contextmenu', (e) => {
  if (e.target instanceof Element && e.target.closest("input, textarea, [contenteditable='true'], .boleh-pilih")) return;
  e.preventDefault();
});
