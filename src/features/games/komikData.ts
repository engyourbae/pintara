import type { FlowerColor, Mood } from './KomikArt';

/** Data dan aturan Komik Pintar. Level 1 (taman) dan Level 2 (kamar); level lain mengikuti pola yang sama. */

export type KObjKind =
  | 'flower' | 'can' | 'butterfly' | 'book' | 'doll' | 'block' | 'car' | 'key'
  | 'apple' | 'banana' | 'glass' | 'plate' | 'spoon' | 'pencil' | 'eraser' | 'bag' | 'ball'
  | 'shell' | 'starfish' | 'bucket' | 'spade' | 'hat' | 'carrot' | 'tomato' | 'corn' | 'hoe' | 'cone';
export type KScene = 'taman' | 'kamar' | 'dapur' | 'kelas' | 'pantai' | 'kebun';

export interface KObj {
  id: string;
  kind: KObjKind;
  /** Nama lengkap untuk kalimat, mis. "bunga merah". */
  name: string;
  /** Label pendek di daftar bawah. */
  label: string;
  color?: FlowerColor;
  /** Letak di adegan (satuan 360×420). */
  x: number;
  y: number;
  /** Petunjuk bertahap mencari: umum dulu, lalu lebih jelas. */
  hints: [string, string];
  /** Petunjuk meletakkan setelah benda ditemukan. */
  placeHint: string;
}

export interface KTarget {
  id: string;
  /** Id benda yang diterima. */
  accepts: string[];
  /** Jumlah benda yang muat. */
  cap: number;
  x: number;
  y: number;
  r: number;
  /** Nama tempat untuk kalimat penolakan. */
  label: string;
  band?: string;
  kind: 'pot' | 'plant' | 'shelf' | 'bed' | 'box' | 'wardrobe' | 'basket' | 'rack' | 'drawer' | 'case' | 'hook' | 'castle' | 'umbrella' | 'shed' | 'scarecrow';
}

export interface KState {
  found: string[];
  /** targetId -> id benda yang sudah diletakkan. */
  placed: Record<string, string[]>;
}

export interface KMission {
  id: string;
  text: string;
  done: (s: KState) => boolean;
}

export interface KLevel {
  id: string;
  title: string;
  desc: string;
  scene: KScene;
  /** Kunci gameBest (bintang×1000 + skor). Level 1 memakai 'komik' (nama lama). */
  bestKey: string;
  seconds: number;
  objs: KObj[];
  targets: KTarget[];
  intro: { text: string; mood: Mood }[];
  missions: KMission[];
  win: string;
  /** Kalimat tambahan setelah satu benda ditemukan (mis. semua bunga ketemu). */
  afterFound?: (o: KObj, s: KState) => string | undefined;
}

const has = (s: KState, ...ids: string[]) => ids.every((i) => s.found.includes(i));
const filled = (s: KState, t: string, n = 1) => (s.placed[t]?.length ?? 0) >= n;

/* ───────── Level 1: Taman Kesayangan ───────── */

