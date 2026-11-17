/** Menggabungkan nama class, mengabaikan nilai kosong. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
