/** Tipe inti PINTARA. Satu sumber kebenaran untuk seluruh aplikasi. */

export type Role = 'student' | 'parent' | 'teacher';
export type Grade = 1 | 2 | 3 | 4 | 5 | 6;
export type Difficulty = 1 | 2 | 3;

export type CategoryGroup =
  | 'sekolah'
  | 'pengetahuan-umum'
  | 'keterampilan-hidup'
  | 'berpikir'
  | 'literasi-digital';

export interface LearningCategory {
  id: string;
  group: CategoryGroup;
  name: string;
  /** Nama ikon (dipetakan ke komponen ikon di Fase C). */
  icon: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Indeks jawaban benar. Untuk multiplayer/kelas, kunci jawaban tidak boleh dibaca klien lawan (lihat docs/keamanan). */
  answerIndex: number;
  /** Penjelasan edukatif yang ditampilkan setelah menjawab. */
  explanation: string;
}

export interface LearningContent {
  id: string;
  categoryId: string;
  title: string;
  grades: Grade[];
  difficulty: Difficulty;
  /** Naik setiap konten diperbarui; dipakai untuk sinkronisasi unduhan offline. */
  version: number;
  questions: QuizQuestion[];
}

/** Penanda bahwa data berasal dari contoh, bukan data nyata. */
export interface SampleFlag {
  isSample: true;
}

/** Akun yang sudah masuk. Diambil dari dokumen `users/{uid}`; role TIDAK pernah berasal dari pilihan di frontend. */
export interface AppUser {
  uid: string;
  role: Role;
  displayName: string;
  /** Guru hanya sah bila true. Diubah manual lewat Firebase Console. */
  teacherVerified: boolean;
  /** Guru yang ditolak admin. */
  teacherRejected?: boolean;
  /** Hanya untuk akun anak. */
  parentUid?: string;
  grade?: Grade;
}

/** Ringkasan akun anak untuk halaman orang tua. */
export interface ChildSummary {
  uid: string;
  displayName: string;
  username: string;
  friendsEnabled: boolean;
  multiplayerEnabled: boolean;
  dailyLimitMinutes: number;
}

/** Kemajuan terbaik satu paket kuis (disimpan per akun di perangkat, disinkronkan ke Firestore). */
export interface QuizBest {
  /** Persen 0-100 dari percobaan terbaik. */
  score: number;
  correct: number;
  total: number;
  attempts: number;
}

export type MemberStatus = 'pending' | 'active' | 'removed';

export interface ClassInfo {
  id: string;
  name: string;
  grade: Grade;
  joinCode: string;
  archived: boolean;
}

export interface MemberRow {
  uid: string;
  displayName: string;
  status: MemberStatus;
  groupId?: string;
}

export interface ResultRow {
  uid: string;
  quizId: string;
  score: number;
  correct: number;
  total: number;
}

/** Keanggotaan kelas milik siswa. `className` hanya terbaca setelah guru menyetujui. */
export interface MyMembership {
  classId: string;
  status: MemberStatus;
  className?: string;
}

export interface ChildItem {
  contentId: string;
  bestScore: number;
  attempts: number;
  lastPlayedAt: Date | null;
}

export interface ChildProgress {
  child: ChildSummary;
  xp: number;
  items: ChildItem[];
}

/** Misi kelas dari guru: mengerjakan satu paket kuis atau memainkan satu game. */
export interface Mission {
  id: string;
  kind: 'quiz' | 'game';
  /** Id paket kuis, atau id game (kilat-hitung | susun-kata | teka-pola). */
  contentId: string;
  title: string;
  note: string;
}
