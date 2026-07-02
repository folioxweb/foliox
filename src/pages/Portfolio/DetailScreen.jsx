import { motion } from 'framer-motion';
import { ChevronDownIcon } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePrivacy } from '../../context/PrivacyContext';
import { useState } from 'react';
import HoldingActionModal from '../../components/portfolio/HoldingActionModal';
import FDActionModal from '../../components/portfolio/FDActionModal';
/**
 * Maps a sector/category string to a Badge color variant.
 * Mirrors the mapping used in HoldingCard for visual consistency.
 */
const SECTOR_COLOR_MAP = {
  Technology: 'blue',
  'Financial Services': 'emerald',
  Healthcare: 'teal',
  Energy: 'orange',
  Consumer: 'purple',
  Automobile: 'yellow',
  Infrastructure: 'gray',
  Pharma: 'pink',
  FMCG: 'orange',
  Metals: 'gray',
  Telecom: 'blue',
  Realty: 'yellow',
  Media: 'pink',
  Utilities: 'teal',
  ETF: 'orange',
  'Mutual Fund': 'teal',
  Debt: 'gray',
  Hybrid: 'purple',
};

function getSectorColor(sector) {
  return SECTOR_COLOR_MAP[sector] ?? 'gray';
}

/**
 * Maps confidence level to a Badge color and display color.
 */
const CONFIDENCE_BADGE_COLOR = {
  High: 'emerald',
  Medium: 'yellow',
  Low: 'red',
};

/**
 * Swipe threshold in pixels — if the user drags downward more than this,
 * the modal closes. The reverse animation plays independently (handled by
 * Modal / AnimatePresence) regardless of whether onClose ultimately succeeds.
 */
const SWIPE_CLOSE_THRESHOLD = 100;

/**
 * InfoRow — a single labelled data row rendered inside a `<dl>` element.
 * Uses `<dt>` for the label and `<dd>` for the value for semantic structure.
 */
