import Badge from '../ui/Badge';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePrivacy } from '../../context/PrivacyContext';

/**
 * VIEW_MODES — the three display states driven by the <> toggle.
 *   'currentInvested'  → Current value + (Invested value)
 *   'returns'          → P&L in ₹ (signed) + (Return %)
 *   'marketPrice1D'    → Current price per share + P&L % (proxy for 1D since API has no dailyChange)
 */
export const VIEW_MODES = ['currentInvested', 'returns', 'marketPrice1D'];
export const VIEW_MODE_LABELS = {
  currentInvested: 'Current (invested)',
  returns: 'Returns (%)',
  marketPrice1D: 'Market price (1D %)',
};

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
 * @param {'full'|'compact'|'list'} [variant='full']
 * @param {() => void}              [onPress]   — callback; renders card as <button> when provided
 * @param {'currentInvested'|'returns'|'marketPrice1D'} [viewMode='currentInvested']
 */
export default function HoldingCard({ holding, variant = 'full', onPress, viewMode = 'currentInvested' }) {
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
    dayChange,
    dayChangePercent,
  } = holding;

  const { isPrivacyMode } = usePrivacy();

  // Calculate absolute return value
  const returnValue = holding.returnValue !== undefined
    ? holding.returnValue
    : (currentValue && investedValue ? currentValue - investedValue : 0);

  const isProfit = returnValue >= 0;
  const returnColor = isProfit ? 'var(--profit)' : 'var(--loss)';

  // aria-label for screen readers (Requirement 12.4)
  const ariaLabel = `${name}, current value ${formatCurrency(currentValue)}, return ${formatPercent(returnPct)}`;

  // Glassmorphism/Card styles updated to use CSS theme variables
  const glassStyle = {
    background: 'var(--card-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--card-border)',
    boxShadow: 'var(--card-shadow)',
  };

  // Shared interactive props when onPress is provided
  const interactiveProps = onPress
    ? {
      role: 'button',
      tabIndex: 0,
      onClick: onPress,
      style: { ...glassStyle, cursor: 'pointer' },
    }
    : { style: glassStyle };

  /* ─── LIST VARIANT (Zerodha-style row) ──────────────────────────────── */
  if (variant === 'list') {
    const Tag = onPress ? 'button' : 'article';
    const listRowStyle = {
      background: 'transparent',
      borderBottom: '1px solid var(--divider)',
      cursor: onPress ? 'pointer' : 'default',
    };
    const tagProps = Tag === 'button'
      ? { type: 'button', onClick: onPress, style: listRowStyle }
      : { style: listRowStyle };

    // Right-side content changes with viewMode
    let topLine, bottomLine, topColor, bottomColor;

    if (viewMode === 'returns') {
      const sign = returnValue > 0 ? '+' : '';
      topLine = isPrivacyMode ? '₹***' : `${sign}${formatCurrency(returnValue)}`;
      bottomLine = isPrivacyMode ? '(***%)' : `(${returnValue > 0 ? '+' : ''}${(returnPct ?? 0).toFixed(2)}%)`;
      topColor = returnColor;
      bottomColor = returnColor;
    } else if (viewMode === 'marketPrice1D') {
      if (dayChange !== undefined && dayChangePercent !== undefined) {
        const dChange = Number(dayChange);
        const dChangePct = Number(dayChangePercent);
        const isDayProfit = dChange >= 0;
        const dSign = isDayProfit ? '+' : '-';
        topLine = isPrivacyMode ? '₹***' : formatCurrency(currentPrice ?? (quantity > 0 ? currentValue / quantity : 0));
        bottomLine = isPrivacyMode
          ? '(***%)'
          : `${dSign}${Math.abs(dChange).toFixed(2)} (${Math.abs(dChangePct).toFixed(2)}%)`;
        topColor = 'var(--text)';
        bottomColor = isDayProfit ? 'var(--profit)' : 'var(--loss)';
      } else {
        // Fallback: show current price + overall P&L% as best proxy
        const pnlPct = returnPct ?? 0;
        const pnlSign = pnlPct >= 0 ? '+' : '';
        topLine = isPrivacyMode ? '₹***' : formatCurrency(currentPrice ?? (quantity > 0 ? currentValue / quantity : 0));
        bottomLine = isPrivacyMode ? '(***%)' : `${pnlSign}${pnlPct.toFixed(2)}%`;
        topColor = 'var(--text)';
        bottomColor = pnlPct >= 0 ? 'var(--profit)' : 'var(--loss)';
      }
    } else {
      // currentInvested (default) — current value colored green/red by P&L
      topLine = isPrivacyMode ? '₹***' : formatCurrency(currentValue);
      bottomLine = isPrivacyMode ? '(₹***)' : `(${formatCurrency(investedValue)})`;
      topColor = returnColor;   // green if profit, red if loss
      bottomColor = 'var(--text-muted)';
    }

    return (
      <Tag
        {...tagProps}
        className="w-full flex items-center justify-between gap-3 px-0 py-3 text-left"
        aria-label={ariaLabel}
      >
        {/* Left: name + qty */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-sm font-semibold leading-tight truncate text-[var(--text)]">
            {isPrivacyMode ? 'Confidential Asset' : name}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isPrivacyMode ? '*** shares' : `${quantity} ${quantity === 1 ? 'share' : 'shares'}`}
          </span>
        </div>

        {/* Right: two-line value block */}
        <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
          <span className="text-sm font-bold" style={{ color: topColor }}>
            {topLine}
          </span>
          <span className="text-xs font-medium" style={{ color: bottomColor }}>
            {bottomLine}
          </span>
        </div>
      </Tag>
    );
  }

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
        <span className="flex-1 text-sm font-semibold truncate text-[var(--text)]">
          {isPrivacyMode ? 'Confidential Asset' : name}
        </span>

        {/* Current value + return % */}
        <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
          <span className="text-sm font-bold text-[var(--text)]">
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
          <span className="text-sm font-bold leading-tight truncate text-[var(--text)]">
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
              color: CONFIDENCE_COLOR[confidenceLevel] ?? 'var(--text-2)',
              background: 'var(--divider)',
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
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Qty
          </span>
          <span className="text-sm font-semibold text-[var(--text)]">
            {isPrivacyMode ? '***' : quantity}
          </span>
        </div>

        {/* Portfolio weight */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Weight
          </span>
          <span className="text-sm font-semibold text-[var(--text)]">
            {portfolioWeight?.toFixed(2)}%
          </span>
        </div>

        {/* Invested value */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Invested
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
            {isPrivacyMode ? '₹***' : formatCurrency(investedValue)}
          </span>
        </div>

        {/* Current value */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Current
          </span>
          <span className="text-sm font-bold text-[var(--text)]">
            {isPrivacyMode ? '₹***' : formatCurrency(currentValue)}
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        className="my-3"
        style={{ height: 1, background: 'var(--divider)' }}
      />

      {/* ── Return row ── */}
      <div className="flex items-center justify-between">
        {/* Return Amount */}
        <div className="flex flex-col gap-0.5">
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-muted)' }}
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
              style={{ color: 'var(--text-muted)' }}
            >
              Current Price
            </span>
            <span className="text-sm font-bold text-[var(--text)]">
              {isPrivacyMode ? '₹***' : formatCurrency(currentPrice)}
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
