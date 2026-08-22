import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronDown, ShieldCheck } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePrivacy } from '../../context/PrivacyContext';

const ASSET_COLORS = {
  Stocks: '#6366F1',
  'Mutual Funds': '#06B6D4',
  ETFs: '#F59E0B',
  FD: '#10B981',
};

function getMarketStatus() {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utcMs + (5.5 * 3600000));
  
  const day = istTime.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isWeekday = day >= 1 && day <= 5;

  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // NSE/BSE Trading Hours: 9:15 AM (555 mins) to 3:30 PM (930 mins) IST
  const marketOpen = 9 * 60 + 15;
  const marketClose = 15 * 60 + 30;

  const isOpen = isWeekday && timeInMinutes >= marketOpen && timeInMinutes <= marketClose;

  return {
    isOpen,
    label: isOpen ? 'NSE / BSE Live' : 'Market Closed',
  };
}

export default function OverallInvestments({ data, loading }) {
  const { isPrivacyMode } = usePrivacy();
  const [expanded, setExpanded] = useState(true);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading && (!data || !Array.isArray(data))) {
    return (
      <section className="mb-5">
        <Skeleton width="100%" height={240} rounded="xl" />
      </section>
    );
  }
  if (!data || !Array.isArray(data)) return null;

  const total = data.find((d) => d.assetClass === 'Total') || {};
  const others = data.filter((d) => d.assetClass !== 'Total');
  const isOverallProfit = (total.profit ?? 0) >= 0;
  const overallColor = isOverallProfit ? 'var(--profit)' : 'var(--loss)';

  const portfolioCurrentVal = Number(total.current || 0);

  return (
    <section className="mb-5">
      <div
        className="relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-200"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.06))',
        }}
      >
        {/* Top Official Broker Header Strip */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: 'var(--divider)' }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-2)] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              Verified Portfolio
            </span>
          </div>

          <div className="flex items-center gap-2">
            {marketStatus.isOpen ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                NSE / BSE Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Market Closed
              </span>
            )}
          </div>
        </div>

        {/* Portfolio Value Hero Display */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-2)] block mb-1">
            Total Portfolio Value
          </span>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums"
              style={{ color: 'var(--text)' }}
            >
              {isPrivacyMode ? '₹ ••••••••' : formatCurrency(total.current)}
            </h2>

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-bold text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
            >
              <span>{expanded ? 'Hide Breakdown' : 'Show Breakdown'}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Overall Return (Total P&L) Full Width Card */}
        <div
          className="p-3.5 rounded-xl flex flex-col justify-between transition-all mb-4"
          style={{
            background: 'var(--input-bg)',
            border: `1px solid ${isOverallProfit ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
              Overall Return (Total P&L)
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: isOverallProfit ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: overallColor,
              }}
            >
              {isOverallProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {formatPercent(total.returnPercentage)}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tabular-nums" style={{ color: overallColor }}>
              {isPrivacyMode ? '₹ •••••' : `${isOverallProfit ? '+' : ''}${formatCurrency(total.profit)}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t" style={{ borderColor: 'var(--divider)' }}>
            <span className="text-[var(--text-2)]">Invested Capital</span>
            <span className="font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {isPrivacyMode ? '₹ ••••••' : formatCurrency(total.invested)}
            </span>
          </div>
        </div>

        {/* Multi-Segment Asset Weightage Progress Bar */}
        {portfolioCurrentVal > 0 && (
          <div className="mb-4">
            <div className="h-2 rounded-full overflow-hidden flex w-full" style={{ background: 'var(--divider)' }}>
              {others.map((item) => {
                const cur = Number(item.current || 0);
                const pct = portfolioCurrentVal > 0 ? (cur / portfolioCurrentVal) * 100 : 0;
                if (pct <= 0) return null;
                return (
                  <div
                    key={item.assetClass}
                    style={{
                      width: `${pct}%`,
                      background: ASSET_COLORS[item.assetClass] || '#94A3B8',
                    }}
                    title={`${item.assetClass}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsible Asset Class Breakdown Table */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-2 pt-2 border-t"
              style={{ borderColor: 'var(--divider)' }}
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] pb-1">
                <span>Asset Class</span>
                <span>Value & Return</span>
              </div>

              {others.map((item) => {
                const itemIsProfit = (item.profit ?? 0) >= 0;
                const color = ASSET_COLORS[item.assetClass] ?? '#94A3B8';
                const cur = Number(item.current || 0);
                const weightPct = portfolioCurrentVal > 0 ? (cur / portfolioCurrentVal) * 100 : 0;

                return (
                  <div
                    key={item.assetClass}
                    className="flex items-center justify-between p-2 rounded-xl text-xs transition-colors hover:bg-[var(--input-bg)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <div>
                        <span className="font-bold text-[var(--text)]">{item.assetClass}</span>
                        <span className="text-[10px] text-[var(--text-2)] block font-medium">
                          {weightPct.toFixed(1)}% allocation
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold tabular-nums block" style={{ color: 'var(--text)' }}>
                        {isPrivacyMode ? '₹ •••' : formatCurrency(item.current)}
                      </span>
                      <span
                        className="text-[11px] font-bold tabular-nums"
                        style={{ color: itemIsProfit ? 'var(--profit)' : 'var(--loss)' }}
                      >
                        {formatPercent(item.returnPercentage)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
