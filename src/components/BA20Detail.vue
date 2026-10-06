<template>
  <div class="p-4 my-2 collapse-detail-box border-start border-4 border-success">
    <!-- Header Collapse -->
    <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
      <div class="d-flex align-items-center">
        <div class="p-2 bg-success bg-opacity-10 text-success rounded-3 me-3 d-flex align-items-center justify-content-center">
          <i class="bi bi-people-fill fs-5"></i>
        </div>
        <div>
          <div class="d-flex align-items-center gap-2">
            <strong class="text-dark small">Daftar Penerima Pengembalian Barang Bukti (BA-20)</strong>
            <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1" style="font-size: 0.72rem;">
              {{ penerimaList ? penerimaList.length : 0 }} Penerima
            </span>
          </div>
          <span class="text-muted" style="font-size: 0.75rem;">Perkara: <strong>{{ nomorRegister }}</strong></span>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-sm btn-outline-secondary py-1 px-3 d-inline-flex align-items-center"
        style="font-size: 0.75rem;"
        @click="$emit('close')"
      >
        <i class="bi bi-x-lg me-2"></i>Tutup
      </button>
    </div>

    <!-- Alert Error Jika Validasi Gagal -->
    <div v-if="inlineError" class="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center">
      <i class="bi bi-exclamation-triangle-fill me-2 fs-6"></i>
      <div>{{ inlineError }}</div>
      <button type="button" class="btn-close ms-auto py-0" style="font-size: 0.65rem;" @click="inlineError = ''"></button>
    </div>

    <!-- List Penerima yang Sudah Ada -->
    <div class="bg-white rounded-3 border shadow-xs mb-3 overflow-hidden">
      <!-- Empty State -->
      <div v-if="!penerimaList || penerimaList.length === 0" class="py-4 px-3 text-center text-muted">
        <i class="bi bi-inbox fs-4 d-block mb-1 text-secondary opacity-50"></i>
        <div class="small fw-medium">Belum ada data penerima barang bukti.</div>
        <div class="text-muted" style="font-size: 0.75rem;">
          Gunakan formulir input di bawah untuk menambahkan penerima baru secara langsung.
        </div>
      </div>

      <!-- Tabel Daftar Penerima -->
      <div v-else class="table-responsive">
        <table class="table table-sm table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th style="width: 45px;" class="text-center text-secondary small">#</th>
              <th class="small text-secondary">Nama Penerima Barang Bukti</th>
              <th style="width: 175px;" class="text-center small text-secondary">Status Dokumen BA-20</th>
              <th style="width: 105px;" class="text-end pe-3 small text-secondary">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(penerima, idx) in penerimaList" :key="penerima.id">
              <td class="text-center text-muted small fw-medium">{{ idx + 1 }}</td>

              <!-- Nama Penerima (Teks Biasa vs Input Edit Inline) -->
              <td>
                <div v-if="editingPenerimaId === penerima.id" class="d-flex align-items-center gap-2 py-1">
                  <input
                    ref="editInput"
                    v-model.trim="editNama"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Nama penerima..."
                    @keyup.enter="saveEditPenerima(penerima)"
                    @keyup.esc="cancelEditPenerima"
                  />
                  <button
                    type="button"
                    class="btn btn-sm btn-success py-1 px-2 d-inline-flex align-items-center"
                    title="Simpan Nama"
                    @click="saveEditPenerima(penerima)"
                  >
                    <i class="bi bi-check-lg"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary py-1 px-2 d-inline-flex align-items-center"
                    title="Batal"
                    @click="cancelEditPenerima"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                <div v-else class="d-flex align-items-center py-1">
                  <i class="bi bi-person-check text-muted me-2"></i>
                  <span class="fw-semibold text-dark small">{{ penerima.nama_penerima }}</span>
                </div>
              </td>

              <!-- Dropdown Status Dokumen BA-20 -->
              <td class="text-center">
                <status-badge-dropdown
                  :model-value="penerima.status_ba20"
                  type="penerima"
                  @change="(newStatus) => $emit('update-penerima-status', { penerimaId: penerima.id, status: newStatus })"
                />
              </td>

              <!-- Tombol Aksi -->
              <td class="text-end pe-3">
                <div class="btn-group btn-group-sm">
                  <button
                    type="button"
                    class="btn btn-outline-primary btn-sm py-1 px-2"
                    title="Edit Nama Penerima"
                    @click="startEditPenerima(penerima)"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm py-1 px-2"
                    title="Hapus Penerima"
                    @click="$emit('delete-penerima', penerima)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- INLINE FORM: Tambah Penerima Baru Langsung Di Dalam List (Tanpa Modal) -->
    <div class="bg-white p-3 rounded-3 border shadow-xs">
      <div class="d-flex align-items-center gap-2 mb-2">
        <i class="bi bi-plus-circle-fill text-success fs-6 me-2"></i>
        <strong class="text-dark small">Tambah Penerima Barang Bukti Baru</strong>
        <span class="text-muted small ms-1" style="font-size: 0.72rem;">(Ketik nama lalu tekan Enter atau klik Simpan)</span>
      </div>

      <form @submit.prevent="submitNewPenerima">
        <div class="row g-2 align-items-center">
          <!-- Input Nama -->
          <div class="col-12 col-md-6 col-lg-7">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light text-muted">
                <i class="bi bi-person-fill"></i>
              </span>
              <input
                v-model="newNamaPenerima"
                type="text"
                class="form-control"
                placeholder="Masukkan nama pihak penerima barang bukti (contoh: Ahmad Fauzi / Saksi Korban)..."
                required
              />
            </div>
          </div>

          <!-- Status BA-20 -->
          <div class="col-12 col-sm-6 col-md-3 col-lg-3">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light text-muted">
                <i class="bi bi-file-earmark-check-fill"></i>
              </span>
              <select v-model="newStatusBa20" class="form-select form-select-sm">
                <option value="belum_dibuat">BA-20: Belum Dibuat</option>
                <option value="sudah_dibuat">BA-20: Sudah Dibuat</option>
              </select>
            </div>
          </div>

          <!-- Tombol Tambah -->
          <div class="col-12 col-sm-6 col-md-3 col-lg-2 text-sm-end">
            <button
              type="submit"
              class="btn btn-sm btn-success w-100 shadow-xs fw-medium d-inline-flex align-items-center justify-content-center py-2"
              :disabled="!newNamaPenerima.trim()"
            >
              <i class="bi bi-plus-lg me-2"></i>Simpan
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType } from 'vue';
import { BA20Penerima, BA20ReceiverStatus } from '../types';
import StatusBadgeDropdown from './StatusBadgeDropdown.vue';

