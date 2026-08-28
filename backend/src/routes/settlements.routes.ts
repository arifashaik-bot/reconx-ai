import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

router.get('/intelligence', async (req, res) => {
  try {
    const runId = req.query.runId as string | undefined;

    let targetRunId = runId;
    if (!targetRunId) {
      const latest = await prisma.reconciliationRun.findFirst({ orderBy: { createdAt: 'desc' } });
      if (!latest) return res.json({ hasData: false });
      targetRunId = latest.id;
    }

    const run = await prisma.reconciliationRun.findUnique({
      where: { id: targetRunId },
      include: {
        settlementInsights: true,
        cases: {
          where: {
            OR: [
              { settlementAmount: { not: null } },
              { classification: 'MISSING_SETTLEMENT' },
              { classification: 'PARTIAL_SETTLEMENT' },
              { classification: 'TIMING_DISCREPANCY' },
            ],
          },
          take: 50,
          orderBy: { financialDifference: 'desc' },
        },
      },
    });

    if (!run) return res.json({ hasData: false });

    const insight = run.settlementInsights[0];
    let delayDist = [];
    let feeBreakdown = [];

    try {
      if (insight?.delayDistribution) delayDist = JSON.parse(insight.delayDistribution);
      if (insight?.feeBreakdown) feeBreakdown = JSON.parse(insight.feeBreakdown);
    } catch (_) {}

    res.json({
      hasData: true,
      runId: run.id,
      runName: run.name,
      grossCollections: insight ? insight.grossCollections : run.grossMerchantAmount,
      netSettlements: insight ? insight.netSettlements : run.netSettlementAmount,
      totalFees: insight ? insight.totalFees : run.totalFees,
      totalRefunds: insight ? insight.totalRefunds : 0,
      totalAdjustments: insight ? insight.totalAdjustments : 0,
      pendingSettlements: insight ? insight.pendingSettlements : 0,
      averageDelayDays: insight ? insight.averageDelayDays : 0,
      financialExposure: insight ? insight.financialExposure : run.totalDifference,
      delayDistribution: delayDist,
      feeBreakdown,
      settlementTransactions: run.cases.map(c => ({
        id: c.id,
        caseNumber: c.caseNumber,
        reference: c.primaryReference,
        merchantAmount: c.merchantAmount,
        settlementAmount: c.settlementAmount,
        fee: c.feeAmount,
        difference: c.financialDifference,
        dateDelta: c.dateDifferenceDays,
        classification: c.classification,
        status: c.status,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settlement intelligence.' });
  }
});

export default router;
