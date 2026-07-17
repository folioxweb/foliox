import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import { usePrivacy } from '../../context/PrivacyContext';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const ASSET_META = [
  { label: 'Stocks',       gainKey: 'stocksGain',      pctKey: 'stocksGainPercent',      color: '#6366F1' },
  { label: 'ETFs',         gainKey: 'etfsGain',        pctKey: 'etfsGainPercent',        color: '#F59E0B' },
  { label: 'Mutual Funds', gainKey: 'mutualFundsGain', pctKey: 'mutualFundsGainPercent', color: '#06B6D4' },
];

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(Math.abs(value) / max, 1) * 100 : 0;
  return (
    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: 'var(--divider)' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: 99 }}
      />
    </div>
  );
}

export default function TodayPerformance({ data, loading }) {
  const { isPrivacyMode } = usePrivacy();

  if (loading && !data) {
    return <section className="mb-5"><Skeleton width="100%" height={220} rounded="xl" /></section>;
  }
  if (!data) return null;

  const gain = Number(data?.gain) || 0;
  const gainPercent = Number(data?.gainPercent) || 0;
  const isProfit = gain >= 0;
  const accentColor = isProfit ? 'var(--profit)' : 'var(--loss)';

  const assetRows = ASSET_META.map((m) => ({
    label: m.label,
    gain: Number(data?.[m.gainKey]) || 0,
    pct: Number(data?.[m.pctKey]) || 0,
    color: m.color,
  }));
  const maxGain = Math.max(...assetRows.map((r) => Math.abs(r.gain)), 1);

  return (
    <section className="mb-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="relative overflow-hidden rounded-2xl p-5 shadow-lg"
        style={{
          background: 'var(--card-bg)',
          border: `1px solid ${isProfit ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {/* Accent left bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: accentColor }} />

        <div className="relative z-10">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={13} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Today's P&amp;L
              </span>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: isProfit ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: accentColor,
              }}
            >
              {isProfit}{formatPercent(gainPercent)}
            </span>
          </div>

          {/* Hero gain */}
          <div className="flex items-baseline gap-2 mb-5">
            {isProfit
              ? <TrendingUp size={18} style={{ color: accentColor, flexShrink: 0 }} />
              : <TrendingDown size={18} style={{ color: accentColor, flexShrink: 0 }} />}
            <span className="text-3xl font-bold tracking-tight" style={{ color: accentColor }}>
              {isPrivacyMode ? '₹••••••' : `${gain >= 0 ? '+' : ''}${formatCurrency(gain)}`}
            </span>
          </div>

          {/* Asset breakdown */}
          <div className="space-y-3">
            {assetRows.map((row) => {
              const rowIsProfit = row.gain >= 0;
              return (
                <div key={row.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: row.color }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: rowIsProfit ? 'var(--profit)' : 'var(--loss)' }}>
                        {isPrivacyMode ? '₹•••' : `${row.gain >= 0 ? '+' : ''}${formatCurrency(row.gain)}`}
                      </span>
                      <span className="text-xs w-12 text-right" style={{ color: 'var(--text-muted)' }}>
                        {formatPercent(row.pct)}
                      </span>
                    </div>
                  </div>
                  <MiniBar value={row.gain} max={maxGain} color={row.color} />
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}