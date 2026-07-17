import { motion } from 'framer-motion';
import Skeleton from '../../components/ui/Skeleton';

const SECTOR_PALETTE = [
  '#6366F1','#06B6D4','#F59E0B','#10B981','#EF4444',
  '#8B5CF6','#0EA5E9','#F97316','#14B8A6','#EC4899',
];

const formatCrore = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
};

export default function OverallSectorAllocation({ data, loading }) {
  if (loading && !data) {
    return <section className="mb-5"><Skeleton width="100%" height={200} rounded="xl" /></section>;
  }
  if (!data) return null;

  const sorted = [...data].sort((a, b) => b.allocation - a.allocation);
  const top5 = sorted.slice(0, 5);
  const othersAllocation = sorted.slice(5).reduce((s, d) => s + d.allocation, 0);
  const othersExposure = sorted.slice(5).reduce((s, d) => s + d.exposure, 0);
  if (othersAllocation > 0) top5.push({ sector: 'Others', allocation: othersAllocation, exposure: othersExposure });

  const maxAlloc = Math.max(...top5.map((d) => d.allocation), 1);

  return (
    <section className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
        Sector Exposure
      </p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {top5.map((item, i) => {
          const color = SECTOR_PALETTE[i % SECTOR_PALETTE.length];
          const barPct = (item.allocation / maxAlloc) * 100;
          return (
            <div key={item.sector} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{item.sector}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCrore(item.exposure)}</span>
                  <span className="text-sm font-bold w-10 text-right" style={{ color: 'var(--text)' }}>
                    {item.allocation.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: 'var(--divider)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                  style={{ height: '100%', background: color, borderRadius: 99 }}
                />
              </div>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
