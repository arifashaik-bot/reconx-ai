import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../services/auditService.js';
import { FileParserService } from '../services/fileParser.service.js';
import { NormalizerService } from '../services/normalizer.service.js';
import { ReconciliationEngine } from '../services/reconciliationEngine.js';
import { SettlementAnalyticsService } from '../services/settlementAnalytics.js';
import { ColumnMappingResult, ReconciliationConfig } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post(
  '/run',
  upload.fields([
    { name: 'bankFile', maxCount: 1 },
    { name: 'merchantFile', maxCount: 1 },
    { name: 'settlementFile', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const bankFile = files?.bankFile?.[0];
      const merchantFile = files?.merchantFile?.[0];
      const settlementFile = files?.settlementFile?.[0];

      if (!bankFile || !merchantFile || !settlementFile) {
        return res.status(400).json({
          error: 'Three independent financial files are required: Bank Statement, Merchant Ledger, and Payment Settlement Report.',
        });
      }

      // Optional manual mapping overrides passed in body
      let bankMappingOverride: ColumnMappingResult | undefined;
      let merchantMappingOverride: ColumnMappingResult | undefined;
      let settlementMappingOverride: ColumnMappingResult | undefined;

      if (req.body.bankMapping) {
        try { bankMappingOverride = JSON.parse(req.body.bankMapping); } catch (_) {}
      }
      if (req.body.merchantMapping) {
        try { merchantMappingOverride = JSON.parse(req.body.merchantMapping); } catch (_) {}
      }
      if (req.body.settlementMapping) {
        try { settlementMappingOverride = JSON.parse(req.body.settlementMapping); } catch (_) {}
      }

      const amountTolerance = req.body.amountTolerance ? parseFloat(req.body.amountTolerance) : 0.01;
      const dateToleranceDays = req.body.dateToleranceDays ? parseInt(req.body.dateToleranceDays, 10) : 3;
      const sensitivity = req.body.sensitivity || 'balanced';

      const config: ReconciliationConfig = {
        amountTolerance: isNaN(amountTolerance) ? 0.01 : amountTolerance,
        dateToleranceDays: isNaN(dateToleranceDays) ? 3 : dateToleranceDays,
        sensitivity,
      };

      const runId = uuidv4();
      const runName = req.body.runName || `Reconciliation Run — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

      await AuditService.log('RECON_STARTED', `Started reconciliation run "${runName}". Files: Bank (${bankFile.originalname}), Merchant (${merchantFile.originalname}), Settlement (${settlementFile.originalname}).`, runId);

      // Step 1: Parse Files
      const parsedBank = FileParserService.parseFile(bankFile.buffer, bankFile.originalname, 'BANK');
      const parsedMerchant = FileParserService.parseFile(merchantFile.buffer, merchantFile.originalname, 'MERCHANT');
      const parsedSettlement = FileParserService.parseFile(settlementFile.buffer, settlementFile.originalname, 'SETTLEMENT');

      const finalBankMapping = bankMappingOverride || parsedBank.mapping;
      const finalMerchantMapping = merchantMappingOverride || parsedMerchant.mapping;
      const finalSettlementMapping = settlementMappingOverride || parsedSettlement.mapping;

      // Step 2: Normalize
      const normBank = NormalizerService.normalizeSourceRows('BANK', parsedBank.rows, finalBankMapping);
      const normMerchant = NormalizerService.normalizeSourceRows('MERCHANT', parsedMerchant.rows, finalMerchantMapping);
      const normSettlement = NormalizerService.normalizeSourceRows('SETTLEMENT', parsedSettlement.rows, finalSettlementMapping);

      // Section 52 Rule: If any required source has 0 usable valid rows, abort reconciliation with actionable diagnostics
      const checkSourceValidity = (sourceName: string, normResult: any, parsedResult: any, mapping: any) => {
        if (normResult.validRows === 0) {
          const sampleErrors = normResult.records.filter((r: any) => !r.isValid).slice(0, 3).map((r: any) => r.validationError);
          return {
            failedSource: sourceName,
            totalRows: normResult.totalRows,
            detectedHeaders: parsedResult.headers,
            mappingUsed: mapping,
            reasons: sampleErrors.length > 0 ? sampleErrors : ['No rows met financial validity requirements (missing valid amount, date, or reference).'],
          };
        }
        return null;
      };

      const bankFailure = checkSourceValidity('Bank Statement', normBank, parsedBank, finalBankMapping);
      const merchantFailure = checkSourceValidity('Merchant Ledger', normMerchant, parsedMerchant, finalMerchantMapping);
      const settlementFailure = checkSourceValidity('Settlement Report', normSettlement, parsedSettlement, finalSettlementMapping);

      const sourceFailure = bankFailure || merchantFailure || settlementFailure;
      if (sourceFailure) {
        return res.status(400).json({
          error: `Reconciliation aborted: Source "${sourceFailure.failedSource}" contains 0 valid financial rows.`,
          diagnostics: sourceFailure,
          message: `Please inspect the column mappings for ${sourceFailure.failedSource} and verify that the Amount, Date, and Reference fields point to valid columns.`,
        });
      }

      // Step 3: Run Reconciliation Engine (Deterministic multi-level matching & 3-way grouping)
      const cases = ReconciliationEngine.reconcile(
        normBank.records,
        normMerchant.records,
        normSettlement.records,
        config
      );

      // Step 4: Settlement Analytics
      const insights = SettlementAnalyticsService.calculateInsights(cases);

      // Step 5: Aggregate Run Summary Numbers (from actual data)
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

      // Step 6: Persist Run to SQLite
      await prisma.reconciliationRun.create({
        data: {
          id: runId,
          name: runName,
          isDemo: false,
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
          summary: `Reconciliation completed across ${totalCases} total cases. Match rate: ${matchRate}%. Total difference: $${totalDifference.toFixed(2)}.`,
        },
      });

      // Persist File Imports
      await prisma.fileImport.createMany({
        data: [
          {
            id: uuidv4(),
            runId,
            sourceType: 'BANK',
            fileName: bankFile.originalname,
            fileSize: bankFile.size,
            fileType: parsedBank.fileType,
            totalRows: normBank.totalRows,
            validRows: normBank.validRows,
            invalidRows: normBank.invalidRows,
            warnings: JSON.stringify(normBank.warnings),
            detectedHeaders: JSON.stringify(parsedBank.headers),
            columnMappings: JSON.stringify(finalBankMapping),
          },
          {
            id: uuidv4(),
            runId,
            sourceType: 'MERCHANT',
            fileName: merchantFile.originalname,
            fileSize: merchantFile.size,
            fileType: parsedMerchant.fileType,
            totalRows: normMerchant.totalRows,
            validRows: normMerchant.validRows,
            invalidRows: normMerchant.invalidRows,
            warnings: JSON.stringify(normMerchant.warnings),
            detectedHeaders: JSON.stringify(parsedMerchant.headers),
            columnMappings: JSON.stringify(finalMerchantMapping),
          },
          {
            id: uuidv4(),
            runId,
            sourceType: 'SETTLEMENT',
            fileName: settlementFile.originalname,
            fileSize: settlementFile.size,
            fileType: parsedSettlement.fileType,
            totalRows: normSettlement.totalRows,
            validRows: normSettlement.validRows,
            invalidRows: normSettlement.invalidRows,
            warnings: JSON.stringify(normSettlement.warnings),
            detectedHeaders: JSON.stringify(parsedSettlement.headers),
            columnMappings: JSON.stringify(finalSettlementMapping),
          },
        ],
      });

      // Persist Cases, Source Records, Exceptions
      let caseIdx = 1;
      for (const c of cases) {
        const caseId = uuidv4();
        const caseNum = `CASE-${String(caseIdx++).padStart(4, '0')}`;
        const primaryRef = c.merchantRecord?.rawReference || c.bankRecord?.rawReference || c.settlementRecord?.rawReference || caseNum;

        await prisma.reconciledCase.create({
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

        if (c.bankRecord) {
          await prisma.reconciledSourceRecord.create({
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
          await prisma.reconciledSourceRecord.create({
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
          await prisma.reconciledSourceRecord.create({
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

        if (c.classification !== 'MATCHED' && c.classification !== 'LIKELY_MATCH') {
          const affected: string[] = [];
          if (c.bankRecord) affected.push('BANK');
          if (c.merchantRecord) affected.push('MERCHANT');
          if (c.settlementRecord) affected.push('SETTLEMENT');

          await prisma.exceptionItem.create({
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
      await prisma.settlementInsight.create({
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

      await AuditService.log('RECON_COMPLETED', `Completed reconciliation run ${runId} with match rate ${matchRate}%.`, runId);

      return res.json({
        success: true,
        runId,
        name: runName,
        totalCases,
        matchedCount,
        matchRate,
        exceptions: totalCases - (matchedCount + likelyMatchCount),
        totalDifference,
      });
    } catch (err: any) {
      console.error('Reconciliation execution error:', err);
      return res.status(500).json({ error: err.message || 'An error occurred while reconciling financial sources.' });
    }
  }
);

router.get('/runs', async (req, res) => {
  try {
    const runs = await prisma.reconciliationRun.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        fileImports: {
          select: { sourceType: true, fileName: true, totalRows: true, validRows: true, invalidRows: true },
        },
      },
    });
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch reconciliation runs.' });
  }
});

router.get('/runs/:id', async (req, res) => {
  try {
    const run = await prisma.reconciliationRun.findUnique({
      where: { id: req.params.id },
      include: {
        fileImports: true,
        settlementInsights: true,
        _count: { select: { cases: true, exceptions: true } },
      },
    });
    if (!run) return res.status(404).json({ error: 'Reconciliation run not found.' });
    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch run details.' });
  }
});

router.delete('/runs/:id', async (req, res) => {
  try {
    await prisma.reconciliationRun.delete({ where: { id: req.params.id } });
    await AuditService.log('RUN_DELETED', `Deleted reconciliation run ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete run.' });
  }
});

export default router;
