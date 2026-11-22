import type { IconName } from '@/components/ui';

/**
 * Isi game "Kode Pintar". Satu baris kode = satu kotak puzzle.
 * c = kode (tanpa spasi depan), i = tingkat menjorok (HTML/CSS/JS: letak sebenarnya di berkas index.html),
 * r = nama tugas baris (petunjuk letak), w = penjelasan KENAPA baris itu ada dan ditaruh di situ,
 * g = baris dengan g sama boleh bertukar urutan, box = nama wadah yang dibuka baris ini (tempat pelajaran lain menyisipkan kode).
 * Proyek web "Tugas Pintar" tumbuh dari HTML, CSS, lalu JS dalam satu berkas; Python, SQL, Git memakai tema yang sama.
 */
export interface KLine {
  c: string;
  r: string;
  w: string;
  i?: number;
  g?: string;
  box?: string;
  /** Bagian baris yang boleh diganti anak dengan nilai sah buatannya sendiri (warna, angka, atau tulisan). v = nilai bawaan di dalam c. */
  free?: { v: string; kind: 'warna' | 'angka' | 'teks'; max?: number };
}

export type Cell = string | number;
export interface SqlTable {
  name: string;
  cols: string[];
  rows: Cell[][];
}

export interface KLesson {
  id: string;
  title: string;
  goal: string;
  lines: KLine[];
  /** Proyek web: nama wadah tempat baris pelajaran ini disisipkan (sebelum penutupnya). Kosong = berkas baru. */
  into?: string;
  /** SQL: isi tabel sebelum, dan hasil kode ini (simulasi, dicocokkan dengan SQLite). */
  sql?: { before: SqlTable[]; result: SqlTable; caption: string };
  /** Python/Git: keluaran terminal pelajaran ini (dicocokkan dengan Python asli; Git simulasi). */
  out?: string;
}

export type TrackId = 'html' | 'css' | 'js' | 'py' | 'sql' | 'git';

export interface KTrack {
  id: TrackId;
  title: string;
  desc: string;
  icon: IconName;
  bg: string;
  lessons: KLesson[];
}

const k = (c: string, i: number, r: string, w: string, x: { g?: string; box?: string } = {}): KLine => ({ c, i, r, w, ...x });

const TUGAS = (rows: Cell[][]): SqlTable => ({ name: 'tugas', cols: ['id', 'judul', 'selesai'], rows });
const T0 = TUGAS([]);
const T3 = TUGAS([[1, 'Kerjakan PR matematika', 0], [2, 'Baca buku cerita', 1], [3, 'Siram tanaman', 0]]);
const T3B = TUGAS([[1, 'Kerjakan PR matematika', 0], [2, 'Baca buku cerita', 1], [3, 'Siram tanaman', 1]]);
const T1 = TUGAS([[1, 'Kerjakan PR matematika', 0]]);

const HEAD = 'Isi kepala (urutan bebas)';
const SIFAT = 'Satu sifat (urutan bebas)';
const SIAP = 'Ambil elemen (urutan bebas)';

