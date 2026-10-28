/**
 * Zustand Store — single source of truth for the 3D Room Design Playground.
 *
 * Manages all application state: room data, selection, camera, lighting,
 * transform modes, undo/redo history, clipboard, and autosave status.
 */
import { create } from 'zustand';
import { generateId } from '../utils/idUtils';
import { getFurnitureById } from '../data/furnitureRegistry';
import { getCatalogFootprint } from '../utils/catalogUtils';
import {
  furnitureInstanceToDto,
  getBackendCatalogItemId,
  getRegistryIdForCatalogItem,
} from '../utils/catalogApi';
import { instantiateTemplate } from '../data/roomTemplates';
import { MAX_HISTORY_SIZE } from '../constants';
import { cloneFurnitureState } from '../utils/coordinateTransformers';

const DEFAULT_TEMPLATE = 'modern-living-room';
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeVector(vector, fallback, length = 3) {
  return Array.from({ length }, (_, index) => finiteNumber(vector?.[index], fallback[index] ?? 0));
}

function normalizeFurnitureItem(item) {
  const scale = normalizeVector(item.scale, [1, 1, 1]).map((value) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value)));
  const originalCatalogItemId = item.catalogItemId ?? item.registryId;
  const registryId =
    item.registryId ??
    getRegistryIdForCatalogItem(originalCatalogItemId) ??
    originalCatalogItemId;
  return {
    ...item,
    catalogItemId: registryId,
    registryId,
    backendCatalogItemId:
      item.backendCatalogItemId ??
      getBackendCatalogItemId(registryId) ??
      (registryId !== originalCatalogItemId ? originalCatalogItemId : null),
    position: normalizeVector(item.position, [0, 0, 0]),
    rotation: normalizeVector(item.rotation, [0, 0, 0]),
    scale,
    isLocked: Boolean(item.isLocked ?? item.is_locked ?? item.locked),
    isVisible: item.isVisible !== false && item.is_visible !== false && item.visible !== false,
    hasCustomMaterial: Boolean(item.hasCustomMaterial),
    materialColor: item.hasCustomMaterial && /^#[0-9a-f]{6}$/i.test(item.materialColor || '') ? item.materialColor : null,
    materialTexture: item.hasCustomMaterial ? (item.materialTexture || null) : null,
    isColliding: false,
  };
}

function normalizeFurniture(items = []) {
  return items.filter(Boolean).map(normalizeFurnitureItem);
}

const STRUCTURE_TYPES = new Set(['partition', 'column', 'opening', 'niche']);
const STRUCTURE_DEFAULTS = {
  partition: { label: 'Partition Wall', dimensions: [3, 2.7, 0.16], position: [0, 1.35, 0] },
  column: { label: 'Column', dimensions: [0.35, 2.7, 0.35], position: [0, 1.35, 0] },
  opening: { label: 'Room Opening', dimensions: [1.6, 2.1, 0.18], position: [0, 1.05, 0] },
  niche: { label: 'Niche', dimensions: [1.2, 1.4, 0.28], position: [0, 1.2, -1] },
};

function normalizeStructure(item) {
  const type = STRUCTURE_TYPES.has(item?.type) ? item.type : 'partition';
  const defaults = STRUCTURE_DEFAULTS[type];
  return {
    id: item?.id || generateId(), type, label: item?.label || defaults.label,
    position: normalizeVector(item?.position, defaults.position),
    rotation: normalizeVector(item?.rotation, [0, 0, 0]),
    dimensions: normalizeVector(item?.dimensions, defaults.dimensions),
    isLocked: Boolean(item?.isLocked), isVisible: item?.isVisible !== false,
  };
}

function normalizeStructures(items = []) { return items.filter(Boolean).map(normalizeStructure); }

