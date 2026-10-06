# 📋 Sistem Monitoring Administrasi Perkara & Status Dokumen P-48

Aplikasi web modern, ringan, dan profesional untuk monitoring administrasi perkara tindak pidana dan status eksekusi dokumen kejaksaan (**P-48, B-18, BA-20, BA-21, BA-22, BA-23, dan Pendapat Hukum**).

Dibangun menggunakan **Vue.js 3 (Options API)**, **Bootstrap 5.3**, **Bootstrap Icons**, dan backend database **Supabase (PostgreSQL)**.

---

## 🌟 Fitur Utama

1. **DataTables Monitoring Perkara Interaktif**:
   - Kolom tabel utama:
     1. **Nomor P-48** (Nomor Surat & Nomor Register Perkara)
     2. **Tanggal** (Tanggal Surat Putusan/Perintah)
     3. **Nama Terpidana** (Mendukung nama tunggal maupun jamak tersusun berbaris)
     4. **Rampasan** (Dropdown status Ada / Tidak Ada + Tombol Collapse rincian **B-18**, **BA-21**, **BA-22**)
     5. **Dikembalikan BA-20** (Dropdown status Ada / Tidak Ada + Panel Collapse daftar multi-penerima barang bukti)
     6. **Dimusnahkan BA-23** (Dropdown status langsung)
     7. **Pendapat Hukum** (Dropdown status langsung)
     8. **Aksi** (Edit data perkara & Hapus perkara)
   - **Universal Search**: Pencarian cepat ke seluruh data nomor surat, nomor register perkara, nama terpidana, dan tanggal.
   - **Paginasi Fleksibel**: Pilihan 10, 25, 50, atau 100 entri per halaman.
   - **Multi-Column Sorting**: Pengurutan instan untuk seluruh kolom.
   - **Badge Dropdown Langsung**: Status dokumen dapat diubah langsung dari tabel tanpa modal, tersimpan seketika.

2. **Pengelompokan & Collapse Dokumen Rampasan (Lelang)**:
   - Kolom **Rampasan** memiliki opsi status **Tidak Ada** dan **Ada** dengan badge visual profesional.
   - Mengelompokkan dokumen eksekusi rampasan/lelang: **B-18**, **BA-21**, dan **BA-22**.
   - Jika Rampasan diatur ke *Tidak Ada*, ketiga sub-dokumen otomatis berstatus *Tidak Ada*.
   - Jika Rampasan diatur ke *Ada*, muncul tombol toggle collapse berdesain pill (`btn-outline-primary`) untuk membuka dan mengelola rincian dokumen **B-18**, **BA-21**, dan **BA-22** secara mendetail.

3. **Manajemen Multi-Penerima Barang Bukti (BA-20) Langsung (Tanpa Modal)**:
   - Jika kolom **Dikembalikan BA-20** berstatus *Ada*, muncul tombol *Detail Penerima*.
   - Saat collapse dibuka, seluruh daftar penerima langsung ditampilkan dengan nomor urut, nama penerima, status dokumen BA-20, serta tombol aksi.
   - Penambahan penerima baru dilakukan langsung melalui formulir input inline di bawah daftar (cukup ketik nama penerima lalu tekan *Enter* atau klik *Simpan*, tanpa membuka modal).
   - Pengubahan nama penerima juga dapat dilakukan secara langsung (inline editing).
   - Status dokumen BA-20 masing-masing penerima dapat diubah seketika melalui badge dropdown (*Belum Dibuat* / *Sudah Dibuat*).

4. **Import Data CSV / TXT dengan Mekanisme UPSERT**:
   - **Tab 1: Upload File** (.csv atau .txt).
   - **Tab 2: Paste CSV** melalui textarea.
   - **Parser RFC-4180**:
     - Mendukung delimiter titik-koma (`;`).
     - Mendukung kolom yang dibungkus tanda kutip (`"..."`) dengan baris jamak/newline (contoh nama terpidana lebih dari 1 orang).
     - Otomatis membersihkan spasi berlebih dan mendeteksi header CSV.
   - **Validasi Baris**:
     - Rekap total baris, jumlah baris valid, baris invalid (beserta alasan error), dan duplikat internal CSV.
     - Tabel preview interaktif data yang siap diimport.
   - **UPSERT Berdasarkan `nomor_register_perkara`**:
     - Jika nomor register belum ada: membuat perkara baru.
     - Jika nomor register sudah ada: mengupdate biodata surat dan terpidana.
     - **Paling Penting**: Import ulang CSV **tidak pernah menghapus atau mereset** status monitoring dokumen (B-18, BA-20, BA-21, BA-22, BA-23, Pendapat Hukum) maupun penerima BA-20 yang sudah diinput sebelumnya.

