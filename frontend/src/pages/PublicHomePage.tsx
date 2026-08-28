import React from 'react';
import {
  ArrowRight,
  Building2,
  Store,
  CreditCard,
  Cpu,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Zap,
  Layers,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Search,
  Scale,
  Check,
  Percent,
} from 'lucide-react';
import { ReconciliationGraph3D } from '../components/visualization/ReconciliationGraph3D.js';

interface Props {
  onStartReconciliation: () => void;
  onExploreDemo: () => void;
  isDemoLoading?: boolean;
}

export const PublicHomePage: React.FC<Props> = ({
  onStartReconciliation,
  onExploreDemo,
  isDemoLoading,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20">
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-cyan-500/20">
              R
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>RECONX</span>
                <span className="text-cyan-400 text-xs px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30">AI</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#problem" className="hover:text-cyan-400 transition-colors">Problem</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#ai-analyst" className="hover:text-cyan-400 transition-colors">AI Analyst</a>
            <a href="#settlement" className="hover:text-cyan-400 transition-colors">Settlements</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onExploreDemo}
              disabled={isDemoLoading}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>{isDemoLoading ? 'Launching...' : 'Demo Mode'}</span>
            </button>

            <button
              onClick={onStartReconciliation}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-cyan-500/20 active:scale-98 uppercase tracking-wider font-mono"
            >
              <span>Start Reconciliation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-24 sm:space-y-32">
        
        {/* HERO SECTION */}
        <section className="relative pt-16 sm:pt-24 pb-12 px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deterministic 3-Way Cross-Source Financial Reconciliation</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
              Turn Payment Chaos <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Into Financial Clarity.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              AI-powered financial reconciliation that connects bank statements, merchant ledgers, and settlement reports into one intelligent workspace.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={onStartReconciliation}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 text-sm font-extrabold transition-all shadow-xl shadow-cyan-500/25 active:scale-98 font-mono flex items-center justify-center gap-2"
              >
                <span>Start Reconciliation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreDemo}
                disabled={isDemoLoading}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-current" />
                <span>{isDemoLoading ? 'Generating Demo Data...' : 'Explore Demo Dataset'}</span>
              </button>
            </div>

            {/* 3D Interactive Node Visualization */}
            <div className="pt-10 max-w-4xl mx-auto">
              <ReconciliationGraph3D
                nodeMetrics={{
                  bank: { source: 'Bank Statement', fileName: 'Chase_Deposits_Aug.csv', totalRows: 1420, amount: 245900.50, matched: 1390, exceptions: 30 },
                  merchant: { source: 'Merchant Ledger', fileName: 'Shopify_Sales_Orders.csv', totalRows: 1420, amount: 245900.50, matched: 1390, exceptions: 30 },
                  settlement: { source: 'Settlement Report', fileName: 'Stripe_Gateway_Payouts.csv', totalRows: 1420, amount: 239750.20, matched: 1390, exceptions: 30 },
                }}
                matchRate={97.8}
              />
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section id="problem" className="px-6 py-12 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono text-rose-400 uppercase tracking-wider font-bold">The Broken State of Reconciliation</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Financial reconciliation shouldn't be a spreadsheet investigation.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              When payments flow across banks, gateway aggregators, and merchant systems, manual comparisons create critical financial blind spots.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Hidden Discrepancies</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Minor rounding differences, stealth fee deductions, and currency conversions slipping past manual audits.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Missing Settlements</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sales recorded in your storefront that were never paid out or received in your commercial bank account.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Amount Mismatches</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Invoices paid with differing gross values without documented dispute, chargeback, or fee adjustments.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Duplicate Records</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Double-credited transactions in batch feeds artificially inflating perceived revenue and ledger balances.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Delayed Investigations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Days spent cross-referencing CSVs line-by-line during monthly financial close without explainability.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Unclear Financial Exposure</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lack of total exposure calculations leaves leadership blind to actual uncollected or misallocated cash.
              </p>
            </div>
          </div>
        </section>

        {/* SOLUTION SECTION */}
        <section className="px-6 py-12 bg-slate-900/40 border-y border-slate-800/80">
          <div className="max-w-6xl mx-auto text-center space-y-12">
            <div className="max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">The Solution</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                One workspace. Every financial record connected.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                  <Building2 className="w-4 h-4" /> Bank Statement
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real cash movements, credits, debits, and reference numbers. Running balances are strictly isolated.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/30">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-2">
                  <Store className="w-4 h-4" /> Merchant Ledger
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sales orders, invoice numbers, gross transaction values, customer data, and checkout channels.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-purple-500/30">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-2">
                  <CreditCard className="w-4 h-4" /> Settlement Report
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gateway net payouts, merchant discount rate (MDR) fee deductions, taxes, and payout timestamp logs.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 text-center max-w-2xl mx-auto">
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
                Deterministic 3-Way Reconciliation Core
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Calculates real match rates, pinpoints variance to the exact dollar, and creates single multi-source cases.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="px-6 py-12 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">End-to-End Workflow</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              How RECONX AI Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xl font-bold font-mono text-cyan-400">01</div>
              <h3 className="text-sm font-bold text-slate-100">Upload Sources</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drag and drop your Bank Statement, Merchant Ledger, and Payment Settlement Report in CSV, XLSX, or XLS format.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xl font-bold font-mono text-cyan-400">02</div>
              <h3 className="text-sm font-bold text-slate-100">Dynamic Normalization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The engine inspects header semantics and row samples dynamically. Amounts, currencies, dates, and references are standardized.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xl font-bold font-mono text-cyan-400">03</div>
              <h3 className="text-sm font-bold text-slate-100">3-Way Reconciliation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                7-level candidate matching groups related records into one unified case, assessing amount differences and timing tolerances.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xl font-bold font-mono text-cyan-400">04</div>
              <h3 className="text-sm font-bold text-slate-100">Resolve & Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Investigate exceptions with AI or rule evidence, adjust records, mark resolutions, and export audit-ready CSV, XLSX, or HTML reports.
              </p>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="px-6 py-12 bg-slate-900/30 border-y border-slate-800/80">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">Comprehensive Capabilities</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Enterprise Financial Integrity Engine
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <Cpu className="w-6 h-6 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">Intelligent Reconciliation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluates exact IDs, sub-references, amounts, date windows, and metadata simultaneously without forcing false matches.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <Layers className="w-6 h-6 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Dynamic Column Mapping</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Never requires rigid column headers. Dynamically identifies sale proceeds, credits, debits, gross values, and payout amounts.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
                <h3 className="text-sm font-bold text-slate-100">Exception Command Center</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Surfaces amount mismatches, missing settlements, and duplicate entries with root-cause explanations and resolution actions.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <CreditCard className="w-6 h-6 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">Settlement Intelligence</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Audits payment gateway fee deductions (MDR), tracks payout delay distributions, and quantifies total financial exposure.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">AI Financial Analyst</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ask natural language questions about your active reconciliation run. Fully grounded in SQLite without numerical hallucinations.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <FileSpreadsheet className="w-6 h-6 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Audit-Ready Reporting</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download full reconciliation ledgers, exception reports, and settlement breakdowns in CSV, Excel XLSX, and Executive HTML formats.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI ANALYST SPOTLIGHT SECTION */}
        <section id="ai-analyst" className="px-6 py-12 max-w-5xl mx-auto">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/30 shadow-2xl space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Grounded Natural Language Assistant</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ask your reconciliation data.
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Finance controllers can query the active reconciliation run in plain English. RECONX AI inspects the database to explain match drivers, locate top discrepancies, and summarize missing funds.
            </p>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono text-slate-300">
              <div className="text-slate-500">// Example Controller Query:</div>
              <div className="text-cyan-400 font-semibold">"Explain why our match rate changed and summarize top missing settlements."</div>
              <div className="text-slate-400 pt-2 border-t border-slate-800 text-[11px] font-sans leading-relaxed">
                👉 Deterministic backend calculations query real SQLite records, evaluating exact dollar values, delay days, and gateway MDR rates with zero invented figures.
              </div>
            </div>
          </div>
        </section>

        {/* EXCEPTION EXPLANATION WORKFLOW */}
        <section className="px-6 py-12 max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono text-rose-400 uppercase tracking-wider font-bold">Explainability by Design</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Don't just flag problems — explain them.
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono">
            <span className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">Financial Records</span>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <span className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">Detection</span>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <span className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">Evidence</span>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <span className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400">Explanation</span>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <span className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-purple-400">Recommended Action</span>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <span className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">Resolution</span>
          </div>
        </section>

        {/* SETTLEMENT CASCADE WORKFLOW */}
        <section id="settlement" className="px-6 py-12 bg-slate-900/40 border-y border-slate-800/80">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider font-bold">Settlement Economics</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Trace every cent from customer to bank.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-left">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block">Step 1</span>
                <span className="text-xs font-bold text-slate-200 block mt-0.5">Customer Payment</span>
                <p className="text-[11px] text-slate-400 mt-1">Initiated at checkout gateway.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block">Step 2</span>
                <span className="text-xs font-bold text-cyan-400 block mt-0.5">Gross Collection</span>
                <p className="text-[11px] text-slate-400 mt-1">Recorded in merchant ledger.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block">Step 3</span>
                <span className="text-xs font-bold text-purple-400 block mt-0.5">Fees & Deductions</span>
                <p className="text-[11px] text-slate-400 mt-1">Audited MDR, tax, and adjustments.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
                <span className="text-[10px] font-mono text-slate-500 block">Step 4</span>
                <span className="text-xs font-bold text-emerald-400 block mt-0.5">Net Bank Deposit</span>
                <p className="text-[11px] text-slate-400 mt-1">Matched to verified bank statement.</p>
              </div>
            </div>
          </div>
        </section>

        {/* DEMO CTA SECTION */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 text-center space-y-6">
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Demo Data — Synthetic
            </span>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              See RECONX AI in action.
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Launch our pre-packaged synthetic evaluation dataset to immediately explore 3D visualizations, multi-source matched cases, exception workflows, and settlement intelligence.
            </p>

            <button
              onClick={onExploreDemo}
              disabled={isDemoLoading}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-amber-500/20 active:scale-98 font-mono disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isDemoLoading ? 'Generating Dataset...' : 'Launch Demo Dataset'}</span>
            </button>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="px-6 py-16 text-center max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to reconcile with confidence?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Upload your Bank Statement, Merchant Ledger, and Settlement Report to start automated reconciliation in seconds.
          </p>
          <button
            onClick={onStartReconciliation}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 text-sm font-extrabold transition-all shadow-xl shadow-cyan-500/25 active:scale-98 font-mono inline-flex items-center gap-2"
          >
            <span>Start Reconciliation Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>

      </main>

      {/* MINIMAL FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">RECONX AI</span>
            <span>—</span>
            <span>Turn payment chaos into financial clarity.</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <button onClick={onStartReconciliation} className="hover:text-cyan-400 transition-colors">Overview</button>
            <button onClick={onStartReconciliation} className="hover:text-cyan-400 transition-colors">Reconcile</button>
            <button onClick={onStartReconciliation} className="hover:text-cyan-400 transition-colors">Transactions</button>
            <button onClick={onStartReconciliation} className="hover:text-cyan-400 transition-colors">Exceptions</button>
            <button onClick={onStartReconciliation} className="hover:text-cyan-400 transition-colors">Settlements</button>
            <button onClick={onStartReconciliation} className="hover:text-cyan-400 transition-colors">AI Analyst</button>
            <button onClick={onStartReconciliation} className="hover:text-cyan-400 transition-colors">Reports</button>
          </div>
        </div>
      </footer>

    </div>
  );
};
