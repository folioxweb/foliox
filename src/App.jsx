import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useNavigate } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { PrivacyProvider } from './context/PrivacyContext';
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
    <div className="relative flex h-[100svh] flex-col overflow-hidden bg-[var(--bg)]">
      {/* Top safe-area status bar overlay to block scrolled content */}
      <div
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        style={{
          height: 'env(safe-area-inset-top, 0px)',
          background: 'var(--header-bg)',
          transition: 'background-color 0.22s ease',
        }}
      />

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

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------
function AppContent() {
  const [showBanner, setShowBanner] = useState(false);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const navigate = useNavigate();

  // Detect standalone mode on mount; show banner if running in browser.
  useEffect(() => {
    if (!isStandaloneMode()) {
      setShowBanner(true);
    }
  }, []);

  // Listen for focus/visibility changes to sync login state across tabs
  useEffect(() => {
    const syncLoginState = () => {
      const isLog = isLoggedIn();
      setLoggedIn(isLog);
      if (!isLog) {
        navigate('/', { replace: true });
      }
    };

    window.addEventListener("focus", syncLoginState);
    document.addEventListener("visibilitychange", syncLoginState);

    return () => {
      window.removeEventListener("focus", syncLoginState);
      document.removeEventListener("visibilitychange", syncLoginState);
    };
  }, [navigate]);

  // Listen for a custom app-wide logout event
  useEffect(() => {
    const handleLogout = () => {
      setLoggedIn(false);
      navigate('/', { replace: true });
    };

    window.addEventListener("app-logout", handleLogout);

    return () => {
      window.removeEventListener("app-logout", handleLogout);
    };
  }, [navigate]);

  if (!loggedIn) {
    return (
      <LoginPage
        onLogin={() => {
          setLoggedIn(true);
          navigate('/', { replace: true }); // Always redirect to dashboard on login
        }}
      />
    );
  }

  return (
    <>
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
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PortfolioProvider>
        <PrivacyProvider>
          <BrowserRouter basename="/equity-dashboard/">
            <AppContent />
          </BrowserRouter>
        </PrivacyProvider>
      </PortfolioProvider>
    </ThemeProvider>
  );
}