export const LEVEL1: KLevel = {
  id: 'taman',
  title: 'Taman Kesayangan',
  desc: 'Taman jadi berantakan. Temukan 3 bunga, penyiram, dan kupu-kupu, lalu rapikan.',
  scene: 'taman',
  bestKey: 'komik',
  seconds: 90,
  objs: [
    { id: 'f-merah', kind: 'flower', color: 'merah', name: 'bunga merah', label: 'Bunga merah', x: 318, y: 224, hints: ['Ada bunga yang malu-malu bersembunyi di balik semak.', 'Lihat semak hijau di sisi kanan. Ada yang mengintip!'], placeHint: 'Seret bunga ke pot yang warna garisnya sama.' },
    { id: 'f-kuning', kind: 'flower', color: 'kuning', name: 'bunga kuning', label: 'Bunga kuning', x: 34, y: 262, hints: ['Bunga kuning suka berdiri dekat pohon besar.', 'Lihat rumput di dekat batang pohon.'], placeHint: 'Seret bunga ke pot yang warna garisnya sama.' },
    { id: 'f-jambu', kind: 'flower', color: 'jambu', name: 'bunga merah muda', label: 'Bunga merah muda', x: 150, y: 258, hints: ['Ada bunga yang berteduh di bawah tempat duduk.', 'Coba lihat di bawah bangku taman.'], placeHint: 'Seret bunga ke pot yang warna garisnya sama.' },
    { id: 'can', kind: 'can', name: 'penyiram tanaman', label: 'Penyiram', x: 96, y: 250, hints: ['Penyiramnya ada di dekat kaki bangku.', 'Lihat di antara pohon dan bangku, sisi kiri.'], placeHint: 'Seret penyiram ke tanaman yang layu.' },
    { id: 'kupu', kind: 'butterfly', name: 'kupu-kupu', label: 'Kupu-kupu', x: 205, y: 166, hints: ['Kupu-kupu ungu suka hinggap di tempat tinggi.', 'Lihat pagar putih di belakang taman.'], placeHint: '' },
  ],
  targets: [
    { id: 'pot-merah', accepts: ['f-merah'], cap: 1, x: 140, y: 352, r: 28, label: 'pot', band: '#F0506E', kind: 'pot' },
    { id: 'pot-kuning', accepts: ['f-kuning'], cap: 1, x: 184, y: 352, r: 28, label: 'pot', band: '#FFC83D', kind: 'pot' },
    { id: 'pot-jambu', accepts: ['f-jambu'], cap: 1, x: 228, y: 352, r: 28, label: 'pot', band: '#FF8FB1', kind: 'pot' },
    { id: 'plant', accepts: ['can'], cap: 1, x: 236, y: 268, r: 32, label: 'tanaman layu', kind: 'plant' },
  ],
  intro: [
    { text: 'Hai! Aku punya masalah kecil. Bisa bantu aku?', mood: 'wave' },
    { text: 'Aku ingin taman ini jadi indah lagi. Tapi beberapa benda hilang!', mood: 'sad' },
    { text: 'Cari tiga bunga, satu penyiram, dan satu kupu-kupu yang bersembunyi. Ketuk bendanya kalau ketemu!', mood: 'point' },
    { text: 'Lalu seret bunga ke pot yang warna garisnya sama, dan seret penyiram ke tanaman yang layu. Waktumu 90 detik!', mood: 'excited' },
  ],
  missions: [
    { id: 'm1', text: 'Cari 3 bunga yang tersembunyi', done: (s) => has(s, 'f-merah', 'f-kuning', 'f-jambu') },
    { id: 'm2', text: 'Cari penyiram tanaman', done: (s) => has(s, 'can') },
    { id: 'm3', text: 'Seret bunga ke pot yang warnanya sama', done: (s) => filled(s, 'pot-merah') && filled(s, 'pot-kuning') && filled(s, 'pot-jambu') },
    { id: 'm4', text: 'Seret penyiram ke tanaman yang layu', done: (s) => filled(s, 'plant') },
    { id: 'm5', text: 'Temukan kupu-kupu yang tersembunyi', done: (s) => has(s, 'kupu') },
  ],
  win: 'Wow! Tamanku jadi indah lagi. Terima kasih!',
  afterFound: (o, s) => (o.kind === 'flower' && has(s, 'f-merah', 'f-kuning', 'f-jambu') ? 'Semua bunga sudah ketemu! Sekarang letakkan di pot yang kosong.' : undefined),
};

/* ───────── Level 2: Kamar Berantakan ───────── */

