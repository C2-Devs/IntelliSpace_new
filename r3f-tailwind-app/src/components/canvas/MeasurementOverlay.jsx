/**
 * MeasurementOverlay — room dimension labels rendered as subtle 3D CAD badges.
 *
 * Shows width, depth, and height measurements along the room edges in a clean,
 * compact architectural style.
 */
import React from 'react';
import { Html } from '@react-three/drei';
import useStore from '../../store/useStore';

function MeasurementLabel({ position, text }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.82)',
          color: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '10px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
        }}
      >
        {text}
      </div>
    </Html>
  );
}

function MeasurementLine({ start, end, color = 'rgba(148, 163, 184, 0.45)' }) {
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([...start, ...end])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={1} transparent opacity={0.6} />
    </line>
  );
}

export default function MeasurementOverlay() {
  const showMeasurements = useStore((s) => s.showMeasurements);
  const room = useStore((s) => s.room);

  if (!showMeasurements) return null;

  const { width, depth, height } = room;
  const hw = width / 2;
  const hd = depth / 2;

  return (
    <group>
      {/* Width measurement (along front edge) */}
      <MeasurementLabel
        position={[0, 0.05, hd + 0.4]}
        text={`${(width * 100).toFixed(0)} cm`}
      />
      <MeasurementLine
        start={[-hw, 0.05, hd + 0.25]}
        end={[hw, 0.05, hd + 0.25]}
      />

      {/* Depth measurement (along right edge) */}
      <MeasurementLabel
        position={[hw + 0.4, 0.05, 0]}
        text={`${(depth * 100).toFixed(0)} cm`}
      />
      <MeasurementLine
        start={[hw + 0.25, 0.05, -hd]}
        end={[hw + 0.25, 0.05, hd]}
      />

      {/* Height measurement (vertical, at corner) */}
      <MeasurementLabel
        position={[-hw - 0.4, height / 2, -hd]}
        text={`${(height * 100).toFixed(0)} cm`}
      />
    </group>
  );
}
