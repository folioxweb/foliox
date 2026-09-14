import { memo } from 'react';
import { Layers } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32'];

function formatAmt(val) {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export const HoldingsConsoleTable = memo(function HoldingsConsoleTable({
  items = [],
  totalFilteredCount = 0,
  displayCount = 50,
  onLoadMore,
  maxExposure = 1,
}) {
  const { isPrivacyMode } = usePrivacy();

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
        }}
      >
        <div className="p-4 rounded-full bg-slate-500/10 text-slate-400 mb-3">
          <Layers size={32} />
        </div>
        <h4 className="text-sm sm:text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
          No holdings found
        </h4>
        <p className="text-xs text-[var(--text-muted)] max-w-xs">
          No stock constituents match your selected filter or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-xs"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
      }}
    >
      {/* ── Desktop View (≥ 1024px): Zerodha Console Multi-Column Table ── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--divider)',
              }}
            >
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Company Name</th>
              <th className="py-3 px-4">Sector</th>
              <th className="py-3 px-4 text-right">Direct Demat</th>
              <th className="py-3 px-4 text-right">Via Funds</th>
              <th className="py-3 px-4 text-right">Total Exposure</th>
              <th className="py-3 px-4 text-right w-36">Portfolio Weight</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const rankColor = RANK_COLORS[idx] ?? 'var(--text-muted)';
              const isOverlap = item.directValue > 0 && item.indirectValue > 0;
              const isDirectOnly = item.directValue > 0 && !item.indirectValue;
              const isFundsOnly = !item.directValue && item.indirectValue > 0;
              const barPct = Math.min(100, Math.max(2, (item.exposure / maxExposure) * 100));

              return (
                <tr
                  key={`${item.name}-${idx}`}
                  className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  style={{
                    borderBottom: idx < items.length - 1 ? '1px solid var(--divider)' : 'none',
                  }}
                >
                  {/* Rank Column */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
                      style={{
                        background: idx < 3 ? `${rankColor}22` : 'var(--input-bg)',
                        color: idx < 3 ? rankColor : 'var(--text-muted)',
                      }}
                    >
                      {idx + 1}
                    </span>
                  </td>

                  {/* Company Name & Tag */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate max-w-[240px]" style={{ color: 'var(--text)' }}>
                        {isPrivacyMode ? '••••••••••' : item.name}
                      </span>
                      {isOverlap && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                          Direct + Funds
                        </span>
                      )}
                      {isDirectOnly && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                          Direct
                        </span>
                      )}
                      {isFundsOnly && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
                          Via Funds
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Sector */}
                  <td className="py-3 px-4 text-xs font-medium text-[var(--text-2)] truncate max-w-[140px]">
                    {item.sector || 'Other'}
                  </td>

                  {/* Direct Demat Value */}
                  <td className="py-3 px-4 text-xs font-semibold text-right" style={{ color: 'var(--text)' }}>
                    {isPrivacyMode ? '₹•••' : item.directValue > 0 ? formatAmt(item.directValue) : '—'}
                  </td>

                  {/* Via Funds Value */}
                  <td className="py-3 px-4 text-xs font-semibold text-right text-[var(--text-2)]">
                    {isPrivacyMode ? '₹•••' : item.indirectValue > 0 ? formatAmt(item.indirectValue) : '—'}
                  </td>

                  {/* Total Exposure */}
                  <td className="py-3 px-4 text-sm font-extrabold text-right" style={{ color: 'var(--text)' }}>
                    {isPrivacyMode ? '₹••••' : formatAmt(item.exposure)}
                  </td>

                  {/* Portfolio Weight & Bar */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(item.allocation || 0).toFixed(2)}%
                      </span>
                      <div className="w-20 h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile View (< 1024px): High-Density Touch Cards ── */}
      <div className="block lg:hidden divide-y divide-[var(--divider)]">
        {items.map((item, idx) => {
          const rankColor = RANK_COLORS[idx] ?? 'var(--text-muted)';
          const isOverlap = item.directValue > 0 && item.indirectValue > 0;
          const isDirectOnly = item.directValue > 0 && !item.indirectValue;
          const isFundsOnly = !item.directValue && item.indirectValue > 0;

          return (
            <div
              key={`m-${item.name}-${idx}`}
              className="p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors active:bg-black/[0.03] dark:active:bg-white/[0.03]"
            >
              {/* Left: Rank & Details */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    background: idx < 3 ? `${rankColor}22` : 'var(--input-bg)',
                    color: idx < 3 ? rankColor : 'var(--text-muted)',
                  }}
                >
                  {idx + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <h5 className="text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--text)' }}>
                    {isPrivacyMode ? '••••••••' : item.name}
                  </h5>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
                      {item.sector || 'Other'}
                    </span>
                    {isOverlap && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Direct + Funds
                      </span>
                    )}
                    {isDirectOnly && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        Direct
                      </span>
                    )}
                    {isFundsOnly && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        Funds
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Exposure & Allocation % */}
              <div className="text-right shrink-0">
                <div className="text-xs sm:text-sm font-extrabold" style={{ color: 'var(--text)' }}>
                  {isPrivacyMode ? '₹••••' : formatAmt(item.exposure)}
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {Number(item.allocation || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination / Show More Button */}
      {totalFilteredCount > displayCount && (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full py-3 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity border-t border-[var(--divider)]"
          style={{ background: 'var(--input-bg)' }}
        >
          Show Next 50 Holdings ({totalFilteredCount - displayCount} remaining)
        </button>
      )}
    </div>
  );
});

export default HoldingsConsoleTable;
