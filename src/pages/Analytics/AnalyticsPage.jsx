import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Newspaper,
  Settings,
  BarChart2,
  PieChart,
} from 'lucide-react';

import { usePortfolio } from '../../context/PortfolioContext';
import { usePrivacy } from '../../context/PrivacyContext';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import RefreshButton from '../../components/ui/RefreshButton';
import PrivacyToggle from '../../components/ui/PrivacyToggle';
import NewsPage from '../News/NewsPage';
import Skeleton from '../../components/ui/Skeleton';

// Modern Analytics Components
import AnalyticsKpiRibbon from '../../components/analytics/AnalyticsKpiRibbon';
import SectorDonutChart from '../../components/analytics/SectorDonutChart';
import HoldingsFilterBar from '../../components/analytics/HoldingsFilterBar';
import HoldingsConsoleTable from '../../components/analytics/HoldingsConsoleTable';

export default function AnalyticsPage() {
  const { state, refreshAll, refreshing } = usePortfolio();
  const scrollRef = usePageScrollRestoration('analytics');
  const navigate = useNavigate();

  const [newsPageOpen, setNewsPageOpen] = useState(false);

  // Raw data from PortfolioContext
  const { data: sectorData, loading: sectorLoading } = state.overallSectorAllocation;
  const { data: stocksData, loading: stocksLoading } = state.stocksAllocation;
  const loading = sectorLoading || stocksLoading;

  // ─── Filter & Sorting State (Persisted in localStorage) ───────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  const [sourceFilter, setSourceFilter] = useState(() => {
    try {
      return localStorage.getItem('analytics_source_filter') || 'all';
    } catch {
      return 'all';
    }
  });

  const [selectedSector, setSelectedSector] = useState(() => {
    try {
      return localStorage.getItem('analytics_selected_sector') || null;
    } catch {
      return null;
    }
  });

  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem('analytics_sort_by') || 'exposure';
    } catch {
      return 'exposure';
    }
  });

  const [sortDirection, setSortDirection] = useState(() => {
    try {
      return localStorage.getItem('analytics_sort_dir') || 'desc';
    } catch {
      return 'desc';
    }
  });

  const [displayCount, setDisplayCount] = useState(50);

  // ─── Handlers with Persistence ──────────────────────────────────────────────
  const handleSourceFilterChange = (filter) => {
    setSourceFilter(filter);
    setDisplayCount(50);
    try {
      localStorage.setItem('analytics_source_filter', filter);
    } catch {}
  };

  const handleSectorChange = (sec) => {
    setSelectedSector(sec);
    setDisplayCount(50);
    try {
      if (sec) localStorage.setItem('analytics_selected_sector', sec);
      else localStorage.removeItem('analytics_selected_sector');
    } catch {}
  };

  const handleSortByChange = (newSort) => {
    setSortBy(newSort);
    setDisplayCount(50);
    try {
      localStorage.setItem('analytics_sort_by', newSort);
    } catch {}
  };

  const handleSortDirectionChange = (newDir) => {
    setSortDirection(newDir);
    setDisplayCount(50);
    try {
      localStorage.setItem('analytics_sort_dir', newDir);
    } catch {}
  };

  // ─── Computations ────────────────────────────────────────────────────────────
  // 1. Source counts for quick filter chips
  const sourceCounts = useMemo(() => {
    if (!stocksData || !Array.isArray(stocksData)) {
      return { all: 0, direct: 0, funds: 0, overlap: 0 };
    }
    let direct = 0;
    let funds = 0;
    let overlap = 0;

    stocksData.forEach((s) => {
      const hasDirect = (s.directValue || 0) > 0;
      const hasFunds = (s.indirectValue || 0) > 0;
      if (hasDirect && hasFunds) overlap++;
      if (hasDirect) direct++;
      if (hasFunds && !hasDirect) funds++;
    });

    return {
      all: stocksData.length,
      direct,
      funds,
      overlap,
    };
  }, [stocksData]);

  // 2. Unique sectors for dropdown filter
  const uniqueSectors = useMemo(() => {
    if (!sectorData || !Array.isArray(sectorData)) return [];
    return sectorData
      .map((s) => s.sector)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [sectorData]);

  // 3. Filtered & Sorted Stocks List
  const filteredStocks = useMemo(() => {
    if (!stocksData || !Array.isArray(stocksData)) return [];

    return stocksData
      .filter((item) => {
        // Sector Filter
        if (selectedSector && (item.sector || 'Other') !== selectedSector) {
          return false;
        }

        // Source Filter
        if (sourceFilter === 'direct') {
          if ((item.directValue || 0) <= 0) return false;
        } else if (sourceFilter === 'funds') {
          if ((item.indirectValue || 0) <= 0 || (item.directValue || 0) > 0) return false;
        } else if (sourceFilter === 'overlap') {
          if ((item.directValue || 0) <= 0 || (item.indirectValue || 0) <= 0) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (item.name || '').toLowerCase();
          const sec = (item.sector || '').toLowerCase();
          if (!name.includes(q) && !sec.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'exposure') {
          comp = (b.exposure || 0) - (a.exposure || 0);
        } else if (sortBy === 'allocation') {
          comp = (b.allocation || 0) - (a.allocation || 0);
        } else if (sortBy === 'direct') {
          comp = (b.directValue || 0) - (a.directValue || 0);
        } else if (sortBy === 'indirect') {
          comp = (b.indirectValue || 0) - (a.indirectValue || 0);
        } else if (sortBy === 'name') {
          comp = (a.name || '').localeCompare(b.name || '');
        } else if (sortBy === 'sector') {
          comp = (a.sector || '').localeCompare(b.sector || '');
        }
        return sortDirection === 'desc' ? comp : -comp;
      });
  }, [stocksData, selectedSector, sourceFilter, searchQuery, sortBy, sortDirection]);

  // 4. Max exposure for relative bars
  const maxExposure = useMemo(() => {
    if (!filteredStocks || filteredStocks.length === 0) return 1;
    return Math.max(...filteredStocks.map((s) => s.exposure || 0), 1);
  }, [filteredStocks]);

  const visibleItems = useMemo(() => {
    return filteredStocks.slice(0, displayCount);
  }, [filteredStocks, displayCount]);

  return (
    <main
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto"
      aria-label="Analytics"
      id="analytics-main"
      style={{
        background: 'var(--bg)',
        paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
      }}
    >
      {/* ── Sticky Top Header ── */}
      <div
        className="sticky top-0 z-20 px-3 sm:px-4 lg:px-8 flex items-center justify-between"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: '0.75rem',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Analytics
          </h1>
          <LoadingIndicator loading={refreshing || loading} />
        </div>

        <div className="flex items-center gap-2">
          <button
            id="analytics-news-btn"
            onClick={() => setNewsPageOpen(true)}
            className="relative rounded-full p-2 transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            aria-label="View market news"
          >
            <Newspaper size={20} />
          </button>
          <RefreshButton onRefresh={refreshAll} loading={refreshing} />
          <PrivacyToggle />
          <button
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

      {/* ── Main Analytics Body ── */}
      <div className="px-3 sm:px-4 lg:px-8 pt-3.5 sm:pt-5 space-y-4 sm:space-y-6">
        {loading && !stocksData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width="100%" height={80} rounded="2xl" />
              ))}
            </div>
            <Skeleton width="100%" height={260} rounded="2xl" />
            <Skeleton width="100%" height={400} rounded="2xl" />
          </div>
        ) : (
          <>
            {/* 1. Executive Summary & Concentration Ribbon */}
            <section aria-label="Portfolio Concentration KPIs">
              <AnalyticsKpiRibbon stocksData={stocksData} sectorData={sectorData} />
            </section>

            {/* 2. Interactive Sector Donut Engine */}
            <section aria-label="Sector Allocation">
              <SectorDonutChart
                data={sectorData}
                selectedSector={selectedSector}
                onSelectSector={handleSectorChange}
              />
            </section>

            {/* 3. Zerodha Console Holdings Explorer */}
            <section aria-label="Holdings Explorer" className="space-y-3.5">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <BarChart2 size={16} className="text-amber-500" />
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Holdings Explorer ({filteredStocks.length}
                    {filteredStocks.length !== (stocksData?.length || 0) ? ` of ${stocksData?.length}` : ''})
                  </h2>
                </div>
              </div>

              {/* Filter & Sorting Controls */}
              <HoldingsFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sourceFilter={sourceFilter}
                onSourceFilterChange={handleSourceFilterChange}
                selectedSector={selectedSector}
                onSectorChange={handleSectorChange}
                sectors={uniqueSectors}
                sortBy={sortBy}
                onSortByChange={handleSortByChange}
                sortDirection={sortDirection}
                onSortDirectionChange={handleSortDirectionChange}
                counts={sourceCounts}
              />

              {/* Console Data Table / Mobile Cards */}
              <HoldingsConsoleTable
                items={visibleItems}
                totalFilteredCount={filteredStocks.length}
                displayCount={displayCount}
                onLoadMore={() => setDisplayCount((prev) => prev + 50)}
                maxExposure={maxExposure}
              />
            </section>
          </>
        )}
      </div>

      {/* Market News Overlay Drawer */}
      <NewsPage isOpen={newsPageOpen} onClose={() => setNewsPageOpen(false)} />
    </main>
  );
}
