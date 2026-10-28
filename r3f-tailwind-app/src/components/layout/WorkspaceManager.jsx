import React, { useEffect, useState } from 'react';
import { Cloud, FolderOpen, Plus, RefreshCw, X } from 'lucide-react';
import useWorkspaceStore from '../../store/useWorkspaceStore.js';

export default function WorkspaceManager() {
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const managerOpen = useWorkspaceStore((s) => s.managerOpen);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeWorkspaceName = useWorkspaceStore((s) => s.activeWorkspaceName);
  const isListing = useWorkspaceStore((s) => s.isListing);
  const isWorking = useWorkspaceStore((s) => s.isWorking);
  const cloudError = useWorkspaceStore((s) => s.cloudError);
  const openManager = useWorkspaceStore((s) => s.openManager);
  const closeManager = useWorkspaceStore((s) => s.closeManager);
  const refreshWorkspaces = useWorkspaceStore((s) => s.refreshWorkspaces);
  const createCurrentWorkspace = useWorkspaceStore((s) => s.createCurrentWorkspace);
  const openWorkspace = useWorkspaceStore((s) => s.openWorkspace);

  useEffect(() => {
    if (!managerOpen) return;
    refreshWorkspaces().catch(() => {});
  }, [managerOpen, refreshWorkspaces]);

  async function handleCreate(event) {
    event.preventDefault();
    setLocalError('');
    try {
      await createCurrentWorkspace(name);
      setName('');
    } catch (error) {
      setLocalError(error.message || 'Could not save this workspace.');
    }
  }

  async function handleOpen(id) {
    setLocalError('');
    try { await openWorkspace(id); }
    catch (error) { setLocalError(error.message || 'Could not open this workspace.'); }
  }

  return <>
    <button type="button" className="workspace-manager-trigger" onClick={openManager} title="Create or open a cloud workspace">
      <Cloud size={14} /> <span>My Workspaces</span>
    </button>
    {managerOpen && <div className="workspace-manager-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isWorking) closeManager(); }}>
      <section className="workspace-manager-dialog" role="dialog" aria-modal="true" aria-labelledby="workspace-manager-title">
        <header className="workspace-manager-header">
          <div><h2 id="workspace-manager-title">My Workspaces</h2><p>Save a design to your account and open it on another device.</p></div>
          <button type="button" aria-label="Close workspaces" onClick={closeManager} disabled={isWorking}><X size={17} /></button>
        </header>
        <form className="workspace-manager-create" onSubmit={handleCreate}>
          <label htmlFor="cloud-workspace-name">Save current design as</label>
          <div className="workspace-manager-create-row">
            <input id="cloud-workspace-name" value={name} maxLength={200} onChange={(event) => setName(event.target.value)} placeholder="e.g. Living room redesign" required />
            <button type="submit" disabled={isWorking || !name.trim()}><Plus size={15} /> Save</button>
          </div>
        </form>
        <div className="workspace-manager-list-heading"><strong>Saved workspaces</strong><button type="button" onClick={() => refreshWorkspaces().catch(() => {})} disabled={isListing || isWorking} aria-label="Refresh workspaces"><RefreshCw size={14} className={isListing ? 'workspace-manager-spinning' : ''} /></button></div>
        <div className="workspace-manager-list" aria-live="polite">
          {isListing && <p className="workspace-manager-muted">Loading workspaces…</p>}
          {!isListing && workspaces.length === 0 && <p className="workspace-manager-muted">No cloud workspaces yet. Save the current design above to create one.</p>}
          {workspaces.map((workspace) => <button key={workspace.id} type="button" className={`workspace-manager-item ${activeWorkspaceId === workspace.id ? 'is-active' : ''}`} disabled={isWorking} onClick={() => handleOpen(workspace.id)}>
            <span className="workspace-manager-item-icon"><FolderOpen size={16} /></span><span className="workspace-manager-item-copy"><strong>{workspace.name}</strong><small>{workspace.roomType || workspace.designStyle || 'Room design'}{activeWorkspaceId === workspace.id ? ' · Active' : ''}</small></span><span className="workspace-manager-open">Open</span>
          </button>)}
        </div>
        {(localError || cloudError) && <p className="workspace-manager-error" role="alert">{localError || cloudError}</p>}
        <footer className="workspace-manager-footer"><span>Active: {activeWorkspaceName || 'Local draft'}</span><button type="button" onClick={closeManager} disabled={isWorking}>Done</button></footer>
      </section>
    </div>}
  </>;
}
