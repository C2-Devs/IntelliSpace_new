/**
 * Minimap — 2D top-down room overview rendered in an HTML canvas.
 *
 * Shows room outline, furniture positions as scaled footprint rectangles,
 * and highlights selected items.
 */
import React, { useRef, useEffect } from 'react';
import useStore from '../../store/useStore';

const MINIMAP_SIZE = 160;
const PADDING = 10;

export default function Minimap() {
  const canvasRef = useRef(null);
  const showMinimap = useStore((s) => s.showMinimap);
  const room = useStore((s) => s.room);
  const furniture = useStore((s) => s.furniture);
  const selectedIds = useStore((s) => s.selectedIds);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showMinimap) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Dark background
    ctx.fillStyle = '#0e1118';
    ctx.fillRect(0, 0, W, H);

    const rW = room.width || 6;
    const rD = room.depth || 5;
    const scale = Math.min((W - PADDING * 2) / rW, (H - PADDING * 2) / rD);
    const ox = W / 2;
    const oy = H / 2;

    // Room floor fill
    const rx = ox - (rW / 2) * scale;
    const ry = oy - (rD / 2) * scale;
    const rw = rW * scale;
    const rh = rD * scale;

    ctx.fillStyle = 'rgba(100, 120, 255, 0.06)';
    ctx.fillRect(rx, ry, rw, rh);

    // Room walls - thick border
    ctx.strokeStyle = '#4f5de8';
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, rw, rh);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    const gridStep = scale; // 1m grid
    for (let gx = rx; gx <= rx + rw; gx += gridStep) {
      ctx.beginPath(); ctx.moveTo(gx, ry); ctx.lineTo(gx, ry + rh); ctx.stroke();
    }
    for (let gy = ry; gy <= ry + rh; gy += gridStep) {
      ctx.beginPath(); ctx.moveTo(rx, gy); ctx.lineTo(rx + rw, gy); ctx.stroke();
    }

    // Furniture as footprint rectangles
    furniture.forEach((item) => {
      if (item.isVisible === false) return;
      const [fx, , fz] = item.position || [0, 0, 0];
      const fw = (item.width || 1.0) * scale;
      const fd = (item.depth || 0.7) * scale;
      const px = ox + fx * scale - fw / 2;
      const py = oy + fz * scale - fd / 2;
      const isSelected = selectedIds.includes(item.id);

      ctx.fillStyle = isSelected ? 'rgba(245,158,11,0.5)' : 'rgba(100,116,139,0.4)';
      ctx.fillRect(px, py, fw, fd);

      ctx.strokeStyle = isSelected ? '#f59e0b' : 'rgba(148,163,184,0.6)';
      ctx.lineWidth = isSelected ? 1.5 : 0.8;
      ctx.strokeRect(px, py, fw, fd);
    });

    // North indicator
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', W / 2, ry - 2);

  }, [showMinimap, room, furniture, selectedIds]);

  if (!showMinimap) return null;

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, zIndex: 30,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
      pointerEvents: 'none',
    }}>
      <canvas
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        style={{
          width: MINIMAP_SIZE, height: MINIMAP_SIZE,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          background: '#0e1118',
        }}
      />
      <span style={{
        fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif',
        textTransform: 'uppercase',
        background: 'rgba(0,0,0,0.4)',
        padding: '2px 6px', borderRadius: 4,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>Minimap</span>
    </div>
  );
}
