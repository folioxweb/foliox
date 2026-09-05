import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Clock, Activity } from 'lucide-react';
import { api } from '../../services/apiClient';

/**
 * Custom Tooltip for GMP Time-Series
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const gmpPercent = Number(data.gmpPercent || 0);
  const isAbove20 = gmpPercent >= 20;

  return (
    <div
      className="p-3 rounded-xl shadow-xl text-xs backdrop-blur-md"
      style={{
        background: 'var(--card-bg, #1e293b)',
        border: '1px solid var(--card-border, #334155)',
        color: 'var(--text, #f8fafc)',
      }}
    >
      <div className="font-bold text-[11px] text-[var(--text-2)] mb-1 border-b border-[var(--divider)] pb-1">
        {data.formattedTime || label}
      </div>
      <div className="flex items-center justify-between gap-3 my-0.5">
        <span className="text-[var(--text-2)]">GMP (%):</span>
        <span
          className={`font-black ${
            isAbove20 ? 'text-emerald-500' : 'text-rose-500'
          }`}
        >
          {gmpPercent.toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 my-0.5">
        <span className="text-[var(--text-2)]">GMP Premium:</span>
        <span className="font-bold">₹{data.gmpAmount || 0}</span>
      </div>
      {data.priceNum > 0 && (
        <div className="flex items-center justify-between gap-3 my-0.5">
          <span className="text-[var(--text-2)]">Issue Price:</span>
          <span className="font-bold">₹{data.priceNum}</span>
        </div>
      )}
    </div>
  );
}

/**
 * IpoGmpHistoryChart Component
 * Renders an interactive historical GMP area chart with a 20% alert reference line.
 */
export default function IpoGmpHistoryChart({ ipoId, currentGmpPercent = 0, currentGmpAmount = 0 }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      if (!ipoId) return;
      try {
        setLoading(true);
        const data = await api.getIpoGmpHistory(ipoId);
        if (isMounted) {
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('Failed to load IPO GMP history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [ipoId]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    // Track dates already seen to show clean, non-repeating date labels on X-axis
    const seenDates = new Set();

    return history.map((item, idx) => {
      const dateObj = new Date(item.recorded_at || item.recorded_date);
      const formattedDate = dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
      const formattedTime = dateObj.toLocaleTimeString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      const isFirstOfDate = !seenDates.has(formattedDate);
      if (isFirstOfDate) {
        seenDates.add(formattedDate);
      }

      return {
        id: item.id || idx,
        uniqueKey: `${item.id || idx}_${dateObj.getTime()}`,
        date: formattedDate,
        axisLabel: isFirstOfDate ? formattedDate : '',
        formattedTime,
        timestamp: dateObj.getTime(),
        gmpPercent: Number(item.gmp_percent || 0),
        gmpAmount: Number(item.gmp_amount || 0),
        priceNum: Number(item.price_num || 0),
      };
    });
  }, [history]);

  // Compute key summary statistics
  const stats = useMemo(() => {
    const defaultGmp = Number(currentGmpPercent || 0);
    if (!chartData || chartData.length === 0) {
      return {
        current: defaultGmp,
        peak: defaultGmp,
        lowest: defaultGmp,
        trend: defaultGmp >= 20 ? 'ABOVE_20' : 'BELOW_20',
      };
    }

    const percentages = chartData.map((d) => d.gmpPercent);
    const peak = Math.max(...percentages);
    const lowest = Math.min(...percentages);
    const current = chartData[chartData.length - 1].gmpPercent;

    return {
      current,
      peak,
      lowest,
      trend: current >= 20 ? 'ABOVE_20' : 'BELOW_20',
    };
  }, [chartData, currentGmpPercent]);

  const isCurrentAbove20 = stats.current >= 20;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow, 0 2px 10px rgba(0, 0, 0, 0.05))',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--divider)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
            GMP Trend & Historical Trajectory
          </h2>
        </div>

        {/* 20% Alert Status Pill */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
            isCurrentAbove20
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCurrentAbove20 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          {isCurrentAbove20 ? 'Above 20% Alert Line' : 'Below 20% Alert Line'}
        </span>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
          <span className="text-[10px] text-[var(--text-2)] font-semibold block">Latest GMP</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-base font-black ${
                isCurrentAbove20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {stats.current.toFixed(1)}%
            </span>
            {currentGmpAmount > 0 && (
              <span className="text-[10px] text-[var(--text-2)] font-medium">(₹{currentGmpAmount})</span>
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
          <span className="text-[10px] text-[var(--text-2)] font-semibold flex items-center gap-0.5">
            <ArrowUpRight size={11} className="text-emerald-500" /> Peak GMP
          </span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {stats.peak.toFixed(1)}%
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--divider)]">
          <span className="text-[10px] text-[var(--text-2)] font-semibold flex items-center gap-0.5">
            <ArrowDownRight size={11} className="text-rose-500" /> Lowest GMP
          </span>
          <span className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
            {stats.lowest.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      {loading ? (
        <div className="h-44 flex flex-col items-center justify-center text-center">
          <Activity size={20} className="text-[var(--text-2)] animate-spin mb-1.5" />
          <span className="text-[11px] text-[var(--text-2)] font-medium">Loading GMP history...</span>
        </div>
      ) : chartData.length >= 2 ? (
        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gmpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isCurrentAbove20 ? '#10b981' : '#f43f5e'}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={isCurrentAbove20 ? '#10b981' : '#f43f5e'}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="uniqueKey"
                stroke="var(--text-2)"
                tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--divider)' }}
                interval={0}
                tickFormatter={(_, index) => chartData[index]?.axisLabel || ''}
              />
              <YAxis
                stroke="var(--text-2)"
                tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                tickLine={false}
                axisLine={false}
                unit="%"
                domain={['dataMin - 5', 'dataMax + 5']}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* 20% Threshold Alert Line */}
              <ReferenceLine
                y={20}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: '20% Alert Threshold',
                  fill: '#f59e0b',
                  fontSize: 10,
                  fontWeight: 700,
                  position: 'insideTopRight',
                }}
              />

              <Area
                type="monotone"
                dataKey="gmpPercent"
                stroke={isCurrentAbove20 ? '#10b981' : '#f43f5e'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gmpGradient)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Single Data Point / Initial Tracking State */
        <div
          className="rounded-xl p-3.5 flex items-center gap-3"
          style={{
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px dashed rgba(245, 158, 11, 0.3)',
          }}
        >
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
            <Clock size={18} />
          </div>
          <div className="text-xs">
            <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
              Historical Tracking Active
            </span>
            <p className="text-[11px] text-[var(--text-2)] leading-relaxed m-0">
              Current snapshot recorded at <strong>{stats.current.toFixed(1)}%</strong>. Multi-point trend line will automatically populate as new GMP data is refreshed across sync runs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
