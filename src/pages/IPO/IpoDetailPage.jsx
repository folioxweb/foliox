import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  AlertCircle,
  Users,
  TrendingUp,
  PieChart,
  Coins,
  Building2,
  Sparkles,
  Plus,
  Minus,
  Clock,
  Calculator,
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { StatusBadge } from '../../components/ipo/IpoCard';
import IpoGmpHistoryChart from '../../components/ipo/IpoGmpHistoryChart';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';

export default function IpoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = usePageScrollRestoration('ipo_detail');
  const fromTab = location.state?.fromTab || sessionStorage.getItem('ipo_active_tab') || 'open';

  const [ipo, setIpo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState(1);

  async function loadDetail() {
    try {
      setLoading(true);
      const data = await api.getIpoById(id);
      setIpo(data);
    } catch (err) {
      console.error('Failed to load IPO detail:', err);
      setIpo(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <LoadingIndicator loading={true} />
        <p className="text-xs font-medium text-[var(--text-2)] mt-3">Loading IPO details...</p>
      </div>
    );
  }

  if (!ipo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <div className="p-4 rounded-full bg-slate-500/10 text-slate-400 mb-3">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-[var(--text)] mb-1">IPO details not found</h3>
        <p className="text-xs text-[var(--text-2)] max-w-xs mb-4">
          The requested IPO details could not be loaded.
        </p>
        <button
          onClick={() => navigate('/ipo', { state: { fromTab } })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md active:scale-95 transition"
        >
          <ArrowLeft size={14} /> Back to IPO List
        </button>
      </div>
    );
  }

  const isPositiveGmp = (ipo.gmpAmount || 0) > 0;
  const isNegativeGmp = (ipo.gmpAmount || 0) < 0;
  const gmpColorClass = isPositiveGmp
    ? 'text-emerald-600 dark:text-emerald-400'
    : isNegativeGmp
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-[var(--text-2)]';

  const lotSize = Number(ipo.lotSize || 1);
  const priceNum = Number(ipo.priceNum || 0);
  const lotCost = Number(ipo.minInvestment || (priceNum * lotSize) || 0);

  const expectedListingPrice = priceNum + (ipo.gmpAmount || 0);
  const totalInvestment = lotCost * lots;
  const totalExpectedProfit = (ipo.expectedProfit || ((ipo.gmpAmount || 0) * lotSize)) * lots;
  const totalListingValue = expectedListingPrice * lotSize * lots;

  // Calculate dynamic bidding categories for Retail, sHNI (> ₹2 Lakhs), and bHNI (> ₹10 Lakhs)
  let biddingCategories = null;
  if (lotCost > 0 && lotSize > 0) {
    const retailMinLots = 1;
    const retailMinShares = lotSize;
    const retailMinAmount = lotCost;
    const retailMaxLots = Math.max(1, Math.floor(200000 / lotCost));
    const retailMaxShares = retailMaxLots * lotSize;
    const retailMaxAmount = retailMaxLots * lotCost;

    const shniMinLots = Math.floor(200000 / lotCost) + 1;
    const shniMinShares = shniMinLots * lotSize;
    const shniMinAmount = shniMinLots * lotCost;
    const shniMaxLots = Math.max(shniMinLots, Math.floor(1000000 / lotCost));
    const shniMaxShares = shniMaxLots * lotSize;
    const shniMaxAmount = shniMaxLots * lotCost;

    const bhniMinLots = Math.floor(1000000 / lotCost) + 1;
    const bhniMinShares = bhniMinLots * lotSize;
    const bhniMinAmount = bhniMinLots * lotCost;

    biddingCategories = {
      lotCost,
      lotSize,
      priceNum,
      retail: {
        minLots: retailMinLots,
        minShares: retailMinShares,
        minAmount: retailMinAmount,
        maxLots: retailMaxLots,
        maxShares: retailMaxShares,
        maxAmount: retailMaxAmount,
      },
      shni: {
        minLots: shniMinLots,
        minShares: shniMinShares,
        minAmount: shniMinAmount,
        maxLots: shniMaxLots,
        maxShares: shniMaxShares,
        maxAmount: shniMaxAmount,
      },
      bhni: {
        minLots: bhniMinLots,
        minShares: bhniMinShares,
        minAmount: bhniMinAmount,
      },
    };
  }

  let currentCategoryLabel = null;
  if (biddingCategories) {
    if (lots >= biddingCategories.bhni.minLots) {
      currentCategoryLabel = {
        text: 'bHNI Application (> ₹10L)',
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/20',
      };
    } else if (lots >= biddingCategories.shni.minLots) {
      currentCategoryLabel = {
        text: 'sHNI Application (₹2L – ₹10L)',
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-500/10 border-indigo-500/20',
      };
    } else {
      currentCategoryLabel = {
        text: 'Retail Application (≤ ₹2L)',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
      };
    }
  }

  // Extract subscription details with direct and raw_json fallback
  let rawSub = ipo.subscriptionDetails || ipo.subscription_details || ipo.raw_json?.subscription_details || null;
  if (typeof rawSub === 'string') {
    try {
      rawSub = JSON.parse(rawSub);
    } catch {
      rawSub = null;
    }
  }
  const rawObj = ipo.raw_json || {};

  const cleanNum = (val) => {
    if (!val || val === '-' || val === '--') return 0;
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const formatSub = (val, num) => {
    if (val && val !== '-' && val !== '--') {
      const s = String(val).trim();
      return s.endsWith('x') ? s : `${s}x`;
    }
    if (num && num > 0) return `${num}x`;
    return '-';
  };

  const totalNum = rawSub?.totalNum || rawSub?.total_num || cleanNum(rawSub?.total) || cleanNum(ipo.subscription) || cleanNum(rawObj.Total) || 0;
  const totalText = rawSub?.total && rawSub.total !== '-' ? (String(rawSub.total).endsWith('x') ? rawSub.total : `${rawSub.total}x`) : (totalNum > 0 ? `${totalNum}x` : (ipo.subscription || '-'));

  const qibNum = rawSub?.qibNum || rawSub?.qib_num || cleanNum(rawSub?.qib) || cleanNum(rawObj.QIB) || 0;
  const qibText = formatSub(rawSub?.qib || rawObj.QIB, qibNum);

  const niiNum = rawSub?.niiNum || rawSub?.nii_num || cleanNum(rawSub?.nii) || cleanNum(rawObj.NII) || 0;
  const niiText = formatSub(rawSub?.nii || rawObj.NII, niiNum);

  const shniNum = rawSub?.shniNum || rawSub?.shni_num || cleanNum(rawSub?.shni) || cleanNum(rawObj.SHNI) || 0;
  const shniText = formatSub(rawSub?.shni || rawObj.SHNI, shniNum);

  const bhniNum = rawSub?.bhniNum || rawSub?.bhni_num || cleanNum(rawSub?.bhni) || cleanNum(rawObj.BHNI) || 0;
  const bhniText = formatSub(rawSub?.bhni || rawObj.BHNI, bhniNum);

  const riiNum = rawSub?.riiNum || rawSub?.rii_num || cleanNum(rawSub?.rii) || cleanNum(rawObj.RII) || 0;
  const riiText = formatSub(rawSub?.rii || rawObj.RII, riiNum);

  const anchorAvailable = Boolean(rawSub?.anchorAvailable || rawSub?.anchor_available || ipo.anchorAvailable || (rawObj.Anchor && String(rawObj.Anchor).includes('✅')));
  const anchorStatusText = anchorAvailable ? 'Allocated' : ((rawSub?.anchorStatus || rawSub?.anchor_status || '-').replace(/✅|❌/g, '').trim() || (anchorAvailable ? 'Allocated' : 'Not Available'));

  const subUpdatedAt = rawSub?.updatedAt || rawSub?.updated_at || '';
  const hasSubData = totalNum > 0 || (totalText && totalText !== '-' && totalText !== '--') || qibNum > 0 || niiNum > 0 || riiNum > 0;

  return (
    <main
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto"
      style={{ background: 'var(--bg)', paddingBottom: '8rem' }}
    >
      {/* Top Navigation Header */}
      <div
        className="sticky top-0 z-20 px-4 flex items-center justify-between"
        style={{
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: '0.75rem',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/ipo', { state: { fromTab } });
            }
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <span className="text-sm font-bold truncate max-w-[200px]" style={{ color: 'var(--text)' }}>
          {ipo.name}
        </span>

        <div className="w-8" />
      </div>

      <div className="px-2.5 py-3 sm:p-4 space-y-3.5 sm:space-y-4 max-w-4xl mx-auto">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION & ALLOTMENT BANNER                                        */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-3 sm:p-4 relative overflow-hidden"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                  {ipo.name}
                </h1>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    background: 'var(--input-bg)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--divider)',
                  }}
                >
                  {ipo.category || 'Mainboard IPO'}
                </span>
              </div>
              {ipo.updatedOn && (
                <p className="text-[11px] text-[var(--text-2)] flex items-center gap-1">
                  <Clock size={11} className="text-blue-500" />
                  <span>GMP Updated: {ipo.updatedOn}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col items-end shrink-0">
              <StatusBadge status={ipo.status} statusBadge={ipo.statusBadge} />
            </div>
          </div>
        </div>

        {/* Allotment Banner (if allotment URL is available) */}
        {ipo.allotmentUrl && (
          <a
            href={ipo.allotmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">Allotment Declared — Check Allotment Status</span>
            </div>
            <ExternalLink size={16} />
          </a>
        )}

        {/* ========================================================================= */}
        {/* 2. SECTION: DETAILED SUBSCRIPTION STATUS (TABLE ONLY, CLEAN NUMBERS)     */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-3 sm:p-4 space-y-3 sm:space-y-3.5"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
          }}
        >
          {/* Section Header with Live Timestamp */}
          <div className="flex items-center justify-between border-b pb-2.5 flex-wrap gap-2" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  Detailed Subscription Status
                </h2>
                <span className="text-[10px] text-[var(--text-2)]">
                  Live category-wise investor bidding breakdown
                </span>
              </div>
            </div>

            {subUpdatedAt && (
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                <Clock size={10} />
                <span>Updated: {subUpdatedAt}</span>
              </span>
            )}
          </div>

          {hasSubData ? (
            <div className="space-y-3 sm:space-y-3.5">
              {/* Overall Total Subscription Highlight Banner */}
              <div
                className="p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between sm:justify-start gap-1.5 mb-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Total Overall Subscription
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white whitespace-nowrap shrink-0">
                      {totalNum >= 1 ? `${totalNum.toFixed(2)}x Booked` : (totalNum > 0 ? `${totalNum.toFixed(2)}x Subscribed` : 'Bidding Open')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-2)] font-medium">
                    {totalNum >= 1
                      ? `Issue is oversubscribed by ${totalNum.toFixed(2)} times total demand.`
                      : totalNum > 0
                      ? `Issue has received ${totalNum.toFixed(2)}x of total shares on offer.`
                      : 'Live bidding numbers across categories.'}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                  <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-300 tracking-tight block">
                    {totalText}
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--text-2)]">
                    Across All Categories
                  </span>
                </div>
              </div>

              {/* Detailed Subscription Table View */}
              <div className="overflow-x-auto rounded-xl border border-[var(--divider)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--input-bg)] text-[var(--text-2)] border-b border-[var(--divider)]">
                    <tr>
                      <th className="p-2 sm:p-3 font-bold uppercase text-[10px]">Investor Category</th>
                      <th className="p-2 sm:p-3 font-bold uppercase text-[10px]">Bidder Scope</th>
                      <th className="p-2 sm:p-3 font-bold uppercase text-[10px] text-right">Subscription</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--divider)]" style={{ color: 'var(--text)' }}>
                    {/* QIB Row */}
                    <tr>
                      <td className="p-2 sm:p-3 font-extrabold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <Building2 size={14} className="shrink-0" />
                        <span>QIB</span>
                      </td>
                      <td className="p-2 sm:p-3 text-[var(--text-2)]">Qualified Institutional Buyers (MFs &amp; FPIs)</td>
                      <td className="p-2 sm:p-3 font-black text-right text-blue-600 dark:text-blue-400 text-sm">
                        {qibText}
                      </td>
                    </tr>

                    {/* NII Total Row */}
                    <tr>
                      <td className="p-2 sm:p-3 font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <TrendingUp size={14} className="shrink-0" />
                        <span>NII Total</span>
                      </td>
                      <td className="p-2 sm:p-3 text-[var(--text-2)]">Non-Institutional (High Net-Worth &gt; ₹2 Lakhs)</td>
                      <td className="p-2 sm:p-3 font-black text-right text-indigo-600 dark:text-indigo-400 text-sm">
                        {niiText}
                      </td>
                    </tr>

                    {/* sHNI Sub-Row */}
                    <tr className="bg-[var(--input-bg)]/50 text-xs">
                      <td className="p-1.5 sm:p-2.5 pl-5 sm:pl-7 font-semibold text-[var(--text-2)]">
                        ↳ sHNI
                      </td>
                      <td className="p-1.5 sm:p-2.5 text-[var(--text-2)]">
                        <div>Small HNI (Applications ₹2L – ₹10L)</div>
                        {biddingCategories && (
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                            Min: {biddingCategories.shni.minLots} lots ({biddingCategories.shni.minShares.toLocaleString('en-IN')} sh • ₹{biddingCategories.shni.minAmount.toLocaleString('en-IN')})
                          </div>
                        )}
                      </td>
                      <td className="p-1.5 sm:p-2.5 font-black text-right text-indigo-600 dark:text-indigo-400 text-sm">
                        {shniText}
                      </td>
                    </tr>

                    {/* bHNI Sub-Row */}
                    <tr className="bg-[var(--input-bg)]/50 text-xs">
                      <td className="p-1.5 sm:p-2.5 pl-5 sm:pl-7 font-semibold text-[var(--text-2)]">
                        ↳ bHNI
                      </td>
                      <td className="p-1.5 sm:p-2.5 text-[var(--text-2)]">
                        <div>Big HNI (Applications Above ₹10L)</div>
                        {biddingCategories && (
                          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                            Min: {biddingCategories.bhni.minLots} lots ({biddingCategories.bhni.minShares.toLocaleString('en-IN')} sh • ₹{biddingCategories.bhni.minAmount.toLocaleString('en-IN')})
                          </div>
                        )}
                      </td>
                      <td className="p-1.5 sm:p-2.5 font-black text-right text-indigo-600 dark:text-indigo-400 text-sm">
                        {bhniText}
                      </td>
                    </tr>

                    {/* Retail Row */}
                    <tr>
                      <td className="p-2 sm:p-3 font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Users size={14} className="shrink-0" />
                        <span>Retail (RII)</span>
                      </td>
                      <td className="p-2 sm:p-3 text-[var(--text-2)]">
                        <div>Individual Retail Investors (≤ ₹2 Lakhs)</div>
                        {biddingCategories && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            Min: 1 lot • Max: {biddingCategories.retail.maxLots} lots ({biddingCategories.retail.maxShares.toLocaleString('en-IN')} sh • ₹{biddingCategories.retail.maxAmount.toLocaleString('en-IN')})
                          </div>
                        )}
                      </td>
                      <td className="p-2 sm:p-3 font-black text-right text-emerald-600 dark:text-emerald-400 text-sm">
                        {riiText}
                      </td>
                    </tr>

                    {/* Anchor Book Row */}
                    <tr>
                      <td className="p-2 sm:p-3 font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <PieChart size={14} className="shrink-0" />
                        <span>Anchor Book</span>
                      </td>
                      <td className="p-2 sm:p-3 text-[var(--text-2)]">Anchor Institutional Placement (Pre-Issue)</td>
                      <td className="p-2 sm:p-3 font-bold text-right text-emerald-600 dark:text-emerald-400 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                          {anchorStatusText}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Upcoming IPOs before bidding opens */
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--divider)',
              }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Bidding opens on <strong className="text-emerald-600 dark:text-emerald-400">{ipo.openDate || 'TBA'}</strong>
              </p>
              <p className="text-[11px] text-[var(--text-2)] mt-1 max-w-md mx-auto">
                Live category-wise subscription numbers (QIB, sHNI, bHNI, Retail, and Anchor) will automatically update here in real-time once the issue opens.
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. SECTION: TIMELINE & IMPORTANT DATES                                   */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-3 sm:p-4 space-y-3"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
          }}
        >
          <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--divider)' }}>
            <Calendar size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
              Timeline & Important Dates
            </h2>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-[var(--divider)]">
              <span className="text-[var(--text-2)] flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Bidding Opens
              </span>
              <span className="font-bold" style={{ color: 'var(--text)' }}>{ipo.openDate || 'TBA'}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-[var(--divider)]">
              <span className="text-[var(--text-2)] flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Bidding Closes
              </span>
              <span className="font-bold" style={{ color: 'var(--text)' }}>{ipo.closeDate || 'TBA'}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-[var(--divider)]">
              <span className="text-[var(--text-2)] flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Basis of Allotment (BoA)
              </span>
              <span className="font-bold" style={{ color: 'var(--text)' }}>{ipo.boaDate || 'TBA'}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-[var(--text-2)] flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Listing Date
              </span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">{ipo.listingDate || 'TBA'}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3.5 SECTION: GMP TREND & HISTORICAL CHART                                 */}
        {/* ========================================================================= */}
        <IpoGmpHistoryChart
          ipoId={ipo.id}
          currentGmpPercent={ipo.gmpPercent}
          currentGmpAmount={ipo.gmpAmount}
        />

        {/* ========================================================================= */}
        {/* 4. SECTION: EST. PROFIT PER LOT                                          */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-3 sm:p-4 space-y-3"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
          }}
        >
          <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                Est. Profit per Lot
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              {currentCategoryLabel && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentCategoryLabel.bg} ${currentCategoryLabel.color} hidden sm:inline-block`}>
                  {currentCategoryLabel.text}
                </span>
              )}

              {/* Interactive Lots Stepper */}
              <div className="flex items-center gap-1.5 bg-[var(--input-bg)] px-2 py-0.5 rounded-lg border border-[var(--divider)]">
                <span className="text-[10px] text-[var(--text-2)] font-medium mr-1">Lots:</span>
                <button
                  type="button"
                  onClick={() => setLots((prev) => Math.max(1, prev - 1))}
                  disabled={lots <= 1}
                  className="w-5 h-5 flex items-center justify-center rounded bg-slate-200 dark:bg-slate-700 disabled:opacity-30 text-xs font-bold transition active:scale-95"
                >
                  <Minus size={11} />
                </button>
                <span className="text-xs font-extrabold px-1 min-w-[16px] text-center" style={{ color: 'var(--text)' }}>
                  {lots}
                </span>
                <button
                  type="button"
                  onClick={() => setLots((prev) => prev + 1)}
                  className="w-5 h-5 flex items-center justify-center rounded bg-emerald-600 text-white text-xs font-bold transition active:scale-95 shadow-sm"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Category Selection Buttons */}
          {biddingCategories && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <span className="text-[10px] text-[var(--text-2)] font-bold uppercase tracking-wider shrink-0 mr-0.5">
                Quick Apply:
              </span>
              <button
                type="button"
                onClick={() => setLots(1)}
                className={`px-2 py-1 rounded-lg font-bold border text-[11px] transition shrink-0 ${
                  lots === 1
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-[var(--input-bg)] text-[var(--text-2)] hover:text-[var(--text)] border-[var(--divider)]'
                }`}
              >
                1 Lot (Retail Min)
              </button>
              {biddingCategories.retail.maxLots > 1 && (
                <button
                  type="button"
                  onClick={() => setLots(biddingCategories.retail.maxLots)}
                  className={`px-2 py-1 rounded-lg font-bold border text-[11px] transition shrink-0 ${
                    lots === biddingCategories.retail.maxLots
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-[var(--input-bg)] text-[var(--text-2)] hover:text-[var(--text)] border-[var(--divider)]'
                  }`}
                >
                  {biddingCategories.retail.maxLots} Lots (Retail Max)
                </button>
              )}
              <button
                type="button"
                onClick={() => setLots(biddingCategories.shni.minLots)}
                className={`px-2 py-1 rounded-lg font-bold border text-[11px] transition shrink-0 ${
                  lots === biddingCategories.shni.minLots
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-[var(--input-bg)] text-[var(--text-2)] hover:text-[var(--text)] border-[var(--divider)]'
                }`}
              >
                {biddingCategories.shni.minLots} Lots (sHNI Min)
              </button>
              <button
                type="button"
                onClick={() => setLots(biddingCategories.bhni.minLots)}
                className={`px-2 py-1 rounded-lg font-bold border text-[11px] transition shrink-0 ${
                  lots === biddingCategories.bhni.minLots
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-[var(--input-bg)] text-[var(--text-2)] hover:text-[var(--text)] border-[var(--divider)]'
                }`}
              >
                {biddingCategories.bhni.minLots} Lots (bHNI Min)
              </button>
            </div>
          )}

          <div
            className="rounded-xl p-3 sm:p-4 flex flex-col justify-between"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                {lots > 1 ? `Total Est. Profit (${lots} Lots)` : 'Est. Profit per 1 Lot'}
              </span>
              {currentCategoryLabel && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${currentCategoryLabel.bg} ${currentCategoryLabel.color} sm:hidden`}>
                  {currentCategoryLabel.text}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black ${gmpColorClass}`}>
                {totalExpectedProfit > 0 ? '+' : ''}₹{totalExpectedProfit.toLocaleString('en-IN')}
              </span>
              {ipo.gmpPercent !== 0 && (
                <span className={`text-sm sm:text-base font-bold ${gmpColorClass}`}>
                  ({isPositiveGmp ? '+' : ''}{ipo.gmpPercent.toFixed(2)}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-emerald-500/20 text-xs">
              <div>
                <span className="text-[11px] text-[var(--text-2)] block">Total Investment</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>
                  ₹{totalInvestment.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[var(--text-2)] block">Total Shares</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>
                  {(lotSize * lots).toLocaleString('en-IN')} shares
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] text-[var(--text-2)] block">GMP Premium</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>
                  ₹{ipo.gmpAmount || 0} &times; {(lotSize * lots).toLocaleString('en-IN')} sh
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. SECTION: EST. LISTING PRICE                                           */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-3 sm:p-4 space-y-3"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
          }}
        >
          <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--divider)' }}>
            <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
              Est. Listing Price
            </h2>
          </div>

          <div
            className="rounded-xl p-3 sm:p-4 flex flex-col justify-between"
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">
                  Expected Opening Listing
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-300">
                    ₹{expectedListingPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[var(--text-2)] font-semibold">
                    (Issue: ₹{ipo.priceStr})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[var(--text-2)] block">Est. Premium</span>
                <span className={`text-sm sm:text-base font-bold ${gmpColorClass}`}>
                  {isPositiveGmp ? '+' : ''}₹{ipo.gmpAmount || 0} ({(ipo.gmpPercent || 0) > 0 ? '+' : ''}{(ipo.gmpPercent || 0).toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-blue-500/20 flex items-center justify-between text-xs">
              <span className="text-[11px] text-[var(--text-2)]">Formula: Issue Price (₹{ipo.priceStr}) + Current GMP (₹{ipo.gmpAmount || 0})</span>
              {lots > 1 && (
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  Est. Portfolio Value: ₹{totalListingValue.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5.5 SECTION: APPLICATION CATEGORIES (RETAIL, sHNI & bHNI CALCULATOR)      */}
        {/* ========================================================================= */}
        {biddingCategories && (
          <div
            className="rounded-2xl p-3 sm:p-4 space-y-3"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
            }}
          >
            <div className="flex items-center justify-between border-b pb-2.5 flex-wrap gap-2" style={{ borderColor: 'var(--divider)' }}>
              <div className="flex items-center gap-2">
                <Calculator size={16} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    Application Categories &amp; Minimum Bids
                  </h2>
                  <span className="text-[10px] text-[var(--text-2)]">
                    Calculated minimum lots, shares &amp; application amount to qualify
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-2)] bg-[var(--input-bg)] px-2 py-0.5 rounded border border-[var(--divider)]">
                Issue Price: ₹{ipo.priceStr} • 1 Lot: {biddingCategories.lotSize} shares
              </span>
            </div>

            {/* 3 Categories Grid: Retail, sHNI, bHNI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Category 1: Retail (RII) */}
              <div
                className="rounded-xl p-3 sm:p-3.5 flex flex-col justify-between space-y-3 relative transition-all duration-200"
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                        Retail (RII)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Up to ₹2 Lakhs
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-[var(--card-bg)]/80 border border-emerald-500/15">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[11px] text-[var(--text-2)] font-medium">Minimum Bid (1 Lot)</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          ₹{biddingCategories.retail.minAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-2)]">
                        <strong>1 Lot</strong> = <strong>{biddingCategories.retail.minShares} shares</strong>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[var(--card-bg)]/80 border border-emerald-500/15">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[11px] text-[var(--text-2)] font-medium">Maximum Bid</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          ₹{biddingCategories.retail.maxAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-2)]">
                        <strong>{biddingCategories.retail.maxLots} Lots</strong> = <strong>{biddingCategories.retail.maxShares.toLocaleString('en-IN')} shares</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLots(1)}
                  className="w-full py-1.5 px-2 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-98 transition flex items-center justify-center gap-1"
                >
                  <span>Select Retail (1 Lot)</span>
                </button>
              </div>

              {/* Category 2: sHNI (Small HNI / sNII) */}
              <div
                className="rounded-xl p-3 sm:p-3.5 flex flex-col justify-between space-y-3 relative transition-all duration-200"
                style={{
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                        Small HNI (sHNI)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      ₹2L – ₹10 Lakhs
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[var(--card-bg)]/90 border border-indigo-500/25 shadow-xs">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider">
                          Minimum to Qualify
                        </span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          ₹{biddingCategories.shni.minAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text)] font-semibold flex items-center justify-between">
                        <span>Min Application:</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                          {biddingCategories.shni.minLots} Lots ({biddingCategories.shni.minShares.toLocaleString('en-IN')} sh)
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-2)] mt-1 leading-tight">
                        Strictly above ₹2,00,000 threshold to enter sHNI category.
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-[var(--card-bg)]/80 border border-indigo-500/15">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[11px] text-[var(--text-2)] font-medium">Maximum sHNI Bid</span>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          ₹{biddingCategories.shni.maxAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-2)]">
                        <strong>{biddingCategories.shni.maxLots} Lots</strong> = <strong>{biddingCategories.shni.maxShares.toLocaleString('en-IN')} shares</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLots(biddingCategories.shni.minLots)}
                  className="w-full py-1.5 px-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition shadow-sm flex items-center justify-center gap-1"
                >
                  <span>Select sHNI Min ({biddingCategories.shni.minLots} Lots)</span>
                </button>
              </div>

              {/* Category 3: bHNI (Big HNI / bNII) */}
              <div
                className="rounded-xl p-3 sm:p-3.5 flex flex-col justify-between space-y-3 relative transition-all duration-200"
                style={{
                  background: 'rgba(168, 85, 247, 0.06)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                        Big HNI (bHNI)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Above ₹10 Lakhs
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[var(--card-bg)]/90 border border-purple-500/25 shadow-xs">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider">
                          Minimum to Qualify
                        </span>
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                          ₹{biddingCategories.bhni.minAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text)] font-semibold flex items-center justify-between">
                        <span>Min Application:</span>
                        <span className="font-extrabold text-purple-600 dark:text-purple-400">
                          {biddingCategories.bhni.minLots} Lots ({biddingCategories.bhni.minShares.toLocaleString('en-IN')} sh)
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-2)] mt-1 leading-tight">
                        Strictly above ₹10,00,000 threshold for Big HNI allocation.
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-[var(--card-bg)]/80 border border-purple-500/15">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[11px] text-[var(--text-2)] font-medium">Bidding Scope</span>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">High Weightage</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-2)] leading-tight">
                        bHNI receives 2/3rd portion of total NII reservation.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLots(biddingCategories.bhni.minLots)}
                  className="w-full py-1.5 px-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-98 transition shadow-sm flex items-center justify-center gap-1"
                >
                  <span>Select bHNI Min ({biddingCategories.bhni.minLots} Lots)</span>
                </button>
              </div>
            </div>

            {/* Explanatory Footer Bar */}
            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[var(--text-2)]">
              <span>
                <strong>Rules:</strong> Retail ≤ ₹2L • sHNI &gt; ₹2L to ₹10L • bHNI &gt; ₹10L.
              </span>
              <span className="font-medium">
                Tap any category button above to calculate its exact profit &amp; value.
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. SECTION: IPO KEY DETAILS / FINANCIALS METRICS GRID                    */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-3 sm:p-4 space-y-3"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
          }}
        >
          <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--divider)' }}>
            <Sparkles size={16} className="text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
              IPO Key Details & Financials
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 pt-1">
            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">Issue Price</span>
              <span className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>₹{ipo.priceStr || 'N/A'}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">Lot Size</span>
              <span className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>{ipo.lotSize} shares</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">Min Investment (1 Lot)</span>
              <span className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>₹{ipo.minInvestment.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">Total Issue Size</span>
              <span className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>{ipo.ipoSize || 'N/A'}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">P/E Ratio</span>
              <span className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>{ipo.peRatio || '--'}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">GMP Trend Range</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{ipo.gmpTrend || 'N/A'}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">Anchor Allotment</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {anchorAvailable ? 'Allocated' : 'No'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">Category</span>
              <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{ipo.category || 'Mainboard'}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
