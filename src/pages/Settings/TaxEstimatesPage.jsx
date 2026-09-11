import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, ShieldCheck } from 'lucide-react';
import TaxEstimatesSection from '../../components/settings/TaxEstimatesSection';
import PrivacyToggle from '../../components/ui/PrivacyToggle';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';

export default function TaxEstimatesPage() {
  const navigate = useNavigate();
  const scrollRef = usePageScrollRestoration('tax-estimates');

  return (
    <main
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto"
      aria-label="Tax Estimates"
      style={{
        background: 'var(--bg)',
        paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
      }}
    >
      {/* ── Sticky Top Bar ────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 px-3 sm:px-4 lg:px-8 flex items-center justify-between"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: '0.75rem',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center rounded-full p-2 text-[var(--text)] hover:bg-[var(--sheet-btn-bg)] transition-colors"
            aria-label="Back to Settings"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text)]">
                Capital Gains &amp; Tax
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30">
                BUDGET 2024
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.2">
              STCG @ 20% &bull; LTCG @ 12.5% &bull; ₹1.25L Exemption
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrivacyToggle />
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <div className="px-3 sm:px-4 lg:px-8 pt-4 max-w-5xl mx-auto">
        <TaxEstimatesSection />
      </div>
    </main>
  );
}
