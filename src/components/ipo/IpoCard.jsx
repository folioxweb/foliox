import { motion } from 'framer-motion';
import { Flame, Calendar, ChevronRight, CheckCircle2, ExternalLink } from 'lucide-react';

export function FlameRating({ rating }) {
  const count = Math.min(Math.max(Number(rating) || 0, 0), 5);
  return (
    <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full" title={`${count}/5 Flame Rating`}>
      <span className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Flame
            key={i}
            size={11}
            className={i < count ? 'text-amber-500 fill-amber-500' : 'text-slate-400/40 dark:text-slate-600'}
          />
        ))}
      </span>
      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 ml-0.5">
        {count > 0 ? `${count}/5` : 'N/A'}
      </span>
    </div>
  );
}

export function StatusBadge({ status, statusBadge }) {
  const s = String(status || '').toLowerCase();
  const badgeLower = String(statusBadge || '').toLowerCase();

  if (badgeLower === 'allotted') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
        Allotted
      </span>
    );
  }
  
  if (s === 'open') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
        Open
      </span>
    );
  }

  if (s === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
        Upcoming
      </span>
    );
  }

  if (s === 'closed') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30">
        Closed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 truncate max-w-[140px]">
      {statusBadge || 'Listed'}
    </span>
  );
}

export default function IpoCard({ ipo, onClick }) {
  const isPositiveGmp = ipo.gmpAmount > 0;
  const isNegativeGmp = ipo.gmpAmount < 0;

  const gmpColorClass = isPositiveGmp
    ? 'text-emerald-600 dark:text-emerald-400'
    : isNegativeGmp
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-[var(--text-2)]';

  const dateText = ipo.openDate
    ? ipo.closeDate && ipo.closeDate !== ipo.openDate
      ? `${ipo.openDate} – ${ipo.closeDate}`
      : ipo.openDate
    : 'Dates TBA';

  const subVal = ipo.subscription && ipo.subscription !== '-' ? ipo.subscription : 'N/A';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative cursor-pointer overflow-hidden rounded-2xl p-4 transition-all duration-200"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
      }}
    >
      {/* Top Header: Company Name & Badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-bold tracking-tight truncate" style={{ color: 'var(--text)' }}>
              {ipo.name}
            </h3>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text-2)',
                border: '1px solid var(--divider)',
              }}
            >
              {ipo.category || 'IPO'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-2)] flex items-center gap-2 flex-wrap">
            <span>Size: <strong style={{ color: 'var(--text)' }}>{ipo.ipoSize || 'N/A'}</strong></span>
            <span className="text-[var(--divider)]">•</span>
            <span>Lot: <strong style={{ color: 'var(--text)' }}>{ipo.lotSize} sh @ ₹{ipo.priceStr}</strong></span>
            {ipo.anchorAvailable && (
              <>
                <span className="text-[var(--divider)]">•</span>
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                  <CheckCircle2 size={11} /> Anchor
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={ipo.status} statusBadge={ipo.statusBadge} />
          <FlameRating rating={ipo.ratingFlames} />
        </div>
      </div>

      {/* Main Highlights Grid: GMP, Subscription, Est. Profit */}
      <div
        className="grid grid-cols-3 gap-2 p-3 rounded-xl mb-3"
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
}
