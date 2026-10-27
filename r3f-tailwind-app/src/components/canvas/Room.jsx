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

function createFloorTexture(pattern, baseColor, scale = 1, materialName = '') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d');
  const isMarble = /marble|calacatta|carrara/i.test(materialName);
  const isOak = /oak|ash|walnut|teak/i.test(materialName);
  const isConcrete = /concrete|microcement/i.test(materialName);
  const isPorcelain = /porcelain|slate|travertine|terrazzo/i.test(materialName);
  context.fillStyle = baseColor;
  context.fillRect(0, 0, 512, 512);
  if (isMarble) {
    const image = context.getImageData(0, 0, 512, 512);
    const data = image.data;
    for (let y = 0; y < 512; y += 1) for (let x = 0; x < 512; x += 1) { const wave = Math.sin(x * 0.035 + Math.sin(y * 0.018) * 3) * 3 + Math.sin(y * 0.06) * 2; const grain = Math.sin(x * 0.19 + y * 0.11) * 1.4; const value = Math.max(0, Math.min(255, 244 + wave + grain)); const i = (y * 512 + x) * 4; data[i] = value; data[i + 1] = value; data[i + 2] = Math.min(255, value + 2); data[i + 3] = 255; }
    context.putImageData(image, 0, 0);
    context.save(); context.globalCompositeOperation = 'multiply'; context.lineCap = 'round';
    for (let vein = 0; vein < 7; vein += 1) { context.beginPath(); context.moveTo(-40, 40 + vein * 76); for (let x = -40; x <= 552; x += 18) { const y = 40 + vein * 76 + Math.sin(x * 0.018 + vein * 1.7) * 25 + Math.sin(x * 0.052 + vein) * 9; context.lineTo(x, y); } context.strokeStyle = `rgba(88, 96, 101, ${0.16 + (vein % 3) * 0.035})`; context.lineWidth = 2.2 + (vein % 2) * 1.4; context.stroke(); }
    context.restore();
  } else if (isOak) {
    context.globalAlpha = 0.18; for (let y = 0; y < 512; y += 7) { context.strokeStyle = y % 21 === 0 ? '#6a432d' : '#e0b37b'; context.lineWidth = 1; context.beginPath(); context.moveTo(0, y); context.bezierCurveTo(150, y + 8, 310, y - 8, 512, y + 3); context.stroke(); } context.globalAlpha = 1;
  } else if (isConcrete) {
    const image = context.getImageData(0, 0, 512, 512); for (let i = 0; i < image.data.length; i += 4) { const n = Math.sin(i * 0.17) * 2.5; image.data[i] += n; image.data[i + 1] += n; image.data[i + 2] += n; } context.putImageData(image, 0, 0);
  }
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
  } else if (isPorcelain || (!isMarble && !isOak && !isConcrete)) {
    const gap = pattern === 'Large Format' ? tile * 1.55 : pattern === 'Grid' || pattern === 'Stack Bond' ? tile : tile * 0.75;
    context.strokeStyle = 'rgba(70, 72, 72, 0.12)'; context.lineWidth = Math.max(1, tile * 0.012);
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
  castShadow
  receiveShadow
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

/** Create a realistic window opening with hollow frame, transparent glass, and mullions */
function WindowPanel({ id, position, size, thickness, rotation = [0, 0, 0], type = 'Sliding Window', panels = '2', opening = 'Sliding' }) {
  const selectWindow = useStore((state) => state.selectWindow);
  const selectedWindowId = useStore((state) => state.selectedWindowId);
  const depth = thickness + 0.05;
  const selected = selectedWindowId === id;
  const frameW = 0.06;
  const w = size[0];
  const h = size[1];

  return (
    <group position={position} rotation={rotation} onPointerDown={(event) => { event.stopPropagation(); selectWindow(id); }}>
      {/* Selection highlight border */}
      {selected && (
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[w + 0.18, h + 0.18]} />
          <meshBasicMaterial transparent opacity={0.2} color="#f4c46b" />
        </mesh>
      )}

      {/* Frame: Top jamb */}
      <mesh position={[0, h / 2 - frameW / 2, 0]}>
        <boxGeometry args={[w + 0.04, frameW, depth]} />
        <meshStandardMaterial color={selected ? '#f4c46b' : '#334155'} roughness={0.32} metalness={0.4} />
      </mesh>

      {/* Frame: Bottom sill */}
      <mesh position={[0, -h / 2 + frameW / 2, 0.02]}>
        <boxGeometry args={[w + 0.12, frameW + 0.02, depth + 0.04]} />
        <meshStandardMaterial color={selected ? '#f4c46b' : '#1e293b'} roughness={0.35} metalness={0.35} />
      </mesh>

      {/* Frame: Left jamb */}
      <mesh position={[-w / 2 + frameW / 2, 0, 0]}>
        <boxGeometry args={[frameW, h - frameW * 2, depth]} />
        <meshStandardMaterial color={selected ? '#f4c46b' : '#334155'} roughness={0.32} metalness={0.4} />
      </mesh>

      {/* Frame: Right jamb */}
      <mesh position={[w / 2 - frameW / 2, 0, 0]}>
        <boxGeometry args={[frameW, h - frameW * 2, depth]} />
        <meshStandardMaterial color={selected ? '#f4c46b' : '#334155'} roughness={0.32} metalness={0.4} />
      </mesh>

      {/* Center divider mullion for multi-panel windows */}
      {['Sliding Window', 'French Window', 'Casement Window'].includes(type) && (
        <mesh position={[0, 0, 0.005]}>
          <boxGeometry args={[0.04, h - frameW * 2, depth * 0.75]} />
          <meshStandardMaterial color={selected ? '#f4c46b' : '#475569'} roughness={0.32} metalness={0.4} />
        </mesh>
      )}

      {/* Additional vertical mullions for French windows */}
      {type === 'French Window' && (
        <>
          <mesh position={[-w * 0.25, 0, 0.005]}>
            <boxGeometry args={[0.025, h - frameW * 2, depth * 0.6]} />
            <meshStandardMaterial color="#475569" roughness={0.32} metalness={0.4} />
          </mesh>
          <mesh position={[w * 0.25, 0, 0.005]}>
            <boxGeometry args={[0.025, h - frameW * 2, depth * 0.6]} />
            <meshStandardMaterial color="#475569" roughness={0.32} metalness={0.4} />
          </mesh>
        </>
      )}

      {/* Horizontal glazing bar */}
      <mesh position={[0, 0.05, 0.005]}>
        <boxGeometry args={[w - frameW * 2, 0.025, depth * 0.5]} />
        <meshStandardMaterial color="#475569" roughness={0.32} metalness={0.4} />
      </mesh>

      {/* Real Transparent Glass Pane */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w - frameW * 1.5, h - frameW * 1.5, 0.015]} />
        <meshPhysicalMaterial
          color="#d8e8f0"
          transparent
          opacity={0.32}
          transmission={0.88}
          thickness={0.02}
          ior={1.5}
          roughness={0.06}
          metalness={0.05}
          envMapIntensity={1.0}
        />
      </mesh>

      {/* Subtle interior daylight glow from window */}
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[Math.max(w - 0.1, 0.1), Math.max(h - 0.1, 0.1)]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.05} />
      </mesh>
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
      <mesh castShadow receiveShadow>
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
  const resolvedCatalogMaterial = catalogMaterial || (room.floorMaterial === 'oakNatural' ? FLOORING_MATERIAL_BY_ID['floor-1'] : null);
  const floorName = resolvedCatalogMaterial?.name || floorMaterial.label || 'White Marble';
  const floorColorValue = resolvedCatalogMaterial?.color || floorMaterial.color || floorColor;
  const floorPattern = room.floorPattern || 'Straight';
  const floorTexture = useMemo(() => { if (typeof document === 'undefined') return null; const texture = createFloorTexture(floorPattern, floorColorValue, Number(room.floorPatternScale || 1), floorName); texture.rotation = (Number(room.floorPatternRotation || 0) * Math.PI) / 180; texture.center.set(0.5, 0.5); texture.anisotropy = 4; return texture; }, [floorPattern, floorColorValue, floorName, room.floorPatternScale, room.floorPatternRotation]);
  const isMarbleFloor = /marble|calacatta|carrara/i.test(floorName);
  const isWoodFloor = /oak|ash|walnut|teak/i.test(floorName);
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
          id={win.id}
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
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={floorColorValue}
          map={floorTexture}
          roughness={isMarbleFloor ? 0.28 : isWoodFloor ? 0.5 : floorMaterial.roughness}
          metalness={isMarbleFloor ? 0.02 : floorMaterial.metalness}
          envMapIntensity={isMarbleFloor ? 0.62 : floorMaterial.pattern === 'tile' ? 0.5 : 0.38}
          clearcoat={isMarbleFloor ? 0.34 : isWoodFloor ? 0.18 : 0.08}
          clearcoatRoughness={isMarbleFloor ? 0.28 : 0.42}
          side={THREE.DoubleSide}
        />
      </mesh>

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
