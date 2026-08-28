import React from 'react';
import { Download, FileText, Table, Globe } from 'lucide-react';
import { api } from '../../services/api.js';

interface Props {
  type: 'reconciliation' | 'exceptions' | 'settlements';
  title: string;
  description: string;
  icon: React.ReactNode;
  runId?: string;
}

export const ReportExporterCard: React.FC<Props> = ({
  type,
  title,
  description,
  icon,
  runId,
}) => {
  const handleDownload = (format: 'csv' | 'xlsx' | 'html') => {
    const url = api.getReportExportUrl(type, format, runId);
    window.open(url, '_blank');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">{title}</h3>
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold">{type} Ledger</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          {description}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
        <button
          onClick={() => handleDownload('csv')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors font-mono"
        >
          <Table className="w-3.5 h-3.5 text-cyan-400" />
          CSV
        </button>

        <button
          onClick={() => handleDownload('xlsx')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors font-mono"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          XLSX
        </button>

        <button
          onClick={() => handleDownload('html')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors font-mono"
        >
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          HTML
        </button>
      </div>
    </div>
  );
};
