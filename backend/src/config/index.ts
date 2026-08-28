import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  defaults: {
    amountTolerance: parseFloat(process.env.DEFAULT_AMOUNT_TOLERANCE || '0.01'),
    dateToleranceDays: parseInt(process.env.DEFAULT_DATE_TOLERANCE_DAYS || '3', 10),
    sensitivity: (process.env.DEFAULT_SENSITIVITY || 'balanced') as 'strict' | 'balanced' | 'relaxed',
  },
};
