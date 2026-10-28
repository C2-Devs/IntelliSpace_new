/**
 * Slider — styled range input. Shows the current value in mono type
 * so the editor's window-position / lighting-intensity controls read
 * like a precise instrument rather than a generic HTML range.
 */
import React, { useId } from 'react';

export default function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange,
  className = '',
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      <div className="flex items-center justify-between">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <span className="tabular text-xs text-text-primary">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="intelli-slider h-1.5 w-full appearance-none rounded-pill bg-border outline-none"
        style={{
          background: `linear-gradient(to right, var(--color-accent-500) ${pct}%, var(--color-border) ${pct}%)`,
        }}
      />
    </div>
  );
}
