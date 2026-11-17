/** Syarat sandi orang tua/guru. Satu sumber untuk centang di layar dan validasi di layanan. */
export interface PasswordRule {
  id: string;
  label: string;
  test: (v: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'len', label: 'Minimal 8 karakter', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Huruf besar (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Huruf kecil (a–z)', test: (v) => /[a-z]/.test(v) },
  { id: 'digit', label: 'Angka (0–9)', test: (v) => /\d/.test(v) },
  { id: 'symbol', label: 'Simbol (contoh: ! @ # $ %)', test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

export const passwordOk = (v: string): boolean => PASSWORD_RULES.every((r) => r.test(v));
