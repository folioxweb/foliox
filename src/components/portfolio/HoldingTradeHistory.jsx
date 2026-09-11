import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, ChevronDown, ChevronUp, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { api } from '../../services/apiClient';
import { usePrivacy } from '../../context/PrivacyContext';
import { formatCurrency } from '../../utils/formatters';
import Skeleton from '../ui/Skeleton';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function HoldingTradeHistory({ assetId, symbol }) {
  const { isPrivacyMode } = usePrivacy();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchAssetTrades() {
      if (!assetId && !symbol) return;
      try {
        setLoading(true);
        const data = await api.getTradebook({ assetId });
        if (isMounted) {
          // If assetId returned results, use them, otherwise filter by symbol
          if (Array.isArray(data) && data.length > 0) {
            setTrades(data);
          } else if (symbol) {
            const all = await api.getTradebook();
            const filtered = (all || []).filter(
              (t) => (t.symbol || '').toUpperCase() === symbol.toUpperCase()
            );
            if (isMounted) setTrades(filtered);
          } else {
            setTrades([]);
          }
        }
      } catch (err) {
        console.error('Failed to load asset trade history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAssetTrades();
    return () => {
      isMounted = false;
    };
  }, [assetId, symbol]);

  if (!loading && trades.length === 0) {
    return null; // Don't clutter UI if no individual trades recorded yet
  }

  return (
    <div
      className="rounded-2xl overflow-hidden mt-3"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-colors hover:bg-[var(--sheet-btn-bg)] cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <History size={16} className="text-emerald-500 dark:text-emerald-400" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text)]">
            Order &amp; Trade History ({loading ? '...' : trades.length})
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--text-muted)] font-medium">
            {isOpen ? 'Hide' : 'View'}
          </span>
          {isOpen ? (
            <ChevronUp size={16} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronDown size={16} className="text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-[var(--divider)]"
          >
            {loading ? (
              <div className="p-4 space-y-2">
                <Skeleton width="100%" height={40} rounded="lg" />
                <Skeleton width="100%" height={40} rounded="lg" />
              </div>
            ) : trades.length === 0 ? (
              <p className="p-4 text-xs text-[var(--text-muted)] text-center">
                No individual trade logs recorded for this asset.
              </p>
            ) : (
              <div className="divide-y divide-[var(--divider)]">
                {trades.map((tx, idx) => {
                  const isSell = (tx.tx_type || '').toUpperCase() === 'SELL';
                  const qty = Math.abs(Number(tx.quantity || 1));
                  const price = Number(tx.price || 0);
                  const turnover = Number(tx.turnover || (qty * price));
                  const realizedGain = tx.realized_gain != null ? Number(tx.realized_gain) : null;

                  return (
                    <div
                      key={tx.tx_id || idx}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                            isSell
                              ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isSell ? 'SELL' : 'BUY'}
                        </span>
                        <div>
                          <p className="font-semibold text-[var(--text)]">
                            {qty} units @ {isPrivacyMode ? '₹•••' : formatCurrency(price)}
                          </p>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {formatDate(tx.tx_date)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-[var(--text)]">
                          {isPrivacyMode ? '₹••••••' : formatCurrency(turnover)}
                        </span>
                        {isSell && realizedGain != null && (
                          <p
                            className={`text-[10px] font-bold ${
                              realizedGain >= 0
                                ? 'text-emerald-500 dark:text-emerald-400'
                                : 'text-rose-500 dark:text-rose-400'
                            }`}
                          >
                            P&amp;L: {realizedGain >= 0 ? '+' : ''}
                            {isPrivacyMode ? '₹•••' : formatCurrency(realizedGain)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
