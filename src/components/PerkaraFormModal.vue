<template>
  <div
    v-if="show"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(15, 23, 42, 0.55); backdrop-filter: blur(2px);"
    @click.self="closeModal"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <div class="modal-header bg-light border-bottom py-3">
          <h5 class="modal-title fs-6 fw-bold text-dark d-flex align-items-center gap-2">
            <i :class="isEdit ? 'bi-pencil-square text-primary' : 'bi-plus-circle-fill text-success'"></i>
            {{ isEdit ? 'Edit Data Perkara' : 'Tambah Perkara Baru' }}
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="modal-body p-4">
            <!-- Alert Error -->
            <div v-if="errorMessage" class="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small mb-3">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <div>{{ errorMessage }}</div>
            </div>

            <div class="row g-3">
              <!-- Nomor Surat P-48 -->
              <div class="col-md-6">
                <label class="form-label required">Nomor Surat (P-48)</label>
                <input
                  v-model.trim="formData.nomor_surat"
                  type="text"
                  class="form-control"
                  placeholder="Contoh: Print-1234/M.3.14/Eoh.3/10/2026"
                  required
                />
                <div class="form-text text-muted" style="font-size: 0.72rem;">Satu nomor surat dapat memuat beberapa perkara.</div>
              </div>

              <!-- Tanggal Surat -->
              <div class="col-md-6">
                <label class="form-label required">Tanggal Surat</label>
                <input
                  v-model="formData.tgl_surat"
                  type="date"
                  class="form-control"
                  required
                />
              </div>

              <!-- Nomor Register Perkara (Unique) -->
              <div class="col-12">
                <label class="form-label required">Nomor Register Perkara (Unique Identifier)</label>
                <input
                  v-model.trim="formData.nomor_register_perkara"
                  type="text"
                  class="form-control font-monospace"
                  placeholder="Contoh: PDM-20/PKRTO/Enz.2/04/2026"
                  required
                />
                <div class="form-text text-muted" style="font-size: 0.72rem;">
                  Wajib unik. Digunakan sebagai kunci pengenal utama perkara pada database dan import.
                </div>
              </div>

              <!-- Nama Terpidana -->
              <div class="col-12">
                <label class="form-label required">Nama Terpidana</label>
                <textarea
                  v-model="formData.nama_terpidana"
                  class="form-control"
                  rows="3"
                  placeholder="Masukkan nama terpidana. Jika lebih dari satu orang, buat per baris. Contoh:&#10;1. LEEROY DIAN TANJAYA&#10;2. AHMAD WAHYUDI"
                  required
                ></textarea>
                <div class="form-text text-muted" style="font-size: 0.72rem;">
                  Dapat memuat nama terpidana tunggal ataupun jamak bersusun ke bawah.
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light py-2.5 px-4 border-top">
            <button type="button" class="btn btn-sm btn-outline-secondary px-3" @click="closeModal">
              Batal
            </button>
            <button type="submit" class="btn btn-sm btn-primary px-4 shadow-sm" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-check-lg me-1"></i>
              {{ isEdit ? 'Simpan Perubahan' : 'Tambah Perkara' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType } from 'vue';
import { Perkara } from '../types';

export default {
  name: 'PerkaraFormModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    perkara: {
      type: Object as PropType<Perkara | null>,
      default: null,
    },
    existingRegisters: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  emits: ['close', 'save'],
  data() {
    return {
      formData: {
        nomor_surat: '',
        tgl_surat: '',
        nomor_register_perkara: '',
        nama_terpidana: '',
      },
      errorMessage: '',
      submitting: false,
    };
  },
  computed: {
    isEdit(): boolean {
      return !!(this.perkara && this.perkara.id);
    },
  },
  watch: {
    show(val) {
      if (val) {
        this.errorMessage = '';
        if (this.perkara) {
          this.formData = {
            nomor_surat: this.perkara.nomor_surat || '',
            tgl_surat: this.formatDateForInput(this.perkara.tgl_surat || ''),
            nomor_register_perkara: this.perkara.nomor_register_perkara || '',
            nama_terpidana: this.perkara.nama_terpidana || '',
          };
        } else {
          const today = new Date().toISOString().split('T')[0];
          this.formData = {
            nomor_surat: '',
            tgl_surat: today,
            nomor_register_perkara: '',
            nama_terpidana: '',
          };
        }
      }
    },
  },
  methods: {
    formatDateForInput(dateStr: string): string {
      if (!dateStr) return '';
      // If already in YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // If in DD-MM-YYYY
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return dateStr;
    },
    closeModal() {
      this.$emit('close');
    },
    async handleSubmit() {
      this.errorMessage = '';

      if (!this.formData.nomor_surat.trim()) {
        this.errorMessage = 'Nomor Surat P-48 wajib diisi.';
        return;
      }
      if (!this.formData.tgl_surat.trim()) {
        this.errorMessage = 'Tanggal Surat wajib diisi.';
        return;
      }
      if (!this.formData.nomor_register_perkara.trim()) {
        this.errorMessage = 'Nomor Register Perkara wajib diisi.';
        return;
      }
      if (!this.formData.nama_terpidana.trim()) {
        this.errorMessage = 'Nama Terpidana wajib diisi.';
        return;
      }

      // Check unique nomor_register_perkara
      const currentReg = this.formData.nomor_register_perkara.trim().toLowerCase();
      const currentId = this.perkara ? this.perkara.id : null;
      const duplicate = this.existingRegisters.some((reg) => {
        // If editing and same register as original, ignore
        if (this.perkara && this.perkara.nomor_register_perkara.toLowerCase() === currentReg) {
          return false;
        }
        return reg.toLowerCase() === currentReg;
      });

      if (duplicate) {
        this.errorMessage = 'Nomor register perkara sudah terdaftar.';
        return;
      }

      this.submitting = true;
      try {
        this.$emit('save', {
          id: currentId,
          ...this.formData,
        });
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>
