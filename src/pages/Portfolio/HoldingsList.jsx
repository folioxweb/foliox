import { motion } from 'framer-motion';
import HoldingCard from '../../components/cards/HoldingCard';
import FDCard from '../../components/cards/FDCard';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

// ── Animation variants ───────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ── SkeletonCard ─────────────────────────────────────────────────────────────

/**
 * SkeletonCard — placeholder card rendered while holdings data is loading.
 * Matches the rough visual height of a full HoldingCard.
 */
function SkeletonCard() {
  return (
    <div
      className="rounded-[24px] px-4 py-4 shadow-lg space-y-3"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
      }}
    >
      {/* Name + badge row */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2 flex-1">
          <Skeleton width="60%" height={14} rounded="md" />
          <Skeleton width="32%" height={10} rounded="full" />
        </div>
        <Skeleton width={48} height={18} rounded="full" />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Skeleton width="80%" height={12} rounded="md" />
        <Skeleton width="80%" height={12} rounded="md" />
        <Skeleton width="80%" height={12} rounded="md" />
        <Skeleton width="80%" height={12} rounded="md" />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--divider)' }} />

      {/* Return row */}
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height={14} rounded="md" />
        <Skeleton width={64} height={26} rounded="full" />
      </div>
    </div>
  );
}

// ── HoldingsList ─────────────────────────────────────────────────────────────

/**
 * HoldingsList — renders a list of full-variant HoldingCards.
 *
 * States:
 *   - loading  → 4 SkeletonCard placeholders
 *   - error    → inline error message + Retry button
 *   - empty    → empty-state message
 *   - data     → staggered animated list of HoldingCard components
 *
 * Props:
 *   holdings  {Holding[]}         — array of holding objects
 *   loading   {boolean}           — show skeletons while true
 *   error     {ApiError|null}     — structured error from the API client
 *   onRetry   {() => void}        — callback for the Retry button
 *   onPress   {(holding) => void} — called when a card is tapped
 *
 * Requirements: 4.2, 4.7, 4.8
 */
export default function HoldingsList({ holdings, loading, error, onRetry, onPress, onNewsPress, onReportsPress, viewMode = 'currentInvested' }) {
  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading && !holdings) {
    return (
      <section aria-label="Loading holdings" className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </section>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <section
        className="rounded-[24px] px-5 py-6 flex flex-col items-center gap-4 text-center"
        style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
        }}
        aria-label="Error loading holdings"
        role="alert"
      >
        <p className="text-sm font-medium" style={{ color: 'var(--loss)' }}>
          {error.message || 'Unable to load holdings. Please try again.'}
        </p>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            aria-label="Retry loading holdings"
          >
            Retry
          </Button>
        )}
      </section>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!holdings || holdings.length === 0) {
    return (
      <section
        className="rounded-[24px] px-5 py-10 flex flex-col items-center gap-3 text-center"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
        }}
        aria-label="No holdings"
      >
        <p className="text-base font-semibold text-[var(--text)]">No holdings found</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Add holdings to your Google Sheet to see them here.
        </p>
      </section>
    );
  }

  // ── Data state — staggered entry animation ─────────────────────────────────
  return (
    <motion.section
      aria-label="Holdings list"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {holdings.map((holding) => (
        <motion.div
          key={holding.id ?? holding.symbol ?? holding.srNo ?? holding.name}
          variants={itemVariants}
        >
          {holding.assetType === "fds" ? (
            <FDCard
              holding={holding}
              onPress={onPress ? () => onPress(holding) : undefined}
            />
          ) : (
            <HoldingCard
              holding={holding}
              variant="list"
              viewMode={viewMode}
              onPress={onPress ? () => onPress(holding) : undefined}
              onNewsPress={onNewsPress ? () => onNewsPress(holding) : undefined}
              onReportsPress={onReportsPress ? () => onReportsPress(holding) : undefined}
            />
          )}
        </motion.div>
      ))}
    </motion.section>
  );
}
