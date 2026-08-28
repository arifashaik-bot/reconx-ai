import { ColumnMappingResult, SourceType } from '../types/index.js';
import { parseFinancialAmount } from '../utils/amountParser.js';
import { parseFinancialDate } from '../utils/dateParser.js';

interface HeaderPattern {
  name: string;
  weight: number;
  pattern: RegExp;
  excludePattern?: RegExp;
}

export class ColumnMapperService {
  /**
   * Analyzes headers and row samples to dynamically map columns to financial concepts.
   * Works generically across any naming conventions, currencies, and source formats.
   */
  public static detectMapping(
    sourceType: SourceType,
    headers: string[],
    sampleRows: Record<string, any>[]
  ): ColumnMappingResult {
    const detected: Record<string, string> = {};
    const warnings: string[] = [];

    // Normalize header strings: remove punctuation, collapse underscores, trim currency tokens
    const normHeaders = headers.map((h) => {
      let clean = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      // Collapse multiple underscores
      clean = clean.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
      // Strip common currency wrappers: amount_usd -> amount, total_inr -> total
      const cleanWithoutCurrency = clean.replace(/_(?:usd|inr|eur|gbp|aud|cad|jpy|chf|cny|rs|inr)$/i, '');
      return {
        original: h,
        clean,
        cleanWithoutCurrency,
      };
    });

    // Helper to evaluate column score based on header patterns and actual row data validity
    const evaluateColumn = (
      concept: string,
      patterns: HeaderPattern[],
      expectedType: 'string' | 'number' | 'date',
      customExclude?: RegExp
    ): { column?: string; score: number } => {
      let bestCol: string | undefined;
      let bestScore = -1;

      for (const h of normHeaders) {
        if (customExclude && (customExclude.test(h.clean) || customExclude.test(h.cleanWithoutCurrency))) {
          continue;
        }

        let score = 0;
        let matched = false;

        for (const p of patterns) {
          if (p.excludePattern && (p.excludePattern.test(h.clean) || p.excludePattern.test(h.cleanWithoutCurrency))) {
            continue;
          }
          if (p.pattern.test(h.clean) || p.pattern.test(h.cleanWithoutCurrency)) {
            score += p.weight;
            matched = true;
            break;
          }
        }

        // If not matched by pattern, skip unless we do data-driven fallback later
        if (!matched && patterns.length > 0) {
          continue;
        }

        // Validate data types in sample rows
        if (sampleRows.length > 0) {
          let validCount = 0;
          let testCount = Math.min(sampleRows.length, 30);

          for (let i = 0; i < testCount; i++) {
            const val = sampleRows[i][h.original];
            if (val === undefined || val === null || val === '') continue;

            if (expectedType === 'number') {
              const res = parseFinancialAmount(val);
              if (res.isValid) validCount++;
            } else if (expectedType === 'date') {
              const res = parseFinancialDate(val);
              if (res.isValid) validCount++;
            } else if (expectedType === 'string') {
              const strVal = String(val).trim();
              if (strVal.length > 0) validCount++;
            }
          }

          const ratio = validCount / testCount;
          if (ratio > 0.5) {
            score += ratio * 25;
          } else if (expectedType === 'number' || expectedType === 'date') {
            score -= 40; // Penalize heavily if column is expected to be numeric/date but has invalid data
          }
        }

        if (score > bestScore && score > 0) {
          bestScore = score;
          bestCol = h.original;
        }
      }

      return { column: bestCol, score: bestScore };
    };

    // Helper for fallback data-driven numeric column detection
    const findBestNumericColumn = (excludedCols: Set<string>): string | undefined => {
      let candidate: string | undefined;
      let highestRatio = 0;

      for (const h of normHeaders) {
        if (excludedCols.has(h.original)) continue;
        if (/id|date|time|status|type|customer|name|channel|method|narration|desc/i.test(h.clean)) continue;

        let validCount = 0;
        let testCount = Math.min(sampleRows.length, 30);
        for (let i = 0; i < testCount; i++) {
          const val = sampleRows[i][h.original];
          if (val === undefined || val === null || val === '') continue;
          const res = parseFinancialAmount(val);
          if (res.isValid && res.value > 0) validCount++;
        }

        const ratio = testCount > 0 ? validCount / testCount : 0;
        if (ratio > 0.6 && ratio > highestRatio) {
          highestRatio = ratio;
          candidate = h.original;
        }
      }

      return candidate;
    };

    // 1. Reference / Identifier
    const refPatterns: HeaderPattern[] = [
      {
        name: 'exact_id',
        weight: 60,
        pattern: /^(?:transaction_id|txn_id|trans_id|reference|reference_no|ref_no|ref_num|ref_id|order_id|order_no|payment_id|settlement_id|utr|payout_id|arn|invoice_id|order_identifier|payout_ref|bank_reference|txn_reference|payment_ref|transaction_ref|order_ref|receipt_no|tracking_id)$/i,
      },
      {
        name: 'id_contains',
        weight: 40,
        pattern: /(?:ref|txn|trans|order|payment|settlement|payout|invoice|receipt|tracking|utr|arn|identifier)[_\s]*(?:id|no|num|code|reference|ref)?/i,
        excludePattern: /(?:status|date|time|amount|type|fee|tax|total)/i,
      },
      {
        name: 'id_loose',
        weight: 20,
        pattern: /^(?:id|number|code|identifier)$/i,
      },
    ];
    const refMatch = evaluateColumn('reference', refPatterns, 'string');
    if (refMatch.column) detected.referenceCol = refMatch.column;

    // 2. Specific Amount Detection based on Source Type
    if (sourceType === 'BANK') {
      // Balance column (to explicitly isolate and ignore for transaction amount)
      const balanceMatch = evaluateColumn('balance', [
        { name: 'balance_exact', weight: 50, pattern: /^(?:balance|running_balance|available_balance|closing_balance|ledger_balance|current_balance|account_balance)$/i },
        { name: 'balance_contains', weight: 30, pattern: /balance/i },
      ], 'number');
      if (balanceMatch.column) detected.balanceCol = balanceMatch.column;

      // Credit and Debit columns
      const creditMatch = evaluateColumn('credit', [
        { name: 'credit_exact', weight: 50, pattern: /^(?:credit|cr|deposit|cr_amount|credit_amount|deposits|deposit_amount|inflow|received)$/i },
        { name: 'credit_contains', weight: 30, pattern: /(?:credit|deposit|inflow)/i, excludePattern: /balance|limit/i },
      ], 'number');
      if (creditMatch.column) detected.creditCol = creditMatch.column;

      const debitMatch = evaluateColumn('debit', [
        { name: 'debit_exact', weight: 50, pattern: /^(?:debit|dr|withdrawal|dr_amount|debit_amount|withdrawals|withdrawal_amount|outflow|spent)$/i },
        { name: 'debit_contains', weight: 30, pattern: /(?:debit|withdrawal|outflow)/i, excludePattern: /balance|limit/i },
      ], 'number');
      if (debitMatch.column) detected.debitCol = debitMatch.column;

      // Unified Amount column (excluding balance)
      const amountMatch = evaluateColumn('amount', [
        { name: 'amount_exact', weight: 45, pattern: /^(?:amount|txn_amount|transaction_amount|trans_amount|value|net_movement|funds_received|net_amount)$/i },
        { name: 'amount_contains', weight: 25, pattern: /(?:amount|value)/i, excludePattern: /balance|fee|charge|tax|credit|debit/i },
      ], 'number', /balance/i);
      if (amountMatch.column) detected.amountCol = amountMatch.column;

      // Fallback: If neither credit/debit nor amount found, find best numeric column excluding balance
      if (!detected.creditCol && !detected.debitCol && !detected.amountCol) {
        const fallback = findBestNumericColumn(new Set([detected.balanceCol || '', detected.referenceCol || '']));
        if (fallback) detected.amountCol = fallback;
      }

    } else if (sourceType === 'MERCHANT') {
      const merchantAmountMatch = evaluateColumn('amount', [
        {
          name: 'merchant_amount_exact',
          weight: 55,
          pattern: /^(?:amount|order_total|order_amount|sale_amount|sale_proceeds|collected_amount|payment_amount|payment_value|gross_value|gross_amount|invoice_total|invoice_amount|total_amount|total|subtotal|sales|revenue|price|sale_price|charge_amount|paid_amount|funds_received|captured_amount|item_total|line_total|net_sales|trans_amount|transaction_amount|txn_amount|order_value)$/i,
        },
        {
          name: 'merchant_amount_contains',
          weight: 35,
          pattern: /(?:order|sale|total|gross|collected|invoice|payment|paid|price|revenue|charge|txn|trans)[_\s]*(?:amount|total|value|proceeds|price)?/i,
          excludePattern: /tax|discount|fee|commission|qty|quantity/i,
        },
        {
          name: 'merchant_general_amount',
          weight: 25,
          pattern: /^(?:amount|value|total)$/i,
        },
      ], 'number');
      if (merchantAmountMatch.column) detected.amountCol = merchantAmountMatch.column;

      const grossMatch = evaluateColumn('grossAmount', [
        { name: 'gross_amount', weight: 45, pattern: /^(?:gross_amount|gross_value|subtotal|base_amount|gross_sales|gross_total)$/i },
        { name: 'gross_contains', weight: 25, pattern: /gross/i, excludePattern: /tax|fee|discount/i },
      ], 'number');
      if (grossMatch.column) detected.grossAmountCol = grossMatch.column;

      // Fallback: If no amount column matched yet, use data-driven numeric scan
      if (!detected.amountCol) {
        const fallback = findBestNumericColumn(new Set([detected.referenceCol || '']));
        if (fallback) detected.amountCol = fallback;
      }

    } else if (sourceType === 'SETTLEMENT') {
      const settlementAmountMatch = evaluateColumn('settlementAmount', [
        {
          name: 'settle_amount_exact',
          weight: 55,
          pattern: /^(?:settlement_amount|settled_amount|payout_amount|net_payout|net_settlement|settlement_value|net_amount|net_total|payout|settlement|net|transferred_amount|amount_settled|payout_value|total_payout|funds_transferred|disbursement|disbursed_amount|amount|total_amount|gross_amount|gross_settlement|charge_amount|transaction_amount|funds_received)$/i,
        },
        {
          name: 'settle_amount_contains',
          weight: 35,
          pattern: /(?:settle|payout|net|disburse|transfer)[_\s]*(?:amount|total|payout|value)?/i,
          excludePattern: /fee|tax|refund|adjustment|mdr|charge/i,
        },
        {
          name: 'settle_general_amount',
          weight: 25,
          pattern: /^(?:amount|total_amount|total|payout)$/i,
          excludePattern: /fee|tax|refund|adj/i,
        },
      ], 'number');
      if (settlementAmountMatch.column) detected.amountCol = settlementAmountMatch.column;

      const grossMatch = evaluateColumn('grossAmount', [
        { name: 'gross_amount', weight: 45, pattern: /^(?:gross_amount|gross_value|gross_total|gross_sales|gross_settlement|collected_amount|charge_amount|order_amount)$/i },
        { name: 'gross_contains', weight: 25, pattern: /gross/i, excludePattern: /tax|fee|discount|mdr/i },
      ], 'number');
      if (grossMatch.column) detected.grossAmountCol = grossMatch.column;

      const feeMatch = evaluateColumn('fee', [
        { name: 'fee_exact', weight: 45, pattern: /^(?:fee|fees|mdr|commission|processing_fee|gateway_fee|charge|mdr_fee|service_fee|interchange_fee)$/i },
        { name: 'fee_contains', weight: 25, pattern: /(?:fee|mdr|commission|charge|payout_fee)/i, excludePattern: /tax|gst|vat/i },
      ], 'number');
      if (feeMatch.column) detected.feeCol = feeMatch.column;

      const taxMatch = evaluateColumn('tax', [
        { name: 'tax', weight: 40, pattern: /^(?:tax|gst|vat|service_tax|sales_tax|tax_amount)$/i },
      ], 'number');
      if (taxMatch.column) detected.taxCol = taxMatch.column;

      // Fallback: If no amount column matched yet, use data-driven numeric scan (excluding fee, tax)
      if (!detected.amountCol) {
        const fallback = findBestNumericColumn(new Set([detected.referenceCol || '', detected.feeCol || '', detected.taxCol || '']));
        if (fallback) detected.amountCol = fallback;
      }
    }

    // 3. Date Detection
    const datePatterns: HeaderPattern[] = [
      {
        name: 'date_exact',
        weight: 50,
        pattern: /^(?:date|transaction_date|txn_date|trans_date|posting_date|value_date|created_at|order_date|settlement_date|payout_date|settled_on|posted_on|created_on|payment_date|sale_date)$/i,
      },
      {
        name: 'date_contains',
        weight: 35,
        pattern: /(?:date|time|timestamp|created|posted|settled)/i,
      },
    ];
    const dateMatch = evaluateColumn('date', datePatterns, 'date');
    if (dateMatch.column) detected.dateCol = dateMatch.column;

    // 4. Customer / Payer
    const customerMatch = evaluateColumn('customer', [
      { name: 'customer_exact', weight: 45, pattern: /^(?:customer|customer_name|payer|buyer|client|account_name|cardholder|purchaser|name)$/i },
      { name: 'customer_contains', weight: 25, pattern: /customer|buyer|payer|client|account/i, excludePattern: /id|num|no|date/i },
    ], 'string');
    if (customerMatch.column) detected.customerCol = customerMatch.column;

    // 5. Payment Method / Channel
    const methodMatch = evaluateColumn('paymentMethod', [
      { name: 'method_exact', weight: 45, pattern: /^(?:payment_method|payment_mode|method|channel|type|gateway|mode|card_type|payment_channel)$/i },
      { name: 'method_contains', weight: 25, pattern: /method|mode|channel|gateway/i },
    ], 'string');
    if (methodMatch.column) detected.paymentMethodCol = methodMatch.column;

    // 6. Description / Remarks
    const descMatch = evaluateColumn('description', [
      { name: 'desc_exact', weight: 40, pattern: /^(?:description|narration|remarks|details|particulars|memo|note|comments)$/i },
      { name: 'desc_contains', weight: 20, pattern: /desc|narration|remark|detail|memo|note/i },
    ], 'string');
    if (descMatch.column) detected.descriptionCol = descMatch.column;

    // Sanity checks & warnings
    if (!detected.referenceCol) {
      warnings.push(`No clear reference/transaction ID column detected for ${sourceType}.`);
    }
    if (sourceType === 'BANK' && !detected.amountCol && (!detected.creditCol && !detected.debitCol)) {
      warnings.push(`No valid amount or credit/debit column detected for Bank Statement.`);
    } else if (sourceType !== 'BANK' && !detected.amountCol && !detected.grossAmountCol) {
      warnings.push(`No valid amount column detected for ${sourceType}.`);
    }
    if (!detected.dateCol) {
      warnings.push(`No valid date column detected for ${sourceType}.`);
    }

    let confidence = 100;
    if (!detected.referenceCol) confidence -= 25;
    if (!detected.amountCol && !detected.creditCol && !detected.debitCol && !detected.grossAmountCol) confidence -= 35;
    if (!detected.dateCol) confidence -= 20;

    return {
      referenceCol: detected.referenceCol,
      amountCol: detected.amountCol,
      grossAmountCol: detected.grossAmountCol,
      netAmountCol: detected.netAmountCol,
      creditCol: detected.creditCol,
      debitCol: detected.debitCol,
      feeCol: detected.feeCol,
      taxCol: detected.taxCol,
      balanceCol: detected.balanceCol,
      dateCol: detected.dateCol,
      settlementDateCol: detected.settlementDateCol,
      statusCol: detected.statusCol,
      customerCol: detected.customerCol,
      paymentMethodCol: detected.paymentMethodCol,
      descriptionCol: detected.descriptionCol,
      confidence: Math.max(0, confidence),
      detectedFields: detected,
      warnings,
    };
  }
}
