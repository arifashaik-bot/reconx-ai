import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { config } from '../config/index.js';

export class AiAnalystService {
  private static prisma = new PrismaClient();

  public static async analyze(runId: string, userQuery: string): Promise<{
    answer: string;
    suggestedFollowups: string[];
    isAiGenerated: boolean;
    referencedCases: any[];
  }> {
    const run = await this.prisma.reconciliationRun.findUnique({
      where: { id: runId },
      include: {
        cases: {
          take: 50,
          orderBy: { financialDifference: 'desc' },
          include: { sourceRecords: true },
        },
        exceptions: {
          take: 30,
          orderBy: { difference: 'desc' },
        },
        settlementInsights: true,
      },
    });

    if (!run) {
      return {
        answer: 'No active reconciliation run was found. Please upload financial files or run demo mode to perform analysis.',
        suggestedFollowups: ['Start a new reconciliation run', 'Explore demo dataset'],
        isAiGenerated: false,
        referencedCases: [],
      };
    }

    // Extract key real metrics
    const total = run.totalCases;
    const matched = run.matchedCount;
    const exceptions = run.amountMismatchCount + run.missingCount + run.missingSettlementCount + run.duplicateCount + run.partialSettlementCount + run.reviewRequiredCount;
    const matchRate = total > 0 ? ((matched / total) * 100).toFixed(1) : '0';
    const topDiscrepancies = run.cases.filter(c => c.financialDifference > 0).slice(0, 5);

    // Check if query is looking for a specific reference
    const refMatch = userQuery.match(/(?:TXN|INV|REF|ORD|SETTLE|ORDER|PAY)-?[A-Z0-9_-]+/i);
    let specificCase: any = null;

    if (refMatch) {
      const searchedRef = refMatch[0].toUpperCase();
      specificCase = await this.prisma.reconciledCase.findFirst({
        where: {
          runId,
          OR: [
            { primaryReference: { contains: searchedRef } },
            { caseNumber: { contains: searchedRef } },
          ],
        },
        include: { sourceRecords: true },
      });
    }

    // If OpenAI API key is configured, use OpenAI with strict grounding
    if (config.openai.apiKey) {
      try {
        const openai = new OpenAI({ apiKey: config.openai.apiKey });

        const systemPrompt = `You are RECONX AI Senior Financial Reconciliation Analyst.
Your goal is to provide accurate, grounded financial analysis based strictly on the current reconciliation database provided in context.

RULES:
1. NEVER invent transaction references, amounts, dates, or calculations.
2. Ground all answers in the provided reconciliation run data.
3. Be concise, professional, structured, and action-oriented for financial controllers.
4. Format output using clear markdown with bullet points and bold financial metrics.`;

        const contextData = {
          runName: run.name,
          totalTransactions: total,
          matchedCount: matched,
          matchRate: `${matchRate}%`,
          amountMismatches: run.amountMismatchCount,
          missingSettlements: run.missingSettlementCount,
          duplicates: run.duplicateCount,
          timingDiscrepancies: run.timingDiscrepancyCount,
          partialSettlements: run.partialSettlementCount,
          reviewRequired: run.reviewRequiredCount,
          grossMerchantAmount: `$${run.grossMerchantAmount.toFixed(2)}`,
          grossBankAmount: `$${run.grossBankAmount.toFixed(2)}`,
          grossSettlementAmount: `$${run.grossSettlementAmount.toFixed(2)}`,
          totalFees: `$${run.totalFees.toFixed(2)}`,
          totalDifference: `$${run.totalDifference.toFixed(2)}`,
          topDiscrepancies: topDiscrepancies.map(d => ({
            ref: d.primaryReference,
            classification: d.classification,
            bankAmount: d.bankAmount ? `$${d.bankAmount.toFixed(2)}` : 'N/A',
            merchantAmount: d.merchantAmount ? `$${d.merchantAmount.toFixed(2)}` : 'N/A',
            settlementAmount: d.settlementAmount ? `$${d.settlementAmount.toFixed(2)}` : 'N/A',
            diff: `$${d.financialDifference.toFixed(2)}`,
            explanation: d.explanation,
          })),
          specificCaseFound: specificCase ? {
            ref: specificCase.primaryReference,
            classification: specificCase.classification,
            confidence: `${specificCase.confidenceScore}%`,
            bank: specificCase.bankAmount,
            merchant: specificCase.merchantAmount,
            settlement: specificCase.settlementAmount,
            diff: specificCase.financialDifference,
            explanation: specificCase.explanation,
            action: specificCase.recommendedAction,
          } : null,
        };

        const completion = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Reconciliation Run Context: ${JSON.stringify(contextData, null, 2)}\n\nUser Question: ${userQuery}` },
          ],
          temperature: 0.1,
        });

        const answer = completion.choices[0]?.message?.content || '';

        return {
          answer,
          suggestedFollowups: [
            'What are the highest risk exceptions?',
            'How can we resolve missing settlements?',
            'Summarize total fee deductions across gateways',
          ],
          isAiGenerated: true,
          referencedCases: topDiscrepancies,
        };
      } catch (err) {
        console.warn('OpenAI API call failed, falling back to deterministic AI analysis engine:', err);
      }
    }

    // --- DETERMINISTIC FINANCIAL AI ENGINE ---
    const qLower = userQuery.toLowerCase();
    let answer = '';
    const suggestedFollowups: string[] = [];

    if (specificCase) {
      answer = `### 🔍 Investigation for Reference **${specificCase.primaryReference}**

- **Classification:** \`${specificCase.classification}\` (Confidence: **${specificCase.confidenceScore}%**)
- **Matching Method:** ${specificCase.matchingMethod}
- **Financial Status:**
  - **Merchant Ledger:** ${specificCase.merchantAmount !== null ? `$${specificCase.merchantAmount.toFixed(2)}` : '⚠️ Missing'}
  - **Bank Statement:** ${specificCase.bankAmount !== null ? `$${specificCase.bankAmount.toFixed(2)}` : '⚠️ Missing'}
  - **Settlement Report:** ${specificCase.settlementAmount !== null ? `$${specificCase.settlementAmount.toFixed(2)}` : '⚠️ Missing'}
  - **Variance / Exposure:** **$${specificCase.financialDifference.toFixed(2)}**

#### Evidence & Analysis:
${specificCase.explanation}

#### Recommended Action:
👉 ${specificCase.recommendedAction || 'Review transaction details in the Exceptions center.'}`;

      suggestedFollowups.push('Summarize all other exceptions', 'Show top financial discrepancies', 'Explain overall reconciliation match rate');
      return { answer, suggestedFollowups, isAiGenerated: false, referencedCases: [specificCase] };
    }

    if (qLower.includes('match') || qLower.includes('rate') || qLower.includes('health') || qLower.includes('overview') || qLower.includes('summary')) {
      answer = `### 📊 Reconciliation Health & Match Rate Analysis

In the current run (**${run.name}**), **${total} total reconciliation cases** were evaluated:

- **Reconciliation Match Rate:** **${matchRate}%** (${matched} fully or likely matched transactions)
- **Total Exceptions Identified:** **${exceptions} cases**
- **Total Financial Difference:** **$${run.totalDifference.toFixed(2)}**

#### Source Volume Comparison:
- **Merchant Gross Collections:** **$${run.grossMerchantAmount.toFixed(2)}**
- **Bank Deposited Total:** **$${run.grossBankAmount.toFixed(2)}**
- **Settlement Net Payouts:** **$${run.netSettlementAmount.toFixed(2)}**
- **Gateway Fees Deducted:** **$${run.totalFees.toFixed(2)}**

${exceptions > 0 ? `⚠️ **Key Attention Areas:** There are ${run.amountMismatchCount} amount mismatches, ${run.missingSettlementCount} missing settlement reports, and ${run.duplicateCount} duplicate entries requiring action.` : '✅ All source records reconciled with zero unresolved variances.'}`;

      suggestedFollowups.push('Show highest value discrepancies', 'Explain missing settlement cases', 'Show duplicate record breakdown');
    } else if (qLower.includes('exception') || qLower.includes('discrepanc') || qLower.includes('mismatch') || qLower.includes('risk')) {
      answer = `### ⚠️ Exception & Financial Discrepancy Breakdown

A total of **${exceptions} exceptions** are currently open with a combined financial variance of **$${run.totalDifference.toFixed(2)}**:

1. **Amount Mismatches (${run.amountMismatchCount} cases):**
   Discrepancies where transaction identifiers matched, but invoice/bank/settlement values differed.
2. **Missing Settlements (${run.missingSettlementCount} cases):**
   Orders verified in Merchant & Bank ledgers but missing from the Payment Gateway settlement file.
3. **Duplicate Entries (${run.duplicateCount} cases):**
   Identical reference and amount combinations recorded more than once in the same source.
4. **Timing Discrepancies (${run.timingDiscrepancyCount} cases):**
   Settlements delayed beyond the ${run.dateToleranceDays}-day tolerance threshold.
5. **Partial Settlements (${run.partialSettlementCount} cases):**
   Settlement payouts lower than sales volume without explicit fee deduction breakdowns.

#### Top High-Value Discrepancy Cases:
${topDiscrepancies.length > 0 ? topDiscrepancies.map((d, i) => `${i + 1}. **${d.primaryReference || d.caseNumber}** — \`${d.classification}\` | Difference: **$${d.financialDifference.toFixed(2)}** (${d.explanation})`).join('\n') : 'No high-value discrepancies.'}`;

      suggestedFollowups.push('How can I resolve these exceptions?', 'Explain missing settlement cases', 'Investigate highest discrepancy transaction');
    } else if (qLower.includes('settle') || qLower.includes('payout') || qLower.includes('fee') || qLower.includes('delay')) {
      answer = `### 💳 Settlement & Cash Flow Intelligence

- **Gross Merchant Volume:** **$${run.grossMerchantAmount.toFixed(2)}**
- **Net Settlements Received:** **$${run.netSettlementAmount.toFixed(2)}**
- **Total Gateway & Processing Fees:** **$${run.totalFees.toFixed(2)}** (${run.grossMerchantAmount > 0 ? ((run.totalFees / run.grossMerchantAmount) * 100).toFixed(2) : 0}% effective fee rate)
- **Pending / Missing Settlements:** **$${topDiscrepancies.filter(d => d.classification === 'MISSING_SETTLEMENT').reduce((s, c) => s + c.financialDifference, 0).toFixed(2)}**

#### Recommendations:
- Contact payment gateway providers for pending settlement batches.
- Audit MDR rates against merchant contract agreements.`;

      suggestedFollowups.push('Summarize all exceptions', 'Check transaction timing delays', 'Export reconciliation report');
    } else {
      answer = `### 💡 RECONX AI Summary for Current Run

- **Total Cases Processed:** **${total}**
- **Matched Rate:** **${matchRate}%** (${matched} matched)
- **Total Exceptions:** **${exceptions}** (${run.amountMismatchCount} amount mismatches, ${run.missingSettlementCount} missing settlements, ${run.duplicateCount} duplicates)
- **Financial Exposure:** **$${run.totalDifference.toFixed(2)}**

You can ask me to:
- **"Explain match rate and health"**
- **"Show top financial discrepancies"**
- **"Explain missing settlement cases"**
- **"Investigate transaction <REF_ID>"**`;

      suggestedFollowups.push('Explain match rate and health', 'Show top financial discrepancies', 'Explain missing settlement cases');
    }

    return {
      answer,
      suggestedFollowups,
      isAiGenerated: false,
      referencedCases: topDiscrepancies,
    };
  }
}
