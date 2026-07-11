import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, BarChart2 } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import Skeleton from '../../components/ui/Skeleton';
import PrivacyToggle from '../../components/ui/PrivacyToggle';
import { usePrivacy } from '../../context/PrivacyContext';
import RefreshButton from '../../components/ui/RefreshButton';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

// ─── Framer Motion variants ───────────────────────────────────────────────────

const pageVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

// ─── List Components ──────────────────────────────────────────────────────────

function FullSectorList({ data, loading }) {
  const { isPrivacyMode } = usePrivacy();

  if (!data) {
  return <Skeleton width="100%" height={300} rounded="xl" />;
}

  const sortedData = [...data].sort((a, b) => b.allocation - a.allocation);

  return (
    <div className="space-y-4">
      {sortedData.map((item, i) => (
        <div key={item.sector} className="flex flex-col gap-1">
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-slate-200">{item.sector}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {isPrivacyMode ? '₹***' : formatCurrency(item.exposure)}
              </span>
              <span className="text-sm font-bold text-white w-12 text-right">{item.allocation.toFixed(2)}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.allocation}%` }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
              className="bg-indigo-500 h-1.5 rounded-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FullStocksList({ data, loading }) {
  const { isPrivacyMode } = usePrivacy();

  if (!data) {
  return <Skeleton width="100%" height={300} rounded="xl" />;
}

  const sortedData = [...data].sort((a, b) => b.allocation - a.allocation);

  return (
    <div className="divide-y divide-slate-700/50">
      {sortedData.map((item, i) => (
        <div key={item.name} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center text-[10px] font-bold text-slate-300">
              {i + 1}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate max-w-[180px]">
                {isPrivacyMode ? 'Confidential Asset' : item.name}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-sm font-bold text-white">{item.allocation.toFixed(2)}%</span>
            <span className="text-xs text-slate-400">
              {isPrivacyMode ? '₹***' : formatCurrency(item.exposure)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── AnalyticsPage ────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const {
  state,
  refreshAll,
  refreshing,
} = usePortfolio();
  const scrollRef = usePageScrollRestoration('analytics');

  const { data: sectorData, loading: sectorLoading } = state.overallSectorAllocation;
  const { data: stocksData, loading: stocksLoading } = state.stocksAllocation;
  const isLoading = refreshing;

  // useEffect(() => {
  //   if (!sectorData && !sectorLoading) fetchOverallSectorAllocation();
  //   if (!stocksData && !stocksLoading) fetchStocksAllocation();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <main
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 bg-slate-900"
      aria-label="Analytics"
      id="analytics-main"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
      }}
    >
      <div className="max-w-[428px] mx-auto">
        <div className="flex items-center justify-between mb-6">

  <div className="flex items-center gap-2">
    <h1 className="text-2xl font-bold text-white">
      Full Allocation Lists
    </h1>

    <LoadingIndicator loading={isLoading} />
  </div>

  <div className="flex items-center gap-2">
    <RefreshButton onRefresh={refreshAll} />
    <PrivacyToggle />
  </div>

</div>

        <motion.div
          variants={pageVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── 1. Full Sector Allocation ────────────── */}
          <motion.section variants={sectionVariants} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={16} className="text-slate-400" />
              <h2 className="text-base font-semibold text-white">Full Sector Allocation</h2>
            </div>

            <div className="rounded-[24px] px-4 py-5 bg-slate-800/50 border border-slate-700/50 backdrop-blur-md">
              <FullSectorList data={sectorData} loading={sectorLoading} />
            </div>
          </motion.section>

          {/* ── 2. Full Stocks Allocation ──────────────────── */}
          <motion.section variants={sectionVariants} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={16} className="text-slate-400" />
              <h2 className="text-base font-semibold text-white">Full Stocks Allocation</h2>
            </div>

            <div className="rounded-[24px] px-4 py-3 bg-slate-800/50 border border-slate-700/50 backdrop-blur-md">
              <FullStocksList data={stocksData} loading={stocksLoading} />
            </div>
          </motion.section>

        </motion.div>
      </div>
    </main>
  );
}
