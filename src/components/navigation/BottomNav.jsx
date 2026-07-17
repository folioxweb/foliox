import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BarChart2, Briefcase } from 'lucide-react';

/**
 * BottomNav — fixed bottom navigation bar with three tabs.
 * Uses CSS variables for bg/border/text so it adapts to dark & light mode.
 */

const TABS = [
  { path: '/',          icon: Home,     label: 'Dashboard' },
  { path: '/portfolio', icon: Briefcase,label: 'Assets'    },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      aria-label="Main navigation"
      data-safe-area-bottom="true"
      style={{
        background: 'var(--nav-bg)',
        borderTop: '1px solid var(--nav-border)',
        //paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      className="fixed bottom-0 left-0 right-0 z-50"
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
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald)] focus-visible:ring-inset',
                ].join(' ')}
                style={{
                  color: active ? 'var(--emerald)' : 'var(--text-muted)',
                  transition: 'color 0.2s ease',
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden="true"
                />
                <span>{label}</span>

                {/* Active indicator bar */}
                {active && (
                  <motion.span
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                    style={{ background: 'var(--emerald)' }}
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
