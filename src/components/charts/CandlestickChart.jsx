import React, { useEffect, useRef, useState, useId, Component } from 'react';
import { createChart, ColorType, CrosshairMode, AreaSeries, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { ExternalLink, CandlestickChart as CandlestickIcon, LineChart as LineIcon } from 'lucide-react';
import { fetchStockCandlesticks, GROWW_TIMEFRAMES, TIMEFRAME_CONFIG } from '../../services/stockChartService';
import { formatCurrency } from '../../utils/formatters';

function normalizeTime(timeVal, rangeKey) {
  if (!timeVal) return '2026-01-01';
  const isIntraday = TIMEFRAME_CONFIG[rangeKey]?.isIntraday ?? false;

  if (isIntraday) {
    if (typeof timeVal === 'number') return timeVal;
    const t = new Date(timeVal).getTime();
    return isNaN(t) ? 1700000000 : Math.floor(t / 1000);
  }

  if (typeof timeVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(timeVal)) {
    return timeVal;
  }

  if (typeof timeVal === 'number') {
    const d = new Date(timeVal * 1000);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const d = new Date(timeVal);
  if (isNaN(d.getTime())) return '2026-01-01';
  return d.toISOString().split('T')[0];
}

function isValidNum(num) {
  return typeof num === 'number' && Number.isFinite(num) && !isNaN(num);
}

function sanitizeChartData(items, rangeKey = '1D') {
  if (!Array.isArray(items) || items.length === 0) return [];

  const valid = items.filter(
    (item) =>
      item &&
      item.time != null &&
      isValidNum(item.open) &&
      isValidNum(item.high) &&
      isValidNum(item.low) &&
      isValidNum(item.close)
  );

  const processed = valid.map((item) => ({
    ...item,
    time: normalizeTime(item.time, rangeKey),
    open: Number(item.open),
    high: Number(item.high),
    low: Number(item.low),
    close: Number(item.close),
  }));

  const sorted = [...processed].sort((a, b) => {
    const valA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime();
    const valB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime();
    return valA - valB;
  });

  const unique = [];
  const seenTimes = new Set();
  for (const item of sorted) {
    const key = String(item.time);
    if (!seenTimes.has(key)) {
      seenTimes.add(key);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Format Tooltip Timestamp for Intraday (1D/1W/1M) and Historical (3M/6M/1Y/5Y/All)
 */
function formatTooltipTime(timeVal, rangeKey) {
  if (!timeVal) return '';
  const isIntraday = TIMEFRAME_CONFIG[rangeKey]?.isIntraday ?? false;

  if (typeof timeVal === 'object' && timeVal !== null && 'year' in timeVal && 'month' in timeVal && 'day' in timeVal) {
    const d = new Date(Date.UTC(timeVal.year, timeVal.month - 1, timeVal.day));
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  if (isIntraday) {
    let tSec = typeof timeVal === 'number' ? timeVal : Math.floor(new Date(timeVal).getTime() / 1000);
    if (isNaN(tSec)) return String(timeVal);
    const d = new Date(tSec * 1000);

    if (rangeKey === '1D') {
      return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    } else {
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    }
  }

  if (typeof timeVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(timeVal)) {
    const [year, month, day] = timeVal.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  const d = typeof timeVal === 'number' ? new Date(timeVal * 1000) : new Date(timeVal);
  if (isNaN(d.getTime())) return String(timeVal);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Pure SVG Fallback Renderer
 */
function SVGCandlestickFallback({ candles = [], height = 260, isIntraday = false, chartType = 'line', isUp = true }) {
  if (!candles || candles.length === 0) return null;

  const svgWidth = 750;
  const padding = { top: 15, right: 10, bottom: 25, left: 10 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const prices = chartType === 'line' ? candles.map((c) => c.close) : candles.flatMap((c) => [c.low, c.high]);
  const minLow = Math.min(...prices);
  const maxHigh = Math.max(...prices);
  const priceRange = Math.max(1, maxHigh - minLow);

  const getY = (price) =>
    padding.top + chartH - ((price - minLow) / priceRange) * chartH;

  const candleCount = candles.length;
  const step = chartW / Math.max(1, candleCount);
  const candleW = Math.max(2, Math.min(10, step * 0.75));

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const price = minLow + ratio * priceRange;
    const y = padding.top + chartH - ratio * chartH;
    return { price, y };
  });

  const lineColor = isUp ? '#22c55e' : '#ef4444';

  const points = candles.map((c, i) => {
    const x = padding.left + i * step + step / 2;
    const y = getY(c.close);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = points.length ? `M ${points.join(' L ')}` : '';
  const areaPath = points.length
    ? `M ${padding.left + step / 2},${padding.top + chartH} L ${points.join(' L ')} L ${padding.left + (candleCount - 0.5) * step},${padding.top + chartH} Z`
    : '';

  return (
    <div className="w-full h-full relative">
      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="w-full h-full text-[var(--text-muted)] overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="growwSvgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, idx) => (
          <line
            key={`ytick-${idx}`}
            x1={padding.left}
            y1={t.y}
            x2={svgWidth - padding.right}
            y2={t.y}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeDasharray="4,4"
          />
        ))}

        {chartType === 'line' ? (
          <>
            <path d={areaPath} fill="url(#growwSvgGrad)" />
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          candles.map((c, i) => {
            const x = padding.left + i * step + step / 2;
            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const cIsUp = c.close >= c.open;
            const bodyY = Math.min(yOpen, yClose);
            const bodyH = Math.max(2, Math.abs(yOpen - yClose));
            const cColor = cIsUp ? '#22c55e' : '#ef4444';
            const borderColor = cIsUp ? '#15803d' : '#b91c1c';

            return (
              <g key={`c-${i}`}>
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={borderColor} strokeWidth="1.2" />
                <rect x={x - candleW / 2} y={bodyY} width={candleW} height={bodyH} fill={cColor} stroke={borderColor} strokeWidth="0.8" rx="0" />
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}

class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CandlestickChart Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full rounded-2xl p-4 my-2 border border-[var(--card-border)] bg-[var(--card-bg)] text-center text-xs text-[var(--text-muted)]">
          Interactive stock chart currently unavailable.
        </div>
      );
    }
    return this.props.children;
  }
}

function CandlestickChartInner({
  symbol = 'TCS.NS',
  stockName = 'Stock',
  currentPrice = 0,
  height = 260,
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [activeRange, setActiveRange] = useState('1D');
  const [chartType, setChartType] = useState('line');

  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [hoverBadge, setHoverBadge] = useState(null);
  const [dataStats, setDataStats] = useState({ changeVal: 0, changePct: 0, isUp: true, basePrice: 0 });
  const [canvasMounted, setCanvasMounted] = useState(false);
  const uniqueId = useId();

  const cleanSymbol = String(symbol)
    .replace('.NS', '')
    .replace('.BO', '')
    .replace(/^NSE:/i, '')
    .replace(/^BSE:/i, '');

  const isIntraday = TIMEFRAME_CONFIG[activeRange]?.isIntraday ?? false;

  // 1. Fetch data when symbol or activeRange changes
  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);

    fetchStockCandlesticks(symbol, activeRange, currentPrice || 2500)
      .then((res) => {
        if (!isSubscribed) return;

        setLoading(false);
        if (!res || !res.candles || res.candles.length === 0) return;

        const cleanCandles = sanitizeChartData(res.candles, activeRange);
        const cleanVolume = sanitizeChartData(res.volumeBars || [], activeRange);

        if (cleanCandles.length === 0) return;

        const firstCandle = cleanCandles[0];
        const lastCandle = cleanCandles[cleanCandles.length - 1];
        const basePrice = firstCandle.open || firstCandle.close;
        const changeVal = lastCandle.close - basePrice;
        const changePct = (changeVal / basePrice) * 100;
        const isUp = changeVal >= 0;

        setDataStats({ changeVal, changePct, isUp, basePrice });

        setHoverBadge({
          price: lastCandle.close,
          changeVal,
          changePct,
          isUp,
          timeStr: formatTooltipTime(lastCandle.time, activeRange),
          xPx: null,
          yPx: null,
        });

        setChartData({ candles: cleanCandles, volumeBars: cleanVolume, basePrice, isUp });
      })
      .catch((err) => {
        console.warn('Failed to load candlestick data:', err);
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [symbol, activeRange, currentPrice]);

  // 2. Initialize TradingView Canvas
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      const isDarkMode = document.documentElement.classList.contains('dark');
      const textColor = isDarkMode ? '#CBD5E1' : '#334155';
      const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
      const initialWidth = chartContainerRef.current.clientWidth || 400;

      const chart = createChart(chartContainerRef.current, {
        width: initialWidth,
        height: height,
        layout: {
          background: { type: ColorType?.Solid ?? 'solid', color: 'transparent' },
          textColor: textColor,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        crosshair: {
          mode: CrosshairMode?.Normal ?? 1,
          vertLine: {
            color: isDarkMode ? '#10B981' : '#059669',
            width: 1,
            style: 3,
            labelBackgroundColor: isDarkMode ? '#1E293B' : '#0F172A',
          },
          horzLine: {
            color: isDarkMode ? '#94A3B8' : '#64748B',
            width: 1,
            style: 3,
            labelBackgroundColor: isDarkMode ? '#1E293B' : '#0F172A',
          },
        },
        trackingMode: {
          exitMode: 0,
        },
        rightPriceScale: {
          visible: false,
        },
        timeScale: {
          visible: true,
          borderColor: gridColor,
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 10,
          barSpacing: 8,
          borderVisible: true,
        },
        handleScroll: false,
        handleScale: false,
      });

      chartRef.current = chart;

      const isUp = dataStats.isUp;
      const lineColor = isUp ? '#22c55e' : '#ef4444';

      let series;
      if (chartType === 'line') {
        const areaOptions = {
          topColor: isUp ? 'rgba(34, 197, 94, 0.22)' : 'rgba(239, 68, 68, 0.22)',
          bottomColor: isUp ? 'rgba(34, 197, 94, 0.0)' : 'rgba(239, 68, 68, 0.0)',
          lineColor: lineColor,
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderColor: '#ffffff',
          crosshairMarkerBackgroundColor: lineColor,
        };

        if (typeof chart.addSeries === 'function' && AreaSeries) {
          series = chart.addSeries(AreaSeries, areaOptions);
        } else if (typeof chart.addAreaSeries === 'function') {
          series = chart.addAreaSeries(areaOptions);
        } else {
          throw new Error('No addAreaSeries or addSeries method found on chart');
        }
      } else {
        const candleOptions = {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: true,
          upBorderColor: '#16a34a',
          downBorderColor: '#dc2626',
          wickUpColor: '#16a34a',
          wickDownColor: '#dc2626',
        };

        if (typeof chart.addSeries === 'function' && CandlestickSeries) {
          series = chart.addSeries(CandlestickSeries, candleOptions);
        } else if (typeof chart.addCandlestickSeries === 'function') {
          series = chart.addCandlestickSeries(candleOptions);
        } else {
          throw new Error('No addCandlestickSeries or addSeries method found on chart');
        }
      }
      mainSeriesRef.current = series;

      const volOptions = {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        scaleMargins: {
          top: 0.78,
          bottom: 0,
        },
      };

      let volumeSeries;
      if (typeof chart.addSeries === 'function' && HistogramSeries) {
        volumeSeries = chart.addSeries(HistogramSeries, volOptions);
      } else if (typeof chart.addHistogramSeries === 'function') {
        volumeSeries = chart.addHistogramSeries(volOptions);
      }
      volumeSeriesRef.current = volumeSeries;

      chart.subscribeCrosshairMove((param) => {
        if (!param || !param.point) return;

        const barData = param.seriesData.get(series);
        if (barData) {
          const currentVal = chartType === 'line' ? barData.value : barData.close;
          const baseP = dataStats.basePrice || currentVal;
          const diff = currentVal - baseP;
          const diffPct = (diff / baseP) * 100;

          setHoverBadge({
            price: currentVal,
            changeVal: diff,
            changePct: diffPct,
            isUp: diff >= 0,
            timeStr: formatTooltipTime(param.time, activeRange),
            xPx: param.point.x,
            yPx: param.point.y,
          });
        }
      });

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          const newWidth = chartContainerRef.current.clientWidth;
          if (newWidth > 20) {
            chartRef.current.applyOptions({ width: newWidth });
            chartRef.current.timeScale().fitContent();
          }
        }
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(chartContainerRef.current);

      const timers = [50, 150, 300, 500].map((delay) =>
        setTimeout(handleResize, delay)
      );

      setCanvasMounted(true);

      return () => {
        timers.forEach((t) => clearTimeout(t));
        resizeObserver.disconnect();
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
        setCanvasMounted(false);
      };
    } catch (e) {
      console.error('Error initializing TradingView chart canvas:', e);
    }
  }, [height, chartType, dataStats.isUp, dataStats.basePrice]);

  // 3. Universal Pointer & Touch Listener
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handlePointerMove = (clientX, clientY) => {
      if (!chartRef.current || !chartData?.candles?.length) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        const timeScale = chartRef.current.timeScale();
        const logical = timeScale.coordinateToLogical(x);
        if (logical != null) {
          const index = Math.max(0, Math.min(Math.round(logical), chartData.candles.length - 1));
          const candle = chartData.candles[index];
          if (candle) {
            const currentVal = candle.close;
            const baseP = dataStats.basePrice || currentVal;
            const diff = currentVal - baseP;
            const diffPct = (diff / baseP) * 100;
            setHoverBadge({
              price: currentVal,
              changeVal: diff,
              changePct: diffPct,
              isUp: diff >= 0,
              timeStr: formatTooltipTime(candle.time, activeRange),
              xPx: x,
              yPx: y,
            });
          }
        }
      }
    };

    const onMouseMove = (e) => handlePointerMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    container.addEventListener('mousemove', onMouseMove, { passive: true });
    container.addEventListener('touchstart', onTouchMove, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('touchstart', onTouchMove);
      container.removeEventListener('touchmove', onTouchMove);
    };
  }, [chartData, chartType, activeRange, dataStats.basePrice]);

  // 4. Populate series data
  useEffect(() => {
    if (
      chartData &&
      mainSeriesRef.current &&
      volumeSeriesRef.current &&
      chartRef.current
    ) {
      try {
        if (chartType === 'line') {
          const linePoints = chartData.candles.map((c) => ({
            time: c.time,
            value: c.close,
          }));
          mainSeriesRef.current.setData(linePoints);
        } else {
          mainSeriesRef.current.setData(chartData.candles);
        }

        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(chartData.volumeBars);
        }

        chartRef.current.timeScale().fitContent();

        [50, 150, 350, 500].forEach((delay) => {
          setTimeout(() => {
            if (chartContainerRef.current && chartRef.current) {
              const w = chartContainerRef.current.clientWidth;
              if (w > 20) {
                chartRef.current.applyOptions({ width: w });
                chartRef.current.timeScale().fitContent();
              }
            }
          }, delay);
        });
      } catch (err) {
        console.error('Error populating TradingView chart series:', err);
      }
    }
  }, [chartData, chartType]);

  const handlePointerStop = (e) => {
    e.stopPropagation();
  };

  const containerW = chartContainerRef.current?.clientWidth || 340;

  return (
    <div
      className="w-full flex flex-col rounded-2xl p-4 my-2 border border-[var(--card-border)] bg-[var(--card-bg)] shadow-lg transition-all duration-300"
      onPointerDown={handlePointerStop}
      onTouchStart={handlePointerStop}
      onMouseDown={handlePointerStop}
    >
      {/* ── Top Header Controls ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {cleanSymbol} CHART
          </span>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              dataStats.isUp
                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-500 border border-red-500/30'
            }`}
          >
            {dataStats.isUp ? '+' : ''}
            {dataStats.changePct.toFixed(2)}% ({activeRange})
          </span>

          {/* Standard Web Full Chart Link */}
          <a
            href={`https://www.tradingview.com/chart/?symbol=NSE:${cleanSymbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 shadow-sm transition-all ml-auto sm:ml-0"
            title={`Open ${cleanSymbol} full chart on TradingView`}
          >
            <span>Full Chart</span>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>

        {/* Timeframe Pills Bar */}
        <div className="flex items-center gap-1.5 bg-[var(--sheet-btn-bg)] p-1 rounded-xl shrink-0 self-start sm:self-auto overflow-x-auto max-w-full">
          {GROWW_TIMEFRAMES.map((tf) => {
            const isActive = activeRange === tf.value;
            return (
              <button
                key={`${uniqueId}-${tf.value}`}
                type="button"
                onClick={() => setActiveRange(tf.value)}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[#059669] text-white shadow-md scale-105 border-0 font-extrabold'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[var(--text)] hover:bg-[var(--card-border)] font-semibold'
                }`}
              >
                {tf.label}
              </button>
            );
          })}

          <div className="w-[1px] h-4 bg-[var(--card-border)] mx-0.5" />

          <button
            type="button"
            onClick={() => setChartType((prev) => (prev === 'line' ? 'candlestick' : 'line'))}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              chartType === 'candlestick'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'text-[#475569] dark:text-[#94A3B8] hover:bg-[var(--card-border)]'
            }`}
            title={chartType === 'line' ? 'Switch to Candlestick Chart' : 'Switch to Line Chart'}
          >
            {chartType === 'line' ? <CandlestickIcon size={16} /> : <LineIcon size={16} />}
          </button>
        </div>
      </div>

      {/* ── Chart Area: Canvas + Crosshair Guideline + Tooltip Badge ────────────────── */}
      <div className="relative w-full overflow-hidden rounded-xl" style={{ height: `${height}px`, touchAction: 'none' }}>
        
        {/* Universal Crosshair Dashed Vertical Guideline */}
        {hoverBadge && hoverBadge.xPx != null && (
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none border-l border-dashed border-emerald-500/80 dark:border-emerald-400/80"
            style={{ left: `${hoverBadge.xPx}px` }}
          />
        )}

        {/* Compact Horizontal-Only Hover Tooltip Badge */}
        {hoverBadge && (
          <div
            className="absolute top-2 z-30 pointer-events-none bg-slate-900/95 text-white backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-lg flex flex-col gap-0.5 transition-all duration-75 font-sans"
            style={{
              left: hoverBadge.xPx != null ? `${Math.max(6, Math.min(hoverBadge.xPx - 55, containerW - 135))}px` : '8px',
            }}
          >
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-[11px] font-sans">
                {formatCurrency(hoverBadge.price)}
              </span>
              <span className={`text-[10px] font-bold ${hoverBadge.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                ({hoverBadge.isUp ? '+' : ''}{hoverBadge.changePct.toFixed(2)}%)
              </span>
            </div>
            {hoverBadge.timeStr && (
              <span className="text-[9px] text-slate-300 font-medium font-sans leading-none">
                {hoverBadge.timeStr}
              </span>
            )}
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--card-bg)]/80 backdrop-blur-sm transition-all duration-300">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs font-medium text-[var(--text-muted)] animate-pulse">
              Loading {activeRange} stock data...
            </span>
          </div>
        )}

        {/* TradingView Canvas Container (Hides bottom-left canvas logo inside container) */}
        <div ref={chartContainerRef} className="w-full h-full min-h-[200px] relative z-10 [&_a]:!hidden [&_table_a]:!hidden [&_table_svg]:!hidden [&_.tv-lightweight-charts-logo]:!hidden" style={{ touchAction: 'none' }} />

        {/* Pure SVG Renderer Failsafe */}
        {(!canvasMounted || !chartData) && chartData?.candles?.length > 0 && (
          <div className="absolute inset-0 z-0">
            <SVGCandlestickFallback candles={chartData.candles} height={height} isIntraday={isIntraday} chartType={chartType} isUp={dataStats.isUp} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CandlestickChart(props) {
  return (
    <ChartErrorBoundary>
      <CandlestickChartInner {...props} />
    </ChartErrorBoundary>
  );
}
