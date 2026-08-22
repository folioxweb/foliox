import { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SetNewPasswordModal({ isOpen, onClose }) {
  const { updatePassword, setIsPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        setIsPasswordRecovery(false);
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl transition-all"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <KeyRound size={28} style={{ color: 'var(--emerald)' }} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center" style={{ color: 'var(--text)' }}>
          Set New Password
        </h2>
        <p className="text-xs text-center mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
          Enter a secure new password for your Foliox account.
        </p>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <div className="flex justify-center">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Password Updated!</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Redirecting to your portfolio...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* New Password */}
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-1 focus:ring-[var(--emerald)] transition"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-[var(--emerald)] transition"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text)' }}
              />
            </div>

            {error && (
              <div className="text-xs text-center font-semibold py-1.5 px-2 rounded-lg" style={{ color: 'var(--loss)', background: 'rgba(239,68,68,0.08)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-2.5 text-white text-sm font-bold transition hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: 'var(--emerald)' }}
            >
              {loading ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
