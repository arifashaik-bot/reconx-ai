import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CanonicalFinancialRecord, ReconciliationConfig } from '../types/index.js';
import { AuditService } from './auditService.js';
import { ReconciliationEngine } from './reconciliationEngine.js';
import { SettlementAnalyticsService } from './settlementAnalytics.js';

export class DemoDataGeneratorService {
  private static prisma = new PrismaClient();

  public static async generateDemoRun(): Promise<string> {
    const runId = uuidv4();
    const runName = 'Demo Data — Synthetic Run (Q3 Financial Health)';
    const config: ReconciliationConfig = {
      amountTolerance: 0.01,
      dateToleranceDays: 3,
      sensitivity: 'balanced',
    };

    const baseDate = new Date('2026-08-15T10:00:00Z');

    // 1. Synthetic Bank Records
    const bankRecords: CanonicalFinancialRecord[] = [
      // Case 1: Exact match ($1,450.00)
      {
        id: uuidv4(),
        sourceType: 'BANK',
        rowNumber: 1,
        rawReference: 'TXN-90210',
        normalizedReference: 'TXN-90210',
        amount: 1450.00,
        direction: 'CREDIT',
        date: new Date('2026-08-15T12:30:00Z'),
        rawDate: '2026-08-15',
        description: 'ACH CR STRIPE PAYOUT TXN-90210',
        rawData: { 'Date': '2026-08-15', 'Reference': 'TXN-90210', 'Credit': '1,450.00', 'Balance': '45,200.00', 'Description': 'ACH CR STRIPE' },
        isValid: true,
      },
      // Case 2: Exact match with Fee ($850.00)
      {
        id: uuidv4(),
        sourceType: 'BANK',
        rowNumber: 2,
        rawReference: 'ORD-88192',
        normalizedReference: 'ORD-88192',
        amount: 850.00,
        direction: 'CREDIT',
        date: new Date('2026-08-16T14:10:00Z'),
        rawDate: '2026-08-16',
        description: 'DEPOSIT RAZORPAY ORD-88192',
        rawData: { 'Date': '2026-08-16', 'Reference': 'ORD-88192', 'Credit': '850.00', 'Balance': '46,050.00' },
        isValid: true,
      },
      // Case 3: Amount Mismatch (Bank: $420.00 vs Merchant: $450.00)
      {
        id: uuidv4(),
        sourceType: 'BANK',
        rowNumber: 3,
        rawReference: 'TXN-77401',
        normalizedReference: 'TXN-77401',
        amount: 420.00,
        direction: 'CREDIT',
        date: new Date('2026-08-17T09:15:00Z'),
        rawDate: '2026-08-17',
        description: 'SETTLE TXN-77401 MISMATCH',
        rawData: { 'Date': '2026-08-17', 'Reference': 'TXN-77401', 'Credit': '420.00', 'Balance': '46,470.00' },
        isValid: true,
      },
      // Case 4: Missing Settlement (Bank & Merchant match $1,200.00)
      {
        id: uuidv4(),
        sourceType: 'BANK',
        rowNumber: 4,
        rawReference: 'INV-40291',
        normalizedReference: 'INV-40291',
        amount: 1200.00,
        direction: 'CREDIT',
        date: new Date('2026-08-18T11:00:00Z'),
        rawDate: '2026-08-18',
        description: 'DIRECT WIRE INV-40291',
        rawData: { 'Date': '2026-08-18', 'Reference': 'INV-40291', 'Credit': '1,200.00', 'Balance': '47,670.00' },
        isValid: true,
      },
      // Case 5: Timing Discrepancy ($2,100.00, settled 12 days later)
      {
        id: uuidv4(),
        sourceType: 'BANK',
        rowNumber: 5,
        rawReference: 'TXN-65002',
        normalizedReference: 'TXN-65002',
        amount: 2100.00,
        direction: 'CREDIT',
        date: new Date('2026-08-27T16:00:00Z'),
        rawDate: '2026-08-27',
        description: 'LATE PAYOUT TXN-65002',
        rawData: { 'Date': '2026-08-27', 'Reference': 'TXN-65002', 'Credit': '2,100.00', 'Balance': '49,770.00' },
        isValid: true,
      },
      // Case 6: Duplicate in Bank (TXN-99001 appears twice)
      {
        id: uuidv4(),
        sourceType: 'BANK',
        rowNumber: 6,
        rawReference: 'TXN-99001',
        normalizedReference: 'TXN-99001',
        amount: 350.00,
        direction: 'CREDIT',
        date: new Date('2026-08-19T10:00:00Z'),
        rawDate: '2026-08-19',
        description: 'PAYMENT TXN-99001 ENTRY 1',
        rawData: { 'Date': '2026-08-19', 'Reference': 'TXN-99001', 'Credit': '350.00' },
        isValid: true,
      },
      {
        id: uuidv4(),
        sourceType: 'BANK',
        rowNumber: 7,
        rawReference: 'TXN-99001',
        normalizedReference: 'TXN-99001',
        amount: 350.00,
        direction: 'CREDIT',
        date: new Date('2026-08-19T10:05:00Z'),
        rawDate: '2026-08-19',
        description: 'PAYMENT TXN-99001 ENTRY 2 DUPLICATE',
        rawData: { 'Date': '2026-08-19', 'Reference': 'TXN-99001', 'Credit': '350.00' },
        isValid: true,
      },
      // Case 7: Single source bank deposit without merchant order
      {
        id: uuidv4(),
        sourceType: 'BANK',
        rowNumber: 8,
        rawReference: 'BANK-DIRECT-009',
        normalizedReference: 'BANK-DIRECT-009',
        amount: 750.00,
        direction: 'CREDIT',
        date: new Date('2026-08-20T12:00:00Z'),
        rawDate: '2026-08-20',
        description: 'UNKNOWN WIRE DEPOSIT',
        rawData: { 'Date': '2026-08-20', 'Reference': 'BANK-DIRECT-009', 'Credit': '750.00' },
        isValid: true,
      },
    ];

    // 2. Synthetic Merchant Records
    const merchantRecords: CanonicalFinancialRecord[] = [
      // Case 1: Match
      {
        id: uuidv4(),
        sourceType: 'MERCHANT',
        rowNumber: 1,
        rawReference: 'TXN-90210',
        normalizedReference: 'TXN-90210',
        amount: 1450.00,
        direction: 'CREDIT',
        date: new Date('2026-08-15T12:00:00Z'),
        rawDate: '2026-08-15',
        customer: 'Acme Corp',
        paymentMethod: 'Credit Card',
        rawData: { 'Order_ID': 'TXN-90210', 'Sale_Amount': '1450.00', 'Customer': 'Acme Corp', 'Payment_Method': 'Credit Card', 'Date': '2026-08-15' },
        isValid: true,
      },
      // Case 2: Match with Fee
      {
        id: uuidv4(),
        sourceType: 'MERCHANT',
        rowNumber: 2,
        rawReference: 'ORD-88192',
        normalizedReference: 'ORD-88192',
        amount: 850.00,
        direction: 'CREDIT',
        date: new Date('2026-08-16T13:45:00Z'),
        rawDate: '2026-08-16',
        customer: 'Cyberdyne Inc',
        paymentMethod: 'UPI / NetBanking',
        rawData: { 'Order_ID': 'ORD-88192', 'Sale_Amount': '850.00', 'Customer': 'Cyberdyne Inc', 'Date': '2026-08-16' },
        isValid: true,
      },
      // Case 3: Amount Mismatch (Merchant: $450.00)
      {
        id: uuidv4(),
        sourceType: 'MERCHANT',
        rowNumber: 3,
        rawReference: 'TXN-77401',
        normalizedReference: 'TXN-77401',
        amount: 450.00,
        direction: 'CREDIT',
        date: new Date('2026-08-17T09:00:00Z'),
        rawDate: '2026-08-17',
        customer: 'Wayne Enterprises',
        paymentMethod: 'Debit Card',
        rawData: { 'Order_ID': 'TXN-77401', 'Sale_Amount': '450.00', 'Customer': 'Wayne Enterprises', 'Date': '2026-08-17' },
        isValid: true,
      },
      // Case 4: Missing Settlement ($1,200.00)
      {
        id: uuidv4(),
        sourceType: 'MERCHANT',
        rowNumber: 4,
        rawReference: 'INV-40291',
        normalizedReference: 'INV-40291',
        amount: 1200.00,
        direction: 'CREDIT',
        date: new Date('2026-08-18T10:30:00Z'),
        rawDate: '2026-08-18',
        customer: 'Stark Industries',
        paymentMethod: 'Wire Transfer',
        rawData: { 'Order_ID': 'INV-40291', 'Sale_Amount': '1200.00', 'Customer': 'Stark Industries', 'Date': '2026-08-18' },
        isValid: true,
      },
      // Case 5: Timing Discrepancy ($2,100.00, Order date: 2026-08-15)
      {
        id: uuidv4(),
        sourceType: 'MERCHANT',
        rowNumber: 5,
        rawReference: 'TXN-65002',
        normalizedReference: 'TXN-65002',
        amount: 2100.00,
        direction: 'CREDIT',
        date: new Date('2026-08-15T11:00:00Z'),
        rawDate: '2026-08-15',
        customer: 'Massive Dynamic',
        paymentMethod: 'Corporate Card',
        rawData: { 'Order_ID': 'TXN-65002', 'Sale_Amount': '2100.00', 'Customer': 'Massive Dynamic', 'Date': '2026-08-15' },
        isValid: true,
      },
      // Case 6: Duplicate pair matching Merchant
      {
        id: uuidv4(),
        sourceType: 'MERCHANT',
        rowNumber: 6,
        rawReference: 'TXN-99001',
        normalizedReference: 'TXN-99001',
        amount: 350.00,
        direction: 'CREDIT',
        date: new Date('2026-08-19T09:30:00Z'),
        rawDate: '2026-08-19',
        customer: 'Oscorp',
        paymentMethod: 'Credit Card',
        rawData: { 'Order_ID': 'TXN-99001', 'Sale_Amount': '350.00', 'Customer': 'Oscorp', 'Date': '2026-08-19' },
        isValid: true,
      },
      // Case 8: Partial Settlement ($500.00 merchant order)
      {
        id: uuidv4(),
        sourceType: 'MERCHANT',
        rowNumber: 7,
        rawReference: 'ORD-33109',
        normalizedReference: 'ORD-33109',
        amount: 500.00,
        direction: 'CREDIT',
        date: new Date('2026-08-21T15:00:00Z'),
        rawDate: '2026-08-21',
        customer: 'Globex Corp',
        paymentMethod: 'Credit Card',
        rawData: { 'Order_ID': 'ORD-33109', 'Sale_Amount': '500.00', 'Customer': 'Globex Corp', 'Date': '2026-08-21' },
        isValid: true,
      },
    ];

    // 3. Synthetic Settlement Records
    const settlementRecords: CanonicalFinancialRecord[] = [
      // Case 1: Match
      {
        id: uuidv4(),
        sourceType: 'SETTLEMENT',
        rowNumber: 1,
        rawReference: 'TXN-90210',
        normalizedReference: 'TXN-90210',
        amount: 1450.00,
        grossAmount: 1450.00,
        netAmount: 1450.00,
        fee: 0.00,
        direction: 'CREDIT',
        date: new Date('2026-08-15T18:00:00Z'),
        rawDate: '2026-08-15',
        rawData: { 'Settlement_ID': 'TXN-90210', 'Net_Payout': '1450.00', 'Fee': '0.00', 'Date': '2026-08-15' },
        isValid: true,
      },
      // Case 2: Match with standard fee ($850.00 order -> $833.00 net + $17.00 fee)
      {
        id: uuidv4(),
        sourceType: 'SETTLEMENT',
        rowNumber: 2,
        rawReference: 'ORD-88192',
        normalizedReference: 'ORD-88192',
        amount: 833.00,
        grossAmount: 850.00,
        netAmount: 833.00,
        fee: 17.00,
        direction: 'CREDIT',
        date: new Date('2026-08-16T20:00:00Z'),
        rawDate: '2026-08-16',
        rawData: { 'Settlement_ID': 'ORD-88192', 'Gross_Amount': '850.00', 'Net_Payout': '833.00', 'Gateway_Fee': '17.00', 'Date': '2026-08-16' },
        isValid: true,
      },
      // Case 3: Amount Mismatch (Settlement: $420.00)
      {
        id: uuidv4(),
        sourceType: 'SETTLEMENT',
        rowNumber: 3,
        rawReference: 'TXN-77401',
        normalizedReference: 'TXN-77401',
        amount: 420.00,
        grossAmount: 420.00,
        netAmount: 420.00,
        fee: 0.00,
        direction: 'CREDIT',
        date: new Date('2026-08-17T12:00:00Z'),
        rawDate: '2026-08-17',
        rawData: { 'Settlement_ID': 'TXN-77401', 'Net_Payout': '420.00', 'Date': '2026-08-17' },
        isValid: true,
      },
      // Case 5: Timing Discrepancy (Settled 2026-08-27, 12 days late)
      {
        id: uuidv4(),
        sourceType: 'SETTLEMENT',
        rowNumber: 4,
        rawReference: 'TXN-65002',
        normalizedReference: 'TXN-65002',
        amount: 2100.00,
        grossAmount: 2100.00,
        netAmount: 2100.00,
        fee: 0.00,
        direction: 'CREDIT',
        date: new Date('2026-08-27T10:00:00Z'),
        rawDate: '2026-08-27',
        rawData: { 'Settlement_ID': 'TXN-65002', 'Net_Payout': '2100.00', 'Date': '2026-08-27' },
        isValid: true,
      },
      // Case 8: Partial Settlement ($200.00 settled against $500.00 order)
      {
        id: uuidv4(),
        sourceType: 'SETTLEMENT',
        rowNumber: 5,
        rawReference: 'ORD-33109',
        normalizedReference: 'ORD-33109',
        amount: 200.00,
        grossAmount: 200.00,
        netAmount: 200.00,
        fee: 0.00,
        direction: 'CREDIT',
        date: new Date('2026-08-22T08:00:00Z'),
        rawDate: '2026-08-22',
        rawData: { 'Settlement_ID': 'ORD-33109', 'Net_Payout': '200.00', 'Date': '2026-08-22' },
        isValid: true,
      },
    ];

    // Run through the exact reconciliation engine
    const cases = ReconciliationEngine.reconcile(bankRecords, merchantRecords, settlementRecords, config);
    const insights = SettlementAnalyticsService.calculateInsights(cases);

    // Calculate aggregated counts
    let matchedCount = 0;
    let likelyMatchCount = 0;
    let amountMismatchCount = 0;
    let missingCount = 0;
    let missingSettlementCount = 0;
    let duplicateCount = 0;
    let partialSettlementCount = 0;
    let timingDiscrepancyCount = 0;
    let reviewRequiredCount = 0;

    let grossMerchant = 0;
    let grossBank = 0;
    let grossSettlement = 0;
    let netSettlement = 0;
    let totalFees = 0;
    let totalDifference = 0;

    for (const c of cases) {
      if (c.classification === 'MATCHED') matchedCount++;
      else if (c.classification === 'LIKELY_MATCH') likelyMatchCount++;
      else if (c.classification === 'AMOUNT_MISMATCH') amountMismatchCount++;
      else if (c.classification === 'MISSING') missingCount++;
      else if (c.classification === 'MISSING_SETTLEMENT') missingSettlementCount++;
      else if (c.classification === 'DUPLICATE') duplicateCount++;
      else if (c.classification === 'PARTIAL_SETTLEMENT') partialSettlementCount++;
      else if (c.classification === 'TIMING_DISCREPANCY') timingDiscrepancyCount++;
      else if (c.classification === 'REVIEW_REQUIRED') reviewRequiredCount++;

      if (c.merchantRecord) grossMerchant += c.merchantRecord.amount;
      if (c.bankRecord) grossBank += c.bankRecord.amount;
      if (c.settlementRecord) {
        grossSettlement += c.settlementRecord.grossAmount || c.settlementRecord.amount;
        netSettlement += c.settlementRecord.netAmount || c.settlementRecord.amount;
        totalFees += c.settlementRecord.fee || 0;
      }
      totalDifference += c.financialDifference;
    }

    const totalCases = cases.length;
    const matchRate = totalCases > 0 ? Math.round(((matchedCount + likelyMatchCount) / totalCases) * 1000) / 10 : 0;

    // Persist to SQLite
    const createdRun = await this.prisma.reconciliationRun.create({
      data: {
        id: runId,
        name: runName,
        isDemo: true,
        status: 'COMPLETED',
        totalCases,
        matchedCount,
        likelyMatchCount,
        amountMismatchCount,
        missingCount,
        missingSettlementCount,
        duplicateCount,
        partialSettlementCount,
        timingDiscrepancyCount,
        reviewRequiredCount,
        grossMerchantAmount: Math.round(grossMerchant * 100) / 100,
        grossBankAmount: Math.round(grossBank * 100) / 100,
        grossSettlementAmount: Math.round(grossSettlement * 100) / 100,
        netSettlementAmount: Math.round(netSettlement * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        totalDifference: Math.round(totalDifference * 100) / 100,
        matchRate,
        amountTolerance: config.amountTolerance,
        dateToleranceDays: config.dateToleranceDays,
        sensitivity: config.sensitivity,
        summary: `Synthetic demonstration run containing ${totalCases} cases with realistic match, mismatch, duplicate, missing settlement, and timing discrepancy distributions.`,
      },
    });

    // Create FileImports for demo
    const bImport = await this.prisma.fileImport.create({
      data: {
        id: uuidv4(),
        runId,
        sourceType: 'BANK',
        fileName: 'synthetic_bank_statement.csv',
        fileSize: 4096,
        fileType: 'CSV',
        totalRows: bankRecords.length,
        validRows: bankRecords.length,
        invalidRows: 0,
        detectedHeaders: JSON.stringify(['Date', 'Reference', 'Credit', 'Balance', 'Description']),
        columnMappings: JSON.stringify({ referenceCol: 'Reference', amountCol: 'Credit', dateCol: 'Date', balanceCol: 'Balance' }),
      },
    });

    const mImport = await this.prisma.fileImport.create({
      data: {
        id: uuidv4(),
        runId,
        sourceType: 'MERCHANT',
        fileName: 'synthetic_merchant_ledger.csv',
        fileSize: 4096,
        fileType: 'CSV',
        totalRows: merchantRecords.length,
        validRows: merchantRecords.length,
        invalidRows: 0,
        detectedHeaders: JSON.stringify(['Order_ID', 'Sale_Amount', 'Customer', 'Payment_Method', 'Date']),
        columnMappings: JSON.stringify({ referenceCol: 'Order_ID', amountCol: 'Sale_Amount', dateCol: 'Date', customerCol: 'Customer' }),
      },
    });

    const sImport = await this.prisma.fileImport.create({
      data: {
        id: uuidv4(),
        runId,
        sourceType: 'SETTLEMENT',
        fileName: 'synthetic_settlement_report.csv',
        fileSize: 4096,
        fileType: 'CSV',
        totalRows: settlementRecords.length,
        validRows: settlementRecords.length,
        invalidRows: 0,
        detectedHeaders: JSON.stringify(['Settlement_ID', 'Gross_Amount', 'Net_Payout', 'Gateway_Fee', 'Date']),
        columnMappings: JSON.stringify({ referenceCol: 'Settlement_ID', amountCol: 'Net_Payout', grossAmountCol: 'Gross_Amount', feeCol: 'Gateway_Fee', dateCol: 'Date' }),
      },
    });

    // Persist Cases, Source Records, and Exceptions
    let caseIdx = 1;
    for (const c of cases) {
      const caseId = uuidv4();
      const caseNum = `CASE-${String(caseIdx++).padStart(4, '0')}`;
      const primaryRef = c.merchantRecord?.rawReference || c.bankRecord?.rawReference || c.settlementRecord?.rawReference || caseNum;

      const createdCase = await this.prisma.reconciledCase.create({
        data: {
          id: caseId,
          runId,
          caseNumber: caseNum,
          primaryReference: primaryRef,
          classification: c.classification,
          confidenceScore: c.confidenceScore,
          matchingMethod: c.matchingMethod,
          bankAmount: c.bankRecord?.amount,
          merchantAmount: c.merchantRecord?.amount,
          settlementAmount: c.settlementRecord?.amount,
          netSettlementAmount: c.netSettlementAmount,
          feeAmount: c.feeAmount,
          financialDifference: c.financialDifference,
          transactionDate: c.merchantRecord?.date || c.bankRecord?.date,
          settlementDate: c.settlementRecord?.date,
          dateDifferenceDays: c.dateDifferenceDays,
          customer: c.merchantRecord?.customer,
          paymentMethod: c.merchantRecord?.paymentMethod,
          evidence: JSON.stringify(c.evidence),
          explanation: c.explanation,
          recommendedAction: c.recommendedAction,
          status: 'OPEN',
        },
      });

      // Reconciled Source Records
      if (c.bankRecord) {
        await this.prisma.reconciledSourceRecord.create({
          data: {
            id: uuidv4(),
            caseId,
            sourceType: 'BANK',
            rawRecordId: c.bankRecord.id,
            reference: c.bankRecord.rawReference,
            amount: c.bankRecord.amount,
            date: c.bankRecord.date,
            direction: c.bankRecord.direction,
            rawData: JSON.stringify(c.bankRecord.rawData),
          },
        });
      }

      if (c.merchantRecord) {
        await this.prisma.reconciledSourceRecord.create({
          data: {
            id: uuidv4(),
            caseId,
            sourceType: 'MERCHANT',
            rawRecordId: c.merchantRecord.id,
            reference: c.merchantRecord.rawReference,
            amount: c.merchantRecord.amount,
            date: c.merchantRecord.date,
            direction: c.merchantRecord.direction,
            rawData: JSON.stringify(c.merchantRecord.rawData),
          },
        });
      }

      if (c.settlementRecord) {
        await this.prisma.reconciledSourceRecord.create({
          data: {
            id: uuidv4(),
            caseId,
            sourceType: 'SETTLEMENT',
            rawRecordId: c.settlementRecord.id,
            reference: c.settlementRecord.rawReference,
            amount: c.settlementRecord.amount,
            date: c.settlementRecord.date,
            direction: c.settlementRecord.direction,
            rawData: JSON.stringify(c.settlementRecord.rawData),
          },
        });
      }

      // Create Exception Item if not MATCHED or LIKELY_MATCH
      if (c.classification !== 'MATCHED' && c.classification !== 'LIKELY_MATCH') {
        const affected: string[] = [];
        if (c.bankRecord) affected.push('BANK');
        if (c.merchantRecord) affected.push('MERCHANT');
        if (c.settlementRecord) affected.push('SETTLEMENT');

        await this.prisma.exceptionItem.create({
          data: {
            id: uuidv4(),
            caseId,
            runId,
            type: c.classification,
            severity: c.financialDifference > 500 ? 'HIGH' : c.financialDifference > 50 ? 'MEDIUM' : 'LOW',
            affectedSources: affected.join(', ') || 'MULTIPLE',
            difference: c.financialDifference,
            explanation: c.explanation,
            recommendedAction: c.recommendedAction || 'Review discrepancy in transaction details.',
            status: 'OPEN',
          },
        });
      }
    }

    // Persist Settlement Insights
    await this.prisma.settlementInsight.create({
      data: {
        id: uuidv4(),
        runId,
        grossCollections: insights.grossCollections,
        netSettlements: insights.netSettlements,
        totalFees: insights.totalFees,
        totalRefunds: insights.totalRefunds,
        totalAdjustments: insights.totalAdjustments,
        pendingSettlements: insights.pendingSettlements,
        averageDelayDays: insights.averageDelayDays,
        financialExposure: insights.financialExposure,
        delayDistribution: JSON.stringify(insights.delayDistribution),
        feeBreakdown: JSON.stringify(insights.feeBreakdown),
      },
    });

    await AuditService.log('DEMO_STARTED', `Generated synthetic demo reconciliation run with ${totalCases} cases.`, runId);

    return runId;
  }
}
