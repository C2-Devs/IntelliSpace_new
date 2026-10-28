/**
 * Room Utilities — import/export and localStorage persistence.
 */
import { LOCAL_STORAGE_KEY } from '../constants';
import { clampPositionToRoom, getRoomBounds } from './roomCoordinates';

export { clampPositionToRoom, getRoomBounds };

/**
 * Export room state as a downloadable JSON file.
 */
export function downloadRoomJSON(roomData) {
  const json = JSON.stringify(roomData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `room-${roomData.currentTemplate || 'custom'}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import a room JSON file via file input dialog.
 * Returns a Promise that resolves with the parsed data.
 */
export function importRoomJSON() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          resolve(data);
        } catch (err) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    input.click();
  });
}

/**
 * Save state to localStorage.
 */
export function saveToLocalStorage(state) {
  try {
    const data = {
      currentTemplate: state.currentTemplate,
      room: state.room,
      windows: state.windows,
      doors: state.doors,
      furniture: state.furniture,
      structures: state.structures,
      customTemplates: state.customTemplates,
      lightPreset: state.lightPreset,
      favorites: state.favorites,
      showMinimap: state.showMinimap,
      showMeasurements: state.showMeasurements,
      showGrid: state.showGrid,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load state from localStorage.
 */
export function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear saved state from localStorage.
 */
export function clearLocalStorage() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}
