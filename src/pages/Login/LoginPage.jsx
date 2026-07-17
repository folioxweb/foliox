import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { api } from "../../services/apiClient";

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    if (!password.trim()) {
      setError("Please enter password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.login(password);

      onLogin();

    } catch (err) {
      setError(err.message || "Invalid password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div
          className="rounded-3xl p-8 shadow-2xl"
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

          <p className="text-center mt-2 mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Private Portfolio Access
          </p>

          <form
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full py-3 pl-12 pr-12 outline-none focus:ring-1 focus:ring-[var(--emerald)]"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text)',
                  fontSize: '16px', // Prevents iOS Safari auto-zoom
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {error && (
              <div className="text-sm text-center font-semibold" style={{ color: 'var(--loss)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3 text-white font-bold transition hover:opacity-90 disabled:opacity-55"
              style={{
                background: 'var(--emerald)',
                boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
              }}
            >
              {loading ? "Signing In..." : "Login"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Protected Portfolio • Authorized Access Only
        </p>
      </div>
    </div>
  );
}