import React, { useState } from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { ColumnMappingResult, FilePreviewResponse } from '../../types/index.js';
import { Modal } from '../common/Modal.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sourceType: 'BANK' | 'MERCHANT' | 'SETTLEMENT';
  sourceTitle: string;
  preview: FilePreviewResponse | null;
  onSaveMapping: (mapping: ColumnMappingResult) => void;
}

export const MappingConfirmationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sourceType,
  sourceTitle,
  preview,
  onSaveMapping,
}) => {
  if (!preview) return null;

  const [currentMapping, setCurrentMapping] = useState<ColumnMappingResult>({
    ...preview.mapping,
  });

  const headers = preview.headers;

  const handleFieldChange = (key: keyof ColumnMappingResult, value: string) => {
    setCurrentMapping(prev => ({
      ...prev,
      [key]: value === '__NONE__' ? undefined : value,
    }));
  };

  const handleSave = () => {
    onSaveMapping(currentMapping);
    onClose();
  };

  const renderSelect = (label: string, fieldKey: keyof ColumnMappingResult, isRequired: boolean = false) => {
    const selectedVal = (currentMapping[fieldKey] as string) || '__NONE__';

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 border-b border-slate-800/80">
        <div>
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            {label}
            {isRequired && <span className="text-rose-400">*</span>}
          </label>
        </div>
        <select
          value={selectedVal}
          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
          className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-mono sm:w-60"
        >
          <option value="__NONE__">— Not Mapped / None —</option>
          {headers.map(h => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Confirm Column Mappings — ${sourceTitle}`}
      subtitle={`Verify or adjust semantic field assignments detected for ${preview.fileName}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            RECONX AI dynamically detected these columns by analyzing header tokens, data types, and row samples.
            You can modify the assignment below if your file uses a specialized layout.
          </span>
        </div>

        <div className="space-y-1">
          {renderSelect('Primary Reference / Transaction ID', 'referenceCol', true)}
          {renderSelect('Transaction Date', 'dateCol', true)}

          {sourceType === 'BANK' && (
            <>
              {renderSelect('Credit / Deposit Amount', 'creditCol')}
              {renderSelect('Debit / Withdrawal Amount', 'debitCol')}
              {renderSelect('Single Amount Column', 'amountCol')}
              {renderSelect('Running Balance (Ignored for Amount)', 'balanceCol')}
            </>
          )}

          {sourceType === 'MERCHANT' && (
            <>
              {renderSelect('Order Sale / Collected Amount', 'amountCol', true)}
              {renderSelect('Gross Amount', 'grossAmountCol')}
              {renderSelect('Customer Name', 'customerCol')}
              {renderSelect('Payment Method', 'paymentMethodCol')}
            </>
          )}

          {sourceType === 'SETTLEMENT' && (
            <>
              {renderSelect('Net Settlement / Payout Amount', 'amountCol', true)}
              {renderSelect('Gross Sales Amount', 'grossAmountCol')}
              {renderSelect('Payment Gateway Fee / MDR', 'feeCol')}
              {renderSelect('Tax / GST', 'taxCol')}
            </>
          )}

          {renderSelect('Description / Narration', 'descriptionCol')}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/10"
          >
            <Check className="w-4 h-4" />
            Confirm Mappings
          </button>
        </div>
      </div>
    </Modal>
  );
};
