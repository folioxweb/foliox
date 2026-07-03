import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BarChart2, Briefcase, Settings } from 'lucide-react';

/**
 * BottomNav — fixed bottom navigation bar with four tabs.
 *
 * - Fixed at bottom with z-50
 * - Applies env(safe-area-inset-bottom) padding for iPhone notch
 * - Active tab is highlighted with the emerald accent color
 * - Each tab has an aria-label for accessibility
 *
 * _Requirements: 1.1, 1.2, 1.4, 10.5, 12.1_
 */

const TABS = [
  {
    path: '/',
    icon: Home,
    label: 'Dashboard',
  },
  {
    path: '/analytics',
    icon: BarChart2,
    label: 'Analytics',
  },
  {
    path: '/portfolio',
    icon: Briefcase,
    label: 'Assets',
  },
  {
    path: '/settings',
    icon: Settings,
    label: 'Settings',
  },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Determine if a tab is active. The Dashboard tab ("/") is active only on
   * exact match; all other tabs use a prefix match so nested routes highlight
   * the correct tab.
   */
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-dark border-t border-[#334155]"
      style={{ paddingBottom: 0 }}
      data-safe-area-bottom="true"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch m-0 p-0 list-none" role="list">
        {TABS.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);

          return (
            <li key={path} className="flex-1">
              <motion.button
                type="button"
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                onClick={() => navigate(path)}
                className={[
                  'relative w-full flex flex-col items-center justify-center gap-1',
                  'pt-3 pb-2 text-[10px] font-medium tracking-wide',
                  'transition-colors duration-300 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-emerald focus-visible:ring-inset',
                  active
                    ? 'text-emerald'
                    : 'text-[#94A3B8] hover:text-[#CBD5E1]',
                ].join(' ')}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden="true"
                />

                <span>{label}</span>

                {/* Active indicator dot */}
                {active && (
                  <motion.span
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-emerald"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
