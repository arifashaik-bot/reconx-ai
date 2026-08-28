import React, { useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, X, Settings2 } from 'lucide-react';
import { FilePreviewResponse } from '../../types/index.js';

interface Props {
  sourceType: 'BANK' | 'MERCHANT' | 'SETTLEMENT';
  title: string;
  subtitle: string;
  color: 'emerald' | 'cyan' | 'purple';
  icon: React.ReactNode;
  file: File | null;
  preview: FilePreviewResponse | null;
  isLoading: boolean;
  error?: string;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onConfigureMapping: () => void;
}

export const SourceUploadCard: React.FC<Props> = ({
  sourceType,
  title,
  subtitle,
  color,
  icon,
  file,
  preview,
  isLoading,
  error,
  onFileSelect,
  onFileRemove,
  onConfigureMapping,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const colorStyles = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
    cyan: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400',
    purple: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl transition-all duration-200 hover:border-slate-700/80">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorStyles[color]}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        {file && preview && (
          <button
            onClick={onConfigureMapping}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
            title="Inspect & Adjust Column Mappings"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Mapping</span>
          </button>
        )}
      </div>

      {/* Upload Zone or File Details */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl bg-slate-950/40 hover:bg-slate-950/70 transition-all duration-200 cursor-pointer min-h-[190px] text-center group"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFileSelect(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:scale-105 transition-all mb-3 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-xs font-semibold text-slate-200 mb-1">
            Drag & drop or <span className="text-cyan-400 underline">browse</span>
          </p>
          <p className="text-[11px] text-slate-500 font-mono">Supports CSV, XLSX, XLS (up to 25MB)</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4 min-h-[190px]">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-200 truncate font-mono" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB • {file.name.split('.').pop()?.toUpperCase()}
                  </div>
                </div>
              </div>

              <button
                onClick={onFileRemove}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoading && (
              <div className="mt-4 flex items-center gap-2 text-xs text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Analyzing and mapping headers dynamically...</span>
              </div>
            )}

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {preview && !isLoading && (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-900 font-mono text-[11px]">
                  <span className="text-slate-400">Total Rows Detected:</span>
                  <span className="font-semibold text-slate-200">{preview.totalRows}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-900 font-mono text-[11px]">
                  <span className="text-slate-400">Ref Identifier:</span>
                  <span className="text-cyan-400 font-semibold truncate max-w-[130px]">
                    {preview.mapping.referenceCol || '⚠️ Undetected'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 font-mono text-[11px]">
                  <span className="text-slate-400">Amount Column:</span>
                  <span className="text-emerald-400 font-semibold truncate max-w-[130px]">
                    {preview.mapping.amountCol || preview.mapping.creditCol || preview.mapping.grossAmountCol || '⚠️ Undetected'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {preview && !isLoading && (
            <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valid Source File</span>
              </div>
              <span className="text-slate-400 font-mono">
                Confidence: {preview.mapping.confidence}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
