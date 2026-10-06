# DOKUMEN TECHNICAL PLAN
## SISTEM MONITORING ADMINISTRASI PERKARA & DOKUMEN P-48
(P-48, B-18, BA-20, BA-21, BA-22, BA-23, & Pendapat Hukum)

---

### 1. Arsitektur Aplikasi
Aplikasi dibangun menggunakan arsitektur **Single Page Application (SPA)** berbasis Vue.js 3 dengan **Options API** dan Bootstrap 5, terintegrasi langsung dengan **Supabase** (PostgreSQL + Realtime):
* **Presentation Layer**: Vue 3 (Options API) + Bootstrap 5.3 + Bootstrap Icons.
* **Component Model**: Arsitektur modular yang memisahkan tabel utama, panel rincian collapse, modal form perkara, modal import, dan modal manajemen penerima BA-20.
* **Data Layer / Client**: Supabase JS Client (`@supabase/supabase-js`) dengan fallback local storage berstruktur relasional identik jika kredensial belum dikonfigurasi.
* **Database & Storage**: Supabase PostgreSQL dengan Row-Level Security (RLS) dan cascade delete.

```
+-------------------------------------------------------------------------+
|                        Browser Client (Vue 3 Options API)               |
|                                                                         |
|  [App.vue]                                                              |
|   ├── [HeaderBar & MetricCards] (Ringkasan Total, Lelang, BA20, BA23)   |
|   ├── [PerkaraTable.vue] (Universal Search, Multi-Sort, Pagination)     |
|   │     ├── Inline Badge Status Dropdowns (Lelang, BA23, Pendapat Hukum)|
|   │     ├── [LelangDetail.vue] (Collapse: B-18, BA-21, BA-22)           |
|   │     └── [BA20Detail.vue] (Collapse: Daftar Penerima BA-20)          |
|   ├── [PerkaraFormModal.vue] (Tambah / Edit Data Perkara)               |
|   ├── [ImportModal.vue] (Tab File Upload & Tab Paste CSV + Preview)     |
|   └── [SupabaseConfigModal.vue] (Setup Kredensial & SQL Schema Helper)  |
+-------------------------------------------------------------------------+
                                    |
                                    v (Supabase JS SDK)
+-------------------------------------------------------------------------+
|                     Supabase Backend (PostgreSQL)                       |
|   - Table: `perkara` (Unique: `nomor_register_perkara`)                 |
|   - Table: `ba20_penerima` (FK: `perkara_id` ON DELETE CASCADE)         |
|   - Realtime Subscriptions / Immediate Refresh on Mutation              |
+-------------------------------------------------------------------------+
```

---

### 2. Struktur Database Supabase

Database menggunakan PostgreSQL bawaan Supabase. Seluruh status menggunakan kode internal standar:
* Status Dokumen Umum (`b18_status`, `ba21_status`, `ba22_status`, `ba23_status`, `pendapat_hukum_status`):
  - `'tidak_ada'`
  - `'belum_dibuat'`
  - `'sudah_dibuat'`
* Status BA-20 (`ba20_status`):
  - `'tidak_ada'`
  - `'ada'`
* Status Penerima BA-20 (`status_ba20`):
  - `'belum_dibuat'`
  - `'sudah_dibuat'`

---

### 3. ERD Sederhana

```
+-------------------------------------+         +-------------------------------------+
|              perkara                |         |            ba20_penerima            |
+-------------------------------------+         +-------------------------------------+
| PK  id                     UUID     |<---+    | PK  id                     UUID     |
|     nomor_surat            TEXT     |    |    | FK  perkara_id             UUID     |
|     tgl_surat              TEXT     |    +---o{     nama_penerima          TEXT     |
| UK  nomor_register_perkara TEXT     |         |     status_ba20            TEXT     |
|     nama_terpidana         TEXT     |         |     created_at             TIMESTAMPTZ
|     b18_status             TEXT     |         |     updated_at             TIMESTAMPTZ
|     ba21_status            TEXT     |         +-------------------------------------+
|     ba22_status            TEXT     |
|     ba23_status            TEXT     |
|     pendapat_hukum_status  TEXT     |
|     ba20_status            TEXT     |
|     created_at             TIMESTAMPTZ
|     updated_at             TIMESTAMPTZ
+-------------------------------------+
```

