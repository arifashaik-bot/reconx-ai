import React, { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, ArrowUpDown } from 'lucide-react';
import { ClassificationType, ReconciledCase } from '../types/index.js';
import { api } from '../services/api.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Pagination } from '../components/common/Pagination.js';
import { SkeletonLoader } from '../components/common/SkeletonLoader.js';
import { TransactionDetailDrawer } from '../components/transactions/TransactionDetailDrawer.js';
import { TransactionTable } from '../components/transactions/TransactionTable.js';

interface Props {
  runId?: string;
}

const statusFilters: { label: string; value: string }[] = [
  { label: 'All Transactions', value: 'ALL' },
  { label: 'Matched', value: 'MATCHED' },
  { label: 'Likely Match', value: 'LIKELY_MATCH' },
  { label: 'Amount Mismatch', value: 'AMOUNT_MISMATCH' },
  { label: 'Missing Record', value: 'MISSING' },
  { label: 'Missing Settlement', value: 'MISSING_SETTLEMENT' },
  { label: 'Duplicate', value: 'DUPLICATE' },
  { label: 'Partial Settlement', value: 'PARTIAL_SETTLEMENT' },
  { label: 'Timing Discrepancy', value: 'TIMING_DISCREPANCY' },
  { label: 'Review Required', value: 'REVIEW_REQUIRED' },
];

export const TransactionsPage: React.FC<Props> = ({ runId }) => {
  const [cases, setCases] = useState<ReconciledCase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCase, setSelectedCase] = useState<ReconciledCase | null>(null);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTransactions({
        runId,
        search: search.trim() || undefined,
        status: statusFilter,
        page,
        limit: 20,
        sortBy,
        sortOrder,
      });
      setCases(data.cases);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [runId, page, statusFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCases();
  };

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            Granular Financial Audit Table
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">Reconciled Transactions</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore 3-way grouped cases with confidence scores, amount variances, and evidence.
          </p>
        </div>

        <button
          onClick={fetchCases}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Reference ID, Order No, Customer, or Payment Method..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition-all font-mono"
          >
            Search
          </button>
        </form>

        {/* Status Pill Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {statusFilters.map((f) => {
            const isActive = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(1);
                }}
                className={`shrink-0 px-3 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transactions Table Content */}
      {isLoading ? (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <SkeletonLoader rows={8} />
        </div>
      ) : cases.length > 0 ? (
        <div className="space-y-2">
          <TransactionTable
            cases={cases}
            selectedCaseId={selectedCase?.id}
            onSelectCase={(c) => setSelectedCase(c)}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalRecords={total}
            pageSize={20}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 font-mono">
          No transaction cases match the selected search or filter criteria.
        </div>
      )}

      {/* Transaction Detail Drawer */}
      <TransactionDetailDrawer
        caseSummary={selectedCase}
        isOpen={selectedCase !== null}
        onClose={() => setSelectedCase(null)}
        onStatusUpdated={fetchCases}
      />
    </div>
  );
};
