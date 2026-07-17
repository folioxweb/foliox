import { motion } from 'framer-motion';
import Skeleton from '../../components/ui/Skeleton';
import { usePrivacy } from '../../context/PrivacyContext';

const RANK_COLORS = ['#F59E0B','#94A3B8','#CD7F32','#6366F1','#10B981','#06B6D4','#EC4899'];

const formatCrore = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
};

export default function StocksAllocation({ data, loading }) {
  const { isPrivacyMode } = usePrivacy();

  if (loading && !data) {
    return <section className="mb-5"><Skeleton width="100%" height={280} rounded="xl" /></section>;
  }
  if (!data) return null;

  const topStocks = data.slice(0, 7);
  const maxExposure = Math.max(...topStocks.map((s) => s.exposure), 1);

  return (
    <section className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
        Top Holdings by Exposure
      </p>
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
        {topStocks.map((item, i) => {
          const barPct = (item.exposure / maxExposure) * 100;
          const rankColor = RANK_COLORS[i] ?? '#64748B';

          return (
            <div
              key={item.name}
              className="relative px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: i < topStocks.length - 1 ? '1px solid var(--divider)' : 'none' }}
            >
              {/* Animated background bar */}
              <motion.div
                className="absolute left-0 top-0 bottom-0 pointer-events-none"
                initial={{ width: 0 }}
                animate={{ width: `${barPct}%` }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                style={{ background: `${rankColor}0D` }}
              />

              {/* Rank badge */}
              <span
                className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${rankColor}22`, color: rankColor }}
              >
                {i + 1}
              </span>

              {/* Name + exposure */}
              <div className="relative z-10 flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {isPrivacyMode ? '••••••••' : item.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isPrivacyMode ? '₹•••' : formatCrore(item.exposure)}
                </p>
              </div>

              {/* Allocation % */}
              <span className="relative z-10 text-sm font-bold flex-shrink-0" style={{ color: rankColor }}>
                {item.allocation.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