export const LEVEL2: KLevel = {
  id: 'kamar',
  title: 'Kamar Berantakan',
  desc: 'Kamarnya berantakan! Temukan buku, boneka, dua mainan, dan kunci, lalu rapikan semuanya.',
  scene: 'kamar',
  bestKey: 'komik-kamar',
  seconds: 80,
  objs: [
    { id: 'buku', kind: 'book', name: 'buku', label: 'Buku', x: 112, y: 264, hints: ['Ada buku yang terselip di dekat tempat tidur.', 'Lihat di bawah tempat tidur, di sisi kanan.'], placeHint: 'Seret buku ke rak di dinding.' },
    { id: 'boneka', kind: 'doll', name: 'boneka', label: 'Boneka', x: 252, y: 232, hints: ['Boneka itu mengintip dari balik perabot besar.', 'Lihat di samping lemari, sisi kiri.'], placeHint: 'Seret boneka ke tempat tidur.' },
    { id: 'balok', kind: 'block', name: 'balok mainan', label: 'Balok', x: 60, y: 112, hints: ['Ada mainan yang bersembunyi di dekat jendela.', 'Lihat di lipatan tirai jendela.'], placeHint: 'Seret mainan ke kotak mainan di lantai.' },
    { id: 'mobil', kind: 'car', name: 'mobil mainan', label: 'Mobil', x: 232, y: 286, hints: ['Mobil mainan itu menyelinap ke bawah sesuatu di lantai.', 'Lihat ujung karpet di lantai.'], placeHint: 'Seret mainan ke kotak mainan di lantai.' },
    { id: 'kunci', kind: 'key', name: 'kunci', label: 'Kunci', x: 38, y: 205, hints: ['Kunci kecil itu menyelip di tempat yang empuk.', 'Lihat di balik bantal di tempat tidur.'], placeHint: 'Kunci itu untuk lemari yang terkunci. Seret ke lemari.' },
  ],
  targets: [
    { id: 'rak', accepts: ['buku'], cap: 1, x: 192, y: 150, r: 36, label: 'rak buku', kind: 'shelf' },
    { id: 'kasur', accepts: ['boneka'], cap: 1, x: 68, y: 222, r: 36, label: 'tempat tidur', kind: 'bed' },
    { id: 'kotak', accepts: ['balok', 'mobil'], cap: 2, x: 184, y: 350, r: 38, label: 'kotak mainan', kind: 'box' },
    { id: 'lemari', accepts: ['kunci'], cap: 1, x: 304, y: 200, r: 34, label: 'lemari', kind: 'wardrobe' },
  ],
  intro: [
    { text: 'Aduh! Kamarku berantakan. Bisa bantu merapikannya?', mood: 'sad' },
    { text: 'Cari buku, boneka, dua mainan, dan kunci lemari yang hilang. Ketuk bendanya kalau ketemu!', mood: 'point' },
    { text: 'Buku ke rak, boneka ke tempat tidur, mainan ke kotak, dan kunci ke lemari. Waktumu 80 detik!', mood: 'excited' },
  ],
  missions: [
    { id: 'm1', text: 'Temukan buku yang tersembunyi', done: (s) => has(s, 'buku') },
    { id: 'm2', text: 'Seret buku ke rak', done: (s) => filled(s, 'rak') },
    { id: 'm3', text: 'Cari boneka dan taruh di tempat tidur', done: (s) => filled(s, 'kasur') },
    { id: 'm4', text: 'Letakkan 2 mainan ke dalam kotak', done: (s) => filled(s, 'kotak', 2) },
    { id: 'm5', text: 'Temukan kunci dan buka lemari', done: (s) => filled(s, 'lemari') },
  ],
  win: 'Yeay! Kamarku rapi dan wangi. Terima kasih banyak!',
  afterFound: (o) => {
    if (o.kind === 'book') return 'Bukunya ketemu! Seret ke rak di dinding.';
    if (o.kind === 'doll') return 'Bonekanya ketemu! Dia ingin tidur di kasur.';
    if (o.kind === 'key') return 'Kuncinya ketemu! Coba buka lemari yang terkunci.';
    return undefined;
  },
};


/* ───────── Level 3: Dapur Ceria ───────── */

