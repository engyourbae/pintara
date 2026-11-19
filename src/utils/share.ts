/** Salin/bagikan teks dan tautan undangan kelas. */
const INVITE_KEY = 'pintara:invite';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // lanjut ke cara cadangan (WebView/peramban lama)
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Tautan undangan: hanya membawa kode kelas. Murid tetap harus masuk, lalu guru yang menyetujui. */
export const inviteUrl = (code: string) => `${window.location.origin}${import.meta.env.BASE_URL}#/gabung/${code}`;

export function saveInvite(code: string): void {
  try {
    sessionStorage.setItem(INVITE_KEY, code);
  } catch {
    // penyimpanan tidak tersedia: murid cukup mengetik kode
  }
}

export function peekInvite(): string {
  try {
    return sessionStorage.getItem(INVITE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function clearInvite(): void {
  try {
    sessionStorage.removeItem(INVITE_KEY);
  } catch {
    // abaikan
  }
}
