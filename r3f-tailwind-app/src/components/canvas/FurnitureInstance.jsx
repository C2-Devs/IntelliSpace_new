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

export default function FurnitureInstance({ item }) {
  const definition = useMemo(
    () => getFurnitureById(item.catalogItemId ?? item.registryId),
    [item.catalogItemId, item.registryId],
  );

  if (!definition?.modelPath) return null;

  return <LoadedFurnitureInstance item={item} definition={definition} />;
}

function applyMaterialProfile(material, meshName = '') {
  if (!material || !material.isMaterial) return;

  const materialLabel = `${material.name || ''} ${meshName}`.toLowerCase();
  const isFabric = /fabric|cloth|textile|upholstery|cushion|velvet|leather|sofa|chair|curtain|carpet|rug/.test(materialLabel);
  const isWood = /wood|oak|walnut|ash|teak|timber|veneer|cabinet|desk|table|shelf/.test(materialLabel);
  const isMetal = /metal|steel|iron|chrome|brass|copper|aluminium|aluminum|handle|frame/.test(materialLabel);
  const isGlass = /glass|glazing|mirror|lens|transparent/.test(materialLabel);
  const isCeramic = /ceramic|porcelain|stone|marble|concrete|terracotta|tile|basin|toilet|bathtub/.test(materialLabel);

  if (isFabric) {
    material.roughness = Math.max(material.roughness ?? 0.8, 0.82);
    material.metalness = 0;
    material.envMapIntensity = Math.min(material.envMapIntensity ?? 0.2, 0.22);
  } else if (isWood) {
    material.roughness = Math.max(material.roughness ?? 0.58, 0.56);
    material.metalness = Math.min(material.metalness ?? 0, 0.04);
    material.envMapIntensity = Math.min(material.envMapIntensity ?? 0.3, 0.3);
  } else if (isMetal) {
    material.roughness = Math.max(material.roughness ?? 0.28, 0.24);
    material.metalness = Math.max(material.metalness ?? 0.5, 0.55);
    material.envMapIntensity = Math.min(material.envMapIntensity ?? 0.7, 0.72);
  } else if (isGlass) {
    material.roughness = Math.min(material.roughness ?? 0.12, 0.18);
    material.envMapIntensity = Math.min(material.envMapIntensity ?? 0.8, 0.85);
  } else if (isCeramic) {
    material.roughness = Math.max(material.roughness ?? 0.32, 0.3);
    material.metalness = Math.min(material.metalness ?? 0, 0.03);
    material.envMapIntensity = Math.min(material.envMapIntensity ?? 0.4, 0.42);
  }
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
    return { size, center };
  }, [scene]);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          child.material = child.material.clone();
          applyMaterialProfile(child.material, child.name);
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
      <primitive
        object={clonedScene}
        castShadow
        onUpdate={(object) => object.traverse((child) => {
          if (child.isMesh) {
            // Furniture casts onto the floor, but should not self-receive shadow-map samples.
            // Complex GLBs often contain near-coplanar parts that produce fragmented acne.
            child.castShadow = true;
            child.receiveShadow = false;
          }
        })}
      />

      {/* Keep the selection guide just outside the model so it cannot z-fight with furniture surfaces. */}
      {isSelected && (
        <lineSegments
          position={[modelBounds.center.x, modelBounds.center.y, modelBounds.center.z]}
          scale={[1.015, 1.015, 1.015]}
          raycast={() => null}
          renderOrder={10}
        >
          <edgesGeometry args={[new THREE.BoxGeometry(modelBounds.size.x, modelBounds.size.y, modelBounds.size.z)]} />
          <lineBasicMaterial color="#c7a66a" transparent opacity={0.82} depthTest={false} depthWrite={false} />
        </lineSegments>
      )}
    </group>
  );
}
