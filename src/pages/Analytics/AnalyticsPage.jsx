import { motion } from 'framer-motion';
import { PieChart, BarChart2, Settings, TrendingUp, Newspaper, Search, X } from 'lucide-react';
import { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import Skeleton from '../../components/ui/Skeleton';
import PrivacyToggle from '../../components/ui/PrivacyToggle';
import RefreshButton from '../../components/ui/RefreshButton';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import { useNavigate } from 'react-router-dom';
import { usePrivacy } from '../../context/PrivacyContext';
import NewsPage from '../News/NewsPage';

// ─── Palette & Helpers ────────────────────────────────────────────────────────

const SECTOR_PALETTE = [
  '#6366F1','#06B6D4','#F59E0B','#10B981','#EF4444',
  '#8B5CF6','#0EA5E9','#F97316','#14B8A6','#EC4899',
  '#64748B','#A78BFA',
];
const RANK_COLORS = ['#F59E0B','#94A3B8','#CD7F32'];

const formatAmt = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000)     return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${Math.round(val)}`;
};

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, title, color = '#64748B' }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      <Icon size={15} style={{ color }} />
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {title}
      </h2>
    </div>
  );
}

// ─── Full Sector List ─────────────────────────────────────────────────────────

function FullSectorList({ data }) {
  const { isPrivacyMode } = usePrivacy();
  if (!data) return <Skeleton width="100%" height={300} rounded="xl" />;

  const sorted = [...data].sort((a, b) => b.allocation - a.allocation);
  const maxAlloc = Math.max(...sorted.map((d) => d.allocation), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {sorted.map((item, i) => {
        const color = SECTOR_PALETTE[i % SECTOR_PALETTE.length];
        const barPct = (item.allocation / maxAlloc) * 100;
        return (
          <div
            key={item.sector}
            className="relative px-3 sm:px-4 py-3"
            style={{ borderBottom: i < sorted.length - 1 ? '1px solid var(--divider)' : 'none' }}
          >
            <motion.div
              className="absolute left-0 top-0 bottom-0 pointer-events-none"
              initial={{ width: 0 }}
              animate={{ width: `${barPct}%` }}
              transition={{ duration: 0.7, delay: i * 0.04, ease: 'easeOut' }}
              style={{ background: `${color}12` }}
            />
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{item.sector}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isPrivacyMode ? '₹•••' : formatAmt(item.exposure)}
                </span>
                <span className="text-sm font-bold w-12 text-right" style={{ color }}>
                  {item.allocation.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── Full Stocks List ─────────────────────────────────────────────────────────

function FullStocksList({ data }) {
  const { isPrivacyMode } = usePrivacy();
  const [query, setQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(50);

  if (!data) return <Skeleton width="100%" height={300} rounded="xl" />;

  const sorted = [...data].sort((a, b) => b.allocation - a.allocation);
  const maxExposure = Math.max(...sorted.map((d) => d.exposure), 1);

  const filtered = query.trim()
    ? sorted.filter(item => 
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.sector?.toLowerCase().includes(query.toLowerCase())
      )
    : sorted;

  const visibleItems = query.trim() ? filtered : filtered.slice(0, displayCount);

  return (
    <div className="space-y-2.5">
      {/* Search Filter for Holdings */}
      {sorted.length > 10 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={`Search across ${sorted.length} holdings by name or sector...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs outline-none"
            style={{ color: 'var(--text)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-0.5 hover:opacity-75">
              <X size={13} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {visibleItems.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            No stocks found matching "{query}"
          </div>
        ) : (
          visibleItems.map((item, i) => {
            const rankColor = RANK_COLORS[i] ?? '#6366F1';
            const barPct = (item.exposure / maxExposure) * 100;
            return (
              <div
                key={item.name}
                className="relative px-3 sm:px-4 py-3 flex items-center gap-3"
                style={{ borderBottom: (i < visibleItems.length - 1 || (!query.trim() && filtered.length > displayCount)) ? '1px solid var(--divider)' : 'none' }}
              >
                <motion.div
                  className="absolute left-0 top-0 bottom-0 pointer-events-none"
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ duration: 0.7, delay: Math.min(i * 0.02, 0.4), ease: 'easeOut' }}
                  style={{ background: `${rankColor}0D` }}
                />
                <span
                  className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: i < 3 ? `${rankColor}22` : 'var(--card-border)',
                    color: i < 3 ? rankColor : 'var(--text-muted)',
                  }}
                >
                  {i + 1}
                </span>
                <div className="relative z-10 flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {isPrivacyMode ? '••••••••' : item.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {isPrivacyMode ? '••••' : (item.sector || 'Other')}
                    </span>
                    {item.directValue > 0 && item.indirectValue > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-400">
                        Direct + Funds
                      </span>
                    )}
                    {item.directValue > 0 && !item.indirectValue && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-blue-500/10 text-blue-400">
                        Direct
                      </span>
                    )}
                    {!item.directValue && item.indirectValue > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-purple-500/10 text-purple-400">
                        Via Funds
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative z-10 flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {isPrivacyMode ? '₹•••' : formatAmt(item.exposure)}
                  </span>
                  <span className="text-sm font-bold w-12 text-right" style={{ color: rankColor }}>
                    {item.allocation.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        )}

        {!query.trim() && filtered.length > displayCount && (
          <button
            onClick={() => setDisplayCount(prev => prev + 50)}
            className="w-full py-3 text-center text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{
              color: '#6366F1',
              background: 'var(--card-bg)',
            }}
          >
            Show Next 50 Holdings ({filtered.length - displayCount} remaining)
          </button>
        )}
      </motion.div>
    </div>
  );
}

// ─── AnalyticsPage ────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { state, refreshAll, refreshing } = usePortfolio();
  const scrollRef = usePageScrollRestoration('analytics');
  const navigate = useNavigate();
  const [newsPageOpen, setNewsPageOpen] = useState(false);
  const { data: sectorData } = state.overallSectorAllocation;
  const { data: stocksData } = state.stocksAllocation;

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
      {/* Sticky Header */}
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
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Analytics</h1>
          <LoadingIndicator loading={refreshing} />
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
          <RefreshButton onRefresh={refreshAll} />
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

      {/* Content */}
      <div className="px-3 sm:px-4 lg:px-8 pt-3.5 sm:pt-5 space-y-4 sm:space-y-6">
        <section>
          <SectionHeading icon={PieChart} title="Full Sector Allocation" color="#6366F1" />
          <FullSectorList data={sectorData} />
        </section>
        <section>
          <SectionHeading
            icon={BarChart2}
            title={stocksData?.length ? `All Holdings by Exposure (${stocksData.length} Stocks across Equities, MFs & ETFs)` : "All Holdings by Exposure"}
            color="#F59E0B"
          />
          <FullStocksList data={stocksData} />
        </section>
      </div>

      {/* Market News Overlay */}
      <NewsPage
        isOpen={newsPageOpen}
        onClose={() => setNewsPageOpen(false)}
      />
    </main>
  );
}
