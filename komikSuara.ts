/**
 * Suara pemandu Komik Pintar: Text-to-Speech bawaan peramban (tanpa berkas audio, tanpa unduhan).
 * Mutu dan ketersediaan suara bahasa Indonesia bergantung perangkat. Pengaturan hanya di perangkat ini.
 */
const KEY = 'pintara:komik:suara';

export const suaraTersedia = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

export function suaraAktif(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

export function stopBicara(): void {
  try {
    if (suaraTersedia()) window.speechSynthesis.cancel();
  } catch {
    /* abaikan */
  }
}

export function aturSuara(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* abaikan */
  }
  if (!on) stopBicara();
}

/** Bacakan satu kalimat (menggantikan yang sedang dibacakan). `paksa` mengabaikan pengaturan mati (untuk tombol ulang). */
export function bicara(teks: string, paksa = false): void {
  if (!suaraTersedia() || (!paksa && !suaraAktif())) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(teks);
    u.lang = 'id-ID';
    u.rate = 1;
    u.pitch = 1.15;
    const v = synth.getVoices().find((x) => x.lang.toLowerCase().startsWith('id'));
    if (v) u.voice = v;
    synth.speak(u);
  } catch {
    /* abaikan */
  }
}
