import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

router.get('/overview', async (req, res) => {
  try {
    const runIdQuery = req.query.runId as string | undefined;

    let run;
    if (runIdQuery) {
      run = await prisma.reconciliationRun.findUnique({
        where: { id: runIdQuery },
        include: {
          fileImports: true,
          exceptions: {
            take: 6,
            orderBy: { difference: 'desc' },
            include: { reconciledCase: true },
          },
          settlementInsights: true,
        },
      });
    } else {
      // Find latest completed run (either real or demo)
      run = await prisma.reconciliationRun.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          fileImports: true,
          exceptions: {
            take: 6,
            orderBy: { difference: 'desc' },
            include: { reconciledCase: true },
          },
          settlementInsights: true,
        },
      });
    }

    if (!run) {
      return res.json({
        hasData: false,
        message: 'Upload your financial sources to begin reconciliation.',
      });
    }

    // Health distribution breakdown
    const healthStatusDistribution = [
      { status: 'MATCHED', label: 'Matched', count: run.matchedCount, color: '#10b981' },
      { status: 'LIKELY_MATCH', label: 'Likely Match', count: run.likelyMatchCount, color: '#34d399' },
      { status: 'AMOUNT_MISMATCH', label: 'Amount Mismatch', count: run.amountMismatchCount, color: '#ef4444' },
      { status: 'MISSING', label: 'Missing Record', count: run.missingCount, color: '#f59e0b' },
      { status: 'MISSING_SETTLEMENT', label: 'Missing Settlement', count: run.missingSettlementCount, color: '#f97316' },
      { status: 'DUPLICATE', label: 'Duplicate Entry', count: run.duplicateCount, color: '#ec4899' },
      { status: 'PARTIAL_SETTLEMENT', label: 'Partial Settlement', count: run.partialSettlementCount, color: '#8b5cf6' },
      { status: 'TIMING_DISCREPANCY', label: 'Timing Discrepancy', count: run.timingDiscrepancyCount, color: '#eab308' },
      { status: 'REVIEW_REQUIRED', label: 'Review Required', count: run.reviewRequiredCount, color: '#64748b' },
    ];

    // Source Node metrics for 3D & 2D visualization
    const bankFile = run.fileImports.find(f => f.sourceType === 'BANK');
    const merchantFile = run.fileImports.find(f => f.sourceType === 'MERCHANT');
    const settlementFile = run.fileImports.find(f => f.sourceType === 'SETTLEMENT');

    const nodeMetrics = {
      bank: {
        source: 'Bank Statement',
        fileName: bankFile?.fileName || 'Bank Ledger',
        totalRows: bankFile?.totalRows || 0,
        amount: run.grossBankAmount,
        matched: run.matchedCount + run.likelyMatchCount,
        exceptions: run.amountMismatchCount + run.missingCount + run.duplicateCount,
      },
      merchant: {
        source: 'Merchant Ledger',
        fileName: merchantFile?.fileName || 'Sales Orders',
        totalRows: merchantFile?.totalRows || 0,
        amount: run.grossMerchantAmount,
        matched: run.matchedCount + run.likelyMatchCount,
        exceptions: run.amountMismatchCount + run.missingCount + run.missingSettlementCount,
      },
      settlement: {
        source: 'Settlement Report',
        fileName: settlementFile?.fileName || 'Gateway Payouts',
        totalRows: settlementFile?.totalRows || 0,
        amount: run.grossSettlementAmount || run.netSettlementAmount,
        matched: run.matchedCount + run.likelyMatchCount,
        exceptions: run.missingSettlementCount + run.partialSettlementCount + run.timingDiscrepancyCount,
      },
    };

    // Financial flow calculated steps
    const financialFlow = {
      merchantGross: run.grossMerchantAmount,
      bankReceived: run.grossBankAmount,
      settlementNet: run.netSettlementAmount,
      feesDeducted: run.totalFees,
      unreconciledDifference: run.totalDifference,
    };

    const totalExceptionsCount =
      run.amountMismatchCount +
      run.missingCount +
      run.missingSettlementCount +
      run.duplicateCount +
      run.partialSettlementCount +
      run.timingDiscrepancyCount +
      run.reviewRequiredCount;

    return res.json({
      hasData: true,
      runId: run.id,
      runName: run.name,
      isDemo: run.isDemo,
      runDate: run.createdAt,
      totalTransactions: run.totalCases,
      matched: run.matchedCount + run.likelyMatchCount,
      exceptions: totalExceptionsCount,
      matchRate: run.matchRate,
      grossAmount: run.grossMerchantAmount || run.grossBankAmount,
      settlementAmount: run.netSettlementAmount,
      financialDifference: run.totalDifference,
      healthStatusDistribution,
      nodeMetrics,
      financialFlow,
      recentExceptions: run.exceptions.map(e => ({
        id: e.id,
        caseId: e.caseId,
        type: e.type,
        severity: e.severity,
        reference: e.reconciledCase.primaryReference || 'N/A',
        affectedSources: e.affectedSources,
        difference: e.difference,
        status: e.status,
        explanation: e.explanation,
        createdAt: e.createdAt,
      })),
      filesProcessed: run.fileImports.map(f => ({
        sourceType: f.sourceType,
        fileName: f.fileName,
        fileSize: f.fileSize,
        totalRows: f.totalRows,
        validRows: f.validRows,
        invalidRows: f.invalidRows,
      })),
    });
  } catch (err: any) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate dashboard overview.' });
  }
});

export default router;