export const LEVEL3: KLevel = {
  id: 'dapur',
  title: 'Dapur Ceria',
  desc: 'Dapurnya kacau! Temukan apel, pisang, gelas, piring, dan sendok, lalu simpan di tempatnya.',
  scene: 'dapur',
  bestKey: 'komik-dapur',
  seconds: 75,
  objs: [
    { id: 'apel', kind: 'apple', name: 'apel', label: 'Apel', x: 132, y: 292, hints: ['Ada buah merah yang menggelinding jauh dari meja.', 'Lihat lantai di dekat sisi kiri meja.'], placeHint: 'Seret apel ke keranjang buah.' },
    { id: 'pisang', kind: 'banana', name: 'pisang', label: 'Pisang', x: 140, y: 157, hints: ['Pisang kuning itu santai di atas meja dapur.', 'Lihat ujung kiri meja dapur.'], placeHint: 'Seret pisang ke keranjang buah.' },
    { id: 'gelas', kind: 'glass', name: 'gelas', label: 'Gelas', x: 150, y: 92, hints: ['Gelas bening itu berdiri di tempat yang terkena sinar matahari.', 'Lihat ambang jendela.'], placeHint: 'Seret gelas ke rak di dinding.' },
    { id: 'piring', kind: 'plate', name: 'piring', label: 'Piring', x: 322, y: 264, hints: ['Piring putih itu bersandar di kaki meja dapur.', 'Lihat lantai di sisi kanan.'], placeHint: 'Seret piring ke rak di dinding.' },
    { id: 'sendok', kind: 'spoon', name: 'sendok', label: 'Sendok', x: 300, y: 162, hints: ['Sendok itu berenang di tempat cuci.', 'Lihat bak cuci di meja dapur.'], placeHint: 'Seret sendok ke laci.' },
  ],
  targets: [
    { id: 'keranjang', accepts: ['apel', 'pisang'], cap: 2, x: 190, y: 340, r: 40, label: 'keranjang buah', kind: 'basket' },
    { id: 'rak', accepts: ['gelas', 'piring'], cap: 2, x: 296, y: 98, r: 40, label: 'rak piring', kind: 'rack' },
    { id: 'laci', accepts: ['sendok'], cap: 1, x: 235, y: 198, r: 32, label: 'laci', kind: 'drawer' },
  ],
  intro: [
    { text: 'Wah, dapurku berantakan! Ayo bantu aku merapikannya.', mood: 'sad' },
    { text: 'Cari apel, pisang, gelas, piring, dan sendok. Ketuk bendanya kalau ketemu!', mood: 'point' },
    { text: 'Buah ke keranjang, gelas dan piring ke rak, sendok ke laci. Waktumu 75 detik!', mood: 'excited' },
  ],
  missions: [
    { id: 'm1', text: 'Cari apel dan pisang', done: (s) => has(s, 'apel', 'pisang') },
    { id: 'm2', text: 'Letakkan 2 buah ke keranjang', done: (s) => filled(s, 'keranjang', 2) },
    { id: 'm3', text: 'Cari gelas dan piring, taruh di rak', done: (s) => filled(s, 'rak', 2) },
    { id: 'm4', text: 'Temukan sendok dan simpan di laci', done: (s) => filled(s, 'laci') },
  ],
  win: 'Dapurku rapi dan wangi. Terima kasih, koki hebat!',
};

/* ───────── Level 4: Ruang Kelas ───────── */

export const LEVEL4: KLevel = {
  id: 'kelas',
  title: 'Ruang Kelas',
  desc: 'Kelasnya berantakan! Temukan pensil, penghapus, buku, tas, dan bola, lalu rapikan.',
  scene: 'kelas',
  bestKey: 'komik-kelas',
  seconds: 75,
  objs: [
    { id: 'pensil', kind: 'pencil', name: 'pensil', label: 'Pensil', x: 160, y: 338, hints: ['Pensil itu menggelinding ke kolong meja.', 'Lihat lantai di bawah meja.'], placeHint: 'Seret pensil ke kotak pensil di meja.' },
    { id: 'penghapus', kind: 'eraser', name: 'penghapus', label: 'Penghapus', x: 250, y: 119, hints: ['Penghapus itu istirahat di bawah papan tulis.', 'Lihat tempat kapur di papan.'], placeHint: 'Seret penghapus ke kotak pensil di meja.' },
    { id: 'buku', kind: 'book', name: 'buku tulis', label: 'Buku', x: 134, y: 283, hints: ['Buku tulis itu terbuka di atas meja.', 'Lihat ujung kiri meja.'], placeHint: 'Seret buku ke rak buku.' },
    { id: 'tas', kind: 'bag', name: 'tas', label: 'Tas', x: 292, y: 268, hints: ['Tas merah itu bersandar di dekat rak.', 'Lihat lantai di dekat rak buku.'], placeHint: 'Seret tas ke gantungan di dinding.' },
    { id: 'bola', kind: 'ball', name: 'bola', label: 'Bola', x: 62, y: 232, hints: ['Bola oranye itu menggelinding ke sudut kiri.', 'Lihat dekat gantungan tas.'], placeHint: 'Seret bola ke keranjang bola.' },
  ],
  targets: [
    { id: 'kotakpensil', accepts: ['pensil', 'penghapus'], cap: 2, x: 200, y: 288, r: 30, label: 'kotak pensil', kind: 'case' },
    { id: 'rak', accepts: ['buku'], cap: 1, x: 321, y: 188, r: 40, label: 'rak buku', kind: 'shelf' },
    { id: 'gantung', accepts: ['tas'], cap: 1, x: 40, y: 142, r: 30, label: 'gantungan tas', kind: 'hook' },
    { id: 'keranjang', accepts: ['bola'], cap: 1, x: 160, y: 210, r: 32, label: 'keranjang bola', kind: 'basket' },
  ],
  intro: [
    { text: 'Selamat pagi! Kelas kita berantakan sebelum belajar.', mood: 'sad' },
    { text: 'Cari pensil, penghapus, buku, tas, dan bola. Ketuk bendanya kalau ketemu!', mood: 'point' },
    { text: 'Alat tulis ke kotak pensil, buku ke rak, tas ke gantungan, bola ke keranjang. Waktumu 75 detik!', mood: 'excited' },
  ],
  missions: [
    { id: 'm1', text: 'Cari pensil dan penghapus', done: (s) => has(s, 'pensil', 'penghapus') },
    { id: 'm2', text: 'Taruh 2 alat tulis di kotak pensil', done: (s) => filled(s, 'kotakpensil', 2) },
    { id: 'm3', text: 'Rapikan buku di rak', done: (s) => filled(s, 'rak') },
    { id: 'm4', text: 'Gantung tas di gantungan', done: (s) => filled(s, 'gantung') },
    { id: 'm5', text: 'Simpan bola di keranjang', done: (s) => filled(s, 'keranjang') },
  ],
  win: 'Hore! Kelas kita rapi. Siap belajar!',
};

