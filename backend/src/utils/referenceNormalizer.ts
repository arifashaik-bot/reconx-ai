/**
 * Reference Normalizer & Fuzzy Matching Utilities
 * Normalizes identifiers cleanly without causing unintentional collisions.
 */

export function normalizeReference(ref: any): string {
  if (ref === null || ref === undefined) return '';
  const str = String(ref).trim();
  if (!str) return '';

  // Remove leading '#' or 'ref:' or 'txn:' prefixes
  let cleaned = str.replace(/^(?:#|ref:|txn:|id:|order:)\s*/i, '');

  // Uppercase for case-insensitive matching
  cleaned = cleaned.toUpperCase().trim();

  // Replace multiple whitespace with single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned;
}

/**
 * Calculates Levenshtein similarity ratio between two strings (0.0 to 1.0)
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0.0;
  if (s1 === s2) return 1.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Checks if one reference contains the core alphanumerics of another
 * e.g., "BANK-TXN-908231" and "TXN-908231" or "INV_2026_001" and "2026_001"
 */
export function hasStrongSubReferenceMatch(ref1: string, ref2: string): boolean {
  if (!ref1 || !ref2) return false;
  const n1 = normalizeReference(ref1);
  const n2 = normalizeReference(ref2);

  if (n1 === n2) return true;
  if (n1.length >= 6 && n2.length >= 6) {
    if (n1.includes(n2) || n2.includes(n1)) return true;
  }
  // Strip non-alphanumeric and compare
  const a1 = n1.replace(/[^A-Z0-9]/g, '');
  const a2 = n2.replace(/[^A-Z0-9]/g, '');
  if (a1 && a2 && (a1 === a2 || (a1.length >= 6 && a2.length >= 6 && (a1.includes(a2) || a2.includes(a1))))) {
    return true;
  }
  return false;
}
