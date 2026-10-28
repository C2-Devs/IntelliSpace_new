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
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          if (!child.userData.origColor) {
            child.userData.origColor = child.material.color ? child.material.color.clone() : new THREE.Color('#ffffff');
            child.userData.origMap = child.material.map || null;
          }
        }
      }
    });
    return clone;
  }, [scene]);


  const materialTexture = useMemo(() => {
    if (!item.materialTexture || item.materialTexture === 'Solid') return null;
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const base = item.materialColor || '#b98b62';
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 128, 128);
    ctx.globalAlpha = 0.24;
    if (item.materialTexture === 'Wood grain') {
      for (let y = -128; y < 256; y += 9) {
        ctx.strokeStyle = y % 18 ? '#4c2d1c' : '#f2c58f';
        ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(34, y + 8, 86, y - 7, 128, y + 3); ctx.stroke();
      }
    } else if (item.materialTexture === 'Linen') {
      ctx.strokeStyle = '#fff';
      for (let i = 0; i < 128; i += 4) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke(); }
    } else if (item.materialTexture === 'Velvet') {
      for (let i = -128; i < 256; i += 12) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128); ctx.stroke(); }
    } else {
      for (let i = 0; i < 700; i += 1) { ctx.fillStyle = i % 2 ? '#fff' : '#211b17'; ctx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1); }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [item.materialColor, item.materialTexture]);

  useEffect(() => {
    if (!clonedScene) return;
    const isCustom = Boolean(item.hasCustomMaterial && (item.materialColor || item.materialTexture));

    clonedScene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (isCustom) {
        if (item.materialColor) {
          child.material.color.set(item.materialColor);
        }
        if (materialTexture) {
          child.material.map = materialTexture;
        }
      } else {
        if (child.userData.origColor) {
          child.material.color.copy(child.userData.origColor);
        }
        child.material.map = child.userData.origMap || null;
      }
      child.material.needsUpdate = true;
    });
  }, [clonedScene, item.hasCustomMaterial, item.materialColor, item.materialTexture, materialTexture]);

  // Highlight on hover/select
  useEffect(() => {
    if (!clonedScene) return;
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        if (item.isColliding && isSelected) {
          child.material.emissive = new THREE.Color('#ef4444');
          child.material.emissiveIntensity = 0.15;
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
