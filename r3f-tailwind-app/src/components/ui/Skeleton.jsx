/**
 * Skeleton — loading placeholder block. Use for furniture-grid
 * thumbnails, AI-suggestion cards, and property-panel fields while
 * data is in flight. Shimmer is pure CSS and is neutralized globally
 * by the prefers-reduced-motion rule in index.css.
 */
import React from 'react';

export default function Skeleton({ className = '', rounded = 'rounded-md' }) {
  return (
    <div
      aria-hidden="true"
      className={[
        'intelli-skeleton relative overflow-hidden bg-surface-raised',
        rounded,
        className,
      ].join(' ')}
    />
  );
}
