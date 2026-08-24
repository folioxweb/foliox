import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Inbox,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import { api } from '../../services/apiClient';
import { usePortfolio } from '../../context/PortfolioContext';
import AISummaryScreen from './AISummaryScreen';

// ── Sort helper: announcementDate desc, then announcementTime desc ─────────
function sortDocs(docs) {
  return [...docs].sort((a, b) => {
    const dateCmp = (b.announcementDate || '').localeCompare(a.announcementDate || '');
    if (dateCmp !== 0) return dateCmp;
    return (b.announcementTime || '').localeCompare(a.announcementTime || '');
  });
}

// ── Sort quarterly periods: "Q1 FY27" > "Q4 FY26" ────────────────────────
function parsePeriodOrdinal(period) {
  const m = String(period).match(/Q(\d)\s+FY(\d+)/i);
  if (!m) return 0;
  return parseInt(m[2], 10) * 4 + parseInt(m[1], 10);
}

// ── DocumentType badge ─────────────────────────────────────────────────────
const DOC_TYPE_COLORS = {
  RESULTS:           { bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'rgba(16,185,129,0.25)' },
  FINANCIAL_RESULTS: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'rgba(16,185,129,0.25)' },
  PRESENTATION:      { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: 'rgba(59,130,246,0.25)' },
  TRANSCRIPT:        { bg: 'rgba(168,85,247,0.12)', color: '#A855F7', border: 'rgba(168,85,247,0.25)' },
  PRESS_RELEASE:     { bg: 'rgba(236,72,153,0.12)', color: '#EC4899', border: 'rgba(236,72,153,0.25)' },
  ANNUAL_REPORT:     { bg: 'rgba(99,102,241,0.12)', color: '#818CF8', border: 'rgba(99,102,241,0.25)' },
  AGM:               { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
  DIVIDEND:          { bg: 'rgba(236,72,153,0.12)', color: '#EC4899', border: 'rgba(236,72,153,0.25)' },
  DEFAULT:           { bg: 'rgba(100,116,139,0.12)', color: '#94A3B8', border: 'rgba(100,116,139,0.25)' },
};

const DOC_TYPE_LABELS = {
  RESULTS: 'Results',
  FINANCIAL_RESULTS: 'Results',
  PRESENTATION: 'Investor Presentation',
  TRANSCRIPT: 'Earnings Call Transcript',
  PRESS_RELEASE: 'Press Release',
  ANNUAL_REPORT: 'Annual Report',
  AGM: 'AGM Notice',
  DIVIDEND: 'Dividend Notice',
};

