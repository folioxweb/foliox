import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, TrendingUp, Layers, Bell, Check, X, ArrowRight } from 'lucide-react';
import { CURRENT_RELEASE } from '../../config/version';

const ICON_MAP = {
  Mail: Mail,
  TrendingUp: TrendingUp,
  Layers: Layers,
  Bell: Bell,
  Sparkles: Sparkles,
};

const BADGE_STYLES = {
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/10 text-emerald-500',
  },
  sky: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/30',
    iconBg: 'bg-sky-500/10 text-sky-500',
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/10 text-amber-500',
  },
};

export default function WhatsNewModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
        {/* Animated Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          style={{
            background: 'var(--card-bg, #0f172a)',
            border: '1px solid var(--card-border, #334155)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* Top Decorative Color Ribbon */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500" />

          {/* Modal Header */}
          <div
            className="p-5 sm:p-6 pb-4 border-b flex items-start justify-between gap-3"
            style={{ borderColor: 'var(--divider, #1e293b)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(14,165,233,0.15))',
                  border: '1px solid rgba(16,185,129,0.25)',
                }}
              >
                <Sparkles size={22} className="text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text,#f8fafc)]">
                    What's New in FolioX
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    v{CURRENT_RELEASE.version}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-2,#94a3b8)] mt-0.5">
                  {CURRENT_RELEASE.codename} &bull; {CURRENT_RELEASE.date}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-2,#94a3b8)] hover:text-[var(--text,#f8fafc)] hover:bg-[var(--input-bg,rgba(255,255,255,0.06))] transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Feature List (Scrollable) */}
          <div className="p-5 sm:p-6 space-y-3.5 max-h-[58vh] sm:max-h-[420px] overflow-y-auto">
            {CURRENT_RELEASE.features.map((feature) => {
              const IconComponent = ICON_MAP[feature.icon] || Sparkles;
              const style = BADGE_STYLES[feature.badgeColor] || BADGE_STYLES.emerald;

              return (
                <div
                  key={feature.id}
                  className="p-3.5 rounded-2xl flex items-start gap-3.5 transition-all"
                  style={{
                    background: 'var(--input-bg, rgba(255,255,255,0.03))',
                    border: '1px solid var(--divider, rgba(255,255,255,0.06))',
                  }}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${style.iconBg}`}>
                    <IconComponent size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-[var(--text,#f8fafc)] leading-tight">
                        {feature.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}
                      >
                        {feature.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-2,#94a3b8)] leading-relaxed m-0">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div
            className="p-5 sm:p-6 pt-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{
              borderColor: 'var(--divider, #1e293b)',
              background: 'var(--card-bg, #0f172a)',
            }}
          >
            <p className="text-[11px] text-[var(--text-2,#94a3b8)] text-center sm:text-left m-0">
              Revisit release notes anytime from <strong>Settings &gt; About</strong>.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              }}
            >
              <span>Explore FolioX</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
