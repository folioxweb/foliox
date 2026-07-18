import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TabBar from '../../components/navigation/TabBar';
import HoldingsList from './HoldingsList';
import DetailScreen from './DetailScreen';
import { usePortfolio } from '../../context/PortfolioContext';
import PrivacyToggle from '../../components/ui/PrivacyToggle';
import { VIEW_MODES, VIEW_MODE_LABELS } from '../../components/cards/HoldingCard';
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
  ChevronLeft,
  ChevronRight,
  LineChart,
  Shield,
  Zap,
  Tags,
} from 'lucide-react';
import RefreshButton from '../../components/ui/RefreshButton';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';
import AddHoldingModal from "../../components/portfolio/AddHoldingModal";
import LoadingIndicator from "../../components/ui/LoadingIndicator";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TAB_CONFIG = [
  { label: 'Stocks', stateKey: 'stocks' },
  { label: 'ETFs', stateKey: 'etfs' },
  { label: 'MF', stateKey: 'mutualFunds' },
  { label: 'FD', stateKey: 'fds' },
]; 

const TAB_LABELS = TAB_CONFIG.map((t) => t.label);

const SORT_OPTIONS = [
  { value: 'currentValue', label: 'Current Value', icon: Banknote },
  { value: 'investedValue', label: 'Invested Value', icon: Scale },
  { value: 'return', label: 'Returns', icon: TrendingUp },
  { value: 'dayChange', label: 'Daily Change (%)', icon: LineChart },
  { value: 'weight', label: 'Weight', icon: ArrowUpDown },
  { value: 'name', label: 'Name', icon: ArrowDownAZ },
];

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function PortfolioPage() {
  const scrollRef = usePageScrollRestoration('portfolio');
  const navigate = useNavigate();
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
  const [viewModeIndex, setViewModeIndex] = useState(0);
  const swipeStart = useRef(null);
  const searchInputRef = useRef(null);

  const viewMode = VIEW_MODES[viewModeIndex];
  const viewModeLabel = VIEW_MODE_LABELS[viewMode];

  function cycleViewMode() {
    setViewModeIndex((prev) => (prev + 1) % VIEW_MODES.length);
  }

  const {
  state,
  refreshAll,
  refreshing,
} = usePortfolio();

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  function handleTabChange(tab) {
    setActiveTab(tab);
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
      case "MF":
        assetType = "mutualFunds";
        break;
      case "FD":
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
    } else if (filterBy === 'longterm') {
      holdings = holdings.filter(h => {
        const b = String(h.badge ?? '').toLowerCase().trim();
        return b === 'longterm' || b === 'long-term';
      });
    } else if (filterBy === 'trade') {
      holdings = holdings.filter(h => String(h.badge ?? '').toLowerCase().trim() === 'trade');
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
      } else if (sortBy === 'dayChange') {
        comparison = (a.dayChangePercent ?? a.dayChange ?? 0) - (b.dayChangePercent ?? b.dayChange ?? 0);
      } else if (sortBy === 'badge') {
        comparison = (a.badge ?? '').localeCompare(b.badge ?? '');
      } else if (sortBy === 'weight') {
        comparison = (a.portfolioWeight ?? a.weightage ?? 0) - (b.portfolioWeight ?? b.weightage ?? 0);
      } else {
        comparison = (a.currentValue ?? 0) - (b.currentValue ?? 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  function handleRetry() {
    refreshAll();
  }

  return (
    <motion.main
      ref={scrollRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto"
      style={{
        background: 'var(--bg)',
        paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
      }}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      aria-label="Portfolio page"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => { swipeStart.current = null; }}
    >
      {/* ── Title row — scrolls away on scroll-up ────────────────────────── */}
      <div
        className="px-4"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: '0.5rem',
          background: 'var(--header-bg)',
        }}
      >
        <div className="flex items-center justify-between h-10 relative">
          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.div
                key="header-normal"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="w-full flex items-center justify-between"
              >
                {/* Left: Title + Loading */}
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                    Portfolio
                  </h1>
                  <LoadingIndicator loading={refreshing} />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="rounded-full p-2 transition-colors hover:opacity-80"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Search holdings"
                  >
                    <Search size={20} />
                  </button>
                  <button
                    onClick={() => setAddHoldingOpen(true)}
                    className="rounded-full px-3.5 py-1.5 text-xs font-bold text-white transition hover:opacity-90 whitespace-nowrap"
                    style={{ background: 'var(--emerald)' }}
                  >
                    + Add
                  </button>
                  <RefreshButton onRefresh={refreshAll} />
                  <PrivacyToggle />
                  <button
                    onClick={() => navigate('/settings')}
                    className="flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald)]"
                    style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-2)' }}
                    aria-label="Settings"
                  >
                    <Settings size={20} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="header-search"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="w-full flex items-center justify-between gap-3"
              >
                {/* Search Input Container */}
                <div className="relative flex-1 flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl py-1.5 pl-3 pr-8 text-base focus:outline-none focus:ring-1 focus:ring-[var(--emerald)]"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text)',
                      fontSize: '16px', // Prevents iOS Safari auto-zoom
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 hover:opacity-80"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="text-sm font-semibold transition hover:opacity-80"
                  style={{ color: 'var(--emerald)' }}
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── TabBar — sticks at top once title row scrolls away ───────────── */}
      <div
        className="z-20"
        style={{
          position: 'sticky',
          top: 'env(safe-area-inset-top)',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        <TabBar
          tabs={TAB_LABELS}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
      </div>

      {/* ── Holdings list ────────────────────────────────────────────────── */}
      <section className="flex-1 px-4 pt-2" aria-label={`${activeTab} holdings`}>
        {/* View mode toggle row — matches Zerodha Sort / <> toggle */}
        <div className="flex items-center justify-between mb-1 pb-2" style={{ borderBottom: '1px solid var(--divider)' }}>
          {/* Sort button — tapping opens the sort/filter bottom sheet */}
          <button
            onClick={() => setShowSortFilter(true)}
            aria-label="Open sort and filter"
            className="flex items-center gap-1.5 text-xs font-medium transition-opacity active:opacity-60"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>Sort</span>
            <SlidersHorizontal size={12} strokeWidth={2} />
          </button>

          {/* <> view mode toggle */}
          <button
            onClick={cycleViewMode}
            aria-label={`Switch view mode, current: ${viewModeLabel}`}
            className="flex items-center gap-1 text-xs font-medium transition-opacity active:opacity-60"
            style={{ color: 'var(--text-2)', textDecoration: 'underline dotted', textUnderlineOffset: '3px' }}
          >
            <ChevronLeft size={12} strokeWidth={2.5} style={{ color: 'var(--text-muted)' }} />
            <ChevronRight size={12} strokeWidth={2.5} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-2)' }}>{viewModeLabel}</span>
          </button>
        </div>

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
            viewMode={viewMode}
          />
        </motion.div>
      </section>

      {/* ── Sort / Filter Bottom Sheet ────────────────────────────────── */}
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
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{
                background: 'var(--sheet-bg)',
                borderTop: '1px solid var(--card-border)',
                paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
              }}
            >
              <div className="mx-auto mb-4 h-1 w-12 rounded-full" style={{ background: 'var(--divider)' }} />
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--emerald)' }}>
                    <ListFilter size={16} aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>Filters &amp; Sorting</h3>
                </div>
                <button
                  type="button"
                  aria-label="Close view controls"
                  onClick={() => setShowSortFilter(false)}
                  className="rounded-full p-1.5 transition-colors hover:opacity-80"
                  style={{ background: 'var(--sheet-btn-bg)', color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sort by</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setSortBy(value)}
                        aria-pressed={sortBy === value}
                        className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors"
                        style={{
                          borderColor: sortBy === value ? 'rgba(16,185,129,0.5)' : 'var(--card-border)',
                          background: sortBy === value ? 'rgba(16,185,129,0.1)' : 'var(--sheet-btn-bg)',
                          color: sortBy === value ? 'var(--emerald)' : 'var(--text-2)',
                        }}
                      >
                        <Icon size={15} aria-hidden="true" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Order Direction</p>
                  <div className="grid grid-cols-2 rounded-xl p-1" style={{ border: '1px solid var(--card-border)', background: 'var(--input-bg)' }}>
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
                          className="rounded-lg px-3 py-2.5 text-xs font-bold transition-all"
                          style={{
                            background: sortDirection === direction ? 'rgba(16,185,129,0.15)' : 'transparent',
                            color: sortDirection === direction ? 'var(--emerald)' : 'var(--text-muted)',
                            border: sortDirection === direction ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Filter positions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'all', label: 'All Positions' },
                      { value: 'profit', label: 'Profits Only', icon: TrendingUp },
                      { value: 'loss', label: 'Losses Only', icon: TrendingDown },
                      { value: 'longterm', label: 'Longterm Only', icon: Shield },
                      { value: 'trade', label: 'Trade Only', icon: Zap },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setFilterBy(value)}
                        aria-pressed={filterBy === value}
                        className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors"
                        style={{
                          borderColor: filterBy === value ? 'rgba(16,185,129,0.5)' : 'var(--card-border)',
                          background: filterBy === value ? 'rgba(16,185,129,0.1)' : 'var(--sheet-btn-bg)',
                          color: filterBy === value ? 'var(--emerald)' : 'var(--text-2)',
                        }}
                      >
                        {Icon && <Icon size={15} aria-hidden="true" />}
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