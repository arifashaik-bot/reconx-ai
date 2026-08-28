import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { AiAnalystService } from '../services/aiAnalyst.service.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/query', async (req, res) => {
  try {
    const { runId, query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    let targetRunId = runId;
    if (!targetRunId) {
      const latest = await prisma.reconciliationRun.findFirst({ orderBy: { createdAt: 'desc' } });
      if (!latest) {
        return res.json({
          answer: 'No reconciliation runs exist in the database. Please upload your 3 financial files or run Demo Mode to begin analysis.',
          suggestedFollowups: ['Run demo dataset', 'Upload financial files'],
          isAiGenerated: false,
          referencedCases: [],
        });
      }
      targetRunId = latest.id;
    }

    const response = await AiAnalystService.analyze(targetRunId, query);
    res.json(response);
  } catch (err: any) {
    console.error('AI query error:', err);
    res.status(500).json({ error: err.message || 'AI analysis request failed.' });
  }
});

router.get('/prompts', (req, res) => {
  res.json({
    prompts: [
      { category: 'Health', text: 'Explain overall reconciliation match rate and health' },
      { category: 'Risk', text: 'Summarize all open exceptions and total financial exposure' },
      { category: 'Discrepancy', text: 'Show top high-value amount discrepancies across files' },
      { category: 'Settlement', text: 'Explain missing settlements and uncollected gateway funds' },
      { category: 'Duplicates', text: 'Find possible duplicate records across sources' },
      { category: 'Fees', text: 'Analyze gateway fee deductions against gross revenue' },
    ],
  });
});

export default router;
