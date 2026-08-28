import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { config } from './config/index.js';
import aiRoutes from './routes/ai.routes.js';
import auditRoutes from './routes/audit.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import demoRoutes from './routes/demo.routes.js';
import exceptionsRoutes from './routes/exceptions.routes.js';
import importRoutes from './routes/import.routes.js';
import reconciliationRoutes from './routes/reconciliation.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import settlementsRoutes from './routes/settlements.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'RECONX AI',
    tagline: 'Turn payment chaos into financial clarity.',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/import', importRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/exceptions', exceptionsRoutes);
app.use('/api/settlements', settlementsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/demo', demoRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// Centralized Error Handler (Never leaks raw server stack traces)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';
  res.status(status).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 RECONX AI Backend Engine is running on port ${config.port}`);
    console.log(`   Database: SQLite (${config.databaseUrl})`);
    console.log(`   AI Engine: ${config.openai.apiKey ? 'OpenAI GPT-4o-mini' : 'Deterministic Database Intelligence'}`);
    console.log(`==================================================\n`);
  });
}

export default app;
