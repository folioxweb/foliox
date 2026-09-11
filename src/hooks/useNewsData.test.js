import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNewsData } from './useNewsData';
import * as PortfolioContextModule from '../context/PortfolioContext';
import { api } from '../services/apiClient';

vi.mock('../context/PortfolioContext', () => ({
  usePortfolio: vi.fn(),
}));

vi.mock('../services/apiClient', () => ({
  api: {
    getNews: vi.fn(),
    getStockNews: vi.fn(),
    markNewsAsRead: vi.fn(),
  },
}));

describe('useNewsData Hook', () => {
  it('correctly sorts articles by publishedAt timestamp descending', async () => {
    const mockArticles = [
      { guid: '1', title: 'Older Article', publishedAt: '2026-09-08T10:00:00Z', symbol: 'TCS' },
      { guid: '2', title: 'Newest Article', publishedAt: '2026-09-10T15:30:00Z', symbol: 'TCS' },
      { guid: '3', title: 'Middle Article', publishedAt: '2026-09-09T12:00:00Z', symbol: 'TCS' },
    ];

    PortfolioContextModule.usePortfolio.mockReturnValue({
      prefetchedNews: { data: [] },
      prefetchedStockNews: {},
    });

    api.getNews.mockResolvedValue(mockArticles);

    const { result } = renderHook(() => useNewsData('all', null, true));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.news).toHaveLength(3);
    expect(result.current.news[0].guid).toBe('2'); // 2026-09-10
    expect(result.current.news[1].guid).toBe('3'); // 2026-09-09
    expect(result.current.news[2].guid).toBe('1'); // 2026-09-08
  });

  it('uses prefetched stock news instantly without loading state', () => {
    const prefetchedStock = [
      { guid: 's1', title: 'HDFC Bank Q1 Results', publishedAt: '2026-09-11T08:00:00Z', symbol: 'HDFCBANK' },
    ];

    PortfolioContextModule.usePortfolio.mockReturnValue({
      prefetchedNews: { data: [] },
      prefetchedStockNews: {
        HDFCBANK: { data: prefetchedStock },
      },
    });

    const { result } = renderHook(() => useNewsData('stock', 'HDFCBANK', true));

    expect(result.current.news).toHaveLength(1);
    expect(result.current.news[0].guid).toBe('s1');
    expect(api.getStockNews).not.toHaveBeenCalled();
  });

  it('extracts stock-specific news from all-news cache in memory', () => {
    const allArticles = [
      { guid: 'a1', title: 'TCS deal', publishedAt: '2026-09-10T08:00:00Z', symbol: 'TCS' },
      { guid: 'a2', title: 'Infosys results', publishedAt: '2026-09-11T08:00:00Z', symbol: 'INFY' },
      { guid: 'a3', title: 'TCS & Infosys rally', publishedAt: '2026-09-11T09:00:00Z', symbol: 'TCS', symbols: ['TCS', 'INFY'] },
    ];

    PortfolioContextModule.usePortfolio.mockReturnValue({
      prefetchedNews: { data: allArticles },
      prefetchedStockNews: {},
    });

    const { result } = renderHook(() => useNewsData('stock', 'INFY', true));

    expect(result.current.news).toHaveLength(2);
    expect(result.current.news.map(n => n.guid)).toContain('a2');
    expect(result.current.news.map(n => n.guid)).toContain('a3');
  });
});
