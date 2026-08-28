import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const runId = req.query.runId as string | undefined;
    const search = (req.query.search as string || '').trim();
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    // If no runId provided, find latest run
    let targetRunId = runId;
    if (!targetRunId) {
      const latest = await prisma.reconciliationRun.findFirst({ orderBy: { createdAt: 'desc' } });
      if (!latest) {
        return res.json({ cases: [], total: 0, page: 1, totalPages: 0 });
      }
      targetRunId = latest.id;
    }

    const where: any = { runId: targetRunId };

    if (status && status !== 'ALL') {
      where.classification = status;
    }

    if (search) {
      where.OR = [
        { primaryReference: { contains: search } },
        { caseNumber: { contains: search } },
        { customer: { contains: search } },
        { paymentMethod: { contains: search } },
      ];
    }

    const total = await prisma.reconciledCase.count({ where });

    const orderBy: any = {};
    if (sortBy === 'difference') {
      orderBy.financialDifference = sortOrder;
    } else if (sortBy === 'date') {
      orderBy.transactionDate = sortOrder;
    } else if (sortBy === 'confidence') {
      orderBy.confidenceScore = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const cases = await prisma.reconciledCase.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        sourceRecords: true,
        exception: true,
      },
    });

    res.json({
      cases: cases.map(c => ({
        id: c.id,
        runId: c.runId,
        caseNumber: c.caseNumber,
        primaryReference: c.primaryReference,
        classification: c.classification,
        confidenceScore: c.confidenceScore,
        matchingMethod: c.matchingMethod,
        bankAmount: c.bankAmount,
        merchantAmount: c.merchantAmount,
        settlementAmount: c.settlementAmount,
        feeAmount: c.feeAmount,
        netSettlementAmount: c.netSettlementAmount,
        financialDifference: c.financialDifference,
        transactionDate: c.transactionDate,
        settlementDate: c.settlementDate,
        dateDifferenceDays: c.dateDifferenceDays,
        customer: c.customer,
        paymentMethod: c.paymentMethod,
        explanation: c.explanation,
        recommendedAction: c.recommendedAction,
        status: c.status,
        sourceRecordsCount: c.sourceRecords.length,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error('Transactions query error:', err);
    res.status(500).json({ error: err.message || 'Failed to query transactions.' });
  }
});

router.get('/:caseId', async (req, res) => {
  try {
    const singleCase = await prisma.reconciledCase.findUnique({
      where: { id: req.params.caseId },
      include: {
        sourceRecords: true,
        exception: true,
        run: { select: { id: true, name: true, createdAt: true, isDemo: true } },
      },
    });

    if (!singleCase) {
      return res.status(404).json({ error: 'Transaction case not found.' });
    }

    let evidenceParsed = [];
    try {
      evidenceParsed = JSON.parse(singleCase.evidence || '[]');
    } catch (_) {}

    res.json({
      ...singleCase,
      evidence: evidenceParsed,
      sourceRecords: singleCase.sourceRecords.map(sr => {
        let rawJson = {};
        try {
          rawJson = JSON.parse(sr.rawData || '{}');
        } catch (_) {}
        return {
          ...sr,
          rawData: rawJson,
        };
      }),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch transaction details.' });
  }
});

export default router;
