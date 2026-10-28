/**
 * SceneLighting — dynamic lighting system based on light preset.
 *
 * Renders ambient light, directional light with shadows, and
 * environment mapping based on the active preset.
 */
import React, { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import useStore from '../../store/useStore';
import { LIGHT_PRESETS } from '../../constants';

const EMPTY_FIXTURES = [];
const EMPTY_SETTINGS = {};

function FixtureObject({ fixture }) {
  const selectFixture = useStore((state) => state.selectLightingFixture);
  const selected = useStore((state) => state.selectedLightingFixtureId === fixture.id);
  const position = fixture.position || [0, 2.4, 0];
  const type = fixture.type || 'Pendant Light';
  const intensity = Number(fixture.intensity) || 0;
  const material = <meshStandardMaterial color={selected ? '#f4c46b' : '#b9b2a5'} metalness={0.55} roughness={0.28} />;
  return <group position={position} rotation={fixture.rotation || [0, 0, 0]} onPointerDown={(event) => { event.stopPropagation(); selectFixture?.(fixture.id); }}>
    <pointLight intensity={intensity} color={fixture.color || '#ffd6a3'} distance={6} decay={2} />
    {selected && <mesh><sphereGeometry args={[0.42, 16, 10]} /><meshBasicMaterial color="#f4c46b" transparent opacity={0.12} /></mesh>}
    {type.includes('Pendant') && <><mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.018, 0.018, 0.84, 8]} />{material}</mesh><mesh position={[0, -0.02, 0]}><coneGeometry args={[0.34, 0.22, 24, 1, true]} />{material}</mesh><mesh position={[0, -0.13, 0]}><sphereGeometry args={[0.08, 12, 8]} /><meshStandardMaterial color={fixture.color || '#ffd6a3'} emissive={fixture.color || '#ffd6a3'} emissiveIntensity={0.8} /></mesh></>}
    {type.includes('Recessed') && <><mesh><cylinderGeometry args={[0.18, 0.14, 0.08, 24]} />{material}</mesh><mesh position={[0, -0.05, 0]}><circleGeometry args={[0.1, 24]} /><meshStandardMaterial color={fixture.color || '#ffd6a3'} emissive={fixture.color || '#ffd6a3'} emissiveIntensity={0.7} /></mesh></>}
    {type.includes('Floor') && <><mesh position={[0, -1.05, 0]}><cylinderGeometry args={[0.3, 0.3, 0.06, 24]} />{material}</mesh><mesh position={[0, -0.5, 0]}><cylinderGeometry args={[0.035, 0.035, 1.05, 10]} />{material}</mesh><mesh position={[0, 0.08, 0]}><coneGeometry args={[0.28, 0.24, 24, 1, true]} />{material}</mesh></>}
    {type.includes('Wall') && <><mesh position={[0, 0, 0.12]}><boxGeometry args={[0.28, 0.38, 0.12]} />{material}</mesh><mesh position={[0, 0, 0.2]}><sphereGeometry args={[0.11, 16, 8]} /><meshStandardMaterial color={fixture.color || '#ffd6a3'} emissive={fixture.color || '#ffd6a3'} emissiveIntensity={0.8} /></mesh></>}
  </group>;
}

