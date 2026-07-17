import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePrivacy } from '../../context/PrivacyContext';
import { useTheme } from '../../context/ThemeContext';

const ASSET_COLORS = {
  Stocks: '#6366F1',
  'Mutual Funds': '#06B6D4',
  ETFs: '#F59E0B',
  FD: '#10B981',
};

export default function OverallInvestments({ data, loading }) {
  const { isPrivacyMode } = usePrivacy();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  if (loading && !data) {
    return <section className="mb-5"><Skeleton width="100%" height={240} rounded="xl" /></section>;
  }
  if (!data) return null;

  const total = data.find((d) => d.assetClass === 'Total') || {};
  const others = data.filter((d) => d.assetClass !== 'Total');
  const isProfit = (total.profit ?? 0) >= 0;
  const returnColor = isProfit ? 'var(--profit)' : 'var(--loss)';

  const heroBg = isDark
    ? isProfit
      ? 'linear-gradient(145deg,#0d1f18 0%,#0a2e1c 100%)'
      : 'linear-gradient(145deg,#1f0d0d 0%,#2e0a0a 100%)'
    : isProfit
      ? 'linear-gradient(145deg,#f0fdf7 0%,#e6fdf2 100%)'
      : 'linear-gradient(145deg,#fff5f5 0%,#fee8e8 100%)';

  const heroBorder = isProfit
    ? `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(22,163,74,0.25)'}`
    : `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.2)'}`;

  return (
    <section className="mb-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl p-5 shadow-2xl"
        style={{ background: heroBg, border: heroBorder }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: isProfit
              ? 'radial-gradient(ellipse at 80% 20%, #22C55E 0%, transparent 65%)'
              : 'radial-gradient(ellipse at 80% 20%, #EF4444 0%, transparent 65%)',
          }}
        />

        <div className="relative z-10">
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            Portfolio Value
          </p>
          <p className="text-4xl font-bold tracking-tight leading-none mb-3" style={{ color: 'var(--text)' }}>
            {isPrivacyMode ? '₹ ••••••' : formatCurrency(total.current)}
          </p>

          {/* P&L badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold mb-4"
            style={{
              background: isProfit ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: isProfit ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
              color: returnColor,
            }}
          >
            {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPrivacyMode ? '₹•••••' : `${isProfit ? '+' : ''}${formatCurrency(total.profit)}`}
            <span className="opacity-70">({formatPercent(total.returnPercentage)})</span>
          </div>

          {/* Invested row */}
          <div
            className="flex items-center justify-between mb-4 pb-4"
            style={{ borderBottom: '1px solid var(--divider)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Invested</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {isPrivacyMode ? '₹••••••' : formatCurrency(total.invested)}
            </span>
          </div>

          {/* Asset breakdown */}
          <div className="space-y-3">
            {others.map((item) => {
              const itemIsProfit = (item.profit ?? 0) >= 0;
              const color = ASSET_COLORS[item.assetClass] ?? '#94A3B8';
              return (
                <div key={item.assetClass} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>{item.assetClass}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {isPrivacyMode ? '₹•••' : formatCurrency(item.current)}
                    </span>
                    <span
                      className="text-xs font-semibold w-14 text-right"
                      style={{ color: itemIsProfit ? 'var(--profit)' : 'var(--loss)' }}
                    >
                      {itemIsProfit}{formatPercent(item.returnPercentage)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
