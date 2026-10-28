/**
 * Room Templates — 4 pre-designed room layouts.
 *
 * Each template defines room geometry, color palette, and pre-placed furniture.
 * Furniture entries reference IDs from the furnitureRegistry.
 */
import { generateId } from '../utils/idUtils';

/**
 * Helper to create a furniture placement entry.
 */
function f(registryId, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  return {
    id: generateId(),
    catalogItemId: registryId,
    position,
    rotation,
    scale,
    isLocked: false,
    isVisible: true,
    isColliding: false,
  };
}

// ═══════════════════════════════════════════════════════════
// Template 1: Modern Living Room
// ═══════════════════════════════════════════════════════════
const modernLivingRoom = {
  id: 'modern-living-room',
  name: 'Modern Living Room',
  description: 'A spacious modern living room with contemporary furnishings',
  room: {
    width: 14,
    depth: 10,
    height: 3,
    wallColor: '#8cbe5b',
    floorColor: '#8B7355',
    ceilingColor: '#fafafa',
    wallThickness: 0.15,
  },
  windows: [
    { wall: 'back', position: 0.3, width: 3, height: 2.2, sillHeight: 0.4 },
    { wall: 'back', position: 0.7, width: 3, height: 2.2, sillHeight: 0.4 },
  ],
  doors: [
    { wall: 'left', position: 0.2, width: 1.2, height: 2.4 }, // Main entrance
    { wall: 'right', position: 0.5, width: 4, height: 2.6 }, // Large glass sliding door
  ],
  furniture: () => [
    f('couch-large', [-2.5, 0, 1.8], [0, 0, 0]),
    f('rounded-coffee-table', [-2.5, 0, -0.1], [0, 0, 0]),
    f('wool-carpet', [-2.5, 0.01, 0.8], [0, 0, 0], [1.4, 1, 1.4]),
    f('club-arm-chair', [-0.6, 0, 0.8], [0, -1.4, 0]),
    f('club-arm-chair', [-4.4, 0, 0.8], [0, 1.4, 0]),
    f('tv', [0, 1.6, -4.85]),
    f('speakers', [2.2, 0, -4.85], [0, 0, 0], [0.7, 0.7, 0.7]),
    f('speakers', [-2.2, 0, -4.85], [0, 0, 0], [0.7, 0.7, 0.7]),
    f('light-chandelier', [0, 2.9, 0]),
    f('fireplace', [-6.25, 0, -0.5], [0, 1.57, 0], [1.2, 1.2, 1.2]),
    f('houseplant-tall', [6.2, 0, -3.5], [0, -1.57, 0], [0.7, 0.7, 0.7]),
    f('houseplant-tall', [-6.2, 0, -4.2]),
    f('houseplant', [5.8, 0, 3.5], [0, 0, 0], [1.0, 1.0, 1.0]),
    f('ottoman-coffee-table', [3.5, 0, 1.5], [0, 0, 0], [1.2, 1.2, 1.2]),
    f('club-arm-chair', [4.75, 0, 3.25], [0, -0.785, 0]),
  ],
  lightPreset: 'day',
};

// ═══════════════════════════════════════════════════════════
// Template 2: Scandinavian Bedroom
// ═══════════════════════════════════════════════════════════
const scandinavianBedroom = {
  id: 'scandinavian-bedroom',
  name: 'Scandinavian Bedroom',
  description: 'A cozy Scandinavian-inspired bedroom with warm tones',
  room: {
    width: 9,
    depth: 8,
    height: 2.8,
    wallColor: '#f8f4ef',
    floorColor: '#d4b896',
    ceilingColor: '#ffffff',
    wallThickness: 0.12,
    floorY: 0,
    coordinateSystem: 'centered-xz',
  },
  windows: [
    { wall: 'back', position: 0.5, width: 2.5, height: 1.8, sillHeight: 0.7 },
    { wall: 'right', position: 0.3, width: 1.2, height: 1.8, sillHeight: 0.7 },
  ],
  doors: [
    { wall: 'front', position: 0.7, width: 1, height: 2.2 },
    { wall: 'left', position: 0.3, width: 0.9, height: 2.2 }, // Ensuite door
  ],
  furniture: () => [
    f('double-bed', [0, 0, -2.5]),
    f('night-stand', [-2.2, 0, -3]),
    f('night-stand-alt', [2.2, 0, -3]),
    f('bedside-lamp', [-2.2, 0.5, -3]),
    f('bedside-lamp', [2.2, 0.5, -3]),
    f('small-wardrobe', [-3.8, 0, 1.5], [0, 1.571, 0]),
    f('mirror', [3, 0, 2.5], [0, 3.142, 0]),
    f('houseplant', [3, 0, 1.2]),
    f('small-wardrobe', [3.5, 0, -3]),
    f('wool-carpet', [0, 0.01, -1]),
    f('painting-canvas', [-4, 1.2, -1.5], [0, 1.571, 0]),
    f('small-bookshelf', [0, 0, -3.85]),
    f('ceiling-lamp', [0, 2.5, 0]),
  ],
  lightPreset: 'warm',
};

