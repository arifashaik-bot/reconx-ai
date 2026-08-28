import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertOctagon, CheckCircle2, RefreshCw } from 'lucide-react';
import { ExceptionItem, ReconciledCase } from '../types/index.js';
import { api } from '../services/api.js';
import { CurrencyText } from '../components/common/CurrencyText.js';
import { SkeletonLoader } from '../components/common/SkeletonLoader.js';
import { ExceptionCard } from '../components/exceptions/ExceptionCard.js';
import { ExceptionResolutionModal } from '../components/exceptions/ExceptionResolutionModal.js';
import { TransactionDetailDrawer } from '../components/transactions/TransactionDetailDrawer.js';

interface Props {
  runId?: string;
}

const exceptionTabs: { label: string; value: string }[] = [
  { label: 'All Exceptions', value: 'ALL' },
  { label: 'Amount Mismatches', value: 'AMOUNT_MISMATCH' },
  { label: 'Missing Settlements', value: 'MISSING_SETTLEMENT' },
  { label: 'Missing Records', value: 'MISSING' },
  { label: 'Duplicates', value: 'DUPLICATE' },
  { label: 'Partial Settlements', value: 'PARTIAL_SETTLEMENT' },
  { label: 'Timing Discrepancies', value: 'TIMING_DISCREPANCY' },
  { label: 'Review Required', value: 'REVIEW_REQUIRED' },
];

export const ExceptionsPage: React.FC<Props> = ({ runId }) => {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [activeTab, setActiveTab] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [resolvingException, setResolvingException] = useState<ExceptionItem | null>(null);
  const [inspectingCase, setInspectingCase] = useState<ReconciledCase | null>(null);

  const fetchExceptions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getExceptions({
        runId,
        type: activeTab,
      });
      setExceptions(data.exceptions);
      setSummary(data.summary || {});
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [runId, activeTab]);

  const handleResolveConfirm = async (id: string, status: 'RESOLVED' | 'IGNORED', notes: string) => {
    try {
      await api.updateExceptionStatus(id, status, notes);
      fetchExceptions();
    } catch (err) {
      console.error('Failed to resolve exception:', err);
    }
  };

  const handleIgnore = async (exception: ExceptionItem) => {
    try {
      await api.updateExceptionStatus(exception.id, 'IGNORED', 'Marked as ignored from Exception Command Center.');
      fetchExceptions();
    } catch (err) {
      console.error('Failed to ignore exception:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            Financial Exception Command Center
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">Exceptions & Discrepancies</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify broken reconciliations, missing settlements, duplicate records, and timing issues with root causes.
          </p>
        </div>

        <button
          onClick={fetchExceptions}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Total Open Exceptions</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            {summary.open ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{summary.resolved ?? 0} resolved</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Amount Mismatches</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {summary.amountMismatch ?? 0}
          </div>
          <span className="text-[10px] text-amber-500/80 font-mono mt-0.5 block">Differing invoice values</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Missing Settlements</span>
          <div className="text-xl font-bold font-mono text-orange-400 mt-1">
            {summary.missingSettlement ?? 0}
          </div>
          <span className="text-[10px] text-orange-500/80 font-mono mt-0.5 block">Unsettled gateway payouts</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Total Exposure</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            <CurrencyText amount={summary.totalExposure} />
          </div>
          <span className="text-[10px] text-rose-400/80 font-mono mt-0.5 block">Discrepancy value</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {exceptionTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all ${
                isActive
                  ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/10'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Exceptions Grid */}
      {isLoading ? (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <SkeletonLoader rows={6} />
        </div>
      ) : exceptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exceptions.map((exc) => (
            <ExceptionCard
              key={exc.id}
              exception={exc}
              onInvestigate={(e) => setInspectingCase(e.reconciledCase)}
              onResolve={(e) => setResolvingException(e)}
              onIgnore={handleIgnore}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 font-mono">
          ✅ No exceptions found for the selected category.
        </div>
      )}

      {/* Resolution Modal */}
      <ExceptionResolutionModal
        isOpen={resolvingException !== null}
        exception={resolvingException}
        onClose={() => setResolvingException(null)}
        onConfirm={handleResolveConfirm}
      />

      {/* Inspect Case Drawer */}
      <TransactionDetailDrawer
        caseSummary={inspectingCase}
        isOpen={inspectingCase !== null}
        onClose={() => setInspectingCase(null)}
        onStatusUpdated={fetchExceptions}
      />
    </div>
  );
};
