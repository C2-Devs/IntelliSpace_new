export const FLOORING_CATEGORIES = ['All', 'Wood', 'Tile', 'Stone', 'Concrete', 'Carpet', 'Vinyl & Laminate'];

const MATERIALS = [
  ['White Marble', 'Stone', '#f1f0eb'],
  ['Warm Ivory Marble', 'Stone', '#e7dfd1'],
  ['Light Oak', 'Wood', '#c9a06d'],
  ['Large-Format Warm Grey Porcelain', 'Tile', '#aaa9a3'],
  ['Matte Concrete', 'Concrete', '#aaa9a0'],
  ['Oak Natural', 'Wood', '#b88857'], ['Oak Grey', 'Wood', '#85877f'], ['Oak Honey', 'Wood', '#c18b4e'], ['Walnut Dark', 'Wood', '#70442f'], ['Teak Natural', 'Wood', '#a96e43'], ['Ash Light', 'Wood', '#d0b58f'],
  ['Porcelain White', 'Tile', '#e5e3dc'], ['Porcelain Warm Grey', 'Tile', '#b9b8b1'], ['Porcelain Sand', 'Tile', '#cdbb9e'], ['Marble Carrara', 'Tile', '#d9d5cc'], ['Travertine Beige', 'Tile', '#c5ad8e'], ['Terrazzo Sand', 'Tile', '#c6b298'], ['Slate Grey', 'Tile', '#777875'], ['Slate Black', 'Tile', '#37383a'],
  ['Carrara Marble', 'Stone', '#d7d2c8'], ['Calacatta Marble', 'Stone', '#e6e1d7'], ['Travertine Beige', 'Stone', '#c4ae91'], ['Limestone Cream', 'Stone', '#d5c7ae'], ['Granite Black', 'Stone', '#252629'],
  ['Concrete Light', 'Concrete', '#aaa79c'], ['Concrete Grey', 'Concrete', '#898b87'], ['Polished Concrete', 'Concrete', '#9a9b97'], ['Microcement Light', 'Concrete', '#c5c2b9'], ['Microcement Warm Grey', 'Concrete', '#aaa59b'],
  ['Beige Carpet', 'Carpet', '#cbb99e'], ['Warm Grey Carpet', 'Carpet', '#9d9990'], ['Charcoal Carpet', 'Carpet', '#4a4b4a'], ['Cream Plush', 'Carpet', '#e1d5be'], ['Natural Wool', 'Carpet', '#b9ad96'],
  ['Oak Laminate Natural', 'Vinyl & Laminate', '#b88857'], ['Oak Laminate Grey', 'Vinyl & Laminate', '#85877f'], ['Walnut Laminate', 'Vinyl & Laminate', '#70442f'], ['Concrete Vinyl', 'Vinyl & Laminate', '#9b9c97'], ['Stone Vinyl', 'Vinyl & Laminate', '#aaa396'], ['Light Oak Vinyl', 'Vinyl & Laminate', '#cba77b'],
];

export const FLOORING_MATERIAL_CATALOG = MATERIALS.map(([name, category, color], index) => ({ id: `floor-${index + 1}`, name, category, color, pattern: 'Straight' }));
export const FLOORING_PATTERNS = ['Straight', 'Herringbone', 'Chevron', 'Basket Weave', 'Grid', 'Large Format', 'Running Bond', 'Stack Bond', 'Diagonal', 'Versailles', 'Hexagon', 'Random'];
export const flooringPatternBackground = (pattern) => ({ Herringbone: 'linear-gradient(45deg,transparent 45%,#d3a372 46% 54%,transparent 55%),linear-gradient(-45deg,#936743 45%,#d0a172 46% 54%,#8c5e3f 55%)', Chevron: 'repeating-linear-gradient(45deg,#b08357 0 18px,#d4ab7d 19px 22px)', Hexagon: 'radial-gradient(circle,#cab497 0 5px,transparent 6px),#777875' }[pattern] || 'repeating-linear-gradient(90deg,#a8794e 0 32px,#d2a777 33px 36px)');

export const FLOORING_MATERIAL_BY_ID = Object.fromEntries(FLOORING_MATERIAL_CATALOG.map((material) => [material.id, material]));
export const FLOORING_MATERIAL_NAMES = new Set(FLOORING_MATERIAL_CATALOG.map((material) => material.name));

export function getFloorMaterialId(name) { return FLOORING_MATERIAL_CATALOG.find((material) => material.name === name)?.id || FLOORING_MATERIAL_CATALOG[0].id; }
export function getFloorMaterialColor(id) { return FLOORING_MATERIAL_BY_ID[id]?.color || FLOORING_MATERIAL_CATALOG[0].color; }
