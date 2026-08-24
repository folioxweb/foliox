import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Rocket, 
  Briefcase, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Zap, 
  PieChart, 
  EyeOff, 
  Smartphone, 
  Clock, 
  Share2 
} from 'lucide-react';

const GUIDE_STEPS = [
  {
    id: 'portfolio',
    badge: '1-Min Live Updates',
    badgeColor: 'rgba(16,185,129,0.15)',
    badgeTextColor: 'var(--emerald)',
    icon: TrendingUp,
    iconColor: '#10B981',
    title: 'Live Market Tracking & Fast NAV',
    subtitle: 'Real-time portfolio valuations across all your assets in one command center.',
    points: [
      {
        icon: Clock,
        label: '1-Minute Live Stock & ETF Prices',
        desc: 'Automatic real-time price updates every minute throughout active market hours.',
      },
      {
        icon: Zap,
        label: 'Fastest Mutual Fund NAV Updates',
        desc: 'Lightning-fast daily NAV updates with automated monthly SIP tracking.',
      },
      {
        icon: PieChart,
        label: 'Stocks, ETFs, MFs & FDs',
        desc: 'Unified asset allocation, sector exposure maps, and FD maturity progress bars.',
      },
    ],
  },
  {
    id: 'ipo',
    badge: 'IPO Intelligence',
    badgeColor: 'rgba(245,158,11,0.15)',
    badgeTextColor: '#F59E0B',
    icon: Rocket,
    iconColor: '#F59E0B',
    title: 'Live Mainboard IPO Hub',
    subtitle: 'Track upcoming Mainboard public offerings and make data-driven decisions.',
    points: [
      {
        icon: Zap,
        label: 'Grey Market Premium (GMP)',
        desc: 'Live estimated listing gains and expected premium percentages for Mainboard IPOs.',
      },
      {
        icon: Rocket,
        label: 'Live Subscription Multipliers',
        desc: 'Real-time bidding demand across Institutional (QIB), HNI (NII), and Retail (RII).',
      },
      {
        icon: CheckCircle2,
        label: 'Bidding Dates & Allotment Links',
        desc: 'Open/close timelines, lot sizes, price bands, and direct allotment status.',
      },
    ],
  },
  {
    id: 'paper-trade',
    badge: 'Virtual Trading',
    badgeColor: 'rgba(56,189,248,0.15)',
    badgeTextColor: '#38BDF8',
    icon: Briefcase,
    iconColor: '#38BDF8',
    title: 'Risk-Free Paper Trading',
    subtitle: 'Test investment strategies with simulated capital against live NSE prices.',
    points: [
      {
        icon: Briefcase,
        label: '₹50,00,000 Starting Cash',
        desc: 'Practice buying and selling equities without risking real money.',
      },
      {
        icon: TrendingUp,
        label: 'Real-Time P&L Engine',
        desc: 'Track realized and unrealized gains calculated against live 1-minute market prices.',
      },
      {
        icon: Sparkles,
        label: 'Configurable & Reset-ready',
        desc: 'Adjust your virtual capital or reset your paper portfolio anytime in Settings.',
      },
    ],
  },
  {
    id: 'watchlist',
    badge: 'Market Discovery',
    badgeColor: 'rgba(168,85,247,0.15)',
    badgeTextColor: '#A855F7',
    icon: Search,
    iconColor: '#A855F7',
    title: 'Watchlist & 2,000+ NSE Stocks',
    subtitle: 'Discover opportunities with lightning-fast search and custom tracking.',
    points: [
      {
        icon: Search,
        label: 'Instant Typeahead Search',
        desc: 'Search across 2,000+ Indian equities by ticker or company name.',
      },
      {
        icon: Sparkles,
        label: '1-Tap Watchlist',
        desc: 'Pin your favorite stocks to monitor daily moves before investing.',
      },
      {
        icon: Zap,
        label: 'Holding News & Reports',
        desc: 'Get stock-specific news and official BSE announcements with a single tap.',
      },
    ],
  },
  {
    id: 'ai-privacy',
    badge: 'AI & Security',
    badgeColor: 'rgba(236,72,153,0.15)',
    badgeTextColor: '#EC4899',
    icon: Sparkles,
    iconColor: '#EC4899',
    title: 'AI Summaries & Privacy Shield',
    subtitle: 'Cut through complex corporate filings and keep your wealth private.',
    points: [
      {
        icon: Sparkles,
        label: 'Google Gemini 3.5 Flash',
        desc: 'Multi-page financial PDF filings summarized into 30-second takeaways.',
      },
      {
        icon: EyeOff,
        label: '1-Tap Privacy Mode',
        desc: 'Mask all currency figures with a single tap for public viewing.',
      },
      {
        icon: ShieldCheck,
        label: 'Multi-User Cloud Security',
        desc: 'Encrypted PostgreSQL storage with Row-Level Security isolating your data.',
      },
    ],
  },
  {
    id: 'native-app',
    badge: 'App Experience',
    badgeColor: 'rgba(99,102,241,0.15)',
    badgeTextColor: '#818CF8',
    icon: Smartphone,
    iconColor: '#818CF8',
    title: 'Install as a Native App',
    subtitle: 'Add Foliox to your phone home screen for the fastest, full-screen experience.',
    points: [
      {
        icon: Share2,
        label: 'On iPhone / iPad (Safari)',
        desc: 'Tap the Share icon (box with arrow) at the bottom ➔ Tap "Add to Home Screen".',
      },
      {
        icon: Smartphone,
        label: 'On Android (Chrome)',
        desc: 'Tap the 3-dots menu (⋮) at the top-right ➔ Tap "Install App" or "Add to Home screen".',
      },
      {
        icon: Sparkles,
        label: 'Full-Screen & Instant Launch',
        desc: 'Runs without browser address bars, with offline caching and instant app switching.',
      },
    ],
  },
];