export const TRACKS: KTrack[] = [
  {
    id: 'html',
    title: 'HTML: Rangka Aplikasi',
    desc: 'Proyek "Tugas Pintar" dimulai dari rangka halaman. Tiap pelajaran menambah satu bagian di tempat yang benar.',
    icon: 'globe',
    bg: 'bg-jingga-300',
    lessons: [
      {
        id: 'html-1',
        title: 'Kerangka halaman',
        goal: 'Susun kerangka dasar yang dipakai semua halaman web.',
        lines: [
          k('<!DOCTYPE html>', 0, 'Pembuka dokumen', 'Ditulis paling atas supaya browser tahu ini HTML5 dan menampilkannya dengan aturan modern, bukan aturan lama yang berantakan.'),
          k('<html lang="id">', 0, 'Pembungkus semua isi', 'Semua isi halaman harus ada di dalamnya karena html adalah akar halaman. lang="id" memberi tahu browser dan pembaca layar bahwa bahasanya Indonesia.'),
          k('<head>', 1, 'Kepala halaman', 'Dipisah dari body karena isinya keterangan untuk browser (judul tab, pengaturan huruf), bukan untuk dibaca pengguna di layar.', { box: 'head' }),
          k('<meta charset="utf-8">', 2, HEAD, 'Supaya huruf Indonesia dan tanda baca tampil benar, bukan jadi simbol aneh. Tag meta tidak punya penutup karena tidak membungkus isi apa pun.', { g: 'a' }),
          k('<meta name="viewport" content="width=device-width, initial-scale=1">', 2, HEAD, 'Supaya halaman pas di layar ponsel. Tanpa ini, ponsel menampilkan halaman seperti layar komputer yang diperkecil sehingga tulisan jadi kecil sekali.', { g: 'a' }),
          k('<title>Tugas Pintar</title>', 2, HEAD, 'Teks ini tampil di tab browser dan jadi nama bookmark, jadi isinya nama aplikasi kita.', { g: 'a' }),
          k('</head>', 1, 'Menutup kepala', 'Setiap tag yang dibuka harus ditutup. Kepala ditutup sebelum body supaya browser tahu keterangan sudah selesai dan isi layar dimulai.'),
          k('<body>', 1, 'Badan halaman', 'Semua yang kelihatan di layar ada di dalam body. Letaknya setelah head karena browser perlu membaca keterangan dulu sebelum menampilkan isi.', { box: 'body' }),
          k('</body>', 1, 'Menutup badan', 'Body ditutup sebelum html karena urutan penutup selalu dari yang paling dalam ke paling luar.'),
          k('</html>', 0, 'Menutup halaman', 'Baris terakhir, karena html membungkus semuanya sehingga ia yang terakhir ditutup.'),
        ],
      },
      {
        id: 'html-2',
        title: 'Susunan halaman',
        goal: 'Bagi badan halaman menjadi atas, tengah, dan bawah.',
        into: 'body',
        lines: [
          k('<header>', 2, 'Bagian atas', 'header membungkus judul aplikasi. Dipakai tag yang bermakna (bukan div) supaya pembaca layar dan mesin pencari tahu ini bagian atas halaman.', { box: 'header' }),
          k('</header>', 2, 'Menutup bagian atas', 'Header ditutup lebih dulu karena bagian berikutnya (main) bukan isi dari header.'),
          k('<main>', 2, 'Isi utama', 'main untuk isi inti: formulir dan daftar tugas. Ditaruh di antara header dan footer karena begitulah urutan orang membaca: atas, tengah, bawah.', { box: 'main' }),
          k('</main>', 2, 'Menutup isi utama', 'Main ditutup sebelum footer karena footer bukan bagian dari isi utama.'),
          k('<footer>', 2, 'Bagian bawah', 'footer untuk keterangan penutup. Letaknya paling bawah karena dibaca paling akhir.', { box: 'footer' }),
          k('</footer>', 2, 'Menutup bagian bawah', 'Footer ditutup sebelum body berakhir karena ia masih berada di dalam body.'),
        ],
      },
      {
        id: 'html-3',
        title: 'Judul aplikasi',
        goal: 'Isi bagian atas dengan judul dan keterangan singkat.',
        into: 'header',
        lines: [
          k('<h1>Tugas Pintar</h1>', 3, 'Judul utama', 'h1 adalah judul terpenting dan sebaiknya hanya satu, karena mesin pencari dan pembaca layar memakainya sebagai nama halaman. Ditaruh di header karena ini identitas aplikasi.'),
          k('<p>Catat tugas sekolahmu di sini.</p>', 3, 'Keterangan singkat', 'p dipakai untuk teks biasa. Kalimat ini ditaruh tepat di bawah judul agar pengguna langsung paham fungsi aplikasi.'),
        ],
      },
      {
        id: 'html-4',
        title: 'Formulir tugas',
        goal: 'Buat kolom untuk mengetik tugas baru dan tombol menambahkannya.',
        into: 'main',
        lines: [
          k('<form id="form-tugas">', 3, 'Membuka formulir', 'form membungkus kolom isian dan tombol supaya browser tahu keduanya satu kesatuan. id="form-tugas" adalah nama unik yang nanti dipakai CSS dan JavaScript untuk menemukannya.'),
          k('<label for="input-tugas">Tugas baru:</label>', 4, 'Label kolom', 'label memberi nama pada kolom. for="input-tugas" menyambungkannya ke input ber-id sama, jadi mengetuk label ikut memilih kolom dan pembaca layar tahu kolom ini untuk apa.'),
          k('<input id="input-tugas" type="text" placeholder="Contoh: Kerjakan PR">', 4, 'Kolom ketik', 'input adalah kolom ketik. type="text" karena isinya tulisan. placeholder memberi contoh yang hilang saat mengetik. id-nya sama dengan for pada label.'),
          k('<button id="tombol-tambah" type="submit">Tambah</button>', 4, 'Tombol kirim', 'type="submit" membuat tombol ini mengirim formulir. Ia berada di dalam form agar dikenali sebagai tombol kirimnya.'),
          k('</form>', 3, 'Menutup formulir', 'Form ditutup setelah semua isinya, tapi masih di dalam main karena formulir bagian dari isi utama.'),
        ],
      },
      {
        id: 'html-5',
        title: 'Daftar tugas',
        goal: 'Tampilkan daftar tugas, penghitung, dan tombol hapus.',
        into: 'main',
        lines: [
          k('<h2>Daftar tugas</h2>', 3, 'Judul bagian daftar', 'h2 lebih kecil dari h1 karena ini sub-bagian. Urutan h1 lalu h2 menunjukkan tingkat kepentingan.'),
          k('<ul id="daftar-tugas">', 3, 'Membuka daftar', 'ul = daftar bertitik. Dipilih ul (bukan ol) karena tugas tidak butuh nomor urut. id supaya JavaScript nanti bisa menambah tugas ke sini.'),
          k('<li>Kerjakan PR matematika</li>', 4, 'Tugas pertama', 'li = satu butir daftar. Harus langsung berada di dalam ul; kalau di luar, tidak sah.'),
          k('<li class="selesai">Baca buku cerita</li>', 4, 'Tugas yang sudah selesai', 'class="selesai" menandai tugas sudah beres. Bedanya dengan id: class boleh dipakai banyak elemen, dan nanti CSS memakainya untuk mencoret tulisan.'),
          k('</ul>', 3, 'Menutup daftar', 'Ditutup setelah semua li karena li hanya boleh hidup di dalam ul.'),
          k('<p id="jumlah-tugas">2 tugas</p>', 3, 'Penghitung tugas', 'Angka ini nanti diperbarui JavaScript, jadi diberi id agar mudah ditemukan. Ditaruh di bawah daftar karena merangkum isinya.'),
          k('<button id="tombol-hapus" type="button">Hapus yang selesai</button>', 3, 'Tombol hapus', 'type="button" karena ini aksi biasa, bukan mengirim formulir. Ia di luar form sebab tidak ada hubungannya dengan kolom ketik.'),
        ],
      },
      {
        id: 'html-6',
        title: 'Kaki halaman',
        goal: 'Isi bagian bawah dengan keterangan dan tautan.',
        into: 'footer',
        lines: [
          k('<p>Dibuat dengan Kode Pintar</p>', 3, 'Keterangan pembuat', 'Footer berisi keterangan penutup, jadi kredit pembuat ditaruh di sini, bukan di header.'),
          k('<a href="#form-tugas">Tambah tugas lagi</a>', 3, 'Tautan ke atas', 'a membuat tautan. href="#form-tugas" melompat ke elemen ber-id itu di halaman yang sama, berguna kalau daftar sudah panjang dan formulir jauh di atas.'),
        ],
      },
    ],
  },
  {
    id: 'css',
    title: 'CSS: Merias Aplikasi',
    desc: 'Merias halaman "Tugas Pintar" yang kamu bangun di HTML. Aturan lama tetap ada, aturan baru ditambahkan di tempatnya.',
    icon: 'pencil',
    bg: 'bg-langit-300',
    lessons: [
      {
        id: 'css-1',
        title: 'Menyambungkan CSS',
        goal: 'Pasang area CSS dan atur dasar tampilan seluruh halaman.',
        into: 'head',
        lines: [
          k('<style>', 2, 'Membuka area CSS', 'style menaruh CSS di dalam halaman yang sama. Ia ada di head karena CSS adalah pengaturan tampilan, bukan isi yang dibaca.', { box: 'style' }),
          k('body {', 3, 'Aturan untuk seluruh halaman', 'Pemilih body menyasar seluruh isi halaman, jadi pengaturan di sini diwariskan ke semua anaknya. Tanda { membuka aturan.'),
          k('font-family: sans-serif;', 4, SIFAT, 'Huruf tanpa kaki (sans-serif) lebih mudah dibaca di layar kecil dan diwariskan ke semua tulisan di dalam body.', { g: 'a' }),
          k('background: #fff8e7;', 4, SIFAT, 'Warna latar krem hangat. Tanda # diikuti angka dan huruf adalah cara menulis warna dengan kode.', { g: 'a' }),
          k('margin: 0;', 4, SIFAT, 'Menghapus jarak bawaan browser di tepi halaman supaya kita yang mengatur sendiri jaraknya.', { g: 'a' }),
          k('}', 3, 'Menutup aturan', 'Kurung kurawal penutup mengakhiri satu aturan. Setiap aturan = pemilih + { sifat }.'),
          k('</style>', 2, 'Menutup area CSS', 'Harus ditutup supaya browser tahu CSS sudah selesai dan sisanya HTML lagi.'),
        ],
      },
      {
        id: 'css-2',
        title: 'Merias bagian atas',
        goal: 'Beri warna dan jarak pada header.',
        into: 'style',
        lines: [
          k('header {', 3, 'Pemilih bagian atas', 'Memilih elemen header langsung dengan namanya, karena di halaman hanya ada satu header.'),
          k('background: #4a8f3c;', 4, SIFAT, 'Hijau tua agar bagian atas menonjol sebagai identitas aplikasi.', { g: 'a' }),
          k('color: white;', 4, SIFAT, 'Tulisan putih dipilih karena kontras dengan latar hijau tua, supaya mudah dibaca.', { g: 'a' }),
          k('padding: 16px;', 4, SIFAT, 'padding = jarak di DALAM kotak, antara tulisan dan tepi, supaya tulisan tidak menempel di pinggir.', { g: 'a' }),
          k('text-align: center;', 4, SIFAT, 'Menengahkan tulisan karena judul aplikasi enak dilihat di tengah.', { g: 'a' }),
          k('}', 3, 'Menutup aturan', 'Tanda } menutup aturan header. Tiap { harus punya } pasangannya; kalau lupa, aturan sesudahnya ikut rusak.'),
        ],
      },
      {
        id: 'css-3',
        title: 'Merias isi utama',
        goal: 'Batasi lebar isi dan taruh di tengah.',
        into: 'style',
        lines: [
          k('main {', 3, 'Pemilih isi utama', 'Memilih main, yaitu wadah formulir dan daftar, supaya yang dibatasi lebarnya hanya isi utama, bukan header.'),
          k('max-width: 480px;', 4, SIFAT, 'Membatasi lebar supaya di layar lebar isinya tidak melebar sampai sulit dibaca. max-width berarti "paling lebar segini".', { g: 'a' }),
          k('margin: 0 auto;', 4, SIFAT, 'margin = jarak di LUAR kotak. Atas-bawah 0, kiri-kanan auto: browser membagi sisa lebar sama rata sehingga kotak berada di tengah.', { g: 'a' }),
          k('padding: 16px;', 4, SIFAT, 'Jarak di dalam supaya formulir dan daftar tidak menempel ke tepi layar ponsel.', { g: 'a' }),
          k('}', 3, 'Menutup aturan', 'Menutup aturan main. Setiap aturan harus ditutup sebelum aturan berikutnya dimulai.'),
        ],
      },
      {
        id: 'css-4',
        title: 'Merias formulir',
        goal: 'Jajarkan kolom dan tombol ke samping dan percantik kolom ketik.',
        into: 'style',
        lines: [
          k('#form-tugas {', 3, 'Pemilih berdasarkan id', 'Tanda # memilih elemen ber-id itu, yaitu form yang kita beri id di HTML. Nama harus persis sama.'),
          k('display: flex;', 4, 'Sifat formulir (urutan bebas)', 'flex menjajarkan anak-anaknya (kolom dan tombol) ke samping, tidak bertumpuk ke bawah.', { g: 'a' }),
          k('gap: 8px;', 4, 'Sifat formulir (urutan bebas)', 'gap memberi jarak antar anak supaya kolom dan tombol tidak berdempetan.', { g: 'a' }),
          k('}', 3, 'Menutup aturan', 'Menutup aturan formulir sebelum aturan kolom ketik dimulai, supaya sifatnya tidak tercampur.'),
          k('#input-tugas {', 3, 'Pemilih kolom ketik', 'Memilih kolom ketik lewat id-nya, bukan lewat input, supaya aturan hanya untuk kolom ini.'),
          k('flex: 1;', 4, 'Sifat kolom (urutan bebas)', 'flex: 1 membuat kolom mengambil semua sisa lebar, sehingga tombol tetap kecil di kanan.', { g: 'b' }),
          k('padding: 12px;', 4, 'Sifat kolom (urutan bebas)', 'Ruang di dalam kolom supaya tulisan tidak menempel dan mudah diketuk jari.', { g: 'b' }),
          k('border: 2px solid #4a8f3c;', 4, 'Sifat kolom (urutan bebas)', 'Garis tepi: tebal 2px, jenis solid, warnanya sama dengan hijau header supaya serasi.', { g: 'b' }),
          k('border-radius: 12px;', 4, 'Sifat kolom (urutan bebas)', 'Membulatkan sudut agar terasa ramah untuk anak.', { g: 'b' }),
          k('}', 3, 'Menutup aturan', 'Menutup aturan kolom ketik, aturan terakhir pelajaran ini.'),
        ],
      },
      {
        id: 'css-5',
        title: 'Merias tombol',
        goal: 'Rias semua tombol dan ubah warnanya saat disentuh.',
        into: 'style',
        lines: [
          k('button {', 3, 'Pemilih semua tombol', 'Memilih semua elemen button sekaligus, jadi tombol Tambah dan Hapus tampil seragam tanpa menulis dua kali.'),
          k('background: orange;', 4, SIFAT, 'Jingga (orange) dipakai karena beda dari hijau lain, jadi tombol mudah ditemukan. Warna bisa ditulis dengan nama atau kode.', { g: 'a' }),
          k('color: white;', 4, SIFAT, 'Tulisan putih dipilih karena kontras dengan latar jingga, supaya mudah dibaca.', { g: 'a' }),
          k('border: none;', 4, SIFAT, 'Menghapus garis tepi bawaan browser yang tampak kaku.', { g: 'a' }),
          k('border-radius: 12px;', 4, SIFAT, 'Sudut bulat, sama dengan kolom ketik supaya serasi.', { g: 'a' }),
          k('padding: 12px 16px;', 4, SIFAT, 'Dua angka: jarak atas-bawah 12px lalu kiri-kanan 16px, supaya tombol cukup besar untuk jari.', { g: 'a' }),
          k('}', 3, 'Menutup aturan tombol', 'Menutup aturan tombol biasa lebih dulu, karena aturan :hover adalah aturan terpisah.'),
          k('button:hover {', 3, 'Tombol saat disentuh', ':hover berlaku saat penunjuk atau jari menyentuh elemen. Ditulis setelah aturan button biasa karena aturan yang belakangan menang bila bertabrakan.'),
          k('background: darkorange;', 4, 'Warna saat disentuh', 'Jingga sedikit lebih gelap (darkorange) sebagai tanda bahwa tombol merespons sentuhan.'),
          k('}', 3, 'Menutup aturan sentuh', 'Menutup aturan sentuh. Aturan ini sengaja ditaruh sesudah aturan tombol biasa.'),
        ],
      },
      {
        id: 'css-6',
        title: 'Merias daftar',
        goal: 'Ubah daftar bertitik menjadi kartu-kartu tugas.',
        into: 'style',
        lines: [
          k('#daftar-tugas {', 3, 'Pemilih daftar', 'Memilih daftar lewat id-nya, bukan ul, supaya aturan ini hanya untuk daftar tugas.'),
          k('list-style: none;', 4, 'Sifat daftar (urutan bebas)', 'Menghilangkan titik bawaan karena tiap tugas akan tampil sebagai kartu.', { g: 'a' }),
          k('padding: 0;', 4, 'Sifat daftar (urutan bebas)', 'Menghapus jorokan bawaan ul supaya kartu selebar isi utama.', { g: 'a' }),
          k('}', 3, 'Menutup aturan', 'Menutup aturan daftar sebelum aturan kartu dimulai.'),
          k('#daftar-tugas li {', 3, 'Pemilih butir di dalam daftar', 'Dua pemilih dipisah spasi artinya "li yang berada di dalam #daftar-tugas". Aman, tidak mengenai li di tempat lain.'),
          k('background: white;', 4, 'Sifat kartu (urutan bebas)', 'Latar putih membuat tiap tugas tampak seperti kartu di atas latar krem.', { g: 'b' }),
          k('padding: 12px;', 4, 'Sifat kartu (urutan bebas)', 'Ruang di dalam kartu supaya tulisan lega dan tidak menempel ke tepi kartu.', { g: 'b' }),
          k('margin-bottom: 8px;', 4, 'Sifat kartu (urutan bebas)', 'Jarak ke kartu di bawahnya supaya tidak berdempetan.', { g: 'b' }),
          k('border-radius: 12px;', 4, 'Sifat kartu (urutan bebas)', 'Sudut bulat konsisten dengan kolom dan tombol.', { g: 'b' }),
          k('}', 3, 'Menutup aturan', 'Menutup aturan kartu.'),
        ],
      },
      {
        id: 'css-7',
        title: 'Tugas selesai dan kaki halaman',
        goal: 'Coret tugas yang selesai dan rapikan bagian bawah.',
        into: 'style',
        lines: [
          k('.selesai {', 3, 'Pemilih berdasarkan class', 'Titik di depan nama memilih semua elemen ber-class itu, yaitu li "Baca buku cerita" yang kita tandai di HTML.'),
          k('text-decoration: line-through;', 4, 'Sifat selesai (urutan bebas)', 'Mencoret tulisan: tanda yang dikenal semua orang untuk "sudah beres".', { g: 'a' }),
          k('color: gray;', 4, 'Sifat selesai (urutan bebas)', 'Abu-abu membuat tugas yang selesai tampak pudar dan tidak mencolok.', { g: 'a' }),
          k('}', 3, 'Menutup aturan', 'Menutup aturan .selesai sebelum aturan footer dimulai.'),
          k('footer {', 3, 'Pemilih bagian bawah', 'Memilih footer langsung dengan namanya karena hanya ada satu footer di halaman.'),
          k('text-align: center;', 4, 'Sifat footer (urutan bebas)', 'Tulisan di tengah supaya serasi dengan header dan tampak seimbang.', { g: 'b' }),
          k('font-size: 14px;', 4, 'Sifat footer (urutan bebas)', 'Lebih kecil dari teks utama karena isinya keterangan tambahan.', { g: 'b' }),
          k('}', 3, 'Menutup aturan', 'Menutup aturan footer, aturan terakhir pelajaran ini.'),
        ],
      },
      {
        id: 'css-8',
        title: 'Layar kecil (responsif)',
        goal: 'Susun formulir ke bawah saat layar sempit.',
        into: 'style',
        lines: [
          k('@media (max-width: 400px) {', 3, 'Aturan khusus layar sempit', '@media membuat aturan di dalamnya hanya berlaku bila syaratnya cocok: lebar layar paling besar 400px, yaitu ponsel kecil.'),
          k('#form-tugas {', 4, 'Pemilih formulir', 'Memilih form lagi karena kita mengubah perilakunya khusus di layar sempit. Ditulis di dalam @media dan dijorokkan agar jelas miliknya.'),
          k('flex-direction: column;', 5, 'Arah susunan', 'Mengubah susunan dari ke samping menjadi ke bawah, supaya kolom dan tombol tidak terlalu sempit.'),
          k('}', 4, 'Menutup aturan formulir', 'Menutup aturan formulir di dalam @media; jorokannya menunjukkan ia milik @media.'),
          k('}', 3, 'Menutup @media', 'Kurung penutup kedua menutup blok @media. Urutan penutup dari dalam ke luar.'),
        ],
      },
    ],
  },
  {
    id: 'js',
    title: 'JavaScript: Menghidupkan Aplikasi',
    desc: 'Membuat "Tugas Pintar" bisa menambah, mencoret, dan menghapus tugas. Nama di JavaScript sama dengan id di HTML.',
    icon: 'bulb',
    bg: 'bg-kuning-300',
    lessons: [
      {
        id: 'js-1',
        title: 'Mengenali elemen',
        goal: 'Pasang area script dan ambil elemen yang akan dikendalikan.',
        into: 'body',
        lines: [
          k('<script>', 2, 'Membuka area script', 'Script ditaruh di bawah body karena browser harus membaca semua elemen dulu; kalau di atas, elemen belum ada saat script mencarinya.', { box: 'script' }),
          k('const formTugas = document.getElementById("form-tugas");', 3, SIAP, 'const membuat penyimpan yang tidak diganti. Nama formTugas mengikuti id form-tugas supaya mudah diingat. getElementById mencari elemen ber-id itu.', { g: 'a' }),
          k('const inputTugas = document.getElementById("input-tugas");', 3, SIAP, 'Kolom ketik disimpan sekali di atas agar tidak dicari ulang tiap kali dipakai.', { g: 'a' }),
          k('const daftarTugas = document.getElementById("daftar-tugas");', 3, SIAP, 'Daftar tempat tugas akan ditambah dan dicoret.', { g: 'a' }),
          k('const jumlahTugas = document.getElementById("jumlah-tugas");', 3, SIAP, 'Tulisan penghitung yang nanti diperbarui; disimpan di variabel supaya cukup dicari sekali.', { g: 'a' }),
          k('const tombolHapus = document.getElementById("tombol-hapus");', 3, SIAP, 'Tombol hapus, supaya nanti bisa diberi perintah saat diketuk.', { g: 'a' }),
          k('</script>', 2, 'Menutup area script', 'Ditutup supaya browser tahu bagian JavaScript selesai.'),
        ],
      },
      {
        id: 'js-2',
        title: 'Fungsi penghitung',
        goal: 'Buat fungsi yang menghitung jumlah tugas lalu menampilkannya.',
        into: 'script',
        lines: [
          k('function perbaruiJumlah() {', 3, 'Membuat fungsi', 'Perhitungan ini akan dipakai berkali-kali (saat tambah dan hapus), jadi dibungkus fungsi agar tidak ditulis ulang. Nama menjelaskan tugasnya.'),
          k('jumlahTugas.textContent = daftarTugas.children.length + " tugas";', 4, 'Tulis jumlah', 'children.length menghitung jumlah anak (li) di dalam daftar. Tanda + menyambungnya dengan kata " tugas", lalu textContent menuliskannya ke layar.'),
          k('}', 3, 'Menutup fungsi', 'Menutup fungsi perbaruiJumlah supaya baris sesudahnya berada di luar fungsi dan benar-benar dijalankan.'),
          k('perbaruiJumlah();', 3, 'Menjalankan fungsi', 'Fungsi yang hanya dibuat belum berjalan. Memanggilnya di sini memastikan angka benar sejak halaman dibuka.'),
        ],
      },
      {
        id: 'js-3',
        title: 'Menambah tugas lewat kode',
        goal: 'Buat fungsi yang membuat li baru dan memasukkannya ke daftar.',
        into: 'script',
        lines: [
          k('function tambahTugas(teks) {', 3, 'Membuat fungsi dengan bahan', 'teks adalah bahan yang dimasukkan, jadi fungsi ini bisa dipakai untuk tugas apa saja.'),
          k('const item = document.createElement("li");', 4, 'Membuat elemen li', 'createElement membuat li baru di memori. Belum tampil sampai kita memasukkannya ke halaman.'),
          k('item.textContent = teks;', 4, 'Isi tulisan', 'Mengisi li dengan tulisan tugas, sebelum dimasukkan agar tampil lengkap.'),
          k('daftarTugas.appendChild(item);', 4, 'Memasukkan ke daftar', 'appendChild menaruh li di akhir daftar, di sinilah ia mulai tampil. Urutannya setelah diisi supaya tidak muncul kosong.'),
          k('perbaruiJumlah();', 4, 'Perbarui jumlah', 'Jumlah berubah setiap ada tugas baru, jadi fungsi penghitung dipanggil lagi.'),
          k('}', 3, 'Menutup fungsi', 'Menutup fungsi tambahTugas; baris sesudahnya berada di luar fungsi sehingga langsung dijalankan.'),
          k('tambahTugas("Siram tanaman");', 3, 'Mencoba fungsi', 'Memanggil fungsi dengan satu tugas contoh. Tugas ketiga muncul dan jumlah menjadi 3.'),
        ],
      },
      {
        id: 'js-4',
        title: 'Formulir bisa dikirim',
        goal: 'Saat Tambah diketuk, tugas dari kolom ketik masuk ke daftar.',
        into: 'script',
        lines: [
          k('formTugas.addEventListener("submit", function (event) {', 3, 'Pasang pendengar kirim', 'Artinya: saat formulir dikirim ("submit"), jalankan isi fungsi di bawah. event berisi keterangan kejadian itu.'),
          k('event.preventDefault();', 4, 'Cegah muat ulang', 'Bawaan browser memuat ulang halaman saat formulir dikirim, yang menghapus semua tugas. Baris ini mencegahnya.'),
          k('const teks = inputTugas.value.trim();', 4, 'Ambil tulisan', 'value adalah isi kolom. trim() membuang spasi di depan dan belakang supaya "   " tidak dianggap tugas.'),
          k('if (teks === "") {', 4, 'Jika kosong', 'Tugas kosong tidak berguna, jadi diperiksa dulu sebelum ditambahkan.'),
          k('return;', 5, 'Berhenti', 'return menghentikan fungsi di sini sehingga baris di bawahnya tidak jalan.'),
          k('}', 4, 'Menutup pemeriksaan', 'Menutup blok if. Baris sesudahnya berada di luar if sehingga tetap berjalan bila tugas tidak kosong.'),
          k('tambahTugas(teks);', 4, 'Tambahkan', 'Memakai fungsi dari pelajaran sebelumnya. Ditaruh setelah pemeriksaan agar hanya tugas yang sah yang masuk.'),
          k('inputTugas.value = "";', 4, 'Kosongkan kolom', 'Supaya pengguna bisa langsung mengetik tugas berikutnya tanpa menghapus yang lama.'),
          k('});', 3, 'Menutup pendengar', 'Menutup fungsi dan pemanggilan addEventListener sekaligus.'),
        ],
      },
      {
        id: 'js-5',
        title: 'Mencoret tugas selesai',
        goal: 'Saat tugas diketuk, tandai selesai atau batalkan.',
        into: 'script',
        lines: [
          k('daftarTugas.addEventListener("click", function (event) {', 3, 'Pendengar ketukan di daftar', 'Pendengar dipasang di daftar, bukan di tiap li, karena tugas baru yang ditambah belakangan ikut tertangani tanpa kode tambahan.'),
          k('if (event.target.tagName === "LI") {', 4, 'Hanya jika yang diketuk li', 'event.target adalah elemen yang benar-benar diketuk. Diperiksa agar ketukan di celah daftar tidak dianggap tugas.'),
          k('event.target.classList.toggle("selesai");', 5, 'Ganti status selesai', 'toggle menambah class "selesai" bila belum ada, dan melepasnya bila sudah ada. CSS .selesai yang mencoret tulisannya.'),
          k('}', 4, 'Menutup pemeriksaan', 'Menutup blok if; ketukan yang bukan di li tidak melakukan apa-apa.'),
          k('});', 3, 'Menutup pendengar', 'Menutup fungsi sekaligus pemanggilan addEventListener; tanda kurung dan titik koma wajib ada.'),
        ],
      },
      {
        id: 'js-6',
        title: 'Menghapus yang selesai',
        goal: 'Tombol hapus membuang semua tugas yang sudah dicoret.',
        into: 'script',
        lines: [
          k('tombolHapus.addEventListener("click", function () {', 3, 'Pendengar tombol hapus', 'Jalankan isi fungsi saat tombol Hapus diketuk.'),
          k('const yangSelesai = daftarTugas.querySelectorAll(".selesai");', 4, 'Kumpulkan yang selesai', 'querySelectorAll mengumpulkan semua elemen dalam daftar yang ber-class selesai, memakai penulisan selector yang sama seperti di CSS.'),
          k('yangSelesai.forEach(function (item) {', 4, 'Ulangi untuk tiap tugas', 'forEach menjalankan fungsi untuk setiap tugas yang terkumpul.'),
          k('item.remove();', 5, 'Buang dari halaman', 'remove melepas li itu dari halaman, sehingga tugas yang selesai benar-benar hilang dari daftar.'),
          k('});', 4, 'Menutup perulangan', 'Menutup forEach; baris sesudahnya dijalankan setelah semua tugas selesai dibuang.'),
          k('perbaruiJumlah();', 4, 'Perbarui jumlah', 'Dipanggil setelah semua dibuang supaya angkanya cocok dengan sisa tugas.'),
          k('});', 3, 'Menutup pendengar', 'Akhir pendengar. Aplikasi Tugas Pintar versi web selesai.'),
        ],
      },
    ],
  },
  {
    id: 'py',
    title: 'Python: Logika di Balik Layar',
    desc: 'Mengelola daftar tugas dengan Python, bahasa yang mudah dibaca. Keluaran dicocokkan dengan Python asli.',
    icon: 'calc',
    bg: 'bg-langit-100',
    lessons: [
      {
        id: 'py-1',
        title: 'Menyapa dengan print',
        goal: 'Simpan nama aplikasi lalu tampilkan sapaan.',
        lines: [
          k('nama_aplikasi = "Tugas Pintar"', 0, 'Simpan data', 'Tanda = menyimpan isi ke variabel. Nama memakai garis bawah karena Python tidak membolehkan spasi pada nama. Tidak perlu kata const atau let seperti JavaScript.'),
          k('print("Selamat datang di " + nama_aplikasi)', 0, 'Tampilkan sapaan', 'print menampilkan tulisan di layar. Tanda + menyambung teks dengan isi variabel. Variabel harus dibuat dulu di atas, baru dipakai.'),
        ],
        out: 'Selamat datang di Tugas Pintar',
      },
      {
        id: 'py-2',
        title: 'Daftar tugas (list)',
        goal: 'Simpan beberapa tugas dalam satu daftar.',
        lines: [
          k('tugas = ["Kerjakan PR matematika", "Baca buku cerita"]', 0, 'Membuat daftar', 'Kurung siku [ ] membuat list, isinya dipisah koma. Satu daftar lebih rapi daripada banyak variabel terpisah.'),
          k('print("Tugas pertama:", tugas[0])', 0, 'Ambil butir pertama', 'Nomor urut di Python mulai dari 0, jadi tugas[0] adalah butir pertama. Koma di print menaruh spasi di antara bagiannya.'),
          k('print("Jumlah tugas:", len(tugas))', 0, 'Hitung isi daftar', 'len = length (panjang), menghitung berapa butir di dalam daftar.'),
        ],
        out: 'Tugas pertama: Kerjakan PR matematika\nJumlah tugas: 2',
      },
      {
        id: 'py-3',
        title: 'Perulangan: for',
        goal: 'Tampilkan semua tugas dengan nomor.',
        lines: [
          k('for nomor, judul in enumerate(tugas, 1):', 0, 'Mulai perulangan', 'enumerate memberi nomor otomatis, dimulai dari 1 (bukan 0) karena orang menghitung dari satu. Titik dua (:) di akhir membuka blok yang menjorok.'),
          k('print(nomor, judul)', 1, 'Isi yang diulang', 'Menjorok 4 spasi: di Python, jorokan menentukan baris ini milik for dan diulang tiap putaran.'),
        ],
        out: '1 Kerjakan PR matematika\n2 Baca buku cerita',
      },
      {
        id: 'py-4',
        title: 'Fungsi tambah_tugas',
        goal: 'Buat fungsi yang menolak tugas kosong dan menambahkan yang sah.',
        lines: [
          k('def tambah_tugas(daftar, judul):', 0, 'Membuat fungsi', 'def membuat fungsi. Nama berupa kata kerja menjelaskan tugasnya, dan daftar serta judul adalah bahan yang dimasukkan.'),
          k('if judul == "":', 1, 'Jika judul kosong', 'Diperiksa lebih dulu, sama seperti di JavaScript, supaya tugas kosong tidak masuk. Dua tanda sama dengan (==) berarti "apakah sama".'),
          k('return False', 2, 'Tolak', 'return mengembalikan hasil dan langsung menghentikan fungsi. False artinya gagal menambah.'),
          k('daftar.append(judul)', 1, 'Tambahkan di akhir', 'append menaruh butir di akhir daftar. Baris ini menjorok setingkat dengan if (bukan di dalamnya) sehingga hanya jalan bila judul tidak kosong.'),
          k('return True', 1, 'Beri tahu berhasil', 'True artinya berhasil menambah, supaya pemanggil tahu hasilnya.'),
          k('print(tambah_tugas(tugas, ""))', 0, 'Coba dengan judul kosong', 'Dipanggil di luar fungsi (tanpa jorokan). Hasilnya False karena ditolak.'),
          k('print(tambah_tugas(tugas, "Siram tanaman"))', 0, 'Coba dengan judul sah', 'Hasilnya True dan "Siram tanaman" masuk ke daftar sebagai tugas ketiga.'),
          k('print("Jumlah tugas:", len(tugas))', 0, 'Periksa jumlah', 'Memeriksa bahwa daftar kini berisi 3 tugas: yang kosong ditolak, yang sah masuk.'),
        ],
        out: 'False\nTrue\nJumlah tugas: 3',
      },
      {
        id: 'py-5',
        title: 'Kamus (dictionary)',
        goal: 'Simpan satu tugas lengkap dengan judul dan statusnya.',
        lines: [
          k('satu_tugas = {"judul": "Siram tanaman", "selesai": False}', 0, 'Membuat kamus', 'Kurung kurawal { } membuat dictionary: pasangan nama dan isi. Dipakai karena satu tugas punya dua keterangan (judul dan status), sama seperti kolom tabel nanti di SQL.'),
          k('print(satu_tugas["judul"])', 0, 'Ambil judul', 'Isi diambil lewat namanya ("judul"), bukan nomor urut, jadi lebih mudah dipahami.'),
          k('satu_tugas["selesai"] = True', 0, 'Tandai selesai', 'Mengganti isi "selesai" menjadi True, seperti toggle kelas selesai di JavaScript. Huruf pertama True harus kapital.'),
          k('print(satu_tugas["selesai"])', 0, 'Periksa status', 'Memastikan statusnya sudah berubah, karena selalu baik memeriksa hasil sebuah perubahan.'),
        ],
        out: 'Siram tanaman\nTrue',
      },
      {
        id: 'py-6',
        title: 'Daftar kamus dan menghitung',
        goal: 'Kumpulkan semua tugas lalu hitung yang selesai.',
        lines: [
          k('semua = [', 0, 'Membuka daftar besar', 'Daftar berisi kamus-kamus. Ditulis berbaris-baris supaya tiap tugas jelas terlihat.'),
          k('{"judul": "Kerjakan PR matematika", "selesai": False},', 1, 'Tugas pertama', 'Belum selesai, sama seperti di halaman web. Koma di akhir memisahkan dari butir berikutnya.'),
          k('{"judul": "Baca buku cerita", "selesai": True},', 1, 'Tugas kedua', 'Sudah selesai, sama seperti li ber-class selesai di HTML.'),
          k('satu_tugas,', 1, 'Tugas ketiga', 'Memakai kamus yang sudah dibuat di pelajaran sebelumnya, tidak perlu menulis ulang.'),
          k(']', 0, 'Menutup daftar besar', 'Penutup kurung siku sejajar dengan pembukanya.'),
          k('jumlah_selesai = 0', 0, 'Siapkan penghitung', 'Penghitung dimulai dari 0 sebelum perulangan, karena kalau di dalam, akan kembali 0 tiap putaran.'),
          k('for item in semua:', 0, 'Telusuri semua tugas', 'item mengambil satu kamus tugas tiap putaran.'),
          k('if item["selesai"]:', 1, 'Jika selesai', 'Nilainya sudah True atau False, jadi tidak perlu ditulis == True.'),
          k('jumlah_selesai = jumlah_selesai + 1', 2, 'Tambah hitungan', 'Menjorok dua tingkat karena milik if di dalam for.'),
          k('print("Selesai:", jumlah_selesai, "dari", len(semua))', 0, 'Tampilkan ringkasan', 'Tanpa jorokan: dijalankan sekali setelah perulangan selesai.'),
        ],
        out: 'Selesai: 2 dari 3',
      },
      {
        id: 'py-7',
        title: 'Laporan tugas',
        goal: 'Cetak laporan rapi: tiap tugas dengan statusnya.',
        lines: [
          k('for item in semua:', 0, 'Telusuri lagi', 'Perulangan baru karena tugasnya berbeda: mencetak laporan, bukan menghitung.'),
          k('status = "selesai" if item["selesai"] else "belum"', 1, 'Pilih kata status', 'Bentuk satu baris untuk memilih antara dua nilai. Mengubah True/False menjadi kata supaya mudah dibaca manusia.'),
          k('print(f"- {item[\'judul\']} ({status})")', 1, 'Cetak satu baris laporan', 'Huruf f di depan tanda kutip membuat tulisan bisa memuat isi variabel di dalam kurung kurawal. Tanda kutip satu dipakai di dalam agar tidak bentrok dengan tanda kutip dua di luar.'),
        ],
        out: '- Kerjakan PR matematika (belum)\n- Baca buku cerita (selesai)\n- Siram tanaman (selesai)',
      },
    ],
  },
  {
    id: 'sql',
    title: 'SQL: Gudang Data Tugas',
    desc: 'Menyimpan tugas di database. Kolomnya sama dengan kamus Python: judul dan selesai. Hasilnya simulasi.',
    icon: 'board',
    bg: 'bg-hijau-300',
    lessons: [
      {
        id: 'sql-1',
        title: 'Membuat tabel tugas',
        goal: 'Buat tabel untuk menyimpan tugas.',
        lines: [
          k('CREATE TABLE tugas (', 0, 'Buat tabel baru', 'CREATE TABLE membuat tabel, seperti lembar kosong dengan kolom. Namanya tugas, sama dengan benda yang kita kelola.'),
          k('id INTEGER PRIMARY KEY,', 1, 'Kolom nomor unik', 'Setiap tugas butuh nomor yang tidak kembar supaya bisa dicari dan diubah tepat sasaran. PRIMARY KEY menjaganya unik.'),
          k('judul TEXT,', 1, 'Kolom judul', 'TEXT karena judul berupa tulisan. Namanya sama dengan kunci "judul" di kamus Python.'),
          k('selesai INTEGER', 1, 'Kolom status', 'Berupa angka: 0 = belum, 1 = sudah, karena SQL tidak punya True/False sederhana. Kolom terakhir tanpa koma.'),
          k(');', 0, 'Menutup', 'Kurung penutup dan titik koma mengakhiri perintah. Titik koma wajib di akhir tiap perintah.'),
        ],
        sql: { before: [], caption: 'Tabel tugas sudah dibuat, masih kosong.', result: T0 },
      },
      {
        id: 'sql-2',
        title: 'Mengisi tugas',
        goal: 'Masukkan tiga tugas ke dalam tabel.',
        lines: [
          k('INSERT INTO tugas (judul, selesai)', 0, 'Pilih tabel dan kolom', 'INSERT INTO = masukkan ke tabel tugas. Kolom id tidak disebut karena dibuat otomatis.'),
          k("VALUES ('Kerjakan PR matematika', 0),", 1, 'Tugas pertama', 'Teks memakai tanda kutip satu, angka tidak. 0 = belum selesai.'),
          k("('Baca buku cerita', 1),", 1, 'Tugas kedua', 'Status 1 karena tugas ini sudah selesai, sama dengan di halaman web.'),
          k("('Siram tanaman', 0);", 1, 'Tugas ketiga', 'Baris terakhir diakhiri titik koma, bukan koma.'),
        ],
        sql: { before: [T0], caption: 'Tiga tugas masuk. id dibuat otomatis.', result: T3 },
      },
      {
        id: 'sql-3',
        title: 'Membaca: SELECT',
        goal: 'Ambil judul dan status semua tugas.',
        lines: [
          k('SELECT judul, selesai', 0, 'Pilih kolom', 'SELECT = ambil. Hanya kolom yang disebut yang diambil, supaya data tidak berlebihan.'),
          k('FROM tugas;', 0, 'Dari tabel mana', 'FROM menyebut sumbernya. Urutannya SELECT dulu lalu FROM, seperti kalimat "ambil ini dari situ".'),
        ],
        sql: { before: [T3], caption: 'Dua kolom dari semua tugas.', result: { name: 'hasil', cols: ['judul', 'selesai'], rows: [['Kerjakan PR matematika', 0], ['Baca buku cerita', 1], ['Siram tanaman', 0]] } },
      },
      {
        id: 'sql-4',
        title: 'Menyaring: WHERE',
        goal: 'Ambil hanya tugas yang belum selesai.',
        lines: [
          k('SELECT judul', 0, 'Pilih kolom', 'Cukup judul karena kita hanya ingin daftar yang masih harus dikerjakan.'),
          k('FROM tugas', 0, 'Dari tabel mana', 'Tanpa titik koma karena perintah belum selesai.'),
          k('WHERE selesai = 0;', 0, 'Syarat penyaring', 'WHERE menyaring baris. Satu tanda sama dengan (=) berarti "sama dengan" di SQL. 0 = belum selesai.'),
        ],
        sql: { before: [T3], caption: 'Dua tugas yang belum selesai.', result: { name: 'hasil', cols: ['judul'], rows: [['Kerjakan PR matematika'], ['Siram tanaman']] } },
      },
      {
        id: 'sql-5',
        title: 'Mengubah: UPDATE',
        goal: 'Tandai tugas nomor 3 sebagai selesai.',
        lines: [
          k('UPDATE tugas', 0, 'Pilih tabel', 'UPDATE = ubah data yang sudah ada di tabel tugas.'),
          k('SET selesai = 1', 0, 'Nilai baru', 'SET menyebut kolom dan isi barunya, sama seperti toggle selesai di halaman web.'),
          k('WHERE id = 3;', 0, 'Hanya yang mana', 'WAJIB ada. Tanpa WHERE, semua tugas ikut berubah. id = 3 memilih tepat satu tugas, itulah gunanya nomor unik.'),
        ],
        sql: { before: [T3], caption: 'Tugas nomor 3 kini selesai.', result: T3B },
      },
      {
        id: 'sql-6',
        title: 'Menghapus: DELETE',
        goal: 'Buang semua tugas yang sudah selesai.',
        lines: [
          k('DELETE FROM tugas', 0, 'Hapus dari tabel', 'DELETE FROM membuang baris dari tabel tugas. Ditulis bersama WHERE di bawahnya sebagai satu perintah.'),
          k('WHERE selesai = 1;', 0, 'Syarat yang dihapus', 'Sama dengan tombol "Hapus yang selesai" di halaman web. Tanpa WHERE semua tugas hilang, jadi syarat ini penjaga.'),
        ],
        sql: { before: [T3B], caption: 'Tinggal tugas yang belum selesai.', result: T1 },
      },
      {
        id: 'sql-7',
        title: 'Menghitung: COUNT',
        goal: 'Hitung tugas yang masih tersisa.',
        lines: [
          k('SELECT COUNT(*) AS jumlah', 0, 'Pilih hitungan', 'COUNT(*) menghitung baris, mirip len di Python. AS jumlah memberi nama kolom hasilnya.'),
          k('FROM tugas', 0, 'Dari tabel mana', 'Sumber data yang dihitung: tabel tugas, supaya COUNT tahu menghitung baris dari mana.'),
          k('WHERE selesai = 0;', 0, 'Hanya yang belum selesai', 'Menghitung yang belum beres, angka yang sama dengan penghitung di halaman web.'),
        ],
        sql: { before: [T1], caption: 'Satu tugas tersisa.', result: { name: 'hasil', cols: ['jumlah'], rows: [[1]] } },
      },
    ],
  },
  {
    id: 'git',
    title: 'Git: Menyimpan Riwayat Proyek',
    desc: 'Menyimpan versi proyek "tugas-pintar" dan mengirimnya ke GitHub. Keluaran simulasi.',
    icon: 'shield',
    bg: 'bg-kuning-100',
    lessons: [
      {
        id: 'git-1',
        title: 'Membuat proyek',
        goal: 'Buat folder proyek dan mulai pelacakan Git.',
        lines: [
          k('mkdir tugas-pintar', 0, 'Buat folder', 'mkdir = make directory. Satu proyek satu folder agar berkasnya rapi.'),
          k('cd tugas-pintar', 0, 'Masuk ke folder', 'cd = change directory. Harus masuk dulu supaya perintah berikutnya bekerja di folder ini.'),
          k('git init', 0, 'Mulai Git', 'Membuat "buku catatan riwayat" tersembunyi (.git). Hanya dilakukan sekali per proyek.'),
        ],
        out: 'Initialized empty Git repository in tugas-pintar/.git/',
      },
      {
        id: 'git-2',
        title: 'Menyimpan versi pertama',
        goal: 'Buat berkas halaman dan simpan sebagai versi pertama.',
        lines: [
          k('touch index.html', 0, 'Buat berkas', 'touch membuat berkas kosong. index.html adalah nama halaman utama yang dicari browser dan GitHub Pages.'),
          k('git add index.html', 0, 'Pilih berkas', 'git add memasukkan berkas ke "keranjang" yang akan disimpan. Kita memilih apa yang ikut, jadi tidak semua berkas langsung tercatat.'),
          k('git commit -m "Tambah kerangka halaman"', 0, 'Simpan versi', 'commit menyimpan isi keranjang sebagai satu versi. -m diikuti pesan singkat supaya nanti kita tahu isi versi ini.'),
        ],
        out: '[main (root-commit) 1a2b3c4] Tambah kerangka halaman\n 1 file changed, 0 insertions(+), 0 deletions(-)\n create mode 100644 index.html',
      },
      {
        id: 'git-3',
        title: 'Berkas baru dan status',
        goal: 'Tambah berkas CSS dan JavaScript, periksa, lalu simpan.',
        lines: [
          k('touch style.css script.js', 0, 'Buat dua berkas', 'Satu berkas untuk CSS dan satu untuk JavaScript. Memisahkan berkas membuat proyek tertata, sesuai pembagian HTML, CSS, JS.'),
          k('git status -s', 0, 'Periksa status', 'status memperlihatkan berkas yang belum dicatat. -s = ringkas. Tanda ?? artinya berkas baru yang belum dilacak.'),
          k('git add .', 0, 'Pilih semua', 'Titik berarti "semua di folder ini". Dipakai setelah diperiksa, supaya kita tahu apa yang masuk.'),
          k('git commit -m "Tambah CSS dan JavaScript"', 0, 'Simpan versi', 'Satu versi untuk satu pekerjaan yang utuh, dengan pesan yang menjelaskan isinya.'),
        ],
        out: '?? script.js\n?? style.css\n[main 4c5d6e7] Tambah CSS dan JavaScript\n 2 files changed, 0 insertions(+), 0 deletions(-)\n create mode 100644 script.js\n create mode 100644 style.css',
      },
      {
        id: 'git-4',
        title: 'Melihat riwayat',
        goal: 'Lihat daftar versi yang sudah disimpan.',
        lines: [
          k('git log --oneline', 0, 'Lihat riwayat', 'log menampilkan versi dari yang terbaru. --oneline meringkas tiap versi jadi satu baris: kode pendek dan pesannya. Inilah gunanya menulis pesan commit yang jelas.'),
        ],
        out: '4c5d6e7 (HEAD -> main) Tambah CSS dan JavaScript\n1a2b3c4 Tambah kerangka halaman',
      },
      {
        id: 'git-5',
        title: 'Cabang untuk fitur baru',
        goal: 'Kerjakan fitur hapus tugas di cabang terpisah.',
        lines: [
          k('git switch -c fitur-hapus', 0, 'Buat dan pindah cabang', 'Cabang adalah jalur kerja terpisah supaya percobaan tidak merusak yang utama. -c = create: membuat sekaligus pindah. Nama cabang menjelaskan fiturnya.'),
          k('echo "// hapus tugas selesai" >> script.js', 0, 'Tambah isi berkas', 'Tanda >> menambahkan ke akhir berkas (satu > akan menimpa isi lama). Di dunia nyata di sinilah kode fitur ditulis.'),
          k('git commit -am "Tambah fitur hapus tugas"', 0, 'Simpan di cabang', '-a ikut menyimpan berkas lama yang berubah, -m memberi pesan. Digabung jadi -am. Versi ini hanya tersimpan di cabang fitur-hapus.'),
        ],
        out: "Switched to a new branch 'fitur-hapus'\n[fitur-hapus 8f9a0b1] Tambah fitur hapus tugas\n 1 file changed, 1 insertion(+)",
      },
      {
        id: 'git-6',
        title: 'Menggabung dan mengirim',
        goal: 'Gabungkan fitur ke cabang utama lalu kirim ke GitHub.',
        lines: [
          k('git remote add origin git@github.com:aku/tugas-pintar.git', 0, 'Daftarkan alamat GitHub', 'Menamai alamat GitHub-mu "origin" supaya cukup menulis nama pendek, bukan alamat panjang, setiap mengirim.'),
          k('git switch main', 0, 'Kembali ke utama', 'Menggabung selalu dilakukan dari cabang tujuan, yaitu main.'),
          k('git merge fitur-hapus', 0, 'Gabungkan', 'merge memasukkan hasil kerja fitur-hapus ke cabang yang sedang aktif (main).'),
          k('git push origin main', 0, 'Kirim ke GitHub', 'push mengirim riwayat main ke origin. Setelah ini proyek aman tersimpan di internet dan bisa dikerjakan bersama.'),
        ],
        out: "Switched to branch 'main'\nUpdating 4c5d6e7..8f9a0b1\nFast-forward\n script.js | 1 +\n 1 file changed, 1 insertion(+)\nTo github.com:aku/tugas-pintar.git\n * [new branch]      main -> main",
      },
    ],
  },
];

