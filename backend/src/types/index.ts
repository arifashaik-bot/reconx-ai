export type SourceType = 'BANK' | 'MERCHANT' | 'SETTLEMENT';

export type ClassificationType =
  | 'MATCHED'
  | 'LIKELY_MATCH'
  | 'AMOUNT_MISMATCH'
  | 'MISSING'
  | 'MISSING_SETTLEMENT'
  | 'DUPLICATE'
  | 'PARTIAL_SETTLEMENT'
  | 'TIMING_DISCREPANCY'
  | 'REVIEW_REQUIRED';

export type MatchingMethodType =
  | 'EXACT_ID'
  | 'REFERENCE_AMOUNT'
  | 'AMOUNT_DATE'
  | 'FUZZY_REFERENCE'
  | 'METADATA_COMPOSITE'
  | 'AMBIGUOUS';

export type CaseStatus = 'OPEN' | 'RESOLVED' | 'IGNORED' | 'UNDER_INVESTIGATION';

export type ExceptionType =
  | 'AMOUNT_MISMATCH'
  | 'MISSING'
  | 'MISSING_SETTLEMENT'
  | 'DUPLICATE'
  | 'PARTIAL_SETTLEMENT'
  | 'TIMING_DISCREPANCY'
  | 'REVIEW_REQUIRED';

export type SeverityType = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ColumnMappingResult {
  referenceCol?: string;
  amountCol?: string;
  grossAmountCol?: string;
  netAmountCol?: string;
  creditCol?: string;
  debitCol?: string;
  feeCol?: string;
  taxCol?: string;
  balanceCol?: string;
  dateCol?: string;
  settlementDateCol?: string;
  statusCol?: string;
  customerCol?: string;
  paymentMethodCol?: string;
  descriptionCol?: string;
  confidence: number;
  detectedFields: Record<string, string>;
  warnings: string[];
}

export interface ParsedFileResult {
  fileName: string;
  fileSize: number;
  fileType: 'CSV' | 'XLSX' | 'XLS';
  headers: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: Record<string, any>[];
  warnings: string[];
  mapping: ColumnMappingResult;
}

export interface CanonicalFinancialRecord {
  id: string;
  sourceType: SourceType;
  rowNumber: number;
  rawReference: string;
  normalizedReference: string;
  amount: number;
  direction: 'CREDIT' | 'DEBIT' | 'UNKNOWN';
  date: Date;
  rawDate: string;
  description?: string;
  customer?: string;
  paymentMethod?: string;
  grossAmount?: number;
  netAmount?: number;
  fee?: number;
  tax?: number;
  runningBalance?: number;
  rawData: Record<string, any>;
  isValid: boolean;
  validationError?: string;
}

export interface MatchingEvidence {
  type: string;
  description: string;
  score: number;
  details?: Record<string, any>;
}

export interface CandidateGroup {
  bankRecord?: CanonicalFinancialRecord;
  merchantRecord?: CanonicalFinancialRecord;
  settlementRecord?: CanonicalFinancialRecord;
  classification: ClassificationType;
  confidenceScore: number;
  matchingMethod: MatchingMethodType;
  evidence: MatchingEvidence[];
  explanation: string;
  recommendedAction?: string;
  financialDifference: number;
  feeAmount?: number;
  netSettlementAmount?: number;
  dateDifferenceDays?: number;
}

export interface ReconciliationConfig {
  amountTolerance: number;
  dateToleranceDays: number;
  sensitivity: 'strict' | 'balanced' | 'relaxed';
}
