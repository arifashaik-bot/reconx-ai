import React from 'react';
import {
  LayoutDashboard,
  GitMerge,
  ArrowLeftRight,
  AlertOctagon,
  CreditCard,
  Sparkles,
  FileSpreadsheet,
  Settings,
  Zap,
  Home,
} from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLaunchDemo: () => void;
  onNavigateHome?: () => void;
  isDemoLoading?: boolean;
}

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  onLaunchDemo,
  onNavigateHome,
  isDemoLoading,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'reconcile', label: 'Reconcile', icon: GitMerge, badge: 'Core' },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'exceptions', label: 'Exceptions', icon: AlertOctagon },
    { id: 'settlements', label: 'Settlements', icon: CreditCard },
    { id: 'ai-analyst', label: 'AI Analyst', icon: Sparkles },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 backdrop-blur-md z-30">
      {/* Brand & Logo */}
      <div>
        <div className="p-6 border-b border-slate-800/60">
          <div
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group"
            title="Click to view Public Homepage"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              R
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>RECONX</span>
                <span className="text-cyan-400 text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 tracking-tight font-medium mt-0.5 group-hover:text-cyan-400 transition-colors">
                Turn payment chaos into financial clarity.
              </p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent transition-all mb-2"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>Public Homepage</span>
            </button>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Demo Action Banner */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">Evaluation Demo</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            Instant synthetic dataset with exact matches, mismatches, and timing anomalies.
          </p>
          <button
            onClick={onLaunchDemo}
            disabled={isDemoLoading}
            className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{isDemoLoading ? 'Generating...' : 'Launch Demo Mode'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