function InfoRow({ label, value, valueStyle = {} }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <dt className="text-sm font-medium" style={{ color: '#94A3B8' }}>
        {label}
      </dt>
      <dd
        className="text-sm font-semibold text-white text-right"
        style={valueStyle}
      >
        {value ?? '—'}
      </dd>
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
        <div className="px-4 pb-10 pt-2 text-center" style={{ color: '#94A3B8' }}>
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
  } = holding;
  const isFD = holding.assetType === "fds";

  const { isPrivacyMode } = usePrivacy();
  const [showHoldingAction, setShowHoldingAction] = useState(false);

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
  const pnlColor = isProfit ? '#22C55E' : '#EF4444';
  const pnlBg = isProfit ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const labelStr = sector || category || '';
  const badgeColor = getSectorColor(labelStr);
  const confidenceBadgeColor = CONFIDENCE_BADGE_COLOR[confidenceLevel] ?? 'gray';

  // Comprehensive aria-label summarising the screen for screen-readers
  const ariaLabel = `${name} details. Current value ${formatCurrency(currentValue)}, return ${formatPercent(returnPct)}.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
        className="pb-10 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-x' }}
      >
        {/* ── Header (Req 5.1) ─────────────────────────────────────────── */}
        <header
          className="px-4 pt-2 pb-4"
          style={{
            /* Glassmorphism header matches design system (Req 2.4) */
            background: 'rgba(255, 255, 255, 0.03)',
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
              className="flex items-center justify-center rounded-full p-2 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#94A3B8',
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
          <h2 className="text-2xl font-bold text-white mb-1 leading-tight">
            {isPrivacyMode ? 'Confidential Asset' : name}
          </h2>

          {/* Current value — large display (Req 5.1) */}
          <p
            className="text-3xl font-extrabold text-white mb-3"
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
                style={{ color: '#64748B' }}
              >
                {portfolioWeight.toFixed(2)}% of portfolio
              </span>
            )}
          </div>
        </header>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div
          className="mx-4"
          style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)' }}
          aria-hidden="true"
        />

        {/* ── Info section (Req 5.2) ───────────────────────────────────── */}
        {/*
         * Uses semantic <section> + <dl>/<dt>/<dd> structure (Req 12.3).
         * Each InfoRow renders a <dt> + <dd> pair inside the <dl>.
         */}
        <section className="px-4 pt-2" aria-label="Holding details">
          <h3
            className="text-xs font-semibold uppercase tracking-widest mb-1 pt-2"
            style={{ color: '#475569' }}
          >
            Details
          </h3>

          {/* dl wraps all dt/dd pairs for semantic key-value structure */}
          <dl>
           {isFD ? (
  <>
    <InfoRow
      label="Principal"
      value={isPrivacyMode ? "₹***" : formatCurrency(holding.principal)}
    />

    <InfoRow
      label="Current Value"
      value={isPrivacyMode ? "₹***" : formatCurrency(holding.currentValue)}
    />

    <InfoRow
      label="Interest Earned"
      value={isPrivacyMode ? "₹***" : formatCurrency(holding.interestEarned)}
      valueStyle={{ color: pnlColor }}
    />

    <InfoRow
      label="Interest Rate"
      value={`${holding.interestRate}%`}
    />

    <InfoRow
      label="Start Date"
      value={new Date(holding.startDate).toLocaleDateString("en-IN")}
    />

    <InfoRow
      label="Maturity Date"
      value={new Date(holding.maturityDate).toLocaleDateString("en-IN")}
    />

    <InfoRow
      label="Maturity Value"
      value={isPrivacyMode ? "₹***" : formatCurrency(holding.maturityValue)}
    />

    <InfoRow
      label="Portfolio Allocation"
      value={`${holding.weightage.toFixed(2)}%`}
    />
  </>
) : (
  <>
    {/* Invested value (Req 5.2) */}
    <InfoRow
      label="Invested Value"
      value={isPrivacyMode ? '₹***' : formatCurrency(investedValue)}
    />

    {/* Current value (Req 5.2) */}
    <InfoRow
      label="Current Value"
      value={isPrivacyMode ? '₹***' : formatCurrency(currentValue)}
    />

    {/* Return ₹ and % (Req 5.2) */}
    <InfoRow
      label="Return"
      value={`${isProfit && returnValue !== 0 ? '+' : ''}${isPrivacyMode ? '₹***' : formatCurrency(returnValue)} (${formatPercent(returnPct)})`}
      valueStyle={{ color: pnlColor }}
    />

    {/* Quantity (Req 5.2) */}
    <InfoRow
      label="Quantity"
      value={quantity != null ? (isPrivacyMode ? '***' : String(quantity)) : '—'}
    />

    {/* Average purchase price (Req 5.2) */}
    <InfoRow
      label="Avg Purchase Price"
      value={avgPurchasePrice != null ? (isPrivacyMode ? '₹***' : formatCurrency(avgPurchasePrice)) : '—'}
    />

    {/* Confidence level badge (Req 5.2) */}
    {confidenceLevel && (
      <div
        className="flex items-center justify-between py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <dt className="text-sm font-medium" style={{ color: '#94A3B8' }}>
          Confidence Level
        </dt>
        <dd>
          <Badge
            label={confidenceLevel}
            color={confidenceBadgeColor}
            className="font-semibold"
          />
        </dd>
      </div>
    )}

    {/* Sector / category (Req 5.2) */}
    {labelStr && (
      <InfoRow
        label="Sector / Category"
        value={labelStr}
      />
    )}
  </>
)}
          </dl>
        </section>

        <div className="px-4 mt-8">
          <button
            type="button"
            onClick={() => setShowHoldingAction(true)}
            className="w-full rounded-2xl py-4 text-white font-semibold"
            style={{
              background: 'linear-gradient(135deg,#10B981,#059669)'
            }}
          >
            {isFD ? "Update FD" : "Manage Position"}
          </button>
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
    holding={{
      ...holding,
      assetType:
        holding.symbol
          ? (category === "ETF" ? "etfs" : "stocks")
          : "mutualFunds"
    }}
    isOpen={showHoldingAction}
    onClose={() => setShowHoldingAction(false)}
  />
)}
    </Modal>
  );
}