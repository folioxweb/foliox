import { memo, useMemo } from 'react';
import { PieChart, Filter, X, Check } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';

function formatAmt(val) {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export const CAP_CONFIG = [
  {
    id: 'Large Cap',
    label: 'Large Cap',
    sublabel: 'Top 100 (Nifty 100)',
    color: '#6366F1',
    bgLight: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500',
    textClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'Mid Cap',
    label: 'Mid Cap',
    sublabel: '101–250 (Midcap 150)',
    color: '#06B6D4',
    bgLight: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500',
    textClass: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'Small Cap',
    label: 'Small Cap',
    sublabel: '251+ (Smallcap 250+)',
    color: '#F59E0B',
    bgLight: 'bg-amber-500/10',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
];

export const MarketCapDistribution = memo(function MarketCapDistribution({
  stocksData = [],
  selectedCap = null,
  onSelectCap,
}) {
  const { isPrivacyMode } = usePrivacy();

  const { large, mid, small, total } = useMemo(() => {
    let largeExp = 0;
    let midExp = 0;
    let smallExp = 0;

    (stocksData || []).forEach((s) => {
      const exp = s.exposure || 0;
      const cap = String(s.marketCap || '').toLowerCase();
      if (cap.includes('large')) {
        largeExp += exp;
      } else if (cap.includes('mid')) {
        midExp += exp;
      } else {
        smallExp += exp;
      }
    });

    const tot = largeExp + midExp + smallExp || 1;

    return {
      large: { exposure: largeExp, pct: (largeExp / tot) * 100 },
      mid: { exposure: midExp, pct: (midExp / tot) * 100 },
      small: { exposure: smallExp, pct: (smallExp / tot) * 100 },
      total: tot,
    };
  }, [stocksData]);

  if (!stocksData || stocksData.length === 0) return null;

  const capsWithData = [
    { ...CAP_CONFIG[0], ...large },
    { ...CAP_CONFIG[1], ...mid },
    { ...CAP_CONFIG[2], ...small },
  ];

  const handleToggleCap = (capId) => {
    if (!onSelectCap) return;
    if (selectedCap === capId) {
      onSelectCap(null);
    } else {
      onSelectCap(capId);
    }
  };

  return (
    <div
      className="p-3.5 sm:p-4 rounded-2xl transition-all duration-200"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.05))',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Market Cap Breakdown
          </span>
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline font-medium">
            (SEBI Distribution)
          </span>
        </div>

        {selectedCap && (
          <button
            type="button"
            aria-label={`Clear ${selectedCap} filter`}
            onClick={() => onSelectCap?.(null)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
          >
            <Filter size={11} />
            <span>{selectedCap}</span>
            <X size={12} className="ml-0.5" />
          </button>
        )}
      </div>

      {/* Tri-Color Segmented Horizontal Progress Gauge Bar */}
      <div
        className="w-full h-3 sm:h-3.5 rounded-full overflow-hidden flex gap-1 p-0.5 mb-3"
        style={{ background: 'var(--input-bg)' }}
      >
        {capsWithData.map((cap) => {
          const isSelected = selectedCap === cap.id;
          const isDimmed = selectedCap && !isSelected;
          const widthPct = Math.max(cap.pct > 0 ? cap.pct : 0, 1.5);

          return (
            <div
              key={`bar-${cap.id}`}
              role="button"
              tabIndex={0}
              aria-label={`Bar segment ${cap.label}`}
              title={`${cap.label}: ${cap.pct.toFixed(1)}%`}
              onClick={() => handleToggleCap(cap.id)}
              className="h-full rounded-full cursor-pointer transition-all duration-300 hover:brightness-110"
              style={{
                width: `${widthPct}%`,
                background: cap.color,
                opacity: isDimmed ? 0.35 : 1,
                boxShadow: isSelected ? `0 0 8px ${cap.color}90` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Three Cap Metric Cards below Bar */}
      <div className="grid grid-cols-3 gap-2">
        {capsWithData.map((cap) => {
          const isSelected = selectedCap === cap.id;
          const isDimmed = selectedCap && !isSelected;

          return (
            <div
              key={`card-${cap.id}`}
              role="button"
              aria-label={`Filter by ${cap.label}`}
              tabIndex={0}
              onClick={() => handleToggleCap(cap.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleCap(cap.id);
                }
              }}
              className={`p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? `ring-1.5 ${cap.borderClass} ${cap.bgLight}`
                  : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
              }`}
              style={{
                border: '1px solid var(--divider)',
                opacity: isDimmed ? 0.45 : 1,
              }}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: cap.color }}
                  />
                  <span className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                    {cap.label}
                  </span>
                </div>
                {isSelected && (
                  <Check size={12} className={cap.textClass} strokeWidth={2.5} />
                )}
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xs sm:text-sm font-extrabold" style={{ color: cap.color }}>
                  {cap.pct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium truncate">
                  {isPrivacyMode ? '₹••••' : formatAmt(cap.exposure)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default MarketCapDistribution;
