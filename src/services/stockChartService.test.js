import { describe, it, expect, vi } from 'vitest';
import { fetchStockCandlesticks, generateFallbackOHLC } from './stockChartService';

describe('stockChartService', () => {
  it('generates valid simulated OHLC fallback data', () => {
    const res = generateFallbackOHLC(3000, 30);
    expect(res.success).toBe(true);
    expect(res.isFallback).toBe(true);
    expect(res.candles.length).toBeGreaterThan(0);
    expect(res.volumeBars.length).toEqual(res.candles.length);

    const firstCandle = res.candles[0];
    expect(firstCandle).toHaveProperty('time');
    expect(firstCandle).toHaveProperty('open');
    expect(firstCandle).toHaveProperty('high');
    expect(firstCandle).toHaveProperty('low');
    expect(firstCandle).toHaveProperty('close');
    expect(firstCandle.high).toBeGreaterThanOrEqual(firstCandle.low);
  });

  it('fetches stock candlesticks with fallback on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const res = await fetchStockCandlesticks('NSE:TCS', '6M', 3500);
    expect(res.success).toBe(true);
    expect(res.candles.length).toBeGreaterThan(0);
  });
});