/* ───────── Level 5: Pantai Seru ───────── */

export const LEVEL5: KLevel = {
  id: 'pantai',
  title: 'Pantai Seru',
  desc: 'Pantainya seru tapi berantakan! Temukan kerang, bintang laut, ember, sekop, dan topi.',
  scene: 'pantai',
  bestKey: 'komik-pantai',
  seconds: 70,
  objs: [
    { id: 'kerang', kind: 'shell', name: 'kerang', label: 'Kerang', x: 30, y: 244, hints: ['Kerang cantik itu bersembunyi dekat batu.', 'Lihat sudut kiri, dekat batu di tepi laut.'], placeHint: 'Seret kerang ke istana pasir.' },
    { id: 'bintang', kind: 'starfish', name: 'bintang laut', label: 'Bintang laut', x: 252, y: 226, hints: ['Bintang laut itu bermain di tepi ombak.', 'Lihat tepi laut di sisi kanan.'], placeHint: 'Seret bintang laut ke istana pasir.' },
    { id: 'ember', kind: 'bucket', name: 'ember', label: 'Ember', x: 330, y: 256, hints: ['Ember biru itu berteduh di bawah pohon kelapa.', 'Lihat dekat batang pohon di kanan.'], placeHint: 'Seret ember ke keranjang pantai.' },
    { id: 'sekop', kind: 'spade', name: 'sekop', label: 'Sekop', x: 150, y: 390, hints: ['Sekop itu setengah terkubur di pasir.', 'Lihat pasir di bagian bawah, di tengah.'], placeHint: 'Seret sekop ke keranjang pantai.' },
    { id: 'topi', kind: 'hat', name: 'topi', label: 'Topi', x: 150, y: 176, hints: ['Topi jerami itu ditiup angin ke laut.', 'Lihat ombak di tengah laut.'], placeHint: 'Seret topi ke payung pantai.' },
  ],
  targets: [
    { id: 'keranjang', accepts: ['ember', 'sekop'], cap: 2, x: 150, y: 300, r: 34, label: 'keranjang pantai', kind: 'basket' },
    { id: 'istana', accepts: ['kerang', 'bintang'], cap: 2, x: 205, y: 350, r: 40, label: 'istana pasir', kind: 'castle' },
    { id: 'payung', accepts: ['topi'], cap: 1, x: 300, y: 236, r: 34, label: 'payung pantai', kind: 'umbrella' },
  ],
  intro: [
    { text: 'Pantai ini indah, tapi barang-barangku berserakan!', mood: 'sad' },
    { text: 'Cari kerang, bintang laut, ember, sekop, dan topi. Ketuk bendanya kalau ketemu!', mood: 'point' },
    { text: 'Hias istana pasir, simpan ember dan sekop, dan gantung topi di payung. Waktumu 70 detik!', mood: 'excited' },
  ],
  missions: [
    { id: 'm1', text: 'Cari kerang dan bintang laut', done: (s) => has(s, 'kerang', 'bintang') },
    { id: 'm2', text: 'Hias istana pasir dengan 2 benda', done: (s) => filled(s, 'istana', 2) },
    { id: 'm3', text: 'Simpan ember dan sekop di keranjang', done: (s) => filled(s, 'keranjang', 2) },
    { id: 'm4', text: 'Letakkan topi di payung', done: (s) => filled(s, 'payung') },
  ],
  win: 'Wow! Pantainya rapi dan cantik. Terima kasih!',
};

