import React from 'react';
import { PlusCircle, Layers, RefreshCw, Home } from 'lucide-react';

interface Props {
  runName?: string;
  isDemo?: boolean;
  onNewReconciliation: () => void;
  onRefreshData?: () => void;
  onNavigateHome?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<Props> = ({
  runName,
  isDemo,
  onNewReconciliation,
  onRefreshData,
  onNavigateHome,
  isRefreshing,
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 text-xs font-semibold transition-colors mr-1"
            title="Return to Public Homepage"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Homepage</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300 font-mono">
            {runName || 'No Active Reconciliation Run'}
          </span>
        </div>

        {isDemo && (
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Demo Data — Synthetic
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
            title="Refresh active dataset"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}

        <button
          onClick={onNewReconciliation}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/10 active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Reconciliation</span>
        </button>
      </div>
    </header>
  );
};
