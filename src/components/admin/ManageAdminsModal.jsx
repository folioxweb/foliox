import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, UserPlus, Trash2, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { listAppAdmins, grantAdminRole, revokeAdminRole } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export default function ManageAdminsModal({ isOpen, onClose }) {
  const { user, refreshAdminStatus } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revokingEmail, setRevokingEmail] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await listAppAdmins();
      setAdmins(list);
    } catch (err) {
      setError(err.message || 'Failed to load administrator list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdmins();
      setNewEmail('');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleGrant = async (e) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      const res = await grantAdminRole(email);
      setSuccessMessage(res.message || `Granted ADMIN role to ${email}`);
      setNewEmail('');
      await fetchAdmins();
      await refreshAdminStatus();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to grant admin role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (email, role) => {
    if (role === 'SUPER_ADMIN') {
      alert('Super Admins cannot be revoked.');
      return;
    }
    if (!window.confirm(`Revoke admin access from ${email}?`)) {
      return;
    }

    try {
      setRevokingEmail(email);
      setError(null);
      setSuccessMessage(null);
      const res = await revokeAdminRole(email);
      setSuccessMessage(res.message || `Admin role revoked from ${email}`);
      await fetchAdmins();
      await refreshAdminStatus();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to revoke admin role');
    } finally {
      setRevokingEmail(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            color: 'var(--text)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--card-border)] bg-[var(--header-bg)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="text-emerald-500" size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">Admin Delegation &amp; RBAC</h3>
                <p className="text-xs text-[var(--text-muted)]">Manage authorized administrators</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)] transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Feedback Alerts */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-medium leading-relaxed">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium leading-relaxed">
                <Check size={16} className="shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Grant New Admin Form */}
            <form onSubmit={handleGrant} className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Grant Admin Access
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Registered user's email..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/50"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text)',
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting || !newEmail.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  <span>Grant Role</span>
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Note: The user must have already registered/signed up in the platform first.
              </p>
            </form>

            {/* Current Admins List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Active Administrators ({admins.length})
                </span>
                {loading && <Loader2 size={14} className="animate-spin text-emerald-500" />}
              </div>

              <div className="space-y-2">
                {admins.map((adm) => {
                  const isCurrent = adm.email?.toLowerCase() === user?.email?.toLowerCase();
                  const isSuper = adm.role === 'SUPER_ADMIN';
                  const isRevoking = revokingEmail === adm.email;

                  return (
                    <div
                      key={adm.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl transition-colors"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--card-border)',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSuper
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          <Shield size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[var(--text)] truncate max-w-[220px]">
                              {adm.email}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700/50 text-slate-300 font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            Added on {new Date(adm.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide border ${
                            isSuper
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          }`}
                        >
                          {adm.role.replace('_', ' ')}
                        </span>

                        {!isSuper && (
                          <button
                            type="button"
                            title="Revoke Admin Access"
                            disabled={isRevoking}
                            onClick={() => handleRevoke(adm.email, adm.role)}
                            className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                          >
                            {isRevoking ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--card-border)] flex justify-end bg-[var(--header-bg)]">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--input-bg)] transition-colors border border-[var(--card-border)] cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
