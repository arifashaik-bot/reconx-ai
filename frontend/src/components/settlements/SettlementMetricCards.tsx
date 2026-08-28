import React from 'react';
import { DollarSign, Clock, ShieldAlert, Percent, ArrowUpRight, CheckCircle } from 'lucide-react';
import { CurrencyText } from '../common/CurrencyText.js';

interface Props {
  grossCollections: number;
  netSettlements: number;
  totalFees: number;
  pendingSettlements: number;
  averageDelayDays: number;
  financialExposure: number;
}

export const SettlementMetricCards: React.FC<Props> = ({
  grossCollections,
  netSettlements,
  totalFees,
  pendingSettlements,
  averageDelayDays,
  financialExposure,
}) => {
  const feeRatio = grossCollections > 0 ? ((totalFees / grossCollections) * 100).toFixed(2) : '0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {/* Gross Collections */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Gross Volume</span>
          <DollarSign className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-xl font-bold font-mono text-slate-100">
          <CurrencyText amount={grossCollections} />
        </div>
        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Total sales processed</span>
      </div>

      {/* Net Settlements */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Net Settlements</span>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-bold font-mono text-emerald-400">
          <CurrencyText amount={netSettlements} />
        </div>
        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Received in bank</span>
      </div>

      {/* Gateway Fees */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Gateway Fees</span>
          <Percent className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-xl font-bold font-mono text-purple-400">
          <CurrencyText amount={totalFees} />
        </div>
        <span className="text-[10px] text-slate-500 font-mono mt-1 block">{feeRatio}% effective MDR</span>
      </div>

      {/* Pending Settlements */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Pending Payouts</span>
          <ArrowUpRight className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl font-bold font-mono text-amber-400">
          <CurrencyText amount={pendingSettlements} />
        </div>
        <span className="text-[10px] text-slate-500 font-mono mt-1 block">In transit or missing</span>
      </div>

      {/* Avg Delay */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Avg Payout Lag</span>
          <Clock className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-xl font-bold font-mono text-slate-100">
          {averageDelayDays} <span className="text-xs font-normal text-slate-400">days</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Transaction to payout</span>
      </div>

      {/* Total Exposure */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Total Exposure</span>
          <ShieldAlert className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-xl font-bold font-mono text-rose-400">
          <CurrencyText amount={financialExposure} />
        </div>
        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Discrepancies at risk</span>
      </div>
    </div>
  );
};
