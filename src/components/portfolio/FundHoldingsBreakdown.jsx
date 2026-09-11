import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  PieChart, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Briefcase,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';
import { formatCurrency } from '../../utils/formatters';
import { api } from '../../services/apiClient';

const SECTOR_COLOR_MAP = {
  "Financial Services": "#3B82F6",
  "Technology": "#6366F1",
  "Energy": "#F59E0B",
  "Consumer Cyclical": "#F97316",
  "Healthcare": "#EF4444",
  "Housing Finance": "#06B6D4",
  "Communication Services": "#0EA5E9",
  "Utilities": "#14B8A6",
  "Real Estate": "#84CC16",
  "Consumer Defensive": "#22C55E",
  "Industrials": "#EAB308",
  "Renewable Energy": "#10B981",
  "Digital Advertising & Technology": "#8B5CF6",
  "Basic Materials": "#78716C",
  "Alcoholic Beverages": "#EC4899",
  "Travel & Visa Services": "#A855F7",
  "Industrial Machinery": "#64748B",
  "Oil, Gas & Consumable Fuels": "#B45309",
  "Automobile and Auto Components": "#0891B2",
  "Power Financing": "#1D4ED8",
  "Capital Goods": "#CA8A04",
  "Fast Moving Consumer Goods": "#65A30D",
  "Construction": "#D97706",
  "Telecommunication": "#0284C7",
  "Metals & Mining": "#71717A",
  "Consumer Services": "#9333EA",
  "Consumer Durables": "#2563EB",
  "Power": "#0F766E",
  "Services": "#DB2777",
  "Chemicals": "#7C3AED",
  "Construction Materials": "#A16207",
  "Realty": "#65A30D",
  "Media, Entertainment & Publication": "#C026D3",
  "Textiles": "#E11D48",
  "Diversified": "#6B7280"
};

const PALETTE = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', 
  '#06B6D4', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
];

function getSectorColor(name, index) {
  if (SECTOR_COLOR_MAP[name]) return SECTOR_COLOR_MAP[name];
  return PALETTE[index % PALETTE.length];
}

