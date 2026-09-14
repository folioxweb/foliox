import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, TrendingUp, Briefcase, ExternalLink, PieChart } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';
import { api } from '../../services/apiClient';
import Skeleton from '../ui/Skeleton';

function formatAmt(val) {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export const StockLookthroughDrawer = memo(function StockLookthroughDrawer({
  stock,
  isOpen,
  onClose,
}) {
  const { isPrivacyMode } = usePrivacy();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function fetchLookthrough() {
      if (!isOpen || !stock?.name) return;
      try {
        setLoading(true);
        const data = await api.getStockLookthrough(stock.name);
        if (!isCancelled) {
          setDetails(data);
        }
      } catch (err) {
        console.warn('Failed to fetch lookthrough data:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchLookthrough();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, stock?.name]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !stock) return null;

  const directVal = stock.directValue || details?.direct_value || 0;
  const indirectVal = stock.indirectValue || details?.indirect_value || 0;
  const totalExp = stock.exposure || details?.total_exposure || directVal + indirectVal;

  const directPct = totalExp > 0 ? (directVal / totalExp) * 100 : 0;
  const indirectPct = totalExp > 0 ? (indirectVal / totalExp) * 100 : 0;

  const directHolding = details?.direct_holding;
  const fundHoldings = details?.fund_holdings || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer Panel: Slide-over on Desktop, Bottom sheet on Mobile */}
        <motion.aside
          initial={{ x: '100%', y: 0 }}
          animate={{ x: 0, y: 0 }}
          exit={{ x: '100%', y: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          className="relative w-full max-w-md h-full flex flex-col shadow-2xl z-10 overflow-hidden"
          style={{
            background: 'var(--sheet-bg, var(--card-bg))',
            borderLeft: '1px solid var(--card-border)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${stock.name} Look-Through Analysis`}
        >
          {/* Header Bar */}
          <div
            className="p-4 sm:p-5 flex items-start justify-between gap-3 border-b"
            style={{ borderColor: 'var(--divider)' }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {stock.sector || 'Other'}
                </span>
                {stock.marketCap && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {stock.marketCap}
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--text)' }}>
                {isPrivacyMode ? '••••••••••••' : stock.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                Zerodha Console Look-Through X-Ray
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:opacity-80 transition-opacity shrink-0"
              style={{ background: 'var(--input-bg)', color: 'var(--text-muted)' }}
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
            {/* Exposure Summary Card */}
            <div
              className="p-4 rounded-2xl"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
              }}
            >
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Total Real Exposure
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stock.allocation ? `${stock.allocation.toFixed(2)}% of Portfolio` : ''}
                </span>
              </div>
              <div className="text-2xl font-black mb-3" style={{ color: 'var(--text)' }}>
                {isPrivacyMode ? '₹••••••' : formatAmt(totalExp)}
              </div>

              {/* Dual Progress Bar: Direct vs Indirect */}
              <div className="w-full h-2.5 rounded-full overflow-hidden flex gap-1 p-0.5 bg-black/5 dark:bg-white/5 mb-2.5">
                {directPct > 0 && (
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${directPct}%` }}
                    title={`Direct: ${directPct.toFixed(1)}%`}
                  />
                )}
                {indirectPct > 0 && (
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all"
                    style={{ width: `${indirectPct}%` }}
                    title={`Via Funds: ${indirectPct.toFixed(1)}%`}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-[var(--text-muted)]">Direct:</span>
                  <strong style={{ color: 'var(--text)' }}>
                    {isPrivacyMode ? '₹•••' : formatAmt(directVal)} ({directPct.toFixed(0)}%)
                  </strong>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-[var(--text-muted)]">Via Funds:</span>
                  <strong style={{ color: 'var(--text)' }}>
                    {isPrivacyMode ? '₹•••' : formatAmt(indirectVal)} ({indirectPct.toFixed(0)}%)
                  </strong>
                </div>
              </div>
            </div>

            {/* Section 1: Direct Demat Holding */}
            {directVal > 0 && (
              <div
                className="p-4 rounded-2xl space-y-3"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--divider)' }}>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={15} className="text-blue-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                      Direct Demat Holding
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    Demat Account
                  </span>
                </div>

                {directHolding ? (
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">Quantity</span>
                      <span className="font-bold text-[var(--text)]">{directHolding.shares ?? directHolding.quantity} shares</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">Avg Buy Price</span>
                      <span className="font-bold text-[var(--text)]">₹{directHolding.avg_price ?? directHolding.average_price}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">Current Value</span>
                      <span className="font-bold text-[var(--text)]">{formatAmt(directHolding.current_value)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">Unrealized P&L</span>
                      <span
                        className={`font-bold ${
                          (directHolding.pnl || 0) >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {(directHolding.pnl || 0) >= 0 ? '+' : ''}₹{directHolding.pnl} ({directHolding.pnl_pct ?? directHolding.pnl_percentage}%)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[var(--text-2)] font-semibold">
                    Direct Position Value: {formatAmt(directVal)}
                  </div>
                )}
              </div>
            )}

            {/* Section 2: Mutual Funds & ETFs Look-Through Breakdown */}
            <div
              className="p-4 rounded-2xl space-y-3"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
              }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--divider)' }}>
                <div className="flex items-center gap-1.5">
                  <Layers size={15} className="text-purple-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    Indirect Holdings via Funds
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  {fundHoldings.length} Funds
                </span>
              </div>

              {loading ? (
                <div className="space-y-2 py-2">
                  <Skeleton width="100%" height={50} rounded="xl" />
                  <Skeleton width="100%" height={50} rounded="xl" />
                </div>
              ) : fundHoldings.length === 0 ? (
                <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                  {indirectVal > 0
                    ? `Estimated indirect allocation: ${formatAmt(indirectVal)}`
                    : 'No mutual fund constituents identified for this stock.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                  {fundHoldings.map((fh, idx) => (
                    <div
                      key={`fund-${fh.fund_name}-${idx}`}
                      className="p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                      style={{ borderColor: 'var(--divider)', background: 'var(--input-bg)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/5 text-[var(--text-muted)] inline-block mb-0.5">
                          {fh.fund_type === 'ETF' ? 'ETF' : 'Mutual Fund'}
                        </span>
                        <h5 className="text-xs font-bold truncate text-[var(--text)]" title={fh.fund_name}>
                          {fh.fund_name}
                        </h5>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          Fund Weight: <strong className="text-purple-500">{fh.weight_percentage}%</strong>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-extrabold text-[var(--text)] block">
                          {isPrivacyMode ? '₹•••' : formatAmt(fh.user_exposure)}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">your exposure</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
});

export default StockLookthroughDrawer;
