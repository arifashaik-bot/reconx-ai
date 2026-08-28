import React from 'react';
import { Sparkles, HelpCircle, ShieldCheck } from 'lucide-react';
import { AiChatInterface } from '../components/ai/AiChatInterface.js';

interface Props {
  runId?: string;
  runName?: string;
}

export const AiAnalystPage: React.FC<Props> = ({ runId, runName }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
          Natural Language Financial Intelligence
        </span>
        <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">AI Reconciliation Analyst</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Ask questions in plain English about your reconciliation run, investigate high-risk exceptions, and audit gateway fees.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Strict Grounding Guarantee:</span> RECONX AI calculates all financial metrics, variances, and counts deterministically from SQLite. Answers are strictly grounded in your active reconciliation run and never hallucinate numbers.
        </div>
      </div>

      {/* Chat Workspace */}
      <AiChatInterface runId={runId} runName={runName} />
    </div>
  );
};
