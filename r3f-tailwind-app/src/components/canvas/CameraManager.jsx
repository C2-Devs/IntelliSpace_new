import { useCallback, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { CAMERA_MODES } from '../../constants';

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;
const PERSPECTIVE_DIRECTIONS = {
  '3d': new THREE.Vector3(1, 0.72, 1).normalize(),
  'apartment-plan': new THREE.Vector3(0, 1.55, 1).normalize(),
};

function getRoomSpan(room) {
  return Math.max(3, Number(room.width) || 6, Number(room.depth) || 5);
}

export default function CameraManager() {
  const viewMode = useStore((s) => s.viewMode);
  const room = useStore((s) => s.room);
  const cameraZoom = useStore((s) => s.cameraZoom);
  const setCameraZoom = useStore((s) => s.setCameraZoom);
  const { camera, size } = useThree();
  const controls = useThree((state) => state.controls);
  const target = useRef(new THREE.Vector3(0, 0.75, 0));
  const transition = useRef(false);
  const targetPosition = useRef(new THREE.Vector3());
  const fitZoom = useRef(100);

  const perspectiveDirection = PERSPECTIVE_DIRECTIONS[viewMode] || PERSPECTIVE_DIRECTIONS['3d'];

  const fitCamera = useCallback(() => {
    const span = getRoomSpan(room);
    const aspect = Math.max(0.5, size.width / Math.max(1, size.height));
    target.current.set(0, Math.min(Number(room.height) || 2.7, 3) * 0.35, 0);

    if (camera.isOrthographicCamera) {
      const verticalSpan = span / aspect;
      const frustumSpan = Math.max(span, verticalSpan) * 1.18;
      camera.left = -frustumSpan * aspect / 2;
      camera.right = frustumSpan * aspect / 2;
      camera.top = frustumSpan / 2;
      camera.bottom = -frustumSpan / 2;
      camera.zoom = 1;
      camera.position.set(0, Math.max(10, span * 2), 0.01);
      camera.lookAt(target.current);
      targetPosition.current.copy(camera.position);
    } else {
      const fovRadians = THREE.MathUtils.degToRad(camera.fov || 46);
      const halfVertical = fovRadians / 2;
      const distance = (span * 0.59) / Math.tan(halfVertical) * 1.18;
      targetPosition.current.copy(target.current).addScaledVector(perspectiveDirection, distance);
      transition.current = true;
    }
    camera.updateProjectionMatrix();
    fitZoom.current = 100;
    setCameraZoom(100);
    if (controls) {
      controls.target.copy(target.current);
      controls.update();
    }
  }, [camera, controls, room, setCameraZoom, size.height, size.width]);

  const applyZoom = useCallback((nextZoom) => {
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    const multiplier = zoom / fitZoom.current;
    if (camera.isOrthographicCamera) {
      camera.zoom = multiplier;
    } else {
      const baseDistance = camera.position.distanceTo(target.current);
      const nextDistance = baseDistance / (zoom / 100);
      camera.position.copy(target.current).addScaledVector(camera.position.clone().sub(target.current).normalize(), nextDistance);
    }
    camera.updateProjectionMatrix();
    controls?.update();
    setCameraZoom(zoom);
  }, [camera, controls, setCameraZoom]);

  useEffect(() => {
    fitCamera();
  }, [fitCamera, viewMode]);

  useEffect(() => {
    const onFit = () => fitCamera();
    const onZoom = (event) => applyZoom(cameraZoom + (event.detail?.direction || 0) * ZOOM_STEP);
    window.addEventListener('intelli:camera-fit', onFit);
    window.addEventListener('intelli:camera-zoom', onZoom);
    return () => {
      window.removeEventListener('intelli:camera-fit', onFit);
      window.removeEventListener('intelli:camera-zoom', onZoom);
    };
  }, [applyZoom, cameraZoom, fitCamera]);

  useFrame(() => {
    if (!transition.current) return;
    camera.position.lerp(targetPosition.current, 0.12);
    camera.lookAt(target.current);
    controls?.target.copy(target.current);
    controls?.update();
    if (camera.position.distanceTo(targetPosition.current) < 0.01) {
      camera.position.copy(targetPosition.current);
      transition.current = false;
    }
  });

  return null;
}
