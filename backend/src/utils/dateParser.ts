/**
 * Financial Date Parser
 * Robustly parses multi-format dates (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, Excel serials, text months).
 */

export interface ParsedDateResult {
  date?: Date;
  isoString?: string;
  raw: string;
  isValid: boolean;
  error?: string;
}

export function parseFinancialDate(val: any): ParsedDateResult {
  if (val === null || val === undefined) {
    return { raw: '', isValid: false, error: 'Date is null or undefined' };
  }

  if (val instanceof Date) {
    if (isNaN(val.getTime())) {
      return { raw: String(val), isValid: false, error: 'Invalid Date object' };
    }
    return {
      date: val,
      isoString: val.toISOString(),
      raw: val.toISOString(),
      isValid: true,
    };
  }

  // Handle Excel serial date numbers (e.g. 45000)
  if (typeof val === 'number') {
    if (val > 20000 && val < 60000) {
      // Excel epoch starts 1899-12-30
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return {
          date,
          isoString: date.toISOString(),
          raw: String(val),
          isValid: true,
        };
      }
    }
  }

  const rawStr = String(val).trim();
  if (rawStr === '') {
    return { raw: rawStr, isValid: false, error: 'Empty date string' };
  }

  const invalidTokens = ['-', '--', 'n/a', 'na', 'null', 'undefined', 'unknown', 'none', 'nil', '?'];
  if (invalidTokens.includes(rawStr.toLowerCase())) {
    return { raw: rawStr, isValid: false, error: `Invalid date token: "${rawStr}"` };
  }

  // Standard ISO Date or timestamps
  const parsedDirect = new Date(rawStr);
  if (!isNaN(parsedDirect.getTime()) && rawStr.includes('-') && rawStr.length >= 8 && rawStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return {
      date: parsedDirect,
      isoString: parsedDirect.toISOString(),
      raw: rawStr,
      isValid: true,
    };
  }

  // Handle DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const parts = rawStr.split(/[\/\-\.\s]/).filter(Boolean);
  if (parts.length >= 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);

    // If part 2 is month name (e.g., "29-Aug-2026" or "Aug-29-2026")
    const monthMap: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
      january: 1, february: 2, march: 3, april: 4, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    };

    const p1Month = monthMap[parts[0].toLowerCase()];
    const p2Month = monthMap[parts[1].toLowerCase()];

    if (p1Month && !isNaN(p2) && !isNaN(p3)) {
      // "Aug 29 2026" -> Month=p1Month, Day=p2, Year=p3
      const year = p3 < 100 ? 2000 + p3 : p3;
      const date = new Date(Date.UTC(year, p1Month - 1, p2));
      if (!isNaN(date.getTime())) {
        return { date, isoString: date.toISOString(), raw: rawStr, isValid: true };
      }
    } else if (p2Month && !isNaN(p1) && !isNaN(p3)) {
      // "29 Aug 2026" -> Day=p1, Month=p2Month, Year=p3
      const year = p3 < 100 ? 2000 + p3 : p3;
      const date = new Date(Date.UTC(year, p2Month - 1, p1));
      if (!isNaN(date.getTime())) {
        return { date, isoString: date.toISOString(), raw: rawStr, isValid: true };
      }
    }

    if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
      let day = 0;
      let month = 0;
      let year = 0;

      if (p1 > 1000) {
        // YYYY/MM/DD
        year = p1;
        month = p2;
        day = p3;
      } else if (p3 > 1000 || p3 < 100) {
        year = p3 < 100 ? (p3 > 70 ? 1900 + p3 : 2000 + p3) : p3;
        // Disambiguate DD/MM vs MM/DD
        if (p1 > 12 && p2 <= 12) {
          // Definitely DD/MM/YYYY
          day = p1;
          month = p2;
        } else if (p2 > 12 && p1 <= 12) {
          // Definitely MM/DD/YYYY
          month = p1;
          day = p2;
        } else {
          // Default to DD/MM/YYYY for standard financial international reporting
          day = p1;
          month = p2;
        }
      }

      if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(Date.UTC(year, month - 1, day));
        if (!isNaN(date.getTime())) {
          return {
            date,
            isoString: date.toISOString(),
            raw: rawStr,
            isValid: true,
          };
        }
      }
    }
  }

  // Fallback direct JS parse
  if (!isNaN(parsedDirect.getTime())) {
    return {
      date: parsedDirect,
      isoString: parsedDirect.toISOString(),
      raw: rawStr,
      isValid: true,
    };
  }

  return { raw: rawStr, isValid: false, error: `Unrecognized date format: "${rawStr}"` };
}

export function calculateDateDifferenceInDays(d1?: Date | null, d2?: Date | null): number | undefined {
  if (!d1 || !d2) return undefined;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}