export default {
  name: 'BA20Detail',
  components: {
    StatusBadgeDropdown,
  },
  props: {
    perkaraId: {
      type: String,
      required: true,
    },
    nomorRegister: {
      type: String,
      required: true,
    },
    penerimaList: {
      type: Array as PropType<BA20Penerima[]>,
      default: () => [],
    },
  },
  emits: ['add-penerima', 'edit-penerima', 'delete-penerima', 'update-penerima-status', 'close'],
  data() {
    return {
      // Inline Add state
      newNamaPenerima: '',
      newStatusBa20: 'belum_dibuat' as BA20ReceiverStatus,
      inlineError: '',

      // Inline Edit state
      editingPenerimaId: null as string | null,
      editNama: '',
    };
  },
  methods: {
    submitNewPenerima() {
      this.inlineError = '';
      const nama = this.newNamaPenerima.trim();
      if (!nama) {
        this.inlineError = 'Nama penerima barang bukti tidak boleh kosong.';
        return;
      }

      this.$emit('add-penerima', {
        perkaraId: this.perkaraId,
        nama_penerima: nama,
        status_ba20: this.newStatusBa20,
      });

      // Reset form input langsung agar siap menerima input penerima berikutnya
      this.newNamaPenerima = '';
      this.newStatusBa20 = 'belum_dibuat';
    },

    startEditPenerima(penerima: BA20Penerima) {
      this.editingPenerimaId = penerima.id;
      this.editNama = penerima.nama_penerima;
    },

    cancelEditPenerima() {
      this.editingPenerimaId = null;
      this.editNama = '';
    },

    saveEditPenerima(penerima: BA20Penerima) {
      const nama = this.editNama.trim();
      if (!nama) {
        this.inlineError = 'Nama penerima tidak boleh kosong.';
        return;
      }

      this.$emit('edit-penerima', {
        id: penerima.id,
        perkaraId: this.perkaraId,
        nama_penerima: nama,
        status_ba20: penerima.status_ba20,
      });

      this.editingPenerimaId = null;
      this.editNama = '';
    },
  },
};
</script>
