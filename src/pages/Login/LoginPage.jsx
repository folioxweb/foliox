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
  Database,
  CheckCircle2,
  ChevronRight,
  Sun,
  Moon,
  Zap,
  Globe,
  LineChart,
  Award,
  ArrowUpRight,
  Cpu
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../services/apiClient";
import { IS_UAT } from "../../config/version";

// Rich Landing Assets
import aiFilingImg from "../../assets/landing/ai-filing-preview.jpg";
import paperTradingImg from "../../assets/landing/paper-trading-preview.jpg";
import portfolioAnalyticsImg from "../../assets/landing/portfolio-analytics-preview.jpg";
import ipoRadarImg from "../../assets/landing/ipo-radar-preview.jpg";
import folioxEmblemImg from "../../assets/landing/foliox-emblem.jpg";

// Live Ticker Data
const TICKER_ITEMS = [
  { symbol: "NIFTY 50", price: "25,418.50", change: "+124.30", pct: "+0.49%", isUp: true },
  { symbol: "SENSEX", price: "83,184.80", change: "+372.40", pct: "+0.45%", isUp: true },
  { symbol: "BANK NIFTY", price: "52,190.20", change: "+210.15", pct: "+0.40%", isUp: true },
  { symbol: "NIFTY IT", price: "43,890.10", change: "+680.90", pct: "+1.57%", isUp: true },
  { symbol: "GOLD 24K", price: "₹72,450", change: "+₹230", pct: "+0.32%", isUp: true },
  { symbol: "USD / INR", price: "₹83.94", change: "-0.07", pct: "-0.08%", isUp: false },
  { symbol: "BRENT CRUDE", price: "$74.20", change: "-$0.82", pct: "-1.09%", isUp: false },
  { symbol: "NIFTY SMALLCAP 250", price: "18,340.20", change: "+208.50", pct: "+1.15%", isUp: true },
  { symbol: "NIFTY MIDCAP 150", price: "21,480.60", change: "+174.30", pct: "+0.82%", isUp: true }
];

// Interactive Allocation Demo Model
const ALLOCATION_PREVIEWS = [
  { name: "Equities (NSE/BSE)", pct: 54, color: "#10B981", value: "₹77,14,200", growth: "+26.4%" },
  { name: "US Tech Giants", pct: 18, color: "#8B5CF6", value: "₹25,71,400", growth: "+31.2%" },
  { name: "Mutual Funds", pct: 13, color: "#3B82F6", value: "₹18,57,100", growth: "+16.8%" },
  { name: "Sovereign Gold", pct: 10, color: "#F59E0B", value: "₹14,28,500", growth: "+14.5%" },
  { name: "Liquid Cash", pct: 5, color: "#64748B", value: "₹7,14,400", growth: "+6.8%" },
];