---

### 4. Struktur Tabel dan Field

```sql
-- 1. Table perkara
CREATE TABLE IF NOT EXISTS public.perkara (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_surat TEXT NOT NULL,
    tgl_surat TEXT NOT NULL,
    nomor_register_perkara TEXT NOT NULL UNIQUE,
    nama_terpidana TEXT NOT NULL,
    b18_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (b18_status IN ('tidak_ada', 'belum_dibuat', 'sudah_dibuat')),
    ba21_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (ba21_status IN ('tidak_ada', 'belum_dibuat', 'sudah_dibuat')),
    ba22_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (ba22_status IN ('tidak_ada', 'belum_dibuat', 'sudah_dibuat')),
    ba23_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (ba23_status IN ('tidak_ada', 'belum_dibuat', 'sudah_dibuat')),
    pendapat_hukum_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (pendapat_hukum_status IN ('tidak_ada', 'belum_dibuat', 'sudah_dibuat')),
    ba20_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (ba20_status IN ('tidak_ada', 'ada')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table ba20_penerima
CREATE TABLE IF NOT EXISTS public.ba20_penerima (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perkara_id UUID NOT NULL REFERENCES public.perkara(id) ON DELETE CASCADE,
    nama_penerima TEXT NOT NULL,
    status_ba20 TEXT NOT NULL DEFAULT 'belum_dibuat' 
        CHECK (status_ba20 IN ('belum_dibuat', 'sudah_dibuat')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_perkara_reg ON public.perkara(nomor_register_perkara);
CREATE INDEX IF NOT EXISTS idx_ba20_perkara_id ON public.ba20_penerima(perkara_id);
```

---

### 5. Relasi Antar Tabel
* `perkara.id` berelasi 1:N (one-to-many) ke `ba20_penerima.perkara_id`.
* Ketika satu perkara dihapus dari tabel `perkara`, semua data penerima pada `ba20_penerima` yang memiliki `perkara_id` yang sama akan otomatis terhapus secara atomik melalui foreign key `ON DELETE CASCADE`.

---

### 6. Alur Import CSV
* User memilih **Tab 1: Upload File** (.csv, .txt) atau **Tab 2: Paste CSV**.
* Parser menangani:
  - Delimiter semicolon (`;`).
  - Field yang dibungkus tanda kutip `"..."` yang mengandung newline dan multiline (misal nama terpidana jamak).
  - Baris kosong dan spasi berlebih.
  - Header deteksi otomatis (`nomor_surat;tgl_surat;nomor_register_perkara;nama_terpidana`).
* Validasi per baris:
  - Cek kelengkapan `nomor_surat`, `tgl_surat`, `nomor_register_perkara`, dan `nama_terpidana`.
  - Jika ada field kosong atau format tidak sesuai, baris ditandai **Invalid** beserta alasannya.
* Deduplikasi CSV:
  - Jika terdapat `nomor_register_perkara` ganda di dalam file yang diunggah, parser mencatat duplikasi dan mengambil entri terakhir/terbaru.
* Tampilan Preview:
  - Rekap: Total Baris, Data Valid, Data Invalid, Data Duplikat.
  - Tabel preview 10 baris pertama data valid.
  - Tabel rincian baris error untuk kemudahan koreksi user.
* Konfirmasi Simpan: Tombol "Import Data" melakukan Upsert ke Supabase.

---

### 7. Mekanisme UPSERT Berdasarkan `nomor_register_perkara`
* Kunci identifikasi: `nomor_register_perkara`.
* **Prinsip Utama**: Import ulang CSV **tidak boleh** menimpa atau mereset status dokumen monitoring (`b18_status`, `ba21_status`, `ba22_status`, `ba23_status`, `pendapat_hukum_status`, `ba20_status`) maupun daftar penerima BA-20 yang sudah pernah disimpan sebelumnya!
* Implementasi Upsert:
  1. Fetch data perkara yang sudah ada berdasarkan array `nomor_register_perkara`.
  2. Untuk perkara yang **belum ada**: insert record baru dengan status default `'tidak_ada'`.
  3. Untuk perkara yang **sudah ada**: update hanya field biodata perkara (`nomor_surat`, `tgl_surat`, `nama_terpidana`, `updated_at`), mempertahankan seluruh nilai dokumen status yang ada.

