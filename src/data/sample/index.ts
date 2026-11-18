import categoriesJson from './categories.json';
import contentsJson from './contents.json';
import { bankContents } from '@/data/bank';
import type { LearningCategory, LearningContent } from '@/types';

export const sampleCategories = categoriesJson.categories as LearningCategory[];

/** Paket contoh lama (id berawalan `contoh-`). Dihapus bertahap seiring bank soal nyata menggantikannya. */
const legacySamples = contentsJson.contents as LearningContent[];

/** Semua paket kuis: bank soal nyata lebih dulu, lalu sisa paket contoh. (Nama ekspor dipertahankan agar berkas lain tidak berubah.) */
export const sampleContents: LearningContent[] = [...bankContents, ...legacySamples];

/** Benar bila paket ini masih data contoh, bukan dari bank soal. */
export const isSampleContent = (c: LearningContent) => c.id.startsWith('contoh-');
