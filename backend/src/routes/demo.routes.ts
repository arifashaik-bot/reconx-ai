import { Router } from 'express';
import { DemoDataGeneratorService } from '../services/demoDataGenerator.service.js';

const router = Router();

router.post('/run', async (req, res) => {
  try {
    const runId = await DemoDataGeneratorService.generateDemoRun();
    res.json({
      success: true,
      runId,
      message: 'Synthetic demonstration run generated successfully.',
    });
  } catch (err: any) {
    console.error('Demo generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate demo reconciliation run.' });
  }
});

export default router;
