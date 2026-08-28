import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Cpu, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal.js';

interface Props {
  isOpen: boolean;
  onComplete: () => void;
}

const steps = [
  { id: 1, title: 'Validating File Integrity', desc: 'Checking schemas, file sizes, and non-empty rows' },
  { id: 2, title: 'Parsing & Dynamic Column Mapping', desc: 'Extracting headers, amounts, dates, and references' },
  { id: 3, title: 'Canonical Financial Normalization', desc: 'Standardizing currencies, formats, and credits/debits' },
  { id: 4, title: 'Generating Matching Candidates', desc: 'Evaluating Level 1 to Level 6 multi-source relationships' },
  { id: 5, title: '3-Way Cross-Source Grouping & Classification', desc: 'Resolving Bank, Merchant, Settlement into unified cases' },
  { id: 6, title: 'Calculating Exposure & Persisting to SQLite', desc: 'Computing settlement intelligence and audit trail' },
];

export const ReconciliationProgressModal: React.FC<Props> = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length) {
          return prev + 1;
        }
        clearInterval(interval);
        setTimeout(onComplete, 500);
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Executing Multi-Source Reconciliation Engine"
      subtitle="Deterministic 3-Way Cross-Source Matching in Progress"
      maxWidth="md"
    >
      <div className="space-y-4 py-2">
        <div className="flex items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800 mb-6">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-8 h-8 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step) => {
            const isFinished = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200 shadow-md'
                    : isFinished
                    ? 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                    : 'bg-slate-950/20 border-slate-900 text-slate-600'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isFinished ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                      {step.id}
                    </div>
                  )}
                </div>

                <div className="overflow-hidden">
                  <div className="text-xs font-semibold">{step.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
