import React from 'react';
import {
  GitMerge,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { DashboardOverview } from '../types/index.js';
import { CurrencyText } from '../components/common/CurrencyText.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { FinancialFlowChart } from '../components/visualization/FinancialFlowChart.js';
import { ReconciliationGraph3D } from '../components/visualization/ReconciliationGraph3D.js';

interface Props {
  data: DashboardOverview | null;
  onNavigateToReconcile: () => void;
  onNavigateToExceptions: () => void;
  onNavigateToTransactions: () => void;
}

export const OverviewPage: React.FC<Props> = ({
  data,
  onNavigateToReconcile,
  onNavigateToExceptions,
  onNavigateToTransactions,
}) => {
  if (!data || !data.hasData) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Reconciliation Overview</h2>
          <p className="text-xs text-slate-400 mt-1">Monitor payment integrity across every financial source.</p>
        </div>

        <EmptyState
          icon={FolderOpen}
          title="No reconciliation performed yet"
          description="Upload your Bank Statement, Merchant Ledger, and Payment Settlement Report to begin automated cross-source reconciliation."
          actionText="Start Reconciliation"
          onAction={onNavigateToReconcile}
        />
      </div>
    );
  }

  const matchRate = data.matchRate ?? 0;
  const exceptionsCount = data.exceptions ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            RECONX AI • Executive Command Dashboard
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">Reconciliation Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor payment integrity and exposure across every financial source in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToReconcile}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <GitMerge className="w-3.5 h-3.5 text-cyan-400" />
            Upload New Files
          </button>
        </div>
      </div>

      {/* Top 7 Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Txns */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-medium">Total Cases</span>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {data.totalTransactions ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Cross-source groups</span>
        </div>

        {/* Matched */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-medium">Matched</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {data.matched ?? 0}
          </div>
          <span className="text-[10px] text-emerald-500 font-mono mt-0.5 block">Verified intact</span>
        </div>

        {/* Exceptions */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-medium">Exceptions</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            {exceptionsCount}
          </div>
          <span className="text-[10px] text-rose-500 font-mono mt-0.5 block">Discrepancies found</span>
        </div>

        {/* Match Rate */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-medium">Match Rate</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {matchRate}%
          </div>
          <span className="text-[10px] text-cyan-500 font-mono mt-0.5 block">Integrity index</span>
        </div>

        {/* Gross Amount */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-medium">Gross Volume</span>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1 truncate">
            <CurrencyText amount={data.grossAmount} />
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Sales records</span>
        </div>

        {/* Settlement Amount */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 font-medium">Settlement Net</span>
          <div className="text-lg font-bold font-mono text-purple-400 mt-1 truncate">
            <CurrencyText amount={data.settlementAmount} />
          </div>
          <span className="text-[10px] text-purple-400/80 font-mono mt-0.5 block">Deposited funds</span>
        </div>

        {/* Financial Difference */}
        <div className={`p-4 rounded-xl border shadow-md ${
          (data.financialDifference || 0) > 0 ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[11px] font-medium text-rose-400">Total Variance</span>
          <div className="text-lg font-bold font-mono text-rose-400 mt-1 truncate">
            <CurrencyText amount={data.financialDifference} />
          </div>
          <span className="text-[10px] text-rose-400/70 font-mono mt-0.5 block">Unreconciled diff</span>
        </div>
      </div>

      {/* Health Status Distribution Bar */}
      {data.healthStatusDistribution && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Reconciliation Health Classification Breakdown
            </h4>
            <span className="text-xs font-mono text-slate-400">
              {data.totalTransactions} Total Cases Indexed
            </span>
          </div>

          {/* Progress stack */}
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            {data.healthStatusDistribution
              .filter(s => s.count > 0)
              .map((s, i) => {
                const pct = ((s.count / (data.totalTransactions || 1)) * 100).toFixed(1);
                return (
                  <div
                    key={i}
                    style={{ width: `${pct}%`, backgroundColor: s.color }}
                    className="h-full transition-all hover:opacity-80"
                    title={`${s.label}: ${s.count} cases (${pct}%)`}
                  />
                );
              })}
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2">
            {data.healthStatusDistribution.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-400 truncate">{s.label}:</span>
                <span className="font-bold text-slate-200 font-mono ml-auto">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3D Node Flow Visualization */}
      <ReconciliationGraph3D
        nodeMetrics={data.nodeMetrics}
        matchRate={data.matchRate}
      />

      {/* Financial Flow Cascade */}
      <FinancialFlowChart flow={data.financialFlow} />

      {/* Recent Exceptions & Last Run Info Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Exceptions List (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  High-Priority Discrepancies & Exceptions
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Requiring review or adjustment</p>
              </div>

              <button
                onClick={onNavigateToExceptions}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View All ({exceptionsCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {data.recentExceptions && data.recentExceptions.length > 0 ? (
                data.recentExceptions.map((e) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge status={e.type} />
                        <span className="font-mono font-bold text-slate-200 truncate max-w-[200px]">
                          {e.reference}
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-1 text-[11px]">{e.explanation}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono block">Variance</span>
                      <span className="text-xs font-bold font-mono text-rose-400">
                        <CurrencyText amount={e.difference} />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">
                  ✅ Zero open exceptions detected in current run.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Last Run Information Card (1 Col) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Active Run Profile
                </h4>
                <span className="text-[11px] text-slate-400 font-mono truncate block max-w-[220px]">
                  {data.runName}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Run Date
                </span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {data.runDate ? new Date(data.runDate).toLocaleString() : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Files Processed</span>
                <span className="text-slate-200 font-mono font-semibold">3 Financial Sources</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Reconciliation Match Rate</span>
                <span className="text-cyan-400 font-mono font-bold">{matchRate}%</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Total Unresolved Variance</span>
                <span className="text-rose-400 font-mono font-bold">
                  <CurrencyText amount={data.financialDifference} />
                </span>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-2">
                  Uploaded Sources
                </span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {data.filesProcessed?.map((f, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-cyan-400 font-bold text-[10px]">{f.sourceType}</span>
                      <span className="text-slate-300 truncate max-w-[130px]">{f.fileName}</span>
                      <span className="text-slate-500">{f.validRows} rows</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={onNavigateToTransactions}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors text-center"
            >
              Explore All Reconciled Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
