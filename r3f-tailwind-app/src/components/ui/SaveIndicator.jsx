/**
 * SaveIndicator — animated "Saving..." → "Saved ✓" status feedback.
 */
import React from 'react';
import useStore from '../../store/useStore';

export default function SaveIndicator() {
  const saveStatus = useStore((s) => s.saveStatus);

  if (saveStatus === 'idle') return null;

  return (
    <div className={`flex items-center gap-1.5 ml-auto text-[10px] font-semibold tracking-wide uppercase transition-all duration-300 ${saveStatus === 'saving' ? 'text-slate-500' : 'text-emerald-500'}`}>
      {saveStatus === 'saving' && (
        <>
          <span className="w-2 h-2 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
          Saving…
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <span className="text-xs leading-none">✓</span>
          Saved locally
        </>
      )}
      {saveStatus === 'error' && (
        <span className="text-rose-500">Unable to save locally</span>
      )}
    </div>
  );
}
