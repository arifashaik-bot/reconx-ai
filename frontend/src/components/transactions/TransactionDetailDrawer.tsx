import React, { useEffect, useState } from 'react';
import { X, Building2, Store, CreditCard, ShieldCheck, ShieldAlert, Clock, ArrowRight, Activity, Sparkles, Check } from 'lucide-react';
import { ReconciledCase, SourceRecord } from '../../types/index.js';
import { api } from '../../services/api.js';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator.js';
import { CurrencyText } from '../common/CurrencyText.js';
import { StatusBadge } from '../common/StatusBadge.js';

interface Props {
  caseSummary: ReconciledCase | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export const TransactionDetailDrawer: React.FC<Props> = ({
  caseSummary,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const [details, setDetails] = useState<ReconciledCase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (!caseSummary?.id || !isOpen) {
      setDetails(null);
      setAiNote(null);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const data = await api.getTransactionDetails(caseSummary.id);
        setDetails(data);
      } catch (err) {
        console.error('Failed to load transaction case details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [caseSummary?.id, isOpen]);

  const handleAskAiForCase = async () => {
    if (!details) return;
    setIsAiLoading(true);
    try {
      const res = await api.queryAiAnalyst(`Explain transaction case ${details.primaryReference || details.caseNumber} and why it was classified as ${details.classification}.`, details.runId);
      setAiNote(res.answer);
    } catch (err) {
      console.error('Failed to query AI for case:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentCase = details || caseSummary;
  if (!currentCase) return null;

  const bankRecord = details?.sourceRecords?.find(s => s.sourceType === 'BANK');
  const merchantRecord = details?.sourceRecords?.find(s => s.sourceType === 'MERCHANT');
  const settlementRecord = details?.sourceRecords?.find(s => s.sourceType === 'SETTLEMENT');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/40 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {currentCase.caseNumber}
                </span>
                <StatusBadge status={currentCase.classification} size="md" />
              </div>
              <h2 className="text-lg font-bold text-slate-100 font-mono tracking-tight mt-1">
                {currentCase.primaryReference || 'Transaction Case'}
              </h2>
              {currentCase.customer && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Customer: <span className="text-slate-200 font-medium">{currentCase.customer}</span> • Method: <span className="text-slate-200">{currentCase.paymentMethod || 'Standard'}</span>
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            
            {/* Top Metrics Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400">Match Confidence</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <ConfidenceIndicator score={currentCase.confidenceScore} />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400">Matching Method</span>
                <div className="mt-1.5 text-xs font-semibold text-slate-200 font-mono truncate">
                  {currentCase.matchingMethod}
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border ${
                currentCase.financialDifference > 0
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
              }`}>
                <span className="text-[11px] opacity-80">Financial Variance</span>
                <div className="mt-1 text-sm font-bold font-mono">
                  <CurrencyText amount={currentCase.financialDifference} />
                </div>
              </div>
            </div>

            {/* 3-Source Comparison Grid */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                3-Way Cross-Source Ledger Comparison
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Bank */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  bankRecord ? 'bg-slate-950/70 border-emerald-500/30' : 'bg-slate-950/30 border-dashed border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs mb-2">
                      <Building2 className="w-4 h-4" /> Bank Statement
                    </div>
                    {bankRecord ? (
                      <div className="space-y-1 font-mono">
                        <div className="text-base font-bold text-slate-100">
                          <CurrencyText amount={bankRecord.amount} />
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">Ref: {bankRecord.reference || '—'}</div>
                        <div className="text-[11px] text-slate-400">Date: {bankRecord.date ? bankRecord.date.split('T')[0] : '—'}</div>
                      </div>
                    ) : (
                      <div className="text-slate-500 py-3 font-mono">⚠️ Record Missing</div>
                    )}
                  </div>
                </div>

                {/* Merchant */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  merchantRecord ? 'bg-slate-950/70 border-cyan-500/30' : 'bg-slate-950/30 border-dashed border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs mb-2">
                      <Store className="w-4 h-4" /> Merchant Ledger
                    </div>
                    {merchantRecord ? (
                      <div className="space-y-1 font-mono">
                        <div className="text-base font-bold text-slate-100">
                          <CurrencyText amount={merchantRecord.amount} />
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">Order: {merchantRecord.reference || '—'}</div>
                        <div className="text-[11px] text-slate-400">Date: {merchantRecord.date ? merchantRecord.date.split('T')[0] : '—'}</div>
                      </div>
                    ) : (
                      <div className="text-slate-500 py-3 font-mono">⚠️ Record Missing</div>
                    )}
                  </div>
                </div>

                {/* Settlement */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  settlementRecord ? 'bg-slate-950/70 border-purple-500/30' : 'bg-slate-950/30 border-dashed border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-xs mb-2">
                      <CreditCard className="w-4 h-4" /> Settlement Report
                    </div>
                    {settlementRecord ? (
                      <div className="space-y-1 font-mono">
                        <div className="text-base font-bold text-slate-100">
                          <CurrencyText amount={settlementRecord.amount} />
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">Payout: {settlementRecord.reference || '—'}</div>
                        <div className="text-[11px] text-slate-400">Date: {settlementRecord.date ? settlementRecord.date.split('T')[0] : '—'}</div>
                      </div>
                    ) : (
                      <div className="text-slate-500 py-3 font-mono">⚠️ Record Missing</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reconciliation Explanation & Action */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Engine Classification Analysis
                </span>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {currentCase.explanation}
                </p>
              </div>

              {currentCase.recommendedAction && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    Recommended Action
                  </span>
                  <p className="text-xs text-slate-300 mt-0.5">
                    👉 {currentCase.recommendedAction}
                  </p>
                </div>
              )}
            </div>

            {/* Evidence List */}
            {details?.evidence && details.evidence.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                  Matching Evidence Trail
                </h4>
                <div className="space-y-2">
                  {details.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <span className="font-semibold text-slate-200 font-mono text-[11px] block">{ev.type}</span>
                        <span className="text-slate-400 text-xs">{ev.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Deep Dive for Case */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>AI Senior Analyst Deep-Dive</span>
                </div>
                {!aiNote && (
                  <button
                    onClick={handleAskAiForCase}
                    disabled={isAiLoading}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {isAiLoading ? 'Analyzing DB...' : 'Analyze Case'}
                  </button>
                )}
              </div>

              {aiNote && (
                <div className="mt-3 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap text-xs font-sans">
                  {aiNote}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Status: {currentCase.status}</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
