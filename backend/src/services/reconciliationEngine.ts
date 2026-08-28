import {
  CanonicalFinancialRecord,
  CandidateGroup,
  ClassificationType,
  MatchingEvidence,
  MatchingMethodType,
  ReconciliationConfig,
  SourceType,
} from '../types/index.js';
import { calculateDateDifferenceInDays } from '../utils/dateParser.js';
import {
  calculateStringSimilarity,
  hasStrongSubReferenceMatch,
} from '../utils/referenceNormalizer.js';

interface ScoredPair {
  sourceA: SourceType;
  recordA: CanonicalFinancialRecord;
  sourceB: SourceType;
  recordB: CanonicalFinancialRecord;
  level: number;
  method: MatchingMethodType;
  score: number;
  amountDiff: number;
  dateDiffDays: number;
  evidence: MatchingEvidence[];
}

export class ReconciliationEngine {
  public static reconcile(
    bankRecords: CanonicalFinancialRecord[],
    merchantRecords: CanonicalFinancialRecord[],
    settlementRecords: CanonicalFinancialRecord[],
    config: ReconciliationConfig
  ): CandidateGroup[] {
    const { amountTolerance, dateToleranceDays, sensitivity } = config;

    // Filter valid records for matching; invalid records will still be packaged
    const validBank = bankRecords.filter(r => r.isValid);
    const validMerchant = merchantRecords.filter(r => r.isValid);
    const validSettlement = settlementRecords.filter(r => r.isValid);

    const invalidRecords = [
      ...bankRecords.filter(r => !r.isValid),
      ...merchantRecords.filter(r => !r.isValid),
      ...settlementRecords.filter(r => !r.isValid),
    ];

    // Track used record IDs
    const usedBankIds = new Set<string>();
    const usedMerchantIds = new Set<string>();
    const usedSettlementIds = new Set<string>();

    const results: CandidateGroup[] = [];

    // --- STEP 1: DUPLICATE DETECTION (within the same source) ---
    const detectDuplicates = (records: CanonicalFinancialRecord[], source: SourceType) => {
      const groups = new Map<string, CanonicalFinancialRecord[]>();
      for (const rec of records) {
        if (!rec.normalizedReference) continue;
        const key = `${rec.normalizedReference}_${rec.amount.toFixed(2)}`;
        const list = groups.get(key) || [];
        list.push(rec);
        groups.set(key, list);
      }

      for (const [, list] of groups.entries()) {
        if (list.length > 1) {
          // Flag subsequent occurrences as DUPLICATE
          for (let i = 1; i < list.length; i++) {
            const dupRec = list[i];
            if (source === 'BANK') usedBankIds.add(dupRec.id);
            if (source === 'MERCHANT') usedMerchantIds.add(dupRec.id);
            if (source === 'SETTLEMENT') usedSettlementIds.add(dupRec.id);

            results.push({
              bankRecord: source === 'BANK' ? dupRec : undefined,
              merchantRecord: source === 'MERCHANT' ? dupRec : undefined,
              settlementRecord: source === 'SETTLEMENT' ? dupRec : undefined,
              classification: 'DUPLICATE',
              confidenceScore: 98,
              matchingMethod: 'EXACT_ID',
              evidence: [
                {
                  type: 'SAME_SOURCE_DUPLICATE',
                  description: `Duplicate record detected within ${source} with reference "${dupRec.rawReference}" and amount ${dupRec.amount.toFixed(2)}.`,
                  score: 98,
                },
              ],
              explanation: `Identical reference and amount appeared ${list.length} times in ${source}. This indicates a duplicate entry or double-posting in the source file.`,
              recommendedAction: `Inspect source system ${source} for duplicate transmission or batch re-posting.`,
              financialDifference: dupRec.amount,
            });
          }
        }
      }
    };

    detectDuplicates(validBank, 'BANK');
    detectDuplicates(validMerchant, 'MERCHANT');
    detectDuplicates(validSettlement, 'SETTLEMENT');

    // Filter out already processed duplicates
    const availBank = validBank.filter(r => !usedBankIds.has(r.id));
    const availMerchant = validMerchant.filter(r => !usedMerchantIds.has(r.id));
    const availSettlement = validSettlement.filter(r => !usedSettlementIds.has(r.id));

    // --- STEP 2: MULTI-LEVEL PAIRWISE CANDIDATE SCORING ---
    const scorePair = (
      recA: CanonicalFinancialRecord,
      recB: CanonicalFinancialRecord,
      sourceA: SourceType,
      sourceB: SourceType
    ): ScoredPair | null => {
      const refA = recA.normalizedReference;
      const refB = recB.normalizedReference;
      const amountDiff = Math.abs(recA.amount - recB.amount);
      const isAmountMatch = amountDiff <= amountTolerance;
      const dateDiff = calculateDateDifferenceInDays(recA.date, recB.date) ?? 0;
      const isDateWithinTolerance = dateDiff <= dateToleranceDays;

      const evidence: MatchingEvidence[] = [];
      let score = 0;
      let level = 99;
      let method: MatchingMethodType = 'AMBIGUOUS';

      // Level 1: Exact Reference Match
      if (refA && refB && refA === refB) {
        level = 1;
        method = 'EXACT_ID';
        score += 60;
        evidence.push({
          type: 'EXACT_REFERENCE',
          description: `Exact matching reference "${recA.rawReference}" across ${sourceA} and ${sourceB}.`,
          score: 60,
        });

        if (isAmountMatch) {
          score += 30;
          evidence.push({
            type: 'EXACT_AMOUNT',
            description: `Amounts match (${recA.amount.toFixed(2)} vs ${recB.amount.toFixed(2)}).`,
            score: 30,
          });
        } else {
          score -= 10;
          evidence.push({
            type: 'AMOUNT_VARIANCE',
            description: `Amount difference of ${amountDiff.toFixed(2)} between ${sourceA} (${recA.amount.toFixed(2)}) and ${sourceB} (${recB.amount.toFixed(2)}).`,
            score: -10,
          });
        }

        if (isDateWithinTolerance) {
          score += 10;
          evidence.push({
            type: 'DATE_AGREEMENT',
            description: `Dates are within tolerance (${dateDiff} day delta).`,
            score: 10,
          });
        }

        return { sourceA, recordA: recA, sourceB, recordB: recB, level, method, score: Math.min(100, Math.max(0, score)), amountDiff, dateDiffDays: dateDiff, evidence };
      }

      // Level 2: Strong Sub-Reference Match + Amount Match
      if (refA && refB && hasStrongSubReferenceMatch(refA, refB) && isAmountMatch) {
        level = 2;
        method = 'REFERENCE_AMOUNT';
        score = 80;
        evidence.push({
          type: 'SUB_REFERENCE_MATCH',
          description: `Strong sub-identifier correlation between "${recA.rawReference}" and "${recB.rawReference}".`,
          score: 50,
        });
        evidence.push({
          type: 'EXACT_AMOUNT',
          description: `Amounts match exactly (${recA.amount.toFixed(2)}).`,
          score: 30,
        });
        if (isDateWithinTolerance) {
          score += 10;
          evidence.push({ type: 'DATE_AGREEMENT', description: `Dates within ${dateDiff} days.`, score: 10 });
        }
        return { sourceA, recordA: recA, sourceB, recordB: recB, level, method, score: Math.min(100, score), amountDiff, dateDiffDays: dateDiff, evidence };
      }

      // Level 3: Amount + Exact Date Match (when references differ or are generic)
      if (isAmountMatch && dateDiff === 0 && (sensitivity !== 'strict')) {
        level = 3;
        method = 'AMOUNT_DATE';
        score = 65;
        evidence.push({
          type: 'AMOUNT_EXACT_DATE',
          description: `Identical amount (${recA.amount.toFixed(2)}) and same transaction date.`,
          score: 65,
        });
        if (recA.customer && recB.customer && recA.customer.toLowerCase() === recB.customer.toLowerCase()) {
          score += 20;
          evidence.push({ type: 'CUSTOMER_MATCH', description: `Matching customer "${recA.customer}".`, score: 20 });
        }
        return { sourceA, recordA: recA, sourceB, recordB: recB, level, method, score: Math.min(100, score), amountDiff, dateDiffDays: dateDiff, evidence };
      }

      // Level 4: Amount + Date within tolerance
      if (isAmountMatch && isDateWithinTolerance && (sensitivity === 'relaxed')) {
        level = 4;
        method = 'AMOUNT_DATE';
        score = 55;
        evidence.push({
          type: 'AMOUNT_DATE_WINDOW',
          description: `Identical amount (${recA.amount.toFixed(2)}) within ${dateDiff} day date window.`,
          score: 55,
        });
        return { sourceA, recordA: recA, sourceB, recordB: recB, level, method, score: Math.min(100, score), amountDiff, dateDiffDays: dateDiff, evidence };
      }

      // Level 5: Fuzzy Reference Similarity + Amount Match
      if (refA && refB && isAmountMatch) {
        const similarity = calculateStringSimilarity(refA, refB);
        if (similarity >= 0.75) {
          level = 5;
          method = 'FUZZY_REFERENCE';
          score = Math.round(similarity * 80);
          evidence.push({
            type: 'FUZZY_REFERENCE',
            description: `Reference similarity of ${Math.round(similarity * 100)}% between "${recA.rawReference}" and "${recB.rawReference}".`,
            score: score,
          });
          evidence.push({
            type: 'EXACT_AMOUNT',
            description: `Amounts match exactly (${recA.amount.toFixed(2)}).`,
            score: 20,
          });
          return { sourceA, recordA: recA, sourceB, recordB: recB, level, method, score: Math.min(100, score + 20), amountDiff, dateDiffDays: dateDiff, evidence };
        }
      }

      // Level 6: Metadata Composite
      if (
        isAmountMatch &&
        recA.customer &&
        recB.customer &&
        recA.customer.toLowerCase() === recB.customer.toLowerCase() &&
        recA.paymentMethod &&
        recB.paymentMethod &&
        recA.paymentMethod.toLowerCase() === recB.paymentMethod.toLowerCase()
      ) {
        level = 6;
        method = 'METADATA_COMPOSITE';
        score = 60;
        evidence.push({
          type: 'METADATA_MATCH',
          description: `Matched customer "${recA.customer}" and payment method "${recA.paymentMethod}".`,
          score: 60,
        });
        return { sourceA, recordA: recA, sourceB, recordB: recB, level, method, score, amountDiff, dateDiffDays: dateDiff, evidence };
      }

      return null;
    };

    // --- STEP 3: CROSS-SOURCE 3-WAY GRAPH RESOLUTION ---
    // Primary grouping: Merchant <-> Settlement and Merchant <-> Bank and Bank <-> Settlement
    // Find all matching pairs and sort by score descending
    const allPairs: ScoredPair[] = [];

    // Merchant <-> Bank
    for (const m of availMerchant) {
      for (const b of availBank) {
        const pair = scorePair(m, b, 'MERCHANT', 'BANK');
        if (pair) allPairs.push(pair);
      }
    }

    // Merchant <-> Settlement
    for (const m of availMerchant) {
      for (const s of availSettlement) {
        const pair = scorePair(m, s, 'MERCHANT', 'SETTLEMENT');
        if (pair) allPairs.push(pair);
      }
    }

    // Bank <-> Settlement
    for (const b of availBank) {
      for (const s of availSettlement) {
        const pair = scorePair(b, s, 'BANK', 'SETTLEMENT');
        if (pair) allPairs.push(pair);
      }
    }

    // Sort all pairs by score DESC and level ASC
    allPairs.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return b.score - a.score;
    });

    // Helper map for building 3-way clusters
    interface TripletCluster {
      bank?: CanonicalFinancialRecord;
      merchant?: CanonicalFinancialRecord;
      settlement?: CanonicalFinancialRecord;
      evidence: MatchingEvidence[];
      methods: MatchingMethodType[];
      scores: number[];
    }

    const clusters: TripletCluster[] = [];
    const assignedBank = new Map<string, TripletCluster>();
    const assignedMerchant = new Map<string, TripletCluster>();
    const assignedSettlement = new Map<string, TripletCluster>();

    for (const pair of allPairs) {
      let recB: CanonicalFinancialRecord | undefined = pair.sourceA === 'BANK' ? pair.recordA : pair.sourceB === 'BANK' ? pair.recordB : undefined;
      let recM: CanonicalFinancialRecord | undefined = pair.sourceA === 'MERCHANT' ? pair.recordA : pair.sourceB === 'MERCHANT' ? pair.recordB : undefined;
      let recS: CanonicalFinancialRecord | undefined = pair.sourceA === 'SETTLEMENT' ? pair.recordA : pair.sourceB === 'SETTLEMENT' ? pair.recordB : undefined;

      const clusterB = recB ? assignedBank.get(recB.id) : undefined;
      const clusterM = recM ? assignedMerchant.get(recM.id) : undefined;
      const clusterS = recS ? assignedSettlement.get(recS.id) : undefined;

      // Avoid contradictory merging if both already assigned to distinct clusters
      const existingClusters = [clusterB, clusterM, clusterS].filter(Boolean) as TripletCluster[];
      const uniqueExisting = Array.from(new Set(existingClusters));

      if (uniqueExisting.length > 1) {
        // Conflict between two already established clusters; skip to avoid invalid multi-assignment
        continue;
      }

      let targetCluster = uniqueExisting[0];

      if (!targetCluster) {
        targetCluster = {
          bank: recB,
          merchant: recM,
          settlement: recS,
          evidence: [...pair.evidence],
          methods: [pair.method],
          scores: [pair.score],
        };
        clusters.push(targetCluster);
      } else {
        // Merge into existing cluster if slot is empty
        if (recB && !targetCluster.bank) targetCluster.bank = recB;
        else if (recB && targetCluster.bank && targetCluster.bank.id !== recB.id) continue;

        if (recM && !targetCluster.merchant) targetCluster.merchant = recM;
        else if (recM && targetCluster.merchant && targetCluster.merchant.id !== recM.id) continue;

        if (recS && !targetCluster.settlement) targetCluster.settlement = recS;
        else if (recS && targetCluster.settlement && targetCluster.settlement.id !== recS.id) continue;

        targetCluster.evidence.push(...pair.evidence);
        targetCluster.methods.push(pair.method);
        targetCluster.scores.push(pair.score);
      }

      if (recB) assignedBank.set(recB.id, targetCluster);
      if (recM) assignedMerchant.set(recM.id, targetCluster);
      if (recS) assignedSettlement.set(recS.id, targetCluster);
    }

    // Convert resolved clusters into CandidateGroups and classify them
    for (const cl of clusters) {
      const b = cl.bank;
      const m = cl.merchant;
      const s = cl.settlement;

      if (b) usedBankIds.add(b.id);
      if (m) usedMerchantIds.add(m.id);
      if (s) usedSettlementIds.add(s.id);

      const avgScore = cl.scores.length > 0 ? Math.round(cl.scores.reduce((sum, v) => sum + v, 0) / cl.scores.length) : 50;
      const primaryMethod = cl.methods[0] || 'EXACT_ID';

      // Determine amounts
      const bAmt = b?.amount;
      const mAmt = m?.amount;
      const sAmt = s?.amount;
      const sNet = s?.netAmount ?? sAmt;
      const sFee = s?.fee ?? 0;

      // Date calculations
      const txnDate = m?.date || b?.date;
      const settleDate = s?.date;
      const dateDiff = calculateDateDifferenceInDays(txnDate, settleDate) ?? 0;

      let classification: ClassificationType = 'MATCHED';
      let explanation = '';
      let recommendedAction = '';
      let confidence = avgScore;
      let financialDiff = 0;

      // Classification Logic
      if (m && b && s) {
        // All 3 sources present
        const merchantBankDiff = Math.abs(m.amount - b.amount);
        const merchantSettleDiff = Math.abs(m.amount - (sNet + sFee));

        if (merchantBankDiff > amountTolerance || Math.abs(m.amount - sAmt) > (amountTolerance + sFee)) {
          // Amount mismatch
          classification = 'AMOUNT_MISMATCH';
          financialDiff = Math.max(merchantBankDiff, Math.abs(m.amount - sAmt));
          confidence = Math.min(confidence, 88);
          explanation = `Transaction reference identified across Bank ($${b.amount.toFixed(2)}), Merchant ($${m.amount.toFixed(2)}), and Settlement ($${s.amount.toFixed(2)}), but values differ by $${financialDiff.toFixed(2)}.`;
          recommendedAction = `Investigate discrepancy between Merchant invoice amount ($${m.amount.toFixed(2)}) and Bank deposit ($${b.amount.toFixed(2)}).`;
        } else if (dateDiff > dateToleranceDays) {
          // Timing Discrepancy
          classification = 'TIMING_DISCREPANCY';
          financialDiff = 0;
          confidence = 90;
          explanation = `Transaction settled on ${settleDate?.toISOString().split('T')[0]}, which is ${dateDiff} days after transaction date ${txnDate?.toISOString().split('T')[0]} (exceeding tolerance of ${dateToleranceDays} days).`;
          recommendedAction = `Review payout cycle and gateway settlement SLA for delay reason.`;
        } else if (sFee > 0 && Math.abs(sNet + sFee - m.amount) <= amountTolerance) {
          // Settled with fee deduction
          classification = 'MATCHED';
          financialDiff = 0;
          confidence = Math.max(confidence, 95);
          explanation = `Fully reconciled across all 3 sources. Merchant gross ($${m.amount.toFixed(2)}) matches Bank ($${b.amount.toFixed(2)}) with standard gateway fee ($${sFee.toFixed(2)}) deducted.`;
          recommendedAction = `None required. Record fully verified.`;
        } else if (sAmt < m.amount && sFee === 0) {
          // Partial Settlement
          classification = 'PARTIAL_SETTLEMENT';
          financialDiff = Math.abs(m.amount - sAmt);
          confidence = 82;
          explanation = `Settlement amount ($${sAmt.toFixed(2)}) is lower than Merchant order ($${m.amount.toFixed(2)}) without documented fee deduction.`;
          recommendedAction = `Verify whether an adjustment, refund, or partial tranche occurred.`;
        } else {
          // Fully Matched
          classification = 'MATCHED';
          financialDiff = 0;
          confidence = Math.max(confidence, 96);
          explanation = `Exact 3-way match across Bank, Merchant, and Settlement sources with zero financial variance.`;
          recommendedAction = `None required. Reconciled successfully.`;
        }
      } else if (m && b && !s) {
        // Missing Settlement
        const mbDiff = Math.abs(m.amount - b.amount);
        if (mbDiff <= amountTolerance) {
          classification = 'MISSING_SETTLEMENT';
          financialDiff = m.amount;
          confidence = 92;
          explanation = `Merchant ledger ($${m.amount.toFixed(2)}) and Bank statement ($${b.amount.toFixed(2)}) match, but no Settlement report record exists.`;
          recommendedAction = `Contact payment gateway provider to request missing settlement batch for reference "${m.rawReference}".`;
        } else {
          classification = 'AMOUNT_MISMATCH';
          financialDiff = mbDiff;
          confidence = 78;
          explanation = `Bank ($${b.amount.toFixed(2)}) and Merchant ($${m.amount.toFixed(2)}) matched with amount difference of $${mbDiff.toFixed(2)}, missing Settlement report.`;
          recommendedAction = `Investigate amount discrepancy and request missing settlement record.`;
        }
      } else if (m && s && !b) {
        // Merchant + Settlement matched, but missing Bank deposit
        const msDiff = Math.abs(m.amount - (sNet + sFee));
        classification = 'MISSING';
        financialDiff = m.amount;
        confidence = 85;
        explanation = `Merchant order and Settlement report matched ($${m.amount.toFixed(2)}), but no corresponding Bank deposit found.`;
        recommendedAction = `Check bank ledger for pending deposit or batch transfer reference.`;
      } else if (b && s && !m) {
        // Bank + Settlement matched, missing Merchant record
        classification = 'MISSING';
        financialDiff = b.amount;
        confidence = 85;
        explanation = `Bank deposit ($${b.amount.toFixed(2)}) and Settlement ($${s.amount.toFixed(2)}) matched, but missing in Merchant ledger.`;
        recommendedAction = `Verify whether an unrecorded direct payment or standalone transaction occurred.`;
      } else {
        // Single source only
        classification = 'MISSING';
        const single = m || b || s!;
        financialDiff = single.amount;
        confidence = 95;
        explanation = `Record present only in ${single.sourceType} with no corresponding transactions in other sources.`;
        recommendedAction = `Trace transaction reference "${single.rawReference}" in other financial ledgers.`;
      }

      results.push({
        bankRecord: b,
        merchantRecord: m,
        settlementRecord: s,
        classification,
        confidenceScore: confidence,
        matchingMethod: primaryMethod,
        evidence: cl.evidence,
        explanation,
        recommendedAction,
        financialDifference: Math.round(financialDiff * 100) / 100,
        feeAmount: sFee,
        netSettlementAmount: sNet,
        dateDifferenceDays: dateDiff,
      });
    }

    // --- STEP 4: UNMATCHED SINGLE RECORDS (MISSING) ---
    const addMissingRecords = (records: CanonicalFinancialRecord[], source: SourceType) => {
      for (const rec of records) {
        let isUsed = false;
        if (source === 'BANK') isUsed = usedBankIds.has(rec.id);
        if (source === 'MERCHANT') isUsed = usedMerchantIds.has(rec.id);
        if (source === 'SETTLEMENT') isUsed = usedSettlementIds.has(rec.id);

        if (!isUsed) {
          results.push({
            bankRecord: source === 'BANK' ? rec : undefined,
            merchantRecord: source === 'MERCHANT' ? rec : undefined,
            settlementRecord: source === 'SETTLEMENT' ? rec : undefined,
            classification: 'MISSING',
            confidenceScore: 95,
            matchingMethod: 'AMBIGUOUS',
            evidence: [
              {
                type: 'SINGLE_SOURCE_UNMATCHED',
                description: `Transaction reference "${rec.rawReference}" exists solely in ${source}.`,
                score: 95,
              },
            ],
            explanation: `No candidate match found in other financial sources for reference "${rec.rawReference}" (${rec.amount.toFixed(2)}).`,
            recommendedAction: `Verify whether this transaction was cancelled, delayed, or posted in a different period.`,
            financialDifference: rec.amount,
          });
        }
      }
    };

    addMissingRecords(availBank, 'BANK');
    addMissingRecords(availMerchant, 'MERCHANT');
    addMissingRecords(availSettlement, 'SETTLEMENT');

    // --- STEP 5: INVALID RECORDS (REVIEW_REQUIRED) ---
    for (const inv of invalidRecords) {
      results.push({
        bankRecord: inv.sourceType === 'BANK' ? inv : undefined,
        merchantRecord: inv.sourceType === 'MERCHANT' ? inv : undefined,
        settlementRecord: inv.sourceType === 'SETTLEMENT' ? inv : undefined,
        classification: 'REVIEW_REQUIRED',
        confidenceScore: 30,
        matchingMethod: 'AMBIGUOUS',
        evidence: [
          {
            type: 'PARSING_VALIDATION_ERROR',
            description: inv.validationError || 'Invalid financial data in row',
            score: 30,
          },
        ],
        explanation: `Row ${inv.rowNumber} in ${inv.sourceType} failed financial validation: ${inv.validationError || 'Unknown validation failure'}.`,
        recommendedAction: `Review and correct the source data in ${inv.sourceType} file at row ${inv.rowNumber}.`,
        financialDifference: inv.amount || 0,
      });
    }

    return results;
  }
}
