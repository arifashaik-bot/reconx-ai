import React from 'react';
import { FileSpreadsheet, ShieldAlert, CreditCard, DownloadCloud } from 'lucide-react';
import { ReportExporterCard } from '../components/reports/ReportExporterCard.js';

interface Props {
  runId?: string;
  runName?: string;
}

export const ReportsPage: React.FC<Props> = ({ runId, runName }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
          Executive & Audit Exports
        </span>
        <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">Financial Reports & Exports</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate formal CSV, Excel XLSX, and formatted HTML executive reports directly from the current reconciliation database.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Reconciliation Report */}
        <ReportExporterCard
          type="reconciliation"
          title="Full Reconciliation Ledger"
          description="Comprehensive ledger containing all 3-way grouped cases, confidence scores, source amounts, matching methods, and variances."
          icon={<FileSpreadsheet className="w-5 h-5" />}
          runId={runId}
        />

        {/* Exceptions Report */}
        <ReportExporterCard
          type="exceptions"
          title="Exceptions & Variances Report"
          description="Detailed breakdown of open and resolved exceptions, affected sources, amount differences, root-cause explanations, and recommended actions."
          icon={<ShieldAlert className="w-5 h-5" />}
          runId={runId}
        />

        {/* Settlements Report */}
        <ReportExporterCard
          type="settlements"
          title="Settlement & Fee Intelligence"
          description="Audit report summarizing gross order volume, gateway MDR deductions, net bank payouts, and payment delay timelines."
          icon={<CreditCard className="w-5 h-5" />}
          runId={runId}
        />
      </div>

      {/* Report Specifications info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-xs text-slate-400 space-y-3">
        <h4 className="text-sm font-bold text-slate-200 font-mono flex items-center gap-2">
          <DownloadCloud className="w-4 h-4 text-cyan-400" />
          Export Formats & Audit Compatibility
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[11px] pt-1">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">CSV (Comma-Separated)</span>
            <span>Raw flat tables suitable for importing into ERPs, NetSuite, SAP, or custom data pipelines.</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-1">XLSX (Excel Workbook)</span>
            <span>SheetJS-generated workbooks with formatted headers, auto-typed cells, and numeric precision.</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">HTML (Executive Briefing)</span>
            <span>Standalone, printable web report with dark fintech design, KPI summary blocks, and audit signatures.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
