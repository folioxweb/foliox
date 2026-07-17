import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Modal — backdrop + slide-up sheet container for DetailScreen and other overlays.
 *
 * Renders at document.body via createPortal to avoid z-index stacking context issues.
 * Implements focus trap, Escape-key dismissal, and body scroll lock.
 *
 * @param {Object}            props
 * @param {boolean}           props.isOpen   - controls visibility
 * @param {Function}          props.onClose  - called when modal should close
 * @param {React.ReactNode}   props.children - content rendered inside modal container
 * @param {string}            [props.className] - extra Tailwind classes for the container
 */
const Modal = ({ isOpen, onClose, children, className = '' }) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  // ── Escape key handler ───────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      // Focus trap — intercept Tab / Shift+Tab
      if (e.key === 'Tab' && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const focusableElements = Array.from(focusable);

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab — going backward
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab — going forward
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  // ── Body scroll lock + focus management ────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Save the element that had focus before opening
      previousFocusRef.current = document.activeElement;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Register keydown listener
      document.addEventListener('keydown', handleKeyDown);

      // Move focus into the modal on next frame so the element is visible
      const raf = requestAnimationFrame(() => {
        if (containerRef.current) {
          const focusable = containerRef.current.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          );
          const firstFocusable = focusable[0];
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            // If no focusable children, focus the container itself
            containerRef.current.focus();
          }
        }
      });

      return () => {
        cancelAnimationFrame(raf);
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);

        // Restore focus to the element that was focused before the modal opened
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown]);

  // ── Backdrop click handler ──────────────────────────────────────────────────
  const handleBackdropClick = (e) => {
    // Only close if the click landed directly on the backdrop, not a child
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ──────────────────────────────────────────────────── */}
          <motion.div
            key="modal-backdrop"
            className="fixed inset-0 z-40 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* ── Modal container ───────────────────────────────────────────── */}
          <motion.div
            key="modal-container"
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={[
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-[var(--sheet-bg)] border-t border-[var(--card-border)]',
              'rounded-t-3xl',
              'max-h-[90vh] overflow-y-auto',
              'outline-none',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* ── Drag handle indicator ─────────────────────────────────── */}
            <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
              <div className="h-1 w-10 rounded-full bg-[var(--divider)]" />
            </div>

            {/* ── Content ───────────────────────────────────────────────── */}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render at document.body to escape any stacking context
  return createPortal(content, document.body);
};

export default Modal;
