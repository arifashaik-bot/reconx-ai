import React from 'react';
import { ArrowDownRight, ArrowRight, CheckCircle2, DollarSign, ShieldAlert } from 'lucide-react';
import { CurrencyText } from '../common/CurrencyText.js';

interface Props {
  flow?: {
    merchantGross: number;
    bankReceived: number;
    settlementNet: number;
    feesDeducted: number;
    unreconciledDifference: number;
  };
}

export const FinancialFlowChart: React.FC<Props> = ({ flow }) => {
  if (!flow) return null;

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-cyan-400" />
          Financial Flow & Exposure Cascade
        </h4>
        <span className="text-xs text-slate-400 font-mono">Calculated from Ledger Records</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {/* Step 1: Merchant Gross */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide">1. Merchant Gross</span>
            <div className="text-lg font-bold text-slate-100 font-mono mt-1">
              <CurrencyText amount={flow.merchantGross} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Gross sale orders posted in merchant catalog.</p>
        </div>

        {/* Step 2: Bank Statement Received */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">2. Bank Deposits</span>
            <div className="text-lg font-bold text-slate-100 font-mono mt-1">
              <CurrencyText amount={flow.bankReceived} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Verified cash inflow deposits credited to bank.</p>
        </div>

        {/* Step 3: Settlement Net & Fees */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wide">3. Net Settlement</span>
            <div className="text-lg font-bold text-slate-100 font-mono mt-1">
              <CurrencyText amount={flow.settlementNet} />
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Fee deductions: <span className="text-purple-300"><CurrencyText amount={flow.feesDeducted} /></span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Net payout after gateway processing fees.</p>
        </div>

        {/* Step 4: Discrepancies */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          flow.unreconciledDifference > 0 ? 'bg-rose-950/20 border-rose-500/30' : 'bg-emerald-950/20 border-emerald-500/30'
        }`}>
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5 ${
              flow.unreconciledDifference > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {flow.unreconciledDifference > 0 ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              4. Unreconciled Variance
            </span>
            <div className={`text-lg font-bold font-mono mt-1 ${
              flow.unreconciledDifference > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              <CurrencyText amount={flow.unreconciledDifference} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {flow.unreconciledDifference > 0
              ? 'Unmatched or differing amounts requiring review.'
              : 'Zero unresolved financial variance across sources.'}
          </p>
        </div>
      </div>
    </div>
  );
};
