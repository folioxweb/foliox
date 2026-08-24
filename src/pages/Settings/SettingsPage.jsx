import { useState, useEffect } from 'react';
import { Info, Database, Trash2, Shield, LogOut, Palette, Briefcase, UserCheck, KeyRound, Sparkles, Compass } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { useAuth } from '../../context/AuthContext';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';
import { logout } from '../../services/apiClient';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import SetNewPasswordModal from '../../components/auth/SetNewPasswordModal';
import AppGuideModal from '../../components/guide/AppGuideModal';

const APP_VERSION = '4.2.0';
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
  const { state, updatePaperCapital, resetPaperPortfolio } = usePortfolio();
  const { user, signOut } = useAuth();
  const { mode } = useTheme();
  const scrollRef = usePageScrollRestoration('settings');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [paperCapital, setPaperCapital] = useState('5000000');
  const [updatingCap, setUpdatingCap] = useState(false);

  useEffect(() => {
    const initCap = state.paperTrade?.data?.summary?.initialCapital;
    if (initCap) setPaperCapital(String(initCap));
  }, [state.paperTrade]);

  async function handleUpdateCapital() {
    try {
      setUpdatingCap(true);
      await updatePaperCapital({ initialCapital: Number(paperCapital) });
      alert('Paper trading capital updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update paper capital');
    } finally {
      setUpdatingCap(false);
    }
  }

  async function handleResetPaper() {
    if (window.confirm('Are you sure you want to reset all paper trades and restore cash to initial capital?')) {
      try {
        await resetPaperPortfolio();
        alert('Paper portfolio reset successfully.');
      } catch (err) {
        alert(err.message || 'Failed to reset paper portfolio');
      }
    }
  }

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

  async function handleLogoutConfirm() {
    setShowLogoutDialog(false);
    await signOut();
    logout();
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

        {/* ── User Account ────────────────────────────────────────────────── */}
        {user?.email && (
          <section aria-label="Account" style={sectionStyle} className="mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Account</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                  <UserCheck size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold truncate max-w-[200px]" style={{ color: 'var(--text)' }}>
                    {user.email}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--emerald)' }}>
                    Authenticated via Supabase
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowChangePasswordModal(true)}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold transition hover:opacity-80"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text)',
              }}
            >
              <KeyRound size={14} className="text-emerald-400" />
              Change Password
            </button>
          </section>
        )}

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

        {/* ── Help & App Tour ─────────────────────────────────────────────── */}
        <section aria-label="App Guide" style={sectionStyle} className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Help & Overview</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-amber-400" />
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Feature Tour & Guide</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Explore everything you can do with Foliox
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition hover:opacity-90"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text)',
            }}
          >
            <Compass size={14} className="text-emerald-400" />
            Open Feature Tour
          </button>
        </section>

        {/* ── Voice Assistant (commented out for now) ──────────────────────────────────────────── */}
        {/*
        <section aria-label="Voice Assistant" style={sectionStyle} className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Voice Assistant</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Wake Word</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Listen continuously for "Hey Assistant"
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={localStorage.getItem('wakeWordEnabled') === 'true'}
                onChange={(e) => {
                  localStorage.setItem('wakeWordEnabled', e.target.checked);
                  window.dispatchEvent(new Event('wakeWordToggled'));
                  window.location.reload();
                }}
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </section>
        */}

        {/* ── Backend Connection (commented out for now) ──────────────────────────────────────────── */}
        {/*
        <section aria-label="Backend Connection" style={sectionStyle} className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Backend Connection</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database size={20} className="text-indigo-400 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Active Backend</h3>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  Toggle between Supabase and Google Apps Script (Legacy).
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
        */}

        {/* ── Paper Trading Settings ────────────────────────────────────────── */}
        <section aria-label="Paper Trading Settings" style={sectionStyle} className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Paper Trading Config</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase size={20} className="text-emerald-400 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Virtual Capital</h3>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  Set your initial virtual delivery balance for paper trades.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <input
              type="number"
              placeholder="5000000"
              value={paperCapital}
              onChange={(e) => setPaperCapital(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--emerald)]"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text)', fontSize: '15px' }}
            />
            <button
              onClick={handleUpdateCapital}
              disabled={updatingCap}
              className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 text-center"
              style={{ background: 'var(--emerald)' }}
            >
              {updatingCap ? 'Saving...' : 'Update Capital'}
            </button>
            <button
              type="button"
              onClick={handleResetPaper}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition hover:opacity-80 text-center"
              style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--loss)' }}
            >
              <Trash2 size={14} />
              Reset Paper Trading Portfolio
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
                Portfolio data is cached locally for faster startup.
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
              <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Session</h3>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                End your active authenticated session.
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
            Sign Out
          </button>
        </section>

        {/* ── About / App Info (commented out for now) ───────────────────────────────────────── */}
        {/*
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
              ['Backend', import.meta.env.VITE_BACKEND_TARGET === 'SUPABASE' ? 'Supabase (PostgreSQL)' : 'Google Apps Script'],
              ['Hosting', 'GitHub Pages'],
              ['Developer', 'Parth Deshmukh'],
            ].map(([label, value]) => (
              <InfoRow key={label} label={label} value={value} />
            ))}
          </div>
        </section>
        */}
      </main>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-[90%] max-w-sm rounded-3xl p-6 shadow-2xl"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Sign Out?</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              You will need to sign in again with your email and password to access your portfolio.
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
                onClick={handleLogoutConfirm}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <SetNewPasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* App Feature Tour & Guide Modal */}
      <AppGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </>
  );
}