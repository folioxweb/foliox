import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, AlertCircle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, Info, ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/apiClient';

export default function AISummaryScreen({ isOpen, onClose, doc }) {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const loadingMessages = [
    "Initializing neural pathways...",
    "Extracting key financial highlights...",
    "Analyzing market sentiment...",
    "Synthesizing management commentary...",
    "Cross-referencing historical earnings...",
    "Scanning for hidden risks...",
    "Translating corporate speak...",
    "Identifying forward-looking statements...",
    "Crunching the numbers with precision...",
    "Finalizing executive summary..."
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % loadingMessages.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Trigger API call when screen opens
  useEffect(() => {
    if (!isOpen) return;

    const docId = doc?.attachmentId || doc?.documentId || doc?.id;
    if (!docId) {
      setLoading(false);
      setError('Document ID is missing. Cannot generate summary.');
      return;
    }

    setLoading(true);
    setError(null);
    setSummaryData(null);

    api.summarizeDocument(docId)
      .then(response => {
        // apiPost unwraps .data, so response is the data object itself
        const summary = response?.aiSummary || response?.data?.aiSummary;
        if (summary) {
          setSummaryData(summary);
        } else {
          setError('Failed to generate summary. Please try again.');
        }
      })
      .catch(err => {
        console.error('AI Summary Error:', err);
        setError('An error occurred while generating the summary.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, doc]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSummaryData(null);
      setError(null);
      setLoading(true);
    }
  }, [isOpen]);

  const sentimentColor = (s) => {
    if (!s) return 'var(--text-muted)';
    const sl = s.toLowerCase();
    if (sl === 'positive') return '#10b981';
    if (sl === 'negative') return '#ef4444';
    return '#9ca3af';
  };

  const SentimentIcon = ({ s }) => {
    if (!s) return null;
    const sl = s.toLowerCase();
    if (sl === 'positive') return <TrendingUp size={14} />;
    if (sl === 'negative') return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ai-summary-screen"
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ background: 'var(--bg)' }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <header
            className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
            style={{
              borderBottom: '1px solid var(--header-border)',
              background: 'var(--header-bg)',
              paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
            }}
          >
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70 flex-shrink-0"
              style={{ color: 'var(--text-2)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold leading-tight truncate" style={{ color: 'var(--text)' }}>
                AI Document Summary
              </h1>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {doc?.title || doc?.attachmentName || 'Company Report'}
              </p>
            </div>
            <div
              className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--emerald)' }}
            >
              <Sparkles size={18} />
            </div>
          </header>

          {/* ── Loading ─────────────────────────────────────────────── */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={22} style={{ color: 'var(--emerald)' }} />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                  Analyzing Document...
                </p>
                <div className="h-10 mt-1.5 overflow-hidden flex items-start justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingMsgIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm px-4"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {loadingMessages[loadingMsgIdx]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────────────── */}
          {error && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
              <AlertCircle size={48} className="text-red-500" />
              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Generation Failed</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{error}</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl font-medium"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--card-border)' }}
              >
                Go Back
              </button>
            </div>
          )}

          {/* ── Content ─────────────────────────────────────────────── */}
          {summaryData && !loading && (
            <div
              className="flex-1 overflow-y-auto overscroll-y-contain"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
            >
              <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">

                {/* Type + Sentiment badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {summaryData.announcementType && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      {summaryData.announcementType}
                    </span>
                  )}
                  {summaryData.sentiment && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"
                      style={{
                        background: `${sentimentColor(summaryData.sentiment)}18`,
                        color: sentimentColor(summaryData.sentiment),
                        border: `1px solid ${sentimentColor(summaryData.sentiment)}30`,
                      }}
                    >
                      <SentimentIcon s={summaryData.sentiment} />
                      {summaryData.sentiment}
                    </span>
                  )}
                  {summaryData.marketImpact && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                    >
                      {summaryData.marketImpact} Impact
                    </span>
                  )}
                </div>

                {/* Summary paragraph */}
                {summaryData.summary && (
                  <div
                    className="p-4 rounded-2xl"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                      {summaryData.summary}
                    </p>
                  </div>
                )}

                {/* Important Numbers — chips grid */}
                {summaryData.importantNumbers?.length > 0 && (
                  <Section label="Important Numbers" icon={<TrendingUp size={15} className="text-emerald-400" />}>
                    <div className="grid grid-cols-2 gap-2.5 mt-3">
                      {summaryData.importantNumbers.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl flex flex-col gap-0.5"
                          style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}
                        >
                          {typeof item === 'object' ? (
                            <>
                              <span className="text-[10px] font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                              <span className="text-sm font-bold" style={{ color: 'var(--emerald)' }}>{item.value}</span>
                            </>
                          ) : (
                            <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{item}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Key Takeaways */}
                {summaryData.keyTakeaways?.length > 0 && (
                  <Section label="Key Takeaways" icon={<CheckCircle2 size={15} className="text-emerald-400" />}>
                    <BulletList items={summaryData.keyTakeaways} color="var(--emerald)" />
                  </Section>
                )}

                {/* Financial Highlights */}
                {summaryData.financialHighlights?.length > 0 && (
                  <Section label="Financial Highlights" icon={<TrendingUp size={15} className="text-blue-400" />}>
                    <BulletList items={summaryData.financialHighlights} color="#60a5fa" />
                  </Section>
                )}

                {/* Positives & Negatives */}
                {(summaryData.positives?.length > 0 || summaryData.negatives?.length > 0) && (
                  <div className="grid grid-cols-1 gap-3">
                    {summaryData.positives?.length > 0 && (
                      <div
                        className="p-4 rounded-2xl"
                        style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}
                      >
                        <SectionTitle label="Positives" icon={<TrendingUp size={15} className="text-emerald-400" />} />
                        <BulletList items={summaryData.positives} color="#10b981" />
                      </div>
                    )}
                    {summaryData.negatives?.length > 0 && (
                      <div
                        className="p-4 rounded-2xl"
                        style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}
                      >
                        <SectionTitle label="Negatives / Concerns" icon={<TrendingDown size={15} className="text-red-400" />} />
                        <BulletList items={summaryData.negatives} color="#ef4444" />
                      </div>
                    )}
                  </div>
                )}

                {/* Risks */}
                {summaryData.risks?.length > 0 && (
                  <div
                    className="p-4 rounded-2xl"
                    style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}
                  >
                    <SectionTitle label="Key Risks" icon={<ShieldAlert size={15} className="text-amber-400" />} />
                    <BulletList items={summaryData.risks} color="#f59e0b" />
                  </div>
                )}

                {/* Management Commentary */}
                {summaryData.managementCommentary && (
                  <Section label="Management Commentary" icon={<Info size={15} className="text-indigo-400" />}>
                    <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text-muted)' }}>
                      {summaryData.managementCommentary}
                    </p>
                  </Section>
                )}

                {/* Future Outlook */}
                {summaryData.futureOutlook && (
                  <Section label="Future Outlook" icon={<TrendingUp size={15} className="text-purple-400" />}>
                    <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text-muted)' }}>
                      {summaryData.futureOutlook}
                    </p>
                  </Section>
                )}

              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionTitle({ label, icon }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
    </div>
  );
}

function Section({ label, icon, children }) {
  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <SectionTitle label={label} icon={icon} />
      {children}
    </div>
  );
}

function BulletList({ items, color }) {
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
          {item}
        </li>
      ))}
    </ul>
  );
}
