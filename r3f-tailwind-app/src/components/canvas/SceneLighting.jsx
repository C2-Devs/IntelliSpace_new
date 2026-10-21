/**
 * SceneLighting — dynamic lighting system based on light preset.
 *
 * Renders ambient light, directional light with shadows, and
 * environment mapping based on the active preset.
 */
import React, { useMemo } from 'react';
import useStore from '../../store/useStore';
import { LIGHT_PRESETS } from '../../constants';

const EMPTY_FIXTURES = [];
const EMPTY_SETTINGS = {};

export default function SceneLighting() {
  const lightPreset = useStore((s) => s.lightPreset);
  const room = useStore((s) => s.room);
  const windows = useStore((s) => s.windows);
  const lightingSettings = useStore((s) => s.lightingSettings || EMPTY_SETTINGS);
  const lightingFixtures = useStore((s) => s.lightingFixtures || EMPTY_FIXTURES);

  const config = useMemo(
    () => LIGHT_PRESETS[lightPreset] || LIGHT_PRESETS.midday,
    [lightPreset]
  );

  const warmLayer = config.directional.color;
  const decorativeIntensity = lightPreset === 'night' ? 0.45 : lightPreset === 'evening' || lightPreset === 'goldenHour' ? 0.72 : 0.26;
  const roomWidth = room?.width || 8;
  const roomDepth = room?.depth || 6;
  const roomHeight = room?.height || 3;

  const sunPosition = useMemo(() => {
    const { azimuth = 218, elevation = 62 } = config.directional;
    const azimuthRadians = (azimuth * Math.PI) / 180;
    const elevationRadians = (elevation * Math.PI) / 180;
    const radius = 12;
    const horizontal = Math.cos(elevationRadians) * radius;

    return [
      Math.sin(azimuthRadians) * horizontal,
      Math.sin(elevationRadians) * radius,
      Math.cos(azimuthRadians) * horizontal,
    ];
  }, [config]);

  return (
    <>
      {/* Ambient fill light */}
      <ambientLight
        intensity={(lightingSettings?.ambientIntensity ?? config.ambient.intensity) * 0.82}
        color={config.ambient.color}
      />

      {/* Primary directional light with shadows */}
      <directionalLight
        position={sunPosition}
        intensity={lightingSettings?.mainIntensity ?? config.directional.intensity}
        color={lightingSettings?.color ?? config.directional.color}
        castShadow={lightingSettings?.shadows ?? false}
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

      {lightingFixtures.filter((fixture) => fixture.visible !== false).map((fixture) => <React.Fragment key={fixture.id}><pointLight position={fixture.position} intensity={fixture.intensity} color={fixture.color} distance={6} decay={2} /><mesh position={fixture.position}><sphereGeometry args={[0.09, 12, 8]} /><meshStandardMaterial color={fixture.color} emissive={fixture.color} emissiveIntensity={1.8} /></mesh></React.Fragment>)}

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
