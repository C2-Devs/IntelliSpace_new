/** Debounced browser-local persistence for the editor. */
// Keep this hook on the standard Zustand selector path; no external-store hook is needed.
import { useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/roomUtils';

export default function useAutosave() {
  const restored = useRef(false);
  const room = useStore((state) => state.room);
  const windows = useStore((state) => state.windows);
  const doors = useStore((state) => state.doors);
  const furniture = useStore((state) => state.furniture);
  const structures = useStore((state) => state.structures);
  const customTemplates = useStore((state) => state.customTemplates);
  const currentTemplate = useStore((state) => state.currentTemplate);
  const lightPreset = useStore((state) => state.lightPreset);
  const favorites = useStore((state) => state.favorites);
  const saveStatus = useStore((state) => state.saveStatus);
  const importRoom = useStore((state) => state.importRoom);
  const setSaveStatus = useStore((state) => state.setSaveStatus);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = loadFromLocalStorage();
    if (saved?.furniture && Array.isArray(saved.furniture)) importRoom(saved);
  }, [importRoom]);

  useEffect(() => {
    if (!restored.current) return;
    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      const ok = saveToLocalStorage({
        currentTemplate,
        room,
        windows,
        doors,
        furniture,
        structures,
        customTemplates,
        lightPreset,
        favorites,
      });
      setSaveStatus(ok ? 'saved' : 'error');
    }, 700);
    return () => window.clearTimeout(timer);
  }, [room, windows, doors, furniture, structures, customTemplates, currentTemplate, lightPreset, favorites, setSaveStatus]);

  useEffect(() => {
    if (saveStatus !== 'saved') return undefined;
    const timer = window.setTimeout(() => setSaveStatus('idle'), 1800);
    return () => window.clearTimeout(timer);
  }, [saveStatus, setSaveStatus]);
}
