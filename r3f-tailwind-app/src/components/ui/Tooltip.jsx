/**
 * Tooltip — wraps a single focusable child (usually an icon Button)
 * and shows a label on hover or keyboard focus.
 *
 *   <Tooltip label="Undo" shortcut="Ctrl+Z">
 *     <Button variant="ghost" size="icon" icon={Undo2} aria-label="Undo" />
 *   </Tooltip>
 */
import React, { useId, useRef, useState } from 'react';
import Kbd from './Kbd';

const PLACEMENT = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export default function Tooltip({ label, shortcut, placement = 'top', delay = 300, children }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);
  const id = useId();

  const show = () => {
    timer.current = window.setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setVisible(false);
  };

  const child = React.Children.only(children);
  const trigger = React.cloneElement(child, {
    onMouseEnter: (e) => {
      show();
      child.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e) => {
      hide();
      child.props.onMouseLeave?.(e);
    },
    onFocus: (e) => {
      show();
      child.props.onFocus?.(e);
    },
    onBlur: (e) => {
      hide();
      child.props.onBlur?.(e);
    },
    onKeyDown: (e) => {
      if (e.key === 'Escape') hide();
      child.props.onKeyDown?.(e);
    },
    'aria-describedby': visible ? id : undefined,
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      {visible && (
        <span
          role="tooltip"
          id={id}
          className={[
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-sm border border-border-strong bg-bg-0',
            'px-2 py-1 text-[11px] font-medium text-text-primary shadow-md',
            'motion-safe:animate-[tooltip-in_150ms_ease-out]',
            PLACEMENT[placement],
          ].join(' ')}
        >
          {label}
          {shortcut && <Kbd className="ml-1.5">{shortcut}</Kbd>}
        </span>
      )}
    </span>
  );
}
