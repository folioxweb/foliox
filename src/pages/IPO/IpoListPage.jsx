import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  TrendingUp,
  Search,
  SlidersHorizontal,
  X,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Info,
  Check,
  Building2,
  Flame,
  Settings,
  Bell,
  BellOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import IpoCard from '../../components/ipo/IpoCard';
import { api } from '../../services/apiClient';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import RefreshButton from '../../components/ui/RefreshButton';
import PrivacyToggle from '../../components/ui/PrivacyToggle';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';

const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'closed', label: 'Closed' },
  { id: 'listed', label: 'Listed' },
  { id: 'all', label: 'All' },
];

const SORT_OPTIONS = [
  { id: 'gmp', label: 'Highest GMP %' },
  { id: 'rating', label: 'Highest Rating' },
  { id: 'size', label: 'Est. Profit' },
  { id: 'date', label: 'Open Date' },
];

export default function IpoListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = usePageScrollRestoration('ipo_list');
  const searchInputRef = useRef(null);

  const [ipos, setIpos] = useState(() => {
    try {
      const cached = sessionStorage.getItem('ipo_list_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('ipo_list_cache');
    } catch {
      return true;
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.fromTab || sessionStorage.getItem('ipo_active_tab') || 'open';
  });
  const [sortBy, setSortBy] = useState('gmp'); // 'gmp' | 'rating' | 'size' | 'date'
  const [sortDirection, setSortDirection] = useState('desc'); // 'desc' | 'asc'
  const [showSortFilter, setShowSortFilter] = useState(false);

  const { user, updateAlertPreferences } = useAuth();
  const isIpoAlertsEnabled = Boolean(user?.user_metadata?.ipo_alerts_enabled === true);
  const [updatingAlerts, setUpdatingAlerts] = useState(false);

  const handleToggleIpoAlerts = async () => {
    if (!user) {
      navigate('/settings');
      return;
    }
    try {
      setUpdatingAlerts(true);
      const nextVal = !isIpoAlertsEnabled;
      await updateAlertPreferences(nextVal);
    } catch (err) {
      alert(err.message || 'Failed to update alert preferences');
    } finally {
      setUpdatingAlerts(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    sessionStorage.setItem('ipo_active_tab', tabId);
  };

  async function fetchIpos(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else if (ipos.length === 0) setLoading(true);

      const list = await api.getIpos();
      setIpos(list || []);
      if (list && list.length > 0) {
        sessionStorage.setItem('ipo_list_cache', JSON.stringify(list));
      }
    } catch (err) {
      console.error('Failed to load IPO data:', err);
      if (ipos.length === 0) setIpos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchIpos();
  }, []);

  useEffect(() => {
    if (location.state?.fromTab) {
      setActiveTab(location.state.fromTab);
      sessionStorage.setItem('ipo_active_tab', location.state.fromTab);
    }
  }, [location.state?.fromTab]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Compute counts per tab
  const counts = useMemo(() => {
    const res = { all: ipos.length, open: 0, upcoming: 0, closed: 0, listed: 0 };
    ipos.forEach((item) => {
      const s = String(item.status || '').toLowerCase();
      if (s === 'open') res.open++;
      else if (s === 'upcoming') res.upcoming++;
      else if (s === 'closed') res.closed++;
      else if (s === 'listed') res.listed++;
    });
    return res;
  }, [ipos]);

  // Filter and sort items
  const filteredIpos = useMemo(() => {
    return ipos
      .filter((item) => {
        // Tab filter
        if (activeTab !== 'all') {
          const s = String(item.status || '').toLowerCase();
          if (s !== activeTab) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = String(item.name || '').toLowerCase();
          const category = String(item.category || '').toLowerCase();
          if (!name.includes(q) && !category.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Special default sorting for "Open" tab: Closing Soonest at top, then GMP High -> Low
        if (activeTab === 'open' && sortBy === 'gmp') {
          const timeA = a.sortClose ? new Date(a.sortClose).getTime() : Infinity;
          const timeB = b.sortClose ? new Date(b.sortClose).getTime() : Infinity;

          if (timeA !== timeB) {
            return timeA - timeB; // Earliest closing date first
          }
          return (b.gmpPercent || 0) - (a.gmpPercent || 0); // Tie-breaker: Highest GMP %
        }

        let comp = 0;
        if (sortBy === 'gmp') {
          comp = (b.gmpPercent || 0) - (a.gmpPercent || 0);
        } else if (sortBy === 'rating') {
          comp = (b.ratingFlames || 0) - (a.ratingFlames || 0);
        } else if (sortBy === 'size') {
          comp = (b.expectedProfit || 0) - (a.expectedProfit || 0);
        } else if (sortBy === 'date') {
          const timeA = a.sortClose ? new Date(a.sortClose).getTime() : 0;
          const timeB = b.sortClose ? new Date(b.sortClose).getTime() : 0;
          comp = timeA - timeB;
        }
        return sortDirection === 'desc' ? comp : -comp;
      });
  }, [ipos, activeTab, searchQuery, sortBy, sortDirection]);

  const activeSortLabel =
    activeTab === 'open' && sortBy === 'gmp'
      ? 'Closing Soonest & GMP %'
      : SORT_OPTIONS.find((s) => s.id === sortBy)?.label || 'Highest GMP %';

  return (
    <main
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto"
      style={{ background: 'var(--bg)', paddingBottom: '8rem' }}
    >
      {/* ── Sticky Header Bar — matches Portfolio, Watchlist & Paper Trade pages ── */}
      <div
        className="sticky top-0 z-20 px-4"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: '0.75rem',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        <div className="flex items-center justify-between h-10">
          {!isSearchOpen ? (
            <div className="w-full flex items-center justify-between">
              {/* Title + Loading */}
              <div className="flex items-center gap-1.5 min-w-0 shrink">
                <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text)' }}>
                  Mainboard IPOs
                </h1>
                <LoadingIndicator loading={refreshing || loading} />
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="rounded-full p-1.5 transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Search IPOs"
                >
                  <Search size={18} />
                </button>
                <RefreshButton onRefresh={() => fetchIpos(true)} loading={refreshing} />
                <PrivacyToggle />
                <button
                  type="button"
                  onClick={handleToggleIpoAlerts}
                  disabled={updatingAlerts}
                  className="rounded-full p-1.5 transition-colors hover:opacity-80 relative"
                  style={{
                    color: isIpoAlertsEnabled ? 'var(--emerald)' : 'var(--text-muted)',
                  }}
                  title={
                    isIpoAlertsEnabled
                      ? 'IPO GMP email alerts: ENABLED (Click to disable)'
                      : 'IPO GMP email alerts: DISABLED (Click to enable)'
                  }
                  aria-label="Toggle IPO email alerts"
                >
                  {isIpoAlertsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                  {isIpoAlertsEnabled && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald)]"
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
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <div className="relative flex-1 flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search IPO name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl py-1.5 pl-3 pr-8 text-base focus:outline-none focus:ring-1 focus:ring-[var(--emerald)]"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text)',
                    fontSize: '16px',
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
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-sm font-semibold transition hover:opacity-80 shrink-0"
                style={{ color: 'var(--emerald)' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Zerodha-style Horizontal TabBar ── */}
      <div
        className="z-20"
        style={{
          position: 'sticky',
          top: 'calc(env(safe-area-inset-top) + 3.25rem)',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        <nav className="no-scrollbar overflow-x-auto">
          <ul className="flex items-center w-full">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = counts[tab.id] || 0;
              return (
                <li key={tab.id} className="relative flex-1" role="presentation">
                  <button
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className="relative w-full px-2 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap text-center flex items-center justify-center gap-1 focus-visible:outline-none"
                    style={{
                      color: isActive ? 'var(--text)' : 'var(--text-muted)',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'
                      }`}
                    >
                      {count}
                    </span>

                    {isActive && (
                      <motion.span
                        layoutId="ipoTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full"
                        style={{ background: 'var(--emerald)' }}
                        initial={false}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* ── Control Bar — Sort & Filter Action (Matches Assets/Portfolio page) ── */}
      <section className="px-4 pt-2.5">
        <div
          className="flex items-center justify-between pb-2"
          style={{ borderBottom: '1px solid var(--divider)' }}
        >
          {/* Sort / Filter Button */}
          <button
            onClick={() => setShowSortFilter(true)}
            aria-label="Open sort and filter"
            className="flex items-center gap-1.5 text-xs font-semibold transition-opacity active:opacity-60"
            style={{ color: 'var(--text)' }}
          >
            <SlidersHorizontal size={13} className="text-emerald-500" strokeWidth={2.2} />
            <span>Sort &amp; Filter</span>
          </button>

          {/* Active Sort Label Badge */}
          <button
            onClick={() => setShowSortFilter(true)}
            className="flex items-center gap-1 text-[11px] font-semibold transition-opacity active:opacity-60"
            style={{ color: 'var(--text-2)' }}
          >
            <span>{activeSortLabel} ({sortDirection === 'desc' ? 'High → Low' : 'Low → High'})</span>
          </button>
        </div>
      </section>

      {/* ── Main List Section ── */}
      <div className="p-4 pt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <LoadingIndicator loading={true} />
            <p className="text-xs font-medium text-[var(--text-2)] mt-3">Fetching live IPO data...</p>
          </div>
        ) : filteredIpos.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border my-4"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div className="p-4 rounded-full bg-slate-500/10 text-slate-400 mb-3">
              <Layers size={32} />
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>No IPO data found</h3>
            <p className="text-xs text-[var(--text-2)] max-w-xs mb-4">
              {searchQuery ? `No IPOs match "${searchQuery}".` : `There are currently no ${activeTab} mainboard IPOs.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIpos.map((ipo) => (
              <IpoCard
                key={ipo.id || ipo.name}
                ipo={ipo}
                onClick={() => navigate(`/ipo/${ipo.id}`, { state: { fromTab: activeTab } })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Sort / Filter Bottom Sheet Modal (Identical to Assets / Portfolio Page Sheet) ── */}
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
                  <SlidersHorizontal size={18} className="text-emerald-500" />
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                    Filters &amp; Sorting
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSortFilter(false)}
                  className="rounded-full p-1.5 transition hover:opacity-80"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-muted)' }}
                  aria-label="Close sort sheet"
                >
                  <X size={18} />
                </button>
              </div>

              {/* SORT BY SECTION */}
              <div className="mb-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-3">
                  Sort By
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {SORT_OPTIONS.map((opt) => {
                    const isSel = sortBy === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSortBy(opt.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all text-left ${
                          isSel
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'bg-[var(--sheet-btn-bg)] border-[var(--card-border)] text-[var(--text)]'
                        }`}
                        style={{
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        <span>{opt.label}</span>
                        {isSel && <Check size={14} className="text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ORDER DIRECTION SECTION */}
              <div className="mb-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-3">
                  Order Direction
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSortDirection('desc')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold text-center transition-all ${
                      sortDirection === 'desc'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[var(--sheet-btn-bg)] border-[var(--card-border)] text-[var(--text-2)]'
                    }`}
                    style={{ borderWidth: '1px', borderStyle: 'solid' }}
                  >
                    High → Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortDirection('asc')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold text-center transition-all ${
                      sortDirection === 'asc'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[var(--sheet-btn-bg)] border-[var(--card-border)] text-[var(--text-2)]'
                    }`}
                    style={{ borderWidth: '1px', borderStyle: 'solid' }}
                  >
                    Low → High
                  </button>
                </div>
              </div>

              {/* FILTER POSITIONS / TABS SECTION */}
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-3">
                  Filter IPO Status
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {TABS.map((tab) => {
                    const isSel = activeTab === tab.id;
                    const count = counts[tab.id] || 0;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all ${
                          isSel
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'bg-[var(--sheet-btn-bg)] border-[var(--card-border)] text-[var(--text)]'
                        }`}
                        style={{ borderWidth: '1px', borderStyle: 'solid' }}
                      >
                        <span>{tab.label} IPOs</span>
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={() => setShowSortFilter(false)}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition hover:opacity-90 text-center"
                style={{ background: 'var(--emerald)' }}
              >
                Apply Filters
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
