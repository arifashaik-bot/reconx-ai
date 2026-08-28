import axios from 'axios';
import {
  AuditLog,
  DashboardOverview,
  ExceptionItem,
  FilePreviewResponse,
  ReconciledCase,
  SettlementIntelligence,
  SystemSettings,
} from '../types/index.js';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

export const api = {
  // Dashboard
  getDashboardOverview: async (runId?: string): Promise<DashboardOverview> => {
    const res = await apiClient.get<DashboardOverview>('/dashboard/overview', { params: { runId } });
    return res.data;
  },

  // Import Preview
  previewFile: async (file: File, sourceType: 'BANK' | 'MERCHANT' | 'SETTLEMENT'): Promise<FilePreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceType', sourceType);
    const res = await apiClient.post<FilePreviewResponse>('/import/preview', formData);
    return res.data;
  },

  // Run Reconciliation
  runReconciliation: async (
    bankFile: File,
    merchantFile: File,
    settlementFile: File,
    options?: {
      runName?: string;
      amountTolerance?: number;
      dateToleranceDays?: number;
      sensitivity?: string;
      bankMapping?: any;
      merchantMapping?: any;
      settlementMapping?: any;
    }
  ) => {
    const formData = new FormData();
    formData.append('bankFile', bankFile);
    formData.append('merchantFile', merchantFile);
    formData.append('settlementFile', settlementFile);

    if (options?.runName) formData.append('runName', options.runName);
    if (options?.amountTolerance !== undefined) formData.append('amountTolerance', String(options.amountTolerance));
    if (options?.dateToleranceDays !== undefined) formData.append('dateToleranceDays', String(options.dateToleranceDays));
    if (options?.sensitivity) formData.append('sensitivity', options.sensitivity);
    if (options?.bankMapping) formData.append('bankMapping', JSON.stringify(options.bankMapping));
    if (options?.merchantMapping) formData.append('merchantMapping', JSON.stringify(options.merchantMapping));
    if (options?.settlementMapping) formData.append('settlementMapping', JSON.stringify(options.settlementMapping));

    const res = await apiClient.post('/reconciliation/run', formData);
    return res.data;
  },

  // Run Management
  getRuns: async () => {
    const res = await apiClient.get('/reconciliation/runs');
    return res.data;
  },

  getRunDetails: async (id: string) => {
    const res = await apiClient.get(`/reconciliation/runs/${id}`);
    return res.data;
  },

  deleteRun: async (id: string) => {
    const res = await apiClient.delete(`/reconciliation/runs/${id}`);
    return res.data;
  },

  // Transactions
  getTransactions: async (params?: {
    runId?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ cases: ReconciledCase[]; total: number; page: number; totalPages: number }> => {
    const res = await apiClient.get('/transactions', { params });
    return res.data;
  },

  getTransactionDetails: async (caseId: string): Promise<ReconciledCase> => {
    const res = await apiClient.get(`/transactions/${caseId}`);
    return res.data;
  },

  // Exceptions
  getExceptions: async (params?: {
    runId?: string;
    type?: string;
    status?: string;
    severity?: string;
  }): Promise<{ exceptions: ExceptionItem[]; summary: any }> => {
    const res = await apiClient.get('/exceptions', { params });
    return res.data;
  },

  updateExceptionStatus: async (id: string, status: string, notes?: string): Promise<ExceptionItem> => {
    const res = await apiClient.patch(`/exceptions/${id}/status`, { status, notes });
    return res.data;
  },

  // Settlements
  getSettlementIntelligence: async (runId?: string): Promise<SettlementIntelligence> => {
    const res = await apiClient.get('/settlements/intelligence', { params: { runId } });
    return res.data;
  },

  // AI Analyst
  queryAiAnalyst: async (query: string, runId?: string): Promise<{
    answer: string;
    suggestedFollowups: string[];
    isAiGenerated: boolean;
    referencedCases: any[];
  }> => {
    const res = await apiClient.post('/ai/query', { query, runId });
    return res.data;
  },

  getAiPrompts: async (): Promise<{ prompts: { category: string; text: string }[] }> => {
    const res = await apiClient.get('/ai/prompts');
    return res.data;
  },

  // Reports
  getReportExportUrl: (type: 'reconciliation' | 'exceptions' | 'settlements', format: 'csv' | 'xlsx' | 'html', runId?: string): string => {
    const params = new URLSearchParams({ type, format });
    if (runId) params.append('runId', runId);
    return `/api/reports/export?${params.toString()}`;
  },

  // Settings
  getSettings: async (): Promise<SystemSettings> => {
    const res = await apiClient.get('/settings');
    return res.data;
  },

  updateSettings: async (settings: Partial<SystemSettings>): Promise<{ success: boolean }> => {
    const res = await apiClient.post('/settings', settings);
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (limit: number = 50): Promise<AuditLog[]> => {
    const res = await apiClient.get('/audit', { params: { limit } });
    return res.data;
  },

  // Demo Run
  triggerDemoRun: async (): Promise<{ success: boolean; runId: string }> => {
    const res = await apiClient.post('/demo/run');
    return res.data;
  },
};
