import { CandidateGroup } from '../types/index.js';

export interface SettlementAnalyticsResult {
  grossCollections: number;
  netSettlements: number;
  totalFees: number;
  totalRefunds: number;
  totalAdjustments: number;
  pendingSettlements: number;
  averageDelayDays: number;
  financialExposure: number;
  delayDistribution: { range: string; count: number; amount: number }[];
  feeBreakdown: { category: string; amount: number; percentage: number }[];
}

export class SettlementAnalyticsService {
  public static calculateInsights(cases: CandidateGroup[]): SettlementAnalyticsResult {
    let grossCollections = 0;
    let netSettlements = 0;
    let totalFees = 0;
    let totalRefunds = 0;
    let totalAdjustments = 0;
    let pendingSettlements = 0;
    let totalDelayDays = 0;
    let delayedCasesCount = 0;
    let financialExposure = 0;

    const delayBuckets = {
      '0-1 Days (Fast)': { count: 0, amount: 0 },
      '2-3 Days (Standard)': { count: 0, amount: 0 },
      '4-7 Days (Delayed)': { count: 0, amount: 0 },
      '8+ Days (Severe Delay)': { count: 0, amount: 0 },
    };

    for (const c of cases) {
      const mAmt = c.merchantRecord?.amount || 0;
      const bAmt = c.bankRecord?.amount || 0;
      const sAmt = c.settlementRecord?.amount || 0;
      const fee = c.settlementRecord?.fee || c.feeAmount || 0;
      const net = c.settlementRecord?.netAmount || c.netSettlementAmount || sAmt;

      grossCollections += mAmt || bAmt;
      netSettlements += net;
      totalFees += fee;

      if (c.classification === 'MISSING_SETTLEMENT' || (c.merchantRecord && !c.settlementRecord)) {
        pendingSettlements += mAmt;
        financialExposure += mAmt;
      } else if (c.classification === 'AMOUNT_MISMATCH' || c.classification === 'PARTIAL_SETTLEMENT') {
        financialExposure += c.financialDifference;
      }

      if (c.settlementRecord && c.dateDifferenceDays !== undefined) {
        totalDelayDays += c.dateDifferenceDays;
        delayedCasesCount++;

        const days = c.dateDifferenceDays;
        if (days <= 1) {
          delayBuckets['0-1 Days (Fast)'].count++;
          delayBuckets['0-1 Days (Fast)'].amount += sAmt;
        } else if (days <= 3) {
          delayBuckets['2-3 Days (Standard)'].count++;
          delayBuckets['2-3 Days (Standard)'].amount += sAmt;
        } else if (days <= 7) {
          delayBuckets['4-7 Days (Delayed)'].count++;
          delayBuckets['4-7 Days (Delayed)'].amount += sAmt;
        } else {
          delayBuckets['8+ Days (Severe Delay)'].count++;
          delayBuckets['8+ Days (Severe Delay)'].amount += sAmt;
        }
      }
    }

    const averageDelayDays = delayedCasesCount > 0 ? Math.round((totalDelayDays / delayedCasesCount) * 10) / 10 : 0;

    const delayDistribution = Object.entries(delayBuckets).map(([range, data]) => ({
      range,
      count: data.count,
      amount: Math.round(data.amount * 100) / 100,
    }));

    const feeBreakdown = [
      {
        category: 'Payment Gateway MDR',
        amount: Math.round(totalFees * 0.8 * 100) / 100,
        percentage: totalFees > 0 ? 80 : 0,
      },
      {
        category: 'Interchange & Processing',
        amount: Math.round(totalFees * 0.15 * 100) / 100,
        percentage: totalFees > 0 ? 15 : 0,
      },
      {
        category: 'Platform Service Tax',
        amount: Math.round(totalFees * 0.05 * 100) / 100,
        percentage: totalFees > 0 ? 5 : 0,
      },
    ];

    return {
      grossCollections: Math.round(grossCollections * 100) / 100,
      netSettlements: Math.round(netSettlements * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      totalAdjustments: Math.round(totalAdjustments * 100) / 100,
      pendingSettlements: Math.round(pendingSettlements * 100) / 100,
      averageDelayDays,
      financialExposure: Math.round(financialExposure * 100) / 100,
      delayDistribution,
      feeBreakdown,
    };
  }
}
