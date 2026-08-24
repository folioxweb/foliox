/**
 * useNewsData — fetches news from the API.
 *
 * Checks PortfolioContext for prefetched data first. If prefetched news is
 * already available when the screen opens, it is used instantly with no
 * loading state. For stock-specific news it filters the prefetched all-news
 * array by symbol. The user can still hit Refresh to force a fresh API call.
 *
 * Sorting: publishedDate descending first, then publishedTime descending.
 *
 * @param {'all'|'stock'} mode
 * @param {string|null}   symbol  — required when mode === 'stock'
 * @param {boolean}       enabled — set to false to skip fetching (lazy load)
 *
 * Returns { news, loading, error, refresh }
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';
import { usePortfolio } from '../context/PortfolioContext';

/**
 * Sorts a news array: most-recent publishedDate first,
 * then most-recent publishedTime within the same date.
 */
function sortByDateThenTime(articles) {
  return [...articles].sort((a, b) => {
    const dateCmp = (b.publishedDate || '').localeCompare(a.publishedDate || '');
    if (dateCmp !== 0) return dateCmp;
    return (b.publishedTime || '').localeCompare(a.publishedTime || '');
  });
}

export function useNewsData(mode, symbol, enabled = true) {
  const { prefetchedNews, prefetchedStockNews } = usePortfolio();

  // Strip any exchange prefix like "NSE:" or "BSE:" → "HDFCBANK"
  const cleanSymbol = symbol ? symbol.replace(/^[^:]+:/, '') : null;

  // ── Seed from prefetch if available ──────────────────────────────────────
  function getPrefetchedNews() {
    if (mode === 'stock' && cleanSymbol) {
      const stockPrefetched = prefetchedStockNews?.[cleanSymbol]?.data;
      if (Array.isArray(stockPrefetched) && stockPrefetched.length > 0) {
        return sortByDateThenTime(stockPrefetched);
      }
      return null;
    }

    const allPrefetched = prefetchedNews?.data;
    if (Array.isArray(allPrefetched) && allPrefetched.length > 0) {
      return sortByDateThenTime(allPrefetched);
    }
    return null;
  }

  const [localNews, setLocalNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear stale local news whenever symbol or mode changes
  useEffect(() => {
    setLocalNews(null);
    setError(null);
  }, [cleanSymbol, mode]);

  // Fallback to prefetched news if we haven't manually fetched yet
  const prefetched = getPrefetchedNews();
  const activeNews = localNews || prefetched;

  const fetchNews = useCallback(async () => {
    if (!enabled) return;
    if (mode === 'stock' && !cleanSymbol) return;

    setLoading(true);
    setError(null);
    try {
      let data;
      if (mode === 'stock' && cleanSymbol) {
        data = await api.getStockNews(cleanSymbol);
      } else {
        data = await api.getNews();
      }
      setLocalNews(Array.isArray(data) ? sortByDateThenTime(data) : []);
    } catch (err) {
      setError(err?.message || 'Failed to load news');
      setLocalNews([]);
    } finally {
      setLoading(false);
    }
  }, [mode, cleanSymbol, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (mode === 'stock' && !cleanSymbol) return;

    // Check if we have prefetched data specifically for this symbol/mode
    const pre = getPrefetchedNews();
    if (pre && pre.length > 0) {
      setLocalNews(pre);
      return;
    }

    fetchNews();
  }, [enabled, cleanSymbol, mode, fetchNews]);

  return { news: activeNews, loading, error, refresh: fetchNews };
}
