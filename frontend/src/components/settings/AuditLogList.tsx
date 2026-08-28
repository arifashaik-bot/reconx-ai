import React, { useEffect, useState } from 'react';
import { History, Shield } from 'lucide-react';
import { AuditLog } from '../../types/index.js';
import { api } from '../../services/api.js';

export const AuditLogList: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const data = await api.getAuditLogs(50);
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4">
        <History className="w-5 h-5 text-cyan-400" />
        <div>
          <h3 className="text-base font-bold text-slate-100">Financial Audit & Activity Trail</h3>
          <p className="text-xs text-slate-400 mt-0.5">Immutable record of file uploads, runs, mappings, and exception resolutions</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800">
              <th className="px-4 py-3 font-semibold text-slate-300">Timestamp</th>
              <th className="px-4 py-3 font-semibold text-slate-300">Action</th>
              <th className="px-4 py-3 font-semibold text-slate-300">Details</th>
              <th className="px-4 py-3 font-semibold text-slate-300">Run Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-[11px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-200">{log.details}</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                  {log.run?.name || '—'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No audit logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
