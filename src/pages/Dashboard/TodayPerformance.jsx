import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import Skeleton from "../../components/ui/Skeleton";
import { usePrivacy } from "../../context/PrivacyContext";
import { formatCurrency, formatPercent } from "../../utils/formatters";

function AssetRow({ label, gain, percent, isPrivacyMode }) {
  const isProfit = gain >= 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
      <div className="flex flex-col">
        <span className="text-white text-sm font-medium">
          {label}
        </span>

        <span
          className={`text-xs font-medium ${
            isProfit ? "text-green-400" : "text-red-400"
          }`}
        >
          {isProfit ? (
            <TrendingUp size={12} className="inline mr-1" />
          ) : (
            <TrendingDown size={12} className="inline mr-1" />
          )}

          {isPrivacyMode
            ? "₹***"
            : `${gain >= 0 ? "+" : ""}${formatCurrency(gain)}`}
        </span>
      </div>

      <div className="flex flex-col items-end">
        <span
  className={`text-sm font-semibold ${
    isProfit ? "text-green-400" : "text-red-400"
  }`}
>
  {formatPercent(percent)}
</span>
      </div>
    </div>
  );
}

export default function TodayPerformance({ data, loading }) {
  const { isPrivacyMode } = usePrivacy();

  if (loading && !data) {
    return (
      <section className="mb-6">
        <Skeleton width="100%" height={260} rounded="xl" />
      </section>
    );
  }

  const gain = Number(data?.gain) || 0;
  const gainPercent = Number(data?.gainPercent) || 0;

  const isProfit = gain >= 0;

  const assets = [
    {
      label: "Stocks",
      gain: Number(data?.stocksGain) || 0,
      percent: Number(data?.stocksGainPercent) || 0,
    },
    {
      label: "ETFs",
      gain: Number(data?.etfsGain) || 0,
      percent: Number(data?.etfsGainPercent) || 0,
    },
    {
      label: "Mutual Funds",
      gain: Number(data?.mutualFundsGain) || 0,
      percent: Number(data?.mutualFundsGainPercent) || 0,
    },
  ];

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
        Today's Performance
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-5 shadow-lg backdrop-blur-md"
      >
        {/* Hero */}
        <div className="flex flex-col gap-1">
          <span className="text-slate-400 text-sm font-medium">
            Day Gain / Loss
          </span>

          <div className="flex items-end gap-3">
            <span
              className={`text-3xl font-bold tracking-tight ${
                isProfit ? "text-green-400" : "text-red-400"
              }`}
            >
              {isPrivacyMode
                ? "₹***"
                : `${gain >= 0 ? "+" : ""}${formatCurrency(gain)}`}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                isProfit
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {isProfit ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}

              <span>
                {gain >= 0 }
                {formatPercent(gainPercent)}
              </span>
            </div>

            <span className="text-slate-500 text-xs font-medium">
              Today
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-5 pt-5 border-t border-slate-700/50 space-y-3">
          {assets.map((asset) => (
            <AssetRow
              key={asset.label}
              label={asset.label}
              gain={asset.gain}
              percent={asset.percent}
              isPrivacyMode={isPrivacyMode}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}