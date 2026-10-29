/**
 * SceneControls — OrbitControls and TransformControls gizmo.
 *
 * Attaches a TransformControls gizmo to the selected furniture object,
 * supporting translate, rotate, and scale modes.
 * Disables orbit when the gizmo is being dragged.
 */
import React, { useRef, useEffect, useMemo } from 'react';
import { OrbitControls, TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { getFurnitureById } from '../../data/furnitureRegistry';
import { applySnapping, clampToRoomFootprint } from '../../utils/snapUtils';
import { getRoomBounds } from '../../utils/roomCoordinates';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

function clampScale(value) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number.isFinite(value) ? value : 1));
}

export default function SceneControls() {
  const orbitRef = useRef();
  const transformRef = useRef();
  const targetRef = useRef(new THREE.Object3D());
  const { scene } = useThree();

  const selectedIds = useStore((s) => s.selectedIds);
  const furniture = useStore((s) => s.furniture);
  const transformMode = useStore((s) => s.transformMode);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const gridSize = useStore((s) => s.gridSize);
  const rotationSnap = useStore((s) => s.rotationSnap);
  const updateFurniture = useStore((s) => s.updateFurniture);
  const updateFurnitureWithHistory = useStore((s) => s.updateFurnitureWithHistory);

  // The currently selected furniture item data
  const selectedItem = useMemo(
    () =>
      selectedIds.length === 1
        ? furniture.find((f) => f.id === selectedIds[0])
        : null,
    [selectedIds, furniture]
  );

  // Add the invisible target object to the scene once
  useEffect(() => {
    const obj = targetRef.current;
    obj.visible = false;
    scene.add(obj);
    return () => {
      scene.remove(obj);
    };
  }, [scene]);

  // Sync the target object's transform to match selected furniture
  useEffect(() => {
    if (!selectedItem || isDraggingRef.current || transformFrameRef.current !== null) return;
    const obj = targetRef.current;
    obj.position.set(...selectedItem.position);
    obj.rotation.set(...selectedItem.rotation);
    obj.scale.set(...selectedItem.scale);
  }, [selectedItem]);

  const transformFrameRef = useRef(null);
  const latestTransformRef = useRef(null);
  const selectedItemRef = useRef(selectedItem);
  const isDraggingRef = useRef(false);
  selectedItemRef.current = selectedItem;

  const readTargetTransform = () => ({
    position: [targetRef.current.position.x, targetRef.current.position.y, targetRef.current.position.z],
    rotation: [targetRef.current.rotation.x, targetRef.current.rotation.y, targetRef.current.rotation.z],
    scale: [targetRef.current.scale.x, targetRef.current.scale.y, targetRef.current.scale.z],
  });

  const flushTransform = () => {
    transformFrameRef.current = null;
    if (!selectedItem || selectedItem.isLocked || !latestTransformRef.current) return;
    updateFurniture(selectedItem.id, latestTransformRef.current);
  };

  const scheduleTransformUpdate = () => {
    latestTransformRef.current = readTargetTransform();
    if (transformFrameRef.current === null) {
      transformFrameRef.current = requestAnimationFrame(flushTransform);
    }
  };

  useEffect(() => () => {
    if (transformFrameRef.current !== null) cancelAnimationFrame(transformFrameRef.current);
  }, []);

  // Live-update store while gizmo is being dragged (with boundary clamping)
  const room = useStore((s) => s.room);
  const roomBounds = useMemo(() => getRoomBounds(room), [room]);
  const selectedDefinition = selectedItem
    ? getFurnitureById(selectedItem.catalogItemId ?? selectedItem.registryId)
    : null;

  const constrainTarget = (obj) => {
    const snapHeight = selectedDefinition?.snapHeight ?? 0;
    const halfExtent = selectedItem?.bounds?.halfExtent ?? [
      (selectedItem?.bounds?.width ?? 1) / 2,
      (selectedItem?.bounds?.height ?? 0) / 2,
      (selectedItem?.bounds?.depth ?? 1) / 2,
    ];
    if (transformMode === 'scale') {
      const uniformScale = clampScale((obj.scale.x + obj.scale.y + obj.scale.z) / 3);
      obj.scale.setScalar(uniformScale);
    }

    const position = applySnapping(
      [obj.position.x, obj.position.y, obj.position.z],
      {
        snapEnabled,
        gridSize,
        snapHeight,
        roomWidth: roomBounds.maxX - roomBounds.minX,
        roomDepth: roomBounds.maxZ - roomBounds.minZ,
      },
    );
    const boundedPosition = clampToRoomFootprint(
      position,
      roomBounds.maxX - roomBounds.minX,
      roomBounds.maxZ - roomBounds.minZ,
      [halfExtent[0] * Math.abs(obj.scale.x), 0, halfExtent[2] * Math.abs(obj.scale.z)],
    );
    obj.position.set(...boundedPosition);

    // Furniture spins on the floor around its Y axis only.
    obj.rotation.x = 0;
    obj.rotation.z = 0;
  };

  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    const onChange = () => {
      const currentItem = selectedItemRef.current;
      if (!currentItem || currentItem.isLocked) return;
      const obj = targetRef.current;
      constrainTarget(obj);
      scheduleTransformUpdate();
    };

    const onMouseUp = () => {
      const currentItem = selectedItemRef.current;
      if (!currentItem || currentItem.isLocked) return;
      const obj = targetRef.current;
      constrainTarget(targetRef.current);
      if (transformFrameRef.current !== null) {
        cancelAnimationFrame(transformFrameRef.current);
        transformFrameRef.current = null;
      }
      const finalTransform = readTargetTransform();
      latestTransformRef.current = finalTransform;
      updateFurnitureWithHistory(selectedItem.id, finalTransform);
    };

    controls.addEventListener('change', onChange);
    controls.addEventListener('mouseUp', onMouseUp);
    return () => {
      controls.removeEventListener('change', onChange);
      controls.removeEventListener('mouseUp', onMouseUp);
    };
  }, [selectedItem?.id, updateFurniture, updateFurnitureWithHistory, room, transformMode, snapEnabled, gridSize, selectedDefinition?.id]);

  // Compute snap values
  const translationSnap = snapEnabled ? gridSize : null;
  const rotSnap = snapEnabled ? rotationSnap : null;
  const scaleSnap = snapEnabled ? 0.1 : null;

  return (
    <>
      <OrbitControls
        ref={orbitRef}
        makeDefault
        regress
        maxPolarAngle={Math.PI - 0.05}
        minDistance={1}
        maxDistance={40}
        enableDamping
        dampingFactor={0.08}
        target={[0, 0.75, 0]}
      />

      {selectedItem && (
        <TransformControls
          ref={transformRef}
          object={targetRef.current}
          mode={transformMode}
          translationSnap={translationSnap}
          rotationSnap={rotSnap}
          scaleSnap={scaleSnap}
          onDraggingChange={(event) => {
            isDraggingRef.current = event.value;
            if (!event.value && transformFrameRef.current === null && selectedItemRef.current) {
              const current = selectedItemRef.current;
              targetRef.current.position.set(...current.position);
              targetRef.current.rotation.set(...current.rotation);
              targetRef.current.scale.set(...current.scale);
            }
            if (orbitRef.current) orbitRef.current.enabled = !event.value;
          }}
          size={0.7}
        />
      )}
    </>
  );
}
