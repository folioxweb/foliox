import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Briefcase, 
  Flame, 
  Eye, 
  TrendingUp, 
  BarChart2, 
  Settings
} from 'lucide-react';
import PrivacyToggle from '../ui/PrivacyToggle';
import { usePortfolio } from '../../context/PortfolioContext';

const NAV_ITEMS = [
  { path: '/',           icon: Home,       label: 'Dashboard'  },
  { path: '/portfolio',  icon: Briefcase,  label: 'Portfolio'  },
  { path: '/ipo',        icon: Flame,      label: 'IPO Central'},
  { path: '/watchlist',  icon: Eye,        label: 'Watchlist'  },
  { path: '/paper-trade',icon: TrendingUp, label: 'Paper Trade'},
  { path: '/analytics',  icon: BarChart2,  label: 'Analytics'  },
];

export default function SidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = usePortfolio();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 w-64 xl:w-72 h-[100svh] z-40 border-r transition-all duration-200 select-none"
      style={{
        background: 'var(--header-bg)',
        borderColor: 'var(--card-border)',
      }}
      aria-label="Desktop sidebar navigation"
    >
      {/* ── Brand Logo Header ── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--card-border)]">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img 
            src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} 
            alt="FolioX Logo" 
            className="w-10 h-10 rounded-[10px] shadow-sm transition-transform group-hover:scale-105 object-cover flex-shrink-0"
            onError={(e) => {
              if (e.currentTarget.src !== '/foliox/apple-touch-icon.png') {
                e.currentTarget.src = '/foliox/apple-touch-icon.png';
              }
            }}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
                FolioX
              </span>
            </div>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Equity &amp; Portfolio
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Links ── */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Main Menu
        </p>

        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);

          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={[
                'relative w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left group',
                active ? 'shadow-sm' : 'hover:bg-[var(--sheet-btn-bg)]',
              ].join(' ')}
              style={{
                background: active ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: active ? 'var(--emerald)' : 'var(--text-2)',
                border: active ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent',
              }}
            >
              <Icon 
                size={18} 
                strokeWidth={active ? 2.5 : 2}
                className={active ? 'text-[var(--emerald)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors'}
              />
              <span className="flex-1">{label}</span>

              {active && (
                <motion.span
                  layoutId="sidebarActivePill"
                  className="w-1.5 h-4 rounded-full"
                  style={{ background: 'var(--emerald)' }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer / Quick Controls & Settings ── */}
      <div className="p-4 border-t border-[var(--card-border)] space-y-2">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className={[
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
            isActive('/settings') ? 'bg-[var(--sheet-btn-bg)] font-bold' : 'hover:bg-[var(--sheet-btn-bg)]',
          ].join(' ')}
          style={{ color: 'var(--text)' }}
        >
          <Settings size={18} style={{ color: 'var(--text-muted)' }} />
          <span>Settings</span>
        </button>

        <div className="flex items-center justify-between px-3 pt-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Privacy Mode
          </span>
          <PrivacyToggle />
        </div>
      </div>
    </aside>
  );
}
