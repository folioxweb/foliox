import { memo, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';

export const SECTOR_PALETTE = [
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#0EA5E9', // Sky
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#64748B', // Slate
  '#A78BFA', // Light Violet
  '#E11D48', // Crimson
];

function formatAmt(val) {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export const SectorDonutChart = memo(function SectorDonutChart({
  data = [],
  selectedSector = null,
  onSelectSector,
}) {
  const { isPrivacyMode } = usePrivacy();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Normalize & sort sectors by allocation descending
  const sortedSectors = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return [...data]
      .filter((item) => (item.allocation || 0) > 0)
      .sort((a, b) => (b.allocation || 0) - (a.allocation || 0))
      .map((item, idx) => ({
        ...item,
        color: SECTOR_PALETTE[idx % SECTOR_PALETTE.length],
        name: item.sector || 'Other',
        value: Number(Number(item.allocation || 0).toFixed(2)),
      }));
  }, [data]);

  const totalExposure = useMemo(() => {
    return sortedSectors.reduce((acc, s) => acc + (s.exposure || 0), 0);
  }, [sortedSectors]);

  const maxAlloc = useMemo(() => {
    return Math.max(...sortedSectors.map((s) => s.allocation || 0), 1);
  }, [sortedSectors]);

  // Active sector to display in center of hollow donut
  const activeSector = useMemo(() => {
    if (hoveredIndex !== null && sortedSectors[hoveredIndex]) {
      return sortedSectors[hoveredIndex];
    }
    if (selectedSector) {
      return sortedSectors.find((s) => s.name === selectedSector) || null;
    }
    return null;
  }, [hoveredIndex, selectedSector, sortedSectors]);

  if (sortedSectors.length === 0) {
    return null;
  }

  const handleSliceClick = (entry) => {
    if (!onSelectSector) return;
    if (selectedSector === entry.name) {
      onSelectSector(null);
    } else {
      onSelectSector(entry.name);
    }
  };

  return (
    <div
      className="p-3.5 sm:p-5 rounded-2xl transition-all duration-200"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.05))',
      }}
    >
      {/* Header with Title & Active Filter Tag */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 pb-2.5 border-b border-[var(--divider)]">
        <div>
          <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Sector Allocation
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">
            Tap any sector slice to filter holdings below
          </p>
        </div>

        {selectedSector && (
          <button
            type="button"
            aria-label={`Clear ${selectedSector} filter`}
            onClick={() => onSelectSector?.(null)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
          >
            <Filter size={11} />
            <span className="truncate max-w-[120px]">{selectedSector}</span>
            <X size={12} className="ml-0.5" />
          </button>
        )}
      </div>

      {/* Main Grid: 2-Column on Desktop (Donut on Left, List on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left Column: Interactive Donut with Hollow Core Intelligence */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-full max-w-[280px] h-[240px] sm:h-[260px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sortedSectors}
                  cx="50%"
                  cy="50%"
                  innerRadius={74}
                  outerRadius={106}
                  paddingAngle={3}
                  cornerRadius={5}
                  dataKey="value"
                  stroke="none"
                  onClick={handleSliceClick}
                  onMouseEnter={(_, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  cursor="pointer"
                  animationDuration={800}
                >
                  {sortedSectors.map((entry, index) => {
                    const isSelected = selectedSector === entry.name;
                    const isHovered = hoveredIndex === index;
                    const isDimmed =
                      (selectedSector && !isSelected && hoveredIndex === null) ||
                      (hoveredIndex !== null && !isHovered);

                    return (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={entry.color}
                        opacity={isDimmed ? 0.35 : 1}
                        style={{
                          transition: 'opacity 0.2s ease, transform 0.2s ease',
                          transformOrigin: 'center center',
                          filter: isSelected || isHovered ? `drop-shadow(0 0 6px ${entry.color}80)` : 'none',
                        }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Hollow Core Dynamic Metric Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <AnimatePresence mode="wait">
                {activeSector ? (
                  <motion.div
                    key={activeSector.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center max-w-[130px]"
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider truncate block w-full mb-0.5"
                      style={{ color: activeSector.color }}
                    >
                      {activeSector.name}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold truncate block w-full text-[var(--text)]">
                      {isPrivacyMode ? '₹••••' : formatAmt(activeSector.exposure)}
                    </span>
                    <span
                      className="text-xs font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block"
                      style={{
                        background: `${activeSector.color}18`,
                        color: activeSector.color,
                      }}
                    >
                      {activeSector.value.toFixed(1)}%
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center max-w-[130px]"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                      Total Equity
                    </span>
                    <span className="text-base sm:text-lg font-extrabold truncate block w-full text-[var(--text)]">
                      {isPrivacyMode ? '₹••••••' : formatAmt(totalExposure)}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--text-2)] mt-0.5">
                      {sortedSectors.length} Sectors
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Sector Breakdown List */}
        <div className="lg:col-span-7">
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {(isMobileExpanded ? sortedSectors : sortedSectors.slice(0, 7)).map((item, idx) => {
              const isSelected = selectedSector === item.name;
              const isHovered = hoveredIndex === idx;
              const barPct = (item.allocation / maxAlloc) * 100;

              return (
                <div
                  key={item.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSliceClick(item)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`relative px-3 py-2 sm:py-2.5 rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 overflow-hidden ${
                    isSelected
                      ? 'ring-1.5 ring-emerald-500 bg-emerald-500/5'
                      : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                  }`}
                  style={{
                    border: '1px solid var(--divider)',
                  }}
                >
                  {/* Subtle Background Progress Indicator */}
                  <div
                    className="absolute left-0 top-0 bottom-0 pointer-events-none transition-all duration-500"
                    style={{
                      width: `${barPct}%`,
                      background: `${item.color}0D`,
                    }}
                  />

                  {/* Left: Color Dot & Sector Name */}
                  <div className="relative z-10 flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: item.color }}
                    />
                    <span
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isSelected ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[var(--text)]'
                      }`}
                    >
                      {item.name}
                    </span>
                    {isSelected && (
                      <Check size={13} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                    )}
                  </div>

                  {/* Right: Exposure & Allocation % */}
                  <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {isPrivacyMode ? '₹•••' : formatAmt(item.exposure)}
                    </span>
                    <span
                      className="text-xs sm:text-sm font-bold w-12 text-right"
                      style={{ color: item.color }}
                    >
                      {item.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile "Show All / Show Less" Toggle Button */}
          {sortedSectors.length > 7 && (
            <div className="lg:hidden mt-2 text-center">
              <button
                type="button"
                onClick={() => setIsMobileExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-500 py-1 px-3 rounded-lg hover:bg-indigo-500/10 transition-colors"
              >
                <span>{isMobileExpanded ? 'Show Top 7 Sectors' : `View All ${sortedSectors.length} Sectors`}</span>
                {isMobileExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SectorDonutChart;