---

### 8. State Management Vue (Options API)
* Tidak menggunakan Pinia yang berlebihan untuk menjaga arsitektur tetap bersih dan mudah dipelihara.
* `data()` di komponen root (`App.vue`) mengelola:
  - `perkaraList`: Array seluruh perkara beserta relasi penerimanya.
  - `searchQuery`: String pencarian universal.
  - `sortBy` dan `sortOrder`: Pengurutan kolom (Nomor Surat, Tanggal, Nama Terpidana, Status).
  - `currentPage` dan `perPage` (10, 25, 50, 100): Paginasi DataTables.
  - `activeCollapseLelang`: ID perkara yang sedang membuka detail Lelang.
  - `activeCollapseBA20`: ID perkara yang sedang membuka detail BA-20.
  - `loading`: Indikator loading untuk async call.
* Event emission (`$emit`) dari sub-komponen ke parent untuk aksi update status, edit perkara, dan manipulasi penerima.

---

### 9. Struktur Komponen (Vue 3 Options API)
```
src/
├── main.ts                       # Entry point aplikasi Vue
├── App.vue                       # Container utama & state manager
├── services/
│   ├── supabase.ts               # Inisialisasi Supabase Client & fallback storage
│   ├── perkaraService.ts         # Operasi CRUD, Upsert, & update status dokumen
│   └── csvParser.ts              # Robust CSV RFC-4180 parser dengan multi-line support
├── components/
│   ├── NavbarHeader.vue          # Top header & ringkasan indikator perkara
│   ├── PerkaraTable.vue          # DataTables utama dengan pagination, search, sort
│   ├── StatusBadgeDropdown.vue   # Dropdown inline dengan badge warna untuk status
│   ├── LelangDetail.vue          # Collapse row rincian B-18, BA-21, BA-22
│   ├── BA20Detail.vue            # Collapse row rincian penerima BA-20 & CRUD penerima
│   ├── PerkaraFormModal.vue      # Modal tambah / edit data perkara manual
│   ├── ImportModal.vue           # Modal import CSV (Upload file & Paste text)
│   ├── PenerimaModal.vue         # Modal tambah / edit penerima barang bukti BA-20
│   └── SupabaseConfigModal.vue   # Modal setting Supabase URL & Key + SQL Schema
└── assets/
    └── style.css                 # Custom styling pelengkap Bootstrap 5
```

---

### 10. Alur CRUD
* **Create (Tambah Perkara Manual)**:
  - Klik `+ Tambah Perkara`.
  - Input: Nomor Surat, Tanggal Surat (Datepicker), Nomor Register Perkara, Nama Terpidana.
  - Validasi: Nomor Register Perkara harus unik. Jika sudah ada, tampilkan notifikasi alert: *"Nomor register perkara sudah terdaftar."*
* **Read (DataTables)**:
  - Menampilkan daftar perkara dengan format rapi.
  - Pencarian universal mencari ke seluruh field: nomor surat, nomor register, nama terpidana.
* **Update**:
  - Edit identitas perkara melalui modal edit.
  - Ubah status dokumen langsung dari tabel tanpa modal (inline dropdown dengan badge).
* **Delete**:
  - Tombol hapus dengan SweetAlert2 konfirmasi: *"Apakah Anda yakin ingin menghapus perkara ini?"*
  - Menghapus record perkara di database dan otomatis menghapus seluruh penerima BA-20 terkait.

---

### 11. Alur BA-20 dan Daftar Penerima
* Kolom **Dikembalikan BA-20** memiliki dropdown:
  - `'tidak_ada'` (Badge `bg-secondary`)
  - `'ada'` (Badge `bg-success`)
