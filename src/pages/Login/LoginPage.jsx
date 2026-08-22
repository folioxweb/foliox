import { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/apiClient";

export default function LoginPage({ onLogin }) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isSupabase = import.meta.env.VITE_BACKEND_TARGET === "SUPABASE" || localStorage.getItem("backend_target") === "SUPABASE";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (isSupabase && !email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      if (isSupabase) {
        if (isSignUp) {
          const data = await signUpWithEmail(email, password);
          if (data?.user && !data?.session) {
            setSuccessMsg("Account created! Please check your email to confirm your account before logging in.");
            setIsSignUp(false);
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
      const msg = err.message || (isSignUp ? "Registration failed." : "Invalid email or password.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div
          className="rounded-3xl p-8 shadow-2xl transition-all"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <ShieldCheck
                size={38}
                style={{ color: 'var(--emerald)' }}
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center" style={{ color: 'var(--text)' }}>
            Equity Dashboard
          </h1>

          <p className="text-center mt-2 mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            {isSignUp ? "Create Portfolio Account" : "Sign In to Your Portfolio"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field (for Supabase Auth) */}
            {isSupabase && (
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-full py-3 pl-12 pr-4 outline-none focus:ring-1 focus:ring-[var(--emerald)] transition"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text)',
                    fontSize: '16px',
                  }}
                />
              </div>
            )}

            {/* Password Field */}
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />

              <input
                type={showPassword ? "text" : "password"}
                placeholder={isSupabase ? (isSignUp ? "Create Password (min 6 chars)" : "Password") : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                className="w-full rounded-full py-3 pl-12 pr-12 outline-none focus:ring-1 focus:ring-[var(--emerald)] transition"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text)',
                  fontSize: '16px',
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {error && (
              <div className="text-sm text-center font-semibold py-1 px-2 rounded-lg" style={{ color: 'var(--loss)', background: 'rgba(239,68,68,0.08)' }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div className="text-sm text-center font-semibold py-1 px-2 rounded-lg" style={{ color: 'var(--emerald)', background: 'rgba(16,185,129,0.08)' }}>
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3 text-white font-bold transition flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-55 mt-2"
              style={{
                background: 'var(--emerald)',
                boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
              }}
            >
              {loading ? (
                "Processing..."
              ) : isSignUp ? (
                <>
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up for Supabase */}
          {isSupabase && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-xs font-semibold hover:underline transition"
                style={{ color: 'var(--emerald)' }}
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Protected Portfolio • Encrypted Access
        </p>
      </div>
    </div>
  );
}