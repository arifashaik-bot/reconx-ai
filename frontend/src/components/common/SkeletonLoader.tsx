import React from 'react';

interface Props {
  className?: string;
  rows?: number;
}

export const SkeletonLoader: React.FC<Props> = ({ className = 'h-6 w-full', rows = 1 }) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`bg-slate-800/60 animate-pulse rounded-lg border border-slate-700/30 ${className}`}
        />
      ))}
    </div>
  );
};
