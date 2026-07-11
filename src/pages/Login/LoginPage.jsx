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
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">

      <div className="w-full max-w-sm">

        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">

          <div className="flex justify-center mb-6">

            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center">

              <ShieldCheck
                size={38}
                className="text-emerald-400"
              />

            </div>

          </div>

          <h1 className="text-3xl font-bold text-center text-white">
            Equity Dashboard
          </h1>

          <p className="text-center text-slate-400 mt-2 mb-8">
            Private Portfolio Access
          </p>

          <form
            onSubmit={handleLogin}
            className="space-y-6"
          >

            <div className="relative">

              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full bg-slate-900 border border-slate-700 py-3 pl-12 pr-12 text-white outline-none focus:border-emerald-500 transition"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-semibold transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Login"}
            </button>

          </form>

        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Protected Portfolio • Authorized Access Only
        </p>

      </div>

    </div>
  );
}