// ═══════════════════════════════════════════════════════════
// Template 3: Industrial Workspace
// ═══════════════════════════════════════════════════════════
const industrialWorkspace = {
  id: 'industrial-workspace',
  name: 'Industrial Workspace',
  description: 'A modern industrial-style office with metal accents',
  room: {
    width: 12,
    depth: 9,
    height: 3.2,
    wallColor: '#c4beb8',
    floorColor: '#808080',
    ceilingColor: '#e0e0e0',
    wallThickness: 0.15,
    floorY: 0,
    coordinateSystem: 'centered-xz',
  },
  windows: [
    { wall: 'back', position: 0.2, width: 2.5, height: 2.4, sillHeight: 0.4 },
    { wall: 'back', position: 0.5, width: 2.5, height: 2.4, sillHeight: 0.4 },
    { wall: 'back', position: 0.8, width: 2.5, height: 2.4, sillHeight: 0.4 },
  ],
  doors: [
    { wall: 'front', position: 0.15, width: 1.5, height: 2.6 }, // Double doors
  ],
  furniture: () => [
    f('computer-desk', [0, 0, -2.5]),
    f('executive-chair', [0, 0.5, -0.75], [0, 3.142, 0]),
    f('monitor', [0, 0.75, -2.7]),
    f('monitor', [0.5, 0.75, -2.5]),
    f('monitor', [-0.5, 0.75, -2.5]),
    f('desk-lamp', [-1, 0.75, -2.7]),
    f('l-shaped-desk', [-5.5, 0, -1], [0, 1.571, 0]),
    f('standing-desk', [-4.75, 0, 1.5], [0, 1.571, 0]),
    f('executive-desk', [5.5, 0, -2.5], [0, -1.571, 0]),
    f('cube-cabinet', [5, 0, 3.5]),
    f('cube-cabinet', [-5, 0, 3.5]),
    f('desk-lamp', [1.5, 0.75, -3]),
    f('executive-chair', [2, 0, -0.5]),
    f('ceiling-lamp', [0, 2.8, -2]),
    f('ceiling-lamp', [0, 2.8, 2]),
    f('medium-bookshelf', [5.5, 1.5, 1], [0, -1.571, 0]),
    f('monitor', [-0.3, 0.75, -1.5]),
  ],
  lightPreset: 'studio',
};

// ═══════════════════════════════════════════════════════════
// Template 4: Modern Studio Apartment
// ═══════════════════════════════════════════════════════════
const modernStudioApartment = {
  id: 'modern-studio',
  name: 'Modern Studio Apartment',
  description: 'An open-concept studio apartment with kitchen, living, and sleeping areas',
  room: {
    width: 16,
    depth: 12,
    height: 3,
    wallColor: '#eee8e0',
    floorColor: '#a08060',
    ceilingColor: '#f5f5f5',
    wallThickness: 0.15,
    floorY: 0,
    coordinateSystem: 'centered-xz',
  },
  windows: [
    { wall: 'right', position: 0.25, width: 3, height: 2, sillHeight: 0.5 },
    { wall: 'right', position: 0.75, width: 3, height: 2, sillHeight: 0.5 },
    { wall: 'back', position: 0.8, width: 2, height: 1.8, sillHeight: 0.8 },
  ],
  doors: [
    { wall: 'left', position: 0.15, width: 1.2, height: 2.2 }, // Entrance
    { wall: 'back', position: 0.3, width: 3.5, height: 2.6 }, // Huge sliding glass door
  ],
  furniture: () => [
    f('sink-kitchen-cabinet', [-5.5, 0, -5]),
    f('gas-stove', [-3.5, 0, -5]),
    f('fridge', [-7, 0, -5]),
    f('double-door-upper-cabinet', [-5, 1.5, -5.5]),
    f('wood-kitchen-table', [-4, 0, -1]),
    f('wood-kitchen-chair', [-5, 0, -1], [0, 1.571, 0]),
    f('wood-kitchen-chair', [-3, 0, -1], [0, -1.571, 0]),
    f('wood-kitchen-chair', [-4, 0, -0.2], [0, 3.142, 0]),
    f('wood-kitchen-chair', [-4, 0, -1.8]),
    f('three-seater-couch', [2.5, 0, 0]),
    f('rounded-coffee-table', [2.5, 0, 2]),
    f('tv', [2.5, 0.8, -2.5]),
    f('club-arm-chair', [5.5, 0, 1.5], [0, -1.571, 0]),
    f('wool-carpet', [2.5, 0.01, 0.5]),
    f('double-bed', [5, 0, 4], [0, -1.571, 0]),
    f('night-stand', [6.5, 0, 3]),
    f('bedside-lamp', [6.5, 0.5, 3]),
    f('small-wardrobe', [7, 0, -1.5], [0, -1.571, 0]),
    f('houseplant-tall', [-7, 0, 5]),
    f('houseplant', [7, 0, 5]),
    f('cactus', [1, 0.75, -3]),
    f('light-chandelier', [-3.5, 2.5, -1]),
    f('ceiling-lamp', [2.5, 2.6, 0]),
    f('lamp', [6.5, 0, 5]),
  ],
  lightPreset: 'day',
};

// ═══════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════
export const ROOM_TEMPLATES = {
  'modern-living-room': modernLivingRoom,
  'scandinavian-bedroom': scandinavianBedroom,
  'industrial-workspace': industrialWorkspace,
  'modern-studio': modernStudioApartment,
};

export const TEMPLATE_LIST = Object.values(ROOM_TEMPLATES);

export function getTemplate(id) {
  return ROOM_TEMPLATES[id] || null;
}

/**
 * Instantiate a template — generates fresh IDs for all furniture.
 */
export function instantiateTemplate(templateId) {
  const template = ROOM_TEMPLATES[templateId];
  if (!template) return null;
  return {
    ...template,
    windows: (template.windows || []).map((win, idx) => ({
      id: win.id || `win-default-${idx + 1}`,
      wall: win.wall,
      position: win.position,
      width: win.width,
      height: win.height,
      sillHeight: win.sillHeight ?? 0.8,
      type: win.type || 'Sliding Window',
      panels: win.panels || '2',
      opening: win.opening || 'Sliding',
    })),
    furniture: template.furniture(),
  };
}

export default ROOM_TEMPLATES;

// Prevent Vite from performing a full page reload when the server writes to this file
if (import.meta.hot) {
  import.meta.hot.accept();
}
