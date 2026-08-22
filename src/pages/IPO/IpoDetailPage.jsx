import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  AlertCircle,
  Calculator,
  CheckCircle2
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
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

      <div className="p-4 space-y-4">
        {/* Hero Section */}
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
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
                <p className="text-[11px] text-[var(--text-2)]">Updated on: {ipo.updatedOn}</p>
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

        {/* Primary Metrics: Est. Profit & Expected Listing Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Est Profit Card */}
          <div
            className="rounded-2xl p-4 flex flex-col justify-between"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
              Est. Profit per Lot
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold ${gmpColorClass}`}>
                {ipo.expectedProfit > 0 ? '+' : ''}₹{ipo.expectedProfit.toLocaleString('en-IN')}
              </span>
              {ipo.gmpPercent !== 0 && (
                <span className={`text-sm font-bold ${gmpColorClass}`}>
                  ({isPositiveGmp ? '+' : ''}{ipo.gmpPercent.toFixed(2)}%)
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-2)] font-medium mt-2">
              Based on GMP of ₹{ipo.gmpAmount} × {ipo.lotSize} shares
            </p>
          </div>

          {/* Expected Listing Price Card */}
          <div
            className="rounded-2xl p-4 flex flex-col justify-between"
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">
              Est. Listing Price
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-300">
                ₹{expectedListingPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[var(--text-2)] font-semibold">
                (Issue: ₹{ipo.priceStr})
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-2)] font-medium mt-2">
              Issue Price (₹{ipo.priceStr}) + GMP (₹{ipo.gmpAmount})
            </p>
          </div>
        </div>

        {/* Schedule & Important Dates */}
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

        {/* Detailed Metrics Grid */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
          }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)] border-b pb-2" style={{ borderColor: 'var(--divider)' }}>
            IPO Key Details
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <span className="text-[11px] text-[var(--text-2)] block">Issue Price</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>₹{ipo.priceStr || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-2)] block">Lot Size</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{ipo.lotSize} shares</span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-2)] block">Min Investment (1 Lot)</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>₹{ipo.minInvestment.toLocaleString('en-IN')}</span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-2)] block">Total Issue Size</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{ipo.ipoSize || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-2)] block">Subscription</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{ipo.subscription || '-'}</span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-2)] block">P/E Ratio</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{ipo.peRatio || '--'}</span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-2)] block">Flame Score</span>
              <div className="mt-0.5">
                <FlameRating rating={ipo.ratingFlames} />
              </div>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-2)] block">GMP Trend Range</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{ipo.gmpTrend || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-2)] block">Anchor Allotment</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                {ipo.anchorAvailable ? <><CheckCircle2 size={13} /> Available</> : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
