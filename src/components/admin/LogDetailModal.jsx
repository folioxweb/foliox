import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Copy, AlertTriangle, Terminal, Clock, Activity, ArrowRight, User } from 'lucide-react';
import { useState } from 'react';

export default function LogDetailModal({ log, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !log) return null;

  const isFailed = log.status === 'FAILED' || log.response_status >= 400;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatIST = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85dvh]"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            color: 'var(--text)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-[var(--card-border)] bg-[var(--header-bg)]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${
                  isFailed
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <Terminal size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h3
                    className="text-xs sm:text-sm md:text-base font-mono font-bold text-[var(--text)] whitespace-nowrap truncate max-w-[140px] sm:max-w-xs"
                    title={log.function_name}
                  >
                    {log.function_name}
                  </h3>
                  <span
                    className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase border whitespace-nowrap shrink-0 ${
                      isFailed
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                  Execution ID #{log.id} · {formatIST(log.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)] border border-[var(--card-border)] transition-colors cursor-pointer shrink-0"
                title="Copy JSON payload"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)] transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 text-sm">
            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              <div
                className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Caller Type
                </span>
                <span className="font-semibold text-xs mt-1 text-[var(--text)]">
                  {log.caller_type || 'CRON'}
                </span>
              </div>

              <div
                className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Response Code
                </span>
                <span
                  className={`font-semibold text-xs mt-1 ${
                    isFailed ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'
                  }`}
                >
                  HTTP {log.response_status || 200}
                </span>
              </div>

              <div
                className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Execution Latency
                </span>
                <span className="font-mono font-semibold text-xs mt-1 text-[var(--text)]">
                  {log.duration_ms} ms
                </span>
              </div>

              <div
                className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  User Email
                </span>
                <span className="text-xs mt-1 truncate text-[var(--text)]" title={log.user_email || 'System / Cron'}>
                  {log.user_email || 'System / Cron'}
                </span>
              </div>
            </div>

            {/* Error Message Alert (if any) */}
            {log.error_message && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle size={15} />
                  <span>Error Diagnostics</span>
                </div>
                <pre className="font-mono text-xs whitespace-pre-wrap break-all leading-relaxed opacity-95">
                  {log.error_message}
                </pre>
              </div>
            )}

            {/* Request Payload */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Request Payload
              </span>
              <div
                className="p-3.5 rounded-2xl font-mono text-xs overflow-x-auto max-h-48"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text)',
                }}
              >
                <pre>{log.request_payload ? JSON.stringify(log.request_payload, null, 2) : 'No payload (GET/Cron)'}</pre>
              </div>
            </div>

            {/* Response Data */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Response Output
              </span>
              <div
                className="p-3.5 rounded-2xl font-mono text-xs overflow-x-auto max-h-56"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text)',
                }}
              >
                <pre>{log.response_data ? JSON.stringify(log.response_data, null, 2) : 'No response payload'}</pre>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--card-border)] flex justify-end bg-[var(--header-bg)]">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
