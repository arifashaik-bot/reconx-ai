import React from 'react';

interface Props {
  score: number;
  showText?: boolean;
}

export const ConfidenceIndicator: React.FC<Props> = ({ score, showText = true }) => {
  const rounded = Math.round(score);

  const getColor = () => {
    if (rounded >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (rounded >= 75) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    if (rounded >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const getBarColor = () => {
    if (rounded >= 90) return 'bg-emerald-400';
    if (rounded >= 75) return 'bg-cyan-400';
    if (rounded >= 50) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${Math.min(100, Math.max(5, rounded))}%` }}
        />
      </div>
      {showText && (
        <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded border ${getColor()}`}>
          {rounded}%
        </span>
      )}
    </div>
  );
};
