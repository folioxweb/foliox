import { motion } from 'framer-motion';
import { ChevronDownIcon, FileText } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePrivacy } from '../../context/PrivacyContext';
import { renderStockBadge } from '../../components/cards/HoldingCard';
import { useState } from 'react';
import HoldingActionModal from '../../components/portfolio/HoldingActionModal';
import FDActionModal from '../../components/portfolio/FDActionModal';
import CompanyReportsScreen from '../News/CompanyReportsScreen';
/**
 * Maps a sector/category string to a Badge color variant.
 * Mirrors the mapping used in HoldingCard for visual consistency.
 */
const SECTOR_COLOR_MAP = {
  "Financial Services": "#3B82F6",
  "Technology": "#6366F1",
  "Energy": "#F59E0B",
  "Consumer Cyclical": "#F97316",
  "Healthcare": "#EF4444",
  "Housing Finance": "#06B6D4",
  "Communication Services": "#0EA5E9",
  "Utilities": "#14B8A6",
  "Real Estate": "#84CC16",
  "Consumer Defensive": "#22C55E",
  "Industrials": "#EAB308",
  "Renewable Energy": "#10B981",
  "Digital Advertising & Technology": "#8B5CF6",
  "Basic Materials": "#78716C",
  "Alcoholic Beverages": "#EC4899",
  "Travel & Visa Services": "#A855F7",
  "Industrial Machinery": "#64748B",
  "Oil, Gas & Consumable Fuels": "#B45309",
  "Automobile and Auto Components": "#0891B2",
  "Power Financing": "#1D4ED8",
  "Capital Goods": "#CA8A04",
  "Fast Moving Consumer Goods": "#65A30D",
  "Construction": "#D97706",
  "Telecommunication": "#0284C7",
  "Metals & Mining": "#71717A",
  "Consumer Services": "#9333EA",
  "Consumer Durables": "#2563EB",
  "Power": "#0F766E",
  "Services": "#DB2777",
  "Chemicals": "#7C3AED",
  "Construction Materials": "#A16207",
  "Realty": "#65A30D",
  "Media, Entertainment & Publication": "#C026D3",
  "Textiles": "#E11D48",
  "Diversified": "#6B7280",
  "ETF": "#FACC15",
  "Mutual Fund": "#06B6D4",
  "Debt": "#475569",
  "Hybrid": "#7C3AED"
};

function getSectorColor(sector) {
  return SECTOR_COLOR_MAP[sector] ?? '#64748B';
}

/**
 * Maps confidence level to a Badge color and display color.
 */
const CONFIDENCE_BADGE_COLOR = {
  High: '#10B981',
  Medium: '#F59E0B',
  Low: '#EF4444',
};

/**
 * Swipe threshold in pixels — if the user drags downward more than this,
 * the modal closes. The reverse animation plays independently (handled by
 * Modal / AnimatePresence) regardless of whether onClose ultimately succeeds.
 */
const SWIPE_CLOSE_THRESHOLD = 100;

/**
 * FundamentalsRow — Groww-style row with two label→value pairs side-by-side.
 * Matches the compact fundamentals table in stock-detail screens.
 */
function FundamentalsRow({ left, right }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{ borderTop: '1px solid var(--divider)', paddingTop: 5, paddingBottom: 5 }}
    >
      {/* Left pair: label on far-left, value pushed to center */}
      <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
        <dt
          className="text-[11px] font-medium shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          {left.label}
        </dt>
        <dd
          className="text-[13px] font-semibold text-right truncate"
          style={{ color: 'var(--text)', ...left.style }}
        >
          {left.value ?? '—'}
        </dd>
      </div>

      {/* Vertical divider between the two pairs */}
      {right && (
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--divider)', flexShrink: 0, margin: '0 2px' }} />
      )}

      {/* Right pair: label on left of right half, value on far-right */}
      {right && (
        <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
          <dt
            className="text-[11px] font-medium shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            {right.label}
          </dt>
          <dd
            className="text-[13px] font-semibold text-right truncate"
            style={{ color: 'var(--text)', ...right.style }}
          >
            {right.value ?? '—'}
          </dd>
        </div>
      )}
    </div>
  );
}

