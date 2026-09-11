import { describe, it, expect, vi } from 'vitest';
import { supabase, supabaseApi } from './supabaseClient.js';

describe('Supabase Client API', () => {
  it('should export all required portfolio methods', () => {
    expect(typeof supabaseApi.getDashboard).toBe('function');
    expect(typeof supabaseApi.getPortfolio).toBe('function');
    expect(typeof supabaseApi.getOverallInvestments).toBe('function');
    expect(typeof supabaseApi.getAssetAllocation).toBe('function');
    expect(typeof supabaseApi.getOverallSectorAllocation).toBe('function');
    expect(typeof supabaseApi.getStocksAllocation).toBe('function');
    expect(typeof supabaseApi.getStocks).toBe('function');
    expect(typeof supabaseApi.getEtfs).toBe('function');
    expect(typeof supabaseApi.getMutualFunds).toBe('function');
    expect(typeof supabaseApi.getFDs).toBe('function');
  });

  it('should export all required news & documents methods', () => {
    expect(typeof supabaseApi.getNews).toBe('function');
    expect(typeof supabaseApi.getStockNews).toBe('function');
    expect(typeof supabaseApi.getCompanyDocuments).toBe('function');
    expect(typeof supabaseApi.summarizeDocument).toBe('function');
  });

  it('should export all required trade & mutation methods', () => {
    expect(typeof supabaseApi.buyMore).toBe('function');
    expect(typeof supabaseApi.updateHolding).toBe('function');
    expect(typeof supabaseApi.sellHolding).toBe('function');
    expect(typeof supabaseApi.addHolding).toBe('function');
    expect(typeof supabaseApi.updateFD).toBe('function');
    expect(typeof supabaseApi.deleteFD).toBe('function');
  });

  it('should export all required IPO methods', () => {
    expect(typeof supabaseApi.getIpos).toBe('function');
    expect(typeof supabaseApi.getIpoById).toBe('function');
    expect(typeof supabaseApi.getIpoGmpHistory).toBe('function');
  });

  describe('In-flight request deduplication', () => {
    it('deduplicates concurrent getStocks calls', async () => {
      let resolveQuery;
      const delayedPromise = new Promise((resolve) => {
        resolveQuery = resolve;
      });

      const orderMock = vi.fn().mockReturnValue(delayedPromise);
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ select: selectMock });

      const call1 = supabaseApi.getStocks();
      const call2 = supabaseApi.getStocks();

      resolveQuery({
        data: [{ id: 1, symbol: 'INFY', name: 'Infosys', asset_type: 'STOCK', current_value: 1000 }],
        error: null,
      });

      const [res1, res2] = await Promise.all([call1, call2]);

      expect(fromSpy).toHaveBeenCalledTimes(1);
      expect(res1).toEqual(res2);
      expect(res1[0].symbol).toBe('INFY');

      // Subsequent call after in-flight completes triggers a new query
      const freshOrderMock = vi.fn().mockResolvedValue({
        data: [{ id: 1, symbol: 'INFY', name: 'Infosys', asset_type: 'STOCK', current_value: 1050 }],
        error: null,
      });
      fromSpy.mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: freshOrderMock }) }),
      });

      await supabaseApi.getStocks();
      expect(fromSpy).toHaveBeenCalledTimes(2);

      fromSpy.mockRestore();
    });

    it('deduplicates concurrent getNews calls', async () => {
      let resolveQuery;
      const delayedPromise = new Promise((resolve) => {
        resolveQuery = resolve;
      });

      const orderMock = vi.fn().mockReturnValue(delayedPromise);
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ select: selectMock });

      const call1 = supabaseApi.getNews();
      const call2 = supabaseApi.getNews();

      resolveQuery({
        data: [{ guid: 'news-1', title: 'Market Rally', published_at: '2026-09-11T10:00:00Z', url: 'https://example.com' }],
        error: null,
      });

      const [res1, res2] = await Promise.all([call1, call2]);

      expect(fromSpy).toHaveBeenCalledTimes(1);
      expect(res1).toEqual(res2);
      expect(res1[0].title).toBe('Market Rally');

      fromSpy.mockRestore();
    });
  });
});


