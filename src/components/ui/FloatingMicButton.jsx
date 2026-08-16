import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

/**
 * FloatingMicButton Component
 *
 * Glassmorphic Floating Action Button (FAB) positioned at the bottom right.
 * Triggers the Voice Assistant Modal.
 */
export default function FloatingMicButton({ onClick, isListening = false }) {
  return (
    <motion.button
      type="button"
      aria-label="Open Voice Assistant"
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="fixed z-40 flex items-center justify-center rounded-full shadow-2xl transition-shadow duration-300"
      style={{
        right: '1.25rem',
        bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
        width: '3.5rem',
        height: '3.5rem',
        background: isListening
          ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
          : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        boxShadow: isListening
          ? '0 0 25px rgba(239, 68, 68, 0.6)'
          : '0 8px 24px rgba(16, 185, 129, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Pulse ring animation when listening */}
      {isListening && (
        <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-45 pointer-events-none" />
      )}

      <Mic size={24} className="text-white drop-shadow-md" />
    </motion.button>
  );
}
