import { BA20Penerima, BA20ReceiverStatus, BA20Status, CSVRowData, DocumentStatus, Perkara } from '../types';
import { getSupabase } from './supabase';

const LOCAL_STORAGE_PERKARA = 'monitoring_p48_perkara_data';
const LOCAL_STORAGE_PENERIMA = 'monitoring_p48_penerima_data';

// Initial sample data conforming to Indonesian prosecution (Kejaksaan) document standards
const INITIAL_PERKARA_SEED: Perkara[] = [
  {
    id: 'perkara-001',
    nomor_surat: 'Print-1234/M.3.14/Eoh.3/10/2026',
    tgl_surat: '2026-10-05',
    nomor_register_perkara: 'PDM-20/PKRTO/Enz.2/04/2026',
    nama_terpidana: 'KHALID AZIZ FATHURRAHMAN HIDAYATULLOH Alias BREKELE Bin SOPARI',
    b18_status: 'sudah_dibuat',
    ba21_status: 'sudah_dibuat',
    ba22_status: 'belum_dibuat',
    ba23_status: 'belum_dibuat',
    pendapat_hukum_status: 'sudah_dibuat',
    ba20_status: 'ada',
    created_at: new Date('2026-10-01T08:00:00Z').toISOString(),
  },
  {
    id: 'perkara-002',
    nomor_surat: 'Print-892/M.3.14/Eoh.3/09/2026',
    tgl_surat: '2026-09-28',
    nomor_register_perkara: 'PDM-15/PKRTO/Enz.2/03/2026',
    nama_terpidana: '1. LEEROY DIAN TANJAYA\n2. AHMAD WAHYUDI',
    b18_status: 'tidak_ada',
    ba21_status: 'tidak_ada',
    ba22_status: 'tidak_ada',
    ba23_status: 'sudah_dibuat',
    pendapat_hukum_status: 'tidak_ada',
    ba20_status: 'tidak_ada',
    created_at: new Date('2026-09-28T09:30:00Z').toISOString(),
  },
  {
    id: 'perkara-003',
    nomor_surat: 'Print-755/M.3.14/Eoh.3/08/2026',
    tgl_surat: '2026-08-15',
    nomor_register_perkara: 'PDM-08/PKRTO/Enz.2/02/2026',
    nama_terpidana: 'BAMBANG HERMANTO Bin SOEDARMO',
    b18_status: 'belum_dibuat',
    ba21_status: 'belum_dibuat',
    ba22_status: 'belum_dibuat',
    ba23_status: 'tidak_ada',
    pendapat_hukum_status: 'belum_dibuat',
    ba20_status: 'ada',
    created_at: new Date('2026-08-15T11:00:00Z').toISOString(),
  },
];

const INITIAL_PENERIMA_SEED: BA20Penerima[] = [
  {
    id: 'penerima-001',
    perkara_id: 'perkara-001',
    nama_penerima: 'Ahmad Fauzi (Korban Kepemilikan BPKB)',
    status_ba20: 'sudah_dibuat',
  },
  {
    id: 'penerima-002',
    perkara_id: 'perkara-001',
    nama_penerima: 'Budi Santoso (Pemilik Sepeda Motor)',
    status_ba20: 'belum_dibuat',
  },
  {
    id: 'penerima-003',
    perkara_id: 'perkara-003',
    nama_penerima: 'Citra Dewi (Saksi Korban)',
    status_ba20: 'sudah_dibuat',
  },
];

// --- LOCAL STORAGE HELPERS ---
function getLocalPerkara(): Perkara[] {
  const raw = localStorage.getItem(LOCAL_STORAGE_PERKARA);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_PERKARA, JSON.stringify(INITIAL_PERKARA_SEED));
    localStorage.setItem(LOCAL_STORAGE_PENERIMA, JSON.stringify(INITIAL_PENERIMA_SEED));
    return INITIAL_PERKARA_SEED;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalPerkara(list: Perkara[]) {
  localStorage.setItem(LOCAL_STORAGE_PERKARA, JSON.stringify(list));
}

