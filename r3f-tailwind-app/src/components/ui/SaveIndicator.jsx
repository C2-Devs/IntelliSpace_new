/** Show whether the draft is saved locally and whether the active cloud workspace is synced. */
import React from 'react';
import useStore from '../../store/useStore';
import useWorkspaceStore from '../../store/useWorkspaceStore.js';

export default function SaveIndicator() {
  const saveStatus = useStore((s) => s.saveStatus);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const cloudStatus = useWorkspaceStore((s) => s.cloudStatus);

  let label = '';
  let tone = 'text-slate-500';
  if (cloudStatus === 'conflict') { label = 'Cloud conflict · reload workspace'; tone = 'text-rose-400'; }
  else if (cloudStatus === 'error') { label = 'Cloud sync failed · saved locally'; tone = 'text-rose-400'; }
  else if (cloudStatus === 'saving' && activeWorkspaceId) { label = 'Saving to cloud…'; tone = 'text-slate-400'; }
  else if (cloudStatus === 'saved' && activeWorkspaceId) { label = 'Saved to cloud'; tone = 'text-emerald-500'; }
  else if (saveStatus === 'saving') { label = 'Saving locally…'; tone = 'text-slate-500'; }
  else if (saveStatus === 'saved') { label = 'Saved locally'; tone = 'text-emerald-500'; }
  else if (saveStatus === 'error') { label = 'Unable to save locally'; tone = 'text-rose-500'; }
  if (!label) return null;

  return <div aria-live="polite" className={`flex items-center gap-1.5 ml-auto text-[10px] font-semibold tracking-wide uppercase transition-all duration-300 ${tone}`}>
    {(saveStatus === 'saving' || (cloudStatus === 'saving' && activeWorkspaceId)) && <span className="w-2 h-2 rounded-full border-2 border-current border-t-transparent animate-spin" />}
    {label}
  </div>;
}
