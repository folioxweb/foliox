import { useState, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sun, Moon, RefreshCw, GitBranch, Info } from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { usePortfolio } from '../../context/PortfolioContext';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import RefreshButton from '../../components/ui/RefreshButton';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';

// App version — falls back to '0.0.0' if env var is not set (Requirement 7.4)
const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.0.0';

/**
 * Formats a Date object into a readable "Last Updated" string.
 * Returns null when date is null/undefined.
 *
 * @param {Date|null} date
 * @returns {string|null}
 */
function formatLastUpdated(date) {
  if (!date) return null;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * SettingsPage — theme toggle, refresh control, and app info.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */
export default function SettingsPage() {
  const { mode, toggle, isStorageAvailable } = useTheme();
  const { state, refreshAll } = usePortfolio();
  const scrollRef = usePageScrollRestoration('settings');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  // We use a ref to capture state after refreshAll settles, since refreshAll
  // uses Promise.allSettled internally and never throws — endpoint errors are
  // stored in state.*.error instead.
  const stateRef = useRef(state);
  stateRef.current = state;

  const lastUpdatedStr = formatLastUpdated(state.lastUpdated);

  // ── Refresh handler ──────────────────────────────────────────────────────
  // Requirement 7.2, 7.6, 7.7
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorToast(null);
    try {
      await refreshAll();
      // refreshAll uses Promise.allSettled so it won't throw.
      // Check the context state snapshot for any endpoint errors after settling.
      const updatedState = stateRef.current;
      const endpoints = ['dashboard', 'stocks', 'etfs', 'mutualFunds', 'health'];
      const hasAnyError = endpoints.some((key) => updatedState[key]?.error != null);
      if (hasAnyError) {
        setErrorToast('Some data failed to refresh. Please try again.');
      }
    } catch {
      // Safety net for truly unexpected errors
      setErrorToast('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshAll]);

  // ── Section styles ───────────────────────────────────────────────────────
  const sectionClass = [
    'rounded-[24px] border border-[var(--border)]',
    'bg-[var(--surface)] backdrop-blur-sm px-5 py-4',
    'shadow-lg flex flex-col gap-3',
  ].join(' ');

  const sectionLabelClass =
    'text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]';

  const rowClass = 'flex items-center justify-between gap-4';

  return (
    <>
      <main
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-28"
        aria-label="Settings"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        {/* ── Page heading ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--text)]">Settings</h1>
          <RefreshButton onRefresh={handleRefresh} />
        </div>

        <div className="flex flex-col gap-4">

          {/* ── Appearance section ─────────────────────────────────────── */}
          {/* Requirement 7.1 */}
          <section aria-label="Appearance" className={sectionClass}>
            <h2 className={sectionLabelClass}>Appearance</h2>

            <div className={rowClass}>
              <div>
                <p className="text-base font-medium text-[var(--text)]">
                  Dark Mode
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {mode === 'dark' ? 'Dark theme active' : 'Light theme active'}
                </p>
              </div>

              {/* Sun / Moon toggle — Requirement 7.1 */}
              <button
                type="button"
                aria-label={
                  isStorageAvailable
                    ? mode === 'dark'
                      ? 'Switch to light mode'
                      : 'Switch to dark mode'
                    : 'Theme toggle disabled — localStorage unavailable'
                }
                aria-pressed={mode === 'light'}
                disabled={!isStorageAvailable}
                onClick={toggle}
                className={[
                  'flex items-center justify-center',
                  'w-11 h-11 rounded-full',
                  'border border-[var(--border)]',
                  'bg-[var(--bg)] transition-colors duration-300',
                  'hover:bg-[var(--border)] active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
                  'focus-visible:ring-offset-[var(--bg)]',
                  !isStorageAvailable
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer',
                ].join(' ')}
              >
                {mode === 'dark' ? (
                  <Sun
                    size={20}
                    className="text-amber-400"
                    aria-hidden="true"
                  />
                ) : (
                  <Moon
                    size={20}
                    className="text-slate-600"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>

            {/* Storage unavailable notice (Requirement 2.6) */}
            {!isStorageAvailable && (
              <p className="text-xs text-amber-400" role="note">
                Theme preference cannot be saved — localStorage is unavailable.
              </p>
            )}
          </section>

          {/* ── Data section ───────────────────────────────────────────── */}
          {/* Requirements 7.2, 7.3, 7.6 */}
          <section aria-label="Data" className={sectionClass}>
            <h2 className={sectionLabelClass}>Data</h2>

            {/* Last Updated — Requirement 7.3 */}
            <div className={rowClass}>
              <div>
                <p className="text-base font-medium text-[var(--text)]">
                  Last Updated
                </p>
                <p
                  className="text-sm text-[var(--text-secondary)]"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {lastUpdatedStr ?? 'Never'}
                </p>
              </div>
            </div>

            {/* Refresh Data — Requirements 7.2, 7.6 */}
            <Button
              variant="primary"
              size="md"
              loading={isRefreshing}
              disabled={isRefreshing}
              aria-label={isRefreshing ? 'Refreshing data…' : 'Refresh all portfolio data'}
              onClick={handleRefresh}
              className="w-full justify-center"
            >
              {!isRefreshing && (
                <RefreshCw
                  size={16}
                  aria-hidden="true"
                />
              )}
              {isRefreshing ? 'Refreshing…' : 'Refresh Data'}
            </Button>
          </section>

          {/* ── About section ──────────────────────────────────────────── */}
          {/* Requirements 7.4, 7.5 */}
          <section aria-label="About" className={sectionClass}>
            <h2 className={sectionLabelClass}>About</h2>

            {/* App version — Requirement 7.4 */}
            <div className={rowClass}>
              <p className="text-base font-medium text-[var(--text)]">
                Version
              </p>
              <p className="text-sm font-mono text-[var(--text-secondary)]">
                {APP_VERSION}
              </p>
            </div>

            <hr className="border-[var(--border)]" />

            {/* Description + GitHub link — Requirement 7.5 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Info
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-400"
                  aria-hidden="true"
                />
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Equity Dashboard is a mobile-first portfolio tracker that pulls
                  live investment data from Google Sheets via a Google Apps Script
                  REST API. Installable as a PWA on iPhone for a native-app
                  experience.
                </p>
              </div>

              {/* <a
                href="https://github.com/equity-dashboard/equity-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source code on GitHub (opens in new tab)"
                className={[
                  'flex items-center gap-2',
                  'text-sm font-medium text-emerald-400',
                  'hover:text-emerald-300 transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
                  'focus-visible:ring-offset-[var(--bg)]',
                  'rounded-sm',
                ].join(' ')}
              >
                <GitBranch size={16} aria-hidden="true" />
                github.com/equity-dashboard/equity-dashboard
              </a> */}
            </div>
          </section>

        </div>
      </main>

      {/* ── Error toast — Requirement 7.7 ──────────────────────────────── */}
      <AnimatePresence>
        {errorToast && (
          <Toast
            key="settings-error-toast"
            message={errorToast}
            type="error"
            onDismiss={() => setErrorToast(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
