import { memo } from 'react';
import { ShieldCheck, AlertTriangle, Layers, Repeat, TrendingUp } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';

function formatAmt(val) {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export const AnalyticsKpiRibbon = memo(function AnalyticsKpiRibbon({ stocksData = [], sectorData = [] }) {
  const { isPrivacyMode } = usePrivacy();

  if (!stocksData || stocksData.length === 0) return null;

  // 1. Total Tracked Exposure
  const totalExposure = stocksData.reduce((acc, s) => acc + (s.exposure || 0), 0);
  const totalCount = stocksData.length;

  // 2. Concentration Ratios (Sorted Descending)
  const sorted = [...stocksData].sort((a, b) => (b.exposure || 0) - (a.exposure || 0));
  const top5 = sorted.slice(0, 5);
  const top5Weight = top5.reduce((acc, s) => acc + (s.allocation || 0), 0);
  const top5Exposure = top5.reduce((acc, s) => acc + (s.exposure || 0), 0);

  const top10 = sorted.slice(0, 10);
  const top10Weight = top10.reduce((acc, s) => acc + (s.allocation || 0), 0);
  const top10Exposure = top10.reduce((acc, s) => acc + (s.exposure || 0), 0);

  // Risk Badge for Top 5
  let riskBadge = { label: 'Balanced', colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  if (top5Weight > 45) {
    riskBadge = { label: 'High Risk', colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
  } else if (top5Weight >= 30) {
    riskBadge = { label: 'Moderate', colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
  }

  // 3. Overlap (Held both directly and via funds)
  const overlapStocks = stocksData.filter((s) => (s.directValue || 0) > 0 && (s.indirectValue || 0) > 0);
  const overlapCount = overlapStocks.length;
  const overlapExposure = overlapStocks.reduce((acc, s) => acc + (s.exposure || 0), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {/* Card 1: Total Equity Exposure */}
      <div
        className="p-3 sm:p-4 rounded-2xl transition-all duration-200"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.05))',
        }}
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Total Equity
          </span>
          <span className="p-1 rounded-lg bg-blue-500/10 text-blue-500">
            <TrendingUp size={13} />
          </span>
        </div>
        <div className="text-base sm:text-xl font-extrabold truncate" style={{ color: 'var(--text)' }}>
          {isPrivacyMode ? '₹••••••' : formatAmt(totalExposure)}
        </div>
        <p className="text-[10px] sm:text-xs text-[var(--text-2)] font-medium mt-0.5 truncate">
          {totalCount} Unique Constituents
        </p>
      </div>

      {/* Card 2: Top 5 Concentration */}
      <div
        className="p-3 sm:p-4 rounded-2xl transition-all duration-200"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.05))',
        }}
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Top 5 Holdings
          </span>
          <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${riskBadge.colorClass}`}>
            {riskBadge.label}
          </span>
        </div>
        <div className="text-base sm:text-xl font-extrabold truncate text-amber-500">
          {top5Weight.toFixed(1)}%
        </div>
        <p className="text-[10px] sm:text-xs text-[var(--text-2)] font-medium mt-0.5 truncate">
          {isPrivacyMode ? '₹••••' : formatAmt(top5Exposure)} of wealth
        </p>
      </div>

      {/* Card 3: Top 10 Concentration */}
      <div
        className="p-3 sm:p-4 rounded-2xl transition-all duration-200"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.05))',
        }}
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Top 10 Weight
          </span>
          <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Layers size={13} />
          </span>
        </div>
        <div className="text-base sm:text-xl font-extrabold truncate text-indigo-500 dark:text-indigo-400">
          {top10Weight.toFixed(1)}%
        </div>
        <p className="text-[10px] sm:text-xs text-[var(--text-2)] font-medium mt-0.5 truncate">
          {isPrivacyMode ? '₹••••' : formatAmt(top10Exposure)} across 10 stocks
        </p>
      </div>

      {/* Card 4: Overlap (Direct + Funds) */}
      <div
        className="p-3 sm:p-4 rounded-2xl transition-all duration-200"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.05))',
        }}
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Direct + MF Overlap
          </span>
          <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Repeat size={13} />
          </span>
        </div>
        <div className="text-base sm:text-xl font-extrabold truncate text-emerald-600 dark:text-emerald-400">
          {overlapCount} Companies
        </div>
        <p className="text-[10px] sm:text-xs text-[var(--text-2)] font-medium mt-0.5 truncate">
          {isPrivacyMode ? '₹••••' : formatAmt(overlapExposure)} dual exposure
        </p>
      </div>
    </div>
  );
});

export default AnalyticsKpiRibbon;
