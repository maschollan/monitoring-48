<template>
  <div class="min-vh-100 d-flex flex-column bg-light pb-5">
    <!-- Navbar & Metrics -->
    <navbar-header
      :total-count="totalCount"
      :rampasan-count="rampasanCount"
      :lelang-count="rampasanCount"
      :ba20-count="ba20Count"
      :ba23-count="ba23Count"
      :pendapat-hukum-count="pendapatHukumCount"
      :is-supabase-connected="isSupabaseConnected"
      :realtime-status="realtimeStatus"
      :is-syncing="isSyncing"
      @open-add-perkara="openAddPerkaraModal"
      @open-import-modal="showImportModal = true"
      @open-supabase-modal="showSupabaseModal = true"
      @sync-refresh="handleSyncRefresh"
    />

    <!-- Main Container: Focus on DataTables -->
    <main class="container-fluid px-3 px-lg-4 flex-grow-1">
      <!-- Loading indicator -->
      <div v-if="loading && perkaraList.length === 0" class="card border-0 shadow-sm rounded-3 p-5 text-center my-3">
        <div class="spinner-border text-primary mx-auto mb-3" role="status"></div>
        <div class="fw-semibold text-dark">Memuat Data Perkara...</div>
        <div class="text-muted small">Menghubungkan ke database dan menginisialisasi tabel.</div>
      </div>

      <!-- Main DataTables Table -->
      <div v-else>
        <perkara-table
          :perkara-list="perkaraList"
          @edit-perkara="openEditPerkaraModal"
          @delete-perkara="confirmDeletePerkara"
          @update-status="handleUpdateStatus"
          @add-penerima="handleAddPenerima"
          @edit-penerima="handleEditPenerima"
          @delete-penerima="confirmDeletePenerima"
          @update-penerima-status="handleUpdatePenerimaStatus"
        />
      </div>
    </main>

    <!-- Footer note -->
    <footer class="mt-auto pt-4 text-center text-muted small">
      <div class="container">
        <span>Sistem Monitoring Administrasi Perkara & Eksekusi Dokumen P-48</span> &bull;
        <span>Kejaksaan RI</span>
      </div>
    </footer>

    <!-- MODAL 1: Form Perkara (Add / Edit) -->
    <perkara-form-modal
      :show="showPerkaraModal"
      :perkara="selectedPerkara"
      :existing-registers="existingRegisters"
      @close="closePerkaraModal"
      @save="handleSavePerkara"
    />

    <!-- MODAL 2: Import CSV (Upload / Paste) -->
    <import-modal
      :show="showImportModal"
      @close="showImportModal = false"
      @imported="handleImportData"
    />

    <!-- MODAL 3: Supabase Config & SQL Schema -->
    <supabase-config-modal
      :show="showSupabaseModal"
      @close="showSupabaseModal = false"
      @config-saved="checkSupabaseAndReload"
    />
  </div>
</template>

<script lang="ts">
import Swal from 'sweetalert2';
import ImportModal from './components/ImportModal.vue';
import NavbarHeader from './components/NavbarHeader.vue';
import PerkaraFormModal from './components/PerkaraFormModal.vue';
import PerkaraTable from './components/PerkaraTable.vue';
import SupabaseConfigModal from './components/SupabaseConfigModal.vue';
import { PerkaraService } from './services/perkaraService';
import { getStoredSupabaseConfig, getSupabase, subscribeToRealtimeChanges } from './services/supabase';
import { BA20Penerima, BA20ReceiverStatus, CSVRowData, DocumentStatus, Perkara } from './types';

