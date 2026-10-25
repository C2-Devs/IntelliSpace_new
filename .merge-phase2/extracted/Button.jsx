/**
 * Button — primary interactive primitive.
 *
 * Variants: primary (accent fill), secondary (bordered surface),
 * ghost (transparent, for toolbars/rails), danger (destructive).
 * Sizes: sm, md, icon (square, for icon-only toolbar buttons).
 *
 * Usage:
 *   <Button variant="primary" icon={Plus}>Add furniture</Button>
 *   <Button variant="ghost" size="icon" icon={Undo2} aria-label="Undo" />
 */
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-accent-500 text-bg-0 border border-accent-500 hover:bg-accent-400 hover:border-accent-400 shadow-sm',
  secondary:
    'bg-surface text-text-primary border border-border hover:border-accent-400 hover:text-text-primary',
  ghost:
    'bg-transparent text-text-secondary border border-transparent hover:bg-surface-raised hover:text-text-primary',
  danger:
    'bg-transparent text-danger border border-danger/35 hover:bg-danger/10',
};

const SIZES = {
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-md',
  icon: 'h-9 w-9 justify-center rounded-md',
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  active = false,
  className = '',
  children,
  ...props
}) {
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled && !reduceMotion ? { scale: 1.02 } : {}}
      whileTap={!isDisabled && !reduceMotion ? { scale: 0.97 } : {}}
      transition={{ duration: 0.15 }}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center font-medium transition-colors duration-150',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-transparent',
        VARIANTS[variant],
        SIZES[size],
        active ? 'ring-1 ring-accent-400 border-accent-400 text-accent-200 bg-accent-tint' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" aria-hidden="true" />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 13 : 15} aria-hidden="true" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={size === 'sm' ? 13 : 15} aria-hidden="true" />
      )}
    </motion.button>
  );
}
