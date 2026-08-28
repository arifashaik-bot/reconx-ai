import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CurrencyText } from '../common/CurrencyText.js';

interface Props {
  feeBreakdown: { category: string; amount: number; percentage: number }[];
  totalFees: number;
}

export const FeeBreakdownChart: React.FC<Props> = ({ feeBreakdown, totalFees }) => {
  if (!feeBreakdown || feeBreakdown.length === 0) return null;

  const colors = ['#8b5cf6', '#38bdf8', '#f59e0b'];

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            Gateway Fee & Deduction Breakdown
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">Total deductions: <CurrencyText amount={totalFees} /></p>
        </div>
      </div>

      <div className="h-[230px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={feeBreakdown}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="amount"
              nameKey="category"
            >
              {feeBreakdown.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
              formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Fee Amount']}
            />
            <Legend
              formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
