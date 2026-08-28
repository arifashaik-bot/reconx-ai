import React, { useState } from 'react';
import {
  Building2,
  Store,
  CreditCard,
  Play,
  Settings,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { ColumnMappingResult, FilePreviewResponse } from '../types/index.js';
import { api } from '../services/api.js';
import { MappingConfirmationModal } from '../components/reconcile/MappingConfirmationModal.js';
import { ReconciliationProgressModal } from '../components/reconcile/ReconciliationProgressModal.js';
import { SourceUploadCard } from '../components/reconcile/SourceUploadCard.js';

interface Props {
  onReconciliationCompleted: (runId: string) => void;
}

export const ReconcilePage: React.FC<Props> = ({ onReconciliationCompleted }) => {
  // Files
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [merchantFile, setMerchantFile] = useState<File | null>(null);
  const [settlementFile, setSettlementFile] = useState<File | null>(null);

  // Previews & Dynamic Mappings
  const [bankPreview, setBankPreview] = useState<FilePreviewResponse | null>(null);
  const [merchantPreview, setMerchantPreview] = useState<FilePreviewResponse | null>(null);
  const [settlementPreview, setSettlementPreview] = useState<FilePreviewResponse | null>(null);

  // Loading & Errors
  const [bankLoading, setBankLoading] = useState(false);
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [settlementLoading, setSettlementLoading] = useState(false);

  const [bankError, setBankError] = useState<string | undefined>();
  const [merchantError, setMerchantError] = useState<string | undefined>();
  const [settlementError, setSettlementError] = useState<string | undefined>();

  // Tolerances
  const [amountTolerance, setAmountTolerance] = useState(0.01);
  const [dateToleranceDays, setDateToleranceDays] = useState(3);
  const [sensitivity, setSensitivity] = useState<'strict' | 'balanced' | 'relaxed'>('balanced');
  const [runName, setRunName] = useState('');

  // Active Mapping Modal
  const [mappingModalSource, setMappingModalSource] = useState<'BANK' | 'MERCHANT' | 'SETTLEMENT' | null>(null);

  // Progress State
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [completedRunId, setCompletedRunId] = useState<string | null>(null);

  // File Handlers
  const handleSelectBankFile = async (file: File) => {
    setBankFile(file);
    setBankError(undefined);
    setBankLoading(true);
    try {
      const preview = await api.previewFile(file, 'BANK');
      setBankPreview(preview);
    } catch (err: any) {
      setBankError(err.response?.data?.error || err.message || 'Failed to parse bank statement.');
    } finally {
      setBankLoading(false);
    }
  };

  const handleSelectMerchantFile = async (file: File) => {
    setMerchantFile(file);
    setMerchantError(undefined);
    setMerchantLoading(true);
    try {
      const preview = await api.previewFile(file, 'MERCHANT');
      setMerchantPreview(preview);
    } catch (err: any) {
      setMerchantError(err.response?.data?.error || err.message || 'Failed to parse merchant ledger.');
    } finally {
      setMerchantLoading(false);
    }
  };

  const handleSelectSettlementFile = async (file: File) => {
    setSettlementFile(file);
    setSettlementError(undefined);
    setSettlementLoading(true);
    try {
      const preview = await api.previewFile(file, 'SETTLEMENT');
      setSettlementPreview(preview);
    } catch (err: any) {
      setSettlementError(err.response?.data?.error || err.message || 'Failed to parse settlement report.');
    } finally {
      setSettlementLoading(false);
    }
  };

  const handleSaveMapping = (mapping: ColumnMappingResult) => {
    if (mappingModalSource === 'BANK' && bankPreview) {
      setBankPreview({ ...bankPreview, mapping });
    } else if (mappingModalSource === 'MERCHANT' && merchantPreview) {
      setMerchantPreview({ ...merchantPreview, mapping });
    } else if (mappingModalSource === 'SETTLEMENT' && settlementPreview) {
      setSettlementPreview({ ...settlementPreview, mapping });
    }
  };

  const isReadyToMatch = bankFile && merchantFile && settlementFile && bankPreview && merchantPreview && settlementPreview;

  const handleRunReconciliation = async () => {
    if (!bankFile || !merchantFile || !settlementFile) return;

    setReconcileError(null);
    setIsReconciling(true);

    try {
      const result = await api.runReconciliation(bankFile, merchantFile, settlementFile, {
        runName: runName.trim() || undefined,
        amountTolerance,
        dateToleranceDays,
        sensitivity,
        bankMapping: bankPreview?.mapping,
        merchantMapping: merchantPreview?.mapping,
        settlementMapping: settlementPreview?.mapping,
      });

      setCompletedRunId(result.runId);
    } catch (err: any) {
      setIsReconciling(false);
      setReconcileError(err.response?.data?.error || err.message || 'Reconciliation matching failed.');
    }
  };

  const handleProgressComplete = () => {
    if (completedRunId) {
      setIsReconciling(false);
      onReconciliationCompleted(completedRunId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
          Step-by-Step Ledger Ingestion
        </span>
        <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">3-Source Financial Reconciliation</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Upload your three independent financial sources. Headers and amounts will be dynamically mapped without requiring fixed column names.
        </p>
      </div>

      {reconcileError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Reconciliation Ingestion Error</div>
            <p className="mt-0.5 text-rose-300">{reconcileError}</p>
          </div>
        </div>
      )}

      {/* 3 Upload Areas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Bank Statement */}
        <SourceUploadCard
          sourceType="BANK"
          title="1. Bank Statement"
          subtitle="Bank deposits, credits, debits & reference IDs"
          color="emerald"
          icon={<Building2 className="w-5 h-5" />}
          file={bankFile}
          preview={bankPreview}
          isLoading={bankLoading}
          error={bankError}
          onFileSelect={handleSelectBankFile}
          onFileRemove={() => { setBankFile(null); setBankPreview(null); }}
          onConfigureMapping={() => setMappingModalSource('BANK')}
        />

        {/* Step 2: Merchant Ledger */}
        <SourceUploadCard
          sourceType="MERCHANT"
          title="2. Merchant Ledger"
          subtitle="Order values, invoice total, sales & customer data"
          color="cyan"
          icon={<Store className="w-5 h-5" />}
          file={merchantFile}
          preview={merchantPreview}
          isLoading={merchantLoading}
          error={merchantError}
          onFileSelect={handleSelectMerchantFile}
          onFileRemove={() => { setMerchantFile(null); setMerchantPreview(null); }}
          onConfigureMapping={() => setMappingModalSource('MERCHANT')}
        />

        {/* Step 3: Settlement Report */}
        <SourceUploadCard
          sourceType="SETTLEMENT"
          title="3. Settlement Report"
          subtitle="Payment gateway payouts, gross, net & fee breakdown"
          color="purple"
          icon={<CreditCard className="w-5 h-5" />}
          file={settlementFile}
          preview={settlementPreview}
          isLoading={settlementLoading}
          error={settlementError}
          onFileSelect={handleSelectSettlementFile}
          onFileRemove={() => { setSettlementFile(null); setSettlementPreview(null); }}
          onConfigureMapping={() => setMappingModalSource('SETTLEMENT')}
        />
      </div>

      {/* Configuration & Action Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              Reconciliation Matching Parameters
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify custom thresholds for amount rounding, settlement lag, and sensitivity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Reconciliation Run Name</label>
            <input
              type="text"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              placeholder="e.g. August 2026 Monthly Close"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Amount Tolerance ($)</label>
            <input
              type="number"
              step="0.01"
              value={amountTolerance}
              onChange={(e) => setAmountTolerance(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Date Lag Tolerance (Days)</label>
            <input
              type="number"
              step="1"
              value={dateToleranceDays}
              onChange={(e) => setDateToleranceDays(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Matching Sensitivity</label>
            <select
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="strict">Strict (Exact match)</option>
              <option value="balanced">Balanced (Standard)</option>
              <option value="relaxed">Relaxed (Extended tolerance)</option>
            </select>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {isReadyToMatch ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                All 3 financial sources validated and mapped. Ready to reconcile.
              </span>
            ) : (
              <span>Please upload all 3 files (Bank, Merchant, Settlement) to proceed.</span>
            )}
          </div>

          <button
            onClick={handleRunReconciliation}
            disabled={!isReadyToMatch}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-xl shadow-cyan-500/20 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider font-mono"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Run Reconciliation Engine</span>
          </button>
        </div>
      </div>

      {/* Mapping Confirmation Modal */}
      <MappingConfirmationModal
        isOpen={mappingModalSource !== null}
        onClose={() => setMappingModalSource(null)}
        sourceType={mappingModalSource || 'MERCHANT'}
        sourceTitle={
          mappingModalSource === 'BANK'
            ? 'Bank Statement'
            : mappingModalSource === 'MERCHANT'
            ? 'Merchant Ledger'
            : 'Payment Settlement Report'
        }
        preview={
          mappingModalSource === 'BANK'
            ? bankPreview
            : mappingModalSource === 'MERCHANT'
            ? merchantPreview
            : settlementPreview
        }
        onSaveMapping={handleSaveMapping}
      />

      {/* Progress Modal */}
      <ReconciliationProgressModal
        isOpen={isReconciling}
        onComplete={handleProgressComplete}
      />
    </div>
  );
};
