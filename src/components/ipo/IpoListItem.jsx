import { memo } from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * IpoListItem — streamlined list row for IPO listing.
 * Displays strictly:
 * 1. Company Name
 * 2. GMP (% and ₹ amount)
 * 3. Subscription multiple
 */
export const IpoListItem = memo(function IpoListItem({ ipo, onClick, isLast = false }) {
  if (!ipo) return null;

  const isPositiveGmp = (ipo.gmpAmount || 0) > 0;
  const isNegativeGmp = (ipo.gmpAmount || 0) < 0;
  const gmpColorClass = isPositiveGmp
    ? 'text-emerald-600 dark:text-emerald-400'
    : isNegativeGmp
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-[var(--text-muted)]';

  // Format subscription value
  let subVal = 'N/A';
  const rawSub = ipo.subscription && ipo.subscription !== '-' && ipo.subscription !== '--'
    ? ipo.subscription
    : (ipo.subscriptionDetails?.total && ipo.subscriptionDetails.total !== '-' ? ipo.subscriptionDetails.total : null);

  if (rawSub) {
    const s = String(rawSub).trim();
    subVal = s.toLowerCase().endsWith('x') ? s : `${s}x`;
  }

  const gmpPct = Number(ipo.gmpPercent || 0).toFixed(2);
  const gmpAmt = Number(ipo.gmpAmount || 0);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="flex items-center justify-between py-3 px-3 sm:px-4 cursor-pointer transition-colors duration-150 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] dark:active:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--emerald)]"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--divider)',
      }}
    >
      {/* 1. Company Name */}
      <div className="flex-1 min-w-0 pr-3">
        <h4
          className="text-sm font-bold tracking-tight truncate"
          style={{ color: 'var(--text)' }}
          title={ipo.name}
        >
          {ipo.name}
        </h4>
        <span
          className="text-[10px] font-semibold text-[var(--text-muted)] block truncate"
        >
          {ipo.category || 'Mainboard'}
        </span>
      </div>

      {/* 2. GMP Column */}
      <div className="text-right w-24 sm:w-28 shrink-0 pr-3">
        <span className={`text-sm font-extrabold block truncate ${gmpColorClass}`}>
          {isPositiveGmp ? '+' : ''}{gmpPct}%
        </span>
        <span className={`text-[10px] font-bold block truncate ${gmpColorClass}`}>
          {isPositiveGmp ? '+' : ''}₹{gmpAmt}
        </span>
      </div>

      {/* 3. Subscription Column */}
      <div className="text-right w-20 sm:w-24 shrink-0 flex items-center justify-end gap-1">
        <div className="text-right">
          <span
            className={`text-xs sm:text-sm font-bold block truncate ${
              subVal !== 'N/A'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {subVal}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-medium block truncate">
            {subVal !== 'N/A' ? 'Subscribed' : 'Bidding'}
          </span>
        </div>
        <ChevronRight size={14} className="text-[var(--text-muted)] opacity-50 shrink-0 hidden sm:block ml-1" />
      </div>
    </div>
  );
});

export default IpoListItem;
