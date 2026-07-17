import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ThemeToggle — animated pill switch between dark and light mode.
 * Renders a track with a sliding thumb that carries Sun (light) or Moon (dark).
 */
export default function ThemeToggle() {
  const { mode, toggle, isStorageAvailable } = useTheme();
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      disabled={!isStorageAvailable}
      className="relative flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald)] rounded-full disabled:opacity-40"
      style={{
        width: 52,
        height: 28,
        borderRadius: 99,
        padding: 3,
        background: isDark
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(5,150,105,0.15)',
        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(5,150,105,0.3)'}`,
      }}
    >
      {/* Track icons */}
      <span
        className="absolute left-2 flex items-center justify-center"
        style={{ opacity: isDark ? 0.35 : 0, transition: 'opacity 0.2s' }}
        aria-hidden
      >
        <Sun size={11} color="#F59E0B" />
      </span>
      <span
        className="absolute right-2 flex items-center justify-center"
        style={{ opacity: isDark ? 0.35 : 0, transition: 'opacity 0.2s' }}
        aria-hidden
      >
        <Moon size={11} color="#94A3B8" />
      </span>

      {/* Sliding thumb */}
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="flex items-center justify-center rounded-full"
        style={{
          width: 20,
          height: 20,
          marginLeft: isDark ? 0 : 'auto',
          background: isDark
            ? 'linear-gradient(135deg, #1E293B 0%, #334155 100%)'
            : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          boxShadow: isDark
            ? '0 1px 4px rgba(0,0,0,0.4)'
            : '0 1px 4px rgba(5,150,105,0.4)',
          flexShrink: 0,
        }}
      >
        {isDark
          ? <Moon size={11} color="#94A3B8" />
          : <Sun size={11} color="#FFFFFF" />}
      </motion.span>
    </button>
  );
}
