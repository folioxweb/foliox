import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertCircle, Inbox, Newspaper, X } from 'lucide-react';
import { useNewsData } from '../../hooks/useNewsData';
import NewsCard from '../../components/ui/NewsCard';
import Skeleton from '../../components/ui/Skeleton';

// ── Skeleton for loading state ──────────────────────────────────────────────
function NewsSkeletonCard() {
  return (
    <div
      className="flex items-start gap-3 py-3.5"
      style={{ borderBottom: '1px solid var(--divider)' }}
    >
      <div className="flex-shrink-0 mt-1.5 w-4 flex justify-center">
        <Skeleton width={8} height={8} rounded="full" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <Skeleton width="90%" height={13} rounded="md" />
        <Skeleton width="70%" height={13} rounded="md" />
        <div className="flex gap-2">
          <Skeleton width="22%" height={10} rounded="full" />
          <Skeleton width="14%" height={10} rounded="full" />
          <Skeleton width="16%" height={16} rounded="full" />
        </div>
      </div>
      <Skeleton width={14} height={14} rounded="md" />
    </div>
  );
}

/**
 * StockNewsScreen — Full-page modal showing news for a specific stock.
 *
 * Replaces bottom-sheet to ensure 100% smooth native scrolling on iOS and mobile devices.
 *
 * Props:
 *   holding  — the holding object ({ name, symbol, company? })
 *   isOpen   — boolean controlling visibility
 *   onClose  — called to dismiss
 */
export default function StockNewsScreen({ holding, isOpen, onClose }) {
  const symbol = holding?.symbol ?? null;
  const { news, loading, error, refresh } = useNewsData('stock', symbol, isOpen);

  const displayName = holding?.company || holding?.name || symbol || '';
  const unreadCount = (news || []).filter((n) => !n.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && holding && (
        <>
          {/* Backdrop */}
          <motion.div
            key="stock-news-backdrop"
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
            key="stock-news-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`News for ${displayName}`}
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
                      <p className="text-sm font-bold text-[var(--text)]">Fetching Stock News</p>
                      <p className="text-xs font-medium text-[var(--text-muted)] mt-1">
                        Loading news for {displayName}...
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
                    <Newspaper size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h1 className="text-base font-bold leading-tight line-clamp-1" style={{ color: 'var(--text)' }}>
                      {displayName}
                    </h1>
                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      {symbol} · Latest News
                      {unreadCount > 0 && (
                        <span style={{ color: 'var(--emerald)' }}> · {unreadCount} unread</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refresh}
                  disabled={loading}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40"
                  style={{ color: 'var(--text-muted)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  aria-label="Refresh news"
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

            {/* ── News content (scrollable full-page) ────────────────────── */}
            <div
              className="flex-1 overflow-y-auto px-4"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              {/* Skeleton placeholders during initial load */}
              {loading && (!news || news.length === 0) && (
                <div className="pt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <NewsSkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <AlertCircle size={40} style={{ color: 'var(--loss)', opacity: 0.8 }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--loss)' }}>
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={refresh}
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

              {/* Empty state */}
              {!loading && !error && news && news.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Inbox size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                  <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                    No news for {displayName}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No recent articles found for this stock.
                  </p>
                </div>
              )}

              {/* News articles */}
              {!error && news && news.length > 0 &&
                news.map((article) => (
                  <NewsCard
                    key={article.guid}
                    article={article}
                    showCompany={false}
                  />
                ))
              }
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
