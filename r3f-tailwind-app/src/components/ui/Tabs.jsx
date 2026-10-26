/**
 * Tabs — accessible segmented control.
 *
 * <Tabs
 *   items={[{ id: 'move', label: 'Move', icon: Move }, ...]}
 *   value={mode}
 *   onChange={setMode}
 * />
 *
 * Implements the WAI-ARIA tabs pattern: role="tablist", roving
 * tabindex, Left/Right (or Up/Down) arrow-key navigation, Home/End.
 */
import React, { useRef } from 'react';

export default function Tabs({
  items,
  value,
  onChange,
  orientation = 'horizontal',
  size = 'md',
  className = '',
}) {
  const refs = useRef([]);

  const focusIndex = (index) => {
    const el = refs.current[index];
    if (el) el.focus();
  };

  const handleKeyDown = (e, index) => {
    const horizontal = orientation === 'horizontal';
    const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
    if (e.key === nextKey) {
      e.preventDefault();
      const next = (index + 1) % items.length;
      onChange(items[next].id);
      focusIndex(next);
    } else if (e.key === prevKey) {
      e.preventDefault();
      const prev = (index - 1 + items.length) % items.length;
      onChange(items[prev].id);
      focusIndex(prev);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(items[0].id);
      focusIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(items[items.length - 1].id);
      focusIndex(items.length - 1);
    }
  };

  const padY = size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-sm';

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={[
        'inline-flex gap-0.5 rounded-md border border-border bg-bg-0 p-1',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className,
      ].join(' ')}
    >
      {items.map((item, index) => {
        const isActive = item.id === value;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            ref={(el) => (refs.current[index] = el)}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={isActive}
            aria-controls={item.panelId ?? undefined}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              'flex items-center justify-center gap-1.5 rounded-sm px-3 font-medium transition-colors duration-150',
              padY,
              isActive
                ? 'bg-surface-raised text-text-primary shadow-sm ring-1 ring-accent-500/50'
                : 'text-text-tertiary hover:text-text-secondary',
            ].join(' ')}
          >
            {Icon && <Icon size={size === 'sm' ? 13 : 14} aria-hidden="true" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
