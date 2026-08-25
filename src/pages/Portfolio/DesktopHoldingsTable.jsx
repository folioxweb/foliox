import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { usePrivacy } from '../../context/PrivacyContext';
import { Newspaper, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { renderStockBadge } from '../../components/cards/HoldingCard';

/**
 * DesktopHoldingsTable
 * Clean, modern table view for Stocks, ETFs, and Mutual Funds on desktop screens.
 */
export default function DesktopHoldingsTable({
  holdings = [],
  onPress,
  onNewsPress,
  onReportsPress,
}) {
  const { isPrivacyMode } = usePrivacy();
  const [sortColumn, setSortColumn] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(column) {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(column === 'name'); // default alphabetical for name, desc for values
    }
  }

  // Sorted copy
  const sortedHoldings = [...holdings].sort((a, b) => {
    let aVal, bVal;

    switch (sortColumn) {
      case 'name':
        aVal = (a.name || a.symbol || '').toLowerCase();
        bVal = (b.name || b.symbol || '').toLowerCase();
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);

      case 'marketPrice':
        aVal = Number(a.currentPrice ?? (a.quantity > 0 ? a.currentValue / a.quantity : 0));
        bVal = Number(b.currentPrice ?? (b.quantity > 0 ? b.currentValue / b.quantity : 0));
        break;

      case 'dayChange':
        aVal = Number(a.dayChangePercent ?? a.gainLossPercent ?? 0);
        bVal = Number(b.dayChangePercent ?? b.gainLossPercent ?? 0);
        break;

      case 'returns':
        aVal = Number(a.gainLoss ?? (a.currentValue - a.investedValue) ?? 0);
        bVal = Number(b.gainLoss ?? (b.currentValue - b.investedValue) ?? 0);
        break;

      case 'returnsPct':
        aVal = Number(a.gainLossPercent ?? 0);
        bVal = Number(b.gainLossPercent ?? 0);
        break;

      case 'currentValue':
        aVal = Number(a.currentValue ?? 0);
        bVal = Number(b.currentValue ?? 0);
        break;

      default:
        return 0;
    }

    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  return (
    <div
      className="w-full rounded-xl overflow-hidden border shadow-sm transition-all"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
    >
      <table className="w-full text-left border-collapse">
        {/* Table Header */}
        <thead>
          <tr
            className="border-b text-[12px] font-medium select-none"
            style={{
              borderColor: 'var(--divider)',
              color: 'var(--text-muted)',
              background: 'var(--card-bg)',
            }}
          >
            {/* Column 1: Company */}
            <th
              className="py-3.5 px-5 cursor-pointer transition-colors hover:text-[var(--text)]"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-1.5">
                <span>Company</span>
                {sortColumn === 'name' ? (
                  sortAsc ? <ChevronUp size={13} className="text-emerald-500" /> : <ChevronDown size={13} className="text-emerald-500" />
                ) : (
                  <ChevronDown size={13} className="opacity-40" />
                )}
              </div>
            </th>

            {/* Column 2: Market price (1D%) */}
            <th
              className="py-3.5 px-5 text-right cursor-pointer transition-colors hover:text-[var(--text)]"
              onClick={() => handleSort('dayChange')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Market price (1D%)</span>
                {sortColumn === 'dayChange' ? (
                  sortAsc ? <ChevronUp size={13} className="text-emerald-500" /> : <ChevronDown size={13} className="text-emerald-500" />
                ) : (
                  <ChevronDown size={13} className="opacity-40" />
                )}
              </div>
            </th>

            {/* Column 3: Returns (%) */}
            <th
              className="py-3.5 px-5 text-right cursor-pointer transition-colors hover:text-[var(--text)]"
              onClick={() => handleSort('returns')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Returns (%)</span>
                {sortColumn === 'returns' ? (
                  sortAsc ? <ChevronUp size={13} className="text-emerald-500" /> : <ChevronDown size={13} className="text-emerald-500" />
                ) : (
                  <ChevronDown size={13} className="opacity-40" />
                )}
              </div>
            </th>

            {/* Column 4: Current (Invested) */}
            <th
              className="py-3.5 px-5 text-right cursor-pointer transition-colors hover:text-[var(--text)]"
              onClick={() => handleSort('currentValue')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Current (Invested)</span>
                {sortColumn === 'currentValue' ? (
                  sortAsc ? <ChevronUp size={13} className="text-emerald-500" /> : <ChevronDown size={13} className="text-emerald-500" />
                ) : (
                  <ChevronDown size={13} className="opacity-40" />
                )}
              </div>
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y" style={{ borderColor: 'var(--divider)' }}>
          {sortedHoldings.map((holding) => {
            const {
              name,
              quantity = 0,
              avgPrice,
              avgCost,
              currentPrice,
              currentValue = 0,
              investedValue = 0,
              dayChange,
              dayChangePercent,
              gainLoss,
              gainLossPercent,
              badge,
              assetType,
            } = holding;

            // Unit/Share label
            const isMf = assetType === 'mutualFunds' || holding.category === 'Mutual Fund';
            const unitLabel = isMf ? 'units' : quantity === 1 ? 'share' : 'shares';
            const effectiveAvg = avgPrice ?? avgCost ?? (quantity > 0 ? investedValue / quantity : 0);
            const effectiveLtp = currentPrice ?? (quantity > 0 ? currentValue / quantity : 0);

            // Day change calculations
            const has1D = dayChange !== undefined && dayChangePercent !== undefined;
            const dChangeVal = has1D ? Number(dayChange) : null;
            const dChangePctVal = has1D ? Number(dayChangePercent) : null;
            const isDayPositive = (dChangeVal ?? 0) >= 0;

            // Total Returns calculations
            const totalPnl = gainLoss ?? (currentValue - investedValue);
            const totalPnlPct = gainLossPercent ?? (investedValue > 0 ? (totalPnl / investedValue) * 100 : 0);
            const isTotalPositive = totalPnl >= 0;

            return (
              <tr
                key={holding.id ?? holding.symbol ?? holding.srNo ?? name}
                onClick={() => onPress && onPress(holding)}
                className="cursor-pointer transition-colors duration-100"
              >
                {/* 1. Company Name & Holdings Subtitle */}
                <td className="py-3 px-5">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-[var(--text)] tracking-tight">
                        {isPrivacyMode ? 'Confidential Asset' : name}
                      </span>
                      {badge && renderStockBadge(badge)}

                      {/* News icon */}
                      {onNewsPress && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNewsPress(holding);
                          }}
                          title="View News"
                          className="inline-flex items-center justify-center p-0.5 rounded text-[var(--text-muted)] hover:text-emerald-500 transition-colors"
                        >
                          <Newspaper size={12} strokeWidth={2} />
                        </button>
                      )}

                      {/* Reports icon */}
                      {onReportsPress && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReportsPress(holding);
                          }}
                          title="View BSE Reports"
                          className="inline-flex items-center justify-center p-0.5 rounded text-[var(--text-muted)] hover:text-emerald-500 transition-colors"
                        >
                          <FileText size={12} strokeWidth={2} />
                        </button>
                      )}
                    </div>

                    <div className="text-[12px] text-[var(--text-muted)] font-normal">
                      {isPrivacyMode ? (
                        '*** • Avg. ₹***'
                      ) : (
                        `${quantity} ${unitLabel} • Avg. ${formatCurrency(effectiveAvg)}`
                      )}
                    </div>
                  </div>
                </td>

                {/* 2. Market price (1D%) */}
                <td className="py-3 px-5 text-right tabular-nums">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[14px] font-medium text-[var(--text)]">
                      {isPrivacyMode ? '₹***' : formatCurrency(effectiveLtp)}
                    </span>
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: isDayPositive ? 'var(--profit, #10B981)' : 'var(--loss, #EF4444)' }}
                    >
                      {isPrivacyMode ? (
                        '***%'
                      ) : has1D ? (
                        `${isDayPositive ? '+' : ''}${dChangeVal.toFixed(2)} (${isDayPositive ? '+' : ''}${dChangePctVal.toFixed(2)}%)`
                      ) : (
                        `${isTotalPositive ? '+' : ''}${totalPnlPct.toFixed(2)}%`
                      )}
                    </span>
                  </div>
                </td>

                {/* 3. Returns (%) */}
                <td className="py-3 px-5 text-right tabular-nums">
                  <div className="flex flex-col items-end gap-0.5">
                    <span
                      className="text-[14px] font-semibold"
                      style={{ color: isTotalPositive ? 'var(--profit, #10B981)' : 'var(--loss, #EF4444)' }}
                    >
                      {isPrivacyMode ? (
                        '₹***'
                      ) : (
                        `${isTotalPositive ? '+' : ''}${formatCurrency(totalPnl)}`
                      )}
                    </span>
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: isTotalPositive ? 'var(--profit, #10B981)' : 'var(--loss, #EF4444)' }}
                    >
                      {isPrivacyMode ? (
                        '***%'
                      ) : (
                        `${isTotalPositive ? '+' : ''}${totalPnlPct.toFixed(2)}%`
                      )}
                    </span>
                  </div>
                </td>

                {/* 4. Current (Invested) */}
                <td className="py-3 px-5 text-right tabular-nums">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[14px] font-semibold text-[var(--text)]">
                      {isPrivacyMode ? '₹***' : formatCurrency(currentValue)}
                    </span>
                    <span className="text-[12px] font-normal text-[var(--text-muted)]">
                      {isPrivacyMode ? '₹***' : formatCurrency(investedValue)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
