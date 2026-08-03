import { ExternalLink, Clock, Newspaper } from 'lucide-react';

/**
 * Converts a publishedAt ISO string or (date + time) to a relative label.
 * e.g. "2 hours ago", "Yesterday", "Jul 24"
 */
function formatRelativeTime(publishedAt) {
  if (!publishedAt) return '';
  const now = new Date();
  const pub = new Date(publishedAt);
  if (isNaN(pub.getTime())) return publishedAt;

  const diffMs = now - pub;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return pub.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * CategoryBadge — small pill for article category.
 */
function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span
      className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{
        background: 'rgba(16, 185, 129, 0.12)',
        color: 'var(--emerald)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
      }}
    >
      {category}
    </span>
  );
}

/**
 * NewsCard — a single pressable article card.
 *
 * Tapping opens the article link in a new browser tab.
 * Unread articles appear with a small accent dot.
 * Read articles appear slightly dimmed.
 *
 * Props:
 *   article  — news object from the API
 *   showCompany — whether to show the company name (true for "all news" feed)
 */
export default function NewsCard({ article, showCompany = false }) {
  const {
    guid,
    title,
    source,
    company,
    publishedAt,
    link,
    isRead,
    category,
  } = article;

  const articleUrl = link || article.url;

  function handleClick(e) {
    e.stopPropagation();
    if (articleUrl) {
      window.open(articleUrl, '_blank', 'noopener,noreferrer');
    }
  }

  const relativeTime = formatRelativeTime(publishedAt);

  return (
    <button
      type="button"
      id={`news-card-${guid}`}
      onClick={handleClick}
      className="w-full text-left"
      aria-label={`Read article: ${title}`}
      style={{ opacity: isRead ? 0.72 : 1 }}
    >
      <div
        className="flex items-start gap-3 py-3.5"
        style={{ borderBottom: '1px solid var(--divider)' }}
      >
        {/* Unread indicator dot */}
        <div className="flex-shrink-0 mt-1.5 flex items-center justify-center w-4">
          {!isRead && (
            <span
              className="block w-2 h-2 rounded-full"
              style={{ background: 'var(--emerald)', flexShrink: 0 }}
              aria-label="Unread"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Company name (shown in all-news feed) */}
          {showCompany && company && (
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--emerald)' }}
            >
              {company} · {article.symbol}
            </span>
          )}

          {/* Title */}
          <p
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--text)' }}
          >
            {title}
          </p>

          {/* Meta row: source · time · category */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {source}
            </span>
            {relativeTime && (
              <>
                <span style={{ color: 'var(--divider)' }}>·</span>
                <span
                  className="text-[11px] flex items-center gap-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Clock size={10} />
                  {relativeTime}
                </span>
              </>
            )}
            {category && (
              <>
                <span style={{ color: 'var(--divider)' }}>·</span>
                <CategoryBadge category={category} />
              </>
            )}
          </div>
        </div>

        {/* External link icon */}
        <ExternalLink
          size={14}
          className="flex-shrink-0 mt-1"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}
