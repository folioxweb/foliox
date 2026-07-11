import { useState } from 'react';
import { Info, Database, Trash2, Shield, LogOut } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import usePageScrollRestoration from '../../hooks/usePageScrollRestoration';
import { logout } from "../../services/apiClient";

// App version — falls back to '0.0.0' if env var is not set (Requirement 7.4)
const APP_VERSION = "1.0.1";
const BUILD_DATE = __BUILD_DATE__;
const REACT_VERSION = __REACT_VERSION__;
const VITE_VERSION = __VITE_VERSION__;
const API_VERSION = "Version 40 on 12 Jul 2026, 12:48 AM"; // Maintain manually 

function formatLastUpdated(date) {

  if (!date) return "Never";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

}

export default function SettingsPage() {
  const { state } = usePortfolio();
  const scrollRef = usePageScrollRestoration('settings');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const lastUpdated = formatLastUpdated(
  state.lastUpdated
);

  function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3">

      <span className="text-sm text-[var(--text-secondary)]">
        {label}
      </span>

      <span className="text-sm font-semibold text-[var(--text)]">
        {value}
      </span>

    </div>
  );

  
}

  // ── Section styles ───────────────────────────────────────────────────────
  const sectionClass = [
    'rounded-[24px] border border-[var(--border)]',
    'bg-[var(--surface)] backdrop-blur-sm px-5 py-4',
    'shadow-lg flex flex-col gap-3',
  ].join(' ');

  const sectionLabelClass =
    'text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]';

  const rowClass = "flex items-center justify-between";

  function handleClearCache() {
    localStorage.removeItem("portfolio-cache");
    window.location.reload();
  }

  return (
    <>
      <main
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-28"
        aria-label="Settings"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        {/* ── Page heading ──────────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text)]">Settings</h1>
        </div>

        {/* ───────────────── Storage ───────────────── */}
        <section aria-label="Storage" className={sectionClass}>
          <h2 className={sectionLabelClass}>Storage</h2>
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="mt-1">
                <Database size={20} className="text-sky-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">
                  Local Cache
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Portfolio data is stored locally for faster startup. Clearing the cache will download fresh data from the server.
                </p>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-800/50 px-3 py-2">
  <span className="text-sm text-[var(--text-secondary)]">
    Last Updated
  </span>

  <span className="text-sm font-medium text-[var(--text)]">
    {lastUpdated}
  </span>
</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20"
            onClick={handleClearCache}
          >
            <Trash2 size={16} />
            Clear Cache
          </button>
        </section>

        <div className="mt-4" /> {/* Spacer between sections */}

        {/* ───────────────── Security ───────────────── */}
        <section aria-label="Security" className={sectionClass}>
          <h2 className={sectionLabelClass}>Security</h2>
          <div className="flex items-start gap-3">
            <Shield size={20} className="mt-1 text-amber-400" />
            <div>
              <h3 className="text-base font-semibold text-[var(--text)]">Logout</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                End your current session. You'll need to sign in again to access your portfolio.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutDialog(true)}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-400 transition-all hover:bg-amber-500/20"
          >
            <LogOut size={16} />
            Logout
          </button>
        </section>

        <div
          className="flex flex-col gap-4 padding-top-10"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          
          <section aria-label="About" className={sectionClass}>
            <h2 className={sectionLabelClass}>
  About
</h2>

<div className="flex items-center gap-3 mb-3">
  <Info
    size={20}
    className="text-sky-400"
  />

  <div>
    <h3 className="text-lg font-semibold text-[var(--text)]">
      Equity Dashboard
    </h3>

    <p className="text-sm text-[var(--text-secondary)]">
      Personal Portfolio Management Platform
    </p>
  </div>
</div>

<div className="divide-y divide-[var(--border)]">

  <InfoRow
    label="App Version"
    value={APP_VERSION}
  />

  <InfoRow
    label="API Version"
    value={API_VERSION}
  />

  <InfoRow
    label="Build Date"
    value={BUILD_DATE}
  />

  <InfoRow
    label="React"
    value={REACT_VERSION}
  />

  <InfoRow
    label="Vite"
    value={VITE_VERSION}
  />

  <InfoRow
    label="Powered By"
    value="Google Apps Script"
  />

  <InfoRow
    label="Hosting"
    value="GitHub Pages"
  />

  <InfoRow
    label="Developer"
    value="Parth Deshmukh"
  />

</div>  
          </section>
        </div>
      </main>

      {/* ── Logout Dialog ──────────────────────────────────────────── */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[90%] max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Logout?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              You will need to sign in again to access your portfolio.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800"
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