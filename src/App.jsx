import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { PortfolioProvider } from './context/PortfolioContext';
import BottomNav from './components/navigation/BottomNav';
import Skeleton from './components/ui/Skeleton';
import LoginPage from "./pages/Login/LoginPage";
import { isLoggedIn } from "./services/apiClient";

// ---------------------------------------------------------------------------
// Lazy page imports — each page becomes its own bundle chunk (Requirement 11.7)
// ---------------------------------------------------------------------------
const DashboardPage  = lazy(() => import('./pages/Dashboard/DashboardPage'));
const AnalyticsPage  = lazy(() => import('./pages/Analytics/AnalyticsPage'));
const PortfolioPage  = lazy(() => import('./pages/Portfolio/PortfolioPage'));
const SettingsPage   = lazy(() => import('./pages/Settings/SettingsPage'));


// ---------------------------------------------------------------------------
// Page-level Suspense fallback
// ---------------------------------------------------------------------------
function PageFallback() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-24" role="status" aria-label="Loading page…">
      <Skeleton height={48} rounded="xl" />
      <Skeleton height={200} rounded="card" />
      <Skeleton height={120} rounded="card" />
      <Skeleton height={80} rounded="card" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AppShell — wraps every page; renders active page via <Outlet> + <BottomNav>
// ---------------------------------------------------------------------------
function AppShell() {
  return (
    <div className="relative flex h-[100svh] flex-col overflow-hidden bg-[#0F172A]">
      {/* Active page renders here */}
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>

      {/* BottomNav is always visible outside the page outlet (Requirement 1.1) */}
      <BottomNav />
    </div>
  );
}

// ---------------------------------------------------------------------------
// "Add to Home Screen" banner
// Shown when the user opens the app in Safari browser (not standalone mode).
// Requirements: 10.6
// ---------------------------------------------------------------------------
function AddToHomeScreenBanner({ onDismiss }) {
  return (
    <div
      role="banner"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[100] flex items-center gap-3 bg-[#1E293B] border-b border-[#334155] px-4 py-3 text-sm text-slate-200"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <span className="flex-1">
        For the best experience, tap{' '}
        <strong className="text-emerald-400">Share</strong> →{' '}
        <strong className="text-emerald-400">Add to Home Screen</strong>.
      </span>
      <button
        type="button"
        aria-label="Dismiss banner"
        onClick={onDismiss}
        className="shrink-0 text-slate-400 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Standalone mode detection (Requirement 10.6)
// ---------------------------------------------------------------------------
function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean(window.navigator.standalone)
  );
}

import { PrivacyProvider } from './context/PrivacyContext';

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------
export default function App() {
  const [showBanner, setShowBanner] = useState(false);
  const [loggedIn, setLoggedIn] = useState(
  isLoggedIn()
);

  // Detect standalone mode on mount; show banner if running in browser.
  useEffect(() => {
    if (!isStandaloneMode()) {
      setShowBanner(true);
    }
  }, []);

if (!loggedIn) {
  return (
    <ThemeProvider>
      <LoginPage
        onLogin={() => setLoggedIn(true)}
      />
    </ThemeProvider>
  );
}

  return (
    /*
     * Provider order (outer → inner):
     *   ThemeProvider  — applies dark/light class to <html>
     *   PortfolioProvider — all async data state
     *   PrivacyProvider — state for discrete masking mode
     *   BrowserRouter  — client-side routing with GitHub Pages basename
     */
    <ThemeProvider>
      <PortfolioProvider>
        <PrivacyProvider>
          <BrowserRouter basename="/equity-dashboard/">
          {/* "Add to Home Screen" banner — only visible in non-standalone Safari */}
          {showBanner && (
            <AddToHomeScreenBanner onDismiss={() => setShowBanner(false)} />
          )}

          <Routes>
            {/* AppShell wraps every route so BottomNav is always rendered */}
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </PrivacyProvider>
      </PortfolioProvider>
    </ThemeProvider>
  );
}
