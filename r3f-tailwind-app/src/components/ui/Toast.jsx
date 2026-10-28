/**
 * Toast — transient status messages (saved, collision warning, AI
 * suggestion ready, error). Wrap the app once:
 *
 *   <ToastProvider><App /></ToastProvider>
 *
 * Then anywhere:
 *   const { toast } = useToast();
 *   toast({ variant: 'success', message: 'Room saved' });
 */
import React, { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, warning: AlertTriangle, danger: XCircle, info: Info };
const RING = {
  success: 'border-success/40 text-success',
  warning: 'border-warning/40 text-warning',
  danger: 'border-danger/40 text-danger',
  info: 'border-info/40 text-info',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const reduceMotion = useReducedMotion();

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ variant = 'info', message, duration = 4000 }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, variant, message }]);
      if (duration) window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-80 flex-col gap-2"
          role="region"
          aria-label="Notifications"
        >
          <AnimatePresence>
            {toasts.map((t) => {
              const Icon = ICONS[t.variant];
              return (
                <motion.div
                  key={t.id}
                  role="status"
                  initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className={[
                    'glass-panel pointer-events-auto flex items-start gap-2.5 border px-3.5 py-3',
                    RING[t.variant],
                  ].join(' ')}
                >
                  <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="flex-1 text-sm text-text-primary">{t.message}</p>
                  <button
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss notification"
                    className="shrink-0 text-text-tertiary hover:text-text-primary"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
