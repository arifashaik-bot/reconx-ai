import React, { useEffect, useState } from 'react';
import { DashboardOverview } from './types/index.js';
import { api } from './services/api.js';
import { Header } from './components/layout/Header.js';
import { MobileNav } from './components/layout/MobileNav.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { AiAnalystPage } from './pages/AiAnalystPage.js';
import { ExceptionsPage } from './pages/ExceptionsPage.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { PublicHomePage } from './pages/PublicHomePage.js';
import { ReconcilePage } from './pages/ReconcilePage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { SettlementsPage } from './pages/SettlementsPage.js';
import { TransactionsPage } from './pages/TransactionsPage.js';

export const App: React.FC = () => {
  // Navigation view: 'home' for public landing page, 'workspace' for operational app
  const [currentView, setCurrentView] = useState<'home' | 'workspace'>('home');
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [activeRunId, setActiveRunId] = useState<string | undefined>();
  const [overviewData, setOverviewData] = useState<DashboardOverview | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const fetchOverview = async (runId?: string) => {
    setIsRefreshing(true);
    try {
      const data = await api.getDashboardOverview(runId);
      setOverviewData(data);
      if (data.hasData && data.runId) {
        setActiveRunId(data.runId);
      }
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentView === 'workspace') {
      fetchOverview(activeRunId);
    }
  }, [activeRunId, currentView]);

  const handleLaunchDemo = async () => {
    setIsDemoLoading(true);
    try {
      const res = await api.triggerDemoRun();
      setActiveRunId(res.runId);
      await fetchOverview(res.runId);
      setCurrentView('workspace');
      setCurrentTab('overview');
    } catch (err) {
      console.error('Failed to launch demo run:', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleStartReconciliation = () => {
    setCurrentView('workspace');
    setCurrentTab('reconcile');
  };

  const handleReconciliationCompleted = (newRunId: string) => {
    setActiveRunId(newRunId);
    fetchOverview(newRunId);
    setCurrentTab('overview');
  };

  if (currentView === 'home') {
    return (
      <PublicHomePage
        onStartReconciliation={handleStartReconciliation}
        onExploreDemo={handleLaunchDemo}
        isDemoLoading={isDemoLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans antialiased text-slate-100 selection:bg-cyan-500/20">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onLaunchDemo={handleLaunchDemo}
          onNavigateHome={() => setCurrentView('home')}
          isDemoLoading={isDemoLoading}
        />
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          runName={overviewData?.runName}
          isDemo={overviewData?.isDemo}
          onNewReconciliation={() => setCurrentTab('reconcile')}
          onRefreshData={() => fetchOverview(activeRunId)}
          onNavigateHome={() => setCurrentView('home')}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'overview' && (
            <OverviewPage
              data={overviewData}
              onNavigateToReconcile={() => setCurrentTab('reconcile')}
              onNavigateToExceptions={() => setCurrentTab('exceptions')}
              onNavigateToTransactions={() => setCurrentTab('transactions')}
            />
          )}

          {currentTab === 'reconcile' && (
            <ReconcilePage onReconciliationCompleted={handleReconciliationCompleted} />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage runId={activeRunId} />
          )}

          {currentTab === 'exceptions' && (
            <ExceptionsPage runId={activeRunId} />
          )}

          {currentTab === 'settlements' && (
            <SettlementsPage runId={activeRunId} />
          )}

          {currentTab === 'ai-analyst' && (
            <AiAnalystPage runId={activeRunId} runName={overviewData?.runName} />
          )}

          {currentTab === 'reports' && (
            <ReportsPage runId={activeRunId} runName={overviewData?.runName} />
          )}

          {currentTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
};

export default App;
