import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { AuditService } from '../services/auditService.js';
import { ReportGeneratorService } from '../services/reportGenerator.service.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/export', async (req, res) => {
  try {
    const runId = req.query.runId as string | undefined;
    const type = (req.query.type as string || 'reconciliation').toLowerCase() as 'reconciliation' | 'exceptions' | 'settlements';
    const format = (req.query.format as string || 'csv').toLowerCase() as 'csv' | 'xlsx' | 'html';

    let targetRunId = runId;
    if (!targetRunId) {
      const latest = await prisma.reconciliationRun.findFirst({ orderBy: { createdAt: 'desc' } });
      if (!latest) return res.status(400).json({ error: 'No reconciliation runs exist to export.' });
      targetRunId = latest.id;
    }

    const { data, contentType, fileName } = await ReportGeneratorService.generateReport(targetRunId, type, format);

    await AuditService.log('REPORT_EXPORTED', `Exported ${type} report in ${format.toUpperCase()} format (${fileName}).`, targetRunId);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    if (Buffer.isBuffer(data)) {
      res.send(data);
    } else {
      res.send(data);
    }
  } catch (err: any) {
    console.error('Report export error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate report export.' });
  }
});

export default router;
