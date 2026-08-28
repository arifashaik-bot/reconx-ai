import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const logs = await prisma.auditLogEntry.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: { run: { select: { id: true, name: true } } },
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs.' });
  }
});

export default router;
