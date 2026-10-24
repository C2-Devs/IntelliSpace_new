/** Debounced local recovery plus authenticated cloud workspace persistence. */
import { useEffect, useRef, useState } from 'react';
import useStore from '../store/useStore';
import useWorkspaceStore, { getEditorSnapshot } from '../store/useWorkspaceStore.js';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/roomUtils';

export default function useAutosave() {
  const restored = useRef(false);
  const skipNextSave = useRef(false);
  const [restoreComplete, setRestoreComplete] = useState(false);
  const room = useStore((state) => state.room);
  const windows = useStore((state) => state.windows);
  const doors = useStore((state) => state.doors);
  const furniture = useStore((state) => state.furniture);
  const structures = useStore((state) => state.structures);
  const customTemplates = useStore((state) => state.customTemplates);
  const currentTemplate = useStore((state) => state.currentTemplate);
  const lightPreset = useStore((state) => state.lightPreset);
  const favorites = useStore((state) => state.favorites);
  const showMinimap = useStore((state) => state.showMinimap);
  const showMeasurements = useStore((state) => state.showMeasurements);
  const showGrid = useStore((state) => state.showGrid);
  const environmentPreset = useStore((state) => state.environmentPreset);
  const environmentSettings = useStore((state) => state.environmentSettings);
  const lightingSettings = useStore((state) => state.lightingSettings);
  const lightingFixtures = useStore((state) => state.lightingFixtures);
  const saveStatus = useStore((state) => state.saveStatus);
  const importRoom = useStore((state) => state.importRoom);
  const setSaveStatus = useStore((state) => state.setSaveStatus);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const setCloudStatus = useWorkspaceStore((state) => state.setCloudStatus);
  const saveEditorSnapshot = useWorkspaceStore((state) => state.saveEditorSnapshot);

  useEffect(() => {
    let active = true;
    async function restore() {
      let cloudRestored = false;
      try {
        cloudRestored = await useWorkspaceStore.getState().restoreActiveWorkspace();
      } catch { /* local recovery below remains available */ }
      if (!active) return;
      if (!cloudRestored) {
        const saved = loadFromLocalStorage();
        if (saved?.furniture && Array.isArray(saved.furniture)) importRoom(saved);
      }
      restored.current = true;
      skipNextSave.current = true;
      setRestoreComplete(true);
    }
    restore();
    return () => { active = false; };
  }, [importRoom]);

  useEffect(() => {
    if (!restoreComplete || !restored.current) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    setSaveStatus('saving');
    if (activeWorkspaceId) setCloudStatus('saving');
    const timer = window.setTimeout(async () => {
      const snapshot = {
        ...getEditorSnapshot(),
        // Use subscribed state values as the effect's change signature while the
        // snapshot itself is collected atomically from Zustand.
        currentTemplate, room, windows, doors, furniture, structures,
        customTemplates, lightPreset, favorites, showMinimap, showMeasurements,
        showGrid, environmentPreset, environmentSettings, lightingSettings,
        lightingFixtures,
      };
      const localOk = saveToLocalStorage(snapshot);
      setSaveStatus(localOk ? 'saved' : 'error');
      if (activeWorkspaceId) {
        try { await saveEditorSnapshot(snapshot); }
        catch (error) { setCloudStatus(error.status === 409 ? 'conflict' : 'error', error.message); }
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [restoreComplete, activeWorkspaceId, room, windows, doors, furniture, structures, customTemplates,
    currentTemplate, lightPreset, favorites, showMinimap, showMeasurements, showGrid,
    environmentPreset, environmentSettings, lightingSettings, lightingFixtures,
    setSaveStatus, setCloudStatus, saveEditorSnapshot]);

  useEffect(() => {
    if (saveStatus !== 'saved') return undefined;
    const timer = window.setTimeout(() => setSaveStatus('idle'), 1800);
    return () => window.clearTimeout(timer);
  }, [saveStatus, setSaveStatus]);
}
