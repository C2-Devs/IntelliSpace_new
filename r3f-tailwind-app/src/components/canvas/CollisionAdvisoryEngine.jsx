import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { boxesIntersect } from '../../utils/collisionUtils';

const EPSILON = 0.0001;

export default function CollisionAdvisoryEngine() {
  const { scene } = useThree();
  const setCollisionStates = useStore((state) => state.setCollisionStates);
  const previousSignature = useRef('');
  const boxes = useRef(new Map());
  const dirty = useRef(true);
  const lastScan = useRef(0);
  const overlapBox = useRef(new THREE.Box3());
  const overlapSize = useRef(new THREE.Vector3());

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state, previousState) => {
      if (state.furniture !== previousState.furniture) {
        dirty.current = true;
      }
    });

    return () => {
      unsubscribe();
      setCollisionStates([]);
    };
  }, [setCollisionStates]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    const timeSinceLastScan = now - lastScan.current;

    // Limit collision scans to 12 per second during active changes.
    // When idle, scan once per second to catch models that finish loading.
    if (!dirty.current && timeSinceLastScan < 1) return;
    if (timeSinceLastScan < 1 / 12) return;

    lastScan.current = now;
    dirty.current = false;
    const placedObjects = [];
    const activeIds = new Set();
    scene.traverse((object) => {
      if (
        !object.isGroup ||
        !object.userData?.furnitureId ||
        !object.visible ||
        object.userData?.collisionProxy === false ||
        object.userData?.selectionOutline
      ) return;
      const id = object.userData.furnitureId;
      let box = boxes.current.get(id);

      if (!box) {
        box = new THREE.Box3();
        boxes.current.set(id, box);
      }

      box.setFromObject(object);
      if (box.isEmpty()) return;

      activeIds.add(id);
      placedObjects.push({ id, box });
    });

    for (const id of boxes.current.keys()) {
      if (!activeIds.has(id)) boxes.current.delete(id);
    }

    const collisionIds = new Set();
    for (let index = 0; index < placedObjects.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < placedObjects.length; otherIndex += 1) {
        const current = placedObjects[index];
        const other = placedObjects[otherIndex];
        if (!boxesIntersect(current.box, other.box)) continue;
        overlapBox.current.copy(current.box).intersect(other.box);
        if (
          overlapBox.current.getSize(overlapSize.current).length() > EPSILON
        ) {
          collisionIds.add(current.id);
          collisionIds.add(other.id);
        }
      }
    }

    if (placedObjects.length < 2 && previousSignature.current) {
      previousSignature.current = '';
      setCollisionStates([]);
      return;
    }

    const signature = [...collisionIds].sort().join('|');
    if (signature !== previousSignature.current) {
      previousSignature.current = signature;
      setCollisionStates(collisionIds);
    }
  });

  return null;
}

export function getCollisionBounds(object) {
  return new THREE.Box3().setFromObject(object);
}

export function createCollisionBox(position, size) {
  const halfSize = new THREE.Vector3(size[0] / 2, size[1] / 2, size[2] / 2);
  const center = new THREE.Vector3(...position);
  return new THREE.Box3(center.clone().sub(halfSize), center.clone().add(halfSize));
}

export function collisionBoxesOverlap(first, second) {
  return boxesIntersect(first, second);
}

export function collisionBoundsEqual(first, second) {
  return first.min.distanceToSquared(second.min) < EPSILON && first.max.distanceToSquared(second.max) < EPSILON;
}

