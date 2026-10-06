<template>
  <header class="bg-white border-bottom shadow-xs mb-3">
    <div class="container-fluid px-3 px-lg-4 py-3">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 my-4">
        <!-- Title & Subtitle -->
        <div class="d-flex align-items-center gap-3">
          <div class="p-3 bg-primary text-white rounded-3 shadow-xs d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;">
            <i class="bi bi-folder-check fs-4"></i>
          </div>
          <div>
            <h1 class="h5 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              Monitoring Administrasi Perkara
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xs py-1 px-3 rounded-pill">P-48</span>
            </h1>
            <p class="text-muted small mb-0 d-none d-sm-block mt-1" style="font-size: 0.78rem;">
              Monitoring Dokumen P-48, B-18, BA-20, BA-21, BA-22, BA-23, dan Pendapat Hukum
            </p>
          </div>
        </div>

        <!-- Action Buttons & Status -->
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <!-- 1. Status Koneksi Realtime Supabase -->
          <button
            type="button"
            class="btn btn-sm py-2 px-3 d-flex align-items-center border shadow-xs bg-light"
            :class="connectionBadgeClass"
            @click="$emit('open-supabase-modal')"
            title="Klik untuk melihat / mengubah konfigurasi database Supabase"
          >
            <span :class="['realtime-dot me-2', connectionDotClass]"></span>
            <span class="small fw-semibold">{{ connectionStatusText }}</span>
            <i class="bi bi-gear-fill text-muted ms-2" style="font-size: 0.75rem;"></i>
          </button>

          <!-- 2. Button Sync Refresh -->
          <button
            type="button"
            class="btn btn-sm btn-light border shadow-xs fw-medium d-inline-flex align-items-center px-3"
            :disabled="isSyncing"
            @click="$emit('sync-refresh')"
            title="Muat ulang dan sinkronkan data perkara seketika"
          >
            <i :class="['bi bi-arrow-repeat text-primary me-2', { 'spin-sync': isSyncing }]"></i>
            <span>{{ isSyncing ? 'Menyinkronkan...' : 'Sync Refresh' }}</span>
          </button>

          <!-- 3. + Tambah Perkara -->
          <button
            type="button"
            class="btn btn-sm btn-primary px-3 shadow-xs fw-medium d-flex align-items-center"
            @click="$emit('open-add-perkara')"
          >
            <i class="bi bi-plus-circle-fill me-2"></i>
            <span>Tambah Perkara</span>
          </button>

          <!-- 4. + Import Data -->
          <button
            type="button"
            class="btn btn-sm btn-success px-3 shadow-xs fw-medium d-flex align-items-center"
            @click="$emit('open-import-modal')"
          >
            <i class="bi bi-file-earmark-arrow-up-fill me-2"></i>
            <span>Import Data</span>
          </button>
        </div>
      </div>

      <!-- Quick Summary Metric Badges (Ringkas, Clean, Tidak Mengganggu DataTables) -->
      <div class="d-flex flex-wrap gap-3 pt-3 mt-3 border-top">
        <div class="d-flex align-items-center px-3 py-2 bg-light rounded border text-muted small">
          <i class="bi bi-archive-fill text-primary me-2 fs-6"></i>
          <span>Total Perkara: <strong class="text-dark ms-1">{{ totalCount }}</strong></span>
        </div>

        <div class="d-flex align-items-center px-3 py-2 bg-light rounded border text-muted small">
          <i class="bi bi-hammer text-primary me-2 fs-6"></i>
          <span>Rampasan (Ada): <strong class="text-dark ms-1">{{ displayRampasanCount }}</strong></span>
        </div>

        <div class="d-flex align-items-center px-3 py-2 bg-light rounded border text-muted small">
          <i class="bi bi-arrow-return-left text-success me-2 fs-6"></i>
          <span>Dikembalikan BA-20: <strong class="text-dark ms-1">{{ ba20Count }}</strong></span>
        </div>

        <div class="d-flex align-items-center px-3 py-2 bg-light rounded border text-muted small">
          <i class="bi bi-fire text-danger me-2 fs-6"></i>
          <span>Dimusnahkan BA-23: <strong class="text-dark ms-1">{{ ba23Count }}</strong></span>
        </div>

        <div class="d-flex align-items-center px-3 py-2 bg-light rounded border text-muted small">
          <i class="bi bi-journal-text text-info me-2 fs-6"></i>
          <span>Pendapat Hukum: <strong class="text-dark ms-1">{{ pendapatHukumCount }}</strong></span>
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
    rampasanCount: {
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
    realtimeStatus: {
      type: String,
      default: 'CONNECTING',
    },
    isSyncing: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'open-add-perkara',
    'open-import-modal',
    'open-supabase-modal',
    'sync-refresh',
  ],
  computed: {
    connectionDotClass(): string {
      if (!this.isSupabaseConnected) {
        return 'disconnected';
      }
      if (this.realtimeStatus === 'SUBSCRIBED') {
        return 'connected';
      }
      if (this.realtimeStatus === 'CONNECTING' || this.realtimeStatus === 'JOINING') {
        return 'connecting';
      }
      return 'disconnected';
    },
    connectionBadgeClass(): string {
      if (!this.isSupabaseConnected) {
        return 'text-secondary border-secondary-subtle';
      }
      if (this.realtimeStatus === 'SUBSCRIBED') {
        return 'text-success border-success-subtle';
      }
      if (this.realtimeStatus === 'CONNECTING' || this.realtimeStatus === 'JOINING') {
        return 'text-warning border-warning-subtle';
      }
      return 'text-danger border-danger-subtle';
    },
    connectionStatusText(): string {
      if (!this.isSupabaseConnected) {
        return 'Storage Lokal';
      }
      if (this.realtimeStatus === 'SUBSCRIBED') {
        return 'Realtime Terhubung';
      }
      if (this.realtimeStatus === 'CONNECTING' || this.realtimeStatus === 'JOINING') {
        return 'Menghubungkan...';
      }
      if (this.realtimeStatus === 'TIMED_OUT' || this.realtimeStatus === 'CHANNEL_ERROR' || this.realtimeStatus === 'CLOSED') {
        return 'Realtime Terputus';
      }
      return 'Supabase';
    },
    displayRampasanCount(): number {
      return this.rampasanCount || this.lelangCount || 0;
    },
  },
};
</script>
