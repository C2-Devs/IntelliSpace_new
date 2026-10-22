import { useEffect, useState } from 'react';
import REGISTRY from '../data/furnitureRegistry';
import { loadCatalog } from '../utils/catalogApi';

const LOCAL_ITEMS_BY_ID = new Map(REGISTRY.map((item) => [item.id, item]));

export default function useCatalog() {
  const [catalog, setCatalog] = useState({
    items: REGISTRY,
    status: 'loading',
  });

  useEffect(() => {
    let active = true;

    loadCatalog()
      .then((serverItems) => {
        const items = serverItems
          .map((serverItem) => {
            const localItem = LOCAL_ITEMS_BY_ID.get(serverItem.slug);
            if (!localItem) return null;

            // Local model paths and IDs remain authoritative for rendering.
            return {
              ...localItem,
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

        if (active) {
          setCatalog(
            items.length
              ? { items, status: 'live' }
              : { items: REGISTRY, status: 'fallback' },
          );
        }
      })
      .catch(() => {
        if (active) setCatalog({ items: REGISTRY, status: 'fallback' });
      });

    return () => {
      active = false;
    };
  }, []);

  return catalog;
}
