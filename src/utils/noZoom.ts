/** iOS Safari mengabaikan user-scalable=no; cegah gestur cubit-zoom secara eksplisit. Impor sekali di tiap titik masuk. */
['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }),
);
