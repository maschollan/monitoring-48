<template>
  <div class="card border-0 shadow-sm rounded-3">
    <!-- DataTables Top Controls: Search & Per Page -->
    <div class="card-body border-bottom p-3">
      <div class="row g-2 align-items-center justify-content-between">
        <!-- Entries per page -->
        <div class="col-12 col-sm-auto d-flex align-items-center gap-2">
          <label class="small text-muted mb-0">Tampilkan:</label>
          <select
            v-model.number="perPage"
            class="form-select form-select-sm"
            style="width: 80px;"
            @change="currentPage = 1"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="small text-muted">perkara</span>
        </div>

        <!-- Universal Search Box -->
        <div class="col-12 col-sm-6 col-md-5 col-lg-4">
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-white border-end-0 text-muted">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Cari nomor surat, register, nama terpidana..."
              @input="currentPage = 1"
            />
            <button
              v-if="searchQuery"
              class="btn btn-outline-secondary border-start-0"
              type="button"
              @click="searchQuery = ''; currentPage = 1"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- DataTables Main Table -->
    <div class="table-responsive">
      <table class="table table-hover table-perkara align-middle mb-0">
        <thead>
          <tr>
            <!-- 1. Nomor P-48 -->
            <th class="table-sortable" @click="toggleSort('nomor_surat')" style="min-width: 170px;">
              <div class="d-flex align-items-center justify-content-between">
                <span>Nomor P-48</span>
                <i :class="getSortIcon('nomor_surat')" class="text-muted ms-1"></i>
              </div>
            </th>

            <!-- 2. Tanggal -->
            <th class="table-sortable" @click="toggleSort('tgl_surat')" style="min-width: 110px;">
              <div class="d-flex align-items-center justify-content-between">
                <span>Tanggal</span>
                <i :class="getSortIcon('tgl_surat')" class="text-muted ms-1"></i>
              </div>
            </th>

            <!-- 3. Nama Terpidana -->
            <th class="table-sortable" @click="toggleSort('nama_terpidana')" style="min-width: 240px;">
              <div class="d-flex align-items-center justify-content-between">
                <span>Nama Terpidana</span>
                <i :class="getSortIcon('nama_terpidana')" class="text-muted ms-1"></i>
              </div>
            </th>

            <!-- 4. Rampasan -->
            <th class="table-sortable text-center" @click="toggleSort('rampasan_status')" style="min-width: 155px;">
              <div class="d-flex align-items-center justify-content-center gap-1">
                <span>Rampasan</span>
                <i :class="getSortIcon('rampasan_status')" class="text-muted"></i>
              </div>
            </th>

            <!-- 5. Dikembalikan BA-20 -->
            <th class="table-sortable text-center" @click="toggleSort('ba20_status')" style="min-width: 165px;">
              <div class="d-flex align-items-center justify-content-center gap-1">
                <span>Dikembalikan BA-20</span>
                <i :class="getSortIcon('ba20_status')" class="text-muted"></i>
              </div>
            </th>

            <!-- 6. Dimusnahkan BA-23 -->
            <th class="table-sortable text-center" @click="toggleSort('ba23_status')" style="min-width: 145px;">
              <div class="d-flex align-items-center justify-content-center gap-1">
                <span>Dimusnahkan BA-23</span>
                <i :class="getSortIcon('ba23_status')" class="text-muted"></i>
              </div>
            </th>

            <!-- 7. Pendapat Hukum -->
            <th class="table-sortable text-center" @click="toggleSort('pendapat_hukum_status')" style="min-width: 145px;">
              <div class="d-flex align-items-center justify-content-center gap-1">
                <span>Pendapat Hukum</span>
                <i :class="getSortIcon('pendapat_hukum_status')" class="text-muted"></i>
              </div>
            </th>

            <!-- 8. Aksi -->
            <th class="text-center" style="width: 90px; min-width: 90px;">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <!-- Empty State -->
          <tr v-if="filteredAndSortedPerkara.length === 0">
            <td colspan="8" class="text-center py-5">
              <div class="text-muted">
                <i class="bi bi-file-earmark-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                <div class="fw-semibold">Tidak ada data perkara ditemukan</div>
                <div class="small">
                  {{ searchQuery ? 'Tidak ada hasil yang cocok dengan kata kunci "' + searchQuery + '"' : 'Silakan klik + Tambah Perkara atau + Import Data.' }}
                </div>
              </div>
            </td>
          </tr>

          <!-- Data Rows -->
          <template v-for="item in paginatedPerkara" :key="item.id">
            <tr>
              <!-- 1. Nomor P-48 & Nomor Register -->
              <td>
                <div class="fw-bold text-dark font-monospace text-break" style="font-size: 0.85rem;">
                  {{ item.nomor_surat }}
                </div>
                <div class="text-primary small font-monospace d-flex align-items-center gap-1 mt-1" style="font-size: 0.76rem;" title="Nomor Register Perkara (Unique Identifier)">
                  <i class="bi bi-hash text-muted me-1"></i>
                  <span>{{ item.nomor_register_perkara }}</span>
                </div>
              </td>

              <!-- 2. Tanggal -->
              <td>
                <span class="text-secondary small fw-medium text-nowrap">
                  {{ formatDateDisplay(item.tgl_surat) }}
                </span>
              </td>

              <!-- 3. Nama Terpidana -->
              <td>
                <div class="convict-name fw-medium text-dark text-break" style="font-size: 0.84rem;">
                  {{ item.nama_terpidana }}
                </div>
              </td>

              <!-- 4. Rampasan (Master Dropdown: Ada / Tidak Ada + Collapse Button) -->
              <td class="text-center">
                <div class="d-flex flex-column align-items-center gap-1">
                  <!-- Master Dropdown: Ada / Tidak Ada -->
                  <status-badge-dropdown
                    :model-value="getRampasanStatus(item)"
                    type="rampasan"
                    @change="(newVal) => handleMasterRampasanChange(item, newVal)"
                  />
                  <!-- Toggle Collapse Button: Styled like Dikembalikan with another color (primary blue) -->
                  <button
                    v-if="getRampasanStatus(item) === 'ada'"
                    type="button"
                    class="btn btn-sm btn-outline-primary py-1 px-3 mt-1 d-flex align-items-center"
                    style="font-size: 0.72rem; border-radius: 9999px;"
                    @click="toggleCollapseRampasan(item.id)"
                  >
                    <i class="bi bi-diagram-3-fill me-2"></i>
                    <span>Rincian B-18/BA-21/BA-22</span>
                    <i :class="activeCollapseRampasan === item.id ? 'bi-chevron-up' : 'bi-chevron-down'" class="ms-2"></i>
                  </button>
                </div>
              </td>

              <!-- 5. Dikembalikan BA-20 -->
              <td class="text-center">
                <div class="d-flex flex-column align-items-center gap-1">
                  <!-- Status Ada / Tidak Ada -->
                  <status-badge-dropdown
                    :model-value="item.ba20_status"
                    type="ba20"
                    @change="(newVal) => handleBA20StatusChange(item, newVal)"
                  />

                  <!-- Tombol Detail Penerima (Hanya jika Ada) -->
                  <button
                    v-if="item.ba20_status === 'ada'"
                    type="button"
                    class="btn btn-sm btn-outline-success py-1 px-3 mt-1 d-flex align-items-center"
                    style="font-size: 0.72rem; border-radius: 9999px;"
                    @click="toggleCollapseBA20(item.id)"
                  >
                    <i class="bi bi-people-fill me-2"></i>
                    <span>Detail Penerima ({{ (item.penerima || []).length }})</span>
                    <i :class="activeCollapseBA20 === item.id ? 'bi-chevron-up' : 'bi-chevron-down'" class="ms-2"></i>
                  </button>
                </div>
              </td>

              <!-- 6. Dimusnahkan BA-23 -->
              <td class="text-center">
                <status-badge-dropdown
                  :model-value="item.ba23_status"
                  type="document"
                  @change="(newVal) => handleSingleStatusChange(item, 'ba23_status', newVal)"
                />
              </td>

              <!-- 7. Pendapat Hukum -->
              <td class="text-center">
                <status-badge-dropdown
                  :model-value="item.pendapat_hukum_status"
                  type="document"
                  @change="(newVal) => handleSingleStatusChange(item, 'pendapat_hukum_status', newVal)"
                />
              </td>

              <!-- 8. Aksi (Edit & Hapus) -->
              <td class="text-center">
                <div class="btn-group btn-group-sm">
                  <button
                    type="button"
                    class="btn btn-outline-primary btn-sm py-1 px-2"
                    title="Edit Data Perkara"
                    @click="$emit('edit-perkara', item)"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm py-1 px-2"
                    title="Hapus Perkara"
                    @click="$emit('delete-perkara', item)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>

            <!-- COLLAPSE ROW: Rampasan Detail -->
            <tr v-if="activeCollapseRampasan === item.id" class="bg-light">
              <td colspan="8" class="p-0 border-0">
                <lelang-detail
                  :perkara-id="item.id"
                  :nomor-register="item.nomor_register_perkara"
                  :b18-status="item.b18_status"
                  :ba21-status="item.ba21_status"
                  :ba22-status="item.ba22_status"
                  @update-sub-doc="(payload) => handleSubDocUpdate(item, payload)"
                  @close="activeCollapseRampasan = null"
                />
              </td>
            </tr>

            <!-- COLLAPSE ROW: BA-20 Detail -->
            <tr v-if="activeCollapseBA20 === item.id" class="bg-light">
              <td colspan="8" class="p-0 border-0">
                <b-a20-detail
                  :perkara-id="item.id"
                  :nomor-register="item.nomor_register_perkara"
                  :penerima-list="item.penerima || []"
                  @add-penerima="(p) => $emit('add-penerima', p)"
                  @edit-penerima="(p) => $emit('edit-penerima', p)"
                  @delete-penerima="(p) => $emit('delete-penerima', p)"
                  @update-penerima-status="(p) => $emit('update-penerima-status', p)"
                  @close="activeCollapseBA20 = null"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- DataTables Bottom: Info & Pagination -->
    <div class="card-footer bg-white border-top p-3">
      <div class="row g-2 align-items-center justify-content-between">
        <!-- Showing entries info -->
        <div class="col-12 col-sm-auto text-muted small">
          Menampilkan {{ paginationStart }} sampai {{ paginationEnd }} dari {{ filteredAndSortedPerkara.length }} perkara
          <span v-if="searchQuery" class="text-primary">(difilter dari total {{ perkaraList.length }})</span>
        </div>

        <!-- Pagination Controls -->
        <div class="col-12 col-sm-auto">
          <nav aria-label="Navigasi halaman">
            <ul class="pagination pagination-sm mb-0 justify-content-end">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                  <i class="bi bi-chevron-left me-2"></i>Sebelumnya
                </button>
              </li>

              <li
                v-for="page in visiblePages"
                :key="page"
                class="page-item"
                :class="{ active: currentPage === page, disabled: page === -1 }"
              >
                <button v-if="page !== -1" class="page-link" @click="currentPage = page">
                  {{ page }}
                </button>
                <span v-else class="page-link">...</span>
              </li>

              <li class="page-item" :class="{ disabled: currentPage === totalPages || totalPages === 0 }">
                <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages || totalPages === 0">
                  Berikutnya<i class="bi bi-chevron-right ms-2"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType } from 'vue';
