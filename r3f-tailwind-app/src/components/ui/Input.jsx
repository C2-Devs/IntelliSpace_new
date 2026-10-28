/**
 * Input — labeled text field with optional leading icon and
 * error/helper text. Wraps a native <input>, so all standard
 * props (value, onChange, type, placeholder...) pass through.
 */
import React, { useId } from 'react';

export default function Input({
  label,
  icon: Icon,
  error,
  helperText,
  className = '',
  ...props
}) {
  const autoId = useId();
  const id = props.id || autoId;
  const describedBy = error ? `${id}-error` : helperText ? `${id}-help` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={[
            'h-9 w-full rounded-md border bg-bg-0 text-sm text-text-primary placeholder:text-text-tertiary',
            'transition-colors duration-150 outline-none',
            Icon ? 'pl-8 pr-3' : 'px-3',
            error
              ? 'border-danger focus:border-danger'
              : 'border-border hover:border-border-strong focus:border-accent-400',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-help`} className="text-xs text-text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
}