export default {
  name: 'App',
  components: {
    NavbarHeader,
    PerkaraTable,
    PerkaraFormModal,
    ImportModal,
    SupabaseConfigModal,
  },
  data() {
    return {
      perkaraList: [] as Perkara[],
      loading: false,

      // Supabase Native Realtime & Sync State
      realtimeStatus: 'CONNECTING',
      isSyncing: false,
      realtimeUnsubscribe: null as (() => void) | null,

      // Perkara Modal
      showPerkaraModal: false,
      selectedPerkara: null as Perkara | null,

      // Import Modal
      showImportModal: false,

      // Supabase Config Modal
      showSupabaseModal: false,
      isSupabaseConnected: false,
    };
  },
  computed: {
    existingRegisters(): string[] {
      return this.perkaraList.map((p) => p.nomor_register_perkara);
    },
    totalCount(): number {
      return this.perkaraList.length;
    },
    rampasanCount(): number {
      return this.perkaraList.filter(
        (p) =>
          p.b18_status !== 'tidak_ada' ||
          p.ba21_status !== 'tidak_ada' ||
          p.ba22_status !== 'tidak_ada'
      ).length;
    },
    lelangCount(): number {
      return this.rampasanCount;
    },
    ba20Count(): number {
      return this.perkaraList.filter((p) => p.ba20_status === 'ada').length;
    },
    ba23Count(): number {
      return this.perkaraList.filter((p) => p.ba23_status !== 'tidak_ada').length;
    },
    pendapatHukumCount(): number {
      return this.perkaraList.filter((p) => p.pendapat_hukum_status !== 'tidak_ada').length;
    },
  },
  mounted() {
    this.checkSupabaseStatus();
    this.loadData();
    this.setupRealtimeSubscription();
    window.addEventListener('storage', this.handleStorageEvent);
  },
  beforeUnmount() {
    if (this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe();
      this.realtimeUnsubscribe = null;
    }
    window.removeEventListener('storage', this.handleStorageEvent);
  },
  methods: {
    checkSupabaseStatus() {
      const cfg = getStoredSupabaseConfig();
      const client = getSupabase();
      this.isSupabaseConnected = !!(client && cfg.url && cfg.anonKey);
      if (!this.isSupabaseConnected) {
        this.realtimeStatus = 'OFFLINE_LOCAL';
      }
    },
    setupRealtimeSubscription() {
      if (this.realtimeUnsubscribe) {
        this.realtimeUnsubscribe();
        this.realtimeUnsubscribe = null;
      }

      if (!this.isSupabaseConnected) {
        this.realtimeStatus = 'OFFLINE_LOCAL';
        return;
      }

      this.realtimeStatus = 'CONNECTING';
      this.realtimeUnsubscribe = subscribeToRealtimeChanges(
        (table, payload) => {
          this.handleRealtimeEvent(table, payload);
        },
        (status) => {
          this.realtimeStatus = status;
        }
      );
    },
    async handleRealtimeEvent(table: string, payload: any) {
      try {
        const freshList = await PerkaraService.getAllPerkara();
        this.perkaraList = freshList;
        const tableName = table === 'perkara' ? 'Perkara' : 'Penerima BA-20';
        this.toastInfo(`Data diperbarui realtime (${tableName})`);
      } catch (err) {
        console.warn('Realtime refresh error:', err);
      }
    },
    async loadData() {
      this.loading = true;
      try {
        this.perkaraList = await PerkaraService.getAllPerkara();
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        this.loading = false;
      }
    },
    async handleSyncRefresh() {
      this.isSyncing = true;
      try {
        await this.loadData();
        this.toastSuccess('Data berhasil disinkronkan.');
      } finally {
        this.isSyncing = false;
      }
    },
    async checkSupabaseAndReload() {
      this.checkSupabaseStatus();
      await this.loadData();
      this.setupRealtimeSubscription();
    },
    handleStorageEvent(e: StorageEvent) {
      if (
        e.key === 'monitoring_p48_perkara_data' ||
        e.key === 'monitoring_p48_penerima_data'
      ) {
        this.loadData();
      }
    },

    // --- PERKARA FORM ---
    openAddPerkaraModal() {
      this.selectedPerkara = null;
      this.showPerkaraModal = true;
    },
    openEditPerkaraModal(perkara: Perkara) {
      this.selectedPerkara = { ...perkara };
      this.showPerkaraModal = true;
    },
    closePerkaraModal() {
      this.showPerkaraModal = false;
      this.selectedPerkara = null;
    },
    async handleSavePerkara(formData: {
      id?: string;
      nomor_surat: string;
      tgl_surat: string;
      nomor_register_perkara: string;
      nama_terpidana: string;
    }) {
      this.loading = true;
      try {
        if (formData.id) {
          await PerkaraService.updatePerkara(formData.id, {
            nomor_surat: formData.nomor_surat,
            tgl_surat: formData.tgl_surat,
            nomor_register_perkara: formData.nomor_register_perkara,
            nama_terpidana: formData.nama_terpidana,
          });
          this.toastSuccess('Data perkara berhasil diperbarui.');
        } else {
          await PerkaraService.createPerkara({
            nomor_surat: formData.nomor_surat,
            tgl_surat: formData.tgl_surat,
            nomor_register_perkara: formData.nomor_register_perkara,
            nama_terpidana: formData.nama_terpidana,
          });
          this.toastSuccess('Perkara baru berhasil ditambahkan.');
        }
        this.closePerkaraModal();
        await this.loadData();
      } catch (err: any) {
        Swal.fire({
          icon: 'warning',
          title: 'Perhatian',
          text: err.message || 'Gagal menyimpan data perkara.',
          confirmButtonColor: '#0d6efd',
        });
      } finally {
        this.loading = false;
      }
    },

    // --- DELETE PERKARA ---
    async confirmDeletePerkara(item: Perkara) {
      const result = await Swal.fire({
        title: 'Hapus Perkara?',
        text: `Apakah Anda yakin ingin menghapus perkara register ${item.nomor_register_perkara}? Seluruh data penerima BA-20 terkait juga akan dihapus.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
      });

      if (result.isConfirmed) {
        this.loading = true;
        try {
          await PerkaraService.deletePerkara(item.id);
          this.toastSuccess('Perkara berhasil dihapus.');
          await this.loadData();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal Menghapus',
            text: err.message || 'Terjadi kesalahan saat menghapus perkara.',
          });
        } finally {
          this.loading = false;
        }
      }
    },

    // --- STATUS UPDATE (INLINE) ---
    async handleUpdateStatus(payload: {
      id: string;
      updates: Partial<Pick<Perkara, 'b18_status' | 'ba21_status' | 'ba22_status' | 'ba23_status' | 'pendapat_hukum_status' | 'ba20_status'>>;
    }) {
      try {
        await PerkaraService.updateStatus(payload.id, payload.updates);

        // Optimistic UI update on current list
        const p = this.perkaraList.find((item) => item.id === payload.id);
        if (p) {
          Object.assign(p, payload.updates);
        }

        const keys = Object.keys(payload.updates);
        if (keys.includes('ba23_status')) {
          this.toastSuccess('Status BA-23 berhasil diperbarui.');
        } else if (keys.includes('pendapat_hukum_status')) {
          this.toastSuccess('Status Pendapat Hukum berhasil diperbarui.');
        } else if (keys.includes('ba20_status')) {
          this.toastSuccess('Status BA-20 berhasil diperbarui.');
        } else {
          this.toastSuccess('Status dokumen Rampasan berhasil diperbarui.');
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mengubah Status',
          text: err.message || 'Gagal menyimpan status ke database.',
        });
      }
    },

    // --- IMPORT CSV ---
    async handleImportData(validRows: CSVRowData[]) {
      this.loading = true;
      try {
        const res = await PerkaraService.upsertFromCSV(validRows);
        this.showImportModal = false;
        await this.loadData();

        Swal.fire({
          icon: 'success',
          title: 'Import Selesai!',
          html: `<div class="text-start small">
            <p class="mb-1"><strong>Total data diproses:</strong> ${validRows.length}</p>
            <p class="mb-1 text-success"><strong>Data baru ditambahkan:</strong> ${res.inserted}</p>
            <p class="mb-0 text-primary"><strong>Data diperbarui (biodata di-update, status dokumen dipertahankan):</strong> ${res.updated}</p>
          </div>`,
          confirmButtonColor: '#198754',
        });
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Import',
          text: err.message || 'Terjadi kesalahan saat memproses import CSV.',
        });
      } finally {
        this.loading = false;
      }
    },

    // --- PENERIMA BA-20 ---
    // --- PENERIMA BA-20 (INLINE / TANPA MODAL) ---
    async handleAddPenerima(payload: {
      perkaraId: string;
      nama_penerima: string;
      status_ba20: BA20ReceiverStatus;
    }) {
      try {
        const newPenerima = await PerkaraService.addPenerima(
          payload.perkaraId,
          payload.nama_penerima,
          payload.status_ba20
        );

        // Optimistically update current state
        const p = this.perkaraList.find((item) => item.id === payload.perkaraId);
        if (p) {
          if (!p.penerima) p.penerima = [];
          p.penerima.push(newPenerima);
        }

        this.toastSuccess('Penerima berhasil ditambahkan.');
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err.message || 'Gagal menyimpan penerima barang bukti.',
        });
      }
    },
    async handleEditPenerima(payload: {
      id: string;
      perkaraId: string;
      nama_penerima: string;
      status_ba20: BA20ReceiverStatus;
    }) {
      try {
        await PerkaraService.updatePenerima(payload.id, {
          nama_penerima: payload.nama_penerima,
          status_ba20: payload.status_ba20,
        });

        // Optimistically update current state
        const p = this.perkaraList.find((item) => item.id === payload.perkaraId);
        if (p && p.penerima) {
          const r = p.penerima.find((item) => item.id === payload.id);
          if (r) {
            r.nama_penerima = payload.nama_penerima;
            r.status_ba20 = payload.status_ba20;
          }
        }

        this.toastSuccess('Nama penerima berhasil diperbarui.');
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err.message || 'Gagal memperbarui penerima.',
        });
      }
    },
    async confirmDeletePenerima(penerima: BA20Penerima) {
      const result = await Swal.fire({
        title: 'Hapus Penerima?',
        text: `Hapus ${penerima.nama_penerima} dari daftar penerima BA-20?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
      });

      if (result.isConfirmed) {
        this.loading = true;
        try {
          await PerkaraService.deletePenerima(penerima.id);
          this.toastSuccess('Penerima berhasil dihapus.');
          await this.loadData();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal Menghapus',
            text: err.message || 'Gagal menghapus penerima.',
          });
        } finally {
          this.loading = false;
        }
      }
    },
    async handleUpdatePenerimaStatus(payload: { penerimaId: string; status: BA20ReceiverStatus }) {
      try {
        await PerkaraService.updatePenerima(payload.penerimaId, {
          status_ba20: payload.status,
        });

        // Optimistically update
        for (const p of this.perkaraList) {
          if (p.penerima) {
            const r = p.penerima.find((item) => item.id === payload.penerimaId);
            if (r) {
              r.status_ba20 = payload.status;
              break;
            }
          }
        }
        this.toastSuccess('Status BA-20 penerima berhasil diperbarui.');
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mengubah Status',
          text: err.message || 'Gagal menyimpan status penerima.',
        });
      }
    },

    // --- TOAST NOTIFICATIONS ---
    toastSuccess(msg: string) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: 'success',
        title: msg,
      });
    },
    toastInfo(msg: string) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: false,
      });
      Toast.fire({
        icon: 'info',
        title: msg,
      });
    },
  },
};
</script>
