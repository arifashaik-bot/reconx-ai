import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { AuditService } from '../services/auditService.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const runId = req.query.runId as string | undefined;
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    const severity = req.query.severity as string | undefined;

    let targetRunId = runId;
    if (!targetRunId) {
      const latest = await prisma.reconciliationRun.findFirst({ orderBy: { createdAt: 'desc' } });
      if (!latest) return res.json({ exceptions: [], summary: {} });
      targetRunId = latest.id;
    }

    const where: any = { runId: targetRunId };

    if (type && type !== 'ALL') {
      where.type = type;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }

    const exceptions = await prisma.exceptionItem.findMany({
      where,
      orderBy: { difference: 'desc' },
      include: {
        reconciledCase: {
          include: { sourceRecords: true },
        },
      },
    });

    // Counts summary
    const allForRun = await prisma.exceptionItem.findMany({ where: { runId: targetRunId } });
    const summary = {
      total: allForRun.length,
      open: allForRun.filter(e => e.status === 'OPEN').length,
      resolved: allForRun.filter(e => e.status === 'RESOLVED').length,
      ignored: allForRun.filter(e => e.status === 'IGNORED').length,
      amountMismatch: allForRun.filter(e => e.type === 'AMOUNT_MISMATCH').length,
      missingSettlement: allForRun.filter(e => e.type === 'MISSING_SETTLEMENT').length,
      missingSource: allForRun.filter(e => e.type === 'MISSING').length,
      duplicate: allForRun.filter(e => e.type === 'DUPLICATE').length,
      timingDiscrepancy: allForRun.filter(e => e.type === 'TIMING_DISCREPANCY').length,
      partialSettlement: allForRun.filter(e => e.type === 'PARTIAL_SETTLEMENT').length,
      reviewRequired: allForRun.filter(e => e.type === 'REVIEW_REQUIRED').length,
      totalExposure: Math.round(allForRun.reduce((sum, e) => sum + e.difference, 0) * 100) / 100,
    };

    res.json({ exceptions, summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch exceptions.' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['OPEN', 'RESOLVED', 'IGNORED', 'INVESTIGATING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const updated = await prisma.exceptionItem.update({
      where: { id },
      data: {
        status,
        notes: notes || undefined,
        resolvedAt: status === 'RESOLVED' || status === 'IGNORED' ? new Date() : null,
      },
      include: { reconciledCase: true },
    });

    // Also update associated ReconciledCase status
    if (updated.caseId) {
      await prisma.reconciledCase.update({
        where: { id: updated.caseId },
        data: {
          status,
          resolutionNotes: notes || undefined,
          resolvedAt: status === 'RESOLVED' || status === 'IGNORED' ? new Date() : null,
        },
      });
    }

    await AuditService.log(
      `EXCEPTION_${status}`,
      `Exception ${id} (${updated.type} - Ref: ${updated.reconciledCase.primaryReference}) marked as ${status}. Notes: ${notes || 'None'}`,
      updated.runId
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update exception status.' });
  }
});

export default router;
