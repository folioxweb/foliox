/**
 * stockChartService.js
 * Utility to fetch and parse Yahoo Finance historical & intraday OHLC candlestick data
 * for TradingView Lightweight Charts & Groww-style Line Charts.
 */

import { supabase } from './supabaseClient';

function toYahooSymbol(symbol) {
  if (!symbol) return 'TCS.NS';
  let s = String(symbol).trim();
  s = s.replace(/^NSE:/i, '').replace(/^BSE:/i, '');
  if (s.endsWith('.NS') || s.endsWith('.BO')) return s;
  return s + '.NS';
}

/**
 * Exact Groww Timeframe Configurations:
 * 1D: Today's intraday updated every 1 min
 * 1W: 1 Week data updated every 5 min
 * 1M: 1 Month data updated every 15 min
 * 3M: 3 Months data updated every 1 day
 * 6M: 6 Months data updated every 1 day
 * 1Y: 1 Year data updated every 1 day
 * 5Y: 5 Years data updated every 1 week
 * All: All historical data updated monthly
 */
export const GROWW_TIMEFRAMES = [
  { label: '1D', value: '1D', range: '1d', interval: '1m', isIntraday: true },
  { label: '1W', value: '1W', range: '5d', interval: '5m', isIntraday: true },
  { label: '1M', value: '1M', range: '1mo', interval: '15m', isIntraday: true },
  { label: '3M', value: '3M', range: '3mo', interval: '1d', isIntraday: false },
  { label: '6M', value: '6M', range: '6mo', interval: '1d', isIntraday: false },
  { label: '1Y', value: '1Y', range: '1y', interval: '1d', isIntraday: false },
  { label: '5Y', value: '5Y', range: '5y', interval: '1wk', isIntraday: false },
  { label: 'All', value: 'All', range: 'max', interval: '1mo', isIntraday: false },
];

export const TIMEFRAME_CONFIG = GROWW_TIMEFRAMES.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

function isValidNum(num) {
  return typeof num === 'number' && Number.isFinite(num) && !isNaN(num);
}

/**
 * Generate simulated fallback OHLC candles when real data fetch fails
 */
export function generateFallbackOHLC(basePrice = 2500, rangeKey = '1D') {
  const cfg = TIMEFRAME_CONFIG[rangeKey] || TIMEFRAME_CONFIG['1D'];
  const isIntraday = cfg.isIntraday;
  const candles = [];
  const volumeBars = [];
  let price = basePrice * 0.96;
  const now = new Date();

  if (isIntraday) {
    const points = rangeKey === '1D' ? 375 : rangeKey === '1W' ? 375 : 500;
    const intervalSecs = rangeKey === '1D' ? 60 : rangeKey === '1W' ? 300 : 900;
    const startTime = Math.floor(new Date().setHours(9, 15, 0, 0) / 1000);

    for (let i = 0; i < points; i++) {
      const timeVal = startTime + i * intervalSecs;
      const changePercent = (Math.random() - 0.48) * 0.008;
      const open = price;
      const close = price * (1 + changePercent);
      const high = Math.max(open, close) * (1 + Math.random() * 0.004);
      const low = Math.min(open, close) * (1 - Math.random() * 0.004);
      const vol = Math.floor(Math.random() * 50000) + 10000;

      candles.push({
        time: timeVal,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      });

      volumeBars.push({
        time: timeVal,
        value: vol,
        color: close >= open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      });

      price = close;
    }
  } else {
    const daysMap = { '3M': 90, '6M': 180, '1Y': 365, '5Y': 1825, 'All': 3650 };
    const days = daysMap[rangeKey] || 180;

    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      const dateStr = d.toISOString().split('T')[0];
      const changePercent = (Math.random() - 0.48) * 0.035;
      const open = price;
      const close = price * (1 + changePercent);
      const high = Math.max(open, close) * (1 + Math.random() * 0.015);
      const low = Math.min(open, close) * (1 - Math.random() * 0.015);
      const vol = Math.floor(Math.random() * 500000) + 100000;

      candles.push({
        time: dateStr,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      });

      volumeBars.push({
        time: dateStr,
        value: vol,
        color: close >= open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      });

      price = close;
    }
  }

  return {
    success: true,
    isFallback: true,
    candles,
    volumeBars,
  };
}

/**
 * Fetch Stock Candlestick / Line Data
 * @param {string} symbol - e.g. "NSE:TCS" or "TCS"
 * @param {string} rangeKey - "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "All"
 */
export async function fetchStockCandlesticks(symbol, rangeKey = '1D', basePrice = 2500) {
  const ySymbol = toYahooSymbol(symbol);
  const cfg = TIMEFRAME_CONFIG[rangeKey] || TIMEFRAME_CONFIG['1D'];
  const { range, interval, isIntraday } = cfg;

  // 1. Try Supabase Edge Function first
  try {
    if (supabase && typeof supabase.functions?.invoke === 'function') {
      const { data, error } = await supabase.functions.invoke('get-stock-chart', {
        body: { symbol: ySymbol, range, interval },
      });
      if (!error && data?.success && data?.candles?.length > 0) {
        return { ...data, isFallback: false };
      }
    }
  } catch (e) {
    console.warn('Supabase edge function get-stock-chart not reachable, trying direct fallback:', e.message);
  }

  // 2. Try direct public fetch / cors proxy
  try {
    const directUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=${interval}&range=${range}`;
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;

    const res = await fetch(corsProxyUrl).catch(() => fetch(directUrl));
    if (res.ok) {
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (result && result.timestamp && result.indicators?.quote?.[0]) {
        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];
        const opens = quote.open || [];
        const highs = quote.high || [];
        const lows = quote.low || [];
        const closes = quote.close || [];
        const volumes = quote.volume || [];

        const candles = [];
        const volumeBars = [];
        const seenDates = new Set();

        for (let i = 0; i < timestamps.length; i++) {
          const open = opens[i];
          const high = highs[i];
          const low = lows[i];
          const close = closes[i];
          const vol = volumes[i] ?? 0;

          if (!isValidNum(open) || !isValidNum(high) || !isValidNum(low) || !isValidNum(close)) continue;

          let timeVal;
          if (isIntraday) {
            timeVal = timestamps[i]; // UNIX timestamp in seconds
          } else {
            timeVal = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
            if (seenDates.has(timeVal)) continue;
            seenDates.add(timeVal);
          }

          candles.push({
            time: timeVal,
            open: Number(open.toFixed(2)),
            high: Number(high.toFixed(2)),
            low: Number(low.toFixed(2)),
            close: Number(close.toFixed(2)),
          });

          volumeBars.push({
            time: timeVal,
            value: Number(vol),
            color: close >= open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
          });
        }

        if (candles.length > 0) {
          return {
            success: true,
            symbol: ySymbol,
            candles,
            volumeBars,
            isFallback: false,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Direct fetch failed, returning simulated OHLC data:', err.message);
  }

  // 3. Fallback to simulated OHLC
  return generateFallbackOHLC(basePrice, rangeKey);
}