5. **Koneksi Supabase Realtime & Sync Refresh**:
   - Terintegrasi langsung dengan database PostgreSQL Supabase via `@supabase/supabase-js`.
   - **Realtime Event Bawaan Supabase (`postgres_changes`)**: Menggunakan channel realtime bawaan Supabase untuk memantau perubahan data pada tabel `perkara` dan `ba20_penerima`. Ketika ada pengguna lain yang menambah perkara, memperbarui status dokumen, atau mengelola penerima barang bukti, database langsung menyiarkan event perubahan dan data di seluruh web browser yang sedang terbuka diperbarui seketika (*instant multi-user live update*).
   - **Indikator Status Koneksi**: Dilengkapi badge indikator status koneksi (*Realtime Terhubung*, *Menghubungkan...*, atau *Storage Lokal*).
   - **Tombol Sync Refresh**: Tombol khusus di bilah atas untuk menyinkronkan data secara manual sewaktu-waktu.
   - Dilengkapi modal konfigurasi Supabase (URL & Anon Key), tes koneksi langsung, dan skrip DDL SQL.
   - Jika Supabase belum dikonfigurasi, sistem otomatis beralih ke *Mode Local Relational Storage* dengan data sampel realistis, sehingga aplikasi langsung berfungsi penuh saat dibuka.

---

## 🏗️ Struktur Data & Format CSV

Format baris CSV:
```text
nomor_surat;tgl_surat;nomor_register_perkara;nama_terpidana
```

Contoh 1 (Terpidana Tunggal):
```text
Print-1234/M.3.14/Eoh.3/10/2026;05-10-2026;PDM-20/PKRTO/Enz.2/04/2026;KHALID AZIZ FATHURRAHMAN HIDAYATULLOH Alias BREKELE Bin SOPARI
```

Contoh 2 (Terpidana Jamak dengan Newline dalam tanda kutip):
```text
Print-892/M.3.14/Eoh.3/09/2026;28-09-2026;PDM-15/PKRTO/Enz.2/03/2026;"1. LEEROY DIAN TANJAYA
2. AHMAD WAHYUDI"
```

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat
- Node.js versi 18 atau 20+
- npm versi 9+

### Langkah Instalasi
```bash
# 1. Clone repository
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME

# 2. Install dependensi
npm install

# 3. Jalankan development server
npm run dev
```

Buka browser di `http://localhost:3000` (atau port yang tertera di terminal).

### Build untuk Produksi
```bash
npm run build
```
File hasil build akan berada di direktori `dist/`.

---

## 🗄️ Setup Database Supabase

Jika ingin menghubungkan ke proyek Supabase pribadi:

1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor**, buat kueri baru dan jalankan skrip DDL berikut:

```sql
-- 1. Tabel Perkara
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

-- 2. Tabel Penerima BA-20
CREATE TABLE IF NOT EXISTS public.ba20_penerima (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perkara_id UUID NOT NULL REFERENCES public.perkara(id) ON DELETE CASCADE,
    nama_penerima TEXT NOT NULL,
    status_ba20 TEXT NOT NULL DEFAULT 'belum_dibuat' 
        CHECK (status_ba20 IN ('belum_dibuat', 'sudah_dibuat')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_perkara_register ON public.perkara(nomor_register_perkara);
CREATE INDEX IF NOT EXISTS idx_ba20_perkara_id ON public.ba20_penerima(perkara_id);

-- 4. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.perkara ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ba20_penerima ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses publik perkara" ON public.perkara
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Akses publik ba20_penerima" ON public.ba20_penerima
    FOR ALL USING (true) WITH CHECK (true);
```

3. Dapatkan **Project URL** dan **Anon Key** dari menu **Project Settings -> API**.
4. Masukkan kredensial tersebut melalui tombol status koneksi di pojok kanan atas aplikasi, atau atur di file `.env`:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

---

## 🚢 Deploy ke GitHub Pages

Proyek ini telah dilengkapi GitHub Actions workflow otomatis di `.github/workflows/deploy.yml`.

### Langkah Pengaktifan:
1. Push repository ini ke GitHub pada branch `main` atau `master`.
2. Buka repository di GitHub, lalu masuk ke tab **Settings**.
3. Di bilah samping kiri, klik **Pages**.
4. Pada bagian **Build and deployment**:
   - **Source**: Pilih **GitHub Actions**.
5. (Opsional) Jika ingin menyertakan kredensial Supabase secara global:
   - Buka **Settings -> Secrets and variables -> Actions**.
   - Tambahkan Secret baru:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   *(Catatan: Pengguna juga tetap dapat mengisi kredensial langsung melalui modal pengaturan koneksi di antarmuka web).*
6. Workflow akan otomatis berjalan pada setiap `git push`, mengompilasi Vite, dan mempublikasikan aplikasi ke GitHub Pages.

---

## 🛠️ Tech Stack

- **Framework**: Vue 3 (Options API)
- **Styling**: Bootstrap 5.3 + Bootstrap Icons
- **Build Tool**: Vite 8
- **Database Client**: `@supabase/supabase-js`
- **Alerts & Dialogs**: SweetAlert2
- **Language**: TypeScript

---

## 📄 Lisensi
Hak Cipta © 2026. Aplikasi Monitoring Administrasi Perkara & Eksekusi Dokumen P-48.