/**
 * DetailScreen — modal overlay for a single holding's full details.
 *
 * Uses the `<Modal>` slide-up component as the backdrop and container.
 * Dismissible via:
 *   - the close / chevron-down button in the header (Req 5.3)
 *   - backdrop click or Escape key (handled by Modal internally) (Req 5.3)
 *   - programmatic `onClose` call (Req 5.3)
 *   - downward swipe gesture powered by Framer Motion `drag` (Req 5.3)
 *
 * The reverse animation (slide-down exit) is handled by AnimatePresence
 * inside `<Modal>` and plays independently of whether dismissal succeeds.
 *
 * Accessible from both PortfolioPage HoldingCard and DashboardPage TopHoldings
 * (Req 5.4).
 *
 * Props:
 *   holding  — full Holding object (id, name, sector, category, quantity,
 *              investedValue, currentValue, returnValue, returnPct,
 *              portfolioWeight, confidenceLevel?, avgPurchasePrice?)
 *   isOpen   — boolean controlling visibility
 *   onClose  — function called to close the screen
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export default function DetailScreen({ holding, isOpen, onClose }) {
  // ── Swipe-to-dismiss via Framer Motion drag (Req 5.3) ────────────────────
  // drag="y"               — constrain dragging to vertical axis
  // dragConstraints top=0  — prevent dragging upward
  // onDragEnd              — check velocity/offset; close if threshold exceeded
  function handleDragEnd(_event, info) {
    // info.offset.y  — total displacement in px (positive = downward)
    // info.velocity.y — velocity in px/s (positive = downward)
    if (info.offset.y > SWIPE_CLOSE_THRESHOLD || info.velocity.y > 400) {
      onClose?.();
    }
  }

  // Guard: render empty shell so AnimatePresence can still animate out
  if (!holding) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="px-4 pb-10 pt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          No holding selected.
        </div>
      </Modal>
    );
  }

  const {
    name,
    sector,
    category,
    quantity,
    invested,
    investedValue = invested,
    currentValue,
    pnl,
    returnPct = pnl,
    weightage,
    portfolioWeight = weightage,
    confidence,
    confidenceLevel = confidence,
    buyPrice,
    avgPurchasePrice = buyPrice,
    badge,
    // currentNAV is how MFs expose today's price; fall back to currentPrice for stocks/ETFs
    currentNAV,
    currentPrice: rawCurrentPrice,
  } = holding;

  // Unified "today's price" — currentNAV for MFs, currentPrice for stocks/ETFs
  // Fall back to (currentValue / quantity) if currentPrice or currentNAV is missing
  const derivedPrice = (currentValue && quantity && quantity > 0) ? (currentValue / quantity) : undefined;
  const currentPrice = currentNAV ?? rawCurrentPrice ?? derivedPrice;
  const isFD = holding.assetType === "fds";

  const { isPrivacyMode } = usePrivacy();
  const [showHoldingAction, setShowHoldingAction] = useState(false);
  const [showReports, setShowReports] = useState(false);

   const returnValue = isFD
   ? holding.interestEarned
   : (
       holding.returnValue !== undefined
         ? holding.returnValue
         : (currentValue && investedValue
            ? currentValue - investedValue
            : 0)
     );

  const isProfit = returnValue >= 0;
  const pnlColor = isProfit ? 'var(--profit)' : 'var(--loss)';
  const pnlBg = isProfit ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const labelStr = sector || category || '';
  const badgeColor = getSectorColor(labelStr);
  const confidenceBadgeColor = CONFIDENCE_BADGE_COLOR[confidenceLevel] ?? 'gray';

  // Comprehensive aria-label summarising the screen for screen-readers
  const ariaLabel = `${name} details. Current value ${formatCurrency(currentValue)}, return ${formatPercent(returnPct)}.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} transparent={true}>
      {/*
       * ── Draggable wrapper ────────────────────────────────────────────────
       * drag="y" restricts to vertical axis.
       * dragConstraints={{ top: 0 }} prevents upward drag.
       * dragElastic={0.2} gives a slight rubber-band feel when hitting top.
       * onDragEnd checks displacement/velocity and fires onClose if threshold
       * is exceeded. The exit animation is driven by AnimatePresence inside
       * <Modal> and plays independently of the drag outcome (Req 5.3).
       */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0.2, bottom: 0 }}
        onDragEnd={handleDragEnd}
        aria-label={ariaLabel}
        role="region"
        className="cursor-grab active:cursor-grabbing bg-[var(--sheet-bg)] border-t border-[var(--card-border)] rounded-t-3xl shadow-2xl"
        style={{ touchAction: 'pan-x' }}
      >
        {/* ── Drag handle indicator inside the draggable card ── */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-[var(--divider)]" />
        </div>
        {/* ── Header (Req 5.1) ─────────────────────────────────────────── */}
        <header
          className="px-4 pt-2 pb-4"
          style={{
            /* Glassmorphism header matches design system (Req 2.4) */
            background: 'var(--header-bg)',
          }}
        >
          {/* Close button + sector badge row */}
          <div className="flex items-center justify-between mb-4">
            {/*
             * Back / close button — ChevronDown icon (Req 5.3).
             * aria-label required for accessibility (Req 12.1).
             */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center rounded-full p-2 focus-visible:ring-2 focus-visible:ring-[var(--emerald)] focus-visible:outline-none
              "
              style={{
                background: 'var(--sheet-btn-bg)',
                color: 'var(--text-muted)',
              }}
              aria-label="Close detail screen"
            >
              <ChevronDownIcon size={20} aria-hidden="true" />
            </button>

            {/* Sector / category badge */}
             <Badge
  label={isFD ? "Fixed Deposit" : labelStr}
  color={isFD ? "teal" : badgeColor}
 />
          </div>

          {/* Company / fund name — large (Req 5.1) */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-2xl font-bold leading-tight text-[var(--text)]">
              {isPrivacyMode ? 'Confidential Asset' : name}
            </h2>
            {renderStockBadge(badge)}
          </div>

          {/* Current value — large display (Req 5.1) */}
          <p
            className="text-3xl font-extrabold mb-3 text-[var(--text)]"
            style={{ letterSpacing: '-0.02em' }}
          >
            {isPrivacyMode ? '₹***' : formatCurrency(currentValue)}
          </p>

          {/* P&L row — absolute ₹ P&L + return % + allocation % (Req 5.1) */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Absolute P&L */}
            <span className="text-base font-bold" style={{ color: pnlColor }}>
              {isProfit && returnValue !== 0 ? '+' : ''}
              {isPrivacyMode ? '₹***' : formatCurrency(returnValue)}
            </span>

            {/* Return % badge */}
            <span
              className="text-sm font-bold px-2.5 py-0.5 rounded-full"
              style={{ color: pnlColor, background: pnlBg }}
            >
               {isFD
   ? `${holding.interestRate}%`
 : formatPercent(returnPct)}
            </span>

            {/* Allocation % (Req 5.1) */}
            {portfolioWeight != null && (
              <span
                className="ml-auto text-sm font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                {portfolioWeight.toFixed(2)}% of portfolio
              </span>
            )}
          </div>
        </header>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div
          className="mx-4"
          style={{ height: 1, background: 'var(--divider)' }}
          aria-hidden="true"
        />

        {/* ── Info section ────────────────────────────────────────────── */}
        <section className="px-4 pt-1 pb-2" aria-label="Holding details">
          <dl>
          {isFD ? (
            <>
              <FundamentalsRow
                left={{ label: 'Principal', value: isPrivacyMode ? '₹***' : formatCurrency(holding.principal) }}
                right={{ label: 'Current Value', value: isPrivacyMode ? '₹***' : formatCurrency(holding.currentValue) }}
              />
              <FundamentalsRow
                left={{ label: 'Interest Earned', value: isPrivacyMode ? '₹***' : formatCurrency(holding.interestEarned), style: { color: pnlColor } }}
                right={{ label: 'Interest Rate', value: `${holding.interestRate}%` }}
              />
              <FundamentalsRow
                left={{ label: 'Maturity Value', value: isPrivacyMode ? '₹***' : formatCurrency(holding.maturityValue) }}
                right={{ label: 'Allocation', value: `${holding.weightage.toFixed(2)}%` }}
              />
              <FundamentalsRow
                left={{ label: 'Start Date', value: new Date(holding.startDate).toLocaleDateString('en-IN') }}
                right={{ label: 'Maturity Date', value: new Date(holding.maturityDate).toLocaleDateString('en-IN') }}
              />
            </>
          ) : (
            <>
              {/* Row 1: Today's Price + Day Change */}
              <FundamentalsRow
                left={{
                  label: holding.assetType === 'mutualFunds' ? 'Daily NAV' : "Today's Price",
                  value: currentPrice != null
                    ? (isPrivacyMode ? '₹***' : formatCurrency(currentPrice))
                    : '—',
                }}
                right={
                  holding.dayChange != null && holding.dayChangePercent != null
                    ? {
                        label: 'Day Change',
                        value: isPrivacyMode
                          ? '₹***'
                          : `${Number(holding.dayChange) >= 0 ? '+' : ''}${Number(holding.dayChange).toFixed(2)} (${Number(holding.dayChangePercent).toFixed(2)}%)`,
                        style: { color: Number(holding.dayChange) >= 0 ? 'var(--profit)' : 'var(--loss)' },
                      }
                    : { label: 'Return %', value: isPrivacyMode ? '***%' : formatPercent(returnPct), style: { color: pnlColor } }
                }
              />

              {/* Row 2: Invested + Current Value */}
              <FundamentalsRow
                left={{ label: 'Invested', value: isPrivacyMode ? '₹***' : formatCurrency(investedValue) }}
                right={{ label: 'Current Value', value: isPrivacyMode ? '₹***' : formatCurrency(currentValue) }}
              />

              {/* Row 3: P&L + Returns */}
              <FundamentalsRow
                left={{
                  label: 'P&L',
                  value: `${isProfit && returnValue !== 0 ? '+' : ''}${isPrivacyMode ? '₹***' : formatCurrency(returnValue)}`,
                  style: { color: pnlColor },
                }}
                right={{
                  label: 'Returns',
                  value: isPrivacyMode ? '***%' : formatPercent(returnPct),
                  style: { color: pnlColor },
                }}
              />

              {/* Row 4: Quantity + Avg Buy Price */}
              <FundamentalsRow
                left={{
                  label: 'Quantity',
                  value: quantity != null ? (isPrivacyMode ? '***' : String(quantity)) : '—',
                }}
                right={{
                  label: 'Avg Buy Price',
                  value: avgPurchasePrice != null ? (isPrivacyMode ? '₹***' : formatCurrency(avgPurchasePrice)) : '—',
                }}
              />

              {/* Row 5: Conviction + Sector */}
              <FundamentalsRow
                left={{
                  label: 'Conviction',
                  value: confidenceLevel
                    ? (
                        <span
                          style={{
                            color: confidenceBadgeColor,
                            background: `${confidenceBadgeColor}18`,
                            border: `1px solid ${confidenceBadgeColor}40`,
                            borderRadius: '9999px',
                            padding: '1px 9px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-block',
                            lineHeight: '18px',
                          }}
                        >
                          {confidenceLevel}
                        </span>
                      )
                    : '—',
                }}
                right={labelStr ? { label: 'Sector', value: labelStr } : undefined}
              />
            </>
          )}
          </dl>
        </section>


        <div className="px-4 pt-3" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          {isFD ? (
            /* FD: single full-width Update button */
            <button
              type="button"
              onClick={() => setShowHoldingAction(true)}
              className="w-full rounded-2xl py-4 text-white font-semibold"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
            >
              Update FD
            </button>
          ) : (
            /* Stocks/ETFs/MFs: Manage + Reports side by side */
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowHoldingAction(true)}
                className="flex-1 rounded-2xl py-4 text-white font-semibold"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
              >
                Manage Position
              </button>
              <button
                type="button"
                onClick={() => setShowReports(true)}
                className="flex items-center justify-center gap-1.5 rounded-2xl px-4 py-4 font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: 'var(--sheet-btn-bg)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-2)',
                }}
                aria-label="View company reports"
              >
                <FileText size={16} aria-hidden="true" />
                <span className="text-sm">Reports</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

  {isFD ? (
  <FDActionModal
    holding={holding}
    isOpen={showHoldingAction}
    onClose={() => setShowHoldingAction(false)}
  />
) : (
  <HoldingActionModal
  holding={holding}
  isOpen={showHoldingAction}
  onClose={() => setShowHoldingAction(false)}
/>
)}

  {/* Company Reports — only for stocks/ETFs/MFs */}
  {!isFD && (
    <CompanyReportsScreen
      holding={holding}
      isOpen={showReports}
      onClose={() => setShowReports(false)}
    />
  )}
    </Modal>
  );
}