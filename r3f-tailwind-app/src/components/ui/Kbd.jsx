/**
 * Kbd — small styled key / shortcut chip, e.g. inside tooltips
 * ("Undo  Ctrl+Z") or a shortcuts-help modal.
 */
import React from 'react';

export default function Kbd({ children, className = '' }) {
  return (
    <kbd
      className={[
        'tabular inline-flex items-center rounded-sm border border-border-strong bg-surface-raised',
        'px-1.5 py-0.5 text-[10px] font-medium text-text-secondary',
        className,
      ].join(' ')}
    >
      {children}
    </kbd>
  );
}
