import { CSVParseResult, CSVRowData } from '../types';

/**
 * State machine parser for CSV/TXT with semicolon delimiter,
 * supporting quoted fields with multiline text and escaped quotes.
 */
export function parseCSVText(text: string): CSVParseResult {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentCell += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (!inQuotes && char === ';') {
      currentRow.push(currentCell.trim());
      currentCell = '';
      i++;
      continue;
    }

    if (!inQuotes && (char === '\r' || char === '\n')) {
      if (char === '\r' && nextChar === '\n') {
        i += 2;
      } else {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';

      // Ignore entirely empty rows
      const hasContent = currentRow.some((c) => c.length > 0);
      if (hasContent) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    // Regular character
    currentCell += char;
    i++;
  }

  // Push remaining cell & row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  const result: CSVParseResult = {
    valid: [],
    invalid: [],
    duplicates: [],
    totalRows: rows.length,
  };

  if (rows.length === 0) {
    return result;
  }

  // Check header
  let startIndex = 0;
  const firstRow = rows[0].map((c) => c.toLowerCase().replace(/[\s_]+/g, ''));
  const isHeader =
    firstRow.some((c) => c.includes('nomorsurat') || c.includes('surat')) ||
    firstRow.some((c) => c.includes('register') || c.includes('perkara')) ||
    firstRow.some((c) => c.includes('terpidana'));

  if (isHeader) {
    startIndex = 1;
  }

  const seenRegisters = new Map<string, number>(); // register -> index in result.valid

  for (let r = startIndex; r < rows.length; r++) {
    const row = rows[r];
    const rowNumber = r + 1; // 1-indexed

    if (row.length < 4) {
      result.invalid.push({
        rowNumber,
        raw: row.join('; '),
        reason: `Jumlah kolom kurang (${row.length} dari minimal 4 kolom).`,
      });
      continue;
    }

    const nomor_surat = (row[0] || '').trim();
    const tgl_surat = (row[1] || '').trim();
    const nomor_register_perkara = (row[2] || '').trim();
    const nama_terpidana = (row[3] || '').trim();

    // Validation
    const missing: string[] = [];
    if (!nomor_surat) missing.push('Nomor Surat');
    if (!tgl_surat) missing.push('Tanggal Surat');
    if (!nomor_register_perkara) missing.push('Nomor Register Perkara');
    if (!nama_terpidana) missing.push('Nama Terpidana');

    if (missing.length > 0) {
      result.invalid.push({
        rowNumber,
        raw: row.join('; '),
        reason: `Field wajib kosong: ${missing.join(', ')}.`,
      });
      continue;
    }

    // Check internal duplicate in this CSV
    if (seenRegisters.has(nomor_register_perkara)) {
      const prevIdx = seenRegisters.get(nomor_register_perkara)!;
      result.duplicates.push({
        rowNumber,
        nomor_register_perkara,
      });

      // Update with the latest data in CSV as specified in requirement 19
      result.valid[prevIdx] = {
        nomor_surat,
        tgl_surat,
        nomor_register_perkara,
        nama_terpidana,
        rowNumber,
      };
    } else {
      const newIdx = result.valid.length;
      result.valid.push({
        nomor_surat,
        tgl_surat,
        nomor_register_perkara,
        nama_terpidana,
        rowNumber,
      });
      seenRegisters.set(nomor_register_perkara, newIdx);
    }
  }

  return result;
}
