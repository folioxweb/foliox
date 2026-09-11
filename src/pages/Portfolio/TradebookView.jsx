import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Filter, 
  Calendar, 
  X, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Scale,
  Briefcase
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { usePrivacy } from '../../context/PrivacyContext';
import { formatCurrency } from '../../utils/formatters';
import Skeleton from '../../components/ui/Skeleton';

const ASSET_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Stocks', value: 'STOCK' },
  { label: 'ETFs', value: 'ETF' },
  { label: 'Mutual Funds', value: 'MF' },
  { label: 'FDs', value: 'FD' },
];

const TX_TYPE_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Buy', value: 'BUY' },
  { label: 'Sell', value: 'SELL' },
];

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TradebookView({ onSelectHolding }) {
  const { isPrivacyMode } = usePrivacy();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  async function fetchTrades() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTradebook();
      setTrades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load tradebook:', err);
      setError(err.message || 'Failed to load tradebook records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrades();
  }, []);

  // Filtered Trades
  const filteredTrades = useMemo(() => {
    return trades.filter((tx) => {
      // Asset Type
      if (assetFilter !== 'ALL') {
        const type = (tx.asset_type || '').toUpperCase();
        if (assetFilter === 'STOCK' && type !== 'STOCK') return false;
        if (assetFilter === 'ETF' && type !== 'ETF') return false;
        if (assetFilter === 'MF' && type !== 'MF') return false;
        if (assetFilter === 'FD' && type !== 'FD') return false;
      }

      // Tx Type
      if (txTypeFilter !== 'ALL') {
        const txT = (tx.tx_type || '').toUpperCase();
        if (txT !== txTypeFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sym = (tx.symbol || '').toLowerCase();
        const name = (tx.name || '').toLowerCase();
        const sector = (tx.sector || '').toLowerCase();
        if (!sym.includes(q) && !name.includes(q) && !sector.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [trades, assetFilter, txTypeFilter, searchQuery]);

  // Summary Metrics across filtered trades
  const summary = useMemo(() => {
    let buyTurnover = 0;
    let sellTurnover = 0;
    let realizedGain = 0;
    let buyCount = 0;
    let sellCount = 0;

    for (const tx of filteredTrades) {
      const isSell = (tx.tx_type || '').toUpperCase() === 'SELL';
      const turnover = Number(tx.turnover || (Math.abs(Number(tx.quantity || 0)) * Number(tx.price || 0)));

      if (isSell) {
        sellTurnover += turnover;
        sellCount++;
        if (tx.realized_gain != null) {
          realizedGain += Number(tx.realized_gain);
        }
      } else {
        buyTurnover += turnover;
        buyCount++;
      }
    }

    return {
      totalTrades: filteredTrades.length,
      buyTurnover,
      sellTurnover,
      realizedGain,
      buyCount,
      sellCount,
    };
  }, [filteredTrades]);

  // CSV Export
  function handleExportCsv() {
    if (filteredTrades.length === 0) return;

    const headers = [
      'Date & Time',
      'Order Type',
      'Symbol',
      'Name',
      'Asset Class',
      'Quantity',
      'Execution Price (₹)',
      'Cost Price (₹)',
      'Turnover (₹)',
      'Realized P&L (₹)',
    ];

    const rows = filteredTrades.map((tx) => [
      `"${formatDateTime(tx.tx_date)}"`,
      `"${tx.tx_type || 'BUY'}"`,
      `"${(tx.symbol || '').replace(/"/g, '""')}"`,
      `"${(tx.name || '').replace(/"/g, '""')}"`,
      `"${tx.asset_type || ''}"`,
      tx.quantity != null ? tx.quantity : 1,
      tx.price || 0,
      tx.cost_price || tx.price || 0,
      tx.turnover || 0,
      tx.realized_gain != null ? tx.realized_gain : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FolioX_Tradebook_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4 pb-12">
      {/* ── Summary Ribbon ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div
          className="rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Total Trades
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-[var(--text)]">
              {summary.totalTrades}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              ({summary.buyCount} B / {summary.sellCount} S)
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Total Buy Value
          </span>
          <div className="mt-1 flex items-baseline">
            <span className="text-lg sm:text-xl font-black text-emerald-500 dark:text-emerald-400 truncate">
              {isPrivacyMode ? '₹••••••' : formatCurrency(summary.buyTurnover)}
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
            Total Sell Value
          </span>
          <div className="mt-1 flex items-baseline">
            <span className="text-lg sm:text-xl font-black text-indigo-400 truncate">
              {isPrivacyMode ? '₹••••••' : formatCurrency(summary.sellTurnover)}
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Realized P&amp;L
          </span>
          <div className="mt-1 flex items-baseline">
            <span
              className={`text-lg sm:text-xl font-black truncate ${
                summary.realizedGain >= 0
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-rose-500 dark:text-rose-400'
              }`}
            >
              {isPrivacyMode
                ? '₹••••••'
                : `${summary.realizedGain >= 0 ? '+' : ''}${formatCurrency(summary.realizedGain)}`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-3 sm:p-3.5 space-y-3"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {/* Row 1: Search Input & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search size={16} className="absolute left-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search symbol, company, or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--emerald)]"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--text)',
                fontSize: '14px',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredTrades.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition hover:opacity-85 disabled:opacity-40 shrink-0 cursor-pointer shadow-sm"
            style={{
              background: 'var(--sheet-btn-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text)',
            }}
            title="Download CSV of filtered trades"
          >
            <Download size={14} className="text-emerald-500 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>

          <button
            type="button"
            onClick={fetchTrades}
            disabled={loading}
            className="p-2 rounded-xl transition hover:opacity-85 disabled:opacity-40 shrink-0 cursor-pointer"
            style={{
              background: 'var(--sheet-btn-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-muted)',
            }}
            title="Refresh Tradebook"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Row 2: Asset Class & Tx Type Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--divider)]">
          {/* Asset Class Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {ASSET_FILTERS.map((tab) => {
              const active = assetFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setAssetFilter(tab.value)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                  style={{
                    background: active ? 'var(--emerald)' : 'transparent',
                    color: active ? '#FFFFFF' : 'var(--text-muted)',
                    border: active ? '1px solid var(--emerald)' : '1px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Buy / Sell Segmented Pill */}
          <div
            className="flex items-center p-0.5 rounded-lg shrink-0"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
          >
            {TX_TYPE_FILTERS.map((type) => {
              const active = txTypeFilter === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setTxTypeFilter(type.value)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all"
                  style={{
                    background: active
                      ? type.value === 'SELL'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : type.value === 'BUY'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'var(--card-bg)'
                      : 'transparent',
                    color: active
                      ? type.value === 'SELL'
                        ? 'var(--loss, #EF4444)'
                        : type.value === 'BUY'
                        ? 'var(--emerald, #10B981)'
                        : 'var(--text)'
                      : 'var(--text-muted)',
                  }}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Trade Rows ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2.5">
          <Skeleton width="100%" height={76} rounded="xl" />
          <Skeleton width="100%" height={76} rounded="xl" />
          <Skeleton width="100%" height={76} rounded="xl" />
        </div>
      ) : error ? (
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <p className="text-sm font-semibold text-rose-500 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={fetchTrades}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:opacity-90"
          >
            Retry
          </button>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center space-y-2"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          <Briefcase size={36} className="mx-auto text-[var(--text-muted)] opacity-50" />
          <h3 className="text-base font-bold text-[var(--text)]">No trades found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {searchQuery || assetFilter !== 'ALL' || txTypeFilter !== 'ALL'
              ? 'No transactions matched your search or filters. Try adjusting them.'
              : 'Your executed trades and order history will appear here.'}
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden divide-y divide-[var(--divider)]"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {filteredTrades.map((tx) => {
            const isSell = (tx.tx_type || '').toUpperCase() === 'SELL';
            const isFd = (tx.asset_type || '').toUpperCase() === 'FD';
            const turnover = Number(tx.turnover || (Math.abs(Number(tx.quantity || 0)) * Number(tx.price || 0)));
            const qty = Math.abs(Number(tx.quantity || 1));
            const price = Number(tx.price || 0);
            const costPrice = Number(tx.cost_price || price);
            const realizedGain = tx.realized_gain != null ? Number(tx.realized_gain) : null;
            const realizedPct = costPrice > 0 && realizedGain != null && qty > 0
              ? (realizedGain / (costPrice * qty)) * 100
              : null;

            return (
              <motion.div
                key={tx.tx_id || `${tx.symbol}_${tx.tx_date}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 sm:p-4 transition-colors hover:bg-[var(--sheet-btn-bg)] cursor-pointer"
                onClick={() => {
                  if (onSelectHolding && tx.asset_id) {
                    onSelectHolding({
                      assetId: tx.asset_id,
                      symbol: tx.symbol,
                      name: tx.name,
                      assetType: tx.asset_type?.toLowerCase() === 'mf' ? 'mutualFunds' : 'stocks',
                    });
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Type Badge & Asset Info */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className="mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0"
                      style={{
                        background: isSell ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isSell ? 'var(--loss, #EF4444)' : 'var(--emerald, #10B981)',
                        border: `1px solid ${isSell ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      }}
                    >
                      {isSell ? 'SELL' : 'BUY'}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-[var(--text)] truncate">
                          {tx.symbol || tx.name}
                        </h4>
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase shrink-0"
                          style={{
                            background: 'var(--input-bg)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--card-border)',
                          }}
                        >
                          {tx.asset_type || 'STOCK'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate max-w-[220px] sm:max-w-md">
                        {tx.name || tx.sector || '—'}
                      </p>
                      <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
                        {formatDateTime(tx.tx_date)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Quantity, Price & Turnover */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[var(--text)]">
                      {isPrivacyMode ? '₹••••••' : formatCurrency(turnover)}
                    </p>

                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {isFd ? (
                        `${tx.fd_rate || 0}% p.a.`
                      ) : (
                        `${qty} qty @ ${isPrivacyMode ? '₹•••' : formatCurrency(price)}`
                      )}
                    </p>

                    {/* Realized P&L for SELL transactions */}
                    {isSell && realizedGain != null && (
                      <div className="mt-1 inline-flex items-center gap-1">
                        <span
                          className={`text-[11px] font-extrabold px-1.5 py-0.2 rounded ${
                            realizedGain >= 0
                              ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10'
                              : 'text-rose-500 dark:text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          {realizedGain >= 0 ? '+' : ''}
                          {isPrivacyMode ? '₹•••' : formatCurrency(realizedGain)}
                          {realizedPct != null && ` (${realizedGain >= 0 ? '+' : ''}${realizedPct.toFixed(1)}%)`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
