/**
 * SceneCanvas — the main R3F Canvas wrapper.
 *
 * Brings together all 3D scene elements: room, furniture, lighting,
 * controls, grid, measurements, and camera management.
 */
import React, { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Environment, AdaptiveDpr } from '@react-three/drei';
import Room from './Room';
import FurnitureManager from './FurnitureManager';
import InteriorStructures from './InteriorStructures';
import CollisionAdvisoryEngine from './CollisionAdvisoryEngine';
import SceneControls from './SceneControls';
import SceneLighting from './SceneLighting';
import CameraManager from './CameraManager';
import Grid from './Grid';
import MeasurementOverlay from './MeasurementOverlay';
import useStore from '../../store/useStore';

function SceneFallback() { return null; }
function EnvironmentBackdrop() { const background = useStore((s) => s.environmentSettings?.background || '#121313'); return <><color attach="background" args={[background]} /><fog attach="fog" args={[background, 18, 42]} /></>; }
function RoomFallback() { return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><planeGeometry args={[12, 12]} /><meshStandardMaterial color="#24282c" /></mesh>; }

class SceneErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { if (import.meta.env.DEV) console.warn('[v0] Scene layer failed; preserving editor viewport.', error); }
  render() { return this.state.hasError ? this.props.fallback ?? <SceneFallback /> : this.props.children; }
}

function SceneLayer({ children, fallback = null }) {
  return <SceneErrorBoundary fallback={fallback}>{children}</SceneErrorBoundary>;
}

/** Click on empty space to deselect */
function DeselectPlane() {
  const clearSelection = useStore((s) => s.clearSelection);
  const room = useStore((s) => s.room);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      onPointerDown={(e) => {
        // Only deselect if clicked directly on the floor
        if (e.object) {
          clearSelection();
        }
      }}
      visible={false}
    >
      <planeGeometry args={[room.width * 2, room.depth * 2]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export default function SceneCanvas() {
  return (
    <Canvas
      camera={{
        position: [8.8, 6.6, 8.8],
        fov: 46,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.92,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      dpr={[1, 1.25]}
      performance={{ min: 0.6, max: 1, debounce: 200 }}
      onCreated={({ gl }) => {
        gl.setClearColor('#121313', 1);
      }}
      onPointerMissed={() => useStore.getState().clearSelection()}
      style={{ background: 'transparent' }}
    >
      <AdaptiveDpr />
      <SceneErrorBoundary>
        <Suspense fallback={<SceneFallback />}>
        <EnvironmentBackdrop />
        <Environment preset="apartment" background={false} environmentIntensity={0.22} />
        <SceneLayer><SceneLighting /></SceneLayer>
        <SceneLayer fallback={<RoomFallback />}><Room /></SceneLayer>
        <SceneLayer><FurnitureManager /></SceneLayer>
        <SceneLayer><InteriorStructures /></SceneLayer>
        <SceneLayer><CollisionAdvisoryEngine /></SceneLayer>
        <SceneLayer><Grid /></SceneLayer>
        <SceneLayer><MeasurementOverlay /></SceneLayer>
        <SceneLayer><DeselectPlane /></SceneLayer>

        {/* Directional lighting and room materials provide the grounding. */}
        </Suspense>
      </SceneErrorBoundary>

      <SceneControls />
      <CameraManager />
    </Canvas>
  );
}
