/**
 * Room — procedural room geometry (walls, floor, ceiling, windows, doors).
 *
 * Generates room geometry from template data. The room is centered at origin.
 * Walls have cutouts indicated by slightly different colored panels.
 */
import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { FLOORING_MATERIAL_BY_ID } from '../../data/flooringCatalog';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { FLOORING_MATERIALS, LIGHT_PRESETS, WALL_MATERIALS } from '../../constants';

function createFloorTexture(pattern, baseColor, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d');
  context.fillStyle = baseColor;
  context.fillRect(0, 0, 512, 512);
  const tile = Math.max(24, 112 / Math.max(0.5, scale));
  context.strokeStyle = 'rgba(42, 28, 18, 0.22)';
  context.lineWidth = Math.max(2, tile * 0.035);
  const drawBoard = (x, y, width, height) => { context.strokeRect(x, y, width, height); };
  if (pattern === 'Herringbone' || pattern === 'Chevron') {
    for (let y = -tile * 2; y < 512 + tile * 2; y += tile * 2) for (let x = -tile * 2; x < 512 + tile * 2; x += tile * 2) {
      context.save(); context.translate(x, y); context.rotate(pattern === 'Chevron' ? Math.PI / 4 : Math.PI / 4); drawBoard(0, 0, tile * 1.8, tile * 0.72); context.restore();
    }
  } else if (pattern === 'Hexagon') {
    const radius = tile * 0.56;
    for (let row = -2; row < 12; row += 1) for (let col = -2; col < 12; col += 1) { const x = col * radius * 1.72 + (row % 2) * radius * 0.86; const y = row * radius * 1.5; context.beginPath(); for (let i = 0; i < 6; i++) { const angle = Math.PI / 3 * i; context.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle)); } context.closePath(); context.stroke(); }
  } else {
    const gap = pattern === 'Large Format' ? tile * 1.55 : pattern === 'Grid' || pattern === 'Stack Bond' ? tile : tile * 0.75;
    for (let y = -gap; y < 512 + gap; y += gap) for (let x = -gap; x < 512 + gap; x += gap) { const offset = pattern === 'Running Bond' || pattern === 'Diagonal' ? (Math.floor(y / gap) % 2) * gap * 0.5 : 0; drawBoard(x + offset, y, gap * 0.98, gap * 0.98); }
  }
  const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(2, 2); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

/** Create a wall mesh. */
function Wall({ position, size, color, rotation = [0, 0, 0], material = {} }) {
  return (
    <mesh
      position={position}
      rotation={rotation}

    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={material.roughness ?? 0.72}
        metalness={material.metalness ?? 0.04}
        envMapIntensity={0.24}
      />
    </mesh>
  );
}

/** Create a window opening */
function WindowPanel({ position, size, thickness, rotation = [0, 0, 0], type = 'Sliding Window', panels = '2', opening = 'Sliding' }) {
  const depth = thickness + 0.05; // Slightly thicker than wall to prevent z-fighting
  return (
    <group position={position} rotation={rotation}>
      {/* Window frame */}
      <mesh >
        <boxGeometry args={[size[0] + 0.08, size[1] + 0.08, depth]} />
        <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Exterior reveal keeps the glazing from reading as a black placeholder. */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[size[0], size[1]]} />
        <meshStandardMaterial color="#707b82" roughness={0.86} metalness={0.02} />
      </mesh>
      {/* Glass catches the environment while remaining visually quiet. */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[size[0], size[1], 0.018]} />
        <meshPhysicalMaterial
          color="#c8d8dc"
          transparent
          opacity={0.28}
          transmission={0.72}
          thickness={0.02}
          ior={1.46}
          roughness={0.08}
          metalness={0.02}
          envMapIntensity={0.9}
        />
      </mesh>
      {/* Soft interior light portal makes each window affect the room. */}
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[Math.max(size[0] - 0.08, 0.1), Math.max(size[1] - 0.08, 0.1)]} />
        <meshBasicMaterial color="#f5d7ad" transparent opacity={0.08} />
      </mesh>
      {type !== 'Fixed Window' && <mesh position={[0, 0, 0.02]}><boxGeometry args={[0.04, size[1], 0.02]} /><meshStandardMaterial color="#333333" roughness={0.3} metalness={0.5} /></mesh>}
      {type === 'French Window' && <mesh position={[0, 0, 0.02]}><boxGeometry args={[0.04, size[1], 0.02]} /><meshStandardMaterial color="#333333" roughness={0.3} metalness={0.5} /></mesh>}
      {['Casement Window', 'Tilt & Turn Window'].includes(type) && <mesh position={[size[0] * 0.18, 0, 0.026]} rotation={[0, 0, opening === 'Right' ? -0.12 : 0.12]}><boxGeometry args={[0.025, size[1] * 0.82, 0.025]} /><meshStandardMaterial color="#b9935a" metalness={0.35} roughness={0.38} /></mesh>}
    </group>
  );
}

