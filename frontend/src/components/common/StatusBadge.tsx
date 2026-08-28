import React from 'react';
import { ClassificationType } from '../../types/index.js';

interface Props {
  status: ClassificationType | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const getStyles = () => {
    switch (status) {
      case 'MATCHED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'LIKELY_MATCH':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'AMOUNT_MISMATCH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'MISSING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MISSING_SETTLEMENT':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'DUPLICATE':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      case 'PARTIAL_SETTLEMENT':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'TIMING_DISCREPANCY':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'REVIEW_REQUIRED':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'IGNORED':
        return 'bg-slate-700/30 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'MATCHED': return 'Matched';
      case 'LIKELY_MATCH': return 'Likely Match';
      case 'AMOUNT_MISMATCH': return 'Amount Mismatch';
      case 'MISSING': return 'Missing Record';
      case 'MISSING_SETTLEMENT': return 'Missing Settlement';
      case 'DUPLICATE': return 'Duplicate Entry';
      case 'PARTIAL_SETTLEMENT': return 'Partial Settlement';
      case 'TIMING_DISCREPANCY': return 'Timing Discrepancy';
      case 'REVIEW_REQUIRED': return 'Review Required';
      case 'RESOLVED': return 'Resolved';
      case 'IGNORED': return 'Ignored';
      case 'OPEN': return 'Open';
      default: return status.replace(/_/g, ' ');
    }
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-mono tracking-tight ${getStyles()} ${sizeClasses[size]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {getLabel()}
    </span>
  );
};
