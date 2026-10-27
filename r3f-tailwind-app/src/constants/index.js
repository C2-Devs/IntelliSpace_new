/**
 * Application-wide constants for the 3D Room Design Playground.
 */

// ─── Furniture Categories ───────────────────────────────────
export const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🏠' },
  { id: 'living-room', label: 'Living Room', icon: '🛋️' },
  { id: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { id: 'office', label: 'Office', icon: '💼' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { id: 'plants', label: 'Plants', icon: '🌿' },
  { id: 'decor', label: 'Decor', icon: '🖼️' },
  { id: 'lighting', label: 'Lighting', icon: '💡' },
  { id: 'tables', label: 'Tables', icon: '🪑' },
  { id: 'chairs', label: 'Chairs', icon: '🪑' },
  { id: 'storage', label: 'Storage', icon: '🗄️' },
];

// ─── Camera Presets ─────────────────────────────────────────
export const CAMERA_MODES = {
  perspective: {
    label: 'Perspective',
    icon: '🎥',
    position: [10.8, 8.2, 10.8],
    target: [0, 0.75, 0],
    fov: 46,
  },
  top: {
    label: 'Top View',
    icon: '⬆️',
    position: [0, 12, 0.01],
    target: [0, 0, 0],
    fov: 50,
  },
  front: {
    label: 'Front View',
    icon: '👁️',
    position: [0, 3, 10],
    target: [0, 1.5, 0],
    fov: 50,
  },
  side: {
    label: 'Side View',
    icon: '👈',
    position: [10, 3, 0],
    target: [0, 1.5, 0],
    fov: 50,
  },
  isometric: {
    label: 'Isometric',
    icon: '🔷',
    position: [8, 8, 8],
    target: [0, 0, 0],
    fov: 35,
  },
  orbit: {
    label: 'Orbit',
    icon: '🔄',
    position: [6, 5, 6],
    target: [0, 0, 0],
    fov: 50,
  },
};

// ─── Architectural Sunlight Presets ─────────────────────────
// Azimuth is measured around the room in degrees; elevation controls the sun height.
export const LIGHT_PRESETS = {
  morning: {
    label: 'Morning',
    shortLabel: 'AM',
    ambient: { intensity: 0.42, color: '#dbe7ef' },
    directional: { intensity: 1.35, color: '#f5f2ee', azimuth: 132, elevation: 28, softness: 0.7 },
    environment: 'apartment',
    background: '#17191a',
  },
  midday: {
    label: 'Midday',
    shortLabel: 'Noon',
    ambient: { intensity: 0.5, color: '#eef1ef' },
    directional: { intensity: 1.3, color: '#ffffff', azimuth: 218, elevation: 62, softness: 0.55 },
    environment: 'studio',
    background: '#1b1c1b',
  },
  afternoon: {
    label: 'Afternoon',
    shortLabel: 'PM',
    ambient: { intensity: 0.48, color: '#e2e5e7' },
    directional: { intensity: 1.42, color: '#ede8e2', azimuth: 252, elevation: 38, softness: 0.62 },
    environment: 'apartment',
    background: '#1b1a18',
  },
  goldenHour: {
    label: 'Golden Hour',
    shortLabel: 'Gold',
    ambient: { intensity: 0.34, color: '#c8d0d2' },
    directional: { intensity: 1.28, color: '#d4b896', azimuth: 286, elevation: 18, softness: 0.95 },
    environment: 'sunset',
    background: '#211914',
  },
  evening: {
    label: 'Evening',
    shortLabel: 'Dusk',
    ambient: { intensity: 0.2, color: '#aebdce' },
    directional: { intensity: 0.42, color: '#c4a88c', azimuth: 306, elevation: 12, softness: 1.25 },
    environment: 'sunset',
    background: '#17171b',
  },
  night: {
    label: 'Night',
    shortLabel: 'Night',
    ambient: { intensity: 0.11, color: '#71829a' },
    directional: { intensity: 0.12, color: '#9aaac0', azimuth: 42, elevation: 42, softness: 1.35 },
    environment: 'night',
    background: '#0c0e12',
  },
  day: {
    label: 'Midday',
    shortLabel: 'Noon',
    ambient: { intensity: 0.5, color: '#eef1ef' },
    directional: { intensity: 1.3, color: '#ffffff', azimuth: 218, elevation: 62, softness: 0.55 },
    environment: 'studio',
    background: '#1b1c1b',
  },
  warm: {
    label: 'Golden Hour',
    shortLabel: 'Gold',
    ambient: { intensity: 0.34, color: '#c8d0d2' },
    directional: { intensity: 1.28, color: '#d4b896', azimuth: 286, elevation: 18, softness: 0.95 },
    environment: 'sunset',
    background: '#211914',
  },
  studio: {
    label: 'Studio',
    shortLabel: 'Studio',
    ambient: { intensity: 0.68, color: '#edf1f2' },
    directional: { intensity: 0.32, color: '#eef4ff', azimuth: 218, elevation: 62, softness: 1.5 },
    environment: 'studio',
    background: '#202224',
  },
};

export const LIGHT_PRESET_OPTIONS = ['morning', 'midday', 'afternoon', 'goldenHour', 'evening', 'night'];

export const FLOORING_MATERIALS = {
  oakNatural: { label: 'Oak Natural', subtitle: 'Warm engineered oak', color: '#bd8d59', roughness: 0.58, metalness: 0.02, pattern: 'plank', price: 0 },
  oakGrey: { label: 'Oak Grey', subtitle: 'Smoked ash oak', color: '#8c8a81', roughness: 0.64, metalness: 0.02, pattern: 'plank', price: 3200 },
  walnutPremium: { label: 'Walnut Premium', subtitle: 'Deep walnut veneer', color: '#71452f', roughness: 0.46, metalness: 0.02, pattern: 'plank', price: 5400 },
  concreteLight: { label: 'Concrete Light', subtitle: 'Soft mineral finish', color: '#aaa79c', roughness: 0.82, metalness: 0.01, pattern: 'slab', price: 2100 },
  porcelainTile: { label: 'Porcelain Tile', subtitle: 'Large-format stone', color: '#75766f', roughness: 0.34, metalness: 0.04, pattern: 'tile', price: 4800 },
  travertine: { label: 'Travertine', subtitle: 'Natural limestone', color: '#c5b396', roughness: 0.72, metalness: 0.01, pattern: 'slab', price: 6200 },
};

export const FLOORING_MATERIAL_OPTIONS = Object.keys(FLOORING_MATERIALS);

export const WALL_MATERIALS = {
  warmPaint: { label: 'Warm Paint', subtitle: 'Soft mineral white', color: '#d8d2c6', roughness: 0.82, metalness: 0.01, finish: 'Matte' },
  plaster: { label: 'Plaster', subtitle: 'Hand-finished lime', color: '#c9c1b4', roughness: 0.9, metalness: 0.005, finish: 'Matte' },
  concrete: { label: 'Concrete', subtitle: 'Quiet architectural grey', color: '#a8a69f', roughness: 0.76, metalness: 0.02, finish: 'Satin' },
  stone: { label: 'Stone', subtitle: 'Natural limestone', color: '#b5aa98', roughness: 0.86, metalness: 0.01, finish: 'Matte' },
  wallpaper: { label: 'Wallpaper', subtitle: 'Textured linen neutral', color: '#cfc8ba', roughness: 0.74, metalness: 0.005, finish: 'Satin' },
};

export const WALL_MATERIAL_OPTIONS = Object.keys(WALL_MATERIALS);

// ─── Snap Settings ──────────────────────────────────────────
export const GRID_SIZES = [
  { value: 0.05, label: '5 cm' },
  { value: 0.1, label: '10 cm' },
  { value: 0.25, label: '25 cm' },
  { value: 0.5, label: '50 cm' },
];

export const ROTATION_SNAPS = [
  { value: Math.PI / 12, label: '15°' },
  { value: Math.PI / 6, label: '30°' },
  { value: Math.PI / 4, label: '45°' },
  { value: Math.PI / 2, label: '90°' },
];

// ─── Transform Modes ───────────────────────────────────────
export const TRANSFORM_MODES = {
  translate: { label: 'Move', icon: '↔️', shortcut: 'W' },
  rotate: { label: 'Rotate', icon: '🔄', shortcut: 'E' },
  scale: { label: 'Scale', icon: '↗️', shortcut: 'R' },
};

// ─── Undo/Redo Limits ──────────────────────────────────────
export const MAX_HISTORY_SIZE = 50;

// ─── Autosave ───────────────────────────────────────────────
export const AUTOSAVE_DELAY_MS = 1000;
export const LOCAL_STORAGE_KEY = 'room-designer-state';
