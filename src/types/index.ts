export type DocumentStatus = 'tidak_ada' | 'belum_dibuat' | 'sudah_dibuat';
export type BA20Status = 'tidak_ada' | 'ada';
export type BA20ReceiverStatus = 'belum_dibuat' | 'sudah_dibuat';

export interface BA20Penerima {
  id: string;
  perkara_id: string;
  nama_penerima: string;
  status_ba20: BA20ReceiverStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Perkara {
  id: string;
  nomor_surat: string;
  tgl_surat: string;
  nomor_register_perkara: string;
  nama_terpidana: string;
  b18_status: DocumentStatus;
  ba21_status: DocumentStatus;
  ba22_status: DocumentStatus;
  ba23_status: DocumentStatus;
  pendapat_hukum_status: DocumentStatus;
  ba20_status: BA20Status;
  created_at?: string;
  updated_at?: string;
  penerima?: BA20Penerima[];
}

export interface CSVRowData {
  nomor_surat: string;
  tgl_surat: string;
  nomor_register_perkara: string;
  nama_terpidana: string;
  rowNumber: number;
}

export interface CSVParseResult {
  valid: CSVRowData[];
  invalid: {
    rowNumber: number;
    raw: string;
    reason: string;
  }[];
  duplicates: {
    rowNumber: number;
    nomor_register_perkara: string;
  }[];
  totalRows: number;
}