function getLocalPenerima(): BA20Penerima[] {
  const raw = localStorage.getItem(LOCAL_STORAGE_PENERIMA);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_PENERIMA, JSON.stringify(INITIAL_PENERIMA_SEED));
    return INITIAL_PENERIMA_SEED;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalPenerima(list: BA20Penerima[]) {
  localStorage.setItem(LOCAL_STORAGE_PENERIMA, JSON.stringify(list));
}

// --- MAIN SERVICE CLASS ---
export class PerkaraService {
  /**
   * Fetch all perkara with related BA-20 recipients
   */
  static async getAllPerkara(): Promise<Perkara[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('perkara')
          .select('*, penerima:ba20_penerima(*)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            penerima: item.penerima || [],
          }));
        }
        console.warn('Supabase fetch returned error, falling back to local store:', error?.message);
      } catch (err) {
        console.warn('Supabase request failed, falling back to local store:', err);
      }
    }

    // Local Storage Fallback
    const perkaraList = getLocalPerkara();
    const penerimaList = getLocalPenerima();

    return perkaraList.map((p) => ({
      ...p,
      penerima: penerimaList.filter((rc) => rc.perkara_id === p.id),
    }));
  }

  /**
   * Check if a nomor_register_perkara is already registered
   */
  static async checkRegisterExists(nomorRegister: string, excludeId?: string): Promise<boolean> {
    const cleanReg = nomorRegister.trim();
    const supabase = getSupabase();

    if (supabase) {
      try {
        let query = supabase.from('perkara').select('id').eq('nomor_register_perkara', cleanReg);
        if (excludeId) {
          query = query.neq('id', excludeId);
        }
        const { data } = await query;
        return !!(data && data.length > 0);
      } catch (err) {
        console.warn('Register check failed on Supabase:', err);
      }
    }

    const localList = getLocalPerkara();
    return localList.some((p) => p.nomor_register_perkara.toLowerCase() === cleanReg.toLowerCase() && p.id !== excludeId);
  }

  /**
   * Create new manual Perkara
   */
  static async createPerkara(input: {
    nomor_surat: string;
    tgl_surat: string;
    nomor_register_perkara: string;
    nama_terpidana: string;
  }): Promise<Perkara> {
    const isExists = await this.checkRegisterExists(input.nomor_register_perkara);
    if (isExists) {
      throw new Error('Nomor register perkara sudah terdaftar.');
    }

    const newPerkara: Perkara = {
      id: crypto.randomUUID ? crypto.randomUUID() : `perkara-${Date.now()}`,
      nomor_surat: input.nomor_surat.trim(),
      tgl_surat: input.tgl_surat.trim(),
      nomor_register_perkara: input.nomor_register_perkara.trim(),
      nama_terpidana: input.nama_terpidana.trim(),
      b18_status: 'tidak_ada',
      ba21_status: 'tidak_ada',
      ba22_status: 'tidak_ada',
      ba23_status: 'tidak_ada',
      pendapat_hukum_status: 'tidak_ada',
      ba20_status: 'tidak_ada',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      penerima: [],
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('perkara').insert([newPerkara]).select().single();
        if (error) {
          throw new Error(error.message);
        }
        return { ...data, penerima: [] };
      } catch (err: any) {
        console.warn('Supabase create failed, saving to local store:', err.message);
      }
    }

    const localList = getLocalPerkara();
    localList.unshift(newPerkara);
    saveLocalPerkara(localList);
    return newPerkara;
  }

  /**
   * Update Perkara info (nomor_surat, tgl_surat, nomor_register_perkara, nama_terpidana)
   */
  static async updatePerkara(
    id: string,
    input: {
      nomor_surat: string;
      tgl_surat: string;
      nomor_register_perkara: string;
      nama_terpidana: string;
    }
  ): Promise<void> {
    const isExists = await this.checkRegisterExists(input.nomor_register_perkara, id);
    if (isExists) {
      throw new Error('Nomor register perkara sudah terdaftar pada perkara lain.');
    }

    const payload = {
      nomor_surat: input.nomor_surat.trim(),
      tgl_surat: input.tgl_surat.trim(),
      nomor_register_perkara: input.nomor_register_perkara.trim(),
      nama_terpidana: input.nama_terpidana.trim(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('perkara').update(payload).eq('id', id);
        if (error) throw new Error(error.message);
        return;
      } catch (err: any) {
        console.warn('Supabase update failed, saving local:', err.message);
      }
    }

    const list = getLocalPerkara();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...payload };
      saveLocalPerkara(list);
    }
  }

  /**
   * Update single or multiple document status fields
   */
  static async updateStatus(
    id: string,
    updates: Partial<Pick<Perkara, 'b18_status' | 'ba21_status' | 'ba22_status' | 'ba23_status' | 'pendapat_hukum_status' | 'ba20_status'>>
  ): Promise<void> {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('perkara').update(payload).eq('id', id);
        if (error) throw new Error(error.message);
        return;
      } catch (err: any) {
        console.warn('Supabase status update error:', err.message);
      }
    }

    const list = getLocalPerkara();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...payload };
      saveLocalPerkara(list);
    }
  }

  /**
   * Delete Perkara and cascading recipients
   */
  static async deletePerkara(id: string): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('perkara').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return;
      } catch (err: any) {
        console.warn('Supabase delete error:', err.message);
      }
    }

    const list = getLocalPerkara();
    const filtered = list.filter((p) => p.id !== id);
    saveLocalPerkara(filtered);

    // Cascade delete penerima
    const penerimaList = getLocalPenerima();
    const filteredPenerima = penerimaList.filter((rc) => rc.perkara_id !== id);
    saveLocalPenerima(filteredPenerima);
  }

  /**
   * UPSERT Mechanism for CSV Import:
   * Rule:
   * - If nomor_register_perkara does NOT exist: Create new record with default statuses.
   * - If nomor_register_perkara exists: Update nomor_surat, tgl_surat, nama_terpidana.
   * - CRITICAL: Never overwrite or reset existing document statuses or BA-20 recipients!
   */
  static async upsertFromCSV(rows: CSVRowData[]): Promise<{ inserted: number; updated: number }> {
    let insertedCount = 0;
    let updatedCount = 0;

    const supabase = getSupabase();

    if (supabase) {
      try {
        // Query existing register numbers
        const registers = rows.map((r) => r.nomor_register_perkara);
        const { data: existingPerkara } = await supabase
          .from('perkara')
          .select('id, nomor_register_perkara')
          .in('nomor_register_perkara', registers);

        const existingMap = new Map<string, string>(); // register -> id
        if (existingPerkara) {
          existingPerkara.forEach((p: any) => {
            existingMap.set(p.nomor_register_perkara, p.id);
          });
        }

        const toInsert: any[] = [];
        const toUpdate: { id: string; payload: any }[] = [];

        for (const row of rows) {
          if (existingMap.has(row.nomor_register_perkara)) {
            const existingId = existingMap.get(row.nomor_register_perkara)!;
            toUpdate.push({
              id: existingId,
              payload: {
                nomor_surat: row.nomor_surat,
                tgl_surat: row.tgl_surat,
                nama_terpidana: row.nama_terpidana,
                updated_at: new Date().toISOString(),
              },
            });
          } else {
            toInsert.push({
              nomor_surat: row.nomor_surat,
              tgl_surat: row.tgl_surat,
              nomor_register_perkara: row.nomor_register_perkara,
              nama_terpidana: row.nama_terpidana,
              b18_status: 'tidak_ada',
              ba21_status: 'tidak_ada',
              ba22_status: 'tidak_ada',
              ba23_status: 'tidak_ada',
              pendapat_hukum_status: 'tidak_ada',
              ba20_status: 'tidak_ada',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }

        // Perform bulk insert
        if (toInsert.length > 0) {
          const { error: insErr } = await supabase.from('perkara').insert(toInsert);
          if (insErr) throw insErr;
          insertedCount = toInsert.length;
        }

        // Perform updates preserving document statuses
        for (const upd of toUpdate) {
          await supabase.from('perkara').update(upd.payload).eq('id', upd.id);
        }
        updatedCount = toUpdate.length;

        return { inserted: insertedCount, updated: updatedCount };
      } catch (err) {
        console.warn('Supabase upsert failed, executing local fallback upsert:', err);
      }
    }

    // Local fallback upsert
    const list = getLocalPerkara();
    const existingMap = new Map<string, number>();
    list.forEach((p, index) => {
      existingMap.set(p.nomor_register_perkara, index);
    });

    for (const row of rows) {
      if (existingMap.has(row.nomor_register_perkara)) {
        const idx = existingMap.get(row.nomor_register_perkara)!;
        list[idx].nomor_surat = row.nomor_surat;
        list[idx].tgl_surat = row.tgl_surat;
        list[idx].nama_terpidana = row.nama_terpidana;
        list[idx].updated_at = new Date().toISOString();
        updatedCount++;
      } else {
        const newRecord: Perkara = {
          id: crypto.randomUUID ? crypto.randomUUID() : `perkara-${Date.now()}-${Math.random()}`,
          nomor_surat: row.nomor_surat,
          tgl_surat: row.tgl_surat,
          nomor_register_perkara: row.nomor_register_perkara,
          nama_terpidana: row.nama_terpidana,
          b18_status: 'tidak_ada',
          ba21_status: 'tidak_ada',
          ba22_status: 'tidak_ada',
          ba23_status: 'tidak_ada',
          pendapat_hukum_status: 'tidak_ada',
          ba20_status: 'tidak_ada',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        list.unshift(newRecord);
        existingMap.set(row.nomor_register_perkara, 0);
        insertedCount++;
      }
    }

    saveLocalPerkara(list);
    return { inserted: insertedCount, updated: updatedCount };
  }

  // --- BA-20 RECIPIENTS MANAGEMENT ---
  static async addPenerima(perkaraId: string, namaPenerima: string, statusBa20: BA20ReceiverStatus): Promise<BA20Penerima> {
    const item: BA20Penerima = {
      id: crypto.randomUUID ? crypto.randomUUID() : `penerima-${Date.now()}`,
      perkara_id: perkaraId,
      nama_penerima: namaPenerima.trim(),
      status_ba20: statusBa20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('ba20_penerima').insert([item]).select().single();
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.warn('Supabase addPenerima error, saving local:', err.message);
      }
    }

    const list = getLocalPenerima();
    list.push(item);
    saveLocalPenerima(list);
    return item;
  }

  static async updatePenerima(id: string, updates: Partial<Pick<BA20Penerima, 'nama_penerima' | 'status_ba20'>>): Promise<void> {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('ba20_penerima').update(payload).eq('id', id);
        if (error) throw error;
        return;
      } catch (err: any) {
        console.warn('Supabase updatePenerima error, updating local:', err.message);
      }
    }

    const list = getLocalPenerima();
    const idx = list.findIndex((r) => r.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...payload };
      saveLocalPenerima(list);
    }
  }

  static async deletePenerima(id: string): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('ba20_penerima').delete().eq('id', id);
        if (error) throw error;
        return;
      } catch (err: any) {
        console.warn('Supabase deletePenerima error, deleting local:', err.message);
      }
    }

    const list = getLocalPenerima();
    const filtered = list.filter((r) => r.id !== id);
    saveLocalPenerima(filtered);
  }
}
