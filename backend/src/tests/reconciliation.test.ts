import { PrismaClient } from '@prisma/client';
import { ColumnMapperService } from '../services/columnMapper.service.js';
import { DemoDataGeneratorService } from '../services/demoDataGenerator.service.js';
import { FileParserService } from '../services/fileParser.service.js';
import { NormalizerService } from '../services/normalizer.service.js';
import { ReconciliationEngine } from '../services/reconciliationEngine.js';
import { ReportGeneratorService } from '../services/reportGenerator.service.js';
import { parseFinancialAmount } from '../utils/amountParser.js';
import { parseFinancialDate } from '../utils/dateParser.js';
import { normalizeReference } from '../utils/referenceNormalizer.js';

const prisma = new PrismaClient();

describe('RECONX AI — Financial Reconciliation Core Engine Unit & Integration Tests', () => {

  describe('1. Financial Amount Parsing', () => {
    it('should accurately parse standard decimal amounts', () => {
      expect(parseFinancialAmount('1250.00').value).toBe(1250);
      expect(parseFinancialAmount('1,250.50').value).toBe(1250.5);
    });

    it('should parse currency symbols ($ ₹ € £ Rs.) and spaces', () => {
      expect(parseFinancialAmount('$1,250.00').value).toBe(1250);
      expect(parseFinancialAmount('₹1,250.00').value).toBe(1250);
      expect(parseFinancialAmount('Rs. 1,250.00').value).toBe(1250);
      expect(parseFinancialAmount('€1.250,50').value).toBe(1250.5);
      expect(parseFinancialAmount('1 250.00').value).toBe(1250);
    });

    it('should handle accounting parentheses and CR/DR indicators', () => {
      const paren = parseFinancialAmount('(1250.00)');
      expect(paren.value).toBe(1250);
      expect(paren.direction).toBe('DEBIT');

      const cr = parseFinancialAmount('1250.00 CR');
      expect(cr.value).toBe(1250);
      expect(cr.direction).toBe('CREDIT');

      const dr = parseFinancialAmount('1250.00 DR');
      expect(dr.value).toBe(1250);
      expect(dr.direction).toBe('DEBIT');
    });

    it('should strictly reject invalid tokens and NOT silently convert to zero', () => {
      expect(parseFinancialAmount('-').isValid).toBe(false);
      expect(parseFinancialAmount('N/A').isValid).toBe(false);
      expect(parseFinancialAmount('unknown').isValid).toBe(false);
      expect(parseFinancialAmount('').isValid).toBe(false);
      expect(parseFinancialAmount('null').isValid).toBe(false);
    });
  });

  describe('2. Financial Date Parsing', () => {
    it('should parse ISO and various date delimiter formats', () => {
      const iso = parseFinancialDate('2026-08-15');
      expect(iso.isValid).toBe(true);
      expect(iso.date?.getUTCFullYear()).toBe(2026);
      expect(iso.date?.getUTCMonth()).toBe(7); // Aug (0-indexed)

      const slash = parseFinancialDate('15/08/2026');
      expect(slash.isValid).toBe(true);
      expect(slash.date?.getUTCDate()).toBe(15);
    });

    it('should reject invalid date strings', () => {
      expect(parseFinancialDate('N/A').isValid).toBe(false);
      expect(parseFinancialDate('-').isValid).toBe(false);
      expect(parseFinancialDate('not_a_date').isValid).toBe(false);
    });
  });

  describe('3. Reference Normalization', () => {
    it('should normalize prefixes and whitespace without altering ID semantics', () => {
      expect(normalizeReference('#TXN-90210')).toBe('TXN-90210');
      expect(normalizeReference('ref:  ORD-1002 ')).toBe('ORD-1002');
      expect(normalizeReference('txn: 88219-A')).toBe('88219-A');
    });
  });

  describe('4. Dynamic Column Mapping', () => {
    it('should distinguish Bank Credit/Debit and never confuse running balance as transaction amount', () => {
      const headers = ['Posting_Date', 'Bank_Ref', 'Credit_Amount', 'Debit_Amount', 'Running_Balance', 'Remarks'];
      const sampleRows = [
        { Posting_Date: '2026-08-15', Bank_Ref: 'TXN-001', Credit_Amount: '500.00', Debit_Amount: '', Running_Balance: '25,000.00', Remarks: 'Deposit' },
      ];

      const mapping = ColumnMapperService.detectMapping('BANK', headers, sampleRows);
      expect(mapping.creditCol).toBe('Credit_Amount');
      expect(mapping.debitCol).toBe('Debit_Amount');
      expect(mapping.balanceCol).toBe('Running_Balance');
      expect(mapping.amountCol).toBeUndefined();
    });

    it('should dynamically map Merchant sales and Settlement gross/fee/net columns', () => {
      const merchantHeaders = ['Order_Number', 'Collected_Amount', 'Customer_Name', 'Order_Date'];
      const merchantMapping = ColumnMapperService.detectMapping('MERCHANT', merchantHeaders, [
        { Order_Number: 'ORD-991', Collected_Amount: '1200.00', Customer_Name: 'John Doe', Order_Date: '2026-08-15' },
      ]);
      expect(merchantMapping.referenceCol).toBe('Order_Number');
      expect(merchantMapping.amountCol).toBe('Collected_Amount');

      const settlementHeaders = ['Payout_Ref', 'Gross_Value', 'MDR_Fee', 'Net_Settlement', 'Settled_On'];
      const settleMapping = ColumnMapperService.detectMapping('SETTLEMENT', settlementHeaders, [
        { Payout_Ref: 'ORD-991', Gross_Value: '1200.00', MDR_Fee: '24.00', Net_Settlement: '1176.00', Settled_On: '2026-08-16' },
      ]);
      expect(settleMapping.referenceCol).toBe('Payout_Ref');
      expect(settleMapping.grossAmountCol).toBe('Gross_Value');
      expect(settleMapping.feeCol).toBe('MDR_Fee');
      expect(settleMapping.amountCol).toBe('Net_Settlement');
    });
  });

  describe('5. Normalizer & CSV/XLSX Parsing', () => {
    it('should parse CSV content and normalize into canonical financial records', () => {
      const csvData = Buffer.from(
        `Txn_ID,Date,Amount,Customer\nTXN-001,2026-08-15,150.00,Alice\nTXN-002,2026-08-16,300.00,Bob`,
        'utf-8'
      );

      const parsed = FileParserService.parseFile(csvData, 'merchant_orders.csv', 'MERCHANT');
      expect(parsed.totalRows).toBe(2);

      const norm = NormalizerService.normalizeSourceRows('MERCHANT', parsed.rows, parsed.mapping);
      expect(norm.validRows).toBe(2);
      expect(norm.records[0].normalizedReference).toBe('TXN-001');
      expect(norm.records[0].amount).toBe(150);
    });
  });

  describe('6. Multi-Level Reconciliation Engine & 3-Way Cross-Source Grouping', () => {
    const config = { amountTolerance: 0.01, dateToleranceDays: 3, sensitivity: 'balanced' as const };

    it('should reconcile 3 matching sources into ONE case with MATCHED status', () => {
      const bankRecs = [{
        id: 'b1', sourceType: 'BANK' as const, rowNumber: 1, rawReference: 'TXN-100', normalizedReference: 'TXN-100',
        amount: 500.00, direction: 'CREDIT' as const, date: new Date('2026-08-15'), rawDate: '2026-08-15', rawData: {}, isValid: true,
      }];
      const merchantRecs = [{
        id: 'm1', sourceType: 'MERCHANT' as const, rowNumber: 1, rawReference: 'TXN-100', normalizedReference: 'TXN-100',
        amount: 500.00, direction: 'CREDIT' as const, date: new Date('2026-08-15'), rawDate: '2026-08-15', rawData: {}, isValid: true,
      }];
      const settleRecs = [{
        id: 's1', sourceType: 'SETTLEMENT' as const, rowNumber: 1, rawReference: 'TXN-100', normalizedReference: 'TXN-100',
        amount: 500.00, direction: 'CREDIT' as const, date: new Date('2026-08-16'), rawDate: '2026-08-16', rawData: {}, isValid: true,
      }];

      const cases = ReconciliationEngine.reconcile(bankRecs, merchantRecs, settleRecs, config);
      expect(cases.length).toBe(1);
      expect(cases[0].classification).toBe('MATCHED');
      expect(cases[0].confidenceScore).toBeGreaterThanOrEqual(95);
      expect(cases[0].financialDifference).toBe(0);
      expect(cases[0].bankRecord).toBeDefined();
      expect(cases[0].merchantRecord).toBeDefined();
      expect(cases[0].settlementRecord).toBeDefined();
    });

    it('should classify AMOUNT_MISMATCH when identifiers agree but values differ', () => {
      const bankRecs = [{
        id: 'b2', sourceType: 'BANK' as const, rowNumber: 1, rawReference: 'TXN-200', normalizedReference: 'TXN-200',
        amount: 450.00, direction: 'CREDIT' as const, date: new Date('2026-08-15'), rawDate: '2026-08-15', rawData: {}, isValid: true,
      }];
      const merchantRecs = [{
        id: 'm2', sourceType: 'MERCHANT' as const, rowNumber: 1, rawReference: 'TXN-200', normalizedReference: 'TXN-200',
        amount: 500.00, direction: 'CREDIT' as const, date: new Date('2026-08-15'), rawDate: '2026-08-15', rawData: {}, isValid: true,
      }];

      const cases = ReconciliationEngine.reconcile(bankRecs, merchantRecs, [], config);
      expect(cases.length).toBe(1);
      expect(cases[0].classification).toBe('AMOUNT_MISMATCH');
      expect(cases[0].financialDifference).toBe(50);
    });

    it('should classify MISSING_SETTLEMENT when Bank and Merchant match but Settlement is absent', () => {
      const bankRecs = [{
        id: 'b3', sourceType: 'BANK' as const, rowNumber: 1, rawReference: 'TXN-300', normalizedReference: 'TXN-300',
        amount: 750.00, direction: 'CREDIT' as const, date: new Date('2026-08-15'), rawDate: '2026-08-15', rawData: {}, isValid: true,
      }];
      const merchantRecs = [{
        id: 'm3', sourceType: 'MERCHANT' as const, rowNumber: 1, rawReference: 'TXN-300', normalizedReference: 'TXN-300',
        amount: 750.00, direction: 'CREDIT' as const, date: new Date('2026-08-15'), rawDate: '2026-08-15', rawData: {}, isValid: true,
      }];

      const cases = ReconciliationEngine.reconcile(bankRecs, merchantRecs, [], config);
      expect(cases.length).toBe(1);
      expect(cases[0].classification).toBe('MISSING_SETTLEMENT');
      expect(cases[0].settlementRecord).toBeUndefined();
    });

    it('should detect DUPLICATE entries within the same source', () => {
      const bankRecs = [
        {
          id: 'b4a', sourceType: 'BANK' as const, rowNumber: 1, rawReference: 'TXN-400', normalizedReference: 'TXN-400',
          amount: 200.00, direction: 'CREDIT' as const, date: new Date('2026-08-15'), rawDate: '2026-08-15', rawData: {}, isValid: true,
        },
        {
          id: 'b4b', sourceType: 'BANK' as const, rowNumber: 2, rawReference: 'TXN-400', normalizedReference: 'TXN-400',
          amount: 200.00, direction: 'CREDIT' as const, date: new Date('2026-08-15'), rawDate: '2026-08-15', rawData: {}, isValid: true,
        },
      ];

      const cases = ReconciliationEngine.reconcile(bankRecs, [], [], config);
      const duplicateCase = cases.find(c => c.classification === 'DUPLICATE');
      expect(duplicateCase).toBeDefined();
    });

    it('should classify TIMING_DISCREPANCY when settlement date exceeds tolerance', () => {
      const merchantRecs = [{
        id: 'm5', sourceType: 'MERCHANT' as const, rowNumber: 1, rawReference: 'TXN-500', normalizedReference: 'TXN-500',
        amount: 900.00, direction: 'CREDIT' as const, date: new Date('2026-08-01'), rawDate: '2026-08-01', rawData: {}, isValid: true,
      }];
      const bankRecs = [{
        id: 'b5', sourceType: 'BANK' as const, rowNumber: 1, rawReference: 'TXN-500', normalizedReference: 'TXN-500',
        amount: 900.00, direction: 'CREDIT' as const, date: new Date('2026-08-20'), rawDate: '2026-08-20', rawData: {}, isValid: true,
      }];
      const settleRecs = [{
        id: 's5', sourceType: 'SETTLEMENT' as const, rowNumber: 1, rawReference: 'TXN-500', normalizedReference: 'TXN-500',
        amount: 900.00, direction: 'CREDIT' as const, date: new Date('2026-08-20'), rawDate: '2026-08-20', rawData: {}, isValid: true,
      }];

      const cases = ReconciliationEngine.reconcile(bankRecs, merchantRecs, settleRecs, { ...config, dateToleranceDays: 3 });
      expect(cases[0].classification).toBe('TIMING_DISCREPANCY');
      expect(cases[0].dateDifferenceDays).toBeGreaterThan(3);
    });
  });

  describe('7. Synthetic Demo Run Generation & Isolation', () => {
    it('should generate an isolated synthetic demo run in SQLite database', async () => {
      const runId = await DemoDataGeneratorService.generateDemoRun();
      expect(runId).toBeDefined();

      const run = await prisma.reconciliationRun.findUnique({
        where: { id: runId },
        include: { cases: true, exceptions: true, settlementInsights: true },
      });

      expect(run).toBeDefined();
      expect(run?.isDemo).toBe(true);
      expect(run?.totalCases).toBeGreaterThan(0);
      expect(run?.cases.length).toBe(run?.totalCases);
      expect(run?.exceptions.length).toBeGreaterThan(0);
      expect(run?.settlementInsights.length).toBe(1);
    });
  });

  describe('8. Multi-Format Report Generation', () => {
    it('should generate CSV, XLSX, and HTML reports from real database data', async () => {
      const runId = await DemoDataGeneratorService.generateDemoRun();

      const csvReport = await ReportGeneratorService.generateReport(runId, 'reconciliation', 'csv');
      expect(csvReport.contentType).toBe('text/csv');
      expect(typeof csvReport.data).toBe('string');
      expect(csvReport.data).toContain('Case Number');

      const xlsxReport = await ReportGeneratorService.generateReport(runId, 'exceptions', 'xlsx');
      expect(xlsxReport.contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(Buffer.isBuffer(xlsxReport.data)).toBe(true);

      const htmlReport = await ReportGeneratorService.generateReport(runId, 'settlements', 'html');
      expect(htmlReport.contentType).toBe('text/html');
      expect(typeof htmlReport.data).toBe('string');
      expect(htmlReport.data).toContain('<!DOCTYPE html>');
    });
  });
});
