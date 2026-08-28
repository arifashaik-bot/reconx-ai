import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { ParsedFileResult, SourceType } from '../types/index.js';
import { ColumnMapperService } from './columnMapper.service.js';

export class FileParserService {
  public static parseFile(
    fileBuffer: Buffer,
    fileName: string,
    sourceType: SourceType
  ): ParsedFileResult {
    const ext = fileName.split('.').pop()?.toLowerCase();
    let fileType: 'CSV' | 'XLSX' | 'XLS' = 'CSV';

    if (ext === 'xlsx') {
      fileType = 'XLSX';
    } else if (ext === 'xls') {
      fileType = 'XLS';
    } else if (ext === 'csv') {
      fileType = 'CSV';
    } else {
      throw new Error(`Unsupported file extension: .${ext}. Please upload a CSV, XLSX, or XLS file.`);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error(`The uploaded file "${fileName}" is empty (0 bytes).`);
    }

    let rows: Record<string, any>[] = [];
    let headers: string[] = [];

    if (fileType === 'CSV') {
      const content = fileBuffer.toString('utf-8');
      if (!content.trim()) {
        throw new Error(`The uploaded CSV file "${fileName}" contains no content.`);
      }

      try {
        const records = parse(content, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
          bom: true,
        }) as Record<string, any>[];

        if (!records || records.length === 0) {
          throw new Error(`The CSV file "${fileName}" has no valid transaction rows.`);
        }

        rows = records;
        headers = Object.keys(records[0] || {});
      } catch (err: any) {
        throw new Error(`Failed to parse CSV file "${fileName}": ${err.message || 'Invalid format'}`);
      }
    } else {
      // XLSX or XLS
      try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error(`The Excel file "${fileName}" contains no sheets.`);
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          throw new Error(`Sheet "${sheetName}" is empty.`);
        }

        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
          raw: false,
          defval: '',
          blankrows: false,
        });

        if (!rawJson || rawJson.length === 0) {
          throw new Error(`The Excel sheet "${sheetName}" has no data rows.`);
        }

        rows = rawJson;
        headers = Object.keys(rawJson[0] || {});
      } catch (err: any) {
        throw new Error(`Failed to parse Excel file "${fileName}": ${err.message || 'Corrupt or unreadable format'}`);
      }
    }

    if (headers.length === 0) {
      throw new Error(`No column headers detected in "${fileName}". Please ensure the first row contains headers.`);
    }

    // Dynamic Column Mapping
    const mapping = ColumnMapperService.detectMapping(sourceType, headers, rows);

    return {
      fileName,
      fileSize: fileBuffer.length,
      fileType,
      headers,
      totalRows: rows.length,
      validRows: rows.length, // Initial count, refined during normalization
      invalidRows: 0,
      rows,
      warnings: mapping.warnings,
      mapping,
    };
  }
}
