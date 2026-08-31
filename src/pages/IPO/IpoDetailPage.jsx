import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  AlertCircle,
  Calculator,
  CheckCircle2,
  Users,
  TrendingUp,
  PieChart,
  Coins,
  Building2,
  Sparkles,
  Plus,
  Minus,
  Clock,
  Layers,
  HelpCircle,
  Table,
  LayoutGrid
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { FlameRating, StatusBadge } from '../../components/ipo/IpoCard';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';

export default function IpoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const scrollRef = usePageScrollRestoration('ipo_detail');

  const [ipo, setIpo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState(1);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

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
          onClick={() => navigate('/ipo')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md active:scale-95 transition"
        >
          <ArrowLeft size={14} /> Back to IPO List
        </button>
      </div>
    );
  }

  const isPositiveGmp = ipo.gmpAmount > 0;
  const isNegativeGmp = ipo.gmpAmount < 0;
  const gmpColorClass = isPositiveGmp ? 'text-emerald-600 dark:text-emerald-400' : isNegativeGmp ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-2)]';

  const expectedListingPrice = ipo.priceNum + ipo.gmpAmount;
  const totalInvestment = ipo.minInvestment * lots;
  const totalExpectedProfit = ipo.expectedProfit * lots;
  const totalListingValue = expectedListingPrice * ipo.lotSize * lots;

  const resolvedSub = ipo.subscriptionDetails || (ipo.subscription && ipo.subscription !== '-' && ipo.subscription !== '--' ? {
    total: ipo.subscription,
    totalNum: parseFloat(String(ipo.subscription).replace(/[^0-9.]/g, '')) || 0,
    qib: ipo.raw_json?.QIB ? `${String(ipo.raw_json.QIB).replace(/x$/i, '')}x` : '-',
    qibNum: parseFloat(String(ipo.raw_json?.QIB || 0).replace(/[^0-9.]/g, '')) || 0,
    nii: ipo.raw_json?.NII ? `${String(ipo.raw_json.NII).replace(/x$/i, '')}x` : '-',
    niiNum: parseFloat(String(ipo.raw_json?.NII || 0).replace(/[^0-9.]/g, '')) || 0,
    shni: ipo.raw_json?.SHNI ? `${String(ipo.raw_json.SHNI).replace(/x$/i, '')}x` : '-',
    shniNum: parseFloat(String(ipo.raw_json?.SHNI || 0).replace(/[^0-9.]/g, '')) || 0,
    bhni: ipo.raw_json?.BHNI ? `${String(ipo.raw_json.BHNI).replace(/x$/i, '')}x` : '-',
    bhniNum: parseFloat(String(ipo.raw_json?.BHNI || 0).replace(/[^0-9.]/g, '')) || 0,
    rii: ipo.raw_json?.RII ? `${String(ipo.raw_json.RII).replace(/x$/i, '')}x` : '-',
    riiNum: parseFloat(String(ipo.raw_json?.RII || 0).replace(/[^0-9.]/g, '')) || 0,
    anchorAvailable: Boolean(ipo.anchorAvailable),
    anchorStatus: ipo.anchorAvailable ? '✅ Allocated' : '-',
    updatedAt: ipo.updatedOn || '',
    closingDate: ipo.closeDate || ''
  } : null);

  const sub = resolvedSub;
  const hasDetailedSub = Boolean(sub && (sub.totalNum > 0 || (sub.total && sub.total !== '-' && sub.total !== '--')));
  const hasLegacySub = Boolean(ipo.subscription && ipo.subscription !== '-' && ipo.subscription !== '--');

  // Helper to render subscription progress bar percentage
  function getSubProgress(num) {
    if (!num || isNaN(num) || num <= 0) return 0;
    return Math.min(Math.round(num >= 1 ? 100 : num * 100), 100);
  }

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
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <span className="text-sm font-bold truncate max-w-[200px]" style={{ color: 'var(--text)' }}>
          {ipo.name}
        </span>

        {ipo.investorGainUrl ? (
          <a
            href={ipo.investorGainUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Source</span>
            <ExternalLink size={13} />
          </a>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION & ALLOTMENT BANNER                                        */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
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

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusBadge status={ipo.status} statusBadge={ipo.statusBadge} />
              <FlameRating rating={ipo.ratingFlames} />
            </div>
          </div>
        </div>

        {/* Allotment Banner (if allotment URL is available) */}
        {ipo.allotmentUrl && (
          <a
            href={ipo.allotmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>Allotment Declared — Check Allotment Status</span>
            </div>
            <ExternalLink size={16} />
          </a>
        )}

        {/* ========================================================================= */}
        {/* 2. SECTION: DETAILED SUBSCRIPTION STATUS (AT TOP OF DETAILS CONTENT)     */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-4 space-y-3.5"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
          }}
        >
          {/* Section Header with Live Timestamp & View Mode Toggle */}
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

            <div className="flex items-center gap-2">
              {sub?.updatedAt && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                  <Clock size={10} />
                  <span>{sub.updatedAt}</span>
                </span>
              )}

              {hasDetailedSub && (
                <div className="flex items-center rounded-lg bg-[var(--input-bg)] p-0.5 border border-[var(--divider)]">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                      viewMode === 'cards'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[var(--text-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    <LayoutGrid size={11} /> Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[var(--text-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Table size={11} /> Table
                  </button>
                </div>
              )}
            </div>
          </div>

          {hasDetailedSub ? (
            <div className="space-y-3.5">
              {/* Overall Total Subscription Highlight Banner */}
              <div
                className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Total Overall Subscription
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-600 text-white">
                      {sub.totalNum >= 1 ? `${sub.totalNum.toFixed(2)}x Booked` : 'In Progress'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-2)] font-medium">
                    {sub.totalNum >= 1
                      ? `Issue is oversubscribed by ${sub.totalNum.toFixed(2)} times total demand.`
                      : `Issue has received ${(sub.totalNum * 100).toFixed(1)}% of total shares on offer.`}
                  </p>

                  {/* Progress Gauge */}
                  <div className="w-full sm:max-w-xs bg-slate-200 dark:bg-slate-700/60 h-2 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sub.totalNum >= 10
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                          : sub.totalNum >= 1
                          ? 'bg-gradient-to-r from-emerald-500 to-blue-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${getSubProgress(sub.totalNum)}%` }}
                    />
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-300 tracking-tight block">
                    {sub.total}
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--text-2)]">
                    Across All Categories
                  </span>
                </div>
              </div>

              {viewMode === 'cards' ? (
                /* Detailed Category Cards Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. QIB (Qualified Institutional Buyers) */}
                  <div
                    className="p-3.5 rounded-xl flex flex-col justify-between"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--divider)',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <Building2 size={14} className="text-blue-500" />
                          QIB
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {sub.qibNum >= 1 ? '100%+' : `${(sub.qibNum * 100).toFixed(0)}%`}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--text-2)] block mb-2 font-medium">
                        Institutions (MFs &amp; FPIs)
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-300">
                          {sub.qib}
                        </span>
                        <span className="text-[10px] text-[var(--text-2)]">
                          {sub.qibNum >= 1 ? `${sub.qibNum.toFixed(2)}x Demand` : 'Subscribing'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${getSubProgress(sub.qibNum)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. NII (Non-Institutional / HNI) */}
                  <div
                    className="p-3.5 rounded-xl flex flex-col justify-between"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--divider)',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-indigo-500" />
                          NII (HNI)
                        </span>
                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-300">
                          {sub.nii}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--text-2)] block mb-2 font-medium">
                        High Net-Worth (Bids &gt; ₹2L)
                      </span>
                    </div>

                    {/* Sub-HNI breakdown: sHNI and bHNI */}
                    <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--divider)] text-[11px]">
                      <div>
                        <span className="text-[10px] text-[var(--text-2)] block font-medium">sHNI (₹2L–10L)</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{sub.shni}</span>
                      </div>
                      <div className="border-l border-[var(--divider)] pl-2">
                        <span className="text-[10px] text-[var(--text-2)] block font-medium">bHNI (&gt; ₹10L)</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{sub.bhni}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Retail (RII) */}
                  <div
                    className="p-3.5 rounded-xl flex flex-col justify-between"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--divider)',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Users size={14} className="text-emerald-500" />
                          Retail (RII)
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {sub.riiNum >= 1 ? '100%+' : `${(sub.riiNum * 100).toFixed(0)}%`}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--text-2)] block mb-2 font-medium">
                        Individual Bids (&le; ₹2 Lakhs)
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {sub.rii}
                        </span>
                        <span className="text-[10px] text-[var(--text-2)]">
                          {sub.riiNum >= 1 ? `${sub.riiNum.toFixed(2)}x Demand` : 'Subscribing'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${getSubProgress(sub.riiNum)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Anchor Investors */}
                  <div
                    className="p-3.5 rounded-xl flex flex-col justify-between"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--divider)',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <PieChart size={14} className="text-amber-500" />
                          Anchor
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--text-2)]">Pre-Issue</span>
                      </div>
                      <span className="text-xs text-[var(--text-2)] block mb-2 font-medium">
                        Institutional Anchor Book
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          {sub.anchorAvailable ? (
                            <><CheckCircle2 size={16} className="text-emerald-500" /> Allocated</>
                          ) : (
                            sub.anchorStatus || 'Not Available'
                          )}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-2)]">
                        Locked-in institutional allotment
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Detailed Subscription Table View */
                <div className="overflow-x-auto rounded-xl border border-[var(--divider)]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[var(--input-bg)] text-[var(--text-2)] border-b border-[var(--divider)]">
                      <tr>
                        <th className="p-2.5 font-bold uppercase text-[10px]">Investor Category</th>
                        <th className="p-2.5 font-bold uppercase text-[10px]">Bidder Scope</th>
                        <th className="p-2.5 font-bold uppercase text-[10px] text-right">Subscription</th>
                        <th className="p-2.5 font-bold uppercase text-[10px] text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--divider)]" style={{ color: 'var(--text)' }}>
                      <tr>
                        <td className="p-2.5 font-extrabold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <Building2 size={13} /> QIB
                        </td>
                        <td className="p-2.5 text-[var(--text-2)]">Qualified Institutional Buyers</td>
                        <td className="p-2.5 font-black text-right text-blue-600 dark:text-blue-400">{sub.qib}</td>
                        <td className="p-2.5 text-right font-medium">{sub.qibNum >= 1 ? 'Oversubscribed' : 'Subscribing'}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <TrendingUp size={13} /> NII Total
                        </td>
                        <td className="p-2.5 text-[var(--text-2)]">Non-Institutional (HNI &gt; ₹2 Lakhs)</td>
                        <td className="p-2.5 font-black text-right text-indigo-600 dark:text-indigo-400">{sub.nii}</td>
                        <td className="p-2.5 text-right font-medium">{sub.niiNum >= 1 ? 'Oversubscribed' : 'Subscribing'}</td>
                      </tr>
                      <tr className="bg-[var(--input-bg)]/40 text-[11px]">
                        <td className="p-2 pl-6 font-semibold text-[var(--text-2)]">↳ sHNI</td>
                        <td className="p-2 text-[var(--text-2)]">Small HNI (₹2 Lakhs – ₹10 Lakhs)</td>
                        <td className="p-2 font-bold text-right text-indigo-500">{sub.shni}</td>
                        <td className="p-2 text-right text-[var(--text-2)]">{sub.shniNum >= 1 ? 'Booked' : 'Open'}</td>
                      </tr>
                      <tr className="bg-[var(--input-bg)]/40 text-[11px]">
                        <td className="p-2 pl-6 font-semibold text-[var(--text-2)]">↳ bHNI</td>
                        <td className="p-2 text-[var(--text-2)]">Big HNI (Above ₹10 Lakhs)</td>
                        <td className="p-2 font-bold text-right text-indigo-500">{sub.bhni}</td>
                        <td className="p-2 text-right text-[var(--text-2)]">{sub.bhniNum >= 1 ? 'Booked' : 'Open'}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Users size={13} /> Retail (RII)
                        </td>
                        <td className="p-2.5 text-[var(--text-2)]">Individual Retail (≤ ₹2 Lakhs)</td>
                        <td className="p-2.5 font-black text-right text-emerald-600 dark:text-emerald-400">{sub.rii}</td>
                        <td className="p-2.5 text-right font-medium">{sub.riiNum >= 1 ? 'Oversubscribed' : 'Subscribing'}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <PieChart size={13} /> Anchor Book
                        </td>
                        <td className="p-2.5 text-[var(--text-2)]">Anchor Institutional Placement</td>
                        <td className="p-2.5 font-black text-right text-emerald-600 dark:text-emerald-400">
                          {sub.anchorAvailable ? '✅ Allocated' : '-'}
                        </td>
                        <td className="p-2.5 text-right font-medium">{sub.anchorAvailable ? 'Completed' : 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : hasLegacySub ? (
            /* Fallback for already listed IPOs with overall subscription string */
            <div
              className="p-3.5 rounded-xl flex items-center justify-between"
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}
            >
              <div>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block mb-0.5">
                  Total Final Subscription
                </span>
                <span className="text-xs text-[var(--text-2)] font-medium">
                  Overall demand at close of bidding
                </span>
              </div>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-300">
                {ipo.subscription}
              </span>
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
          className="rounded-2xl p-4 space-y-3"
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
        {/* 4. SECTION: EST. PROFIT PER LOT                                          */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
          }}
        >
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                Est. Profit per Lot
              </h2>
            </div>
            
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

          <div
            className="rounded-xl p-4 flex flex-col justify-between"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
              {lots > 1 ? `Total Est. Profit (${lots} Lots)` : 'Est. Profit per 1 Lot'}
            </span>
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

            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-emerald-500/20 text-xs">
              <div>
                <span className="text-[11px] text-[var(--text-2)] block">Total Investment</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>
                  ₹{totalInvestment.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[var(--text-2)] block">GMP Calculation</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>
                  ₹{ipo.gmpAmount} &times; {ipo.lotSize * lots} shares
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. SECTION: EST. LISTING PRICE                                           */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-4 space-y-3"
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
            className="rounded-xl p-4 flex flex-col justify-between"
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
                  {isPositiveGmp ? '+' : ''}₹{ipo.gmpAmount} ({ipo.gmpPercent > 0 ? '+' : ''}{ipo.gmpPercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-blue-500/20 flex items-center justify-between text-xs">
              <span className="text-[11px] text-[var(--text-2)]">Formula: Issue Price (₹{ipo.priceStr}) + Current GMP (₹{ipo.gmpAmount})</span>
              {lots > 1 && (
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  Est. Portfolio Value: ₹{totalListingValue.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. SECTION: IPO KEY DETAILS / FINANCIALS METRICS GRID                    */}
        {/* ========================================================================= */}
        <div
          className="rounded-2xl p-4 space-y-3"
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
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
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">Flame Score</span>
              <div className="mt-0.5">
                <FlameRating rating={ipo.ratingFlames} />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">GMP Trend Range</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{ipo.gmpTrend || 'N/A'}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
              <span className="text-[11px] text-[var(--text-2)] block mb-0.5">Anchor Allotment</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                {ipo.anchorAvailable ? <><CheckCircle2 size={13} /> Available</> : 'No'}
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
