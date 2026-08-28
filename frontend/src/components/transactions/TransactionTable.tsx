import React from 'react';
import { ChevronRight, ArrowUpDown } from 'lucide-react';
import { ReconciledCase } from '../../types/index.js';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator.js';
import { CurrencyText } from '../common/CurrencyText.js';
import { StatusBadge } from '../common/StatusBadge.js';

interface Props {
  cases: ReconciledCase[];
  selectedCaseId?: string;
  onSelectCase: (c: ReconciledCase) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (col: string) => void;
}

export const TransactionTable: React.FC<Props> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const renderSortHeader = (label: string, sortKey: string) => {
    const isSorted = sortBy === sortKey;
    return (
      <th
        onClick={() => onSort(sortKey)}
        className="px-4 py-3 text-left text-xs font-semibold text-slate-300 hover:text-cyan-400 cursor-pointer select-none transition-colors border-b border-slate-800"
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <ArrowUpDown className={`w-3 h-3 ${isSorted ? 'text-cyan-400' : 'text-slate-500'}`} />
        </div>
      </th>
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-950/80">
            <th className="px-4 py-3 text-xs font-semibold text-slate-300 border-b border-slate-800">Status</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-300 border-b border-slate-800">Confidence</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-300 border-b border-slate-800">Reference / ID</th>
            {renderSortHeader('Bank Amount', 'bankAmount')}
            {renderSortHeader('Merchant Sale', 'merchantAmount')}
            {renderSortHeader('Settlement', 'settlementAmount')}
            {renderSortHeader('Difference', 'difference')}
            {renderSortHeader('Date', 'date')}
            <th className="px-4 py-3 text-xs font-semibold text-slate-300 border-b border-slate-800">Method</th>
            <th className="px-3 py-3 text-xs font-semibold text-slate-300 border-b border-slate-800 text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
          {cases.map((c) => {
            const isSelected = selectedCaseId === c.id;
            return (
              <tr
                key={c.id}
                onClick={() => onSelectCase(c)}
                className={`transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/10 hover:bg-cyan-500/15'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={c.classification} />
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <ConfidenceIndicator score={c.confidenceScore} />
                </td>

                <td className="px-4 py-3 font-mono font-medium text-slate-200 whitespace-nowrap">
                  <div>{c.primaryReference || c.caseNumber}</div>
                  {c.customer && <div className="text-[10px] text-slate-400 font-sans">{c.customer}</div>}
                </td>

                <td className="px-4 py-3 font-mono text-slate-200 whitespace-nowrap">
                  <CurrencyText amount={c.bankAmount} />
                </td>

                <td className="px-4 py-3 font-mono text-slate-200 whitespace-nowrap">
                  <CurrencyText amount={c.merchantAmount} />
                </td>

                <td className="px-4 py-3 font-mono text-slate-200 whitespace-nowrap">
                  <CurrencyText amount={c.settlementAmount} />
                  {c.feeAmount ? (
                    <span className="block text-[10px] text-slate-400 font-mono">
                      fee: -${c.feeAmount.toFixed(2)}
                    </span>
                  ) : null}
                </td>

                <td className="px-4 py-3 font-mono whitespace-nowrap font-semibold">
                  {c.financialDifference > 0 ? (
                    <span className="text-rose-400">
                      <CurrencyText amount={c.financialDifference} showSign />
                    </span>
                  ) : (
                    <span className="text-slate-500">$0.00</span>
                  )}
                </td>

                <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                  {c.transactionDate ? c.transactionDate.split('T')[0] : '—'}
                </td>

                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                  {c.paymentMethod || '—'}
                </td>

                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <ChevronRight className="w-4 h-4 text-slate-500 inline-block" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
