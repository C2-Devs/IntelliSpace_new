/**
 * Card — surface container. Default variant is opaque (for panels
 * embedded in flow); pass `glass` for floating panels over the 3D
 * canvas (drawers, popovers) which need the blur + translucency.
 */
import React from 'react';

export default function Card({
  title,
  subtitle,
  action,
  footer,
  glass = false,
  className = '',
  children,
}) {
  return (
    <div
      className={[
        glass ? 'glass-panel' : 'rounded-lg border border-border bg-surface shadow-sm',
        className,
      ].join(' ')}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            {title && <h3 className="font-heading text-base font-medium text-text-primary">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-text-tertiary">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </div>
  );
}
