/**
 * Navbar — top navigation bar.
 *
 * Contains: logo, template selector, live price metrics, camera/grid
 * toggles, save indicator, undo/redo. All store wiring is unchanged
 * from the previous version — this is a presentation-only rewrite.
 */
import React, { useMemo } from 'react';
import useStore from '../../store/useStore';
import { TEMPLATE_LIST } from '../../data/roomTemplates';
import REGISTRY from '../../data/furnitureRegistry';
import SaveIndicator from '../ui/SaveIndicator';
import WorkspaceManager from './WorkspaceManager.jsx';
import { motion } from 'framer-motion';
import { Box, ChevronDown, Magnet, Grid3x3, Map as MapIcon, Ruler, Undo2, Redo2 } from 'lucide-react';
import Button from '../ui/Button';
import Tooltip from '../ui/Tooltip';

const TOGGLES = [
  { key: 'snapEnabled', toggle: 'toggleSnap', icon: Magnet, label: 'Snap to grid' },
  { key: 'showGrid', toggle: 'toggleGrid', icon: Grid3x3, label: 'Show grid' },
  { key: 'showMinimap', toggle: 'toggleMinimap', icon: MapIcon, label: 'Show minimap' },
  { key: 'showMeasurements', toggle: 'toggleMeasurements', icon: Ruler, label: 'Show measurements' },
];

export default function Navbar() {
  const currentTemplate = useStore((s) => s.currentTemplate);
  const room = useStore((s) => s.room);
  const furniture = useStore((s) => s.furniture);
  const history = useStore((s) => s.history);
  const future = useStore((s) => s.future);
  const setTemplate = useStore((s) => s.setTemplate);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const toggleSnap = useStore((s) => s.toggleSnap);
  const showGrid = useStore((s) => s.showGrid);
  const toggleGrid = useStore((s) => s.toggleGrid);
  const showMinimap = useStore((s) => s.showMinimap);
  const toggleMinimap = useStore((s) => s.toggleMinimap);
  const showMeasurements = useStore((s) => s.showMeasurements);
  const toggleMeasurements = useStore((s) => s.toggleMeasurements);

  const toggleState = { snapEnabled, showGrid, showMinimap, showMeasurements };
  const toggleAction = { toggleSnap, toggleGrid, toggleMinimap, toggleMeasurements };

  const metrics = useMemo(() => {
    const area = Math.max(0, Number(room.width || 0) * Number(room.depth || 0));
    const flooring = Number(room.floorMaterial ? 1800 : 0);
    const furnishing = furniture.reduce(
      (sum, item) => sum + (REGISTRY.find((entry) => entry.id === item.catalogItemId)?.price || 5000),
      0
    );
    const base = Math.round(area * 18000 + flooring + furnishing);
    return { area, base, total: Math.round(base * 1.135) };
  }, [room.width, room.depth, room.floorMaterial, furniture]);
  const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-none flex items-center gap-4 h-14 px-4 bg-surface border-b border-border shadow-sm z-50"
      id="main-navbar"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-fit pr-1" aria-label="IntelliSpace editor">
        <div className="grid place-items-center h-8 w-8 rounded-md border border-accent-600/50 bg-gradient-to-br from-surface-raised to-bg-0 shadow-sm">
          <Box size={16} className="text-accent-300" aria-hidden="true" />
        </div>
        <div className="flex flex-col leading-none">
          <h1 className="font-heading text-sm font-medium tracking-wide text-text-primary">
            Intelli<span className="text-accent-400">space</span>
          </h1>
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
            Spatial design studio
          </span>
        </div>
      </div>

      {/* Template selector */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-text-tertiary hidden lg:block">
          Project
        </span>
        <div className="relative">
          <select
            className="h-9 min-w-[160px] appearance-none rounded-md border border-border bg-bg-0 pl-3 pr-8 text-xs font-medium text-text-primary outline-none transition-colors hover:border-border-strong focus:border-accent-400"
            value={currentTemplate}
            onChange={(e) => setTemplate(e.target.value)}
            id="template-selector"
            aria-label="Select project template"
          >
            {TEMPLATE_LIST.map((t) => (
              <option key={t.id} value={t.id} className="bg-bg-0 text-text-primary">
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="w-px h-7 bg-border hidden md:block" />

      {/* Live metrics */}
      <div className="hidden md:flex items-stretch gap-5" aria-label="Live project totals">
        <div className="flex flex-col justify-center gap-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">Total area</span>
          <strong className="tabular text-[13px] font-medium text-text-primary">{metrics.area.toFixed(1)} m²</strong>
        </div>
        <div className="flex flex-col justify-center gap-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">Base price</span>
          <strong className="tabular text-[13px] font-medium text-text-primary">{formatCurrency(metrics.base)}</strong>
        </div>
        <div className="flex flex-col justify-center gap-0.5 rounded-md border border-accent-600/50 bg-accent-tint px-3 py-0.5 text-center">
          <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-accent-300">Total price</span>
          <strong className="tabular text-sm font-semibold text-accent-200">{formatCurrency(metrics.total)}</strong>
        </div>
      </div>

      {/* View toggles */}
      <div className="flex gap-0.5 rounded-md border border-border bg-bg-0 p-0.5 ml-auto">
        {TOGGLES.map(({ key, toggle, icon, label }) => (
          <Tooltip key={key} label={label}>
            <Button
              variant="ghost"
              size="icon"
              icon={icon}
              active={toggleState[key]}
              onClick={toggleAction[toggle]}
              aria-label={label}
              aria-pressed={toggleState[key]}
              className="h-7 w-7"
            />
          </Tooltip>
        ))}
      </div>

      {/* Save Indicator */}
      <WorkspaceManager />
      <SaveIndicator />

      <div className="flex items-center gap-1 pl-3 border-l border-border">
        <Tooltip label="Undo" shortcut="Ctrl+Z">
          <Button
            variant="ghost"
            size="icon"
            icon={Undo2}
            onClick={undo}
            disabled={history.length === 0}
            aria-label="Undo"
            id="btn-undo"
            className="h-7 w-7"
          />
        </Tooltip>
        <Tooltip label="Redo" shortcut="Ctrl+Y">
          <Button
            variant="ghost"
            size="icon"
            icon={Redo2}
            onClick={redo}
            disabled={future.length === 0}
            aria-label="Redo"
            id="btn-redo"
            className="h-7 w-7"
          />
        </Tooltip>
      </div>
    </motion.nav>
  );
}