function readCustomLightingPresets() { try { return typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('intellispace-custom-lighting-presets') || '[]') : []; } catch { return []; } }
function persistCustomLightingPresets(presets) { try { if (typeof window !== 'undefined') window.localStorage.setItem('intellispace-custom-lighting-presets', JSON.stringify(presets)); } catch {} }
function createInitialState() {
  const template = instantiateTemplate(DEFAULT_TEMPLATE);
  return {
    // ── Room & Template ──────────────────────────
    currentTemplate: DEFAULT_TEMPLATE,
    customTemplates: [],
      room: { ...template.room, floorMaterial: template.room.floorMaterial || 'floor-1', wallMaterial: template.room.wallMaterial || 'warmPaint' },
      windows: template.windows,
    doors: template.doors,
    furniture: normalizeFurniture(template.furniture),
    structures: [],
    lastSavedState: cloneFurnitureState(normalizeFurniture(template.furniture)),

    // ── Selection ────────────────────────────────
    selectedIds: [],
    selectedWindowId: null,

    // ── Transform ────────────────────────────────
    transformMode: 'translate',

    // ── Camera ───────────────────────────────────
    cameraMode: 'perspective',

    // ── Lighting ─────────────────────────────────
lightPreset: template.lightPreset || 'midday',
  environmentPreset: 'Natural Daylight',
  environmentSettings: { background: '#121313', ambientIntensity: 0.58, sunlightIntensity: 1.55, sunlightColor: '#fff8ea', azimuth: 218, elevation: 62, exposure: 1.08, shadows: true },
  lightingSettings: { ambientIntensity: 0.58, mainIntensity: 1.55, color: '#fff8ea', exposure: 1, shadows: true },
    lightingFixtures: [],
    selectedLightingFixtureId: null,
    customLightingPresets: readCustomLightingPresets(),

    // ── Snapping ─────────────────────────────────
    snapEnabled: true,
    gridSize: 0.25,
    rotationSnap: Math.PI / 4,

    // ── History ──────────────────────────────────
    history: [],
    future: [],

    // ── Clipboard ────────────────────────────────
    clipboard: [],

    // ── UI State ─────────────────────────────────
    saveStatus: 'idle',
    searchQuery: '',
    selectedCategory: 'all',
    favorites: [],
    recentlyUsed: [],
    showMinimap: true,
    showMeasurements: true,
    showGrid: false,
  };
}

