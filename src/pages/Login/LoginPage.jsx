import { useState, useRef } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
  LogIn,
  KeyRound,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Sparkles,
  PieChart,
  CheckCircle2,
  ChevronRight,
  Sun,
  Moon,
  Zap,
  LineChart,
  FileText,
  Compass,
  Check,
  ArrowUpRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../services/apiClient";
import { IS_UAT } from "../../config/version";

// Clean, standard, authentic landing assets
import portfolioCleanImg from "../../assets/landing/portfolio-clean-preview.jpg";
import geminiFilingCleanImg from "../../assets/landing/gemini-filing-clean-preview.jpg";
import ipoCleanImg from "../../assets/landing/ipo-clean-preview.jpg";
import paperTradingCleanImg from "../../assets/landing/paper-trading-clean-preview.jpg";

// Live Market Ticker Data (Clean major indices only)
const TICKER_ITEMS = [
  { symbol: "NIFTY 50", price: "25,418.50", change: "+124.30", pct: "+0.49%", isUp: true },
  { symbol: "SENSEX", price: "83,184.80", change: "+372.40", pct: "+0.45%", isUp: true },
  { symbol: "BANK NIFTY", price: "52,190.20", change: "+210.15", pct: "+0.40%", isUp: true },
  { symbol: "NIFTY IT", price: "43,890.10", change: "+680.90", pct: "+1.57%", isUp: true },
  { symbol: "NIFTY MIDCAP 150", price: "21,480.60", change: "+174.30", pct: "+0.82%", isUp: true },
  { symbol: "NIFTY SMALLCAP 250", price: "18,340.20", change: "+208.50", pct: "+1.15%", isUp: true }
];

// Interactive Allocation Demo Model (Strictly what the app supports: Stocks, Mutual Funds, ETFs, Fixed Deposits)
const ALLOCATION_PREVIEWS = [
  { name: "Stocks", pct: 58, color: "#10B981", value: "₹24,65,000", returnVal: "+24.8%" },
  { name: "Mutual Funds", pct: 24, color: "#3B82F6", value: "₹10,20,000", returnVal: "+16.2%" },
  { name: "ETFs", pct: 12, color: "#8B5CF6", value: "₹5,10,000", returnVal: "+14.5%" },
  { name: "Fixed Deposits", pct: 6, color: "#64748B", value: "₹2,55,000", returnVal: "+7.1%" },
];

