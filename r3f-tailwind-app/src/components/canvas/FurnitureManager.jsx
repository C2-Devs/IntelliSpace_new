/**
 * FurnitureManager — renders all furniture instances from the store.
 *
 * Maps over the furniture array and wraps each in a Suspense boundary
 * for lazy GLB loading.
 */
import React, { Suspense } from 'react';
import useStore from '../../store/useStore';
import FurnitureInstance from './FurnitureInstance';

function FurnitureFallback({ item }) {
  return (
    <mesh position={item.position} rotation={item.rotation} scale={item.scale}>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial color="#6366f1" wireframe opacity={0.5} transparent />
    </mesh>
  );
}

export default function FurnitureManager() {
  const furniture = useStore((s) => s.furniture);

  return (
    <group>
      {furniture.map((item) =>
        item.isVisible !== false ? (
          <Suspense key={item.id} fallback={<FurnitureFallback item={item} />}>
            <FurnitureInstance item={item} />
          </Suspense>
        ) : null
      )}
    </group>
  );
}
