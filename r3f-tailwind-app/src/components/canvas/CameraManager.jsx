import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { CAMERA_MODES } from '../../constants';

export default function CameraManager() {
  const viewMode = useStore((s) => s.viewMode);
  const room = useStore((s) => s.room);
  const { camera } = useThree();
  const isTransitioning = useRef(false);
  const targetPosition = useRef(new THREE.Vector3());

  useEffect(() => {
    const preset = CAMERA_MODES[viewMode] || CAMERA_MODES['3d'];
    targetPosition.current.set(...preset.position);
    isTransitioning.current = true;
    if (camera.isPerspectiveCamera) {
      camera.fov = preset.fov || 46;
    } else if (camera.isOrthographicCamera) {
      const span = Math.max(Number(room.width) || 6, Number(room.depth) || 5) + 2;
      camera.left = -span / 2;
      camera.right = span / 2;
      camera.top = span / 2;
      camera.bottom = -span / 2;
      camera.zoom = Math.min(1.8, 12 / span);
    }
    camera.updateProjectionMatrix();
  }, [viewMode, camera, room.width, room.depth]);

  useEffect(() => {
    const preset = CAMERA_MODES[viewMode] || CAMERA_MODES['3d'];
    camera.position.set(...preset.position);
    camera.lookAt(...(preset.target || [0, 0.75, 0]));
  }, [camera]);

  useFrame(() => {
    if (!isTransitioning.current) return;
    camera.position.lerp(targetPosition.current, 0.08);
    if (camera.position.distanceTo(targetPosition.current) < 0.01) {
      camera.position.copy(targetPosition.current);
      isTransitioning.current = false;
    }
    camera.lookAt(...(CAMERA_MODES[viewMode]?.target || [0, 0.75, 0]));
  });

  return null;
}