/* ───────── Level 6: Kebun Sayur ───────── */

export const LEVEL6: KLevel = {
  id: 'kebun',
  title: 'Kebun Sayur',
  desc: 'Waktunya panen! Temukan wortel, tomat, jagung, cangkul, dan caping, lalu simpan di tempatnya.',
  scene: 'kebun',
  bestKey: 'komik-kebun',
  seconds: 80,
  objs: [
    { id: 'wortel', kind: 'carrot', name: 'wortel', label: 'Wortel', x: 258, y: 262, hints: ['Daun wortel mengintip dari dalam tanah.', 'Lihat bedeng di sisi kanan.'], placeHint: 'Seret wortel ke keranjang panen.' },
    { id: 'tomat', kind: 'tomato', name: 'tomat', label: 'Tomat', x: 140, y: 238, hints: ['Tomat merah itu bersembunyi di antara daun.', 'Lihat bedeng dekat jalan setapak.'], placeHint: 'Seret tomat ke keranjang panen.' },
    { id: 'jagung', kind: 'corn', name: 'jagung', label: 'Jagung', x: 200, y: 216, hints: ['Jagung kuning itu menjulang di tengah kebun.', 'Lihat di dekat pagar, bagian tengah.'], placeHint: 'Seret jagung ke keranjang panen.' },
    { id: 'cangkul', kind: 'hoe', name: 'cangkul', label: 'Cangkul', x: 126, y: 300, hints: ['Cangkul itu bersandar di tepi jalan.', 'Lihat pinggir jalan setapak, sisi kiri.'], placeHint: 'Seret cangkul ke gudang.' },
    { id: 'caping', kind: 'cone', name: 'caping', label: 'Caping', x: 330, y: 276, hints: ['Caping itu terbawa angin ke dekat bedeng.', 'Lihat rumput di sisi kanan.'], placeHint: 'Seret caping ke orang-orangan sawah.' },
  ],
  targets: [
    { id: 'keranjang', accepts: ['wortel', 'tomat', 'jagung'], cap: 3, x: 190, y: 350, r: 40, label: 'keranjang panen', kind: 'basket' },
    { id: 'gudang', accepts: ['cangkul'], cap: 1, x: 324, y: 208, r: 34, label: 'gudang', kind: 'shed' },
    { id: 'orang', accepts: ['caping'], cap: 1, x: 52, y: 222, r: 34, label: 'orang-orangan sawah', kind: 'scarecrow' },
  ],
  intro: [
    { text: 'Panen hampir tiba, tapi alat dan sayurku berpencar!', mood: 'sad' },
    { text: 'Cari wortel, tomat, jagung, cangkul, dan caping. Ketuk bendanya kalau ketemu!', mood: 'point' },
    { text: 'Sayur ke keranjang, cangkul ke gudang, caping ke orang-orangan sawah. Waktumu 80 detik!', mood: 'excited' },
  ],
  missions: [
    { id: 'm1', text: 'Cari 3 sayur', done: (s) => has(s, 'wortel', 'tomat', 'jagung') },
    { id: 'm2', text: 'Isi keranjang dengan 3 sayur', done: (s) => filled(s, 'keranjang', 3) },
    { id: 'm3', text: 'Simpan cangkul di gudang', done: (s) => filled(s, 'gudang') },
    { id: 'm4', text: 'Pasang caping di orang-orangan sawah', done: (s) => filled(s, 'orang') },
  ],
  win: 'Panen berhasil! Kebunku subur. Terima kasih!',
};

export const LEVELS: KLevel[] = [LEVEL1, LEVEL2, LEVEL3, LEVEL4, LEVEL5, LEVEL6];

/* ───────── Kemajuan di dalam satu permainan ───────── */

export const placedCount = (s: KState): number => Object.values(s.placed).reduce((n, a) => n + a.length, 0);
export const isPlaced = (s: KState, id: string): boolean => Object.values(s.placed).some((a) => a.includes(id));
export const missionsDone = (l: KLevel, s: KState): boolean[] => l.missions.map((m) => m.done(s));

/** Benda di daftar bawah: 'tersembunyi' (belum ketemu), 'siap' (bisa diseret), 'selesai'. */
export function chipState(s: KState, o: KObj): 'tersembunyi' | 'siap' | 'selesai' {
  if (!s.found.includes(o.id)) return 'tersembunyi';
  if (!o.placeHint) return 'selesai';
  return isPlaced(s, o.id) ? 'selesai' : 'siap';
}