export default function LoginPage({ onLogin }) {
  const { signInWithEmail, signUpWithEmail, resetPasswordForEmail, authError, setAuthError } = useAuth();
  const themeContext = useTheme();
  const isDark = themeContext ? themeContext.mode === "dark" : true;
  const toggleTheme = themeContext ? themeContext.toggleTheme : () => {};

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
      }, 500);
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
        setSuccessMsg("Password reset link has been dispatched. Please check your inbox.");
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

  // Feature Showcase Data
  const FEATURES = [
    {
      id: "analytics",
      tag: "CONSOLIDATION",
      title: "Unified Multi-Asset Architecture",
      subtitle: "One terminal for your entire financial empire",
      description: "Seamlessly aggregate Indian Equities (NSE/BSE), US Tech stocks via LRS, Direct Mutual Funds, Sovereign Gold Bonds, and Fixed Deposits. Instantaneous XIRR, CAGR, and auto-populated sector taxonomy across 1,500+ securities.",
      image: portfolioAnalyticsImg,
      badge: "Real-time XIRR & CAGR Engine",
      highlights: [
        "Automatic sector tagging for 1,500+ NSE active listed stocks",
        "Blended multi-currency conversion with live USD/INR feed",
        "Portfolio vs NIFTY 50 alpha comparison metrics"
      ]
    },
    {
      id: "ai-filing",
      tag: "ARTIFICIAL INTELLIGENCE",
      title: "Gemini 2.5 Flash Filing Synthesis",
      subtitle: "Instant executive takeaways from 200-page quarterly filings",
      description: "Say goodbye to manual PDF trawling. FolioX hooks directly into official BSE & NSE corporate announcement feeds, deploying Gemini AI to distill EBITDA margins, YoY revenue dynamics, capex plans, and forward guidance in seconds.",
      image: aiFilingImg,
      badge: "Gemini AI Corporate Intelligence",
      highlights: [
        "Continuous automated RSS feed sync from NSE & BSE",
        "Bullish/bearish management sentiment scoring gauge",
        "Instant key bullet points, risks, and forward catalysts"
      ]
    },
    {
      id: "ipo",
      tag: "PRIMARY MARKETS",
      title: "Live IPO Gray Market (GMP) Radar",
      subtitle: "Algorithmic allotment probability & gray market intelligence",
      description: "Stay ahead of retail subscription stampedes. Monitor real-time Gray Market Premiums (GMP), QIB/HNI/Retail subscription fire meters, lot size economics, and algorithmic allotment odds before committing capital.",
      image: ipoRadarImg,
      badge: "Live Exchange Feed & GMP",
      highlights: [
        "Real-time GMP updates with expected listing gain %",
        "Live QIB, NII, and Retail subscription fire meters",
        "Full coverage of Mainboard & SME IPO pipelines"
      ]
    },
    {
      id: "paper-trading",
      tag: "RISK-FREE SIMULATION",
      title: "₹50 Lakh Virtual Paper Trading Terminal",
      subtitle: "Hone your execution edge without financial risk",
      description: "Test breakout setups and swing strategies in a hyper-realistic sandbox. Powered by live NSE market data, simulated slippage, order books, and comprehensive automated trade journaling.",
      image: paperTradingImg,
      badge: "₹50,00,000 Virtual Capital",
      highlights: [
        "Live NSE order book simulation with buy/sell execution",
        "Interactive TradingView & Lightweight Candlestick charts",
        "Automated trade journaling with win/loss performance ratio"
      ]
    }
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col text-[var(--text)] overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-400"
      style={{
        background: "var(--bg)",
        fontFamily: "var(--sans)"
      }}
    >
      {/* ─── 1. TOP NAVBAR ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-colors duration-200"
        style={{
          background: isDark ? "rgba(11, 17, 32, 0.82)" : "rgba(255, 255, 255, 0.88)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl tracking-wider">
              F
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                FolioX
              </span>
              {IS_UAT && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  UAT
                </span>
              )}
            </div>
          </div>

          {/* Desktop Live Market Pulse Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md"
            style={{
              background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[var(--text-muted)] font-medium">NSE/BSE LIVE</span>
            <span className="font-bold text-[var(--text)]">NIFTY 50</span>
            <span className="text-emerald-500 font-mono font-bold">25,418.50 (+0.49%)</span>
          </div>

          {/* Navigation Links & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
              <a href="#features" className="hover:text-[var(--text)] transition">Features</a>
              <a href="#market-pulse" className="hover:text-[var(--text)] transition">Markets</a>
              <a href="#security" className="hover:text-[var(--text)] transition">Security</a>
              <a href="#philosophy" className="hover:text-[var(--text)] transition">Philosophy</a>
            </nav>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition hover:opacity-80 border"
              style={{
                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
              }}
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
            </button>

            {/* Quick CTA Button */}
            <button
              onClick={() => scrollToAuth("signin")}
              className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION WITH LOGIN TERMINAL ──────────────────────────────────── */}
      <section className="relative w-full pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col justify-center">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Hero Narrative & Interactive Widget (Desktop: 7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-6 sm:space-y-8">
            {/* Overline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold tracking-wide w-max shadow-sm"
              style={{
                background: isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.1)",
                borderColor: "rgba(16, 185, 129, 0.3)",
                color: "#10B981"
              }}
            >
              <Sparkles size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
              <span>INSTITUTIONAL WEALTH INTELLIGENCE</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-[var(--text)]">
              Command Your Entire <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Financial Horizon.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[var(--text-2)] leading-relaxed max-w-2xl">
              One unified high-frequency terminal for Indian Equities, US Tech Giants, Mutual Funds, Sovereign Gold, and Live IPO Gray Markets. Powered by automated BSE/NSE filing analysis and institutional paper execution.
            </p>

            {/* Key Terminal Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl border flex items-center gap-3 backdrop-blur-sm"
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
                }}
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Multi-Asset</div>
                  <div className="text-[11px] text-[var(--text-muted)]">NSE • BSE • US</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl border flex items-center gap-3 backdrop-blur-sm"
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
                }}
              >
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Cpu size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Gemini AI</div>
                  <div className="text-[11px] text-[var(--text-muted)]">Quarterly Filings</div>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl border flex items-center gap-3 backdrop-blur-sm"
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
                }}
              >
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Supabase RLS</div>
                  <div className="text-[11px] text-[var(--text-muted)]">AES-256 Vault</div>
                </div>
              </div>
            </div>

            {/* Interactive Live Asset Allocation Simulation Widget */}
            <div
              className="p-5 sm:p-6 rounded-3xl border shadow-xl backdrop-blur-md transition-all duration-300"
              style={{
                background: isDark ? "rgba(15, 23, 42, 0.65)" : "rgba(255, 255, 255, 0.8)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart size={18} className="text-emerald-400" />
                  <span className="text-xs sm:text-sm font-bold tracking-wide uppercase text-[var(--text-muted)]">
                    Interactive Portfolio Engine
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20">
                  CAGR +26.4%
                </span>
              </div>

              {/* Allocation Multi-Segment Progress Bar */}
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800/40 p-0.5 gap-0.5 mb-5">
                {ALLOCATION_PREVIEWS.map((item) => (
                  <div
                    key={item.name}
                    onClick={() => setSelectedAsset(item)}
                    className="h-full rounded-full transition-all duration-300 cursor-pointer hover:opacity-90 relative"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                      opacity: selectedAsset.name === item.name ? 1 : 0.65,
                      boxShadow: selectedAsset.name === item.name ? `0 0 10px ${item.color}` : "none"
                    }}
                    title={`${item.name}: ${item.pct}%`}
                  />
                ))}
              </div>

              {/* Selected Asset Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Selected Asset</div>
                  <div className="text-sm font-bold text-[var(--text)] truncate">{selectedAsset.name}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Portfolio Weight</div>
                  <div className="text-sm font-bold font-mono text-[var(--text)]">{selectedAsset.pct}%</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Est. Value</div>
                  <div className="text-sm font-bold font-mono text-[var(--text)]">{selectedAsset.value}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Historical Return</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">{selectedAsset.growth}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Tech Glassmorphic Auth Terminal Card (Desktop: 5 cols) */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <div
              ref={authCardRef}
              id="auth-card"
              className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 border relative overflow-hidden"
              style={{
                background: isDark ? "rgba(17, 24, 39, 0.85)" : "rgba(255, 255, 255, 0.95)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
                boxShadow: isDark
                  ? "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.08)"
                  : "0 20px 40px rgba(0, 0, 0, 0.08)"
              }}
            >
              {/* Subtle Card Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

              {/* View Selector Tabs (Sign In / Sign Up) */}
              {isSupabase && view !== "forgot" && (
                <div className="flex rounded-2xl p-1 mb-6 border"
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
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition duration-200 flex items-center justify-center gap-1.5 ${
                      view === "signin"
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
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
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition duration-200 flex items-center justify-center gap-1.5 ${
                      view === "signup"
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
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
                <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-inner"
                  style={{ background: "rgba(16, 185, 129, 0.12)" }}
                >
                  {view === "forgot" ? (
                    <KeyRound size={28} className="text-emerald-500" />
                  ) : view === "signup" ? (
                    <UserPlus size={28} className="text-emerald-500" />
                  ) : (
                    <ShieldCheck size={28} className="text-emerald-500" />
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)]">
                  {view === "signup"
                    ? "Initialize Portfolio"
                    : view === "forgot"
                    ? "Reset Access Key"
                    : "Access FolioX Terminal"}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                  {view === "signup"
                    ? "Zero commission tracking • Multi-asset intelligence"
                    : view === "forgot"
                    ? "Enter your verified email for recovery link"
                    : "Institutional encryption • Instant synchronization"}
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
                          className="text-xs font-semibold text-emerald-500 hover:underline"
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
                        placeholder={view === "signup" ? "Min 6 characters" : "Terminal Password"}
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
                        Reset tokens expire swiftly for account protection.
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

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl py-3.5 text-white font-extrabold text-sm sm:text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-2 shadow-lg shadow-emerald-500/25"
                  style={{
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                  }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : view === "signup" ? (
                    <>
                      <UserPlus size={18} />
                      <span>Create Free Account</span>
                    </>
                  ) : view === "forgot" ? (
                    <>
                      <KeyRound size={18} />
                      <span>Send Recovery Instructions</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>Enter Terminal</span>
                    </>
                  )}
                </button>
              </form>

              {/* Back to Sign In Link for Forgot Password */}
              {isSupabase && view === "forgot" && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setView("signin");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 hover:underline transition"
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </div>
              )}

              {/* Institutional Trust Badges */}
              <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center gap-3 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>256-Bit Encrypted</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Database size={13} className="text-cyan-400" />
                  <span>Supabase RLS</span>
                </span>
                <span>•</span>
                <span>Zero Trackers</span>
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
          {/* Double items to enable seamless infinite loop */}
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-2.5 px-3 py-1 rounded-xl whitespace-nowrap text-xs font-semibold"
            >
              <span className="text-[var(--text-muted)]">{item.symbol}</span>
              <span className="font-mono font-bold text-[var(--text)]">{item.price}</span>
              <span
                className={`font-mono flex items-center gap-0.5 text-[11px] font-bold ${
                  item.isUp ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {item.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {item.pct}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. FOUR CORE PILLARS / FEATURE SHOWCASE ──────────────────────────────── */}
      <section id="features" className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 mb-3">
            <Zap size={13} />
            <span>Terminal Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
            Engineered for Serious Wealth Accumulation
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            Four institutional-grade engines operating in unison to provide you with an asymmetric informational edge in Indian and global financial markets.
          </p>
        </div>

        {/* Feature Tabs on Desktop & Mobile */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-10">
          {FEATURES.map((feat, index) => (
            <button
              key={feat.id}
              onClick={() => setActiveFeatureTab(index)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                activeFeatureTab === index
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-emerald-400"
                  : "bg-white/[0.03] text-[var(--text-muted)] border-white/5 hover:text-[var(--text)] hover:bg-white/[0.06]"
              }`}
            >
              {index === 0 && <PieChart size={15} />}
              {index === 1 && <Cpu size={15} />}
              {index === 2 && <TrendingUp size={15} />}
              {index === 3 && <LineChart size={15} />}
              <span>{feat.title}</span>
            </button>
          ))}
        </div>

        {/* Active Feature Deep-Dive Card */}
        <div
          className="rounded-3xl border overflow-hidden shadow-2xl backdrop-blur-md transition-all duration-300"
          style={{
            background: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.9)",
            borderColor: isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.08)"
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10">
            {/* Feature Description (Desktop: 6 cols) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25">
                {FEATURES[activeFeatureTab].tag}
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                {FEATURES[activeFeatureTab].title}
              </h3>

              <p className="text-sm sm:text-base text-[var(--text-2)] leading-relaxed">
                {FEATURES[activeFeatureTab].description}
              </p>

              {/* Bullet highlights */}
              <div className="space-y-3 pt-2">
                {FEATURES[activeFeatureTab].highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-[var(--text)] font-medium">{h}</span>
                  </div>
                ))}
              </div>

              {/* Action Link */}
              <div className="pt-3">
                <button
                  onClick={() => scrollToAuth("signup")}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition"
                >
                  <span>Experience this in FolioX</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            {/* Feature Image Visual Asset (Desktop: 6 cols) */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                <img
                  src={FEATURES[activeFeatureTab].image}
                  alt={FEATURES[activeFeatureTab].title}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/90 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    {FEATURES[activeFeatureTab].badge}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {FEATURES.map((feat, idx) => (
            <div
              key={feat.id}
              onClick={() => setActiveFeatureTab(idx)}
              className={`p-5 rounded-3xl border transition-all duration-200 cursor-pointer ${
                activeFeatureTab === idx
                  ? "border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  0{idx + 1} • {feat.tag}
                </span>
                <ChevronRight size={16} className={activeFeatureTab === idx ? "text-emerald-400" : "text-white/20"} />
              </div>
              <h4 className="text-sm font-bold text-[var(--text)] mb-2">{feat.title}</h4>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{feat.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. INSTITUTIONAL SECURITY & PRIVACY SECTION ──────────────────────────── */}
      <section
        id="security"
        className="w-full py-16 sm:py-24 border-y backdrop-blur-md"
        style={{
          background: isDark ? "rgba(11, 17, 32, 0.6)" : "rgba(248, 250, 252, 0.7)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-3">
              <ShieldCheck size={13} />
              <span>Zero-Compromise Security</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
              Your Wealth Data Is Strictly Yours.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              We operate under an uncompromising privacy ethos. No broker logins required, no third-party data broker selling, and zero tenant data leakage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Row Level Security */}
            <div
              className="p-6 sm:p-8 rounded-3xl border transition-all duration-300 backdrop-blur-md hover:translate-y-[-2px]"
              style={{
                background: isDark ? "rgba(17, 24, 39, 0.6)" : "rgba(255, 255, 255, 0.8)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5">
                <Database size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text)] mb-2">Row Level Security (RLS)</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                Supabase PostgreSQL enforces cryptographic user separation directly in the kernel. No microservice or query can breach tenant boundaries.
              </p>
            </div>

            {/* Card 2: 256-Bit Cryptography */}
            <div
              className="p-6 sm:p-8 rounded-3xl border transition-all duration-300 backdrop-blur-md hover:translate-y-[-2px]"
              style={{
                background: isDark ? "rgba(17, 24, 39, 0.6)" : "rgba(255, 255, 255, 0.8)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5">
                <Lock size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text)] mb-2">AES-256 Bit Cryptography</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                All communications and stored credentials are encrypted using TLS 1.3 in transit and AES-256 at rest. Safe from eavesdropping or rogue inspection.
              </p>
            </div>

            {/* Card 3: Official Exchange Feeds */}
            <div
              className="p-6 sm:p-8 rounded-3xl border transition-all duration-300 backdrop-blur-md hover:translate-y-[-2px]"
              style={{
                background: isDark ? "rgba(17, 24, 39, 0.6)" : "rgba(255, 255, 255, 0.8)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5">
                <Globe size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text)] mb-2">Direct Official Exchange Feeds</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                Symbols, ISINs, and sector classifications are synced directly from NSE and BSE master archives. Zero unreliable third-party screen scraping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. ABOUT FOLIOX & PHILOSOPHY SECTION ─────────────────────────────────── */}
      <section id="philosophy" className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          className="rounded-3xl border p-8 sm:p-12 lg:p-16 relative overflow-hidden backdrop-blur-md"
          style={{
            background: isDark ? "rgba(17, 24, 39, 0.7)" : "rgba(255, 255, 255, 0.9)",
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
          }}
        >
          {/* Subtle Ambient Light */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Narrative (Desktop: 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25">
                <Award size={13} />
                <span>Our Philosophy</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text)]">
                Why We Built FolioX
              </h2>

              <p className="text-sm sm:text-base text-[var(--text-2)] leading-relaxed">
                Most modern retail brokerage apps are intentionally engineered for friction, panic, and churning—pushing intraday notifications, options gambling, and high-frequency noise that destroys compounding.
              </p>

              <p className="text-sm sm:text-base text-[var(--text-2)] leading-relaxed">
                <strong className="text-[var(--text)] font-semibold">FolioX is built for the disciplined investor.</strong> A sanctuary of clean telemetry, deep fundamental filings synthesis, and multi-asset harmony. Designed to help you make rational capital allocation decisions over decades.
              </p>

              {/* 4 Core Pillars */}
              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text)]">Long-term Compounding</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text)]">Zero Friction Minimalism</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text)]">Extreme Privacy Vault</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text)]">Sub-Second Execution</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => scrollToAuth("signup")}
                  className="px-6 py-3 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 hover:opacity-95 active:scale-95 transition"
                >
                  Join the Private Beta
                </button>
              </div>
            </div>

            {/* Right Emblem Illustration (Desktop: 5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                <img
                  src={folioxEmblemImg}
                  alt="FolioX 3D Emblem"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <span className="text-xs font-mono font-bold text-white/90 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    FolioX Core • Precision Engineering
                  </span>
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
          background: isDark ? "rgba(11, 17, 32, 0.95)" : "rgba(241, 245, 249, 0.9)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-black text-base">
              F
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[var(--text)]">
                FolioX Technologies
              </span>
              {IS_UAT && (
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-amber-500/10 text-amber-500 border border-amber-500/25">
                  UAT BUILD
                </span>
              )}
            </div>
          </div>

          {/* Quick Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)] font-medium">
            <a href="#features" className="hover:text-[var(--text)] transition">Features</a>
            <a href="#market-pulse" className="hover:text-[var(--text)] transition">Market Pulse</a>
            <a href="#security" className="hover:text-[var(--text)] transition">Security Standard</a>
            <a href="#philosophy" className="hover:text-[var(--text)] transition">Investment Ethos</a>
            <button onClick={() => scrollToAuth("signin")} className="hover:text-emerald-400 transition font-bold">
              Terminal Login
            </button>
          </div>

          {/* Copyright & Disclaimer */}
          <div className="text-center md:text-right text-[11px] text-[var(--text-muted)] leading-relaxed">
            <p>© 2026 FolioX. All rights reserved.</p>
            <p className="mt-1 opacity-70">
              For informational and analytical purposes only. Not SEBI registered investment advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}