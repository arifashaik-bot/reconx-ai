import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { config } from '../config/index.js';
import { AuditService } from '../services/auditService.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

    res.json({
      amountTolerance: settingsMap['amountTolerance'] ? parseFloat(settingsMap['amountTolerance']) : config.defaults.amountTolerance,
      dateToleranceDays: settingsMap['dateToleranceDays'] ? parseInt(settingsMap['dateToleranceDays'], 10) : config.defaults.dateToleranceDays,
      sensitivity: settingsMap['sensitivity'] || config.defaults.sensitivity,
      currency: settingsMap['currency'] || 'USD',
      currencySymbol: settingsMap['currencySymbol'] || '$',
      reducedMotion: settingsMap['reducedMotion'] === 'true',
      hasOpenAiKey: !!config.openai.apiKey,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settings.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amountTolerance, dateToleranceDays, sensitivity, currency, currencySymbol, reducedMotion } = req.body;

    const updates = [
      { key: 'amountTolerance', value: String(amountTolerance ?? config.defaults.amountTolerance) },
      { key: 'dateToleranceDays', value: String(dateToleranceDays ?? config.defaults.dateToleranceDays) },
      { key: 'sensitivity', value: String(sensitivity ?? config.defaults.sensitivity) },
      { key: 'currency', value: String(currency ?? 'USD') },
      { key: 'currencySymbol', value: String(currencySymbol ?? '$') },
      { key: 'reducedMotion', value: String(reducedMotion ?? 'false') },
    ];

    for (const u of updates) {
      await prisma.systemSetting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      });
    }

    await AuditService.log('SETTINGS_UPDATED', `Updated system matching tolerances: amount=${amountTolerance}, dateDelta=${dateToleranceDays}d, sensitivity=${sensitivity}`);

    res.json({ success: true, message: 'Settings updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save settings.' });
  }
});

export default router;
