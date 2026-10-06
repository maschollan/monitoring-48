import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'monitoring_p48_supabase_url';
const STORAGE_KEY_ANON = 'monitoring_p48_supabase_anon';

export function getStoredSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localAnon = localStorage.getItem(STORAGE_KEY_ANON) || '';

  return {
    url: localUrl || envUrl,
    anonKey: localAnon || envAnon,
    isCustom: !!(localUrl || localAnon),
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  if (url && anonKey) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
  reinitSupabaseClient();
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    const config = getStoredSupabaseConfig();
    if (config.url && config.anonKey && config.url.startsWith('http')) {
      try {
        supabaseInstance = createClient(config.url, config.anonKey);
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
        supabaseInstance = null;
      }
    }
  }
  return supabaseInstance;
}

export function reinitSupabaseClient() {
  supabaseInstance = null;
  return getSupabase();
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'URL dan Anon Key wajib diisi.' };
    }
    const testClient = createClient(url.trim(), anonKey.trim());
    const { error } = await testClient.from('perkara').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Terhubung ke Supabase! Namun tabel "perkara" belum dibuat. Silakan salin & jalankan SQL Schema di Supabase SQL Editor.',
        };
      }
      return { success: false, message: `Koneksi gagal: ${error.message}` };
    }
    return { success: true, message: 'Koneksi ke database Supabase berhasil & tabel perkara terdeteksi!' };
  } catch (err: any) {
    return { success: false, message: `Gagal menghubungkan: ${err.message || err}` };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- SCHEMA MONITORING PERKARA & DOKUMEN P-48
-- ==========================================

-- 1. Tabel Perkara
CREATE TABLE IF NOT EXISTS public.perkara (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_surat TEXT NOT NULL,
    tgl_surat TEXT NOT NULL,
    nomor_register_perkara TEXT NOT NULL UNIQUE,
    nama_terpidana TEXT NOT NULL,
    b18_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (b18_status IN ('tidak_ada', 'belum_dibuat', 'sudah_dibuat')),
    ba21_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (ba21_status IN ('tidak_ada', 'belum_dibuat', 'sudah_dibuat')),
    ba22_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (ba22_status IN ('tidak_ada', 'belum_dibuat', 'sudah_dibuat')),
    ba23_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (ba23_status IN ('tidak_ada', 'belum_dibuat', 'sudah_dibuat')),
    pendapat_hukum_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (pendapat_hukum_status IN ('tidak_ada', 'belum_dibuat', 'sudah_dibuat')),
    ba20_status TEXT NOT NULL DEFAULT 'tidak_ada' 
        CHECK (ba20_status IN ('tidak_ada', 'ada')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabel Penerima BA-20
CREATE TABLE IF NOT EXISTS public.ba20_penerima (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perkara_id UUID NOT NULL REFERENCES public.perkara(id) ON DELETE CASCADE,
    nama_penerima TEXT NOT NULL,
    status_ba20 TEXT NOT NULL DEFAULT 'belum_dibuat' 
        CHECK (status_ba20 IN ('belum_dibuat', 'sudah_dibuat')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_perkara_register ON public.perkara(nomor_register_perkara);
CREATE INDEX IF NOT EXISTS idx_ba20_perkara_id ON public.ba20_penerima(perkara_id);

-- 4. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.perkara ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ba20_penerima ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses publik perkara" ON public.perkara
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Akses publik ba20_penerima" ON public.ba20_penerima
    FOR ALL USING (true) WITH CHECK (true);
`;
