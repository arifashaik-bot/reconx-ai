import { v4 as uuidv4 } from 'uuid';
import { CanonicalFinancialRecord, ColumnMappingResult, SourceType } from '../types/index.js';
import { parseFinancialAmount } from '../utils/amountParser.js';
import { parseFinancialDate } from '../utils/dateParser.js';
import { normalizeReference } from '../utils/referenceNormalizer.js';

export interface NormalizationResult {
  records: CanonicalFinancialRecord[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warnings: string[];
}

export class NormalizerService {
  public static normalizeSourceRows(
    sourceType: SourceType,
    rows: Record<string, any>[],
    mapping: ColumnMappingResult
  ): NormalizationResult {
    const records: CanonicalFinancialRecord[] = [];
    let validRows = 0;
    let invalidRows = 0;
    const warnings: string[] = [...(mapping.warnings || [])];

    rows.forEach((row, index) => {
      const rowNumber = index + 1;
      let rawRef = '';
      let normalizedRef = '';
      let amount = 0;
      let direction: 'CREDIT' | 'DEBIT' | 'UNKNOWN' = 'UNKNOWN';
      let date: Date | undefined;
      let rawDate = '';
      let customer: string | undefined;
      let paymentMethod: string | undefined;
      let description: string | undefined;
      let grossAmount: number | undefined;
      let netAmount: number | undefined;
      let fee: number | undefined;
      let tax: number | undefined;
      let runningBalance: number | undefined;

      let isValid = true;
      const errors: string[] = [];

      // 1. Reference Extraction
      if (mapping.referenceCol && row[mapping.referenceCol] !== undefined) {
        rawRef = String(row[mapping.referenceCol] || '').trim();
        normalizedRef = normalizeReference(rawRef);
      }
      if (!normalizedRef) {
        // Search other potential columns for fallback
        for (const [key, val] of Object.entries(row)) {
          if (/^(?:id|txn|ref|order)/i.test(key) && val) {
            rawRef = String(val).trim();
            normalizedRef = normalizeReference(rawRef);
            if (normalizedRef) break;
          }
        }
      }

      if (!normalizedRef) {
        isValid = false;
        errors.push('Missing transaction reference / ID');
      }

      // 2. Amount Extraction
      if (sourceType === 'BANK') {
        let crVal = mapping.creditCol ? row[mapping.creditCol] : undefined;
        let drVal = mapping.debitCol ? row[mapping.debitCol] : undefined;

        let crParsed = crVal !== undefined ? parseFinancialAmount(crVal) : null;
        let drParsed = drVal !== undefined ? parseFinancialAmount(drVal) : null;

        if (crParsed?.isValid && crParsed.value > 0) {
          amount = crParsed.value;
          direction = 'CREDIT';
        } else if (drParsed?.isValid && drParsed.value > 0) {
          amount = drParsed.value;
          direction = 'DEBIT';
        } else if (mapping.amountCol && row[mapping.amountCol] !== undefined) {
          const amtParsed = parseFinancialAmount(row[mapping.amountCol]);
          if (amtParsed.isValid) {
            amount = amtParsed.value;
            direction = amtParsed.direction;
          } else {
            isValid = false;
            errors.push(`Invalid bank amount value: "${amtParsed.raw}" (${amtParsed.error})`);
          }
        } else {
          isValid = false;
          errors.push('No transaction amount found in Credit, Debit, or Amount columns');
        }

        if (mapping.balanceCol && row[mapping.balanceCol] !== undefined) {
          const balParsed = parseFinancialAmount(row[mapping.balanceCol]);
          if (balParsed.isValid) runningBalance = balParsed.value;
        }
      } else if (sourceType === 'SETTLEMENT') {
        // Settlement: capture gross, net, fee, tax
        if (mapping.amountCol && row[mapping.amountCol] !== undefined) {
          const amtParsed = parseFinancialAmount(row[mapping.amountCol]);
          if (amtParsed.isValid) {
            amount = amtParsed.value;
            netAmount = amtParsed.value;
            direction = amtParsed.direction;
          } else {
            isValid = false;
            errors.push(`Invalid settlement amount: "${amtParsed.raw}" (${amtParsed.error})`);
          }
        }

        if (mapping.grossAmountCol && row[mapping.grossAmountCol] !== undefined) {
          const grossParsed = parseFinancialAmount(row[mapping.grossAmountCol]);
          if (grossParsed.isValid) grossAmount = grossParsed.value;
        }

        if (mapping.feeCol && row[mapping.feeCol] !== undefined) {
          const feeParsed = parseFinancialAmount(row[mapping.feeCol]);
          if (feeParsed.isValid) fee = feeParsed.value;
        }

        if (mapping.taxCol && row[mapping.taxCol] !== undefined) {
          const taxParsed = parseFinancialAmount(row[mapping.taxCol]);
          if (taxParsed.isValid) tax = taxParsed.value;
        }

        // If amount was missing but gross and fee exist, calculate net
        if (amount === 0 && grossAmount !== undefined && grossAmount > 0) {
          amount = grossAmount - (fee || 0) - (tax || 0);
          netAmount = amount;
        }
      } else {
        // MERCHANT
        if (mapping.amountCol && row[mapping.amountCol] !== undefined) {
          const amtParsed = parseFinancialAmount(row[mapping.amountCol]);
          if (amtParsed.isValid) {
            amount = amtParsed.value;
            direction = amtParsed.direction;
          } else {
            isValid = false;
            errors.push(`Invalid merchant amount: "${amtParsed.raw}" (${amtParsed.error})`);
          }
        } else if (mapping.grossAmountCol && row[mapping.grossAmountCol] !== undefined) {
          const amtParsed = parseFinancialAmount(row[mapping.grossAmountCol]);
          if (amtParsed.isValid) {
            amount = amtParsed.value;
            direction = amtParsed.direction;
          }
        } else {
          isValid = false;
          errors.push('No merchant sale amount column detected or value missing');
        }

        if (mapping.grossAmountCol && row[mapping.grossAmountCol] !== undefined) {
          const grossParsed = parseFinancialAmount(row[mapping.grossAmountCol]);
          if (grossParsed.isValid) grossAmount = grossParsed.value;
        }
      }

      // 3. Date Extraction
      if (mapping.dateCol && row[mapping.dateCol] !== undefined) {
        rawDate = String(row[mapping.dateCol] || '');
        const dateParsed = parseFinancialDate(row[mapping.dateCol]);
        if (dateParsed.isValid && dateParsed.date) {
          date = dateParsed.date;
        } else {
          isValid = false;
          errors.push(`Invalid date format: "${dateParsed.raw}" (${dateParsed.error})`);
        }
      } else {
        isValid = false;
        errors.push('No date column mapped');
      }

      // 4. Metadata Extraction
      if (mapping.customerCol && row[mapping.customerCol]) {
        customer = String(row[mapping.customerCol]).trim();
      }
      if (mapping.paymentMethodCol && row[mapping.paymentMethodCol]) {
        paymentMethod = String(row[mapping.paymentMethodCol]).trim();
      }
      if (mapping.descriptionCol && row[mapping.descriptionCol]) {
        description = String(row[mapping.descriptionCol]).trim();
      }

      if (isValid) {
        validRows++;
      } else {
        invalidRows++;
      }

      records.push({
        id: uuidv4(),
        sourceType,
        rowNumber,
        rawReference: rawRef,
        normalizedReference: normalizedRef,
        amount: Math.round(amount * 100) / 100,
        direction,
        date: date || new Date(0),
        rawDate,
        customer,
        paymentMethod,
        description,
        grossAmount,
        netAmount,
        fee,
        tax,
        runningBalance,
        rawData: row,
        isValid,
        validationError: errors.length > 0 ? errors.join('; ') : undefined,
      });
    });

    return {
      records,
      totalRows: rows.length,
      validRows,
      invalidRows,
      warnings,
    };
  }
}
