<template>
  <div
    v-if="show"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px);"
    @click.self="closeModal"
  >
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <!-- Header -->
        <div class="modal-header bg-light border-bottom py-3">
          <div class="d-flex align-items-center gap-3">
            <div class="p-3 bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center" style="width: 42px; height: 42px;">
              <i class="bi bi-file-earmark-spreadsheet-fill fs-4"></i>
            </div>
            <div>
              <h5 class="modal-title fs-6 fw-bold text-dark mb-0">Import Data Perkara (CSV / TXT)</h5>
              <div class="text-muted" style="font-size: 0.75rem;">
                Mekanisme UPSERT: Memperbarui biodata perkara tanpa menghapus/mereset status monitoring dokumen yang sudah ada.
              </div>
            </div>
          </div>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="modal-body p-4">
          <!-- Nav Tabs -->
          <ul class="nav nav-tabs mb-3" role="tablist">
            <li class="nav-item" role="presentation">
              <button
                class="nav-link d-flex align-items-center"
                :class="{ active: activeTab === 'upload' }"
                type="button"
                @click="setTab('upload')"
              >
                <i class="bi bi-cloud-arrow-up-fill me-2"></i>Tab 1 — Upload File (.csv, .txt)
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link d-flex align-items-center"
                :class="{ active: activeTab === 'paste' }"
                type="button"
                @click="setTab('paste')"
              >
                <i class="bi bi-clipboard2-plus-fill me-2"></i>Tab 2 — Paste CSV
              </button>
            </li>
          </ul>

          <!-- Tab Content: Upload File -->
          <div v-if="activeTab === 'upload'" class="mb-4">
            <div class="p-4 border border-2 border-dashed rounded-3 text-center bg-light">
              <i class="bi bi-filetype-csv fs-1 text-primary mb-2 d-block"></i>
              <label for="csvFileInput" class="btn btn-sm btn-primary px-3 shadow-sm mb-2 cursor-pointer d-inline-flex align-items-center">
                <i class="bi bi-folder2-open me-2"></i>Pilih File CSV / TXT
              </label>
              <input
                id="csvFileInput"
                type="file"
                class="d-none"
                accept=".csv, .txt, text/csv, text/plain"
                @change="handleFileUpload"
              />
              <div class="text-muted small">
                {{ selectedFileName ? ('File terpilih: ' + selectedFileName) : 'Mendukung format .csv dan .txt dengan delimiter titik-koma (;)' }}
              </div>
            </div>
          </div>

          <!-- Tab Content: Paste CSV -->
          <div v-if="activeTab === 'paste'" class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="form-label mb-0 fw-semibold">Paste Teks CSV (Delimiter Titik-Koma: <code>;</code>)</label>
              <button
                type="button"
                class="btn btn-link btn-sm text-decoration-none py-0 d-inline-flex align-items-center"
                style="font-size: 0.75rem;"
                @click="insertSampleCSV"
              >
                <i class="bi bi-magic me-2"></i>Isi Contoh CSV
              </button>
            </div>
            <textarea
              v-model="pastedText"
              class="form-control font-monospace text-nowrap"
              rows="6"
              placeholder="nomor_surat;tgl_surat;nomor_register_perkara;nama_terpidana&#10;Print-1234/M.3.14/Eoh.3/10/2026;05-10-2026;PDM-20/PKRTO/Enz.2/04/2026;KHALID AZIZ FATHURRAHMAN HIDAYATULLOH Alias BREKELE Bin SOPARI"
              style="font-size: 0.8rem;"
            ></textarea>
            <div class="form-text text-muted" style="font-size: 0.72rem;">
              Format kolom: <code>nomor_surat;tgl_surat;nomor_register_perkara;nama_terpidana</code>. Kolom nama terpidana multiline dibungkus tanda kutip ("...").
            </div>
          </div>

          <!-- Tombol Preview -->
          <div class="d-flex gap-2 mb-3">
            <button
              type="button"
              class="btn btn-sm btn-outline-primary px-3 shadow-sm d-inline-flex align-items-center"
              :disabled="!hasContentToParse"
              @click="handlePreview"
            >
              <i class="bi bi-eye-fill me-2"></i>Preview Data
            </button>
            <button
              v-if="parseResult"
              type="button"
              class="btn btn-sm btn-outline-secondary px-3 d-inline-flex align-items-center"
              @click="resetPreview"
            >
              <i class="bi bi-arrow-counterclockwise me-2"></i>Reset Preview
            </button>
          </div>

          <!-- PREVIEW SECTION -->
          <div v-if="parseResult" class="border rounded-3 p-3 bg-white mt-3">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
              <div class="d-flex align-items-center gap-3 flex-wrap">
                <span class="badge bg-secondary p-2 d-inline-flex align-items-center">
                  <i class="bi bi-list-ol me-2"></i>Total Baris: {{ parseResult.totalRows }}
                </span>
                <span class="badge bg-success p-2 d-inline-flex align-items-center">
                  <i class="bi bi-check-circle-fill me-2"></i>Data Valid: {{ parseResult.valid.length }}
                </span>
                <span v-if="parseResult.invalid.length > 0" class="badge bg-danger p-2 d-inline-flex align-items-center">
                  <i class="bi bi-x-circle-fill me-2"></i>Data Invalid: {{ parseResult.invalid.length }}
                </span>
                <span v-if="parseResult.duplicates.length > 0" class="badge bg-warning text-dark p-2 d-inline-flex align-items-center">
                  <i class="bi bi-copy me-2"></i>Duplikat Internal CSV: {{ parseResult.duplicates.length }}
                </span>
              </div>
              <div class="text-muted small d-flex align-items-center">
                <i class="bi bi-info-circle me-2 text-primary"></i>Periksa kelengkapan sebelum menekan tombol Import Data.
              </div>
            </div>

            <!-- Error List if any -->
            <div v-if="parseResult.invalid.length > 0" class="alert alert-danger py-2 px-3 small mb-3">
              <div class="fw-bold mb-1 d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill me-2 fs-6"></i> Terdapat {{ parseResult.invalid.length }} baris data tidak valid (tidak akan diimport):
              </div>
              <ul class="mb-0 ps-3">
                <li v-for="(inv, i) in parseResult.invalid.slice(0, 5)" :key="i">
                  <strong>Baris {{ inv.rowNumber }}:</strong> {{ inv.reason }}
                  <span class="text-muted ms-1 font-monospace">({{ inv.raw }})</span>
                </li>
              </ul>
              <div v-if="parseResult.invalid.length > 5" class="mt-1 text-muted" style="font-size: 0.72rem;">
                ...dan {{ parseResult.invalid.length - 5 }} baris error lainnya.
              </div>
            </div>

            <!-- Duplicates Note -->
            <div v-if="parseResult.duplicates.length > 0" class="alert alert-warning py-2 px-3 small mb-3">
              <i class="bi bi-info-circle-fill me-2"></i> Terdapat {{ parseResult.duplicates.length }} nomor register yang muncul lebih dari sekali di dalam file ini. Sistem secara otomatis mengambil versi data terakhir.
            </div>

            <!-- Table Preview Valid Data -->
            <div v-if="parseResult.valid.length > 0">
              <div class="fw-bold small text-dark mb-2">Pratinjau Data Valid yang Siap Di-Upsert:</div>
              <div class="table-responsive border rounded" style="max-height: 260px; overflow-y: auto;">
                <table class="table table-sm table-striped table-hover mb-0" style="font-size: 0.78rem;">
                  <thead class="table-light sticky-top">
                    <tr>
                      <th style="width: 45px;">#</th>
                      <th>Nomor Surat (P-48)</th>
                      <th>Tanggal</th>
                      <th>Nomor Register Perkara</th>
                      <th>Nama Terpidana</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in parseResult.valid" :key="idx">
                      <td class="text-muted">{{ idx + 1 }}</td>
                      <td class="fw-medium text-dark">{{ row.nomor_surat }}</td>
                      <td>{{ row.tgl_surat }}</td>
                      <td class="font-monospace fw-semibold text-primary">{{ row.nomor_register_perkara }}</td>
                      <td>
                        <div class="convict-name">{{ row.nama_terpidana }}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="text-center py-4 text-muted small">
              Tidak ada data valid yang dapat diimport dari input CSV ini.
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer bg-light py-3 px-4 border-top d-flex justify-content-between">
          <button type="button" class="btn btn-sm btn-outline-secondary px-3" @click="closeModal">
            Tutup
          </button>
          <button
            type="button"
            class="btn btn-sm btn-success px-4 shadow-sm fw-semibold"
            :disabled="!parseResult || parseResult.valid.length === 0 || importing"
            @click="executeImport"
          >
            <span v-if="importing" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-cloud-arrow-up-fill me-2"></i>
            {{ importing ? 'Mengimport Data...' : `Import / Simpan Data (${parseResult ? parseResult.valid.length : 0})` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { parseCSVText } from '../services/csvParser';
import { CSVParseResult } from '../types';

export default {
  name: 'ImportModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'imported'],
  data() {
    return {
      activeTab: 'upload' as 'upload' | 'paste',
      pastedText: '',
      fileTextContent: '',
      selectedFileName: '',
      parseResult: null as CSVParseResult | null,
      importing: false,
    };
  },
  computed: {
    hasContentToParse(): boolean {
      if (this.activeTab === 'upload') {
        return !!this.fileTextContent.trim();
      }
      return !!this.pastedText.trim();
    },
  },
  watch: {
    show(val) {
      if (!val) {
        this.resetState();
      }
    },
  },
  methods: {
    setTab(tab: 'upload' | 'paste') {
      this.activeTab = tab;
      this.parseResult = null;
    },
    resetState() {
      this.pastedText = '';
      this.fileTextContent = '';
      this.selectedFileName = '';
      this.parseResult = null;
      this.importing = false;
    },
    resetPreview() {
      this.parseResult = null;
    },
    closeModal() {
      this.$emit('close');
    },
    handleFileUpload(event: Event) {
      const target = event.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;
      const file = target.files[0];
      this.selectedFileName = file.name;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.fileTextContent = (e.target?.result as string) || '';
        // Automatically trigger preview for convenience
        this.handlePreview();
      };
      reader.readAsText(file);
    },
    insertSampleCSV() {
      this.pastedText = `nomor_surat;tgl_surat;nomor_register_perkara;nama_terpidana
Print-1234/M.3.14/Eoh.3/10/2026;05-10-2026;PDM-20/PKRTO/Enz.2/04/2026;KHALID AZIZ FATHURRAHMAN HIDAYATULLOH Alias BREKELE Bin SOPARI
Print-892/M.3.14/Eoh.3/09/2026;28-09-2026;PDM-15/PKRTO/Enz.2/03/2026;"1. LEEROY DIAN TANJAYA
2. AHMAD WAHYUDI"
Print-755/M.3.14/Eoh.3/08/2026;15-08-2026;PDM-08/PKRTO/Enz.2/02/2026;BAMBANG HERMANTO Bin SOEDARMO
Print-412/M.3.14/Eoh.3/05/2026;12-05-2026;PDM-05/PKRTO/Enz.2/01/2026;DENI SAPUTRA`;
      this.handlePreview();
    },
    handlePreview() {
      const rawText = this.activeTab === 'upload' ? this.fileTextContent : this.pastedText;
      if (!rawText.trim()) return;
      this.parseResult = parseCSVText(rawText);
    },
    async executeImport() {
      if (!this.parseResult || this.parseResult.valid.length === 0) return;
      this.importing = true;
      try {
        this.$emit('imported', this.parseResult.valid);
      } finally {
        this.importing = false;
      }
    },
  },
};
</script>