export default function LoginPage({ onLogin }) {
  const { signInWithEmail, signUpWithEmail, resetPasswordForEmail, authError, setAuthError } = useAuth();
  const themeContext = useTheme();
  
  // Robust theme access with toggle
  const isDark = themeContext ? themeContext.mode === "dark" : true;
  const toggleTheme = themeContext && typeof themeContext.toggle === "function" ? themeContext.toggle : () => {};

  const [view, setView] = useState(authError ? "forgot" : "signin"); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Interactive UI state for Allocation Widget
  const [selectedAsset, setSelectedAsset] = useState(ALLOCATION_PREVIEWS[0]);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);

  const authCardRef = useRef(null);
  const emailInputRef = useRef(null);

  const isSupabase = import.meta.env.VITE_BACKEND_TARGET === "SUPABASE" || localStorage.getItem("backend_target") === "SUPABASE";

  // Scroll to Auth Form smoothly
  const scrollToAuth = (targetView = "signin") => {
    setView(targetView);
    setError("");
    setSuccessMsg("");
    if (authCardRef.current) {
      authCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        if (emailInputRef.current) emailInputRef.current.focus();
      }, 450);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (setAuthError) setAuthError(null);

    if (isSupabase && !email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (view === "forgot") {
      try {
        setLoading(true);
        await resetPasswordForEmail(email);
        setSuccessMsg("Password reset link sent! Please check your email inbox.");
      } catch (err) {
        setError(err.message || "Failed to send password reset email.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      if (isSupabase) {
        if (view === "signup") {
          const data = await signUpWithEmail(email, password);
          if (data?.user && !data?.session) {
            setSuccessMsg("Account created! Please check your email to confirm your account before logging in.");
            setView("signin");
          } else {
            if (onLogin) onLogin();
          }
        } else {
          await signInWithEmail(email, password);
          if (onLogin) onLogin();
        }
      } else {
        // Fallback for legacy GAS backend
        await api.login(password);
        if (onLogin) onLogin();
      }
    } catch (err) {
      const msg = err.message || (view === "signup" ? "Registration failed." : "Invalid email or password.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Feature Showcase Data - Reflects actual FolioX capabilities without exaggeration
  const FEATURES = [
    {
      id: "portfolio",
      tag: "PORTFOLIO TRACKING",
      title: "Unified Portfolio Management",
      subtitle: "Stocks, ETFs, Mutual Funds, and Fixed Deposits in one view",
      description: "Consolidate your investments across Indian Stocks, ETFs, Mutual Funds, and Fixed Deposits into a single dashboard. Track real-time valuations, total returns, day changes, and sector weights with ease.",
      image: portfolioCleanImg,
      badge: "Stocks • ETFs • Mutual Funds • FDs",
      highlights: [
        "Comprehensive tracking of Stocks, ETFs, Mutual Funds, and Fixed Deposits",
        "Real-time profit & loss, invested capital, and overall return metrics",
        "Automatic sector tagging and dynamic asset allocation breakdowns"
      ]
    },
    {
      id: "ai-filings",
      tag: "AI RESEARCH",
      title: "Google Gemini 3.5 Flash Document Analysis",
      subtitle: "Instant executive takeaways from corporate announcements & financial filings",
      description: "Save hours spent analyzing lengthy financial PDF reports. Google Gemini 3.5 Flash synthesizes company results and corporate filings, producing structured executive summaries, revenue trends, margin highlights, positives, and risks.",
      image: geminiFilingCleanImg,
      badge: "Google Gemini 3.5 Flash",
      highlights: [
        "Integrated Google Gemini 3.5 Flash AI model for fast, accurate document extraction",
        "Clear breakdown of Key Financial Highlights, Positives, and Risk Factors",
        "Structured executive summaries and management commentary insights"
      ]
    },
    {
      id: "ipo",
      tag: "IPO TRACKER",
      title: "IPO Intelligence & Tracker",
      subtitle: "Track active and upcoming IPOs with Gray Market Premium (GMP)",
      description: "Stay ahead of initial public offerings with clear data on price bands, lot sizes, bidding windows, and allotment timelines. Monitor real-time Gray Market Premium (GMP) and subscription demand across QIB, NII, and Retail categories.",
      image: ipoCleanImg,
      badge: "Mainboard & SME IPOs",
      highlights: [
        "Full pipeline coverage for both Mainboard and SME initial public offerings",
        "Real-time Gray Market Premium (GMP) tracking and estimated listing gains",
        "Live subscription multiples across institutional and retail investor quotas"
      ]
    },
    {
      id: "paper-trading",
      tag: "VIRTUAL SANDBOX",
      title: "Virtual Paper Trading Simulator",
      subtitle: "Practice trading and test strategies with ₹50,00,000 virtual balance",
      description: "Refine your execution and test trade strategies in a zero-risk virtual environment. Start with ₹50 Lakh in virtual capital, place simulated buy and sell market orders, track your open positions, and review your performance.",
      image: paperTradingCleanImg,
      badge: "₹50,00,000 Virtual Capital",
      highlights: [
        "₹50,00,000 virtual capital to build and test investment strategies safely",
        "Simulated market execution with real-time unrealized P&L updates",
        "Dedicated trade journaling with position tracking and complete order history"
      ]
    }
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-500"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--sans)"
      }}
    >
      {/* ─── 1. TOP NAVBAR ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-colors duration-200"
        style={{
          background: isDark ? "rgba(11, 17, 32, 0.88)" : "rgba(255, 255, 255, 0.92)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}apple-touch-icon.png`}
              alt="FolioX Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-sm object-cover flex-shrink-0"
              onError={(e) => {
                if (e.currentTarget.src !== '/foliox/apple-touch-icon.png') {
                  e.currentTarget.src = '/foliox/apple-touch-icon.png';
                }
              }}
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[var(--text)]">
                FolioX
              </span>
              {IS_UAT && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  UAT
                </span>
              )}
            </div>
          </div>

          {/* Desktop Live Market Pulse Pill */}
          <div
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md"
            style={{
              background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[var(--text-muted)] font-medium">MARKET LIVE</span>
            <span className="font-bold text-[var(--text)]">NIFTY 50</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">25,418.50 (+0.49%)</span>
          </div>

          {/* Navigation Links & Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
              <a href="#features" className="hover:text-[var(--text)] transition">Features</a>
              <a href="#market-pulse" className="hover:text-[var(--text)] transition">Markets</a>
              <a href="#security" className="hover:text-[var(--text)] transition">Security</a>
              <a href="#philosophy" className="hover:text-[var(--text)] transition">Philosophy</a>
            </nav>

            {/* Dark / Light Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl transition hover:opacity-80 border focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              style={{
                background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)",
                color: "var(--text)"
              }}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} className="text-slate-700" />
              )}
            </button>

            {/* High-Contrast "Sign In" Button */}
            <button
              type="button"
              onClick={() => scrollToAuth("signin")}
              className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION WITH LOGIN TERMINAL ──────────────────────────────────── */}
      <section className="relative w-full pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-18 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero Narrative & Interactive Widget (Desktop: 7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-6 sm:space-y-7">
            {/* Overline Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold tracking-wide w-max shadow-sm"
              style={{
                background: isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.1)",
                borderColor: "rgba(16, 185, 129, 0.3)",
                color: isDark ? "#34D399" : "#059669"
              }}
            >
              <Sparkles size={14} />
              <span>MODERN PORTFOLIO & WEALTH TRACKER</span>
            </div>

            {/* Headline - Solid, crisp contrast in both dark & light modes */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-[var(--text)]">
              Command Your Entire <br className="hidden sm:block" />
              <span className="text-emerald-600 dark:text-emerald-400">
                Wealth Portfolio.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[var(--text-2)] leading-relaxed max-w-2xl">
              A unified, distraction-free portfolio terminal for Indian Stocks, ETFs, Mutual Funds, and Fixed Deposits. Featuring Google Gemini 3.5 Flash corporate document summaries, live IPO tracking, and virtual paper trading.
            </p>

            {/* Key Value Badges */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div
                className="p-3 rounded-2xl border flex items-center gap-3 backdrop-blur-sm"
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
                }}
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Multi-Asset</div>
                  <div className="text-[11px] text-[var(--text-muted)]">Stocks • MF • ETFs • FD</div>
                </div>
              </div>

              <div
                className="p-3 rounded-2xl border flex items-center gap-3 backdrop-blur-sm"
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
                }}
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Gemini 3.5 Flash</div>
                  <div className="text-[11px] text-[var(--text-muted)]">Filing Summaries</div>
                </div>
              </div>

              <div
                className="p-3 rounded-2xl border flex items-center gap-3 backdrop-blur-sm"
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
                }}
              >
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Private & Secure</div>
                  <div className="text-[11px] text-[var(--text-muted)]">Encrypted Vault</div>
                </div>
              </div>
            </div>

            {/* Interactive Live Asset Allocation Simulation Widget */}
            <div
              className="p-5 sm:p-6 rounded-3xl border shadow-md backdrop-blur-md transition-all duration-300"
              style={{
                background: isDark ? "rgba(17, 24, 39, 0.75)" : "rgba(255, 255, 255, 0.95)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.05)"
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs sm:text-sm font-bold tracking-wide uppercase text-[var(--text-muted)]">
                    Asset Allocation Preview
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold border border-emerald-500/20">
                  Total Returns +18.4%
                </span>
              </div>

              {/* Allocation Multi-Segment Progress Bar */}
              <div
                className="h-3.5 w-full rounded-full overflow-hidden flex p-0.5 gap-1 mb-4"
                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
              >
                {ALLOCATION_PREVIEWS.map((item) => (
                  <div
                    key={item.name}
                    onClick={() => setSelectedAsset(item)}
                    className="h-full rounded-full transition-all duration-200 cursor-pointer hover:opacity-90"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                      opacity: selectedAsset.name === item.name ? 1 : 0.65,
                      boxShadow: selectedAsset.name === item.name ? `0 0 8px ${item.color}` : "none"
                    }}
                    title={`${item.name}: ${item.pct}%`}
                  />
                ))}
              </div>

              {/* Selected Asset Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className="p-3 rounded-2xl border"
                  style={{
                    background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
                  }}
                >
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Selected Asset</div>
                  <div className="text-sm font-bold text-[var(--text)] truncate">{selectedAsset.name}</div>
                </div>
                <div
                  className="p-3 rounded-2xl border"
                  style={{
                    background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
                  }}
                >
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Portfolio Weight</div>
                  <div className="text-sm font-bold font-mono text-[var(--text)]">{selectedAsset.pct}%</div>
                </div>
                <div
                  className="p-3 rounded-2xl border"
                  style={{
                    background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
                  }}
                >
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Value</div>
                  <div className="text-sm font-bold font-mono text-[var(--text)]">{selectedAsset.value}</div>
                </div>
                <div
                  className="p-3 rounded-2xl border"
                  style={{
                    background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
                  }}
                >
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Returns</div>
                  <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{selectedAsset.returnVal}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Auth Card (Desktop: 5 cols) */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <div
              ref={authCardRef}
              id="auth-card"
              className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl transition-all duration-300 border relative overflow-hidden"
              style={{
                background: isDark ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.98)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
                boxShadow: isDark
                  ? "0 20px 40px rgba(0, 0, 0, 0.4)"
                  : "0 10px 30px rgba(0, 0, 0, 0.08)"
              }}
            >
              {/* Card Top Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />

              {/* View Selector Tabs (Sign In / Create Account) */}
              {isSupabase && view !== "forgot" && (
                <div
                  className="flex rounded-2xl p-1 mb-6 border"
                  style={{
                    background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setView("signin");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 ${
                      view === "signin"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    <LogIn size={15} />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setView("signup");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 ${
                      view === "signup"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    <UserPlus size={15} />
                    <span>Create Account</span>
                  </button>
                </div>
              )}

              {/* View Header */}
              <div className="text-center mb-6">
                <div
                  className="w-13 h-13 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-inner"
                  style={{ background: "rgba(16, 185, 129, 0.12)" }}
                >
                  {view === "forgot" ? (
                    <KeyRound size={26} className="text-emerald-600 dark:text-emerald-400" />
                  ) : view === "signup" ? (
                    <UserPlus size={26} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ShieldCheck size={26} className="text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)]">
                  {view === "signup"
                    ? "Create FolioX Account"
                    : view === "forgot"
                    ? "Reset Your Password"
                    : "Access FolioX Terminal"}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                  {view === "signup"
                    ? "Free portfolio tracking & AI filing analysis"
                    : view === "forgot"
                    ? "Enter your email to receive recovery instructions"
                    : "Secure login • Instant portfolio synchronization"}
                </p>
              </div>

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Address Field */}
                {isSupabase && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 pl-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                      />
                      <input
                        ref={emailInputRef}
                        type="email"
                        placeholder="investor@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        className="w-full rounded-2xl py-3 pl-12 pr-4 outline-none transition focus:ring-2 focus:ring-emerald-500/50"
                        style={{
                          background: "var(--input-bg)",
                          border: "1px solid var(--input-border)",
                          color: "var(--text)",
                          fontSize: "16px"
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Password Field */}
                {view !== "forgot" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 pl-1">
                      <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Password
                      </label>
                      {isSupabase && view === "signin" && (
                        <button
                          type="button"
                          onClick={() => {
                            setView("forgot");
                            setError("");
                            setSuccessMsg("");
                          }}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={view === "signup" ? "Create Password (min 6 chars)" : "Password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={view === "signup" ? "new-password" : "current-password"}
                        required
                        className="w-full rounded-2xl py-3 pl-12 pr-12 outline-none transition focus:ring-2 focus:ring-emerald-500/50"
                        style={{
                          background: "var(--input-bg)",
                          border: "1px solid var(--input-border)",
                          color: "var(--text)",
                          fontSize: "16px"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {(error || authError) && (
                  <div
                    className="text-xs sm:text-sm text-center font-medium py-2.5 px-3 rounded-2xl border"
                    style={{
                      color: "var(--loss)",
                      background: "rgba(239, 68, 68, 0.08)",
                      borderColor: "rgba(239, 68, 68, 0.2)"
                    }}
                  >
                    <p className="font-bold">{error || authError}</p>
                    {authError && (
                      <p className="text-[11px] mt-1 opacity-80">
                        Reset links expire quickly for account protection.
                      </p>
                    )}
                  </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                  <div
                    className="text-xs sm:text-sm text-center font-medium py-2.5 px-3 rounded-2xl border"
                    style={{
                      color: "#10B981",
                      background: "rgba(16, 185, 129, 0.08)",
                      borderColor: "rgba(16, 185, 129, 0.25)"
                    }}
                  >
                    {successMsg}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl py-3.5 text-white font-extrabold text-sm sm:text-base tracking-wide transition-all duration-150 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 mt-2 shadow-sm"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : view === "signup" ? (
                    <>
                      <UserPlus size={18} />
                      <span>Create Free Account</span>
                    </>
                  ) : view === "forgot" ? (
                    <>
                      <KeyRound size={18} />
                      <span>Send Reset Link</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>Enter Terminal</span>
                    </>
                  )}
                </button>
              </form>

              {/* Forgot Password Back Button */}
              {isSupabase && view === "forgot" && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setView("signin");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition"
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </div>
              )}

              {/* Trust Subtext */}
              <div className="mt-6 pt-5 border-t border-[var(--card-border)] flex items-center justify-center gap-3 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>256-Bit Encrypted</span>
                </span>
                <span>•</span>
                <span>Private Vault</span>
                <span>•</span>
                <span>Zero Ads</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. LIVE MARKET PULSE MARQUEE ────────────────────────────────────────── */}
      <section
        id="market-pulse"
        className="w-full border-y py-3.5 overflow-hidden backdrop-blur-md transition-colors"
        style={{
          background: isDark ? "rgba(15, 23, 42, 0.4)" : "rgba(241, 245, 249, 0.7)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.06)"
        }}
      >
        <div className="animate-ticker-tape flex items-center space-x-8">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-2.5 px-3 py-1 rounded-xl whitespace-nowrap text-xs font-semibold"
            >
              <span className="text-[var(--text-muted)]">{item.symbol}</span>
              <span className="font-mono font-bold text-[var(--text)]">{item.price}</span>
              <span
                className={`font-mono flex items-center gap-0.5 text-[11px] font-bold ${
                  item.isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                }`}
              >
                {item.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {item.pct}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. FOUR CORE CAPABILITIES SHOWCASE ────────────────────────────────────── */}
      <section id="features" className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
            style={{
              background: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.12)",
              color: isDark ? "#34D399" : "#059669",
              border: "1px solid rgba(16, 185, 129, 0.25)"
            }}
          >
            <Zap size={13} />
            <span>Platform Features</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
            Built for Systematic Portfolio Management
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            Four powerful features designed to give you clarity and control over your investments.
          </p>
        </div>

        {/* Feature Selector Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-8">
          {FEATURES.map((feat, index) => {
            const isSelected = activeFeatureTab === index;
            return (
              <button
                key={feat.id}
                type="button"
                onClick={() => setActiveFeatureTab(index)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm border-emerald-600"
                    : "border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {index === 0 && <PieChart size={15} />}
                {index === 1 && <FileText size={15} />}
                {index === 2 && <TrendingUp size={15} />}
                {index === 3 && <LineChart size={15} />}
                <span>{feat.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Feature Deep-Dive Card */}
        <div
          className="rounded-3xl border overflow-hidden shadow-lg transition-all duration-300"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--card-border)"
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-5">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                style={{
                  background: isDark ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.1)",
                  color: isDark ? "#34D399" : "#059669",
                  border: "1px solid rgba(16, 185, 129, 0.25)"
                }}
              >
                {FEATURES[activeFeatureTab].tag}
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                {FEATURES[activeFeatureTab].title}
              </h3>

              <p className="text-sm sm:text-base text-[var(--text-2)] leading-relaxed">
                {FEATURES[activeFeatureTab].description}
              </p>

              {/* Feature Highlights */}
              <div className="space-y-3 pt-2">
                {FEATURES[activeFeatureTab].highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-[var(--text)] font-medium leading-normal">{h}</span>
                  </div>
                ))}
              </div>

              {/* Jump to Sign In / Sign Up */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => scrollToAuth("signup")}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Start using this feature</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Clean Screenshot */}
            <div className="lg:col-span-6">
              <div
                className="rounded-2xl overflow-hidden border shadow-md"
                style={{ borderColor: "var(--card-border)" }}
              >
                <img
                  src={FEATURES[activeFeatureTab].image}
                  alt={FEATURES[activeFeatureTab].title}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {FEATURES.map((feat, idx) => (
            <div
              key={feat.id}
              onClick={() => setActiveFeatureTab(idx)}
              className={`p-5 rounded-2xl border transition-all duration-150 cursor-pointer ${
                activeFeatureTab === idx
                  ? "border-emerald-500 bg-emerald-500/5 shadow-sm"
                  : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-emerald-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  0{idx + 1} • {feat.tag}
                </span>
                <ChevronRight size={16} className={activeFeatureTab === idx ? "text-emerald-500" : "opacity-30"} />
              </div>
              <h4 className="text-sm font-bold text-[var(--text)] mb-1">{feat.title}</h4>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{feat.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. SECURITY & DATA PRIVACY SECTION ───────────────────────────────────── */}
      <section
        id="security"
        className="w-full py-16 sm:py-24 border-y"
        style={{
          background: isDark ? "rgba(11, 17, 32, 0.6)" : "rgba(248, 250, 252, 0.7)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
              style={{
                background: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.12)",
                color: isDark ? "#60A5FA" : "#2563EB",
                border: "1px solid rgba(59, 130, 246, 0.25)"
              }}
            >
              <ShieldCheck size={13} />
              <span>Data Protection</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
              Your Financial Data Is Strictly Confidential
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              We operate under an uncompromising privacy ethos. No broker credentials stored, no third-party data tracking, and zero advertising profiling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div
              className="p-6 sm:p-8 rounded-3xl border shadow-sm transition-all"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)"
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text)] mb-2">Cryptographic Tenant Isolation</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                Your portfolio data is completely isolated. Database-level security policies ensure only your verified account can ever access your records.
              </p>
            </div>

            {/* Card 2 */}
            <div
              className="p-6 sm:p-8 rounded-3xl border shadow-sm transition-all"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)"
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
                <Lock size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text)] mb-2">AES-256 Bit Encryption</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                All communications and stored credentials are encrypted in transit via TLS 1.3 and at rest using bank-grade AES-256 standards.
              </p>
            </div>

            {/* Card 3 */}
            <div
              className="p-6 sm:p-8 rounded-3xl border shadow-sm transition-all"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)"
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text)] mb-2">Zero-Knowledge Architecture</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                Zero third-party trackers, zero advertising pixels, and zero data sales. Your net worth and investment strategy remain entirely your own.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. ABOUT FOLIOX & PHILOSOPHY SECTION (Standard, Clean, Uncluttered) ───── */}
      <section id="philosophy" className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          className="rounded-3xl border p-6 sm:p-10 lg:p-14 shadow-sm"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--card-border)"
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-5">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{
                  background: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.12)",
                  color: isDark ? "#34D399" : "#059669",
                  border: "1px solid rgba(16, 185, 129, 0.25)"
                }}
              >
                <Compass size={13} />
                <span>Our Philosophy</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
                Why We Built FolioX
              </h2>

              <p className="text-sm sm:text-base text-[var(--text-2)] leading-relaxed">
                Most modern retail trading apps are intentionally designed for churn and hyperactivity—pushing intraday notifications, speculative hype, and noisy alerts that destroy disciplined compounding.
              </p>

              <p className="text-sm sm:text-base text-[var(--text-2)] leading-relaxed">
                <strong className="text-[var(--text)] font-semibold">FolioX is built for the disciplined, long-term investor.</strong> A clean, calm terminal focused on verified portfolio metrics, AI document research, and distraction-free tracking.
              </p>

              {/* 4 Core Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text)]">Long-term Compounding</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text)]">Distraction-Free Interface</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text)]">Strict Data Confidentiality</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text)]">Fast, Instant Synchronization</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => scrollToAuth("signup")}
                  className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
                >
                  Create Free Account
                </button>
              </div>
            </div>

            {/* Right Standard Metric Comparison Card (Clean, standard, not sci-fi) */}
            <div className="lg:col-span-5">
              <div
                className="rounded-2xl border p-6 space-y-4 shadow-sm"
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
                }}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b pb-3" style={{ borderColor: "var(--card-border)" }}>
                  The FolioX Difference
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[var(--text)]">Signal Over Noise</div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Clean valuations without intrusive notifications or gamification triggers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[var(--text)]">Google Gemini 3.5 Flash AI</div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Structured earnings insights directly from quarterly PDF announcements.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[var(--text)]">Complete Asset Clarity</div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Unified tracking across Indian Stocks, ETFs, Mutual Funds, and Fixed Deposits.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[var(--text)]">Safe Paper Execution</div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Test and evaluate strategies with ₹50,00,000 in virtual funds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. FOOTER ───────────────────────────────────────────────────────────── */}
      <footer
        className="w-full border-t py-12 px-4 sm:px-6 lg:px-8 mt-auto"
        style={{
          background: isDark ? "rgba(11, 17, 32, 0.95)" : "rgba(241, 245, 249, 0.95)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}apple-touch-icon.png`}
              alt="FolioX Logo"
              className="w-8 h-8 rounded-xl shadow-sm object-cover flex-shrink-0"
              onError={(e) => {
                if (e.currentTarget.src !== '/foliox/apple-touch-icon.png') {
                  e.currentTarget.src = '/foliox/apple-touch-icon.png';
                }
              }}
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[var(--text)]">
                FolioX
              </span>
              {IS_UAT && (
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  UAT BUILD
                </span>
              )}
            </div>
          </div>

          {/* Quick Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)] font-medium">
            <a href="#features" className="hover:text-[var(--text)] transition">Features</a>
            <a href="#market-pulse" className="hover:text-[var(--text)] transition">Market Pulse</a>
            <a href="#security" className="hover:text-[var(--text)] transition">Security</a>
            <a href="#philosophy" className="hover:text-[var(--text)] transition">Philosophy</a>
            <button
              type="button"
              onClick={() => scrollToAuth("signin")}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
            >
              Sign In
            </button>
          </div>

          {/* Copyright & Disclaimer */}
          <div className="text-center md:text-right text-[11px] text-[var(--text-muted)] leading-relaxed">
            <p>© 2026 FolioX. All rights reserved.</p>
            <p className="mt-1 opacity-70">
              For informational and analytical purposes only. Not financial or investment advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}