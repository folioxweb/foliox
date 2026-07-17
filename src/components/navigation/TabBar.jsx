import { motion } from 'framer-motion';

/**
 * TabBar — Zerodha-style horizontal scrollable tab bar.
 * Fully themed via CSS variables (dark & light mode aware).
 */
const TabBar = ({ tabs = [], activeTab, onChange }) => {
  return (
    <nav
      aria-label="Asset type tabs"
      className="hide-scrollbar"
      style={{
        borderBottom: '1px solid var(--divider)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <ul
        role="tablist"
        className="flex items-end w-full"
      >
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <li key={tab} className="relative flex-1" role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={tab}
                onClick={() => !isActive && onChange(tab)}
                className="relative w-full px-4 py-3 text-sm font-medium whitespace-nowrap text-center focus-visible:outline-none"
                style={{
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                  transition: 'color 0.2s ease',
                }}
              >
                {tab}

                {isActive && (
                  <motion.span
                    layoutId="tabBarIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: 'var(--text)' }}
                    initial={false}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default TabBar;
