<template>
  <header class="bg-white border-bottom shadow-xs mb-3">
    <div class="container-fluid px-3 px-lg-4 py-2.5">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <!-- Title & Subtitle -->
        <div class="d-flex align-items-center gap-2.5">
          <div class="p-2 bg-primary text-white rounded-3 shadow-xs">
            <i class="bi bi-folder-check fs-4"></i>
          </div>
          <div>
            <h1 class="h5 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              Monitoring Administrasi Perkara
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xs py-0.5 px-2 rounded-pill">P-48</span>
            </h1>
            <p class="text-muted small mb-0 d-none d-sm-block" style="font-size: 0.78rem;">
              Monitoring Dokumen P-48, B-18, BA-20, BA-21, BA-22, BA-23, dan Pendapat Hukum
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <!-- Connection Status Button -->
          <button
            type="button"
            class="btn btn-sm py-1.5 px-2.5 d-flex align-items-center gap-1.5 border shadow-xs"
            :class="isSupabaseConnected ? 'btn-light text-success border-success-subtle' : 'btn-light text-secondary border-secondary-subtle'"
            @click="$emit('open-supabase-modal')"
            title="Konfigurasi Koneksi Database Supabase"
          >
            <span
              class="d-inline-block rounded-circle"
              :class="isSupabaseConnected ? 'bg-success' : 'bg-secondary'"
              style="width: 8px; height: 8px;"
            ></span>
            <span class="small fw-medium">{{ isSupabaseConnected ? 'Supabase Terhubung' : 'Storage Lokal' }}</span>
            <i class="bi bi-gear-fill text-muted ms-1" style="font-size: 0.75rem;"></i>
          </button>

          <!-- + Tambah Perkara -->
          <button
            type="button"
            class="btn btn-sm btn-primary px-3 shadow-xs fw-medium d-flex align-items-center gap-1.5"
            @click="$emit('open-add-perkara')"
          >
            <i class="bi bi-plus-circle-fill"></i>
            <span>+ Tambah Perkara</span>
          </button>

          <!-- + Import Data -->
          <button
            type="button"
            class="btn btn-sm btn-success px-3 shadow-xs fw-medium d-flex align-items-center gap-1.5"
            @click="$emit('open-import-modal')"
          >
            <i class="bi bi-file-earmark-arrow-up-fill"></i>
            <span>+ Import Data</span>
          </button>
        </div>
      </div>

      <!-- Quick Summary Metric Badges (Ringkas, Clean, Tidak Mengganggu DataTables) -->
      <div class="d-flex flex-wrap gap-2 pt-2.5 mt-2 border-top">
        <div class="d-flex align-items-center gap-2 px-2.5 py-1 bg-light rounded border text-muted small">
          <i class="bi bi-archive-fill text-primary"></i>
          <span>Total Perkara: <strong class="text-dark">{{ totalCount }}</strong></span>
        </div>

        <div class="d-flex align-items-center gap-2 px-2.5 py-1 bg-light rounded border text-muted small">
          <i class="bi bi-hammer text-warning"></i>
          <span>Lelang Ada/Dibuat: <strong class="text-dark">{{ lelangCount }}</strong></span>
        </div>

        <div class="d-flex align-items-center gap-2 px-2.5 py-1 bg-light rounded border text-muted small">
          <i class="bi bi-arrow-return-left text-success"></i>
          <span>Dikembalikan BA-20: <strong class="text-dark">{{ ba20Count }}</strong></span>
        </div>

        <div class="d-flex align-items-center gap-2 px-2.5 py-1 bg-light rounded border text-muted small">
          <i class="bi bi-fire text-danger"></i>
          <span>Dimusnahkan BA-23: <strong class="text-dark">{{ ba23Count }}</strong></span>
        </div>

        <div class="d-flex align-items-center gap-2 px-2.5 py-1 bg-light rounded border text-muted small">
          <i class="bi bi-journal-text text-info"></i>
          <span>Pendapat Hukum: <strong class="text-dark">{{ pendapatHukumCount }}</strong></span>
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
export default {
  name: 'NavbarHeader',
  props: {
    totalCount: {
      type: Number,
      default: 0,
    },
    lelangCount: {
      type: Number,
      default: 0,
    },
    ba20Count: {
      type: Number,
      default: 0,
    },
    ba23Count: {
      type: Number,
      default: 0,
    },
    pendapatHukumCount: {
      type: Number,
      default: 0,
    },
    isSupabaseConnected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['open-add-perkara', 'open-import-modal', 'open-supabase-modal'],
};
</script>