function WallWithOpenings({ wall, position, size, color, material, windows }) {
  const horizontal = wall === 'back' || wall === 'front';
  const axisSize = horizontal ? size[0] : size[2];
  const openings = windows.map((item) => ({ start: item.position * axisSize - axisSize / 2 - item.width / 2, end: item.position * axisSize - axisSize / 2 + item.width / 2, bottom: Math.max(0, item.sillHeight), top: Math.min(size[1], item.sillHeight + item.height) })).map((opening) => ({ ...opening, start: Math.max(-axisSize / 2, opening.start), end: Math.min(axisSize / 2, opening.end) })).filter((opening) => opening.end > opening.start && opening.top > opening.bottom).sort((a, b) => a.start - b.start);
  const segments = [];
  const mergedOpenings = openings.reduce((merged, opening) => { const previous = merged[merged.length - 1]; if (previous && opening.start <= previous.end) { previous.end = Math.max(previous.end, opening.end); previous.bottom = Math.min(previous.bottom, opening.bottom); previous.top = Math.max(previous.top, opening.top); return merged; } return [...merged, { ...opening }]; }, []);
  let cursor = -axisSize / 2;
  mergedOpenings.forEach((opening, index) => { if (opening.start > cursor) segments.push({ key: `wall-${wall}-h-${index}`, start: cursor, end: opening.start, bottom: 0, top: size[1] }); if (opening.bottom > 0) segments.push({ key: `wall-${wall}-b-${index}`, start: opening.start, end: opening.end, bottom: 0, top: opening.bottom }); if (opening.top < size[1]) segments.push({ key: `wall-${wall}-t-${index}`, start: opening.start, end: opening.end, bottom: opening.top, top: size[1] }); cursor = Math.max(cursor, opening.end); });
  if (cursor < axisSize / 2) segments.push({ key: `wall-${wall}-end`, start: cursor, end: axisSize / 2, bottom: 0, top: size[1] });
  return <group position={position}>{segments.map((segment) => { const length = segment.end - segment.start; const center = (segment.start + segment.end) / 2; const segmentPosition = horizontal ? [center, (segment.bottom + segment.top) / 2, 0] : [0, (segment.bottom + segment.top) / 2, center]; const segmentSize = horizontal ? [length, segment.top - segment.bottom, size[2]] : [size[0], segment.top - segment.bottom, length]; return <Wall key={segment.key} position={segmentPosition} size={segmentSize} color={color} material={material} />; })}</group>;
}

