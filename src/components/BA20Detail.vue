<template>
  <div class="p-3 my-2 collapse-detail-box border-start border-4 border-success">
    <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-person-lines-fill text-success fs-5"></i>
        <div>
          <strong class="text-dark small d-block">Daftar Penerima Pengembalian Barang Bukti (BA-20)</strong>
          <span class="text-muted" style="font-size: 0.75rem;">Perkara: {{ nomorRegister }}</span>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-success py-1 px-2.5 shadow-sm fw-medium"
          style="font-size: 0.78rem;"
          @click="$emit('open-add-penerima', perkaraId)"
        >
          <i class="bi bi-person-plus-fill me-1"></i>+ Tambah Penerima
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary py-1 px-2"
          style="font-size: 0.75rem;"
          @click="$emit('close')"
        >
          <i class="bi bi-x-lg me-1"></i>Tutup
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!penerimaList || penerimaList.length === 0" class="py-3 text-center text-muted bg-white rounded border">
      <i class="bi bi-inbox fs-4 d-block mb-1 text-secondary opacity-50"></i>
      <span class="small">Belum ada data penerima. Silakan klik <strong>+ Tambah Penerima</strong> untuk menambahkan.</span>
    </div>

    <!-- List Penerima -->
    <div v-else class="table-responsive bg-white rounded border">
      <table class="table table-sm table-hover mb-0 align-middle">
        <thead class="table-light">
          <tr>
            <th style="width: 40px;" class="text-center text-secondary small">#</th>
            <th class="small text-secondary">Nama Penerima Barang Bukti</th>
            <th style="width: 170px;" class="text-center small text-secondary">Status Dokumen BA-20</th>
            <th style="width: 100px;" class="text-end pe-3 small text-secondary">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(penerima, idx) in penerimaList" :key="penerima.id">
            <td class="text-center text-muted small fw-medium">{{ idx + 1 }}</td>
            <td>
              <div class="fw-semibold text-dark small">{{ penerima.nama_penerima }}</div>
            </td>
            <td class="text-center">
              <status-badge-dropdown
                :model-value="penerima.status_ba20"
                type="penerima"
                @change="(newStatus) => $emit('update-penerima-status', { penerimaId: penerima.id, status: newStatus })"
              />
            </td>
            <td class="text-end pe-3">
              <div class="btn-group btn-group-sm">
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm py-0 px-1.5"
                  title="Edit Nama Penerima"
                  @click="$emit('edit-penerima', penerima)"
                >
                  <i class="bi bi-pencil-square"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm py-0 px-1.5"
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
</template>

<script lang="ts">
import { PropType } from 'vue';
import { BA20Penerima } from '../types';
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
  emits: ['open-add-penerima', 'edit-penerima', 'delete-penerima', 'update-penerima-status', 'close'],
};
</script>
