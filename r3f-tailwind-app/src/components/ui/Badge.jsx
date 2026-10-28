/**
 * Badge — small status/category pill. Use `accent` for "new"/"3D
 * ready" style tags, semantic variants for state (collision warning,
 * saved, error), `neutral` for plain category labels.
 */
import React from 'react';

const VARIANTS = {
  neutral: 'bg-surface-raised text-text-secondary border-border',
  accent: 'bg-accent-tint text-accent-300 border-accent-600/50',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
};

export default function Badge({ variant = 'neutral', icon: Icon, children, className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        VARIANTS[variant],
        className,
      ].join(' ')}
    >
      {Icon && <Icon size={10} aria-hidden="true" />}
      {children}
    </span>
  );
}
