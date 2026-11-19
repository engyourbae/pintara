/**
 * Pinta si burung hantu untuk layar memuat: melompat, mengepak, pensil bergoyang, huruf dan angka beterbangan,
 * tiga bintang menyala bergantian. Mata berkedip: jeda 2 dtk, kedip 1x, jeda 2 dtk, kedip 2x, lalu ulang.
 * Gaya (.lo-*) ada di styles/index.css dan salinannya di index.html (splash); jaga keduanya tetap sama.
 */
export function LoadingOwl() {
  return (
      <svg className="lo-svg" viewBox="0 0 260 262" aria-hidden="true" strokeLinejoin="round" strokeLinecap="round">
      <ellipse className="lo-shadow" cx="130" cy="216" rx="52" ry="8" fill="#2A3328" opacity=".2" />
      <g fontFamily="Fredoka, 'Baloo 2', system-ui, sans-serif" fontWeight="700" fontSize="28" stroke="#2A3328" strokeWidth="1.5" paintOrder="stroke">
      <text className="lo-sym s1" x="14" y="130" fill="#478F3A">A</text>
      <text className="lo-sym s2" x="226" y="112" fill="#F5C000">7</text>
      <text className="lo-sym s3" x="10" y="64" fill="#7CC4F0">+</text>
      <text className="lo-sym s4" x="230" y="58" fill="#F28A3B">?</text>
      <text className="lo-sym s5" x="222" y="170" fill="#478F3A">B</text>
      </g>
      <g transform="translate(30,16)">
      <g className="lo-body">
      <g stroke="#2A3328" strokeWidth="4">
      <path d="M52 52L60 20L90 44Z" fill="#478F3A" />
      <path d="M148 52L140 20L110 44Z" fill="#478F3A" />
      <ellipse cx="82" cy="186" rx="13" ry="6" fill="#F28A3B" strokeWidth="3" />
      <ellipse cx="118" cy="186" rx="13" ry="6" fill="#F28A3B" strokeWidth="3" />
      <g className="lo-wl"><path d="M42 108Q22 140 40 170Q56 152 54 118Z" fill="#478F3A" /></g>
      <g className="lo-wr"><path d="M158 108Q178 140 160 170Q144 152 146 118Z" fill="#478F3A" /></g>
      <ellipse cx="100" cy="112" rx="62" ry="70" fill="#5BAA4B" />
      <ellipse cx="100" cy="132" rx="38" ry="42" fill="#FFFDF6" strokeWidth="0" />
      <path d="M82 124q6 6 12 0M106 124q6 6 12 0M88 142q6 6 12 0M100 142q6 6 12 0" fill="none" stroke="#9FD093" strokeWidth="3" />
      <g transform="rotate(28 156 38)"><g className="lo-pen">
      <rect x="150" y="6" width="11" height="40" rx="2" fill="#F5C000" strokeWidth="3" />
      <path d="M150 46h11l-5.5 9z" fill="#FFE0B0" strokeWidth="3" />
      </g></g>
      </g>
      <g className="lo-eyes">
      <circle cx="76" cy="86" r="21" fill="#FFFDF6" stroke="#2A3328" strokeWidth="4" />
      <circle cx="124" cy="86" r="21" fill="#FFFDF6" stroke="#2A3328" strokeWidth="4" />
      <circle cx="80" cy="88" r="9" fill="#2A3328" />
      <circle cx="120" cy="88" r="9" fill="#2A3328" />
      <circle cx="83" cy="85" r="3.2" fill="#FFFDF6" />
      <circle cx="123" cy="85" r="3.2" fill="#FFFDF6" />
      </g>
      <path d="M91 104L109 104L100 118Z" fill="#F5C000" stroke="#2A3328" strokeWidth="3.5" />
      <ellipse cx="58" cy="108" rx="7" ry="4.5" fill="#FFB27A" opacity=".8" />
      <ellipse cx="142" cy="108" rx="7" ry="4.5" fill="#FFB27A" opacity=".8" />
      </g>
      </g>
      <g stroke="#2A3328" strokeWidth="1.6">
      <g transform="translate(88,236)"><path className="lo-star" d="M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6z" fill="#F5C000" /></g>
      <g transform="translate(118,236)"><path className="lo-star t2" d="M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6z" fill="#F5C000" /></g>
      <g transform="translate(148,236)"><path className="lo-star t3" d="M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6z" fill="#F5C000" /></g>
      </g>
      </svg>
  );
}
