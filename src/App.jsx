import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useNavigate } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { PrivacyProvider } from './context/PrivacyContext';
import BottomNav from './components/navigation/BottomNav';
import LoginPage from "./pages/Login/LoginPage";
import VoiceAssistant from './components/VoiceAssistant';

// ---------------------------------------------------------------------------
// Direct page imports for instantaneous tab switching without Suspense flash
// ---------------------------------------------------------------------------
import DashboardPage from './pages/Dashboard/DashboardPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import PortfolioPage from './pages/Portfolio/PortfolioPage';
import WatchlistPage from './pages/Watchlist/WatchlistPage';
import PaperTradePage from './pages/PaperTrade/PaperTradePage';
import DetailScreen from './pages/Portfolio/DetailScreen';
import SettingsPage from './pages/Settings/SettingsPage';
import IpoListPage from './pages/IPO/IpoListPage';
import IpoDetailPage from './pages/IPO/IpoDetailPage';

// ---------------------------------------------------------------------------
// AppShell — wraps every page; renders active page via <Outlet> + <BottomNav>
// ---------------------------------------------------------------------------
function AppShell() {
  return (
    <div className="relative flex h-[100svh] flex-col overflow-hidden bg-[var(--bg)]">
      {/* Top safe-area status bar overlay */}
      <div
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        style={{
          height: 'env(safe-area-inset-top, 0px)',
          background: 'var(--header-bg)',
          transition: 'background-color 0.22s ease',
        }}
      />

      {/* Active page renders instantly without Suspense delay */}
      <Outlet />

      {/* BottomNav is always visible outside the page outlet */}
      <BottomNav />
      
      {/* Global Voice Assistant Component (commented out for now) */}
      {/* <VoiceAssistant /> */}
    </div>
  );
}

// -------------------------------------------
// Initial Auth Loading Screen
// ---------------------------------------------------------------------------
function AuthLoadingScreen() {
  return (
    <div className="flex h-[100svh] w-full flex-col items-center justify-center bg-[var(--bg)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// "Add to Home Screen" banner
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
// Standalone mode detection
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
  const { isLoggedIn, loading, signOut } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const navigate = useNavigate();

  // Detect standalone mode on mount; show banner if running in browser.
  useEffect(() => {
    if (!isStandaloneMode()) {
      setShowBanner(true);
    }
  }, []);

  // Listen for a custom app-wide logout event (for legacy or external calls)
  useEffect(() => {
    const handleLogout = () => {
      signOut();
      navigate('/', { replace: true });
    };

    window.addEventListener("app-logout", handleLogout);

    return () => {
      window.removeEventListener("app-logout", handleLogout);
    };
  }, [navigate, signOut]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={() => {
          navigate('/', { replace: true });
        }}
      />
    );
  }

  return (
    <>
      {/* "Add to Home Screen" banner */}
      {showBanner && (
        <AddToHomeScreenBanner onDismiss={() => setShowBanner(false)} />
      )}

      <Routes>
        {/* AppShell wraps every route so BottomNav is always rendered */}
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="paper-trade" element={<PaperTradePage />} />
          <Route path="portfolio/holding-detail" element={<DetailScreen />} />
          <Route path="holding-detail" element={<DetailScreen />} />
          <Route path="ipo" element={<IpoListPage />} />
          <Route path="ipo/:id" element={<IpoDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PortfolioProvider>
          <PrivacyProvider>
            <BrowserRouter basename="/foliox/">
              <AppContent />
            </BrowserRouter>
          </PrivacyProvider>
        </PortfolioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}