export default function FundHoldingsBreakdown({ holding }) {
  const { isPrivacyMode } = usePrivacy();
  const [activeTab, setActiveTab] = useState('assets'); // 'assets' | 'sectors'
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [holdingsData, setHoldingsData] = useState({ stocks: [], sectors: [] });
  const [errorMsg, setErrorMsg] = useState(null);

  const assetId = holding?.assetId || holding?.holdingId || holding?.asset_id;
  const isin = holding?.isin;
  const fundValue = Number(holding?.currentValue || holding?.investedValue || 0);

  // Fetch holdings on load or assetId change
  useEffect(() => {
    let isMounted = true;

    async function loadHoldings() {
      if (!assetId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await api.getFundHoldings(assetId, isin);
        if (isMounted) {
          setHoldingsData(data || { stocks: [], sectors: [] });
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load fund holdings:', err);
          setErrorMsg('Unable to load fund holdings at this time.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHoldings();

    return () => {
      isMounted = false;
    };
  }, [assetId, isin]);

  // Handle manual sync trigger
  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setErrorMsg(null);
    try {
      const res = await api.syncFundHoldings({ assetId, isin });
      if (res?.stocks?.length > 0 || res?.sectors?.length > 0) {
        setHoldingsData({ stocks: res.stocks || [], sectors: res.sectors || [] });
      } else {
        // Re-fetch after sync
        const fresh = await api.getFundHoldings(assetId, isin);
        if (fresh?.stocks?.length > 0 || fresh?.sectors?.length > 0) {
          setHoldingsData(fresh);
        } else if (res?.message) {
          setErrorMsg(res.message);
        } else {
          setErrorMsg('Constituent holdings are currently not disclosed by the fund house feed for this ISIN.');
        }
      }
    } catch (err) {
      console.warn('Sync fund holdings error:', err);
      setErrorMsg('Constituent holdings are currently not disclosed by the fund house feed for this ISIN.');
    } finally {
      setSyncing(false);
    }
  };

  const stocks = holdingsData.stocks || [];
  const sectors = holdingsData.sectors || [];

  // Concentration metrics
  const top5Weight = useMemo(() => {
    return stocks.slice(0, 5).reduce((acc, s) => acc + Number(s.weight || 0), 0);
  }, [stocks]);

  const top10Weight = useMemo(() => {
    return stocks.slice(0, 10).reduce((acc, s) => acc + Number(s.weight || 0), 0);
  }, [stocks]);

  // Filtered stocks based on search query
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return stocks;
    const q = searchQuery.toLowerCase().trim();
    return stocks.filter((s) => s.name?.toLowerCase().includes(q));
  }, [stocks, searchQuery]);

  // Visible stocks (default top 10 like Zerodha Coin)
  const visibleStocks = isExpanded ? filteredStocks : filteredStocks.slice(0, 10);

  return (
    <div 
      className="rounded-2xl p-3 sm:p-4 mb-4 border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm backdrop-blur-md transition-all font-sans"
      aria-label="Fund Portfolio Breakdown"
    >
      {/* ── Header Strip (Compact) ── */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Layers size={13} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-[var(--text)] tracking-tight leading-none">
              Fund Portfolio Breakdown
            </h2>
          </div>
        </div>

        {/* Sync Button */}
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--sheet-btn-bg)] hover:bg-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--card-border)] transition-all active:scale-95 disabled:opacity-50 shrink-0"
          title="Refresh fund constituents"
        >
          <RefreshCw size={11} className={syncing ? 'animate-spin text-emerald-400' : ''} />
          <span>{syncing ? 'Syncing...' : 'Sync Live'}</span>
        </button>
      </div>

      {/* ── Segmented Control Switcher (Zerodha Coin Style) ── */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--sheet-btn-bg)] border border-[var(--card-border)] mb-3">
        <button
          type="button"
          onClick={() => setActiveTab('assets')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all ${
            activeTab === 'assets'
              ? 'bg-[var(--card-bg)] text-[var(--text)] shadow-xs border border-[var(--card-border)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-2)]'
          }`}
        >
          <Briefcase size={12} className={activeTab === 'assets' ? 'text-emerald-400' : ''} />
          <span>Underlying Assets</span>
          {stocks.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 font-extrabold">
              {stocks.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sectors')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all ${
            activeTab === 'sectors'
              ? 'bg-[var(--card-bg)] text-[var(--text)] shadow-xs border border-[var(--card-border)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-2)]'
          }`}
        >
          <PieChart size={12} className={activeTab === 'sectors' ? 'text-blue-400' : ''} />
          <span>Sector Allocation</span>
          {sectors.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-400 font-extrabold">
              {sectors.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle size={13} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <div className="space-y-2 py-2">
          <div className="h-7 rounded-lg bg-[var(--sheet-btn-bg)] animate-pulse" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 rounded-lg bg-[var(--sheet-btn-bg)] animate-pulse" />
          ))}
        </div>
      ) : stocks.length === 0 && sectors.length === 0 ? (
        /* ── Empty State ── */
        <div className="text-center py-6 px-3 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--sheet-btn-bg)]">
          <Sparkles size={22} className="mx-auto text-emerald-400/60 mb-2" />
          <h3 className="text-xs font-bold text-[var(--text)] mb-0.5">
            No Holdings Disclosed Yet
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto mb-3">
            {isin 
              ? `ISIN: ${isin}. Tap below to request latest portfolio disclosure.`
              : 'Add an ISIN to this fund to sync underlying constituent stocks & sector allocations.'}
          </p>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Fetching Fund Data...' : 'Sync Constituents Now'}</span>
          </button>
        </div>
      ) : activeTab === 'assets' ? (
        /* ── TAB 1: Underlying Assets (Concise Zerodha Coin Style) ── */
        <div>
          {/* Concentration Strip: Ultra-compact 1-liner */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--sheet-btn-bg)] border border-[var(--card-border)] mb-2.5 text-[11px] font-semibold">
            <div className="flex items-center gap-1">
              <span className="text-[var(--text-muted)] uppercase text-[10px] tracking-wider font-bold">Top 5:</span>
              <span className="font-extrabold text-emerald-400">{top5Weight.toFixed(1)}%</span>
            </div>
            <div className="w-px h-3 bg-[var(--divider)]" />
            <div className="flex items-center gap-1">
              <span className="text-[var(--text-muted)] uppercase text-[10px] tracking-wider font-bold">Top 10:</span>
              <span className="font-extrabold text-teal-400">{top10Weight.toFixed(1)}%</span>
            </div>
            <div className="w-px h-3 bg-[var(--divider)]" />
            <div className="flex items-center gap-1 text-[var(--text-muted)]">
              <span className="font-extrabold text-[var(--text)]">{stocks.length}</span>
              <span className="text-[10px]">assets</span>
            </div>
          </div>

          {/* Compact Search Bar */}
          {stocks.length > 5 && (
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${stocks.length} underlying assets...`}
                className="w-full pl-7 pr-7 py-1 rounded-lg text-xs bg-[var(--sheet-btn-bg)] border border-[var(--card-border)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50 transition-colors h-7"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Table Header */}
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--divider)]">
            <div className="flex items-center gap-2">
              <span className="w-4 text-center">#</span>
              <span>Company / Asset</span>
            </div>
            <span className="text-right">Holding</span>
          </div>

          {/* Concise Stock Rows (Zerodha Coin Clean Table Layout) */}
          <div className="divide-y divide-[var(--divider)]">
            {visibleStocks.map((item, idx) => {
              const weight = Number(item.weight || 0);
              const rupeeExposure = fundValue > 0 ? (fundValue * weight) / 100 : null;

              return (
                <div
                  key={item.name + idx}
                  className="px-2 py-2 flex items-center justify-between gap-2 hover:bg-[var(--sheet-btn-bg)] transition-colors group"
                >
                  {/* Left: Rank & Name */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-4 text-center text-[11px] font-bold text-[var(--text-muted)] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-[13px] font-semibold text-[var(--text)] truncate group-hover:text-emerald-400 transition-colors">
                      {item.name}
                    </span>
                  </div>

                  {/* Right: Holding % & Indirect Rupee Exposure */}
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-[13px] font-bold text-[var(--text)] leading-tight">
                      {weight.toFixed(2)}%
                    </div>
                    {rupeeExposure !== null && (
                      <div className="text-[10px] font-medium text-[var(--text-muted)] leading-none mt-0.5">
                        {isPrivacyMode ? '₹***' : formatCurrency(rupeeExposure)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More / Show Less Button */}
          {filteredStocks.length > 10 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-2 py-1.5 px-3 rounded-lg text-xs font-bold text-[var(--text-2)] hover:text-[var(--text)] bg-[var(--sheet-btn-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] flex items-center justify-center gap-1 transition-all"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={13} />
                  <span>Show Top 10 Only</span>
                </>
              ) : (
                <>
                  <ChevronDown size={13} />
                  <span>View All {filteredStocks.length} Constituents</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        /* ── TAB 2: Sector Allocation (Concise Zerodha Coin Style) ── */
        <div>
          {/* Micro Segmented Visual Stack Bar */}
          {sectors.length > 0 && (
            <div className="mb-2.5">
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden flex shadow-inner">
                {sectors.map((sec, i) => {
                  const color = getSectorColor(sec.name, i);
                  return (
                    <div
                      key={sec.name + i}
                      title={`${sec.name}: ${Number(sec.weight || 0).toFixed(2)}%`}
                      style={{
                        width: `${Number(sec.weight || 0)}%`,
                        backgroundColor: color,
                      }}
                      className="h-full transition-all hover:opacity-80"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Table Header */}
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--divider)]">
            <span>Sector</span>
            <span className="text-right">Allocation</span>
          </div>

          {/* Concise Sector Rows */}
          <div className="divide-y divide-[var(--divider)]">
            {sectors.map((sec, idx) => {
              const weight = Number(sec.weight || 0);
              const color = getSectorColor(sec.name, idx);
              const rupeeExposure = fundValue > 0 ? (fundValue * weight) / 100 : null;

              return (
                <div
                  key={sec.name + idx}
                  className="px-2 py-2 flex items-center justify-between gap-2 hover:bg-[var(--sheet-btn-bg)] transition-colors"
                >
                  {/* Left: Color Dot & Name */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs sm:text-[13px] font-semibold text-[var(--text)] truncate">
                      {sec.name}
                    </span>
                  </div>

                  {/* Right: Allocation % & Rupee Exposure */}
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-[13px] font-bold text-[var(--text)] leading-tight">
                      {weight.toFixed(2)}%
                    </div>
                    {rupeeExposure !== null && (
                      <div className="text-[10px] font-medium text-[var(--text-muted)] leading-none mt-0.5">
                        {isPrivacyMode ? '₹***' : formatCurrency(rupeeExposure)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
