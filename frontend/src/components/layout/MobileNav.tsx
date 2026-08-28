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
} from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileNav: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const items = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'reconcile', label: 'Reconcile', icon: GitMerge },
    { id: 'transactions', label: 'Txns', icon: ArrowLeftRight },
    { id: 'exceptions', label: 'Exceptions', icon: AlertOctagon },
    { id: 'settlements', label: 'Settlements', icon: CreditCard },
    { id: 'ai-analyst', label: 'AI', icon: Sparkles },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