export default function SceneLighting() {
  const { gl } = useThree();
  const lightPreset = useStore((s) => s.lightPreset);
  const environmentSettings = useStore((s) => s.environmentSettings || EMPTY_SETTINGS);
  const room = useStore((s) => s.room);
  const windows = useStore((s) => s.windows);
  const lightingSettings = useStore((s) => s.lightingSettings || EMPTY_SETTINGS);
  const lightingFixtures = useStore((s) => s.lightingFixtures || EMPTY_FIXTURES);

  const config = useMemo(
    () => LIGHT_PRESETS[lightPreset] || LIGHT_PRESETS.midday,
    [lightPreset]
  );

  const warmLayer = config.directional.color;
  const decorativeIntensity = lightPreset === 'night' ? 0.2 : lightPreset === 'evening' || lightPreset === 'goldenHour' ? 0.42 : lightPreset === 'studio' ? 0.08 : 0.12;
  const roomWidth = room?.width || 8;
  const roomDepth = room?.depth || 6;
  const roomHeight = room?.height || 3;
  useEffect(() => { gl.toneMappingExposure = environmentSettings.exposure ?? 0.82; }, [gl, environmentSettings.exposure]);

  const sunPosition = useMemo(() => {
    const { azimuth = 218, elevation = 62 } = { ...config.directional, azimuth: environmentSettings.azimuth, elevation: environmentSettings.elevation };
    const azimuthRadians = (azimuth * Math.PI) / 180;
    const elevationRadians = (elevation * Math.PI) / 180;
    const radius = 12;
    const horizontal = Math.cos(elevationRadians) * radius;

    return [
      Math.sin(azimuthRadians) * horizontal,
      Math.sin(elevationRadians) * radius,
      Math.cos(azimuthRadians) * horizontal,
    ];
  }, [config, environmentSettings.azimuth, environmentSettings.elevation]);

  return (
    <>
      {/* Ambient fill light */}
      <ambientLight
        intensity={(environmentSettings.ambientIntensity ?? lightingSettings?.ambientIntensity ?? config.ambient.intensity) * 0.82}
        color={config.ambient.color}
      />

      {/* Primary directional light with shadows */}
      <directionalLight
        position={sunPosition}
        intensity={environmentSettings.sunlightIntensity ?? lightingSettings?.mainIntensity ?? config.directional.intensity}
        color={environmentSettings.sunlightColor ?? lightingSettings?.color ?? config.directional.color}
        castShadow={environmentSettings.shadows ?? lightingSettings?.shadows ?? true}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00018}
        shadow-normalBias={0.035}
        shadow-radius={4}
        shadow-camera-near={0.5}
        shadow-camera-far={32}
        shadow-camera-left={-roomWidth * 0.72}
        shadow-camera-right={roomWidth * 0.72}
        shadow-camera-top={roomDepth * 0.72}
        shadow-camera-bottom={-roomDepth * 0.72}
      />

      {/* Secondary fill light */}
      <directionalLight
        position={[-3, 4, -2]}
        intensity={config.ambient.intensity * 0.22}
        color={config.ambient.color}
      />

      {/* Hemisphere light for natural sky/ground color blending */}
      <hemisphereLight
        args={['#c8d8e8', '#2a2a2a', 0.15]}
      />

      {/* Architectural layer: ceiling wash and quiet perimeter illumination. */}
      <pointLight
        position={[0, roomHeight - 0.22, 0]}
        intensity={decorativeIntensity * 0.15}
        distance={roomWidth * 0.7}
        decay={2}
        color="#dde5ea"
      />

      {lightingFixtures.filter((fixture) => fixture.visible !== false).map((fixture) => <FixtureObject key={fixture.id} fixture={fixture} />)}

      {/* Window bounce layer keeps glazing connected to the active sun preset. */}
      {windows.slice(0, 4).map((window, index) => {
        const side = window.wall === 'left' ? [-roomWidth / 2 + 0.2, 0, 0] : window.wall === 'right' ? [roomWidth / 2 - 0.2, 0, 0] : [0, 0, window.wall === 'front' ? roomDepth / 2 - 0.2 : -roomDepth / 2 + 0.2];
        const y = window.sillHeight + window.height * 0.58;
        return (
          <pointLight
            key={`window-bounce-${index}`}
            position={[side[0], y, side[2]]}
            intensity={Math.min(window.width * window.height, 4) * (config.directional.intensity * 0.02)}
            distance={Math.max(roomWidth, roomDepth) * 0.9}
            decay={2}
            color={config.directional.color}
          />
        );
      })}

    </>
  );
}

