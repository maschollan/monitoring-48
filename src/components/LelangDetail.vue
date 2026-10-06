<template>
  <div class="p-3 my-2 collapse-detail-box border-start border-4 border-primary">
    <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-diagram-3-fill text-primary"></i>
        <strong class="text-dark small">Rincian Dokumen Lelang Perkara</strong>
        <span class="text-muted small">({{ nomorRegister }})</span>
      </div>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary py-0 px-2"
        style="font-size: 0.75rem;"
        @click="$emit('close')"
      >
        <i class="bi bi-x-lg me-1"></i>Tutup
      </button>
    </div>

    <div class="row g-3">
      <!-- B-18 -->
      <div class="col-12 col-md-4">
        <div class="p-2 rounded bg-white border d-flex align-items-center justify-content-between">
          <div>
            <div class="fw-bold text-dark small">Dokumen B-18</div>
            <div class="text-muted" style="font-size: 0.72rem;">Surat Perintah Penjualan Lelang</div>
          </div>
          <status-badge-dropdown
            :model-value="b18Status"
            type="document"
            @change="(val) => $emit('update-sub-doc', { field: 'b18_status', value: val })"
          />
        </div>
      </div>

      <!-- BA-21 -->
      <div class="col-12 col-md-4">
        <div class="p-2 rounded bg-white border d-flex align-items-center justify-content-between">
          <div>
            <div class="fw-bold text-dark small">Dokumen BA-21</div>
            <div class="text-muted" style="font-size: 0.72rem;">Berita Acara Penjualan Lelang</div>
          </div>
          <status-badge-dropdown
            :model-value="ba21Status"
            type="document"
            @change="(val) => $emit('update-sub-doc', { field: 'ba21_status', value: val })"
          />
        </div>
      </div>

      <!-- BA-22 -->
      <div class="col-12 col-md-4">
        <div class="p-2 rounded bg-white border d-flex align-items-center justify-content-between">
          <div>
            <div class="fw-bold text-dark small">Dokumen BA-22</div>
            <div class="text-muted" style="font-size: 0.72rem;">Berita Acara Penyerahan Hasil Lelang</div>
          </div>
          <status-badge-dropdown
            :model-value="ba22Status"
            type="document"
            @change="(val) => $emit('update-sub-doc', { field: 'ba22_status', value: val })"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import StatusBadgeDropdown from './StatusBadgeDropdown.vue';

export default {
  name: 'LelangDetail',
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
    b18Status: {
      type: String,
      required: true,
    },
    ba21Status: {
      type: String,
      required: true,
    },
    ba22Status: {
      type: String,
      required: true,
    },
  },
  emits: ['update-sub-doc', 'close'],
};
</script>
