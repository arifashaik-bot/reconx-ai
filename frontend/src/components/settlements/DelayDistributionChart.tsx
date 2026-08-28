import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  data: { range: string; count: number; amount: number }[];
}

export const DelayDistributionChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const colors = ['#10b981', '#38bdf8', '#f59e0b', '#ef4444'];

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            Settlement Delay Distribution
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">Transaction date vs gateway settlement posting delta</p>
        </div>
      </div>

      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="range" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
              formatter={(val: any, name: string) => [
                name === 'count' ? `${val} Cases` : `$${val.toLocaleString()}`,
                name === 'count' ? 'Transactions' : 'Settled Amount',
              ]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
