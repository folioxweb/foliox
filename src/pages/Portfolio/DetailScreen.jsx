import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePrivacy } from '../../context/PrivacyContext';
import { renderStockBadge } from '../../components/cards/HoldingCard';
import { useState, useMemo } from 'react';
import HoldingActionModal from '../../components/portfolio/HoldingActionModal';
import FDActionModal from '../../components/portfolio/FDActionModal';
import CompanyReportsScreen from '../News/CompanyReportsScreen';
import CandlestickChart from '../../components/charts/CandlestickChart';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePortfolio } from '../../context/PortfolioContext';

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

const CONFIDENCE_BADGE_COLOR = {
  High: '#10B981',
  Medium: '#F59E0B',
  Low: '#EF4444',
};

function FundamentalsRow({ left, right }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{ borderTop: '1px solid var(--divider)', paddingTop: 8, paddingBottom: 8 }}
    >
      <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
        <dt
          className="text-[11px] font-medium shrink-0 text-[var(--text-muted)]"
        >
          {left.label}
        </dt>
        <dd
          className="text-[13px] font-semibold text-right truncate text-[var(--text)]"
          style={left.style}
        >
          {left.value ?? '—'}
        </dd>
      </div>

      {right && (
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--divider)', flexShrink: 0, margin: '0 2px' }} />
      )}

      {right && (
        <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
          <dt
            className="text-[11px] font-medium shrink-0 text-[var(--text-muted)]"
          >
            {right.label}
          </dt>
          <dd
            className="text-[13px] font-semibold text-right truncate text-[var(--text)]"
            style={right.style}
          >
            {right.value ?? '—'}
          </dd>
        </div>
      )}
    </div>
  );
}

