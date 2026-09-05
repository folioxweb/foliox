import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useNavigate } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { PrivacyProvider } from './context/PrivacyContext';
import BottomNav from './components/navigation/BottomNav';
import SidebarNav from './components/navigation/SidebarNav';
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
import SetNewPasswordModal from './components/auth/SetNewPasswordModal';
import AppGuideModal from './components/guide/AppGuideModal';
import WhatsNewModal from './components/whatsNew/WhatsNewModal';
import { hasSeenCurrentVersion, markCurrentVersionAsSeen } from './config/version';

// ---------------------------------------------------------------------------
// AppShell — wraps every page; renders Sidebar on Desktop & BottomNav on Mobile
// ---------------------------------------------------------------------------
function AppShell() {
  return (
    <div className="relative flex h-[100svh] flex-col lg:flex-row overflow-hidden bg-[var(--bg)]">
      {/* Top safe-area status bar overlay (Mobile only) */}
      <div
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none lg:hidden"
        style={{
          height: 'env(safe-area-inset-top, 0px)',
          background: 'var(--header-bg)',
          transition: 'background-color 0.22s ease',
        }}
      />

      {/* Desktop Sidebar Navigation (Visible on lg: >= 1024px) */}
      <SidebarNav />

      {/* Main Page Outlet Container */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>

      {/* BottomNav is visible only on Mobile/Tablet (< 1024px) */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
      
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
// App root
// ---------------------------------------------------------------------------
function AppContent() {
  const { user, isLoggedIn, loading, signOut, isPasswordRecovery, setIsPasswordRecovery } = useAuth();
  const [showAutoGuide, setShowAutoGuide] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const navigate = useNavigate();

  // Check if first-time user guide or What's New release popup should be shown
  useEffect(() => {
    if (isLoggedIn && !loading) {
      const hasSeenGuide = localStorage.getItem('foliox_guide_seen');
      if (!hasSeenGuide) {
        const timer = setTimeout(() => {
          setShowAutoGuide(true);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        // User has already completed onboarding guide; check for release popup
        const seenRelease = hasSeenCurrentVersion(user);
        if (!seenRelease) {
          const timer = setTimeout(() => {
            setShowWhatsNew(true);
          }, 600);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isLoggedIn, loading, user]);

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
      <>
        <LoginPage
          onLogin={() => {
            navigate('/', { replace: true });
          }}
        />
        <SetNewPasswordModal
          isOpen={isPasswordRecovery}
          onClose={() => setIsPasswordRecovery(false)}
        />
      </>
    );
  }

  return (
    <>
      {/* First-login Feature Tour Guide Modal */}
      <AppGuideModal
        isOpen={showAutoGuide}
        onClose={() => {
          setShowAutoGuide(false);
          markCurrentVersionAsSeen(user);
        }}
      />

      {/* What's New Release Popup Modal */}
      <WhatsNewModal
        isOpen={showWhatsNew}
        onClose={() => {
          markCurrentVersionAsSeen(user);
          setShowWhatsNew(false);
        }}
      />

      {/* Recovery Modal if triggered while session exists */}
      <SetNewPasswordModal
        isOpen={isPasswordRecovery}
        onClose={() => setIsPasswordRecovery(false)}
      />

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
            <BrowserRouter basename={import.meta.env.BASE_URL || "/foliox/"}>
              <AppContent />
            </BrowserRouter>
          </PrivacyProvider>
        </PortfolioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}