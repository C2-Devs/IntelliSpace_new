import { useEffect, useState } from 'react';
import REGISTRY from '../data/furnitureRegistry';
import {
  isApprovedHuggingFaceModelUrl,
  loadCatalog,
} from '../utils/catalogApi';
import { listCustomFurniture } from '../utils/customFurnitureApi';
import useWorkspaceStore from '../store/useWorkspaceStore.js';

const LOCAL_ITEMS_BY_ID = new Map(REGISTRY.map((item) => [item.id, item]));

function customItemFromDto(dto) {
  const id = dto.slug || `custom-${dto.id}`;
  const dimensions = dto.dimensions || {};

  return {
    id,
    catalogItemId: id,
    registryId: id,
    backendCatalogItemId: dto.id,
    slug: dto.slug || id,
    name: dto.name || 'Custom furniture',
    category: dto.category || 'decor',
    description: dto.description || '',
    modelPath: dto.modelPath || null,
    thumbnailPath: dto.thumbnailPath || null,
    defaultScale: dto.defaultScale || [1, 1, 1],
    defaultRotation: dto.defaultRotation || [0, 0, 0],
    snapHeight: Number(dto.snapHeight) || 0,
    dimensions: {
      width: Number(dimensions.width) || 1,
      height: Number(dimensions.height) || 1,
      depth: Number(dimensions.depth) || 1,
    },
    custom: true,
    workspaceId: dto.workspaceId,
    price: null,
    currency: 'INR',
  };
}

export default function useCatalog() {
  const activeWorkspaceId = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );

  const [catalog, setCatalog] = useState({
    items: REGISTRY,
    status: 'loading',
  });

  useEffect(() => {
    let active = true;

    async function refreshCatalog() {
      let items = REGISTRY;
      let status = 'fallback';

      try {
        const serverItems = await loadCatalog();

        const liveItems = serverItems
          .map((serverItem) => {
            const localItem = LOCAL_ITEMS_BY_ID.get(serverItem.slug);
            if (localItem == null) return null;

            const modelPath = isApprovedHuggingFaceModelUrl(
              serverItem.modelPath,
            )
              ? serverItem.modelPath
              : localItem.modelPath;

            return {
              ...localItem,
              modelPath,
              backendCatalogItemId: serverItem.backendCatalogItemId,
              price: serverItem.price,
              currency: serverItem.currency,
              description: serverItem.description,
              style: serverItem.style,
              material: serverItem.material,
              color: serverItem.color,
              roomType: serverItem.roomType,
            };
          })
          .filter(Boolean);

        const liveIds = new Set(liveItems.map((item) => item.id));
        const registryOnlyRemoteItems = REGISTRY.filter(
          (item) =>
            liveIds.has(item.id) === false &&
            isApprovedHuggingFaceModelUrl(item.modelPath),
        );

        items = [...liveItems, ...registryOnlyRemoteItems];
        status = 'live';
      } catch (error) {
        console.error('[IntelliSpace] Built-in catalog request failed:', error);
      }

      if (activeWorkspaceId) {
        try {
          const customDtos = await listCustomFurniture(activeWorkspaceId);
          const customItems = customDtos.map(customItemFromDto);
          const customIds = new Set(customItems.map((item) => item.id));

          items = [
            ...items.filter((item) => customIds.has(item.id) === false),
            ...customItems,
          ];
        } catch (error) {
          console.error(
            '[IntelliSpace] Workspace custom-furniture request failed:',
            error,
          );
        }
      }

      if (active) {
        setCatalog({ items, status });
      }
    }

    const handleCustomFurnitureUpdate = () => {
      refreshCatalog();
    };

    window.addEventListener(
      'intelli:custom-furniture-updated',
      handleCustomFurnitureUpdate,
    );

    refreshCatalog();

    return () => {
      active = false;
      window.removeEventListener(
        'intelli:custom-furniture-updated',
        handleCustomFurnitureUpdate,
      );
    };
  }, [activeWorkspaceId]);

  return catalog;
}
