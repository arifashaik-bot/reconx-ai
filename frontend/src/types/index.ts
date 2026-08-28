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

export type CaseStatus = 'OPEN' | 'RESOLVED' | 'IGNORED' | 'UNDER_INVESTIGATION';

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

export interface FilePreviewResponse {
  fileName: string;
  fileSize: number;
  fileType: string;
  headers: string[];
  totalRows: number;
  sampleRows: Record<string, any>[];
  mapping: ColumnMappingResult;
  warnings: string[];
}

export interface MatchingEvidence {
  type: string;
  description: string;
  score: number;
  details?: Record<string, any>;
}

export interface SourceRecord {
  id: string;
  caseId: string;
  sourceType: 'BANK' | 'MERCHANT' | 'SETTLEMENT';
  reference?: string;
  amount?: number;
  date?: string;
  direction?: string;
  rawData?: Record<string, any>;
}

export interface ReconciledCase {
  id: string;
  runId: string;
  caseNumber: string;
  primaryReference?: string;
  classification: ClassificationType;
  confidenceScore: number;
  matchingMethod: string;
  bankAmount?: number;
  merchantAmount?: number;
  settlementAmount?: number;
  feeAmount?: number;
  netSettlementAmount?: number;
  financialDifference: number;
  transactionDate?: string;
  settlementDate?: string;
  dateDifferenceDays?: number;
  customer?: string;
  paymentMethod?: string;
  evidence?: MatchingEvidence[];
  explanation: string;
  recommendedAction?: string;
  status: CaseStatus;
  sourceRecordsCount?: number;
  sourceRecords?: SourceRecord[];
}

export interface ExceptionItem {
  id: string;
  caseId: string;
  runId: string;
  type: ClassificationType;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  affectedSources: string;
  difference: number;
  explanation: string;
  recommendedAction: string;
  status: CaseStatus;
  notes?: string;
  resolvedAt?: string;
  createdAt: string;
  reconciledCase: ReconciledCase;
}

export interface DashboardOverview {
  hasData: boolean;
  message?: string;
  runId?: string;
  runName?: string;
  isDemo?: boolean;
  runDate?: string;
  totalTransactions?: number;
  matched?: number;
  exceptions?: number;
  matchRate?: number;
  grossAmount?: number;
  settlementAmount?: number;
  financialDifference?: number;
  healthStatusDistribution?: { status: string; label: string; count: number; color: string }[];
  nodeMetrics?: {
    bank: { source: string; fileName: string; totalRows: number; amount: number; matched: number; exceptions: number };
    merchant: { source: string; fileName: string; totalRows: number; amount: number; matched: number; exceptions: number };
    settlement: { source: string; fileName: string; totalRows: number; amount: number; matched: number; exceptions: number };
  };
  financialFlow?: {
    merchantGross: number;
    bankReceived: number;
    settlementNet: number;
    feesDeducted: number;
    unreconciledDifference: number;
  };
  recentExceptions?: {
    id: string;
    caseId: string;
    type: ClassificationType;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    reference: string;
    affectedSources: string;
    difference: number;
    status: CaseStatus;
    explanation: string;
    createdAt: string;
  }[];
  filesProcessed?: {
    sourceType: string;
    fileName: string;
    fileSize: number;
    totalRows: number;
    validRows: number;
    invalidRows: number;
  }[];
}

export interface SettlementIntelligence {
  hasData: boolean;
  runId?: string;
  runName?: string;
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
  settlementTransactions: {
    id: string;
    caseNumber: string;
    reference: string;
    merchantAmount: number;
    settlementAmount: number;
    fee: number;
    difference: number;
    dateDelta?: number;
    classification: string;
    status: string;
  }[];
}

export interface SystemSettings {
  amountTolerance: number;
  dateToleranceDays: number;
  sensitivity: 'strict' | 'balanced' | 'relaxed';
  currency: string;
  currencySymbol: string;
  reducedMotion: boolean;
  hasOpenAiKey: boolean;
}

export interface AuditLog {
  id: string;
  runId?: string;
  action: string;
  details: string;
  timestamp: string;
  run?: { id: string; name: string };
}
