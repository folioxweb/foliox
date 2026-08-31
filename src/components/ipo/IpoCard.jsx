import { memo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, ChevronRight, ExternalLink } from 'lucide-react';

/**
 * Flame Rating component displaying 1-5 flames
 */
export function FlameRating({ rating = 0 }) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  if (safeRating === 0) return null;

  return (
    <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
      {Array.from({ length: 5 }).map((_, i) => (
        <Flame
          key={i}
          size={12}
          className={
            i < safeRating
              ? 'text-amber-500 fill-amber-500'
              : 'text-slate-300 dark:text-slate-700'
          }
        />
      ))}
      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 ml-1">
        {safeRating}/5
      </span>
    </div>
  );
}

/**
 * Status badge with colors matching IPO stage
 */
export function StatusBadge({ status, statusBadge }) {
  const s = String(statusBadge || status || 'Upcoming').toLowerCase();

  let bgClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  let dotClass = 'bg-slate-400';

  if (s.includes('open') || s === 'o') {
    bgClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    dotClass = 'bg-emerald-500 animate-pulse';
  } else if (s.includes('allot') || s.includes('closed') || s === 'c') {
    bgClass = 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
    dotClass = 'bg-purple-500';
  } else if (s.includes('listed') || s.includes('l@')) {
    bgClass = 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
    dotClass = 'bg-blue-500';
  } else if (s.includes('upcom') || s === 'u') {
    bgClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    dotClass = 'bg-amber-500';
  }

  const label = statusBadge || status || 'Upcoming';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${bgClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
}

/**
 * Main IPO Card Component
 */
export const IpoCard = memo(function IpoCard({ ipo, onClick }) {
  if (!ipo) return null;

  const isPositiveGmp = ipo.gmpAmount > 0;
  const isNegativeGmp = ipo.gmpAmount < 0;
  const gmpColorClass = isPositiveGmp
    ? 'text-emerald-600 dark:text-emerald-400'
    : isNegativeGmp
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-[var(--text-2)]';

  const dateText = ipo.openDate && ipo.closeDate
    ? `${ipo.openDate} – ${ipo.closeDate}`
    : ipo.openDate || ipo.closeDate || 'Dates TBA';

  const subVal = ipo.subscription && ipo.subscription !== '-' && ipo.subscription !== '--'
    ? ipo.subscription
    : (ipo.subscriptionDetails?.total && ipo.subscriptionDetails.total !== '-' ? ipo.subscriptionDetails.total : 'N/A');

  // Extract category breakdown values for list card pills
  const subDetails = ipo.subscriptionDetails || ipo.subscription_details || ipo.raw_json?.subscription_details || null;
  const rawObj = ipo.raw_json || {};
  const qibSub = subDetails?.qib || rawObj.QIB;
  const niiSub = subDetails?.nii || rawObj.NII;
  const riiSub = subDetails?.rii || rawObj.RII;

  const hasPills = Boolean(
    (qibSub && qibSub !== '-' && qibSub !== '--') ||
    (niiSub && niiSub !== '-' && niiSub !== '--') ||
    (riiSub && riiSub !== '-' && riiSub !== '--')
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md relative overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.05))',
      }}
    >
      {/* Header: Name, Category, Status & Flames */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className="text-base font-bold tracking-tight truncate max-w-[220px] sm:max-w-md"
              style={{ color: 'var(--text)' }}
            >
              {ipo.name}
            </h3>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text-2)',
                border: '1px solid var(--divider)',
              }}
            >
              {ipo.category || 'IPO'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-2)] flex-wrap">
            {ipo.ipoSize && ipo.ipoSize !== 'N/A' && (
              <span>Size: <strong className="font-semibold text-[var(--text)]">{ipo.ipoSize}</strong></span>
            )}
            {ipo.lotSize && (
              <span>• Lot: <strong className="font-semibold text-[var(--text)]">{ipo.lotSize} sh @ ₹{ipo.priceStr}</strong></span>
            )}
            {ipo.anchorAvailable && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">• Anchor</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={ipo.status} statusBadge={ipo.statusBadge} />
          <FlameRating rating={ipo.ratingFlames} />
        </div>
      </div>

      {/* Metrics Row: 3 Columns (GMP, Subscription, Est. Profit) */}
      <div
        className="grid grid-cols-3 gap-2 p-2.5 rounded-xl mb-2.5"
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--divider)',
        }}
      >
        {/* Column 1: GMP Details (Percentage First) */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] block mb-0.5">
            GMP %
          </span>
          <span className={`text-sm sm:text-base font-extrabold block truncate ${gmpColorClass}`}>
            {isPositiveGmp ? '+' : ''}{Number(ipo.gmpPercent || 0).toFixed(2)}%
          </span>
          <span className={`text-[10px] font-bold block truncate ${gmpColorClass}`}>
            {isPositiveGmp ? '+' : ''}₹{Number(ipo.gmpAmount || 0)} premium
          </span>
        </div>

        {/* Column 2: Subscription (Highlighted Metric) */}
        <div className="border-l border-[var(--divider)] pl-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] block mb-0.5">
            Subscription
          </span>
          <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400 block truncate">
            {subVal}
          </span>
          <span className="text-[10px] text-[var(--text-2)] font-semibold block truncate">
            {subVal !== 'N/A' ? 'Times Subbed' : 'Bidding'}
          </span>
        </div>

        {/* Column 3: Est. Profit per Lot */}
        <div className="border-l border-[var(--divider)] pl-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] block mb-0.5">
            Est. Profit
          </span>
          <span className={`text-sm sm:text-base font-extrabold block truncate ${gmpColorClass}`}>
            {(ipo.expectedProfit || 0) > 0 ? '+' : ''}₹{Number(ipo.expectedProfit || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-[var(--text-2)] font-semibold block truncate">
            per 1 Lot
          </span>
        </div>
      </div>

      {/* Detailed Category Subscription Pills with Prominently Highlighted Retail */}
      {hasPills && (
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] mb-2.5 px-0.5">
          <span className="text-[var(--text-2)] font-medium">Bidding:</span>
          {qibSub && qibSub !== '-' && qibSub !== '--' && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
              QIB: {String(qibSub).includes('x') ? qibSub : `${qibSub}x`}
            </span>
          )}
          {niiSub && niiSub !== '-' && niiSub !== '--' && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
              NII: {String(niiSub).includes('x') ? niiSub : `${niiSub}x`}
            </span>
          )}
          {riiSub && riiSub !== '-' && riiSub !== '--' && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-500/40 shadow-xs">
              Retail: {String(riiSub).includes('x') ? riiSub : `${riiSub}x`}
            </span>
          )}
        </div>
      )}

      {/* Footer Info: Bidding Dates & Action Arrow */}
      <div className="flex items-center justify-between text-xs text-[var(--text-2)] pt-0.5">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{dateText}</span>
        </div>

        <div className="flex items-center gap-2">
          {ipo.allotmentUrl && (
            <a
              href={ipo.allotmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95 shrink-0"
            >
              <span>Check Allotment</span>
              <ExternalLink size={11} />
            </a>
          )}
          <div className="flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400">
            <span>Details</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default IpoCard;
