import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { usePrivacy } from '../../context/PrivacyContext';
import { ChevronUp, ChevronDown, Landmark } from 'lucide-react';

function formatDateSafe(dateStr) {
  if (!dateStr) return 'Not specified';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
}

/**
 * DesktopFDView
 * Clean, modern table view for Fixed Deposits matching Stocks, ETFs, and MF tables.
 */
export default function DesktopFDView({ fds = [], onPress }) {
  const { isPrivacyMode } = usePrivacy();
  const [sortColumn, setSortColumn] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(column) {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(column === 'name');
    }
  }

  if (!fds || fds.length === 0) {
    return (
      <div
        className="w-full rounded-2xl p-10 text-center border shadow-xl transition-all"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        <Landmark className="mx-auto mb-3 text-teal-400 opacity-60" size={36} />
        <h3 className="text-base font-semibold text-[var(--text)]">No Fixed Deposits</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Your active fixed deposits will appear here.
        </p>
      </div>
    );
  }

  // Sorted list
  const sortedFds = [...fds].sort((a, b) => {
    let aVal, bVal;

    switch (sortColumn) {
      case 'name':
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);

      case 'rate':
        aVal = Number(a.interestRate ?? 0);
        bVal = Number(b.interestRate ?? 0);
        break;

      case 'maturity':
        aVal = Number(a.maturityValue ?? 0);
        bVal = Number(b.maturityValue ?? 0);
        break;

      case 'currentValue':
        aVal = Number(a.currentValue ?? a.principal ?? 0);
        bVal = Number(b.currentValue ?? b.principal ?? 0);
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
            {/* Column 1: Bank / Scheme */}
            <th
              className="py-3.5 px-5 cursor-pointer transition-colors hover:text-[var(--text)]"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-1.5">
                <span>Bank / Scheme</span>
                {sortColumn === 'name' ? (
                  sortAsc ? <ChevronUp size={13} className="text-emerald-500" /> : <ChevronDown size={13} className="text-emerald-500" />
                ) : (
                  <ChevronDown size={13} className="opacity-40" />
                )}
              </div>
            </th>

            {/* Column 2: Interest Rate (Accrued) */}
            <th
              className="py-3.5 px-5 text-right cursor-pointer transition-colors hover:text-[var(--text)]"
              onClick={() => handleSort('rate')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Interest Rate (Accrued)</span>
                {sortColumn === 'rate' ? (
                  sortAsc ? <ChevronUp size={13} className="text-emerald-500" /> : <ChevronDown size={13} className="text-emerald-500" />
                ) : (
                  <ChevronDown size={13} className="opacity-40" />
                )}
              </div>
            </th>

            {/* Column 3: Maturity Value */}
            <th
              className="py-3.5 px-5 text-right cursor-pointer transition-colors hover:text-[var(--text)]"
              onClick={() => handleSort('maturity')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Maturity Value</span>
                {sortColumn === 'maturity' ? (
                  sortAsc ? <ChevronUp size={13} className="text-emerald-500" /> : <ChevronDown size={13} className="text-emerald-500" />
                ) : (
                  <ChevronDown size={13} className="opacity-40" />
                )}
              </div>
            </th>

            {/* Column 4: Current (Principal) */}
            <th
              className="py-3.5 px-5 text-right cursor-pointer transition-colors hover:text-[var(--text)]"
              onClick={() => handleSort('currentValue')}
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Current (Principal)</span>
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
          {sortedFds.map((fd) => {
            const {
              name,
              principal = 0,
              interestRate = 0,
              currentValue = 0,
              maturityValue = 0,
              interestEarned = 0,
              maturityDate,
            } = fd;

            const effectiveEarned = interestEarned > 0 ? interestEarned : Math.max(0, currentValue - principal);

            return (
              <tr
                key={fd.id ?? fd.symbol ?? name}
                onClick={() => onPress && onPress(fd)}
                className="cursor-pointer transition-colors duration-100"
              >
                {/* 1. Bank / Scheme Name & Maturity Subtitle */}
                <td className="py-3 px-5">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-[var(--text)] tracking-tight">
                        {isPrivacyMode ? 'Confidential Fixed Deposit' : name}
                      </span>
                      <span className="inline-flex items-center text-[10px] font-medium text-teal-500 bg-teal-500/10 px-1.5 py-0.2 rounded border border-teal-500/20">
                        FD
                      </span>
                    </div>

                    <div className="text-[12px] text-[var(--text-muted)] font-normal">
                      Maturity: {formatDateSafe(maturityDate)}
                    </div>
                  </div>
                </td>

                {/* 2. Rate & Accrued Interest */}
                <td className="py-3 px-5 text-right tabular-nums">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[14px] font-medium text-[var(--text)]">
                      {interestRate}% p.a.
                    </span>
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: 'var(--profit, #10B981)' }}
                    >
                      {isPrivacyMode ? '***' : `+${formatCurrency(effectiveEarned)} accrued`}
                    </span>
                  </div>
                </td>

                {/* 3. Maturity Value */}
                <td className="py-3 px-5 text-right tabular-nums">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[14px] font-semibold text-[var(--text)]">
                      {isPrivacyMode ? '₹***' : formatCurrency(maturityValue)}
                    </span>
                    <span className="text-[12px] font-normal text-[var(--text-muted)]">
                      Matures {formatDateSafe(maturityDate)}
                    </span>
                  </div>
                </td>

                {/* 4. Current (Principal) */}
                <td className="py-3 px-5 text-right tabular-nums">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[14px] font-semibold text-[var(--text)]">
                      {isPrivacyMode ? '₹***' : formatCurrency(currentValue || principal)}
                    </span>
                    <span className="text-[12px] font-normal text-[var(--text-muted)]">
                      {isPrivacyMode ? '₹***' : formatCurrency(principal)}
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
