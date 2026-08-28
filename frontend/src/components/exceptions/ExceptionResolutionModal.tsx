import React, { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { ExceptionItem } from '../../types/index.js';
import { Modal } from '../common/Modal.js';

interface Props {
  isOpen: boolean;
  exception: ExceptionItem | null;
  onClose: () => void;
  onConfirm: (id: string, status: 'RESOLVED' | 'IGNORED', notes: string) => void;
}

export const ExceptionResolutionModal: React.FC<Props> = ({
  isOpen,
  exception,
  onClose,
  onConfirm,
}) => {
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState<'RESOLVED' | 'IGNORED'>('RESOLVED');

  if (!exception) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(exception.id, actionType, notes);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolve Financial Exception"
      subtitle={`Case Reference: ${exception.reconciledCase?.primaryReference || exception.caseId}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">Action Status</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActionType('RESOLVED')}
              className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                actionType === 'RESOLVED'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Mark as Resolved
            </button>
            <button
              type="button"
              onClick={() => setActionType('IGNORED')}
              className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                actionType === 'IGNORED'
                  ? 'bg-slate-800 border-slate-600 text-slate-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Mark as Ignored
            </button>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Resolution Notes / Audit Explanation
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g., Verified bank deposit timing lag; difference adjusted in ledger..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/10"
          >
            <Check className="w-4 h-4" />
            Confirm Resolution
          </button>
        </div>
      </form>
    </Modal>
  );
};