function DocTypeBadge({ type }) {
  const normalizedType = String(type || 'OTHER').toUpperCase().trim();
  const style = DOC_TYPE_COLORS[normalizedType] ?? DOC_TYPE_COLORS.DEFAULT;
  const label = DOC_TYPE_LABELS[normalizedType] ?? normalizedType.replace(/_/g, ' ');
  return (
    <span
      className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {label}
    </span>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────
function DocSkeletonRow() {
  return (
    <div
      className="flex items-center gap-3 py-3.5"
      style={{ borderBottom: '1px solid var(--divider)' }}
    >
      <Skeleton width={28} height={28} rounded="lg" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton width="75%" height={13} rounded="md" />
        <div className="flex gap-2">
          <Skeleton width="18%" height={16} rounded="full" />
          <Skeleton width="22%" height={10} rounded="full" />
        </div>
      </div>
      <Skeleton width={14} height={14} rounded="md" />
    </div>
  );
}

// ── Collapsible DocumentType group section ──────────────────────────────
function DocTypeGroup({ type, docs, defaultOpen = false, onGenerateSummary }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-1">
      {/* Clickable Document Type header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-1.5 px-1.5 rounded-lg transition-colors hover:bg-[var(--sheet-btn-bg)] text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <DocTypeBadge type={type} />
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            ({docs.length} {docs.length === 1 ? 'report' : 'reports'})
          </span>
        </div>
        {open ? (
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        )}
      </button>

      {/* Reports list under this documentType — visible when open */}
      {open && (
        <div className="pl-1">
          {docs.map((doc) => (
            <DocRow key={doc.attachmentId || doc.title} doc={doc} showBadge={false} onGenerateSummary={onGenerateSummary} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Collapsible quarter section ───────────────────────────────────────────
function QuarterSection({ period, docs, defaultOpen, onGenerateSummary }) {
  const [open, setOpen] = useState(defaultOpen);

  // Group docs in this quarter by documentType
  const docsByType = {};
  docs.forEach((doc) => {
    const type = (doc.documentType || 'OTHER').toUpperCase().trim();
    if (!docsByType[type]) docsByType[type] = [];
    docsByType[type].push(doc);
  });

  return (
    <div>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2.5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {period}
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(16,185,129,0.1)',
              color: 'var(--emerald)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            {docs.length}
          </span>
        </div>
        {open ? (
          <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        )}
      </button>

      {/* Docs grouped by Document Type */}
      {open && (
        <div className="pb-3 pt-1 space-y-2">
          {Object.entries(docsByType).map(([type, typeDocs]) => (
            <DocTypeGroup
              key={type}
              type={type}
              docs={typeDocs}
              defaultOpen={false}
              onGenerateSummary={onGenerateSummary}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single document row ───────────────────────────────────────────────────
function DocRow({ doc, showBadge = true, onGenerateSummary }) {
  const { title, attachmentName, documentType, announcementDate, pdfUrl } = doc;

  function handleOpen(e) {
    e.stopPropagation();
    if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  }

  // Use title from JSON as primary display name for the report
  const displayName = title || attachmentName || 'View Document';

  return (
    <div
      className="w-full text-left flex items-start gap-3 py-2.5 transition-opacity group"
      style={{ borderBottom: '1px solid var(--divider)' }}
    >
      <button
         onClick={handleOpen}
         className="flex-1 min-w-0 flex items-start gap-3 text-left active:opacity-60"
         aria-label={`Open ${displayName}`}
      >
        {/* File icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl mt-0.5"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.15)',
            color: 'var(--emerald)',
          }}
        >
          <FileText size={15} aria-hidden="true" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <p
            className="text-sm font-medium leading-snug line-clamp-2 text-left"
            style={{ color: 'var(--text)' }}
          >
            {displayName}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {showBadge && <DocTypeBadge type={documentType} />}
            {announcementDate && (
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {new Date(announcementDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* AI Summary Button */}
      {onGenerateSummary && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onGenerateSummary?.(doc);
          }}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1 mt-1 rounded-lg px-2 py-1.5 active:opacity-60 transition-colors hover:bg-emerald-500/10"
          style={{ color: 'var(--emerald)', background: 'rgba(16,185,129,0.05)' }}
          aria-label="Generate AI Summary"
        >
           <Sparkles size={16} />
           <span className="text-[10px] font-medium leading-none">AI Summary</span>
        </button>
      )}
    </div>
  );
}

/**
 * CompanyReportsScreen — Full-page modal showing company documents for a stock.
 *
 * Replaces bottom-sheet to ensure 100% smooth native scrolling on iOS and mobile devices.
 *
 * Props:
 *   holding  — holding object ({ name, symbol, company? })
 *   isOpen   — boolean
 *   onClose  — dismiss callback
 */
export default function CompanyReportsScreen({ holding, isOpen, onClose }) {
  const { prefetchedDocs } = usePortfolio();

  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSummaryDoc, setSelectedSummaryDoc] = useState(null);

  // Strip exchange prefix NSE:/BSE:
  const rawSymbol = holding?.symbol ?? null;
  const symbol = rawSymbol ? rawSymbol.replace(/^[^:]+:/, '') : null;

  const fetchDocs = useCallback(async () => {
    if (!isOpen || !symbol) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCompanyDocuments(symbol);
      setDocs(Array.isArray(data) ? sortDocs(data) : []);
    } catch (err) {
      setError(err?.message || 'Failed to load reports');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen, symbol]);

  useEffect(() => {
    setDocs(null);
    setError(null);
  }, [symbol]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const displayName = holding?.company || holding?.name || symbol || '';

  // Document types that have a reportingPeriod assigned by the backend
  // but should NOT appear under Quarterly Results.
  const QUARTERLY_EXCLUDED_TYPES = new Set([
    'ANNUAL_REPORT',
    'ANALYST_MEETING_INTIMATION',
  ]);

  // 1. Annual Reports (documentType === 'ANNUAL_REPORT' AND non-blank reportingPeriod)
  const isAnnualReport = (d) =>
    (d.documentType || '').toUpperCase().trim() === 'ANNUAL_REPORT' &&
    Boolean(d.reportingPeriod && d.reportingPeriod.trim() !== '');

  const annualReports = (docs || []).filter(isAnnualReport);

  // 2. Quarterly Results (has reportingPeriod AND not in the excluded set)
  const isQuarterly = (d) =>
    Boolean(d.reportingPeriod && d.reportingPeriod.trim() !== '') &&
    !QUARTERLY_EXCLUDED_TYPES.has((d.documentType || '').toUpperCase().trim());

  const quarterly = (docs || []).filter(isQuarterly);

  // 3. Other Documents — catch-all for everything not in Annual Reports or Quarterly
  const others = (docs || []).filter(
    (d) => !isAnnualReport(d) && !isQuarterly(d)
  );

  // Group quarterly by period, sorted by ordinal descending
  const periodMap = {};
  quarterly.forEach((d) => {
    if (!periodMap[d.reportingPeriod]) periodMap[d.reportingPeriod] = [];
    periodMap[d.reportingPeriod].push(d);
  });
  const sortedPeriods = Object.keys(periodMap).sort(
    (a, b) => parsePeriodOrdinal(b) - parsePeriodOrdinal(a)
  );

  return (
    <>
    <AnimatePresence>
      {isOpen && holding && (
        <>
          {/* Backdrop */}
          <motion.div
            key="reports-page-backdrop"
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Full-screen Panel */}
          <motion.div
            key="reports-page-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Reports for ${displayName}`}
            className="fixed inset-0 z-[60] flex flex-col outline-none"
            style={{
              background: 'var(--bg)',
              paddingTop: 'env(safe-area-inset-top)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
          >
            {/* Centered Loading Overlay with Backdrop Blur */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-md"
                  style={{
                    background: 'rgba(11, 17, 32, 0.7)',
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="flex flex-col items-center justify-center gap-3.5 px-6 py-6 rounded-2xl shadow-2xl border text-center max-w-[280px]"
                    style={{
                      background: 'var(--sheet-bg)',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.15)',
                    }}
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[rgba(16,185,129,0.12)] text-[var(--emerald)] border border-[rgba(16,185,129,0.25)]">
                      <RefreshCw size={22} className="animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text)]">Fetching Reports</p>
                      <p className="text-xs font-medium text-[var(--text-muted)] mt-1">
                        Loading filings for {displayName}...
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Header ───────────────────────────────────────────────── */}
            <header
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                borderBottom: '1px solid var(--header-border)',
                background: 'var(--header-bg)',
              }}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-2)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  aria-label="Go back"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="flex items-center gap-2.5">
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      color: 'var(--emerald)',
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}
                  >
                    <FileText size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h1 className="text-base font-bold leading-tight line-clamp-1" style={{ color: 'var(--text)' }}>
                      {displayName}
                    </h1>
                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      {symbol} · Company Reports
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchDocs}
                  disabled={loading}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40"
                  style={{ color: 'var(--text-muted)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  aria-label="Refresh reports"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-muted)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {/* ── Scrollable content (full page) ────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto px-4"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              {/* Skeleton placeholders during initial load */}
              {loading && (!docs || docs.length === 0) && (
                <div className="pt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <DocSkeletonRow key={i} />
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <AlertCircle size={40} style={{ color: 'var(--loss)', opacity: 0.8 }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--loss)' }}>{error}</p>
                  <button
                    type="button"
                    onClick={fetchDocs}
                    className="text-sm font-semibold px-5 py-2 rounded-full"
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      color: 'var(--emerald)',
                      border: '1px solid rgba(16,185,129,0.25)',
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty */}
              {!loading && !error && docs && docs.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Inbox size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                  <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                    No reports for {displayName}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Company filings will appear here when available.
                  </p>
                </div>
              )}

              {/* ── Annual Reports section ──────────────────────────────────── */}
              {!error && docs && annualReports.length > 0 && (
                <section aria-label="Annual Reports" className="mt-3">
                  <p
                    className="py-2.5 text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
                  >
                    Annual Reports
                  </p>
                  <div
                    className="rounded-2xl overflow-hidden px-3"
                    style={{
                      border: '1px solid var(--card-border)',
                      background: 'var(--card-bg)',
                    }}
                  >
                    {annualReports.map((doc) => (
                      <DocRow key={doc.attachmentId || doc.title} doc={doc} showBadge={true} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Quarterly Results section ────────────────────────────── */}
              {!error && docs && sortedPeriods.length > 0 && (
                <section aria-label="Quarterly Results" className="mt-4">
                  <p
                    className="py-2.5 text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
                  >
                    Quarterly Results
                  </p>
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: '1px solid var(--card-border)',
                      background: 'var(--card-bg)',
                    }}
                  >
                    {sortedPeriods.map((period, idx) => (
                      <div
                        key={period}
                        className="px-3"
                        style={
                          idx < sortedPeriods.length - 1
                            ? { borderBottom: '1px solid var(--divider)' }
                            : {}
                        }
                      >
                        <QuarterSection
                          period={period}
                          docs={periodMap[period]}
                          defaultOpen={idx === 0}
                          onGenerateSummary={setSelectedSummaryDoc}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Other Documents section ───────────────────────────────── */}
              {!error && docs && others.length > 0 && (
                <section aria-label="Other Documents" className="mt-5">
                  <p
                    className="py-2.5 text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
                  >
                    Other Documents
                  </p>
                  <div
                    className="rounded-2xl overflow-hidden px-3"
                    style={{
                      border: '1px solid var(--card-border)',
                      background: 'var(--card-bg)',
                    }}
                  >
                    {others.map((doc) => (
                      <DocRow key={doc.attachmentId} doc={doc} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    <AISummaryScreen 
      isOpen={!!selectedSummaryDoc}
      onClose={() => setSelectedSummaryDoc(null)}
      doc={selectedSummaryDoc}
    />
    </>
  );
}
