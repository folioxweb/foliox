import { useState } from 'react';
import { Info, Database, Trash2, Shield, LogOut, Palette } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';
import { logout } from '../../services/apiClient';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

const APP_VERSION = '4.1.1';
const BUILD_DATE = __BUILD_DATE__;
const REACT_VERSION = __REACT_VERSION__;
const VITE_VERSION = __VITE_VERSION__;
const API_VERSION = 'Version 55 on 17 Jul 2026, 10:52 PM';

function formatLastUpdated(date) {
  if (!date) return 'Never';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SettingsPage() {
  const { state } = usePortfolio();
  const { mode } = useTheme();
  const scrollRef = usePageScrollRestoration('settings');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const lastUpdated = formatLastUpdated(state.lastUpdated);

  function InfoRow({ label, value }) {
    return (
      <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--divider)' }}>
        <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{value}</span>
      </div>
    );
  }

  const sectionStyle = {
    borderRadius: 20,
    border: '1px solid var(--card-border)',
    background: 'var(--card-bg)',
    boxShadow: 'var(--card-shadow)',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  function handleClearCache() {
    localStorage.removeItem('portfolio-cache');
    window.location.reload();
  }

  return (
    <>
      <main
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4"
        aria-label="Settings"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
          background: 'var(--bg)',
        }}
      >
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
        </div>

        {/* ── Appearance ──────────────────────────────────────────────────── */}
        <section aria-label="Appearance" style={sectionStyle} className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette size={20} className="text-violet-400" />
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Theme</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {mode === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </section>

        {/* ── Backend Connection ──────────────────────────────────────────── */}
        <section aria-label="Backend Connection" style={sectionStyle} className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Backend Connection</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database size={20} className="text-indigo-400 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Active Backend</h3>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  Toggle between Supabase (New) and Google Apps Script (Legacy).
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { localStorage.setItem('backend_target', 'SUPABASE'); window.location.reload(); }}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
                localStorage.getItem('backend_target') === 'SUPABASE' || (!localStorage.getItem('backend_target') && import.meta.env.VITE_BACKEND_TARGET === 'SUPABASE')
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[var(--input-bg)] text-[var(--text-2)] hover:opacity-80'
              }`}
            >
              Supabase
            </button>
            <button
              onClick={() => { localStorage.setItem('backend_target', 'GAS'); window.location.reload(); }}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
                localStorage.getItem('backend_target') === 'GAS' || (!localStorage.getItem('backend_target') && import.meta.env.VITE_BACKEND_TARGET !== 'SUPABASE')
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[var(--input-bg)] text-[var(--text-2)] hover:opacity-80'
              }`}
            >
              GAS (Legacy)
            </button>
          </div>
        </section>

        {/* ── Storage ─────────────────────────────────────────────────────── */}
        <section aria-label="Storage" style={sectionStyle} className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Storage</h2>
          <div className="flex items-start gap-3">
            <Database size={20} className="mt-1 text-sky-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Local Cache</h3>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                Portfolio data is stored locally for faster startup. Clearing resets to fresh server data.
              </p>
              <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'var(--input-bg)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Last Updated</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{lastUpdated}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-80"
            style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--loss)' }}
          >
            <Trash2 size={16} />
            Clear Cache
          </button>
        </section>

        {/* ── Security ────────────────────────────────────────────────────── */}
        <section aria-label="Security" style={sectionStyle} className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Security</h2>
          <div className="flex items-start gap-3">
            <Shield size={20} className="mt-1 text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Logout</h3>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                End your current session. You'll need to sign in again to access your portfolio.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutDialog(true)}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-80"
            style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: '#F59E0B' }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </section>

        {/* ── About ───────────────────────────────────────────────────────── */}
        <section aria-label="About" style={{ ...sectionStyle, gap: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Info size={20} className="text-sky-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Equity Dashboard</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Personal Portfolio Management Platform</p>
            </div>
          </div>

          <div>
            {[
              ['App Version', APP_VERSION],
              ['API Version', API_VERSION],
              ['Build Date', BUILD_DATE],
              ['React', REACT_VERSION],
              ['Vite', VITE_VERSION],
              ['Powered By', 'Google Apps Script'],
              ['Hosting', 'GitHub Pages'],
              ['Developer', 'Parth Deshmukh'],
            ].map(([label, value]) => (
              <InfoRow key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      </main>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-[90%] max-w-sm rounded-3xl p-6 shadow-2xl"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Logout?</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              You will need to sign in again to access your portfolio.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="rounded-xl px-4 py-2 text-sm transition-colors hover:opacity-80"
                style={{ border: '1px solid var(--card-border)', color: 'var(--text-2)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => logout()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}