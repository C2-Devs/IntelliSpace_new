import { API_BASE_URL } from '../lib/apiClient';
import { normalizeCatalogItem } from '../data/furnitureRegistry';

let catalogPromise = null;
let backendIdsBySlug = new Map();
let localSlugsByBackendId = new Map();

function registerCatalogMappings(items) {
  backendIdsBySlug = new Map();
  localSlugsByBackendId = new Map();

  for (const item of items) {
    if (!item?.slug || !item?.backendCatalogItemId) continue;
    backendIdsBySlug.set(item.slug, item.backendCatalogItemId);
    localSlugsByBackendId.set(item.backendCatalogItemId, item.slug);
  }
}

export function getBackendCatalogItemId(registryId) {
  return backendIdsBySlug.get(registryId) ?? null;
}

export function getRegistryIdForCatalogItem(catalogItemId) {
  return localSlugsByBackendId.get(catalogItemId) ?? null;
}

export function catalogItemFromDto(dto) {
  if (!dto) return null;

  const backendCatalogItemId = dto.id ?? dto.catalog_item_id;
  const item = normalizeCatalogItem({
    id: backendCatalogItemId,
    name: dto.name,
    category: dto.category,
    modelPath: dto.modelPath ?? dto.model_path,
    defaultScale: dto.defaultScale ?? dto.default_scale,
    defaultRotation: dto.defaultRotation ?? dto.default_rotation,
    snapHeight: dto.snapHeight ?? dto.snap_height,
    dimensions: dto.dimensions,
  });

  return {
    ...item,
    backendCatalogItemId,
    slug: dto.slug ?? null,
    description: dto.description ?? null,
    price: dto.price == null ? null : Number(dto.price),
    currency: dto.currency ?? null,
    style: dto.style ?? null,
    material: dto.material ?? null,
    color: dto.color ?? null,
    roomType: dto.roomType ?? dto.room_type ?? null,
  };
}

export function catalogItemToDto(item) {
  const normalized = normalizeCatalogItem(item);
  return {
    id: item.backendCatalogItemId ?? normalized.catalogItemId,
    slug: item.slug,
    name: normalized.name,
    category: normalized.category,
    model_path: normalized.modelPath,
    default_scale: normalized.defaultScale,
    default_rotation: normalized.defaultRotation,
    snap_height: normalized.snapHeight,
    dimensions: normalized.dimensions,
  };
}

export function furnitureInstanceToDto(item) {
  const registryId = item.registryId ?? item.catalogItemId;

  return {
    id: item.id,
    catalog_item_id:
      item.backendCatalogItemId ??
      getBackendCatalogItemId(registryId) ??
      item.catalogItemId,
    position: item.position,
    rotation: item.rotation,
    scale: item.scale,
    bounds: item.bounds,
    is_locked: Boolean(item.isLocked),
    is_visible: item.isVisible !== false,
  };
}

export function createCatalogClient({ fetcher = fetch } = {}) {
  return {
    async list({ endpoint = `${API_BASE_URL}/api/catalog` } = {}) {
      const response = await fetcher(endpoint);
      if (!response.ok) {
        throw new Error(`Catalog request failed: ${response.status}`);
      }

      const payload = await response.json();
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      const items = rows.map(catalogItemFromDto).filter(Boolean);
      registerCatalogMappings(items);
      return items;
    },
  };
}

export function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = createCatalogClient().list().catch((error) => {
      catalogPromise = null;
      throw error;
    });
  }
  return catalogPromise;
}
