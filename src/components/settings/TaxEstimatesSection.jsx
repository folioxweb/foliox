import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  HelpCircle, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { usePrivacy } from '../../context/PrivacyContext';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { 
  calculateTaxAndCapitalGains, 
  getAvailableFinancialYears, 
  getFinancialYear,
  LTCG_EXEMPTION_LIMIT,
  STCG_TAX_RATE,
  LTCG_TAX_RATE 
} from '../../utils/taxCalculator';
import Skeleton from '../ui/Skeleton';

function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function TaxEstimatesSection() {
  const { isPrivacyMode } = usePrivacy();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFy, setSelectedFy] = useState(() => getFinancialYear(new Date()));
  const [activeTab, setActiveTab] = useState('realized'); // 'realized' | 'harvesting'
  const [expandedTradeId, setExpandedTradeId] = useState(null);
  const [showTaxRulesInfo, setShowTaxRulesInfo] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const data = await api.getAllTransactionsForTax();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load transactions for tax calculation:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const availableFys = useMemo(() => {
    return getAvailableFinancialYears(transactions);
  }, [transactions]);

  // Live prices map for unrealized calculation
  const livePrices = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      if (tx.asset_id && tx.current_price) {
        map[tx.asset_id] = tx.current_price;
      }
      if (tx.symbol && tx.current_price) {
        map[tx.symbol] = tx.current_price;
      }
    }
    return map;
  }, [transactions]);

  // Run the Indian Capital Gains Engine
  const taxReport = useMemo(() => {
    return calculateTaxAndCapitalGains({
      transactions,
      livePrices,
      selectedFy,
    });
  }, [transactions, livePrices, selectedFy]);

  const { summary, realizedTrades, harvesting } = taxReport;

  const sectionCardStyle = {
    borderRadius: 20,
    border: '1px solid var(--card-border)',
    background: 'var(--card-bg)',
    boxShadow: 'var(--card-shadow)',
    padding: 'clamp(0.875rem, 3vw, 1.25rem)',
  };

  return (
    <section aria-label="Indian Capital Gains Tax Estimates" style={sectionCardStyle} className="mb-4">
      {/* ── Section Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}
          >
            <Calculator size={20} className="text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-[var(--text)]">
                Indian Capital Gains Tax Estimator
              </h2>
              <button
                type="button"
                onClick={() => setShowTaxRulesInfo((prev) => !prev)}
                className="text-[var(--text-muted)] hover:text-indigo-400 transition-colors"
                title="View budget rules applied"
              >
                <HelpCircle size={15} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-2)] mt-0.5">
              Budget 2024-25 rules • STCG 20% &amp; LTCG 12.5% (₹1.25L Exemption)
            </p>
          </div>
        </div>

        {/* Financial Year Selector & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <select
              value={selectedFy}
              onChange={(e) => setSelectedFy(e.target.value)}
              className="appearance-none rounded-xl py-1.5 pl-3 pr-8 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text)',
              }}
            >
              {availableFys.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
            <Calendar
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]"
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-xl transition hover:opacity-85 disabled:opacity-40"
            style={{
              background: 'var(--sheet-btn-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-muted)',
            }}
            title="Refresh Tax Ledger"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Tax Rules Banner (Collapsible Info) ────────────────────────── */}
      <AnimatePresence>
        {showTaxRulesInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div
              className="rounded-xl p-3 text-xs leading-relaxed space-y-1.5"
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: 'var(--text-2)',
              }}
            >
              <p className="font-bold text-[var(--text)] flex items-center gap-1.5">
                <Info size={14} className="text-indigo-400" />
                Post-July 2024 Indian Capital Gains Rules:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-[var(--text)]">STCG (Holding &le; 12 months):</strong> Taxed flat at{' '}
                  <span className="font-bold text-amber-500">20%</span>.
                </li>
                <li>
                  <strong className="text-[var(--text)]">LTCG (Holding &gt; 12 months):</strong> Taxed at{' '}
                  <span className="font-bold text-emerald-500">12.5%</span> on aggregate gains exceeding the{' '}
                  <span className="font-bold text-indigo-400">₹1,25,000</span> annual tax-free threshold.
                </li>
                <li>
                  <strong className="text-[var(--text)]">Cost Basis:</strong> Calculated strictly using FIFO
                  (First-In, First-Out) matching against earliest purchase lots.
                </li>
                <li>
                  <strong className="text-[var(--text)]">Fixed Deposits:</strong> Taxed separately at individual income
                  slab rates (excluded from equity capital gains).
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Summary Cards Grid ────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2">
          <Skeleton width="100%" height={90} rounded="xl" />
          <Skeleton width="100%" height={90} rounded="xl" />
          <Skeleton width="100%" height={90} rounded="xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2">
          {/* Card 1: Total Estimated Tax Liability */}
          <div
            className="rounded-2xl p-3.5 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.04) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                Est. Tax Liability ({selectedFy})
              </span>
              <p className="text-xl sm:text-2xl font-black mt-1 text-[var(--text)]">
                {isPrivacyMode ? '₹••••••' : formatCurrency(summary.totalEstimatedTax)}
              </p>
            </div>
            <div className="mt-2 text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Realized Trades: {summary.realizedTradesCount}</span>
              <span className="font-bold text-indigo-400">
                Net P&amp;L: {isPrivacyMode ? '₹•••' : formatCurrency(summary.totalRealizedGain)}
              </span>
            </div>
          </div>

          {/* Card 2: Short Term Capital Gains (STCG @ 20%) */}
          <div
            className="rounded-2xl p-3.5 flex flex-col justify-between"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--card-border)',
            }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                  STCG (Rate: 20%)
                </span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)]">&le; 365 Days</span>
              </div>
              <p className="text-lg sm:text-xl font-black mt-1 text-[var(--text)]">
                {isPrivacyMode ? '₹••••••' : formatCurrency(summary.netSTCG)}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">Tax Payable:</span>
              <span className="font-bold text-amber-500 dark:text-amber-400">
                {isPrivacyMode ? '₹•••' : formatCurrency(summary.stcgTax)}
              </span>
            </div>
          </div>

          {/* Card 3: Long Term Capital Gains (LTCG @ 12.5%) */}
          <div
            className="rounded-2xl p-3.5 flex flex-col justify-between"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--card-border)',
            }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  LTCG (Rate: 12.5%)
                </span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)]">&gt; 365 Days</span>
              </div>
              <p className="text-lg sm:text-xl font-black mt-1 text-[var(--text)]">
                {isPrivacyMode ? '₹••••••' : formatCurrency(summary.netLTCG)}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">Tax (Exceeding ₹1.25L):</span>
              <span className="font-bold text-emerald-500 dark:text-emerald-400">
                {isPrivacyMode ? '₹•••' : formatCurrency(summary.ltcgTax)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Annual ₹1,25,000 LTCG Exemption Progress Tracker ────────────── */}
      <div
        className="rounded-xl p-3 sm:p-3.5 mt-2.5 mb-3"
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--card-border)',
        }}
      >
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-500 dark:text-emerald-400" />
            <span className="font-bold text-[var(--text)]">₹1,25,000 Annual LTCG Exemption Meter</span>
          </div>
          <span className="font-bold text-[var(--text)]">
            {isPrivacyMode ? '₹••• / ₹1.25L' : `${formatCurrency(summary.ltcgExemptionUtilized)} / ₹1,25,000`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--card-border)] relative">
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                summary.ltcgExemptionPct >= 100
                  ? 'linear-gradient(90deg, #10B981, #F59E0B)'
                  : 'linear-gradient(90deg, #6366F1, #10B981)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${summary.ltcgExemptionPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] mt-1.5 text-[var(--text-muted)]">
          <span>
            {summary.ltcgExemptionPct >= 100
              ? 'Exemption fully utilized (100%)'
              : `${summary.ltcgExemptionPct.toFixed(1)}% utilized`}
          </span>
          <span className="font-semibold text-emerald-500 dark:text-emerald-400">
            {summary.ltcgExemptionRemaining > 0
              ? `${isPrivacyMode ? '₹•••' : formatCurrency(summary.ltcgExemptionRemaining)} tax-free quota remaining`
              : '₹0 remaining (gains now taxable @ 12.5%)'}
          </span>
        </div>
      </div>

      {/* ── Sub-Tabs: Realized Ledger vs Tax Harvesting ─────────────────── */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--divider)]">
        <button
          type="button"
          onClick={() => setActiveTab('realized')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'realized'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-[var(--input-bg)] text-[var(--text-2)] hover:opacity-80'
          }`}
        >
          <TrendingUp size={14} />
          Realized Tax P&amp;L ({realizedTrades.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('harvesting')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'harvesting'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-[var(--input-bg)] text-[var(--text-2)] hover:opacity-80'
          }`}
        >
          <Sparkles size={14} className="text-amber-400" />
          Tax Harvesting &amp; Advisor
          {harvesting.upcomingLtcgTransitionLots.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-extrabold">
              {harvesting.upcomingLtcgTransitionLots.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Content View 1: Realized Tax Ledger ─────────────────────────── */}
      {activeTab === 'realized' && (
        <div className="mt-3 space-y-2">
          {realizedTrades.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
            >
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 opacity-60 mb-2" />
              <p className="text-sm font-bold text-[var(--text)]">No Sell Trades in {selectedFy}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                No realized capital gains or tax liabilities were incurred during this financial year.
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden divide-y divide-[var(--divider)]"
              style={{ border: '1px solid var(--card-border)' }}
            >
              {realizedTrades.map((trade, idx) => {
                const isExpanded = expandedTradeId === `${trade.sellTxId}_${idx}`;
                const isProfit = trade.gain >= 0;

                return (
                  <div
                    key={`${trade.sellTxId}_${idx}`}
                    className="p-3 transition-colors hover:bg-[var(--sheet-btn-bg)] cursor-pointer"
                    onClick={() => setExpandedTradeId(isExpanded ? null : `${trade.sellTxId}_${idx}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            trade.isLTCG
                              ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {trade.taxCategory} ({trade.isLTCG ? '12.5%' : '20%'})
                        </span>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                            {trade.symbol || trade.name}
                          </h4>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            Sold on {formatDate(trade.sellDate)} • Held {trade.holdingDays} days
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs sm:text-sm font-extrabold ${
                            isProfit ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                          }`}
                        >
                          {isProfit ? '+' : ''}
                          {isPrivacyMode ? '₹•••' : formatCurrency(trade.gain)}
                        </p>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {trade.quantity} units @ ₹{Math.round(trade.sellPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Trade Math Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2.5 pt-2 border-t border-[var(--divider)] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs"
                      >
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Buy Date</span>
                          <p className="font-semibold text-[var(--text)]">{formatDate(trade.buyDate)}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Buy Price (FIFO)</span>
                          <p className="font-semibold text-[var(--text)]">
                            {isPrivacyMode ? '₹•••' : formatCurrency(trade.buyPrice)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Sell Price</span>
                          <p className="font-semibold text-[var(--text)]">
                            {isPrivacyMode ? '₹•••' : formatCurrency(trade.sellPrice)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Tax Rate</span>
                          <p className="font-bold text-indigo-400">{trade.isLTCG ? '12.5% (LTCG)' : '20% (STCG)'}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Content View 2: Tax Harvesting & Transition Advisor ───────── */}
      {activeTab === 'harvesting' && (
        <div className="mt-3 space-y-3">
          {/* Section A: Approaching LTCG Transition Countdown */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={16} className="text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                LTCG Transition Countdown (Next 60 Days)
              </h3>
            </div>

            {harvesting.upcomingLtcgTransitionLots.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                No active holding is scheduled to cross the 365-day LTCG threshold within the next 60 days.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-2)] leading-relaxed">
                  Holding these assets for a few more days will transition their tax rate from{' '}
                  <span className="font-bold text-amber-400">20% STCG</span> to{' '}
                  <span className="font-bold text-emerald-400">12.5% LTCG</span>, saving 7.5% in taxes upon exit:
                </p>

                <div className="divide-y divide-[var(--divider)] rounded-lg border border-[var(--card-border)] overflow-hidden">
                  {harvesting.upcomingLtcgTransitionLots.map((lot, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between text-xs bg-[var(--card-bg)]">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--text)]">{lot.symbol}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-bold">
                            {lot.daysUntilLtcg} days left
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          Bought {formatDate(lot.buyDate)} • Held {lot.holdingDays} days
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-emerald-500 dark:text-emerald-400">
                          {isPrivacyMode ? '₹•••' : `+${formatCurrency(lot.unrealizedGain)}`}
                        </span>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Potential Tax Saved: {isPrivacyMode ? '₹•••' : formatCurrency(lot.unrealizedGain * 0.075)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section B: LTCG Tax-Free Gain Harvesting */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  Tax-Free LTCG Gain Harvesting
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-400">
                {isPrivacyMode ? '₹•••' : formatCurrency(harvesting.remainingTaxFreeExemption)} Remaining Quota
              </span>
            </div>

            {harvesting.remainingTaxFreeExemption <= 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                You have already consumed your full ₹1,25,000 tax-free LTCG exemption for {selectedFy}. Any additional
                long-term gains will incur 12.5% tax.
              </p>
            ) : harvesting.ltcgGainHarvestingLots.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                You have ₹{formatCurrency(harvesting.remainingTaxFreeExemption)} in remaining tax-free allowance, but no
                unrealized LTCG positions held &gt; 365 days are currently in profit.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-2)] leading-relaxed">
                  You can sell and immediately repurchase these profitable long-term positions to lock in higher cost
                  basis without paying any tax:
                </p>

                <div className="divide-y divide-[var(--divider)] rounded-lg border border-[var(--card-border)] overflow-hidden">
                  {harvesting.ltcgGainHarvestingLots.slice(0, 4).map((lot, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between text-xs bg-[var(--card-bg)]">
                      <div>
                        <span className="font-bold text-[var(--text)]">{lot.symbol}</span>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Held {lot.holdingDays} days • {lot.quantity} units
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-500 dark:text-emerald-400">
                          {isPrivacyMode ? '₹•••' : `+${formatCurrency(lot.unrealizedGain)}`}
                        </span>
                        <span className="text-[10px] text-emerald-400 block font-semibold">100% Tax Free</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