export default function DetailScreen({ holding: propHolding }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = usePortfolio();

  const initialHolding = propHolding || location.state?.holding;

  // Resolve the latest live holding from PortfolioContext whenever it updates
  const liveHolding = useMemo(() => {
    if (!initialHolding) return null;
    const typeKey = initialHolding.assetType || (initialHolding.category === 'Mutual Fund' ? 'mutualFunds' : 'stocks');
    const list = state[typeKey]?.data;
    if (!Array.isArray(list)) return null;

    return list.find(h =>
      (h.assetId && initialHolding.assetId && h.assetId === initialHolding.assetId) ||
      (h.symbol && initialHolding.symbol && h.symbol.toUpperCase() === initialHolding.symbol.toUpperCase()) ||
      (h.name && initialHolding.name && h.name.toLowerCase() === initialHolding.name.toLowerCase()) ||
      (h.srNo && initialHolding.srNo && h.srNo === initialHolding.srNo)
    );
  }, [state, initialHolding]);

  const holding = liveHolding ? { ...initialHolding, ...liveHolding, assetType: initialHolding.assetType } : initialHolding;

  const { isPrivacyMode } = usePrivacy();
  const [showHoldingAction, setShowHoldingAction] = useState(false);
  const [showReports, setShowReports] = useState(false);

  if (!holding) {
    return (
      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--bg)] px-4 pb-28 text-[var(--text)]"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top, 24px))' }}
      >
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={() => navigate('/portfolio')}
            className="flex items-center justify-center rounded-full p-2.5 bg-[var(--sheet-btn-bg)] text-[var(--text)] hover:bg-[var(--card-border)] transition-colors"
            aria-label="Back to Portfolio"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="text-center py-16 text-[var(--text-muted)] text-sm font-medium">
          No holding details selected.
        </div>
      </div>
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
    currentNAV,
    currentPrice: rawCurrentPrice,
    dayChange: rawDayChange,
    dayChangePercent: rawDayChangePercent,
  } = holding;

  const isFD = holding.assetType === "fds";
  const isMF = holding.assetType === "mutualFunds" || holding.assetType === "mutual_funds" || holding.category === "Mutual Fund";
  const isStockOrETF = !isFD && !isMF;
  const isStock = !isFD && !isMF && holding.assetType !== "etfs" && holding.asset_type !== "ETF" && holding.category !== "ETF";

  const derivedPrice = (currentValue && quantity && quantity > 0) ? (currentValue / quantity) : undefined;
  const todayPrice = isFD
    ? (currentValue || holding.principal || 0)
    : (currentNAV ?? rawCurrentPrice ?? derivedPrice ?? 0);

  const dayChangeVal = rawDayChange != null ? Number(rawDayChange) : 0;
  const dayChangePct = rawDayChangePercent != null ? Number(rawDayChangePercent) : 0;
  const isDayProfit = dayChangeVal >= 0;
  const dayPnlColor = isDayProfit ? 'var(--profit)' : 'var(--loss)';
  const dayPnlBg = isDayProfit ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';

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
  const labelStr = sector || category || '';
  const badgeColor = getSectorColor(labelStr);
  const confidenceBadgeColor = CONFIDENCE_BADGE_COLOR[confidenceLevel] ?? 'gray';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--bg)] px-3 sm:px-4 lg:px-8 pb-28 lg:pb-12 text-[var(--text)] font-sans max-w-7xl mx-auto w-full"
      style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top, 24px))' }}
    >
      {/* ── Top Header Navigation Bar (Notch Safe Padding) ────────────────────── */}
      <header className="flex items-center justify-between pb-3 border-b border-[var(--card-border)] mb-4">
        <button
          type="button"
          onClick={() => navigate('/portfolio')}
          className="flex items-center gap-2 rounded-xl px-3 py-2 bg-[var(--sheet-btn-bg)] text-[var(--text)] font-semibold text-xs hover:bg-[var(--card-border)] transition-all shadow-sm"
          aria-label="Back to Portfolio"
        >
          <ArrowLeft size={18} />
          <span>Portfolio</span>
        </button>

        <Badge
          label={isFD ? "Fixed Deposit" : labelStr}
          color={isFD ? "teal" : badgeColor}
        />
      </header>

      {/* ── Stock Name & Today's Live Price / Returns (Clean Android Typography) ── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-extrabold leading-tight text-[var(--text)] font-sans">
            {isPrivacyMode ? 'Confidential Asset' : name}
          </h1>
          {isStock && renderStockBadge(badge)}
        </div>

        {/* Today's Market Price (Clean App Typography) */}
        <div className="flex items-baseline gap-2 sm:gap-3 mb-1.5 flex-wrap">
          <p
            className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-sans"
          >
            {isPrivacyMode ? '₹***' : formatCurrency(todayPrice)}
          </p>

          {/* Today's Gain / Loss & Percentage Return Badge */}
          {(dayChangeVal !== 0 || dayChangePct !== 0) && (
            <span
              className="text-xs font-extrabold px-2.5 py-0.5 rounded-full font-sans flex items-center gap-1"
              style={{ color: dayPnlColor, background: dayPnlBg }}
            >
              <span>{isDayProfit ? '+' : ''}{isPrivacyMode ? '₹***' : dayChangeVal.toFixed(2)}</span>
              <span>({isDayProfit ? '+' : ''}{dayChangePct.toFixed(2)}%)</span>
              <span className="text-[10px] opacity-75 uppercase font-bold">1D</span>
            </span>
          )}
        </div>

        {/* Allocation percentage */}
        {portfolioWeight != null && (
          <div className="flex items-center justify-end text-xs font-semibold text-[var(--text-muted)]">
            <span>{portfolioWeight.toFixed(2)}% of portfolio</span>
          </div>
        )}
      </div>

      {/* ── Groww Interactive Stock Chart ────────────────────────── */}
      {isStockOrETF && (
        <div className="mb-4">
          <CandlestickChart
            symbol={holding.symbol || holding.name}
            stockName={holding.name}
            currentPrice={todayPrice}
            height={260}
          />
        </div>
      )}

      {/* ── Fundamentals & Position Details ────────────────────────── */}
      <section className="rounded-2xl p-4 mb-4 border border-[var(--card-border)] bg-[var(--card-bg)] shadow-md" aria-label="Holding details">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Asset Fundamentals & Position Details
        </h2>

        <dl>
          {isFD ? (
            <>
              <FundamentalsRow
                left={{ label: 'Principal', value: isPrivacyMode ? '₹***' : formatCurrency(holding.principal || holding.investedValue || 0) }}
                right={{ label: 'Current Value', value: isPrivacyMode ? '₹***' : formatCurrency(holding.currentValue || holding.principal || 0) }}
              />
              <FundamentalsRow
                left={{ label: 'Interest Earned', value: isPrivacyMode ? '₹***' : formatCurrency(holding.interestEarned || 0), style: { color: pnlColor } }}
                right={{ label: 'Interest Rate', value: `${holding.interestRate || 0}%` }}
              />
              <FundamentalsRow
                left={{ label: 'Maturity Value', value: isPrivacyMode ? '₹***' : formatCurrency(holding.maturityValue || 0) }}
                right={{ label: 'Allocation', value: `${Number(holding.weightage ?? holding.portfolioWeight ?? 0).toFixed(2)}%` }}
              />
              <FundamentalsRow
                left={{ label: 'Start Date', value: holding.startDate ? new Date(holding.startDate).toLocaleDateString('en-IN') : '—' }}
                right={{ label: 'Maturity Date', value: holding.maturityDate ? new Date(holding.maturityDate).toLocaleDateString('en-IN') : '—' }}
              />
            </>
          ) : (
            <>
              <FundamentalsRow
                left={{
                  label: holding.assetType === 'mutualFunds' ? 'Daily NAV' : "Today's Price",
                  value: todayPrice > 0
                    ? (isPrivacyMode ? '₹***' : formatCurrency(todayPrice))
                    : '—',
                }}
                right={{
                  label: 'Day Change',
                  value: isPrivacyMode
                    ? '₹***'
                    : `${isDayProfit && dayChangeVal > 0 ? '+' : ''}${dayChangeVal.toFixed(2)} (${isDayProfit && dayChangePct > 0 ? '+' : ''}${dayChangePct.toFixed(2)}%)`,
                  style: { color: dayPnlColor },
                }}
              />

              <FundamentalsRow
                left={{ label: 'Invested', value: isPrivacyMode ? '₹***' : formatCurrency(investedValue) }}
                right={{ label: 'Current Value', value: isPrivacyMode ? '₹***' : formatCurrency(currentValue) }}
              />

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

              <FundamentalsRow
                left={{
                  label: 'Quantity',
                  value: quantity != null ? (isPrivacyMode ? '***' : String(quantity)) : '—',
                }}
                right={{
                  label: holding.assetType === 'mutualFunds' ? 'Avg NAV' : 'Avg Buy Price',
                  value: avgPurchasePrice != null ? (isPrivacyMode ? '₹***' : formatCurrency(avgPurchasePrice)) : '—',
                }}
              />

              {isStockOrETF ? (
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
              ) : (
                <FundamentalsRow
                  left={{
                    label: 'Sector',
                    value: labelStr || '—',
                  }}
                />
              )}
              
              {holding.assetType === 'mutualFunds' && holding.sipEnabled && (
                <FundamentalsRow
                  left={{
                    label: 'SIP Amount',
                    value: holding.sipAmount ? (isPrivacyMode ? '₹***' : formatCurrency(holding.sipAmount)) : '—',
                  }}
                  right={{
                    label: 'SIP Day',
                    value: holding.sipDay ? `${holding.sipDay} of month` : '—',
                  }}
                />
              )}
            </>
          )}
        </dl>
      </section>

      {/* ── Manage Position Action Button ────────────────────────── */}
      <div className="pt-2">
        {isFD ? (
          <button
            type="button"
            onClick={() => setShowHoldingAction(true)}
            className="w-full rounded-2xl py-4 text-white font-bold shadow-lg transition-transform active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
          >
            Update FD
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowHoldingAction(true)}
            className="w-full rounded-2xl py-4 text-white font-bold shadow-lg transition-transform active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
          >
            Manage Position
          </button>
        )}
      </div>

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

      {!isFD && (
        <CompanyReportsScreen
          holding={holding}
          isOpen={showReports}
          onClose={() => setShowReports(false)}
        />
      )}
    </motion.div>
  );
}