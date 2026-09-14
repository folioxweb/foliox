import { memo, useState } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Check,
  Filter,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SORT_OPTIONS = [
  { id: 'exposure', label: 'Total Exposure' },
  { id: 'allocation', label: 'Portfolio Weight %' },
  { id: 'direct', label: 'Direct Holding Value' },
  { id: 'indirect', label: 'Via Funds Value' },
  { id: 'name', label: 'Stock Name (A → Z)' },
  { id: 'sector', label: 'Sector (A → Z)' },
];

export const HoldingsFilterBar = memo(function HoldingsFilterBar({
  searchQuery,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  selectedSector,
  onSectorChange,
  sectors = [],
  selectedCap,
  onCapChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  onExportCsv,
  counts = { all: 0, direct: 0, funds: 0, overlap: 0 },
}) {
  const [showSortModal, setShowSortModal] = useState(false);

  const activeSortLabel = SORT_OPTIONS.find((s) => s.id === sortBy)?.label || 'Total Exposure';
  const hasActiveFilters = Boolean(searchQuery.trim() || selectedSector || selectedCap || sourceFilter !== 'all');

  const handleResetFilters = () => {
    onSearchChange('');
    onSectorChange(null);
    onCapChange?.(null);
    onSourceFilterChange('all');
  };

  return (
    <div className="space-y-3">
      {/* ── Tier 1: Search & Controls ── */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div
          className="relative flex-1 flex items-center px-3 py-2 rounded-xl"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          <Search size={15} className="text-[var(--text-muted)] shrink-0 mr-2" />
          <input
            type="text"
            placeholder={`Search across ${counts.all} holdings by name or sector...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm outline-none"
            style={{ color: 'var(--text)' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 text-[var(--text-muted)] hover:opacity-80 transition-opacity"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sector, Cap, Sort & Export Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Sector Dropdown Selector */}
          <div className="relative">
            <select
              aria-label="Filter by Sector"
              value={selectedSector || ''}
              onChange={(e) => onSectorChange(e.target.value || null)}
              className="text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer appearance-none pr-7 transition-all focus:outline-none focus:ring-1 focus:ring-[var(--emerald)]"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                color: selectedSector ? 'var(--emerald)' : 'var(--text-2)',
              }}
            >
              <option value="">All Sectors</option>
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
            <Filter
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]"
            />
          </div>

          {/* Market Cap Dropdown Selector */}
          <div className="relative">
            <select
              aria-label="Filter by Market Cap"
              value={selectedCap || ''}
              onChange={(e) => onCapChange?.(e.target.value || null)}
              className="text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer appearance-none pr-7 transition-all focus:outline-none focus:ring-1 focus:ring-[var(--emerald)]"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                color: selectedCap ? '#6366F1' : 'var(--text-2)',
              }}
            >
              <option value="">All Caps</option>
              <option value="Large Cap">Large Cap</option>
              <option value="Mid Cap">Mid Cap</option>
              <option value="Small Cap">Small Cap</option>
            </select>
            <Filter
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]"
            />
          </div>

          {/* Sort Button (Triggers Bottom Sheet Modal on mobile / Popover on desktop) */}
          <button
            type="button"
            onClick={() => setShowSortModal(true)}
            aria-label="Open sorting options"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text)',
            }}
          >
            <SlidersHorizontal size={13} className="text-emerald-500 shrink-0" />
            <span className="hidden sm:inline text-[var(--text-muted)]">Sort:</span>
            <span className="truncate max-w-[120px] font-bold text-[var(--text)]">
              {activeSortLabel}
            </span>
          </button>

          {/* Export CSV Button */}
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              title="Export visible holdings to CSV"
              aria-label="Export to CSV"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 shrink-0"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-2)',
              }}
            >
              <Download size={13} className="text-indigo-400 shrink-0" />
              <span className="hidden md:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Tier 2: Source Filter Chips & Clear Reset ── */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-0.5">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* All Holdings Chip */}
          <button
            type="button"
            onClick={() => onSourceFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              sourceFilter === 'all'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--card-bg)] border border-[var(--card-border)]'
            }`}
          >
            <span>All Holdings</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                sourceFilter === 'all' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'
              }`}
            >
              {counts.all}
            </span>
          </button>

          {/* Direct Only Chip */}
          <button
            type="button"
            onClick={() => onSourceFilterChange('direct')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              sourceFilter === 'direct'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--card-bg)] border border-[var(--card-border)]'
            }`}
          >
            <span>Direct Demat</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                sourceFilter === 'direct' ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'
              }`}
            >
              {counts.direct}
            </span>
          </button>

          {/* Via Funds Only Chip */}
          <button
            type="button"
            onClick={() => onSourceFilterChange('funds')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              sourceFilter === 'funds'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--card-bg)] border border-[var(--card-border)]'
            }`}
          >
            <span>Via Funds</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                sourceFilter === 'funds' ? 'bg-white/20 text-white' : 'bg-purple-500/10 text-purple-500'
              }`}
            >
              {counts.funds}
            </span>
          </button>

          {/* Overlap (Direct + Funds) Chip */}
          <button
            type="button"
            onClick={() => onSourceFilterChange('overlap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              sourceFilter === 'overlap'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--card-bg)] border border-[var(--card-border)]'
            }`}
          >
            <span>Overlap (Both)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                sourceFilter === 'overlap' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-500'
              }`}
            >
              {counts.overlap}
            </span>
          </button>
        </div>

        {/* Clear Filters Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-rose-500 hover:opacity-80 transition-opacity shrink-0 px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Sort Bottom Sheet Modal (Identical to Foliox standard modal) ── */}
      <AnimatePresence>
        {showSortModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSortModal(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-4 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{
                background: 'var(--sheet-bg)',
                borderTop: '1px solid var(--card-border)',
                paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
              }}
            >
              <div className="mx-auto mb-4 h-1 w-12 rounded-full" style={{ background: 'var(--divider)' }} />

              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-emerald-500" />
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                    Sort Holdings
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSortModal(false)}
                  className="rounded-full p-1.5 transition hover:opacity-80"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-muted)' }}
                  aria-label="Close sort sheet"
                >
                  <X size={18} />
                </button>
              </div>

              {/* SORT CRITERIA */}
              <div className="mb-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-3">
                  Sort Criteria
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {SORT_OPTIONS.map((opt) => {
                    const isSel = sortBy === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSortByChange(opt.id)}
                        className={`flex items-center justify-between p-3 rounded-xl sm:rounded-2xl text-xs font-semibold transition-all text-left ${
                          isSel
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'bg-[var(--sheet-btn-bg)] border-[var(--card-border)] text-[var(--text)]'
                        }`}
                        style={{ borderWidth: '1px', borderStyle: 'solid' }}
                      >
                        <span>{opt.label}</span>
                        {isSel && <Check size={14} className="text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SORT DIRECTION */}
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-3">
                  Order Direction
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onSortDirectionChange('desc')}
                    className={`py-3 px-4 rounded-xl sm:rounded-2xl text-xs font-bold text-center transition-all ${
                      sortDirection === 'desc'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[var(--sheet-btn-bg)] border-[var(--card-border)] text-[var(--text-2)]'
                    }`}
                    style={{ borderWidth: '1px', borderStyle: 'solid' }}
                  >
                    High → Low (Desc)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSortDirectionChange('asc')}
                    className={`py-3 px-4 rounded-xl sm:rounded-2xl text-xs font-bold text-center transition-all ${
                      sortDirection === 'asc'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[var(--sheet-btn-bg)] border-[var(--card-border)] text-[var(--text-2)]'
                    }`}
                    style={{ borderWidth: '1px', borderStyle: 'solid' }}
                  >
                    Low → High (Asc)
                  </button>
                </div>
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={() => setShowSortModal(false)}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition hover:opacity-90 text-center"
                style={{ background: 'var(--emerald)' }}
              >
                Apply
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

export default HoldingsFilterBar;
