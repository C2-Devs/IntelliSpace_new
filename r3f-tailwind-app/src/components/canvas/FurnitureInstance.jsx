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
      if (child.isMesh && child.material) child.material = child.material.clone();
    });
    return clone;
  }, [scene]);

  const materialTexture = useMemo(() => {
    if (!item.materialTexture || item.materialTexture === 'Solid') return null;
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d');
    const base = item.materialColor || '#b98b62';
    context.fillStyle = base;
    context.fillRect(0, 0, 128, 128);
    context.globalAlpha = 0.24;
    if (item.materialTexture === 'Wood grain') {
      for (let y = -128; y < 256; y += 9) { context.strokeStyle = y % 18 ? '#4c2d1c' : '#f2c58f'; context.beginPath(); context.moveTo(0, y); context.bezierCurveTo(34, y + 8, 86, y - 7, 128, y + 3); context.stroke(); }
    } else if (item.materialTexture === 'Linen') {
      context.strokeStyle = '#fff'; for (let i = 0; i < 128; i += 4) { context.beginPath(); context.moveTo(i, 0); context.lineTo(i, 128); context.moveTo(0, i); context.lineTo(128, i); context.stroke(); }
    } else if (item.materialTexture === 'Velvet') {
      for (let i = -128; i < 256; i += 12) { context.strokeStyle = '#fff'; context.lineWidth = 3; context.beginPath(); context.moveTo(i, 0); context.lineTo(i + 128, 128); context.stroke(); }
    } else {
      for (let i = 0; i < 700; i += 1) { context.fillStyle = i % 2 ? '#fff' : '#211b17'; context.fillRect(Math.random() * 128, Math.random() * 128, 1, 1); }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [item.materialColor, item.materialTexture]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      child.material.color.set(item.materialColor || '#ffffff');
      child.material.map = materialTexture;
      child.material.needsUpdate = true;
    });
  }, [clonedScene, item.materialColor, materialTexture]);

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
      <primitive object={clonedScene} />

      {/* Selection outline box uses measured native model bounds. */}
      {isSelected && (
          <mesh
            position={[modelBounds.center.x, modelBounds.center.y, modelBounds.center.z]}
            raycast={() => null}
          >
          <boxGeometry args={[modelBounds.size.x, modelBounds.size.y, modelBounds.size.z]} />
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
