/**
 * Financial Amount Parser
 * Accurately parses and normalizes monetary amounts across multiple locales,
 * currencies, symbols, parenthesis negatives, credit/debit indicators, and formats.
 *
 * Rejects invalid strings (empty, "-", "N/A", "null") by returning null or error,
 * NEVER silently converting invalid values to zero.
 */

export interface ParsedAmountResult {
  value: number;
  direction: 'CREDIT' | 'DEBIT' | 'UNKNOWN';
  raw: string;
  isValid: boolean;
  error?: string;
}

export function parseFinancialAmount(val: any): ParsedAmountResult {
  if (val === null || val === undefined) {
    return { value: 0, direction: 'UNKNOWN', raw: '', isValid: false, error: 'Value is null or undefined' };
  }

  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) {
      return { value: 0, direction: 'UNKNOWN', raw: String(val), isValid: false, error: 'Numeric value is NaN or Infinity' };
    }
    const rounded = Math.round(val * 100) / 100;
    return {
      value: Math.abs(rounded),
      direction: rounded >= 0 ? 'CREDIT' : 'DEBIT',
      raw: String(val),
      isValid: true,
    };
  }

  const rawStr = String(val).trim();

  if (rawStr === '') {
    return { value: 0, direction: 'UNKNOWN', raw: rawStr, isValid: false, error: 'Empty amount string' };
  }

  const invalidTokens = ['-', '--', 'n/a', 'na', 'null', 'undefined', 'unknown', 'none', 'nil', '?'];
  if (invalidTokens.includes(rawStr.toLowerCase())) {
    return { value: 0, direction: 'UNKNOWN', raw: rawStr, isValid: false, error: `Invalid amount token: "${rawStr}"` };
  }

  let cleaned = rawStr;
  let isNegative = false;
  let direction: 'CREDIT' | 'DEBIT' | 'UNKNOWN' = 'UNKNOWN';

  // Check for (1,250.00) accounting format
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    isNegative = true;
    direction = 'DEBIT';
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Check for CR / DR indicators
  const upper = cleaned.toUpperCase();
  if (upper.endsWith(' DR') || upper.endsWith('DR') || upper.startsWith('DR ') || upper.startsWith('DR:')) {
    direction = 'DEBIT';
    isNegative = true;
    cleaned = cleaned.replace(/dr/i, '').trim();
  } else if (upper.endsWith(' CR') || upper.endsWith('CR') || upper.startsWith('CR ') || upper.startsWith('CR:')) {
    direction = 'CREDIT';
    cleaned = cleaned.replace(/cr/i, '').trim();
  }

  // Remove currency symbols and non-numeric characters except comma, dot, minus, plus, whitespace
  // Currency symbols: $, ₹, €, £, ¥, Rs, Rs., INR, USD, EUR, GBP, AUD, CAD, etc.
  cleaned = cleaned.replace(/(?:INR|USD|EUR|GBP|AUD|CAD|CHF|JPY|Rs\.?|₹|\$|€|£|¥)/gi, '').trim();

  // Check leading minus or plus
  if (cleaned.startsWith('-')) {
    isNegative = true;
    direction = 'DEBIT';
    cleaned = cleaned.substring(1).trim();
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1).trim();
  }

  // Remove interior spaces (e.g. "1 250.00" -> "1250.00")
  cleaned = cleaned.replace(/\s+/g, '');

  if (cleaned === '') {
    return { value: 0, direction: 'UNKNOWN', raw: rawStr, isValid: false, error: 'No numeric characters found' };
  }

  // Handle European vs Standard decimals
  // Standard: 1,250.50 or 1250.50
  // European: 1.250,50 or 1250,50
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // European format: 1.250,50 -> 1250.50
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Standard format: 1,250.50 -> 1250.50
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal comma: 1250,50 -> 1250.50
      cleaned = cleaned.replace(',', '.');
    } else {
      // Likely thousand separator: 1,250 -> 1250
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const num = parseFloat(cleaned);

  if (isNaN(num) || !isFinite(num)) {
    return { value: 0, direction: 'UNKNOWN', raw: rawStr, isValid: false, error: `Could not parse as numeric amount: "${rawStr}"` };
  }

  const finalValue = Math.round(num * 100) / 100;
  if (direction === 'UNKNOWN') {
    direction = isNegative ? 'DEBIT' : 'CREDIT';
  }

  return {
    value: Math.abs(finalValue),
    direction,
    raw: rawStr,
    isValid: true,
  };
}