/** Benda yang belum ditemukan, berurutan sesuai daftar (untuk petunjuk). */
export const nextHiddenObj = (l: KLevel, s: KState): KObj | undefined => l.objs.find((o) => !s.found.includes(o.id));

/* ───────── Skor, bintang, hadiah ───────── */

export interface KResult {
  stars: number;
  score: number;
  coins: number;
  gained: number;
}

/** Bintang: 3 bila selesai dengan sisa waktu ≥ 50% dan bantuan ≤ 1; 2 bila sisa ≥ 20%; selain itu 1. Gagal (waktu habis) = 0. */
export function starsFor(done: boolean, left: number, total: number, helps: number): number {
  if (!done) return 0;
  if (left >= total * 0.5 && helps <= 1) return 3;
  if (left >= total * 0.2) return 2;
  return 1;
}

/** Skor: 50 per benda ditemukan, 50 per benda diletakkan, 2 per detik tersisa, dikurangi 30 per bantuan. Tidak pernah di bawah 0. */
export const scoreFor = (found: number, placed: number, left: number, helps: number): number => Math.max(0, found * 50 + placed * 50 + Math.floor(left) * 2 - helps * 30);

export function resultFor(l: KLevel, s: KState, left: number, helps: number, done: boolean, firstTime: boolean): KResult {
  const stars = starsFor(done, left, l.seconds, helps);
  const score = scoreFor(s.found.length, placedCount(s), done ? left : 0, helps);
  return {
    stars,
    score,
    coins: done ? 5 + stars * 5 : 0,
    // XP hanya saat pertama kali selesai (sama seperti Kode Pintar).
    gained: done && firstTime ? 20 + 5 * stars : 0,
  };
}

/** Skor tersimpan di gameBest (satu angka kecil): bintang×1000 + skor. */
export const komikBest = (stars: number, score: number): number => stars * 1000 + Math.min(999, score);

/* ───────── Dialog pemandu (bervariasi, mengikuti kejadian) ───────── */

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const SAY = {
  found: (name: string) => pick([`Wah! Kamu menemukan ${name}!`, `Yeay, ${name} ketemu!`, `Hebat! ${cap(name)} sudah ketemu.`]),
  foundButterfly: () => pick(['Kupu-kupunya ketemu! Cantik sekali.', 'Wah, matamu jeli! Kupu-kupu ungu itu ketemu.']),
  missTap: () => pick(['Hmm, belum ada apa-apa di situ. Coba cari di tempat lain.', 'Bukan di sini. Coba perhatikan lagi!']),
  missMany: () => 'Tenang, pelan-pelan saja. Lihat sudut-sudut ya.',
  placed: (name: string) => pick([`Pas sekali! ${cap(name)} sudah di tempatnya.`, `Cantik! ${cap(name)} cocok di situ.`, `Rapi! ${cap(name)} sudah beres.`]),
  watered: () => 'Segar! Tanamanku hidup lagi. Terima kasih!',
  unlocked: () => 'Klik! Lemarinya terbuka. Wah, isinya bagus!',
  urgent: () => 'Ayo, sedikit lagi! Jangan sampai waktunya habis!',
  lose: () => 'Yah, waktunya habis. Tidak apa-apa, ayo coba lagi!',
  paused: () => 'Istirahat sebentar. Waktu berhenti dulu.',
  start: () => 'Ayo mulai! Ketuk benda yang kamu temukan.',
};

/** Jawaban saat benda dilepas di tempat yang salah. */
export function rejectLine(o: KObj, t: KTarget): string {
  if (t.kind === 'plant' && o.kind === 'flower') return 'Tanaman layu itu butuh air, bukan bunga. Bunga masuk pot yang kosong, ya.';
  if (t.kind === 'pot' && o.kind === 'can') return 'Pot kosong itu butuh bunga. Penyiramnya untuk tanaman yang layu.';
  if (t.kind === 'pot' && o.kind === 'flower') return `Belum cocok. ${cap(o.name)} ke pot yang garisnya berwarna sama, ya.`;
  if (t.kind === 'wardrobe') return 'Lemari itu terkunci. Cari kuncinya dulu, ya.';
  return `${cap(o.name)} belum cocok di ${t.label}. Coba tempat lain!`;
}
