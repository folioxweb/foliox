import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Settings, Newspaper, Flame } from 'lucide-react';
import { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';

import OverallInvestments from './OverallInvestments';
import AssetAllocation from './AssetAllocation';
import OverallSectorAllocation from './OverallSectorAllocation';
import StocksAllocation from './StocksAllocation';
import Button from '../../components/ui/Button';
import PrivacyToggle from '../../components/ui/PrivacyToggle';
import RefreshButton from '../../components/ui/RefreshButton';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import { useNavigate } from 'react-router-dom';
import TodayPerformance from './TodayPerformance';
import NewsPage from '../News/NewsPage';

function ErrorBanner({ onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3"
      style={{
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.25)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertCircle size={15} color="var(--loss)" className="flex-shrink-0" />
        <p className="text-sm font-medium truncate" style={{ color: 'var(--loss)' }}>
          Unable to load data. Check connection.
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onRetry} className="flex-shrink-0">
        <RefreshCw size={13} />
        Retry
      </Button>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { state, refreshAll, refreshing } = usePortfolio();
  const scrollRef = usePageScrollRestoration('dashboard');
  const navigate = useNavigate();
  const [newsPageOpen, setNewsPageOpen] = useState(false);
  const { overallInvestments, todayPerformance, assetAllocation, overallSectorAllocation, stocksAllocation } = state;

  const hasError =
    !!overallInvestments.error ||
    !!assetAllocation.error ||
    !!overallSectorAllocation.error ||
    !!stocksAllocation.error;

  return (
    <main
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto"
      style={{ background: 'var(--bg)', paddingBottom: '6rem' }}
      id="dashboard-main"
    >
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-20 px-4 flex items-center justify-between"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: '0.75rem',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
          <LoadingIndicator loading={refreshing} />
        </div>
        <div className="flex items-center gap-2">
          {/* Market News button */}
          <button
            id="dashboard-news-btn"
            onClick={() => setNewsPageOpen(true)}
            className="relative rounded-full p-2 transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            aria-label="View market news"
          >
            <Newspaper size={20} />
          </button>
          <RefreshButton onRefresh={refreshAll} />
          <PrivacyToggle />
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald)]"
            style={{
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)',
              color: 'var(--text-2)',
            }}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        <AnimatePresence>
          {hasError && <ErrorBanner key="err" onRetry={refreshAll} />}
        </AnimatePresence>

        <div>
          <OverallInvestments
            data={overallInvestments.data}
            todayData={todayPerformance.data}
            loading={overallInvestments.loading || todayPerformance.loading}
          />
          <TodayPerformance data={todayPerformance.data} loading={todayPerformance.loading} />
          <AssetAllocation data={assetAllocation.data} loading={assetAllocation.loading} />
          <OverallSectorAllocation data={overallSectorAllocation.data} loading={overallSectorAllocation.loading} />
          <StocksAllocation data={stocksAllocation.data} loading={stocksAllocation.loading} />
        </div>
      </div>

      {/* Market News Overlay */}
      <NewsPage
        isOpen={newsPageOpen}
        onClose={() => setNewsPageOpen(false)}
      />
    </main>
  );
}
