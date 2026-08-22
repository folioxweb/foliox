import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import { usePrivacy } from '../../context/PrivacyContext';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const ASSET_META = [
  { label: 'Stocks', gainKey: 'stocksGain', pctKey: 'stocksGainPercent', color: '#6366F1' },
  { label: 'ETFs', gainKey: 'etfsGain', pctKey: 'etfsGainPercent', color: '#F59E0B' },
  { label: 'Mutual Funds', gainKey: 'mutualFundsGain', pctKey: 'mutualFundsGainPercent', color: '#06B6D4' },
];

function MiniBar({ value, max, color }) {
  const rawPct = max > 0 ? Math.min(Math.abs(value) / max, 1) * 100 : 0;
  const pct = value !== 0 ? Math.max(rawPct, 12) : 8;
  return (
    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: 'var(--divider)' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: 99 }}
      />
    </div>
  );
}

export default function TodayPerformance({ data, loading }) {
  const { isPrivacyMode } = usePrivacy();

  if (loading && !data) {
    return (
      <section className="mb-5">
        <Skeleton width="100%" height={200} rounded="xl" />
      </section>
    );
  }
  if (!data) return null;

  const actualData = data.data ? data.data : data;

  const gain = Number(actualData?.gain) || 0;
  const gainPercent = Number(actualData?.gainPercent) || 0;
  const isProfit = gain >= 0;
  const accentColor = isProfit ? 'var(--profit)' : 'var(--loss)';

  const assetRows = ASSET_META.map((m) => ({
    label: m.label,
    gain: Number(actualData?.[m.gainKey]) || 0,
    pct: Number(actualData?.[m.pctKey]) || 0,
    color: m.color,
  }));
  const maxGain = Math.max(...assetRows.map((r) => Math.abs(r.gain)), 1);

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
        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                Today's Market Breakdown
              </span>
            </div>
            <span
              className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full tabular-nums"
              style={{
                background: isProfit ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: accentColor,
              }}
            >
              {formatPercent(gainPercent)}
            </span>
          </div>

          {/* Hero Gain Display */}
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-2)] uppercase tracking-wider block">
                Total Day's Gain / Loss
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isProfit ? (
                  <TrendingUp size={20} style={{ color: accentColor }} />
                ) : (
                  <TrendingDown size={20} style={{ color: accentColor }} />
                )}
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums" style={{ color: accentColor }}>
                  {isPrivacyMode ? '₹ ••••••' : `${gain >= 0 ? '+' : ''}${formatCurrency(gain)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Asset Class Gain Breakdown */}
          <div className="space-y-3">
            {assetRows.map((row) => {
              const rowIsProfit = row.gain >= 0;
              return (
                <div key={row.label} className="p-2.5 rounded-xl transition-colors" style={{ background: 'var(--input-bg)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                        {row.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="text-xs font-bold tabular-nums" style={{ color: rowIsProfit ? 'var(--profit)' : 'var(--loss)' }}>
                        {isPrivacyMode ? '₹ •••' : `${row.gain >= 0 ? '+' : ''}${formatCurrency(row.gain)}`}
                      </span>
                      <span className="text-[11px] font-semibold w-12 text-right text-[var(--text-2)] tabular-nums">
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
      </div>
    </section>
  );
}