* Jika bernilai `'ada'`:
  - Muncul tombol dropdown/toggle `Detail Penerima (N)`.
  - Klik tombol membuka panel collapse Bootstrap di bawah baris perkara bersangkutan.
  - Di dalam collapse terdapat:
    - Tombol `+ Tambah Penerima`.
    - Daftar penerima: Nama Penerima dan status BA-20 masing-masing (`Belum Dibuat` / `Sudah Dibuat`).
    - Status dapat diganti seketika dengan badge dropdown.
    - Tombol edit nama dan hapus penerima.
    - Jika belum ada data penerima, tampilkan teks empty-state: *"Belum ada data penerima."*

---

### 12. Alur Collapse Lelang
* Kolom **Lelang** mengelompokkan dokumen: B-18, BA-21, BA-22.
* Tampilan ringkasan utama:
  - Komputasi status induk Lelang:
    - Jika ketiga dokumen `'tidak_ada'`, status Lelang = `'tidak_ada'`.
    - Jika salah satu `'belum_dibuat'` dan tidak ada `'sudah_dibuat'`, status = `'belum_dibuat'`.
    - Jika ada yang `'sudah_dibuat'`, status = `'sudah_dibuat'`.
* Dropdown Utama Lelang memiliki aturan:
  - Jika user memilih `'tidak_ada'`: otomatis update `b18_status = 'tidak_ada'`, `ba21_status = 'tidak_ada'`, `ba22_status = 'tidak_ada'`.
  - Jika user memilih `'belum_dibuat'`: dokumen terkait di-set ke `'belum_dibuat'`.
  - Jika user memilih `'sudah_dibuat'`: dokumen terkait dapat dikelola.
* Mengklik toggle Lelang membuka Bootstrap Collapse yang menampilkan rincian:
  - **B-18**: [ Tidak Ada | Belum Dibuat | Sudah Dibuat ]
  - **BA-21**: [ Tidak Ada | Belum Dibuat | Sudah Dibuat ]
  - **BA-22**: [ Tidak Ada | Belum Dibuat | Sudah Dibuat ]

---

### 13. Responsive DataTables
* Standar DataTables:
  - Pagination selector: 10, 25, 50, 100 entri per halaman.
  - Kolom sortable dengan indikator panah (asc/desc).
  - Search box cepat dengan debouncing.
* Tampilan Responsif:
  - Menggunakan Bootstrap responsive table wrapper (`table-responsive`) dengan styling compact.
  - Pada layar mobile/tablet, collapse baris tetap rapi di bawah baris terkait.
  - Dropdown badge memiliki touch-target yang nyaman disentuh di perangkat seluler.

---

### 14. Validasi Data
* **Frontend**:
  - Form validation: semua kolom perkara wajib diisi.
  - Format tanggal diverifikasi (YYYY-MM-DD atau DD-MM-YYYY dinormalisasi).
  - Pengecekan unik `nomor_register_perkara` sebelum submit.
  - Validasi file CSV: ukuran, tipe mime, kelengkapan header.
* **Backend**:
  - Constraint `UNIQUE(nomor_register_perkara)` pada PostgreSQL.
  - Constraint `CHECK (status IN (...))` pada PostgreSQL.

---

### 15. Security & RLS Supabase
* Row-Level Security (RLS) diaktifkan pada tabel `perkara` dan `ba20_penerima`.
* Kebijakan `anon` / `authenticated` mengizinkan SELECT, INSERT, UPDATE, DELETE untuk aplikasi internal administrasi.
* Sanitasi input untuk mencegah XSS atau injection pada nama terpidana dan nomor perkara.

---

### 16. UX Flow
1. **First-Load**:
   - Menampilkan tabel perkara terisi dengan cepat.
   - Header menunjukkan status koneksi Supabase & ringkasan metrik perkara.
2. **Import Flow**:
   - Klik `Import CSV` -> Pilih tab File atau Paste -> Klik `Preview Data` -> Periksa data valid & invalid -> Klik `Import / Simpan Data` -> Notifikasi sukses SweetAlert2 muncul -> Tabel terupdate otomatis.
3. **Daily Monitoring Flow**:
   - Petugas mencari nomor perkara pada universal search box.
   - Mengubah status dokumen secara instan lewat dropdown badge satu klik.
   - Mengelola rincian BA-20 atau Lelang secara inline tanpa kehilangan konteks halaman.
