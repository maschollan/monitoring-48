<template>
  <div
    v-if="show"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px);"
    @click.self="closeModal"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <div class="modal-header bg-light border-bottom py-3">
          <div class="d-flex align-items-center gap-3">
            <div class="p-3 bg-success bg-opacity-10 text-success rounded d-flex align-items-center justify-content-center" style="width: 42px; height: 42px;">
              <i class="bi bi-database-fill-gear fs-4"></i>
            </div>
            <div>
              <h5 class="modal-title fs-6 fw-bold text-dark mb-0">Pengaturan Koneksi Supabase</h5>
              <div class="text-muted" style="font-size: 0.75rem;">
                Hubungkan aplikasi langsung ke database PostgreSQL Supabase Anda.
              </div>
            </div>
          </div>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <div class="modal-body p-4">
          <!-- Connection Status -->
          <div class="alert py-3 px-3 mb-3 d-flex align-items-center justify-content-between" :class="isConfigured ? 'alert-success' : 'alert-secondary'">
            <div class="d-flex align-items-center">
              <i :class="isConfigured ? 'bi-check-circle-fill text-success fs-5 me-3' : 'bi-hdd-network-fill text-secondary fs-5 me-3'"></i>
              <div>
                <strong class="d-block small">{{ isConfigured ? 'Kredensial Supabase Terkonfigurasi' : 'Mode Offline / Local Relational Storage Aktif' }}</strong>
                <span class="text-muted" style="font-size: 0.75rem;">
                  {{ isConfigured ? 'Aplikasi siap sinkronisasi dengan database cloud Supabase.' : 'Data tersimpan di penyimpanan browser lokal dan tetap dapat diuji sepenuhnya.' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Form Kredensial -->
          <div class="row g-3 mb-3">
            <div class="col-12">
              <label class="form-label">Supabase Project URL</label>
              <input
                v-model.trim="url"
                type="text"
                class="form-control"
                placeholder="https://your-project.supabase.co"
              />
              <div class="form-text" style="font-size: 0.72rem;">Dapat ditemukan di Supabase Dashboard -> Project Settings -> API.</div>
            </div>
            <div class="col-12">
              <label class="form-label">Supabase Anon Key (Public)</label>
              <input
                v-model.trim="anonKey"
                type="password"
                class="form-control font-monospace"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </div>
          </div>

          <!-- Test connection message -->
          <div v-if="testResult" class="alert py-2 px-3 small mb-3 d-flex align-items-center" :class="testResult.success ? 'alert-success' : 'alert-danger'">
            <i :class="testResult.success ? 'bi-check-circle-fill me-2 fs-6' : 'bi-exclamation-triangle-fill me-2 fs-6'"></i>
            <div>{{ testResult.message }}</div>
          </div>

          <!-- Action buttons for connection -->
          <div class="d-flex gap-3 mb-4">
            <button
              type="button"
              class="btn btn-sm btn-outline-primary px-3 d-inline-flex align-items-center"
              :disabled="testing || !url || !anonKey"
              @click="handleTestConnection"
            >
              <span v-if="testing" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-broadcast me-2"></i>
              Tes Koneksi Database
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger px-3 d-inline-flex align-items-center"
              v-if="isConfigured"
              @click="resetToLocal"
            >
              <i class="bi bi-trash me-2"></i>Hapus Kredensial (Gunakan Local Mode)
            </button>
          </div>

          <!-- SQL Schema Guide Accordion -->
          <div class="border rounded-2 p-3 bg-light">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <strong class="small text-dark d-flex align-items-center">
                <i class="bi bi-code-slash me-2 text-primary fs-6"></i>Skrip DDL SQL Supabase (Tabel perkara & ba20_penerima)
              </strong>
              <button
                type="button"
                class="btn btn-sm btn-primary py-1 px-3 d-inline-flex align-items-center"
                style="font-size: 0.75rem;"
                @click="copySqlSchema"
              >
                <i :class="copied ? 'bi-check2' : 'bi-clipboard'" class="me-2"></i>
                {{ copied ? 'Disalin!' : 'Salin SQL' }}
              </button>
            </div>
            <p class="text-muted mb-2" style="font-size: 0.75rem;">
              Jalankan skrip ini sekali di menu <strong>SQL Editor</strong> pada dashboard Supabase Anda untuk membuat tabel dengan relasi, unique constraint, dan RLS:
            </p>
            <pre class="p-3 bg-dark text-light rounded font-monospace small mb-0" style="max-height: 160px; overflow-y: auto; font-size: 0.72rem;">{{ sqlSchema }}</pre>
          </div>
        </div>

        <div class="modal-footer bg-light py-3 px-4 border-top">
          <button type="button" class="btn btn-sm btn-outline-secondary px-3" @click="closeModal">
            Tutup
          </button>
          <button type="button" class="btn btn-sm btn-success px-4 shadow-sm d-inline-flex align-items-center" @click="saveConfig">
            <i class="bi bi-check-lg me-2"></i>Simpan Konfigurasi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  SUPABASE_SQL_SCHEMA,
  testSupabaseConnection,
} from '../services/supabase';

export default {
  name: 'SupabaseConfigModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'config-saved'],
  data() {
    return {
      url: '',
      anonKey: '',
      testing: false,
      testResult: null as { success: boolean; message: string } | null,
      sqlSchema: SUPABASE_SQL_SCHEMA,
      copied: false,
    };
  },
  computed: {
    isConfigured(): boolean {
      return !!(this.url && this.anonKey && this.url.startsWith('http'));
    },
  },
  watch: {
    show(val) {
      if (val) {
        const cfg = getStoredSupabaseConfig();
        this.url = cfg.url;
        this.anonKey = cfg.anonKey;
        this.testResult = null;
        this.copied = false;
      }
    },
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    async handleTestConnection() {
      this.testing = true;
      this.testResult = null;
      try {
        const res = await testSupabaseConnection(this.url, this.anonKey);
        this.testResult = res;
      } finally {
        this.testing = false;
      }
    },
    saveConfig() {
      saveStoredSupabaseConfig(this.url, this.anonKey);
      this.$emit('config-saved');
      this.closeModal();
    },
    resetToLocal() {
      this.url = '';
      this.anonKey = '';
      saveStoredSupabaseConfig('', '');
      this.testResult = {
        success: true,
        message: 'Kredensial dihapus. Sistem beralih ke local relational storage.',
      };
      this.$emit('config-saved');
    },
    async copySqlSchema() {
      try {
        await navigator.clipboard.writeText(this.sqlSchema);
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      } catch (e) {
        console.error('Failed to copy', e);
      }
    },
  },
};
</script>
