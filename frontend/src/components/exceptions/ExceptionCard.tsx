import React from 'react';
import { AlertTriangle, CheckCircle, EyeOff, Search } from 'lucide-react';
import { ExceptionItem } from '../../types/index.js';
import { CurrencyText } from '../common/CurrencyText.js';
import { StatusBadge } from '../common/StatusBadge.js';

interface Props {
  exception: ExceptionItem;
  onInvestigate: (e: ExceptionItem) => void;
  onResolve: (e: ExceptionItem) => void;
  onIgnore: (e: ExceptionItem) => void;
}

export const ExceptionCard: React.FC<Props> = ({
  exception,
  onInvestigate,
  onResolve,
  onIgnore,
}) => {
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'HIGH':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={exception.type} />
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadge(exception.severity)}`}>
              {exception.severity} Priority
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono block">Variance / Impact</span>
            <span className="text-sm font-bold font-mono text-rose-400">
              <CurrencyText amount={exception.difference} />
            </span>
          </div>
        </div>

        {/* Reference & Affected */}
        <div className="mb-3">
          <div className="text-sm font-bold font-mono text-slate-100 truncate">
            {exception.reconciledCase?.primaryReference || exception.caseId}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            Affected Sources: <span className="text-cyan-400">{exception.affectedSources}</span>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-3">
          {exception.explanation}
        </p>

        {/* Recommended Action */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
          <span className="text-cyan-400 font-semibold font-mono block mb-0.5">Recommended Action:</span>
          {exception.recommendedAction}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onInvestigate(exception)}
          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          Investigate
        </button>

        {exception.status === 'OPEN' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onIgnore(exception)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Ignore
            </button>
            <button
              onClick={() => onResolve(exception)}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-semibold transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Resolve
            </button>
          </div>
        )}

        {exception.status !== 'OPEN' && (
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {exception.status}
          </span>
        )}
      </div>
    </div>
  );
};
