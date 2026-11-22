import type { IconName } from '@/components/ui';

/**
 * Isi game "Kode Pintar". Satu baris kode = satu kotak puzzle.
 * c = kode (tanpa spasi depan), i = tingkat menjorok, r = nama tugas baris (petunjuk letak), w = penjelasan,
 * g = baris dengan g sama boleh bertukar urutan (mis. sifat CSS).
 * Pelajaran dalam satu jalur saling menyambung: kode pelajaran sebelumnya jadi pelengkap (lihat kodeCompose.ts).
 */
export interface KLine {
  c: string;
  r: string;
  w: string;
  i?: number;
  g?: string;
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
  /** HTML/CSS/JS: potongan isi <body> yang dipakai pelajaran ini (spasi 2 di depan = menjorok 1 tingkat). */
  base?: string[];
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

const SISWA: SqlTable = {
  name: 'siswa',
  cols: ['id', 'nama', 'kelas', 'nilai'],
  rows: [[1, 'Ani', 4, 90], [2, 'Budi', 5, 75], [3, 'Citra', 4, 85], [4, 'Dedi', 5, 60], [5, 'Eka', 6, 95]],
};
const SISWA_KOSONG: SqlTable = { ...SISWA, rows: [] };
const P = 'Satu sifat (urutan bebas)';

export const TRACKS: KTrack[] = [
  {
    id: 'html',
    title: 'HTML: Kerangka Halaman',
    desc: 'Bahasa untuk menyusun isi halaman web. Halaman "Kebun Pintar" tumbuh dari pelajaran ke pelajaran.',
    icon: 'globe',
    bg: 'bg-jingga-300',
    lessons: [
      {
        id: 'html-1',
        title: 'Kerangka halaman',
        goal: 'Susun kerangka dasar yang dipakai semua halaman web.',
        lines: [
          { c: '<!DOCTYPE html>', r: 'Pembuka dokumen', w: 'Memberi tahu browser bahwa ini halaman HTML5. Selalu di baris paling atas.' },
          { c: '<html lang="id">', r: 'Pembungkus semua isi', w: 'Semua isi halaman ada di dalam tag html. lang="id" berarti bahasanya Indonesia.' },
          { c: '<head>', i: 1, r: 'Kepala halaman', w: 'Berisi keterangan halaman yang tidak tampil di layar, misalnya judul tab.' },
          { c: '<title>Kebun Pintar</title>', i: 2, r: 'Judul di tab browser', w: 'Teks di antara <title> dan </title> tampil di tab browser.' },
          { c: '</head>', i: 1, r: 'Menutup kepala', w: 'Tag penutup memakai garis miring /. Kepala selesai, badan dimulai.' },
          { c: '<body>', i: 1, r: 'Badan halaman', w: 'Semua yang terlihat di layar (tulisan, gambar, tombol) ada di dalam body.' },
          { c: '<h1>Kebun Pintar</h1>', i: 2, r: 'Judul besar di layar', w: 'h1 adalah judul terbesar. Inilah yang kamu lihat di layar hasil.' },
          { c: '</body>', i: 1, r: 'Menutup badan', w: 'Setiap tag yang dibuka harus ditutup, urutannya dari yang paling dalam.' },
          { c: '</html>', r: 'Menutup halaman', w: 'Baris terakhir. Penutup html selalu paling bawah.' },
        ],
      },
      {
        id: 'html-2',
        title: 'Judul dan paragraf',
        goal: 'Tambahkan judul kecil dan paragraf ke badan halaman.',
        lines: [
          { c: '<h2>Tanaman favoritku</h2>', r: 'Judul lebih kecil', w: 'h2 lebih kecil dari h1. Ada sampai h6.' },
          { c: '<p>Bunga matahari suka cahaya.</p>', r: 'Paragraf pertama', w: 'p = paragraph, dipakai untuk teks biasa.' },
          { c: '<p>Aku menyiramnya tiap pagi.</p>', r: 'Paragraf kedua', w: 'Setiap p mulai di baris baru, jadi teks terpisah rapi.' },
        ],
      },
      {
        id: 'html-3',
        title: 'Daftar',
        goal: 'Buat daftar tanaman di kebun.',
        lines: [
          { c: '<h2>Daftar tanaman</h2>', r: 'Judul daftar', w: 'Daftar biasanya diberi judul dulu.' },
          { c: '<ul>', r: 'Membuka daftar', w: 'ul = unordered list, daftar bertitik tanpa urutan nomor.' },
          { c: '<li>Mawar</li>', i: 1, g: 'a', r: 'Isi daftar (urutan bebas)', w: 'li = list item, satu butir dalam daftar.' },
          { c: '<li>Melati</li>', i: 1, g: 'a', r: 'Isi daftar (urutan bebas)', w: 'Setiap butir daftar memakai li sendiri.' },
          { c: '<li>Anggrek</li>', i: 1, g: 'a', r: 'Isi daftar (urutan bebas)', w: 'Daftar boleh berisi berapa saja li.' },
          { c: '</ul>', r: 'Menutup daftar', w: 'Daftar harus ditutup setelah semua li selesai.' },
        ],
      },
      {
        id: 'html-4',
        title: 'Tautan dan tombol',
        goal: 'Buat tautan, pindah baris, dan tombol.',
        lines: [
          { c: '<h2>Menu</h2>', r: 'Judul', w: 'Judul kecil untuk bagian menu.' },
          { c: '<a href="#belajar">Belajar berkebun</a>', r: 'Tautan', w: 'a = anchor (tautan). href berisi tujuan tautan; teks di tengahnya yang diketuk.' },
          { c: '<br>', r: 'Pindah baris', w: 'br memindahkan ke baris baru. Tag kosong: tidak perlu penutup.' },
          { c: '<button>Siram tanaman</button>', r: 'Tombol', w: 'button membuat tombol yang bisa diketuk.' },
        ],
      },
      {
        id: 'html-5',
        title: 'Kotak, id, dan class',
        goal: 'Bungkus isi dalam kotak dan beri nama agar bisa dirias CSS.',
        lines: [
          { c: '<div class="kartu">', r: 'Kotak pembungkus', w: 'div adalah kotak kosong untuk mengelompokkan isi. class memberi nama kelompok untuk dirias CSS.' },
          { c: '<h3 id="judul">Kartu Kebun</h3>', i: 1, r: 'Judul ber-id', w: 'id adalah nama unik untuk SATU elemen. Dua elemen tidak boleh punya id yang sama.' },
          { c: '<p class="isi">Pemilik: Budi</p>', i: 1, r: 'Paragraf ber-class', w: 'class boleh dipakai banyak elemen sekaligus.' },
          { c: '</div>', r: 'Menutup kotak', w: 'Tag div ditutup setelah semua isinya.' },
        ],
      },
      {
        id: 'html-6',
        title: 'Formulir',
        goal: 'Buat formulir kecil untuk menambah tanaman.',
        lines: [
          { c: '<form>', r: 'Membuka formulir', w: 'form membungkus kolom isian dan tombol kirim.' },
          { c: '<label for="nama">Nama tanaman:</label>', i: 1, r: 'Label kolom', w: 'label memberi nama pada kolom. for harus sama dengan id kolomnya.' },
          { c: '<input id="nama" type="text">', i: 1, r: 'Kolom isian', w: 'input adalah kolom untuk mengetik. id="nama" cocok dengan for pada label.' },
          { c: '<button type="submit">Tambah</button>', i: 1, r: 'Tombol kirim', w: 'type="submit" artinya tombol ini mengirim isi formulir.' },
          { c: '</form>', r: 'Menutup formulir', w: 'Formulir ditutup setelah semua isinya.' },
        ],
      },
    ],
  },
  {
    id: 'css',
    title: 'CSS: Merias Halaman',
    desc: 'Bahasa untuk warna, ukuran, dan tata letak. Aturan lama tetap ada, aturan baru ditambahkan.',
    icon: 'pencil',
    bg: 'bg-langit-300',
    lessons: [
      {
        id: 'css-1',
        title: 'Warna',
        goal: 'Ubah warna tulisan dan latar judul.',
        base: ['<h1>Halo Pinta</h1>', '<p>Belajar CSS itu seru.</p>'],
        lines: [
          { c: 'h1 {', r: 'Pilih elemen + buka aturan', w: 'h1 adalah pemilih: elemen mana yang dirias. Tanda { membuka aturan.' },
          { c: 'color: green;', i: 1, g: 'a', r: P, w: 'color mengatur warna tulisan. Setiap sifat diakhiri titik koma ;' },
          { c: 'background: yellow;', i: 1, g: 'a', r: P, w: 'background mengatur warna latar belakang.' },
          { c: '}', r: 'Menutup aturan', w: 'Tanda } menutup aturan CSS.' },
        ],
      },
      {
        id: 'css-2',
        title: 'Ukuran dan jarak',
        goal: 'Atur lebar, jarak dalam, garis tepi, dan jarak luar sebuah kotak.',
        base: ['<div class="kotak">Aku kotak</div>'],
        lines: [
          { c: '.kotak {', r: 'Pilih class + buka aturan', w: 'Titik di depan nama berarti memilih elemen ber-class itu.' },
          { c: 'width: 200px;', i: 1, g: 'a', r: P, w: 'width = lebar kotak. px = piksel, titik kecil di layar.' },
          { c: 'padding: 16px;', i: 1, g: 'a', r: P, w: 'padding = jarak di DALAM kotak, antara tulisan dan tepi.' },
          { c: 'border: 3px solid black;', i: 1, g: 'a', r: P, w: 'border = garis tepi: tebal, jenis garis, dan warnanya.' },
          { c: 'margin: 20px;', i: 1, g: 'a', r: P, w: 'margin = jarak di LUAR kotak, antara kotak dan benda lain.' },
          { c: '}', r: 'Menutup aturan', w: 'Aturan selesai.' },
        ],
      },
      {
        id: 'css-3',
        title: 'Gaya tulisan',
        goal: 'Besarkan, tebalkan, dan tengahkan tulisan.',
        base: ['<p id="judul">Selamat Datang</p>'],
        lines: [
          { c: '#judul {', r: 'Pilih id + buka aturan', w: 'Tanda # memilih elemen yang punya id itu. Ingat: id hanya untuk satu elemen.' },
          { c: 'font-size: 32px;', i: 1, g: 'a', r: P, w: 'font-size = besar huruf.' },
          { c: 'font-weight: bold;', i: 1, g: 'a', r: P, w: 'font-weight: bold membuat huruf tebal.' },
          { c: 'text-align: center;', i: 1, g: 'a', r: P, w: 'text-align: center menengahkan tulisan.' },
          { c: 'color: darkblue;', i: 1, g: 'a', r: P, w: 'Warna tulisan biru tua.' },
          { c: '}', r: 'Menutup aturan', w: 'Aturan selesai.' },
        ],
      },
      {
        id: 'css-4',
        title: 'Flexbox: sejajar',
        goal: 'Jajarkan tiga kotak ke samping dengan rapi.',
        base: [
          '<div class="baris">',
          '  <span style="background: orange; padding: 12px">A</span>',
          '  <span style="background: orange; padding: 12px">B</span>',
          '  <span style="background: orange; padding: 12px">C</span>',
          '</div>',
        ],
        lines: [
          { c: '.baris {', r: 'Pilih class + buka aturan', w: 'Kita merias pembungkusnya, bukan satu per satu isinya.' },
          { c: 'display: flex;', i: 1, g: 'a', r: P, w: 'display: flex menjajarkan anak-anaknya ke samping.' },
          { c: 'gap: 12px;', i: 1, g: 'a', r: P, w: 'gap = jarak antar kotak.' },
          { c: 'justify-content: center;', i: 1, g: 'a', r: P, w: 'justify-content: center menaruh semuanya di tengah.' },
          { c: '}', r: 'Menutup aturan', w: 'Aturan selesai.' },
        ],
      },
      {
        id: 'css-5',
        title: 'Tombol keren',
        goal: 'Rias tombol dan ubah warnanya saat disentuh.',
        base: ['<button class="tombol">Sentuh aku</button>'],
        lines: [
          { c: '.tombol {', r: 'Aturan biasa: buka', w: 'Aturan untuk tombol dalam keadaan biasa.' },
          { c: 'background: green;', i: 1, g: 'a', r: P, w: 'Latar hijau.' },
          { c: 'color: white;', i: 1, g: 'a', r: P, w: 'Tulisan putih agar jelas di atas hijau.' },
          { c: 'border-radius: 12px;', i: 1, g: 'a', r: P, w: 'border-radius membulatkan sudut.' },
          { c: 'padding: 12px 20px;', i: 1, g: 'a', r: P, w: 'Dua angka: jarak atas-bawah lalu kiri-kanan.' },
          { c: '}', r: 'Aturan biasa: tutup', w: 'Aturan pertama selesai.' },
          { c: '.tombol:hover {', r: 'Aturan saat disentuh: buka', w: ':hover berlaku saat penunjuk atau jari menyentuh elemen.' },
          { c: 'background: orange;', i: 1, r: 'Warna saat disentuh', w: 'Warna latar berubah jadi jingga saat disentuh.' },
          { c: '}', r: 'Aturan saat disentuh: tutup', w: 'Aturan kedua selesai.' },
        ],
      },
    ],
  },
  {
    id: 'js',
    title: 'JavaScript: Membuat Hidup',
    desc: 'Bahasa agar halaman bisa berpikir dan bereaksi. Program tumbuh dari pelajaran ke pelajaran.',
    icon: 'bulb',
    bg: 'bg-kuning-300',
    lessons: [
      {
        id: 'js-1',
        title: 'Variabel',
        goal: 'Simpan nama dan umur, lalu tampilkan di layar.',
        base: ['<h2 id="sapa"></h2>'],
        lines: [
          { c: 'let nama = "Pinta";', g: 'a', r: 'Siapkan data (urutan bebas)', w: 'let membuat kotak penyimpan bernama nama. Isinya teks "Pinta".' },
          { c: 'let umur = 8;', g: 'a', r: 'Siapkan data (urutan bebas)', w: 'Angka tidak memakai tanda kutip.' },
          { c: 'let layar = document.getElementById("sapa");', g: 'a', r: 'Siapkan data (urutan bebas)', w: 'Mengambil elemen ber-id "sapa" dari halaman, disimpan di layar.' },
          { c: 'layar.textContent = nama + " berumur " + umur + " tahun";', r: 'Tulis ke layar', w: 'textContent mengisi tulisan elemen. Tanda + menyambung teks dan isi variabel.' },
        ],
      },
      {
        id: 'js-2',
        title: 'Kondisi: if dan else',
        goal: 'Komputer memilih tulisan berdasarkan nilai.',
        base: ['<p id="kabar"></p>'],
        lines: [
          { c: 'let nilai = 85;', g: 'a', r: 'Siapkan data (urutan bebas)', w: 'Menyimpan nilai ujian.' },
          { c: 'let pesan = document.getElementById("kabar");', g: 'a', r: 'Siapkan data (urutan bebas)', w: 'Mengambil elemen tempat menulis kabar.' },
          { c: 'if (nilai >= 75) {', r: 'Jika syarat benar', w: 'if = jika. >= berarti "lebih besar atau sama dengan".' },
          { c: 'pesan.textContent = "Lulus, hebat!";', i: 1, r: 'Dikerjakan jika benar', w: 'Baris ini hanya jalan kalau syarat benar.' },
          { c: '} else {', r: 'Kalau tidak', w: 'else = kalau syaratnya salah, kerjakan yang ini.' },
          { c: 'pesan.textContent = "Ayo coba lagi";', i: 1, r: 'Dikerjakan jika salah', w: 'Baris ini jalan kalau nilai kurang dari 75.' },
          { c: '}', r: 'Menutup kondisi', w: 'Kurung kurawal penutup mengakhiri if-else.' },
        ],
      },
      {
        id: 'js-3',
        title: 'Perulangan: for',
        goal: 'Suruh komputer menulis daftar tanpa mengetik berulang.',
        base: ['<ul id="daftar"></ul>'],
        lines: [
          { c: 'let daftar = document.getElementById("daftar");', r: 'Ambil elemen daftar', w: 'Mengambil elemen ul ber-id "daftar".' },
          { c: 'for (let i = 1; i <= 3; i++) {', r: 'Mulai perulangan', w: 'Mulai dari i = 1, ulangi selama i <= 3, tiap putaran i naik 1 (i++).' },
          { c: 'daftar.innerHTML += "<li>Hitungan " + i + "</li>";', i: 1, r: 'Isi yang diulang', w: 'Tiap putaran menambah satu butir li. += artinya menambahkan.' },
          { c: '}', r: 'Menutup perulangan', w: 'Akhir blok yang diulang.' },
        ],
      },
      {
        id: 'js-4',
        title: 'Fungsi',
        goal: 'Buat mesin kecil yang bisa dipakai berkali-kali.',
        base: ['<p id="jumlah"></p>'],
        lines: [
          { c: 'function tambah(a, b) {', r: 'Membuat fungsi', w: 'function membuat mesin bernama tambah. a dan b adalah bahan yang dimasukkan.' },
          { c: 'return a + b;', i: 1, r: 'Hasil mesin', w: 'return mengembalikan hasil kepada pemanggil.' },
          { c: '}', r: 'Menutup fungsi', w: 'Akhir isi fungsi.' },
          { c: 'let total = tambah(7, 5);', r: 'Memakai fungsi', w: 'Memanggil mesin dengan bahan 7 dan 5. Hasilnya, 12, disimpan di total.' },
          { c: 'document.getElementById("jumlah").textContent = "7 + 5 = " + total;', r: 'Tampilkan hasil', w: 'Menulis hasilnya ke layar.' },
        ],
      },
      {
        id: 'js-5',
        title: 'Event: tombol diketuk',
        goal: 'Buat penghitung ketukan yang bereaksi pada jari.',
        base: ['<button id="tombol">Tekan aku</button>', '<p id="klik">Belum ada klik</p>'],
        lines: [
          { c: 'let hitung = 0;', g: 'a', r: 'Siapkan data (urutan bebas)', w: 'Penghitung dimulai dari 0.' },
          { c: 'let tombol = document.getElementById("tombol");', g: 'a', r: 'Siapkan data (urutan bebas)', w: 'Mengambil tombol dari halaman.' },
          { c: 'tombol.addEventListener("click", function () {', r: 'Pasang pendengar ketukan', w: 'Artinya: saat tombol diketuk ("click"), jalankan isi fungsi di bawah.' },
          { c: 'hitung = hitung + 1;', i: 1, r: 'Tambah hitungan', w: 'Setiap ketukan menambah hitung 1.' },
          { c: 'document.getElementById("klik").textContent = "Klik: " + hitung;', i: 1, r: 'Tampilkan hitungan', w: 'Menulis hitungan terbaru ke layar.' },
          { c: '});', r: 'Menutup pendengar', w: 'Menutup fungsi dan pemanggilan addEventListener sekaligus.' },
        ],
      },
    ],
  },
  {
    id: 'py',
    title: 'Python: Bahasa Serbaguna',
    desc: 'Bahasa yang mudah dibaca untuk logika, data, dan AI. Keluaran dicocokkan dengan Python asli.',
    icon: 'calc',
    bg: 'bg-langit-100',
    lessons: [
      {
        id: 'py-1',
        title: 'Menyapa dengan print',
        goal: 'Simpan nama lalu tampilkan sapaan.',
        lines: [
          { c: 'nama = "Pinta"', r: 'Simpan data', w: 'Tanda = menyimpan isi ke dalam variabel nama. Python tidak butuh kata let.' },
          { c: 'print("Halo, " + nama)', r: 'Tampilkan sapaan', w: 'print menampilkan tulisan di layar. Tanda + menyambung teks.' },
          { c: 'print("Selamat belajar!")', r: 'Tampilkan salam', w: 'Setiap print mencetak satu baris baru.' },
        ],
        out: 'Halo, Pinta\nSelamat belajar!',
      },
      {
        id: 'py-2',
        title: 'Berhitung',
        goal: 'Jumlahkan dua angka dengan variabel.',
        lines: [
          { c: 'a = 7', g: 'a', r: 'Siapkan angka (urutan bebas)', w: 'Variabel a berisi angka 7.' },
          { c: 'b = 5', g: 'a', r: 'Siapkan angka (urutan bebas)', w: 'Variabel b berisi angka 5.' },
          { c: 'jumlah = a + b', r: 'Hitung', w: 'Python menghitung a + b lalu menyimpannya di jumlah.' },
          { c: 'print("Jumlah:", jumlah)', r: 'Tampilkan hasil', w: 'Tanda koma di print menaruh spasi di antara bagian-bagiannya.' },
        ],
        out: 'Jumlah: 12',
      },
      {
        id: 'py-3',
        title: 'Jika dan kalau tidak',
        goal: 'Pilih tulisan berdasarkan nilai.',
        lines: [
          { c: 'nilai = 80', r: 'Siapkan nilai', w: 'Nilai ujian disimpan di variabel.' },
          { c: 'if nilai >= 75:', r: 'Jika syarat benar', w: 'Perhatikan titik dua (:) di akhir. Ia membuka blok yang menjorok.' },
          { c: 'print("Lulus")', i: 1, r: 'Dikerjakan jika benar', w: 'Menjorok 4 spasi. Di Python, jorokan menentukan baris ini milik if.' },
          { c: 'else:', r: 'Kalau tidak', w: 'else juga diakhiri titik dua.' },
          { c: 'print("Coba lagi")', i: 1, r: 'Dikerjakan jika salah', w: 'Juga menjorok: ini milik else.' },
        ],
        out: 'Lulus',
      },
      {
        id: 'py-4',
        title: 'Perulangan: for',
        goal: 'Hitung dari 1 sampai 3.',
        lines: [
          { c: 'for i in range(1, 4):', r: 'Mulai perulangan', w: 'range(1, 4) menghasilkan 1, 2, 3. Angka akhir (4) tidak ikut.' },
          { c: 'print("Hitungan", i)', i: 1, r: 'Isi yang diulang', w: 'Menjorok, jadi diulang setiap putaran.' },
          { c: 'print("Selesai")', r: 'Setelah perulangan', w: 'Tidak menjorok, jadi hanya dijalankan sekali di akhir.' },
        ],
        out: 'Hitungan 1\nHitungan 2\nHitungan 3\nSelesai',
      },
      {
        id: 'py-5',
        title: 'Daftar (list)',
        goal: 'Simpan beberapa buah dan cetak satu per satu.',
        lines: [
          { c: 'buah = ["apel", "jeruk", "mangga"]', r: 'Membuat daftar', w: 'Kurung siku [ ] membuat list, isinya dipisah koma.' },
          { c: 'buah.append("pisang")', r: 'Menambah isi', w: 'append menambahkan satu butir di akhir daftar.' },
          { c: 'for b in buah:', r: 'Telusuri daftar', w: 'b mengambil satu isi daftar setiap putaran.' },
          { c: 'print(b)', i: 1, r: 'Cetak satu butir', w: 'Dijalankan untuk tiap buah.' },
        ],
        out: 'apel\njeruk\nmangga\npisang',
      },
      {
        id: 'py-6',
        title: 'Fungsi sapaan',
        goal: 'Buat mesin sapaan yang bisa dipakai berulang.',
        lines: [
          { c: 'def sapa(teman):', r: 'Membuat fungsi', w: 'def membuat fungsi bernama sapa. teman adalah bahan yang dimasukkan.' },
          { c: 'return "Halo, " + teman', i: 1, r: 'Hasil fungsi', w: 'return mengembalikan hasilnya.' },
          { c: 'print(sapa("Budi"))', r: 'Pakai fungsi pertama', w: 'Memanggil sapa dengan bahan "Budi".' },
          { c: 'print(sapa("Ani"))', r: 'Pakai fungsi kedua', w: 'Mesin yang sama bisa dipakai lagi dengan bahan lain.' },
        ],
        out: 'Halo, Budi\nHalo, Ani',
      },
    ],
  },
  {
    id: 'sql',
    title: 'SQL: Bicara dengan Database',
    desc: 'Bahasa untuk menyimpan dan mencari data. Satu database tumbuh dari pelajaran ke pelajaran. Hasilnya simulasi.',
    icon: 'board',
    bg: 'bg-hijau-300',
    lessons: [
      {
        id: 'sql-1',
        title: 'Membuat tabel',
        goal: 'Buat tabel siswa untuk menyimpan data.',
        lines: [
          { c: 'CREATE TABLE siswa (', r: 'Buat tabel baru', w: 'CREATE TABLE membuat tabel, mirip lembar tabel kosong. Namanya: siswa.' },
          { c: 'id INTEGER PRIMARY KEY,', i: 1, r: 'Kolom nomor unik', w: 'Kolom id berisi angka bulat. PRIMARY KEY berarti tiap baris punya id yang berbeda.' },
          { c: 'nama TEXT,', i: 1, r: 'Kolom teks', w: 'Kolom nama berisi teks.' },
          { c: 'kelas INTEGER,', i: 1, r: 'Kolom angka', w: 'Kolom kelas berisi angka bulat.' },
          { c: 'nilai INTEGER', i: 1, r: 'Kolom angka terakhir', w: 'Kolom terakhir tanpa koma di ujungnya.' },
          { c: ');', r: 'Menutup', w: 'Penutup dan titik koma mengakhiri perintah.' },
        ],
        sql: { before: [], caption: 'Tabel siswa sudah dibuat, masih kosong.', result: SISWA_KOSONG },
      },
      {
        id: 'sql-2',
        title: 'Menambah data',
        goal: 'Isi tabel dengan lima siswa.',
        lines: [
          { c: 'INSERT INTO siswa (nama, kelas, nilai)', r: 'Pilih tabel dan kolom', w: 'INSERT INTO = masukkan ke tabel siswa. Di dalam kurung: kolom yang diisi (id dibuat otomatis).' },
          { c: "VALUES ('Ani', 4, 90),", i: 1, r: 'Siswa pertama', w: 'VALUES berisi nilai sesuai urutan kolom. Teks memakai tanda kutip satu, angka tidak.' },
          { c: "('Budi', 5, 75),", i: 1, r: 'Siswa kedua', w: 'Tiap baris data dipisah koma.' },
          { c: "('Citra', 4, 85),", i: 1, r: 'Siswa ketiga', w: 'Urutan baris menentukan id otomatisnya.' },
          { c: "('Dedi', 5, 60),", i: 1, r: 'Siswa keempat', w: 'Baris terakhir nanti diakhiri titik koma.' },
          { c: "('Eka', 6, 95);", i: 1, r: 'Siswa kelima', w: 'Titik koma mengakhiri perintah INSERT.' },
        ],
        sql: { before: [SISWA_KOSONG], caption: 'Lima siswa masuk. id dibuat otomatis.', result: SISWA },
      },
      {
        id: 'sql-3',
        title: 'Membaca data: SELECT',
        goal: 'Ambil nama dan nilai semua siswa.',
        lines: [
          { c: 'SELECT nama, nilai', r: 'Pilih kolom', w: 'SELECT = ambil. Setelahnya tulis kolom yang diinginkan.' },
          { c: 'FROM siswa;', r: 'Dari tabel mana', w: 'FROM menyebut tabel sumber datanya.' },
        ],
        sql: { before: [SISWA], caption: 'Hanya dua kolom yang diambil.', result: { name: 'hasil', cols: ['nama', 'nilai'], rows: SISWA.rows.map((r) => [r[1], r[3]]) } },
      },
      {
        id: 'sql-4',
        title: 'Menyaring: WHERE',
        goal: 'Ambil siswa yang nilainya 80 ke atas.',
        lines: [
          { c: 'SELECT nama, nilai', r: 'Pilih kolom', w: 'Kolom yang ingin dilihat.' },
          { c: 'FROM siswa', r: 'Dari tabel mana', w: 'Tabel sumber. Titik koma baru di akhir perintah.' },
          { c: 'WHERE nilai >= 80;', r: 'Syarat penyaring', w: 'WHERE menyaring baris. Hanya yang nilainya 80 atau lebih yang lolos.' },
        ],
        sql: { before: [SISWA], caption: 'Tiga siswa lolos saringan.', result: { name: 'hasil', cols: ['nama', 'nilai'], rows: [['Ani', 90], ['Citra', 85], ['Eka', 95]] } },
      },
      {
        id: 'sql-5',
        title: 'Mengurutkan: ORDER BY',
        goal: 'Ambil siswa kelas 5, nilai tertinggi di atas.',
        lines: [
          { c: 'SELECT nama, nilai', r: 'Pilih kolom', w: 'Kolom yang ingin dilihat.' },
          { c: 'FROM siswa', r: 'Dari tabel mana', w: 'Tabel sumber.' },
          { c: 'WHERE kelas = 5', r: 'Syarat penyaring', w: 'Satu tanda sama dengan (=) berarti "sama dengan" di SQL.' },
          { c: 'ORDER BY nilai DESC;', r: 'Urutan hasil', w: 'ORDER BY mengurutkan. DESC = dari besar ke kecil (ASC = kecil ke besar).' },
        ],
        sql: { before: [SISWA], caption: 'Siswa kelas 5, nilai terbesar dulu.', result: { name: 'hasil', cols: ['nama', 'nilai'], rows: [['Budi', 75], ['Dedi', 60]] } },
      },
      {
        id: 'sql-6',
        title: 'Menghitung: GROUP BY',
        goal: 'Hitung ada berapa siswa di tiap kelas.',
        lines: [
          { c: 'SELECT kelas, COUNT(*) AS jumlah', r: 'Pilih kolom dan hitungan', w: 'COUNT(*) menghitung baris. AS jumlah memberi nama kolom hasilnya.' },
          { c: 'FROM siswa', r: 'Dari tabel mana', w: 'Tabel sumber.' },
          { c: 'GROUP BY kelas', r: 'Kelompokkan', w: 'GROUP BY menggabungkan baris yang kelasnya sama, lalu dihitung per kelompok.' },
          { c: 'ORDER BY kelas;', r: 'Urutkan', w: 'Hasil diurutkan dari kelas terkecil.' },
        ],
        sql: { before: [SISWA], caption: 'Jumlah siswa per kelas.', result: { name: 'hasil', cols: ['kelas', 'jumlah'], rows: [[4, 2], [5, 2], [6, 1]] } },
      },
    ],
  },
  {
    id: 'git',
    title: 'Git: Menyimpan Riwayat Kode',
    desc: 'Cara programmer menyimpan versi dan bekerja bersama. Satu sesi terminal tumbuh dari pelajaran ke pelajaran. Keluaran simulasi.',
    icon: 'shield',
    bg: 'bg-kuning-100',
    lessons: [
      {
        id: 'git-1',
        title: 'Membuat proyek',
        goal: 'Buat folder proyek dan mulai pelacakan Git.',
        lines: [
          { c: 'mkdir proyek', r: 'Buat folder', w: 'mkdir = make directory, membuat folder baru bernama proyek.' },
          { c: 'cd proyek', r: 'Masuk ke folder', w: 'cd = change directory, pindah masuk ke folder itu.' },
          { c: 'git init', r: 'Mulai Git', w: 'git init membuat "buku catatan riwayat" tersembunyi di folder ini.' },
        ],
        out: 'Initialized empty Git repository in proyek/.git/',
      },
      {
        id: 'git-2',
        title: 'Menyimpan versi (commit)',
        goal: 'Simpan versi pertama proyekmu.',
        lines: [
          { c: 'echo "Halo" > index.html', r: 'Buat berkas', w: 'echo menulis kata Halo, tanda > memasukkannya ke berkas index.html.' },
          { c: 'git add index.html', r: 'Pilih berkas', w: 'git add memilih berkas yang akan ikut disimpan (seperti memasukkan ke keranjang).' },
          { c: 'git commit -m "Halaman pertama"', r: 'Simpan versi', w: 'git commit menyimpan versi. -m diikuti pesan singkat tentang isi versi ini.' },
        ],
        out: '[main (root-commit) 1a2b3c4] Halaman pertama\n 1 file changed, 1 insertion(+)',
      },
      {
        id: 'git-3',
        title: 'Cabang (branch)',
        goal: 'Buat cabang untuk mencoba fitur baru dengan aman.',
        lines: [
          { c: 'git branch fitur-baru', r: 'Buat cabang', w: 'Cabang adalah salinan jalur kerja untuk bereksperimen tanpa merusak yang utama.' },
          { c: 'git switch fitur-baru', r: 'Pindah cabang', w: 'git switch pindah ke cabang itu.' },
          { c: 'git branch', r: 'Lihat cabang', w: 'Menampilkan daftar cabang. Tanda * menunjukkan cabang yang sedang dipakai.' },
        ],
        out: "Switched to branch 'fitur-baru'\n* fitur-baru\n  main",
      },
      {
        id: 'git-4',
        title: 'Mengubah di cabang',
        goal: 'Tambah isi di cabang fitur lalu simpan versinya.',
        lines: [
          { c: 'echo "Halaman kebun" >> index.html', r: 'Tambah isi berkas', w: 'Tanda >> menambahkan ke akhir berkas (satu > akan menimpa isi lama).' },
          { c: 'git commit -am "Tambah isi halaman"', r: 'Simpan versi', w: '-a ikut menyimpan berkas lama yang berubah, -m memberi pesan. Digabung jadi -am.' },
        ],
        out: '[fitur-baru 5d6e7f8] Tambah isi halaman\n 1 file changed, 1 insertion(+)',
      },
      {
        id: 'git-5',
        title: 'Menggabung dan mengirim',
        goal: 'Gabungkan fitur ke cabang utama lalu kirim ke GitHub.',
        lines: [
          { c: 'git remote add origin git@github.com:aku/proyek.git', r: 'Daftarkan alamat GitHub', w: 'Menamai alamat GitHub-mu "origin" supaya mudah dipakai.' },
          { c: 'git switch main', r: 'Kembali ke utama', w: 'Pindah ke cabang utama, tempat fitur akan digabung.' },
          { c: 'git merge fitur-baru', r: 'Gabungkan', w: 'merge memasukkan hasil kerja fitur-baru ke cabang yang sedang aktif.' },
          { c: 'git push origin main', r: 'Kirim ke GitHub', w: 'push mengirim riwayat ke GitHub lewat alamat origin.' },
        ],
        out: "Switched to branch 'main'\nUpdating 1a2b3c4..5d6e7f8\nFast-forward\n index.html | 1 +\n 1 file changed, 1 insertion(+)\nTo github.com:aku/proyek.git\n * [new branch]      main -> main",
      },
    ],
  },
];

export const ALL_LESSONS = TRACKS.flatMap((t) => t.lessons);
export const KODE_TOTAL = ALL_LESSONS.length;
