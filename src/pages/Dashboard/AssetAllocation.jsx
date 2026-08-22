import { motion } from 'framer-motion';
import Skeleton from '../../components/ui/Skeleton';
import { usePrivacy } from '../../context/PrivacyContext';

const SEGMENT_COLORS = { Equity: '#6366F1', Cash: '#10B981', 'Cash/Debt': '#10B981', Debt: '#10B981', FD: '#F59E0B', 'Fixed Deposits': '#F59E0B' };

const formatCrore = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
};

export default function AssetAllocation({ data, loading }) {
  const { isPrivacyMode } = usePrivacy();

  if (loading && (!data || !Array.isArray(data))) {
    return <section className="mb-5"><Skeleton width="100%" height={140} rounded="xl" /></section>;
  }
  if (!data || !Array.isArray(data)) return null;

  const totalItem = data.find((d) => d.asset === 'Total');
  const segments = data.filter((d) => d.asset !== 'Total' && d.allocation > 0);
  const totalAllocation = totalItem?.allocation ?? segments.reduce((s, d) => s + d.allocation, 0);

  return (
    <section className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
        Asset Allocation
      </p>
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {/* Segmented bar */}
        <div className="flex rounded-full overflow-hidden h-3 mb-4 gap-0.5">
          {segments.map((item, i) => {
            const pct = totalAllocation > 0 ? (item.allocation / totalAllocation) * 100 : 0;
            const color = SEGMENT_COLORS[item.asset] ?? '#94A3B8';
            return (
              <motion.div
                key={item.asset}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
                style={{ background: color, minWidth: pct > 0 ? 4 : 0 }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {segments.map((item) => {
            const pct = totalAllocation > 0 ? ((item.allocation / totalAllocation) * 100).toFixed(1) : '0.0';
            const color = SEGMENT_COLORS[item.asset] ?? '#94A3B8';
            return (
              <div key={item.asset} className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                <div className="flex flex-col">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.asset}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    {isPrivacyMode ? '•••' : formatCrore(item.allocation)}
                    <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
