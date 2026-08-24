import { motion, AnimatePresence } from 'framer-motion';
import { X, Newspaper, RefreshCw, AlertCircle, Inbox } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useCallback, useRef } from 'react';
import { useNewsData } from '../../hooks/useNewsData';
import NewsCard from '../../components/ui/NewsCard';
import Skeleton from '../../components/ui/Skeleton';

// ── Skeleton placeholder for loading state ──────────────────────────────────
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
        <Skeleton width="35%" height={10} rounded="full" />
        <Skeleton width="90%" height={13} rounded="md" />
        <Skeleton width="70%" height={13} rounded="md" />
        <div className="flex gap-2">
          <Skeleton width="20%" height={10} rounded="full" />
          <Skeleton width="14%" height={10} rounded="full" />
          <Skeleton width="16%" height={16} rounded="full" />
        </div>
      </div>
      <Skeleton width={14} height={14} rounded="md" />
    </div>
  );
}

/**
 * NewsPage — full-screen overlay showing all latest news across all stocks,
 * sorted newest-first. Accessed via the newspaper icon in the Portfolio top bar.
 *
 * Rendered as a slide-up full-screen overlay via Portal to avoid z-index issues.
 * Dismissible via:
 *   - close button (X)
 *   - Escape key
 *   - backdrop click
 */
export default function NewsPage({ isOpen, onClose }) {
  const { news, loading, error, refresh } = useNewsData('all', null, isOpen);
  const containerRef = useRef(null);

  // Escape key handler
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
  }, [onClose]);

  // Body scroll lock + keyboard
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Group news by date label
  function groupByDate(articles) {
    const groups = {};
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    (articles || []).forEach((a) => {
      let label = a.publishedDate;
      if (label === today) label = 'Today';
      else if (label === yesterday) label = 'Yesterday';
      else {
        try {
          label = new Date(a.publishedDate).toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short',
          });
        } catch {
          // keep raw date
        }
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(a);
    });
    return groups;
  }

  const grouped = groupByDate(news);
  const unreadCount = (news || []).filter((n) => !n.isRead).length;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="news-page-backdrop"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Full-screen panel */}
          <motion.div
            key="news-page-panel"
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Market News"
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
                      <p className="text-sm font-bold text-[var(--text)]">Fetching Market News</p>
                      <p className="text-xs font-medium text-[var(--text-muted)] mt-1">
                        Loading latest headlines...
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
              <div className="flex items-center gap-2.5">
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-xl"
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    color: 'var(--emerald)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  <Newspaper size={18} aria-hidden="true" />
                </span>
                <div>
                  <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                    Market News
                  </h1>
                  {unreadCount > 0 && (
                    <p className="text-[11px] font-medium" style={{ color: 'var(--emerald)' }}>
                      {unreadCount} unread
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Refresh */}
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

                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-muted)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  aria-label="Close news"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {/* ── News content (scrollable) ─────────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              {/* Skeleton placeholders during initial load */}
              {loading && (!news || news.length === 0) && (
                <div className="px-4 pt-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <NewsSkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
                  <AlertCircle size={40} style={{ color: 'var(--loss)', opacity: 0.8 }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--loss)' }}>
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={refresh}
                    className="text-sm font-semibold px-5 py-2 rounded-full transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.25)' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && (!news || news.length === 0) && (
                <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <Newspaper size={26} className="text-emerald-400" />
                  </div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                    No News for Your Portfolio
                  </h3>
                  <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--text-muted)' }}>
                    Add stocks to get news updates. Real-time news and corporate announcements will appear here for your holdings.
                  </p>
                </div>
              )}

              {/* Grouped news list */}
              {!error && news && news.length > 0 && (
                <div className="px-4">
                  {Object.entries(grouped).map(([dateLabel, articles]) => (
                    <section key={dateLabel} aria-label={dateLabel}>
                      {/* Date section header */}
                      <div
                        className="sticky top-0 z-10 py-2 text-xs font-bold uppercase tracking-wider"
                        style={{
                          color: 'var(--text-muted)',
                          background: 'var(--bg)',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {dateLabel}
                      </div>

                      {/* Articles for this date */}
                      {articles.map((article) => (
                        <NewsCard
                          key={article.guid}
                          article={article}
                          showCompany={true}
                        />
                      ))}
                    </section>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
