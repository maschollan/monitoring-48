<template>
  <div
    v-if="show"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(15, 23, 42, 0.55); backdrop-filter: blur(2px);"
    @click.self="closeModal"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <div class="modal-header bg-light border-bottom py-3">
          <h5 class="modal-title fs-6 fw-bold text-dark d-flex align-items-center gap-2">
            <i :class="isEdit ? 'bi-pencil-square text-primary' : 'bi-person-plus-fill text-success'"></i>
            {{ isEdit ? 'Edit Penerima Barang Bukti' : 'Tambah Penerima Barang Bukti (BA-20)' }}
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="modal-body p-4">
            <div v-if="errorMessage" class="alert alert-danger py-2 px-3 small mb-3">
              <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ errorMessage }}
            </div>

            <div class="mb-3">
              <label class="form-label required">Nama Penerima Barang Bukti</label>
              <input
                v-model.trim="namaPenerima"
                type="text"
                class="form-control"
                placeholder="Contoh: Ahmad Fauzi / Nama Saksi / Pemilik"
                required
              />
              <div class="form-text text-muted" style="font-size: 0.72rem;">
                Nama pihak yang berhak menerima kembali barang bukti sesuai putusan inkrah.
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label required">Status Dokumen BA-20</label>
              <select v-model="statusBa20" class="form-select">
                <option value="belum_dibuat">Belum Dibuat</option>
                <option value="sudah_dibuat">Sudah Dibuat</option>
              </select>
            </div>
          </div>

          <div class="modal-footer bg-light py-2.5 px-4 border-top">
            <button type="button" class="btn btn-sm btn-outline-secondary px-3" @click="closeModal">
              Batal
            </button>
            <button type="submit" class="btn btn-sm btn-success px-4 shadow-sm">
              <i class="bi bi-check-lg me-1"></i>Simpan Penerima
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType } from 'vue';
import { BA20Penerima, BA20ReceiverStatus } from '../types';

export default {
  name: 'PenerimaModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    perkaraId: {
      type: String,
      required: true,
    },
    penerima: {
      type: Object as PropType<BA20Penerima | null>,
      default: null,
    },
  },
  emits: ['close', 'save'],
  data() {
    return {
      namaPenerima: '',
      statusBa20: 'belum_dibuat' as BA20ReceiverStatus,
      errorMessage: '',
    };
  },
  computed: {
    isEdit(): boolean {
      return !!(this.penerima && this.penerima.id);
    },
  },
  watch: {
    show(val) {
      if (val) {
        this.errorMessage = '';
        if (this.penerima) {
          this.namaPenerima = this.penerima.nama_penerima || '';
          this.statusBa20 = this.penerima.status_ba20 || 'belum_dibuat';
        } else {
          this.namaPenerima = '';
          this.statusBa20 = 'belum_dibuat';
        }
      }
    },
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    handleSubmit() {
      this.errorMessage = '';
      if (!this.namaPenerima.trim()) {
        this.errorMessage = 'Nama penerima barang bukti wajib diisi.';
        return;
      }

      this.$emit('save', {
        id: this.penerima ? this.penerima.id : undefined,
        perkaraId: this.perkaraId,
        nama_penerima: this.namaPenerima.trim(),
        status_ba20: this.statusBa20,
      });
    },
  },
};
</script>