import { BA20ReceiverStatus, DocumentStatus, Perkara } from '../types';
import BA20Detail from './BA20Detail.vue';
import LelangDetail from './LelangDetail.vue';
import StatusBadgeDropdown from './StatusBadgeDropdown.vue';

export default {
  name: 'PerkaraTable',
  components: {
    StatusBadgeDropdown,
    LelangDetail,
    BA20Detail,
  },
  props: {
    perkaraList: {
      type: Array as PropType<Perkara[]>,
      default: () => [],
    },
  },
  emits: [
    'edit-perkara',
    'delete-perkara',
    'update-status',
    'add-penerima',
    'edit-penerima',
    'delete-penerima',
    'update-penerima-status',
  ],
  data() {
    return {
      searchQuery: '',
      perPage: 10,
      currentPage: 1,
      sortBy: 'tgl_surat',
      sortAsc: false,
      activeCollapseRampasan: null as string | null,
      activeCollapseBA20: null as string | null,
    };
  },
  computed: {
    filteredAndSortedPerkara(): Perkara[] {
      const q = this.searchQuery.trim().toLowerCase();

      // 1. Filter Universal
      let list = this.perkaraList.filter((p) => {
        if (!q) return true;
        const noSurat = (p.nomor_surat || '').toLowerCase();
        const noReg = (p.nomor_register_perkara || '').toLowerCase();
        const terpidana = (p.nama_terpidana || '').toLowerCase();
        const tgl = (p.tgl_surat || '').toLowerCase();
        return (
          noSurat.includes(q) ||
          noReg.includes(q) ||
          terpidana.includes(q) ||
          tgl.includes(q)
        );
      });

      // 2. Sort
      list = [...list].sort((a, b) => {
        if (this.sortBy === 'tgl_surat') {
          const timeA = this.parseDateToTimestamp(a.tgl_surat);
          const timeB = this.parseDateToTimestamp(b.tgl_surat);
          if (timeA !== timeB) {
            return this.sortAsc ? timeA - timeB : timeB - timeA;
          }
          // Tie-breaker: nomor register perkara
          return (a.nomor_register_perkara || '').localeCompare(b.nomor_register_perkara || '');
        }

        let valA: string = '';
        let valB: string = '';

        if (this.sortBy === 'nomor_surat') {
          valA = a.nomor_surat || '';
          valB = b.nomor_surat || '';
        } else if (this.sortBy === 'nama_terpidana') {
          valA = a.nama_terpidana || '';
          valB = b.nama_terpidana || '';
        } else if (this.sortBy === 'rampasan_status' || this.sortBy === 'lelang_status') {
          valA = this.getRampasanStatus(a);
          valB = this.getRampasanStatus(b);
        } else if (this.sortBy === 'ba20_status') {
          valA = a.ba20_status || '';
          valB = b.ba20_status || '';
        } else if (this.sortBy === 'ba23_status') {
          valA = a.ba23_status || '';
          valB = b.ba23_status || '';
        } else if (this.sortBy === 'pendapat_hukum_status') {
          valA = a.pendapat_hukum_status || '';
          valB = b.pendapat_hukum_status || '';
        }

        const comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        return this.sortAsc ? comp : -comp;
      });

      return list;
    },
    totalPages(): number {
      return Math.ceil(this.filteredAndSortedPerkara.length / this.perPage) || 1;
    },
    paginatedPerkara(): Perkara[] {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredAndSortedPerkara.slice(start, start + this.perPage);
    },
    paginationStart(): number {
      if (this.filteredAndSortedPerkara.length === 0) return 0;
      return (this.currentPage - 1) * this.perPage + 1;
    },
    paginationEnd(): number {
      const end = this.currentPage * this.perPage;
      return Math.min(end, this.filteredAndSortedPerkara.length);
    },
    visiblePages(): number[] {
      const total = this.totalPages;
      const cur = this.currentPage;
      if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      const pages: number[] = [1];
      if (cur > 3) pages.push(-1); // ellipsis
      const start = Math.max(2, cur - 1);
      const end = Math.min(total - 1, cur + 1);
      for (let p = start; p <= end; p++) {
        pages.push(p);
      }
      if (cur < total - 2) pages.push(-1);
      pages.push(total);
      return pages;
    },
  },
  methods: {
    parseDateToTimestamp(dateStr?: string): number {
      if (!dateStr) return 0;
      const str = String(dateStr).trim();
      if (!str) return 0;

      // 1. Format DD-MM-YYYY (contoh: 05-10-2026 atau 5-10-2026)
      const dmyDash = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (dmyDash) {
        const day = parseInt(dmyDash[1], 10);
        const month = parseInt(dmyDash[2], 10) - 1;
        const year = parseInt(dmyDash[3], 10);
        return new Date(year, month, day).getTime();
      }

      // 2. Format DD/MM/YYYY (contoh: 05/10/2026)
      const dmySlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmySlash) {
        const day = parseInt(dmySlash[1], 10);
        const month = parseInt(dmySlash[2], 10) - 1;
        const year = parseInt(dmySlash[3], 10);
        return new Date(year, month, day).getTime();
      }

      // 3. Format YYYY-MM-DD (contoh: 2026-10-05)
      const ymdDash = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (ymdDash) {
        const year = parseInt(ymdDash[1], 10);
        const month = parseInt(ymdDash[2], 10) - 1;
        const day = parseInt(ymdDash[3], 10);
        return new Date(year, month, day).getTime();
      }

      // 4. Standar fallback
      const parsed = Date.parse(str);
      return isNaN(parsed) ? 0 : parsed;
    },
    toggleSort(col: string) {
      if (this.sortBy === col) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortBy = col;
        // Jika kolom tanggal surat, saat diklik default-nya adalah descending (tanggal terbaru di atas)
        this.sortAsc = col === 'tgl_surat' ? false : true;
      }
    },
    getSortIcon(col: string): string {
      if (this.sortBy !== col) {
        return 'bi bi-arrow-down-up opacity-25';
      }
      return this.sortAsc ? 'bi bi-sort-up-alt text-primary' : 'bi bi-sort-down text-primary';
    },
    formatDateDisplay(val: string): string {
      if (!val) return '-';
      // If YYYY-MM-DD convert to DD-MM-YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const [y, m, d] = val.split('-');
        return `${d}-${m}-${y}`;
      }
      return val;
    },
    getRampasanStatus(item: Perkara): 'tidak_ada' | 'ada' {
      const docs = [item.b18_status, item.ba21_status, item.ba22_status];
      if (docs.some((s) => s === 'belum_dibuat' || s === 'sudah_dibuat')) {
        return 'ada';
      }
      return 'tidak_ada';
    },
    handleMasterRampasanChange(item: Perkara, newVal: string) {
      if (newVal === 'tidak_ada') {
        this.$emit('update-status', {
          id: item.id,
          updates: {
            b18_status: 'tidak_ada',
            ba21_status: 'tidak_ada',
            ba22_status: 'tidak_ada',
          },
        });

        if (this.activeCollapseRampasan === item.id) {
          this.activeCollapseRampasan = null;
        }
      } else {
        // newVal === 'ada'
        const updates: Partial<Perkara> = {};
        if (item.b18_status === 'tidak_ada' && item.ba21_status === 'tidak_ada' && item.ba22_status === 'tidak_ada') {
          updates.b18_status = 'belum_dibuat';
        }
        if (Object.keys(updates).length > 0) {
          this.$emit('update-status', {
            id: item.id,
            updates,
          });
        }
        // Buka collapse rinciannya agar pengguna dapat mengelola sub-dokumen B-18, BA-21, BA-22
        this.activeCollapseRampasan = item.id;
      }
    },
    toggleCollapseRampasan(id: string) {
      this.activeCollapseRampasan = this.activeCollapseRampasan === id ? null : id;
    },
    handleSubDocUpdate(item: Perkara, payload: { field: string; value: string }) {
      this.$emit('update-status', {
        id: item.id,
        updates: {
          [payload.field]: payload.value as DocumentStatus,
        },
      });
    },
    handleBA20StatusChange(item: Perkara, newVal: string) {
      this.$emit('update-status', {
        id: item.id,
        updates: {
          ba20_status: newVal as 'tidak_ada' | 'ada',
        },
      });

      if (newVal === 'tidak_ada' && this.activeCollapseBA20 === item.id) {
        this.activeCollapseBA20 = null;
      } else if (newVal === 'ada') {
        // Auto-open recipients collapse so user can easily manage recipients
        this.activeCollapseBA20 = item.id;
      }
    },
    toggleCollapseBA20(id: string) {
      this.activeCollapseBA20 = this.activeCollapseBA20 === id ? null : id;
    },
    handleSingleStatusChange(item: Perkara, fieldName: keyof Perkara, newVal: string) {
      this.$emit('update-status', {
        id: item.id,
        updates: {
          [fieldName]: newVal as DocumentStatus,
        },
      });
    },
  },
};
</script>