const useStore = create((set, get) => ({
  ...createInitialState(),

  // ═══════════════════════════════════════════════
  // History Helpers
  // ═══════════════════════════════════════════════

  /** Push current furniture state to history before a mutation. */
  _pushHistory: () => {
    const { furniture, structures, windows, room, history } = get();
    const snapshot = JSON.parse(JSON.stringify({ furniture, structures, windows, room }));
    const newHistory = [...history, snapshot];
    if (newHistory.length > MAX_HISTORY_SIZE) newHistory.shift();
    set({ history: newHistory, future: [] });
  },

  // ═══════════════════════════════════════════════
  // Template Actions
  // ═══════════════════════════════════════════════

  setTemplate: (templateId) => {
    const customTemplate = get().customTemplates.find((item) => item.id === templateId);
    const template = customTemplate ? {
      ...customTemplate,
      furniture: normalizeFurniture(customTemplate.furniture),
      structures: normalizeStructures(customTemplate.structures),
    } : instantiateTemplate(templateId);
    if (!template) return;
    set({
      currentTemplate: templateId,
    room: { ...template.room, floorMaterial: template.room.floorMaterial || 'floor-1', wallMaterial: template.room.wallMaterial || 'warmPaint' },
      windows: template.windows,
      doors: template.doors,
      furniture: normalizeFurniture(template.furniture),
      structures: normalizeStructures(template.structures),
lightPreset: template.lightPreset || 'midday',
  environmentPreset: 'Natural Daylight',
  environmentSettings: { background: '#121313', ambientIntensity: 0.58, sunlightIntensity: 1.55, sunlightColor: '#fff8ea', azimuth: 218, elevation: 62, exposure: 1.08, shadows: true },
  lightingSettings: { ambientIntensity: 0.58, mainIntensity: 1.55, color: '#fff8ea', exposure: 1, shadows: true },
    lightingFixtures: [],
      lastSavedState: cloneFurnitureState(normalizeFurniture(template.furniture)),
      selectedIds: [],
      history: [],
      future: [],
    });
  },

  updateRoom: (updates) => set((state) => ({ room: { ...state.room, ...updates } })),

  createCustomRoom: (name) => {
    const trimmedName = String(name || '').trim();
    if (!trimmedName) return null;
    const id = `custom-room-${generateId()}`;
    const baseRoom = { ...get().room, width: 6, depth: 5, height: 2.7, wallThickness: 0.2 };
    const customTemplate = { id, name: trimmedName, room: baseRoom, windows: [
    {
      id: 'win-default-1',
      wall: 'back',
      position: 0.5,
      width: 2.0,
      height: 1.4,
      sillHeight: 0.85,
      type: 'Sliding Window',
      panels: '2',
      opening: 'Sliding',
    },
    {
      id: 'win-default-2',
      wall: 'right',
      position: 0.5,
      width: 1.4,
      height: 1.2,
      sillHeight: 0.9,
      type: 'Fixed Window',
      panels: '1',
      opening: 'Fixed',
    },
  ], doors: [], furniture: [], structures: [], lightPreset: 'day' };
    set((state) => ({ customTemplates: [...state.customTemplates, customTemplate] }));
    get().setTemplate(id);
    return id;
  },

  addStructure: (type) => {
    if (!STRUCTURE_TYPES.has(type)) return;
    get()._pushHistory();
    const structure = normalizeStructure({ type });
    set((state) => ({ structures: [...state.structures, structure], selectedIds: [structure.id] }));
    return structure.id;
  },
  updateStructure: (id, updates) => set((state) => ({
    structures: state.structures.map((item) => item.id === id
      ? normalizeStructure({ ...item, ...(item.isLocked ? Object.fromEntries(Object.entries(updates).filter(([key]) => key === 'isLocked')) : updates) })
      : item),
  })),
  updateStructureWithHistory: (id, updates) => {
    const item = get().structures.find((entry) => entry.id === id);
    if (!item || item.isLocked) return;
    get()._pushHistory(); get().updateStructure(id, updates);
  },
  removeStructure: (id) => { if (!get().structures.some((item) => item.id === id)) return; get()._pushHistory(); set((state) => ({ structures: state.structures.filter((item) => item.id !== id), selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id) })); },
  duplicateStructure: (id) => { const original = get().structures.find((item) => item.id === id); if (!original) return; get()._pushHistory(); const copy = normalizeStructure({ ...JSON.parse(JSON.stringify(original)), id: generateId(), position: [original.position[0] + 0.5, original.position[1], original.position[2] + 0.5], isLocked: false }); set((state) => ({ structures: [...state.structures, copy], selectedIds: [copy.id] })); return copy.id; },
  toggleStructureLock: (id) => set((state) => ({ structures: state.structures.map((item) => item.id === id ? { ...item, isLocked: !item.isLocked } : item) })),
  selectStructure: (id, additive = false) => set((state) => ({ selectedIds: additive ? (state.selectedIds.includes(id) ? state.selectedIds.filter((item) => item !== id) : [...state.selectedIds, id]) : [id] })),

  // ═══════════════════════════════════════════════
  // Furniture Actions
  // ═══════════════════════════════════════════════

  addFurniture: (catalogItem, position = [0, 0, 0]) => {
    const suppliedDefinition =
      catalogItem && typeof catalogItem === 'object' ? catalogItem : null;
    const registryId = suppliedDefinition?.id ?? catalogItem;
    const definition =
      getFurnitureById(registryId) ??
      (suppliedDefinition?.modelPath ? suppliedDefinition : null);

    if (!definition) return;
    get()._pushHistory();

    const newItem = {
      id: generateId(),
      catalogItemId: registryId,
      registryId,
      backendCatalogItemId:
        suppliedDefinition?.backendCatalogItemId ??
        getBackendCatalogItemId(registryId),
      position: [...position],
      rotation: [...(definition.defaultRotation ?? [0, 0, 0])],
      scale: [...(definition.defaultScale ?? [1, 1, 1])],
      bounds: getCatalogFootprint(
        definition,
        definition.defaultScale ?? [1, 1, 1],
      ),
      isLocked: false,
      isVisible: true,
      isColliding: false,
      custom: Boolean(suppliedDefinition?.custom),
      name: suppliedDefinition?.name ?? definition.name,
      category: suppliedDefinition?.category ?? definition.category,
      modelPath: suppliedDefinition?.modelPath ?? definition.modelPath ?? null,
      thumbnailPath: suppliedDefinition?.thumbnailPath ?? null,
      workspaceId: suppliedDefinition?.workspaceId ?? null,
      dimensions: suppliedDefinition?.dimensions ?? definition.dimensions,
      defaultScale: [...(definition.defaultScale ?? [1, 1, 1])],
      defaultRotation: [...(definition.defaultRotation ?? [0, 0, 0])],
    };

    if (Number(definition.snapHeight) > 0) {
      newItem.position[1] = Number(definition.snapHeight);
    }

    set((state) => ({
      furniture: [...state.furniture, newItem],
      selectedIds: [newItem.id],
      recentlyUsed: [
        registryId,
        ...state.recentlyUsed.filter((id) => id !== registryId),
      ].slice(0, 10),
    }));

    return newItem.id;
  },

  removeFurniture: (ids) => {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    get()._pushHistory();
    set((state) => ({
      furniture: state.furniture.filter((f) => !idsArray.includes(f.id)),
      selectedIds: state.selectedIds.filter((id) => !idsArray.includes(id)),
    }));
  },

  updateFurniture: (id, updates) => {
    set((state) => ({
      furniture: state.furniture.map((item) => {
        if (item.id !== id) return item;
        const safeUpdates = item.isLocked
          ? Object.fromEntries(Object.entries(updates).filter(([key]) => !['position', 'rotation', 'scale'].includes(key)))
          : updates;
        return normalizeFurnitureItem({ ...item, ...safeUpdates });
      }),
    }));
  },

  setCollisionStates: (collisionIds) => {
    set((state) => {
      const nextIds = new Set(collisionIds);
      let changed = false;
      const furniture = state.furniture.map((item) => {
        const isColliding = nextIds.has(item.id);
        if (item.isColliding !== isColliding) changed = true;
        return item.isColliding === isColliding ? item : { ...item, isColliding };
      });
      return changed ? { furniture } : state;
    });
  },

  /** Update furniture and push to history (for completed transforms). */
  updateFurnitureWithHistory: (id, updates) => {
    const item = get().furniture.find((entry) => entry.id === id);
    if (!item || item.isLocked) return;
    get()._pushHistory();
    set((state) => ({
      furniture: state.furniture.map((entry) =>
        entry.id === id ? normalizeFurnitureItem({ ...entry, ...updates }) : entry,
      ),
    }));
  },

  duplicateFurniture: (ids) => {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    get()._pushHistory();

    const { furniture } = get();
    const newItems = [];

    idsArray.forEach((id) => {
      const original = furniture.find((f) => f.id === id);
      if (original) {
        const newItem = {
          ...JSON.parse(JSON.stringify(original)),
          id: generateId(),
          position: [
            original.position[0] + 0.5,
            original.position[1],
            original.position[2] + 0.5,
          ],
        };
        newItems.push(newItem);
      }
    });

    set((state) => ({
      furniture: [...state.furniture, ...newItems],
      selectedIds: newItems.map((item) => item.id),
    }));
  },

  // ═══════════════════════════════════════════════
  // Selection Actions
  // ═══════════════════════════════════════════════

  selectFurniture: (id, additive = false) => {
    set((state) => {
      if (!state.furniture.some((item) => item.id === id)) return state;
      if (additive) {
        const isSelected = state.selectedIds.includes(id);
        return {
          selectedIds: isSelected
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        };
      }
      return { selectedIds: [id] };
    });
  },

  clearSelection: () => set({ selectedIds: [] }),

  selectAll: () =>
    set((state) => ({
      selectedIds: state.furniture.map((f) => f.id),
    })),

  // ═══════════════════════════════════════════════
  // Transform Mode
  // ═══════════════════════════════════════════════

  setTransformMode: (mode) => set({ transformMode: mode }),

  // ═══════════════════════════════════════════════
  // Camera
  // ═══════════════════════════════════════════════

  setCameraMode: (mode) => set({ cameraMode: mode }),

  // ═══════════════════════════════════════════════
  // Lighting
  // ═══════════════════════════════════════════════

  setLightPreset: (preset) => set({ lightPreset: preset }),
  setEnvironmentPreset: (preset, settings = {}) => set((state) => ({ environmentPreset: preset, environmentSettings: { ...state.environmentSettings, ...settings } })),
  setEnvironmentSettings: (updates) => set((state) => ({ environmentSettings: { ...state.environmentSettings, ...updates } })),
  setLightingSettings: (updates) => set((state) => ({ lightingSettings: { ...state.lightingSettings, ...updates } })),
  saveCustomLightingPreset: (name) => { const trimmed = String(name || '').trim(); if (!trimmed) return null; const preset = { id: `custom-light-${generateId()}`, name: trimmed, settings: { ...get().lightingSettings }, lightPreset: 'custom' }; set((state) => { const customLightingPresets = [...state.customLightingPresets.filter((item) => item.name.toLowerCase() !== trimmed.toLowerCase()), preset]; persistCustomLightingPresets(customLightingPresets); return { customLightingPresets }; }); return preset.id; },
  deleteCustomLightingPreset: (id) => set((state) => { const customLightingPresets = state.customLightingPresets.filter((item) => item.id !== id); persistCustomLightingPresets(customLightingPresets); return { customLightingPresets }; }),
  applyCustomLightingPreset: (id) => { const preset = get().customLightingPresets.find((item) => item.id === id); if (!preset) return; set({ lightingSettings: { ...preset.settings }, lightPreset: 'custom' }); },
  selectLightingFixture: (id) => set((state) => ({ selectedLightingFixtureId: state.lightingFixtures.some((fixture) => fixture.id === id) ? id : null, selectedIds: [] })),
  addLightingFixture: (type) => { const presets = { 'Pendant Light': [0, 2.2, 0], 'Floor Lamp': [-1.6, 1.1, 0], 'Wall Sconce': [2.2, 1.8, -1.9], 'Recessed Light': [0, 2.62, 0] }; const fixture = { id: generateId(), type, position: presets[type] || [0, 2.4, 0], rotation: [0, 0, 0], intensity: 1, color: '#ffd6a3', visible: true }; set((state) => ({ lightingFixtures: [...state.lightingFixtures, fixture], selectedLightingFixtureId: fixture.id })); return fixture.id; },
  updateLightingFixture: (id, updates) => set((state) => ({ lightingFixtures: state.lightingFixtures.map((fixture) => fixture.id === id ? { ...fixture, ...updates } : fixture) })),
  removeLightingFixture: (id) => set((state) => ({ lightingFixtures: state.lightingFixtures.filter((fixture) => fixture.id !== id), selectedLightingFixtureId: state.selectedLightingFixtureId === id ? null : state.selectedLightingFixtureId })),
  setRoomAppearance: (updates) =>
  set((state) => ({
  room: { ...state.room, ...updates },
  })),

  selectWindow: (id) => set((state) => ({ selectedWindowId: state.windows.some((windowItem) => windowItem.id === id) ? id : null, selectedIds: [] })),
  updateWindow: (id, updates = {}) => {
    get()._pushHistory();
    set((state) => ({ windows: state.windows.map((windowItem) => windowItem.id === id ? { ...windowItem, ...updates } : windowItem) }));
  },

  deleteWindow: (id) => {
    get()._pushHistory();
    set((state) => ({ windows: state.windows.filter((windowItem) => windowItem.id !== id), selectedWindowId: state.selectedWindowId === id ? null : state.selectedWindowId }));
  },

  addWindow: (windowData = {}) => {
    get()._pushHistory();
    const windowItem = {
      id: generateId(),
      wall: ['back', 'front', 'left', 'right'].includes(windowData.wall) ? windowData.wall : 'back',
      position: Math.min(0.88, Math.max(0.12, finiteNumber(windowData.position, 0.5))),
      width: Math.min((windowData.wall === 'left' || windowData.wall === 'right' ? get().room.depth : get().room.width) - 0.4, Math.max(0.5, finiteNumber(windowData.width, 2.4))),
      height: Math.min(get().room.height - 0.25, Math.max(0.5, finiteNumber(windowData.height, 1.8))),
      sillHeight: Math.min(get().room.height - 0.5, Math.max(0, finiteNumber(windowData.sillHeight, 0.7))),
      type: windowData.type || 'Sliding Window',
      style: windowData.style || 'Minimal',
      opening: windowData.opening || 'Sliding',
      panels: windowData.panels || '2',
    };
    set((state) => ({ windows: [...state.windows, windowItem] }));
    return windowItem.id;
  },

  // ═══════════════════════════════════════════════
  // Snapping
  // ═══════════════════════════════════════════════

  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
  setGridSize: (size) => set({ gridSize: size }),
  setRotationSnap: (snap) => set({ rotationSnap: snap }),
  rotateSelected: (delta = Math.PI / 2) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    get()._pushHistory();
    set((state) => ({
      furniture: state.furniture.map((item) => {
        if (!state.selectedIds.includes(item.id) || item.isLocked) return item;
        const rotation = [...item.rotation];
        rotation[1] += delta;
        return normalizeFurnitureItem({ ...item, rotation });
      }),
    }));
  },

  // ═══════════════════════════════════════════════
  // Undo / Redo
  // ═══════════════════════════════════��═══════════

  undo: () => {
    const { history, furniture, structures, windows, room, future } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({
      history: history.slice(0, -1),
      future: [JSON.parse(JSON.stringify({ furniture, structures, windows, room })), ...future].slice(0, MAX_HISTORY_SIZE),
      furniture: previous.furniture || previous,
structures: previous.structures || [],
  windows: previous.windows || windows,
  room: previous.room || room,
      selectedIds: [],
    });
  },

  redo: () => {
    const { history, furniture, structures, windows, room, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      future: future.slice(1),
      history: [...history, JSON.parse(JSON.stringify({ furniture, structures, windows, room }))].slice(-MAX_HISTORY_SIZE),
      furniture: next.furniture || next,
structures: next.structures || [],
  windows: next.windows || windows,
  room: next.room || room,
      selectedIds: [],
    });
  },

  // ═══════════════════════════════════════════════
  // Clipboard (Copy / Paste)
  // ═══════════════════════════════════════════════

  copySelected: () => {
    const { selectedIds, furniture } = get();
    const items = furniture.filter((f) => selectedIds.includes(f.id));
    set({ clipboard: JSON.parse(JSON.stringify(items)) });
  },

  paste: () => {
    const { clipboard } = get();
    if (clipboard.length === 0) return;
    get()._pushHistory();

    const newItems = clipboard.map((item) => ({
      ...JSON.parse(JSON.stringify(item)),
      id: generateId(),
      position: [
        item.position[0] + 0.5,
        item.position[1],
        item.position[2] + 0.5,
      ],
    }));

    set((state) => ({
      furniture: [...state.furniture, ...newItems],
      selectedIds: newItems.map((item) => item.id),
    }));
  },

  // ═══════════════════════════════════════════════
  // Save / Load
  // ═══════════════════════���═══════════════════════

  setSaveStatus: (status) => set({ saveStatus: status }),

  markFurnitureSaved: () =>
    set((state) => ({ lastSavedState: cloneFurnitureState(state.furniture) })),

  revertSceneObjects: () =>
    set((state) => ({
      furniture: cloneFurnitureState(state.lastSavedState),
      selectedIds: [],
      history: [],
      future: [],
      saveStatus: 'idle',
    })),

  exportRoom: () => {
    const { currentTemplate, room, windows, doors, furniture, structures, customTemplates, lightPreset } =
      get();
    return {
      version: 1,
      currentTemplate,
      room,
      windows,
      doors,
  furniture: furniture.map(furnitureInstanceToDto),
  structures,
  customTemplates,
  lightPreset,
  exportedAt: new Date().toISOString(),
    };
  },

  importRoom: (data) => {
    if (!data || !Array.isArray(data.furniture)) return;
    const room = data.room || createInitialState().room;
    const furniture = normalizeFurniture(data.furniture);
    const structures = normalizeStructures(data.structures);
    const customTemplates = Array.isArray(data.customTemplates) ? data.customTemplates : [];
    set({
      currentTemplate: data.currentTemplate || 'custom',
      room,
      windows: data.windows || [],
      doors: data.doors || [],
      furniture,
      structures,
      customTemplates,
      lastSavedState: cloneFurnitureState(furniture),
      lightPreset: data.lightPreset || 'day',
      favorites: Array.isArray(data.favorites) ? data.favorites : [],
      showMinimap: data.showMinimap !== false,
      showMeasurements: data.showMeasurements !== false,
      showGrid: data.showGrid !== false,
      selectedIds: [],
      history: [],
      future: [],
    });
  },

  resetRoom: () => {
    const { currentTemplate } = get();
    get().setTemplate(currentTemplate);
  },

  // ═══════════════════════════════════════════════
  // Search & Categories
  // ════════════════════��══════════════════════════

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  toggleFavorite: (registryId) =>
    set((state) => ({
      favorites: state.favorites.includes(registryId)
        ? state.favorites.filter((id) => id !== registryId)
        : [...state.favorites, registryId],
    })),

  // ═���════��════════════════════════════════════════
  // UI Toggles
  // ═══════════════════════════════════════════════

  toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
  toggleMeasurements: () =>
    set((state) => ({ showMeasurements: !state.showMeasurements })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
}));

export default useStore;
