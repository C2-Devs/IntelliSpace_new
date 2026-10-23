/**
 * SceneLighting — dynamic lighting system based on light preset.
 *
 * Renders ambient light, directional light with shadows, and
 * environment mapping based on the active preset.
 */
import React, { useEffect, useMemo, useRef } from 'react';
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
    {selected && <mesh raycast={() => null}><sphereGeometry args={[0.42, 16, 10]} /><meshBasicMaterial color="#f4c46b" transparent opacity={0.12} /></mesh>}
    {type.includes('Pendant') && <><mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.018, 0.018, 0.84, 8]} />{material}</mesh><mesh position={[0, -0.02, 0]}><coneGeometry args={[0.34, 0.22, 24, 1, true]} />{material}</mesh><mesh position={[0, -0.13, 0]}><sphereGeometry args={[0.08, 12, 8]} /><meshStandardMaterial color={fixture.color || '#ffd6a3'} emissive={fixture.color || '#ffd6a3'} emissiveIntensity={0.8} /></mesh></>}
    {type.includes('Recessed') && <><mesh><cylinderGeometry args={[0.18, 0.14, 0.08, 24]} />{material}</mesh><mesh position={[0, -0.05, 0]}><circleGeometry args={[0.1, 24]} /><meshStandardMaterial color={fixture.color || '#ffd6a3'} emissive={fixture.color || '#ffd6a3'} emissiveIntensity={0.7} /></mesh></>}
    {type.includes('Floor') && <><mesh position={[0, -1.05, 0]}><cylinderGeometry args={[0.3, 0.3, 0.06, 24]} />{material}</mesh><mesh position={[0, -0.5, 0]}><cylinderGeometry args={[0.035, 0.035, 1.05, 10]} />{material}</mesh><mesh position={[0, 0.08, 0]}><coneGeometry args={[0.28, 0.24, 24, 1, true]} />{material}</mesh></>}
    {type.includes('Wall') && <><mesh position={[0, 0, 0.12]}><boxGeometry args={[0.28, 0.38, 0.12]} />{material}</mesh><mesh position={[0, 0, 0.2]}><sphereGeometry args={[0.11, 16, 8]} /><meshStandardMaterial color={fixture.color || '#ffd6a3'} emissive={fixture.color || '#ffd6a3'} emissiveIntensity={0.8} /></mesh></>}
    {!type.includes('Pendant') && !type.includes('Recessed') && !type.includes('Floor') && !type.includes('Wall') && <><mesh><cylinderGeometry args={[0.2, 0.2, 0.12, 20]} />{material}</mesh><mesh position={[0, -0.08, 0]}><sphereGeometry args={[0.12, 12, 8]} /><meshStandardMaterial color={fixture.color || '#ffd6a3'} emissive={fixture.color || '#ffd6a3'} emissiveIntensity={0.8} /></mesh></>}
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
  const sunRef = useRef();

  const config = useMemo(
    () => LIGHT_PRESETS[lightPreset] || LIGHT_PRESETS.midday,
    [lightPreset]
  );
  const isCustom = lightPreset === 'custom';
  const ambientIntensity = isCustom ? (lightingSettings.ambientIntensity ?? config.ambient.intensity) : (environmentSettings.ambientIntensity ?? config.ambient.intensity);
  const mainIntensity = isCustom ? (lightingSettings.mainIntensity ?? config.directional.intensity) : (environmentSettings.sunlightIntensity ?? config.directional.intensity);
  const lightColor = isCustom ? (lightingSettings.color ?? config.directional.color) : (environmentSettings.sunlightColor ?? config.directional.color);
  const shadows = isCustom ? (lightingSettings.shadows ?? false) : (environmentSettings.shadows ?? true);

  const warmLayer = lightColor;
  const decorativeIntensity = lightPreset === 'night' ? 0.45 : lightPreset === 'evening' || lightPreset === 'goldenHour' ? 0.72 : 0.26;
  const roomWidth = room?.width || 8;
  const roomDepth = room?.depth || 6;
  const roomHeight = room?.height || 3;
  useEffect(() => {
    gl.toneMappingExposure = environmentSettings.exposure ?? 1.08;
  }, [gl, environmentSettings.exposure]);

  useEffect(() => {
    const light = sunRef.current;
    if (!light) return;
    const extent = Math.max(roomWidth, roomDepth) * 0.72;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.camera.left = -extent;
    light.shadow.camera.right = extent;
    light.shadow.camera.top = extent;
    light.shadow.camera.bottom = -extent;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = Math.max(24, roomHeight + extent * 2.2);
    light.shadow.bias = -0.00035;
    light.shadow.normalBias = 0.025;
    light.shadow.camera.updateProjectionMatrix();
  }, [gl, roomWidth, roomDepth, roomHeight]);

  const sunPosition = useMemo(() => {
    const { azimuth = 218, elevation = 62 } = { ...config.directional, azimuth: isCustom ? environmentSettings.azimuth : config.directional.azimuth, elevation: isCustom ? environmentSettings.elevation : config.directional.elevation };
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
        intensity={ambientIntensity * 0.82}
        color={isCustom ? (lightingSettings.color ?? config.ambient.color) : config.ambient.color}
      />

      {/* Primary directional light with shadows */}
      <directionalLight
        ref={sunRef}
        position={sunPosition}
        intensity={mainIntensity}
        color={lightColor}
        castShadow={shadows}
      />

      {/* Secondary fill light */}
      <directionalLight
        position={[-3, 4, -2]}
        intensity={config.ambient.intensity * 0.22}
        color={config.ambient.color}
      />

      {/* Hemisphere light for natural sky/ground color blending */}
      <hemisphereLight
        args={['#d9e4ec', '#55463a', 0.32]}
      />

      {/* Architectural layer: ceiling wash and quiet perimeter illumination. */}
      <pointLight
        position={[0, roomHeight - 0.22, 0]}
        intensity={decorativeIntensity * 0.9}
        distance={roomWidth * 1.25}
        decay={2}
        color={warmLayer}
      />
      <pointLight
        position={[-roomWidth * 0.34, roomHeight - 0.28, -roomDepth * 0.28]}
        intensity={decorativeIntensity * 0.55}
        distance={roomWidth * 0.75}
        decay={2}
        color="#fff1d5"
      />
      <pointLight
        position={[roomWidth * 0.3, roomHeight - 0.28, roomDepth * 0.2]}
        intensity={decorativeIntensity * 0.45}
        distance={roomWidth * 0.72}
        decay={2}
        color="#f6d4a8"
      />

      {/* Decorative layer: small warm pools suggest recessed fixtures without clutter. */}
      <pointLight
        position={[0, roomHeight * 0.78, -roomDepth * 0.42]}
        intensity={decorativeIntensity * 0.35}
        distance={roomWidth * 0.7}
        decay={2}
        color="#f3c18b"
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
            intensity={Math.min(window.width * window.height, 4) * (config.directional.intensity * 0.045)}
            distance={Math.max(roomWidth, roomDepth) * 0.9}
            decay={2}
            color={config.directional.color}
          />
        );
      })}

    </>
  );
}