/** Bagian bebas: anak boleh mengetik nilainya sendiri (pelajaran, baris, nilai bawaan). */
const FREE_LINES: [string, string, NonNullable<KLine['free']>][] = [
  ['html-1', '<title>Tugas Pintar</title>', { v: 'Tugas Pintar', kind: 'teks' }],
  ['html-3', '<h1>Tugas Pintar</h1>', { v: 'Tugas Pintar', kind: 'teks' }],
  ['html-3', '<p>Catat tugas sekolahmu di sini.</p>', { v: 'Catat tugas sekolahmu di sini.', kind: 'teks' }],
  ['html-4', '<label for="input-tugas">Tugas baru:</label>', { v: 'Tugas baru:', kind: 'teks' }],
  ['html-5', '<li>Kerjakan PR matematika</li>', { v: 'Kerjakan PR matematika', kind: 'teks' }],
  ['html-5', '<li class="selesai">Baca buku cerita</li>', { v: 'Baca buku cerita', kind: 'teks' }],
  ['html-6', '<p>Dibuat dengan Kode Pintar</p>', { v: 'Dibuat dengan Kode Pintar', kind: 'teks' }],
  ['css-1', 'background: #fff8e7;', { v: '#fff8e7', kind: 'warna' }],
  ['css-2', 'background: #4a8f3c;', { v: '#4a8f3c', kind: 'warna' }],
  ['css-2', 'color: white;', { v: 'white', kind: 'warna' }],
  ['css-2', 'padding: 16px;', { v: '16', kind: 'angka', max: 80 }],
  ['css-3', 'max-width: 480px;', { v: '480', kind: 'angka', max: 900 }],
  ['css-4', 'gap: 8px;', { v: '8', kind: 'angka', max: 40 }],
  ['css-4', 'border: 2px solid #4a8f3c;', { v: '#4a8f3c', kind: 'warna' }],
  ['css-4', 'border-radius: 12px;', { v: '12', kind: 'angka', max: 40 }],
  ['css-5', 'background: orange;', { v: 'orange', kind: 'warna' }],
  ['css-5', 'color: white;', { v: 'white', kind: 'warna' }],
  ['css-5', 'background: darkorange;', { v: 'darkorange', kind: 'warna' }],
  ['css-6', 'background: white;', { v: 'white', kind: 'warna' }],
  ['css-6', 'padding: 12px;', { v: '12', kind: 'angka', max: 60 }],
  ['css-6', 'margin-bottom: 8px;', { v: '8', kind: 'angka', max: 40 }],
  ['css-7', 'color: gray;', { v: 'gray', kind: 'warna' }],
  ['css-7', 'font-size: 14px;', { v: '14', kind: 'angka', max: 40 }],
];
for (const [lid, code, free] of FREE_LINES) {
  const line = TRACKS.flatMap((t) => t.lessons).find((l) => l.id === lid)?.lines.find((x) => x.c === code);
  if (line) line.free = free;
}

export const ALL_LESSONS = TRACKS.flatMap((t) => t.lessons);
export const KODE_TOTAL = ALL_LESSONS.length;
