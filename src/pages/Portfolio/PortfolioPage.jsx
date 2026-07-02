import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TabBar from '../../components/navigation/TabBar';
import HoldingsList from './HoldingsList';
import DetailScreen from './DetailScreen';
import { usePortfolio } from '../../context/PortfolioContext';
import PrivacyToggle from '../../components/ui/PrivacyToggle';
import {
  ArrowDownAZ,
  ArrowUpDown,
  Banknote,
  ListFilter,
  Scale,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  X,
  Search,
} from 'lucide-react';
import RefreshButton from '../../components/ui/RefreshButton';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';
import AddHoldingModal from "../../components/portfolio/AddHoldingModal";

const TAB_CONFIG = [
  { label: 'Stocks', stateKey: 'stocks', fetchKey: 'fetchStocks' },
  { label: 'ETFs', stateKey: 'etfs', fetchKey: 'fetchEtfs' },
  { label: 'Mutual Funds', stateKey: 'mutualFunds', fetchKey: 'fetchMutualFunds' },
  { label: 'Fixed Deposits', stateKey: 'fds', fetchKey: 'fetchFDs' },
]; 

const TAB_LABELS = TAB_CONFIG.map((t) => t.label);

const SORT_OPTIONS = [
  { value: 'currentValue', label: 'Current Value', icon: Banknote },
  { value: 'investedValue', label: 'Invested Value', icon: Scale },
  { value: 'return', label: 'Returns', icon: TrendingUp },
  { value: 'weight', label: 'Weight', icon: ArrowUpDown },
  { value: 'name', label: 'Name', icon: ArrowDownAZ },
];

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function PortfolioPage() {
  const scrollRef = usePageScrollRestoration('portfolio');
  const [activeTab, setActiveTab] = useState(TAB_LABELS[0]);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addHoldingOpen, setAddHoldingOpen] = useState(false);
  const [showSortFilter, setShowSortFilter] = useState(false);
  const [sortBy, setSortBy] = useState('currentValue');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const swipeStart = useRef(null);
  const searchInputRef = useRef(null);

  const { state, fetchStocks, fetchEtfs, fetchMutualFunds, fetchFDs, refreshAll } = usePortfolio();
  const fetchFns = { fetchStocks, fetchEtfs, fetchMutualFunds,fetchFDs };

  const ensureTabData = useCallback(
    (tabLabel) => {
      const config = TAB_CONFIG.find((t) => t.label === tabLabel);
      if (!config) return;
      const slice = state[config.stateKey];
      if (!slice.data && !slice.loading) {
        fetchFns[config.fetchKey]();
      }
    },
    [state, fetchStocks, fetchEtfs, fetchMutualFunds, fetchFDs]
  );

  useEffect(() => {
    ensureTabData(activeTab);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  function handleTabChange(tab) {
    setActiveTab(tab);
    ensureTabData(tab);
  }

  function handleTouchStart(event) {
    const touch = event.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const horizontalDistance = touch.clientX - start.x;
    const verticalDistance = touch.clientY - start.y;
    if (Math.abs(horizontalDistance) < 56 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) {
      return;
    }
    const currentIndex = TAB_LABELS.indexOf(activeTab);
    const nextIndex = horizontalDistance < 0
      ? Math.min(currentIndex + 1, TAB_LABELS.length - 1)
      : Math.max(currentIndex - 1, 0);
    if (nextIndex !== currentIndex) handleTabChange(TAB_LABELS[nextIndex]);
  }

  function handleHoldingPress(holding) {
    let assetType = "stocks";
switch (activeTab) {
  case "ETFs":
    assetType = "etfs";
    break;
  case "Mutual Funds":
    assetType = "mutualFunds";
    break;
  case "Fixed Deposits":
    assetType = "fds";
    break;
}
    setSelectedHolding({ ...holding, assetType });
    setDetailOpen(true);
  }

  function handleDetailClose() {
    setDetailOpen(false);
    setTimeout(() => setSelectedHolding(null), 350);
  }

  const activeConfig = TAB_CONFIG.find((t) => t.label === activeTab);
  const activeSlice = activeConfig ? state[activeConfig.stateKey] : null;
  let holdings = activeSlice?.data ?? null;
  const loading = activeSlice?.loading ?? false;
  const error = activeSlice?.error ?? null;

  if (holdings && Array.isArray(holdings)) {
    // 1. Text Search Filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      holdings = holdings.filter(h =>
  (h.name ?? h.bankName ?? "").toLowerCase().includes(query) ||
  (h.symbol ?? "").toLowerCase().includes(query)
);
    }

    // 2. Returns Filter
    if (filterBy === 'profit') {
      holdings = holdings.filter(h => (h.pnl ?? h.returnPct ?? h.interestEarned ?? 0) >= 0);
    } else if (filterBy === 'loss') {
      holdings = holdings.filter(h => (h.pnl ?? h.returnPct ?? h.interestEarned ?? 0) < 0);
    }

    // 3. Sorting Engine
    holdings = [...holdings].sort((a, b) => {
      let comparison;
      if (sortBy === 'name') {
        comparison = (a.name ?? '').localeCompare(b.name ?? '');
      } else if (sortBy === 'return') {
        comparison =
  (a.pnl ?? a.returnPct ?? a.interestEarned ?? 0) -
  (b.pnl ?? b.returnPct ?? b.interestEarned ?? 0);
      } else if (sortBy === 'investedValue') {
        comparison =
  (a.investedValue ?? a.invested ?? a.principal ?? 0) -
  (b.investedValue ?? b.invested ?? b.principal ?? 0);
      } else if (sortBy === 'weight') {
        comparison = (a.portfolioWeight ?? a.weightage ?? 0) - (b.portfolioWeight ?? b.weightage ?? 0);
      } else {
        comparison = (a.currentValue ?? 0) - (b.currentValue ?? 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  function handleRetry() {
    if (activeConfig) {
      fetchFns[activeConfig.fetchKey]();
    }
  }

  return (
    <motion.main
      ref={scrollRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto pb-24"
      style={{
        background: '#0F172A',
        paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
      }}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      aria-label="Portfolio page"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => { swipeStart.current = null; }}
    >
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <header className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4 h-10 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.h1
                key="title"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-2xl font-bold text-white absolute left-0"
              >
                Portfolio
              </motion.h1>
            ) : (
              <motion.div
                key="search-input"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'calc(100% - 165px)' }}
                exit={{ opacity: 0, width: 0 }}
                className="absolute left-0 right-24 flex items-center"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 p-2 pl-3 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 absolute right-0">
            <button
              onClick={() => {
                if (isSearchOpen) setSearchQuery('');
                setIsSearchOpen(!isSearchOpen);
              }}
              className={`rounded-full p-2 transition-colors ${isSearchOpen ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              aria-label="Toggle search input"
            >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            <button
              onClick={() => setAddHoldingOpen(true)}
              className="rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
            >
              + Add
            </button>
            <RefreshButton onRefresh={refreshAll} />
            <PrivacyToggle />
          </div>
        </div>

        <TabBar
          tabs={TAB_LABELS}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
      </header>

      {/* ── Holdings list ────────────────────────────────────────────────── */}
      <section className="flex-1 px-4 pt-4" aria-label={`${activeTab} holdings`}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <HoldingsList
            holdings={holdings}
            loading={loading}
            error={error}
            onRetry={handleRetry}
            onPress={handleHoldingPress}
          />
        </motion.div>
      </section>

      {/* ── Floating Solid High-Visibility FAB Button ────────────────────── */}
      <button
        onClick={() => setShowSortFilter(true)}
        aria-expanded={showSortFilter}
        aria-controls="asset-view-controls"
        className="fixed right-6 bottom-24 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-slate-700/60 bg-gradient-to-tr from-slate-800 to-slate-900 text-teal-400 shadow-2xl transition-transform active:scale-95 hover:border-emerald-500/50" style={{
          bottom: 'calc(6rem + env(safe-area-inset-bottom))'
        }}
        aria-label="Open sorting and filters"
      >
        <SlidersHorizontal size={22} strokeWidth={2.5} />
      </button>

      {/* ── Floating Modern Bottom Sheet Panel ───────────────────────────── */}
      <AnimatePresence>
        {showSortFilter && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSortFilter(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              id="asset-view-controls"
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-slate-700/80 bg-slate-900 p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{
                paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))'
              }}
            >
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-700" />
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
                    <ListFilter size={16} aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-bold text-white">Filters & Sorting</h3>
                </div>
                <button
                  type="button"
                  aria-label="Close view controls"
                  onClick={() => setShowSortFilter(false)}
                  className="rounded-full bg-slate-800 p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Sort by</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setSortBy(value)}
                        aria-pressed={sortBy === value}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors ${sortBy === value ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300' : 'border-slate-700/60 bg-slate-800/40 text-slate-300 hover:border-slate-600'}`}
                      >
                        <Icon size={15} aria-hidden="true" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Order Direction</p>
                  <div className="grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-950/40 p-1">
                    {['desc', 'asc'].map(direction => {
                      const isDescending = direction === 'desc';
                      const label = sortBy === 'name'
                        ? (isDescending ? 'Z → A' : 'A → Z')
                        : (isDescending ? 'High → Low' : 'Low → High');
                      return (
                        <button
                          key={direction}
                          onClick={() => setSortDirection(direction)}
                          aria-pressed={sortDirection === direction}
                          className={`rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${sortDirection === direction ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner' : 'text-slate-400 border border-transparent hover:text-white'}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Filter returns</p>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'All Positions' },
                      { value: 'profit', label: 'Profits Only', icon: TrendingUp },
                      { value: 'loss', label: 'Losses Only', icon: TrendingDown },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setFilterBy(value)}
                        aria-pressed={filterBy === value}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${filterBy === value ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300' : 'border-slate-700/60 text-slate-300 hover:border-slate-600'}`}
                      >
                        {Icon && <Icon size={14} aria-hidden="true" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AddHoldingModal
        isOpen={addHoldingOpen}
        onClose={() => setAddHoldingOpen(false)}
      />

      {/* ── Detail Screen modal overlay ──────────────────────────────────── */}
      <DetailScreen
        holding={selectedHolding}
        isOpen={detailOpen}
        onClose={handleDetailClose}
      />
    </motion.main>
  );
}