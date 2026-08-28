import React, { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, Clock, DollarSign } from 'lucide-react';
import { SettlementIntelligence } from '../types/index.js';
import { api } from '../services/api.js';
import { CurrencyText } from '../components/common/CurrencyText.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { SkeletonLoader } from '../components/common/SkeletonLoader.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { DelayDistributionChart } from '../components/settlements/DelayDistributionChart.js';
import { FeeBreakdownChart } from '../components/settlements/FeeBreakdownChart.js';
import { SettlementMetricCards } from '../components/settlements/SettlementMetricCards.js';

interface Props {
  runId?: string;
}

export const SettlementsPage: React.FC<Props> = ({ runId }) => {
  const [data, setData] = useState<SettlementIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettlements = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSettlementIntelligence(runId);
      setData(res);
    } catch (err) {
      console.error('Failed to load settlement intelligence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [runId]);

  if (!data || !data.hasData) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <EmptyState
          icon={CreditCard}
          title="No Settlement Intelligence Available"
          description="Upload financial files to analyze payment gateway payouts, MDR deductions, and settlement lag."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            Cash Flow & Gateway Economics
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">Settlement Intelligence</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit payment gateway deductions, track payout delays, and identify pending or missing settlements.
          </p>
        </div>

        <button
          onClick={fetchSettlements}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <SettlementMetricCards
        grossCollections={data.grossCollections}
        netSettlements={data.netSettlements}
        totalFees={data.totalFees}
        pendingSettlements={data.pendingSettlements}
        averageDelayDays={data.averageDelayDays}
        financialExposure={data.financialExposure}
      />

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DelayDistributionChart data={data.delayDistribution} />
        <FeeBreakdownChart feeBreakdown={data.feeBreakdown} totalFees={data.totalFees} />
      </div>

      {/* Settlement Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Gateway Payout & Settlement Ledger
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Discrepancy and fee audit records</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800">
                <th className="px-4 py-3 font-semibold text-slate-300">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-300">Reference</th>
                <th className="px-4 py-3 font-semibold text-slate-300">Merchant Order</th>
                <th className="px-4 py-3 font-semibold text-slate-300">Settlement Payout</th>
                <th className="px-4 py-3 font-semibold text-slate-300">Fee Deducted</th>
                <th className="px-4 py-3 font-semibold text-slate-300">Variance</th>
                <th className="px-4 py-3 font-semibold text-slate-300">Delay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {data.settlementTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <StatusBadge status={t.classification} />
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono font-medium text-slate-200">
                    {t.reference || t.caseNumber}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-slate-200">
                    <CurrencyText amount={t.merchantAmount} />
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-slate-200">
                    <CurrencyText amount={t.settlementAmount} />
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-purple-400">
                    <CurrencyText amount={t.fee} />
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono font-semibold">
                    {t.difference > 0 ? (
                      <span className="text-rose-400">
                        <CurrencyText amount={t.difference} showSign />
                      </span>
                    ) : (
                      <span className="text-slate-500">$0.00</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-slate-400">
                    {t.dateDelta !== undefined ? `${t.dateDelta} days` : '—'}
                  </td>
                </tr>
              ))}
              {data.settlementTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono">
                    No settlement anomalies or discrepancies recorded in this run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
