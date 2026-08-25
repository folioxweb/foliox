import { formatCurrency } from '../../utils/formatters';
import { usePrivacy } from '../../context/PrivacyContext';
import { Landmark, Calendar, Percent, ShieldCheck } from 'lucide-react';

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
 * Modernized luxury desktop view for Fixed Deposits.
 */
export default function DesktopFDView({ fds = [], onPress }) {
  const { isPrivacyMode } = usePrivacy();

  if (!fds || fds.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 text-center border shadow-xl"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        <Landmark className="mx-auto mb-3 text-emerald-400 opacity-60" size={36} />
        <h3 className="text-base font-semibold text-[var(--text)]">No Fixed Deposits</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Your active fixed deposits will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {fds.map((fd) => {
        const {
          name,
          principal = 0,
          interestRate = 0,
          currentValue = 0,
          maturityValue = 0,
          interestEarned = 0,
          maturityDate,
          investmentDate,
        } = fd;

        // Calculate tenure progress if dates are provided
        let progressPct = 50;
        if (maturityDate) {
          const start = investmentDate ? new Date(investmentDate).getTime() : Date.now() - 180 * 86400000;
          const end = new Date(maturityDate).getTime();
          const now = Date.now();
          if (end > start) {
            progressPct = Math.min(100, Math.max(5, Math.round(((now - start) / (end - start)) * 100)));
          }
        }

        const effectiveEarned = interestEarned > 0 ? interestEarned : Math.max(0, currentValue - principal);

        return (
          <div
            key={fd.id ?? fd.symbol ?? name}
            onClick={() => onPress && onPress(fd)}
            className="group relative rounded-2xl p-5 border shadow-xl transition-all duration-200 cursor-pointer hover:border-emerald-500/40 hover:shadow-emerald-950/20"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Top Bar: Bank Name & Badges */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text)] group-hover:text-emerald-400 transition-colors">
                    {isPrivacyMode ? 'Confidential Fixed Deposit' : name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
                      <ShieldCheck size={11} /> Fixed Deposit
                    </span>
                  </div>
                </div>
              </div>

              {/* Interest Rate Badge */}
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-emerald-400 text-xs font-bold">
                <Percent size={12} strokeWidth={2.5} />
                <span>{interestRate}% p.a.</span>
              </div>
            </div>

            {/* Metrics 4-Column Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 mb-4">
              <div>
                <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-0.5">
                  Principal
                </span>
                <span className="text-sm font-semibold text-[var(--text)]">
                  {isPrivacyMode ? '₹***' : formatCurrency(principal)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-0.5">
                  Current Value
                </span>
                <span className="text-sm font-semibold text-emerald-400">
                  {isPrivacyMode ? '₹***' : formatCurrency(currentValue || principal)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-0.5">
                  Interest Accrued
                </span>
                <span className="text-sm font-semibold text-teal-300">
                  {isPrivacyMode ? '₹***' : `+${formatCurrency(effectiveEarned)}`}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-0.5">
                  Maturity Value
                </span>
                <span className="text-sm font-semibold text-[var(--text)]">
                  {isPrivacyMode ? '₹***' : formatCurrency(maturityValue)}
                </span>
              </div>
            </div>

            {/* Tenure & Maturity Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Maturity: <strong className="text-[var(--text)]">{formatDateSafe(maturityDate)}</strong>
                </span>
                <span className="text-emerald-400 font-semibold">{progressPct}% elapsed</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