/** Create a door opening */
function DoorPanel({ position, size, thickness, rotation = [0, 0, 0] }) {
  const depth = thickness + 0.05;
  return (
    <group position={position} rotation={rotation}>
      {/* Door frame */}
      <mesh >
        <boxGeometry args={[size[0] + 0.1, size[1] + 0.05, depth]} />
        <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Door panel itself (simulated slightly open or just a solid block) */}
      <mesh position={[0, 0, 0.01]} >
        <boxGeometry args={[size[0], size[1], depth - 0.02]} />
        <meshStandardMaterial color="#4a3b2c" roughness={0.7} />
      </mesh>
      {/* Handle */}
      <mesh position={[size[0] / 2 - 0.1, 0, depth / 2 + 0.02]}>
        <boxGeometry args={[0.02, 0.15, 0.04]} />
        <meshStandardMaterial color="#dddddd" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export default function Room() {
  const room = useStore((s) => s.room);
  const windows = useStore((s) => s.windows);
  const doors = useStore((s) => s.doors);
  const lightPreset = useStore((s) => s.lightPreset);
  const { camera } = useThree();
  const floorGroup = useRef();
  const ceilingGroup = useRef();
  useFrame(() => {
    const lookingFromAbove = camera.position.y >= effectiveCeilingHeight / 2;
    if (floorGroup.current) floorGroup.current.visible = lookingFromAbove;
    if (ceilingGroup.current) ceilingGroup.current.visible = !lookingFromAbove;
  });

  const { width, depth, height, wallColor, floorColor, ceilingColor, wallThickness, ceilingMaterial, ceilingDesign, ceilingDepth, ceilingBorder, ceilingLayers, ceilingLighting } = room;
  const effectiveCeilingHeight = Number(room.ceilingHeight || height);
  const ceilingPalette = { 'Matte White': '#d7d5ce', 'Warm White': '#e4d5c1', 'Off White': '#d8d5ce', 'Light Grey': '#b9bdba', 'Concrete Finish': '#777875', 'Wood Panel': '#b48557', 'Slatted Wood': '#986238', 'Gypsum Board': '#c9c7c2', 'Acoustic Panel': '#ded8ce', 'Plaster Finish': '#b9b6ae', 'Metallic Finish': '#5d5e61', 'Custom Texture': '#4f5659' };
  const resolvedCeilingColor = ceilingPalette[ceilingMaterial] || ceilingColor;
  const floorMaterial = FLOORING_MATERIALS[room.floorMaterial] || FLOORING_MATERIALS.oakNatural;
  const catalogMaterial = FLOORING_MATERIAL_BY_ID[room.floorMaterial];
  const floorPattern = room.floorPattern || 'Straight';
  const floorTexture = useMemo(() => { if (typeof document === 'undefined') return null; const texture = createFloorTexture(floorPattern, catalogMaterial?.color || floorMaterial.color || floorColor, Number(room.floorPatternScale || 1)); texture.rotation = (Number(room.floorPatternRotation || 0) * Math.PI) / 180; texture.center.set(0.5, 0.5); return texture; }, [floorPattern, catalogMaterial?.color, floorMaterial.color, floorColor, room.floorPatternScale, room.floorPatternRotation]);
  const wallMaterial = WALL_MATERIALS[room.wallMaterial] || WALL_MATERIALS.warmPaint;
  const fixtureIntensity = (LIGHT_PRESETS[lightPreset] || LIGHT_PRESETS.midday).directional.intensity > 1 ? 0.46 : 0.24;
  const hw = width / 2;
  const hd = depth / 2;
  const hh = height / 2;
  const t = wallThickness;

  // Compute window positions in world coordinates
  const windowMeshes = useMemo(() => {
    return windows.map((win, i) => {
      let pos, rot;
      switch (win.wall) {
        case 'back':
          pos = [
            -hw + win.position * width,
            win.sillHeight + win.height / 2,
            -hd - t / 2,
          ];
          rot = [0, 0, 0];
          break;
        case 'front':
          pos = [
            -hw + win.position * width,
            win.sillHeight + win.height / 2,
            hd + t / 2,
          ];
          rot = [0, Math.PI, 0];
          break;
        case 'left':
          pos = [
            -hw - t / 2,
            win.sillHeight + win.height / 2,
            -hd + win.position * depth,
          ];
          rot = [0, Math.PI / 2, 0];
          break;
        case 'right':
          pos = [
            hw + t / 2,
            win.sillHeight + win.height / 2,
            -hd + win.position * depth,
          ];
          rot = [0, -Math.PI / 2, 0];
          break;
        default:
          pos = [0, 1.5, -hd];
          rot = [0, 0, 0];
      }
      return (
        <WindowPanel
          key={`win-${i}`}
          position={pos}
          size={[win.width, win.height]}
          thickness={t}
          rotation={rot}
          type={win.type}
          panels={win.panels}
          opening={win.opening}
        />
      );
    });
  }, [windows, width, depth, height, hw, hd, t]);

  // Compute door positions in world coordinates
  const doorMeshes = useMemo(() => {
    return doors.map((door, i) => {
      let pos, rot;
      switch (door.wall) {
        case 'back':
          pos = [
            -hw + door.position * width,
            door.height / 2, // Doors sit on the floor
            -hd - t / 2,
          ];
          rot = [0, 0, 0];
          break;
        case 'front':
          pos = [
            -hw + door.position * width,
            door.height / 2,
            hd + t / 2,
          ];
          rot = [0, Math.PI, 0];
          break;
        case 'left':
          pos = [
            -hw - t / 2,
            door.height / 2,
            -hd + door.position * depth,
          ];
          rot = [0, Math.PI / 2, 0];
          break;
        case 'right':
          pos = [
            hw + t / 2,
            door.height / 2,
            -hd + door.position * depth,
          ];
          rot = [0, -Math.PI / 2, 0];
          break;
        default:
          pos = [0, 1, -hd];
          rot = [0, 0, 0];
      }
      return (
        <DoorPanel
          key={`door-${i}`}
          position={pos}
          size={[door.width, door.height]}
          thickness={t}
          rotation={rot}
        />
      );
    });
  }, [doors, width, depth, height, hw, hd, t]);

  return (
    <group userData={{ roomBounds: { width, depth, height }, floorY: 0 }}>
      {/* Floor */}
      <group ref={floorGroup}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}

      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={catalogMaterial?.color || floorMaterial.color || floorColor}
          map={floorTexture}
          roughness={floorMaterial.roughness}
          metalness={floorMaterial.metalness}
          envMapIntensity={floorMaterial.pattern === 'tile' ? 0.72 : 0.48}
          clearcoat={floorMaterial.pattern === 'tile' ? 0.28 : 0.12}
          clearcoatRoughness={0.42}
          side={THREE.DoubleSide}
        />
      </mesh>
      {floorTexture && <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[Math.max(width - 0.08, 0.1), Math.max(depth - 0.08, 0.1)]} />
        <meshBasicMaterial map={floorTexture} color="#ffffff" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>}
      </group>

      {/* Ceiling */}
      <group ref={ceilingGroup}>
      <mesh position={[0, effectiveCeilingHeight, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={resolvedCeilingColor} roughness={ceilingMaterial === 'Metallic Finish' ? 0.38 : 0.85} metalness={ceilingMaterial === 'Metallic Finish' ? 0.62 : 0.02} side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, effectiveCeilingHeight - 0.025, 0]} visible={ceilingLighting !== false}>
        {[-0.32, 0, 0.32].map((x) => (
          <mesh key={`ceiling-fixture-${x}`} position={[x * width, 0, -depth * 0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.055, 24]} />
            <meshStandardMaterial
              color="#fff2d2"
              emissive="#f0b978"
              emissiveIntensity={fixtureIntensity}
              roughness={0.35}
              metalness={0.08}
            />
          </mesh>
        ))}
      </group>

      {ceilingDesign === 'Coffered' && Array.from({ length: Math.max(1, Number(ceilingLayers || 2)) }).map((_, index) => <mesh key={`coffer-${index}`} position={[0, effectiveCeilingHeight - 0.04 - index * 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[Math.max(width - (Number(ceilingBorder || 0.2) * 2) - index * 0.25, 0.2), Math.max(depth - (Number(ceilingBorder || 0.2) * 2) - index * 0.25, 0.2)]} /><meshStandardMaterial color={resolvedCeilingColor} roughness={0.72} /></mesh>)}
      {(ceilingDesign === 'Beam' || ceilingDesign === 'Slatted') && Array.from({ length: Math.max(2, Number(ceilingLayers || 3)) }).map((_, index) => <mesh key={`beam-${index}`} position={[-width / 2 + (index + 1) * width / (Math.max(2, Number(ceilingLayers || 3)) + 1), effectiveCeilingHeight - Number(ceilingDepth || 0.15) / 2, 0]}><boxGeometry args={[Number(ceilingDepth || 0.15), Number(ceilingDepth || 0.15), depth]} /><meshStandardMaterial color={ceilingMaterial === 'Slatted Wood' || ceilingDesign === 'Slatted' ? '#986238' : '#806348'} roughness={0.68} /></mesh>)}
      {(ceilingDesign === 'Tray' || ceilingDesign === 'Recessed') && <mesh position={[0, effectiveCeilingHeight - Number(ceilingDepth || 0.15), 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[Math.max(width - Number(ceilingBorder || 0.2) * 2, 0.2), Math.max(depth - Number(ceilingBorder || 0.2) * 2, 0.2)]} /><meshStandardMaterial color={resolvedCeilingColor} roughness={0.78} /></mesh>}

      {['Suspended', 'Acoustic'].includes(ceilingDesign) && <mesh position={[0, effectiveCeilingHeight - Number(ceilingDepth || 0.15), 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[Math.max(width - Number(ceilingBorder || 0.2), 0.2), Math.max(depth - Number(ceilingBorder || 0.2), 0.2)]} /><meshStandardMaterial color={resolvedCeilingColor} roughness={0.95} /></mesh>}
      {ceilingDesign === 'Vaulted' && <mesh position={[0, effectiveCeilingHeight - 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.86, 1]}><planeGeometry args={[width, depth]} /><meshStandardMaterial color={resolvedCeilingColor} roughness={0.8} /></mesh>}
      {['Curved', 'Geometric'].includes(ceilingDesign) && Array.from({ length: Math.max(2, Number(ceilingLayers || 2)) }).map((_, index) => <mesh key={`curve-${index}`} position={[0, effectiveCeilingHeight - 0.03 - index * Number(ceilingDepth || 0.15) * 0.12, 0]} rotation={[Math.PI / 2, 0, index * 0.18]}><planeGeometry args={[Math.max(width - index * Number(ceilingBorder || 0.2), 0.2), Math.max(depth - index * Number(ceilingBorder || 0.2), 0.2)]} /><meshStandardMaterial color={resolvedCeilingColor} roughness={0.78} /></mesh>)}

      {/* Recessed ceiling cove gives the room a finished architectural edge. */}
      <mesh position={[0, effectiveCeilingHeight - 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[Math.max(width - Number(ceilingBorder || 0.2) * 2, 0.2), Math.max(depth - Number(ceilingBorder || 0.2) * 2, 0.2)]} />
        <meshStandardMaterial color={resolvedCeilingColor} roughness={0.72} metalness={ceilingMaterial === 'Metallic Finish' ? 0.62 : 0.02} />
      </mesh>
      </group>

      {/* Back Wall (Z-) */}
      <WallWithOpenings wall="back" windows={windows.filter((windowItem) => windowItem.wall === 'back')} position={[0, 0, -hd - t / 2]} size={[width + t * 2, height, t]} color={wallMaterial.color || wallColor} material={wallMaterial} />

      {/* Front Wall (Z+) */}
      <WallWithOpenings wall="front" windows={windows.filter((windowItem) => windowItem.wall === 'front')} position={[0, 0, hd + t / 2]} size={[width + t * 2, height, t]} color={wallMaterial.color || wallColor} material={wallMaterial} />

      {/* Left Wall (X-) */}
      <WallWithOpenings wall="left" windows={windows.filter((windowItem) => windowItem.wall === 'left')} position={[-hw - t / 2, 0, 0]} size={[t, height, depth]} color={wallMaterial.color || wallColor} material={wallMaterial} />

      {/* Right Wall (X+) */}
      <WallWithOpenings wall="right" windows={windows.filter((windowItem) => windowItem.wall === 'right')} position={[hw + t / 2, 0, 0]} size={[t, height, depth]} color={wallMaterial.color || wallColor} material={wallMaterial} />

      {/* Windows and Doors */}
      {windowMeshes}
      {doorMeshes}

      {/* Baseboard trim */}
      <mesh position={[0, 0.04, -hd + 0.005]} receiveShadow>
        <boxGeometry args={[width, 0.08, 0.02]} />
        <meshStandardMaterial color="#d4d0cc" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.04, hd - 0.005]} receiveShadow>
        <boxGeometry args={[width, 0.08, 0.02]} />
        <meshStandardMaterial color="#d4d0cc" roughness={0.5} />
      </mesh>
      <mesh position={[-hw + 0.005, 0.04, 0]} receiveShadow>
        <boxGeometry args={[0.02, 0.08, depth]} />
        <meshStandardMaterial color="#d4d0cc" roughness={0.5} />
      </mesh>
      <mesh position={[hw - 0.005, 0.04, 0]} receiveShadow>
        <boxGeometry args={[0.02, 0.08, depth]} />
        <meshStandardMaterial color="#d4d0cc" roughness={0.5} />
      </mesh>
    </group>
  );
}
