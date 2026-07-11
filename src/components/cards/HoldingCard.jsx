import Badge from '../ui/Badge';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePrivacy } from '../../context/PrivacyContext';

/**
 * Maps a sector/category string to a Badge color variant.
 * Stocks tend toward blue/indigo, sectors vary, ETFs are amber, MFs are cyan.
 */
const SECTOR_COLOR_MAP = {
  "Financial Services": "#3B82F6",                 // Blue
  "Technology": "#6366F1",                         // Indigo
  "Energy": "#F59E0B",                             // Amber
  "Consumer Cyclical": "#F97316",                  // Orange
  "Healthcare": "#EF4444",                         // Red
  "Housing Finance": "#06B6D4",                    // Cyan
  "Communication Services": "#0EA5E9",             // Sky
  "Utilities": "#14B8A6",                          // Teal
  "Real Estate": "#84CC16",                        // Lime
  "Consumer Defensive": "#22C55E",                 // Green
  "Industrials": "#EAB308",                        // Yellow
  "Renewable Energy": "#10B981",                   // Green Emerald
  "Digital Advertising & Technology": "#8B5CF6",  // Violet
  "Basic Materials": "#78716C",                    // Stone
  "Alcoholic Beverages": "#EC4899",                // Pink
  "Travel & Visa Services": "#A855F7",             // Purple
  "Industrial Machinery": "#64748B",               // Slate
  "Oil, Gas & Consumable Fuels": "#B45309",        // Dark Amber
  "Automobile and Auto Components": "#0891B2",     // Dark Cyan
  "Power Financing": "#1D4ED8",                    // Royal Blue
  "Capital Goods": "#CA8A04",                      // Golden Yellow
  "Fast Moving Consumer Goods": "#65A30D",         // Olive Green
  "Construction": "#D97706",                       // Construction Orange
  "Telecommunication": "#0284C7",                  // Deep Sky
  "Metals & Mining": "#71717A",                    // Zinc
  "Consumer Services": "#9333EA",                  // Purple
  "Consumer Durables": "#2563EB",                  // Blue
  "Power": "#0F766E",                              // Dark Teal
  "Services": "#DB2777",                           // Deep Pink
  "Chemicals": "#7C3AED",                          // Purple Violet
  "Construction Materials": "#A16207",             // Brown Gold
  "Realty": "#65A30D",                             // Lime Green
  "Media, Entertainment & Publication": "#C026D3",// Fuchsia
  "Textiles": "#E11D48",                           // Rose
  "Diversified": "#6B7280",                        // Gray

  "ETF": "#FACC15",                               // Bright Yellow
  "Mutual Fund": "#06B6D4",                        // Cyan
  "Debt": "#475569",                              // Slate
  "Hybrid": "#7C3AED"                             // Violet
};

function getSectorColor(sector) {
  return SECTOR_COLOR_MAP[sector] ?? 'gray';
}

/**
 * Maps confidence level to a display color.
 */
const CONFIDENCE_COLOR = {
  High: '#22C55E',
  Medium: '#F59E0B',
  Low: '#EF4444',
};

/**
 * HoldingCard — glassmorphism card for a single portfolio holding.
 *
 * Variants:
 *   - "full"    — complete detail row (name, sector badge, quantity, invested,
 *                 current, return ₹/%, portfolio weight, confidence level).
 *                 Used in PortfolioPage holding lists.
 *   - "compact" — condensed row (name, current value, return %).
 *                 Used in Dashboard Top Holdings section.
 *
 * @param {{ id, name, sector, category, quantity, investedValue, currentValue,
 *            returnValue, returnPct, portfolioWeight, confidenceLevel?,
 *            avgPurchasePrice? }} holding
 * @param {'full'|'compact'} [variant='full']
 * @param {() => void}       [onPress]  — callback; renders card as <button> when provided
 */
