/**
 * FurnitureInstance — a single placed furniture object.
 *
 * Loads a GLB model, supports selection and hover highlighting.
 * Position/rotation/scale are fully controlled by the store (set via gizmo).
 */
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { getFurnitureById } from '../../data/furnitureRegistry';
import {
  isApprovedHuggingFaceModelUrl,
  loadCatalog,
} from '../../utils/catalogApi';

export default function FurnitureInstance({ item }) {
  const registryId = item.catalogItemId ?? item.registryId;

  const definition = useMemo(
    () => getFurnitureById(registryId) ?? (
      item.custom || item.workspaceId
        ? {
            id: registryId,
            name: item.name ?? 'Custom furniture',
            category: item.category ?? 'decor',
            modelPath: item.modelPath ?? null,
            defaultScale: item.defaultScale ?? [1, 1, 1],
            defaultRotation: item.defaultRotation ?? [0, 0, 0],
            snapHeight: 0,
            dimensions: item.dimensions ?? {
              width: 1,
              height: 1,
              depth: 1,
            },
          }
        : null
    ),
    [
      registryId,
      item.custom,
      item.workspaceId,
      item.name,
      item.category,
      item.modelPath,
      item.defaultScale,
      item.defaultRotation,
      item.dimensions,
    ],
  );

  const initialModelPath = item.custom || item.workspaceId
    ? item.modelPath ?? definition?.modelPath ?? null
    : definition?.modelPath ?? item.modelPath ?? null;

  const [resolution, setResolution] = useState(() => ({
    registryId,
    status: initialModelPath ? 'ready' : 'loading',
    modelPath: initialModelPath,
  }));

  useEffect(() => {
    let cancelled = false;

    const immediatePath = item.custom || item.workspaceId
      ? item.modelPath ?? definition?.modelPath ?? null
      : definition?.modelPath ?? item.modelPath ?? null;

    if (immediatePath) {
      setResolution({ registryId, status: 'ready', modelPath: immediatePath });
      return () => { cancelled = true; };
    }

    // Custom models need their workspace-provided URL; do not query the
    // built-in catalog repeatedly for them.
    if (item.custom || item.workspaceId) {
      setResolution({ registryId, status: 'ready', modelPath: null });
      return () => { cancelled = true; };
    }

    setResolution({ registryId, status: 'loading', modelPath: null });

    async function resolveModelPath() {
      try {
        const items = await loadCatalog();
        const entry = items.find((catalogItem) => catalogItem.slug === registryId);
        const remotePath = entry?.modelPath;
        const modelPath = isApprovedHuggingFaceModelUrl(remotePath)
          ? remotePath
          : null;

        if (!cancelled) {
          setResolution({ registryId, status: 'ready', modelPath });
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[IntelliSpace] Catalog model lookup failed:', error);
        }
        if (!cancelled) {
          setResolution({ registryId, status: 'ready', modelPath: null });
        }
      }
    }

    resolveModelPath();
    return () => { cancelled = true; };
  }, [
    registryId,
    definition?.modelPath,
    item.custom,
    item.workspaceId,
    item.backendCatalogItemId,
    item.modelPath,
  ]);

  // Render immediately whenever a usable local or signed URL exists.
  if (
    !definition ||
    resolution.registryId !== registryId ||
    resolution.status !== 'ready' ||
    !resolution.modelPath
  ) {
    return null;
  }

  const resolvedDefinition = {
    ...definition,
    modelPath: resolution.modelPath,
  };

  return <LoadedFurnitureInstance item={item} definition={resolvedDefinition} />;
}

function LoadedFurnitureInstance({ item, definition }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  const selectedIds = useStore((s) => s.selectedIds);
  const selectFurniture = useStore((s) => s.selectFurniture);

  const isSelected = selectedIds.includes(item.id);

  const { scene } = useGLTF(definition.modelPath);
  const modelBounds = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return { size, center, min: box.min.clone() };
  }, [scene]);

  const isUploadedCustom = Boolean(item.workspaceId && item.backendCatalogItemId);

  const customTargetSize = ({
    'living-room': 2.0,
    bedroom: 2.0,
    office: 1.5,
    kitchen: 1.4,
    bathroom: 1.0,
    plants: 1.4,
    chairs: 1.0,
    tables: 1.4,
    storage: 1.6,
    lighting: 1.5,
    decor: 1.0,
  })[item.category] || 1.3;

  const longestSide = Math.max(
    modelBounds.size.x,
    modelBounds.size.y,
    modelBounds.size.z,
  );

  const normalizationScale =
    isUploadedCustom && longestSide > 0.000001
      ? customTargetSize / longestSide
      : 1;

  const normalizationPosition = isUploadedCustom
    ? [
        -modelBounds.center.x * normalizationScale,
        -modelBounds.min.y * normalizationScale,
        -modelBounds.center.z * normalizationScale,
      ]
    : [0, 0, 0];

  const renderBounds = useMemo(() => {
    if (isUploadedCustom === false) return modelBounds;

    return {
      size: modelBounds.size.clone().multiplyScalar(normalizationScale),
      center: new THREE.Vector3(
        0,
        modelBounds.size.y * normalizationScale / 2,
        0,
      ),
    };
  }, [isUploadedCustom, modelBounds, normalizationScale]);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          child.material = child.material.clone();
        }
      }
    });
    return clone;
  }, [scene]);

  // Highlight on hover/select
  useEffect(() => {
    if (!clonedScene) return;
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        if (item.isColliding) {
          child.material.emissive = new THREE.Color('#b96b55');
          child.material.emissiveIntensity = 0.42;
        } else if (isSelected) {
          child.material.emissive = new THREE.Color('#c7a66a');
          child.material.emissiveIntensity = 0.1;
        } else if (hovered) {
          child.material.emissive = new THREE.Color('#d0c5ad');
          child.material.emissiveIntensity = 0.06;
        } else {
          child.material.emissive = new THREE.Color('#000000');
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }, [clonedScene, isSelected, hovered, item.isColliding]);

  const { gl } = useThree();

  useEffect(() => () => {
    if (gl.domElement.style.cursor === 'pointer') gl.domElement.style.cursor = 'auto';
  }, [gl]);

  const handlePointerDown = (e) => {
    if (item.isLocked) return;
    e.stopPropagation();
    selectFurniture(item.id, e.shiftKey);
  };

  return (
    <group
      ref={ref}
      userData={{ furnitureId: item.id, collisionProxy: true, modelBounds: { size: modelBounds.size.toArray(), center: modelBounds.center.toArray() } }}
      position={item.position}
      rotation={item.rotation}
      scale={item.scale}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        if (item.isLocked) e.stopPropagation();
        e.stopPropagation();
        setHovered(true);
        gl.domElement.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        gl.domElement.style.cursor = 'auto';
      }}
    >
      <group position={normalizationPosition} scale={normalizationScale}>
        <primitive object={clonedScene} />
      </group>

      {/* Selection outline box uses measured native model bounds. */}
      {isSelected && (
          <mesh
            position={[renderBounds.center.x, renderBounds.center.y, renderBounds.center.z]}
            raycast={() => null}
          >
          <boxGeometry args={[renderBounds.size.x, renderBounds.size.y, renderBounds.size.z]} />
          <meshBasicMaterial
            color="#c7a66a"
            wireframe
            transparent
            opacity={0.16}
          />
        </mesh>
      )}
    </group>
  );
}