export default function AppGuideModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = GUIDE_STEPS[currentStep];
  const isLastStep = currentStep === GUIDE_STEPS.length - 1;
  const IconComponent = step.icon;

  function handleNext() {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  function handleComplete() {
    localStorage.setItem('foliox_guide_seen', 'true');
    if (onClose) onClose();
  }

  // Swipe support for mobile
  const minSwipeDistance = 50;
  function onTouchStart(e) {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }

  function onTouchMove(e) {
    setTouchEnd(e.targetTouches[0].clientX);
  }

  function onTouchEnd() {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !isLastStep) {
      handleNext();
    }
    if (isRightSwipe && currentStep > 0) {
      handlePrev();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 py-6 transition-opacity animate-fade-in">
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative transition-all"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          maxHeight: '92vh',
        }}
      >
        {/* Top Header: Badge, Step Counter, and Close */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{
                background: step.badgeColor,
                color: step.badgeTextColor,
              }}
            >
              {step.badge}
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {currentStep + 1} of {GUIDE_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleComplete}
            className="p-1.5 rounded-full transition hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close Tour"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Main Visual Icon */}
          <div className="flex justify-center my-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-105"
              style={{
                background: step.badgeColor,
                border: `1px solid ${step.iconColor}33`,
              }}
            >
              <IconComponent size={28} style={{ color: step.iconColor }} />
            </div>
          </div>

          {/* Titles */}
          <h2 className="text-lg font-extrabold text-center mt-1" style={{ color: 'var(--text)' }}>
            {step.title}
          </h2>
          <p className="text-xs text-center mt-1 mb-4 leading-relaxed px-2" style={{ color: 'var(--text-muted)' }}>
            {step.subtitle}
          </p>

          {/* Feature Points Cards */}
          <div className="space-y-2.5 mb-4">
            {step.points.map((pt, idx) => {
              const PtIcon = pt.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-2xl transition"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--divider)',
                  }}
                >
                  <div
                    className="p-2 rounded-xl mt-0.5 flex-shrink-0"
                    style={{ background: step.badgeColor }}
                  >
                    <PtIcon size={16} style={{ color: step.iconColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                      {pt.label}
                    </h4>
                    <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'var(--text-2)' }}>
                      {pt.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation & Controls */}
        <div className="pt-3 border-t" style={{ borderColor: 'var(--divider)' }}>
          {/* Progress Indicator Dots */}
          <div className="flex justify-center items-center gap-1.5 mb-3.5">
            {GUIDE_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: idx === currentStep ? '24px' : '6px',
                  background: idx === currentStep ? 'var(--emerald)' : 'var(--card-border)',
                }}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center justify-center gap-1 rounded-2xl py-2.5 px-4 text-xs font-bold transition hover:opacity-80"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-2)',
                }}
              >
                <ChevronLeft size={16} />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="rounded-2xl py-2.5 px-4 text-xs font-semibold transition hover:opacity-80"
                style={{
                  color: 'var(--text-muted)',
                }}
              >
                Skip Tour
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 px-4 text-white text-xs font-bold transition hover:opacity-95 shadow-lg"
              style={{
                background: isLastStep ? 'linear-gradient(135deg, #10B981, #059669)' : 'var(--emerald)',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              }}
            >
              {isLastStep ? (
                <>
                  <Sparkles size={15} />
                  Get Started with Foliox
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