export default function HoldingCard({ holding, variant = 'full', onPress }) {
  const {
    name,
    sector,
    category,
    quantity,
    invested,
    investedValue = invested,
    currentPrice,
    currentValue,
    pnl,
    returnPct = pnl,
    weightage,
    portfolioWeight = weightage,
    confidence,
    confidenceLevel = confidence,
  } = holding;

  const { isPrivacyMode } = usePrivacy();

  // Calculate absolute return value
  const returnValue = holding.returnValue !== undefined
    ? holding.returnValue
    : (currentValue && investedValue ? currentValue - investedValue : 0);

  const isProfit = returnValue >= 0;
  const returnColor = isProfit ? '#22C55E' : '#EF4444';

  // aria-label for screen readers (Requirement 12.4)
  const ariaLabel = `${name}, current value ${formatCurrency(currentValue)}, return ${formatPercent(returnPct)}`;

  // Glassmorphism shared styles (Requirement 2.4)
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.10)',
  };

  // Shared interactive props when onPress is provided
  // Native <button> elements already fire click on Enter/Space, so no custom
  // onKeyDown handler is needed — the browser handles keyboard activation.
  const interactiveProps = onPress
    ? {
      role: 'button',
      tabIndex: 0,
      onClick: onPress,
      style: { ...glassStyle, cursor: 'pointer' },
    }
    : { style: glassStyle };

  /* ─── COMPACT VARIANT ───────────────────────────────────────────────── */
  if (variant === 'compact') {
    const Tag = onPress ? 'button' : 'article';
    const tagProps =
      Tag === 'button'
        ? {
          type: 'button',
          onClick: onPress,
          style: { ...glassStyle, cursor: 'pointer' },
        }
        : { style: glassStyle };

    return (
      <Tag
        {...tagProps}
        className="w-full flex items-center justify-between gap-3 rounded-[24px] px-4 py-3 shadow-lg text-left"
        aria-label={ariaLabel}
      >
        {/* Name */}
        <span className="flex-1 text-sm font-semibold text-white truncate">
          {isPrivacyMode ? 'Confidential Asset' : name}
        </span>

        {/* Current value + return % */}
        <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
          <span className="text-sm font-bold text-white">
            {isPrivacyMode ? '₹***' : formatCurrency(currentValue)}
          </span>
          <span className="text-xs font-medium" style={{ color: returnColor }}>
            {formatPercent(returnPct)}
          </span>
        </div>
      </Tag>
    );
  }

  /* ─── FULL VARIANT ──────────────────────────────────────────────────── */
  const Tag = onPress ? 'button' : 'article';
  const tagProps =
    Tag === 'button'
      ? {
        type: 'button',
        onClick: onPress,
        style: { ...glassStyle, cursor: 'pointer' },
      }
      : { style: glassStyle };

  return (
    <Tag
      {...tagProps}
      className="w-full rounded-[24px] px-4 py-4 shadow-lg text-left"
      aria-label={ariaLabel}
    >
      {/* ── Header row: name + sector badge ── */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-bold text-white leading-tight truncate">
            {isPrivacyMode ? 'Confidential Asset' : name}
          </span>
          {(sector || category) && (
            <Badge
              label={sector || category}
              color={getSectorColor(sector || category)}
            />
          )}
        </div>

        {/* Confidence level — top right */}
        {confidenceLevel && (
          <span
            className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: CONFIDENCE_COLOR[confidenceLevel] ?? '#94A3B8',
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            {confidenceLevel}
          </span>
        )}
      </div>

      {/* ── Metrics grid ── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">

        {/* Quantity */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#64748B' }}>
            Qty
          </span>
          <span className="text-sm font-semibold text-white">
            {isPrivacyMode ? '***' : quantity}
          </span>
        </div>

        {/* Portfolio weight */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#64748B' }}>
            Weight
          </span>
          <span className="text-sm font-semibold text-white">
            {portfolioWeight?.toFixed(2)}%
          </span>
        </div>

        {/* Invested value */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#64748B' }}>
            Invested
          </span>
          <span className="text-sm font-semibold" style={{ color: '#94A3B8' }}>
            {isPrivacyMode ? '₹***' : formatCurrency(investedValue)}
          </span>
        </div>

        {/* Current value */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#64748B' }}>
            Current
          </span>
          <span className="text-sm font-bold text-white">
            {isPrivacyMode ? '₹***' : formatCurrency(currentValue)}
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        className="my-3"
        style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}
      />

      {/* ── Return row ── */}
<div className="flex items-center justify-between">

  {/* Return Amount */}
  <div className="flex flex-col gap-0.5">
    <span
      className="text-xs font-medium uppercase tracking-wide"
      style={{ color: '#64748B' }}
    >
      Return
    </span>

    <span
      className="text-sm font-bold"
      style={{ color: returnColor }}
    >
      {isProfit && returnValue !== 0 ? '+' : ''}
      {isPrivacyMode ? '₹***' : formatCurrency(returnValue)}
    </span>
  </div>


  {/* Current Price */}
  {currentPrice && (
    <div className="flex flex-col gap-0.5 text-center">
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: '#64748B' }}
      >
        Current Price
      </span>

      <span className="text-sm font-bold text-white">
        {isPrivacyMode
          ? '₹***'
          : formatCurrency(currentPrice)}
      </span>
    </div>
  )}


  {/* Return Percentage */}
  <span
    className="text-base font-bold px-2.5 py-1 rounded-full"
    style={{
      color: returnColor,
      background: isProfit
        ? 'rgba(34, 197, 94, 0.12)'
        : 'rgba(239, 68, 68, 0.12)',
    }}
  >
    {formatPercent(returnPct)}
  </span>

</div>
    </Tag>
  );
}
