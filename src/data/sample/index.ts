import categoriesJson from './categories.json';
import contentsJson from './contents.json';
import type { LearningCategory, LearningContent } from '@/types';

/** DATA CONTOH. Diganti oleh konten dari Firestore/unduhan offline di fase berikutnya. */
export const sampleCategories = categoriesJson.categories as LearningCategory[];
export const sampleContents = contentsJson.contents as LearningContent[];
