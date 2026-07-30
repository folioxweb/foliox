/**
 * useNewsData — fetches news from the API.
 *
 * Sorting: publishedDate descending first, then publishedTime descending
 * within the same date (both are plain strings, e.g. "2026-07-27", "14:32:18").
 * String comparison works correctly for ISO date and HH:MM:SS time formats.
 *
 * Endpoints used:
 *   All news  → ?action=news
 *   One stock → ?action=news&symbol=HDFCBANK   (NSE:/BSE: prefix stripped)
 *
 * @param {'all'|'stock'} mode
 * @param {string|null}   symbol  — required when mode === 'stock'
 * @param {boolean}       enabled — set to false to skip fetching (lazy load)
 *
 * Returns { news, loading, error, refresh }
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';

/**
 * Sorts a news array: most-recent publishedDate first,
 * then most-recent publishedTime within the same date.
 */
function sortByDateThenTime(articles) {
  return [...articles].sort((a, b) => {
    // Compare dates descending ("2026-07-27" > "2026-07-26" lexicographically)
    const dateCmp = (b.publishedDate || '').localeCompare(a.publishedDate || '');
    if (dateCmp !== 0) return dateCmp;
    // Same date → compare times descending ("14:32:18" > "09:00:00")
    return (b.publishedTime || '').localeCompare(a.publishedTime || '');
  });
}

export function useNewsData(mode, symbol, enabled = true) {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Strip any exchange prefix like "NSE:" or "BSE:" → "HDFCBANK"
  const cleanSymbol = symbol ? symbol.replace(/^[^:]+:/, '') : null;

  const fetchNews = useCallback(async () => {
    // Don't fetch until the caller enables it (e.g. when the modal opens)
    if (!enabled) return;

    setLoading(true);
    setError(null);
    try {
      let data;
      if (mode === 'stock' && cleanSymbol) {
        // Calls: ?action=news&symbol=HDFCBANK
        data = await api.getStockNews(cleanSymbol);
      } else {
        // Calls: ?action=news
        data = await api.getNews();
      }
      // Sort by publishedDate desc, then publishedTime desc
      setNews(Array.isArray(data) ? sortByDateThenTime(data) : []);
    } catch (err) {
      setError(err?.message || 'Failed to load news');
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [mode, cleanSymbol, enabled]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { news, loading, error, refresh: fetchNews };
}
