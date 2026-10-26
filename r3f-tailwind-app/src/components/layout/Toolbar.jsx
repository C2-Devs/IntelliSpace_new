/**
 * Toolbar — bottom action bar.
 *
 * Contains transform mode buttons, copy/paste/delete,
 * undo/redo, snap settings, and room save/load/reset.
 * Store wiring is unchanged — presentation-only rewrite.
 */
import React from 'react';
import useStore from '../../store/useStore';
import { GRID_SIZES, ROTATION_SNAPS } from '../../constants';
import { motion } from 'framer-motion';
import { Copy, Clipboard, Trash2, Undo2, Redo2, Download, Upload, RotateCcw, Move, RotateCw, Maximize2 } from 'lucide-react';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';
import Tooltip from '../ui/Tooltip';

const TRANSFORM_ITEMS = [
  { id: 'translate', label: 'Move', icon: Move, shortcut: 'W' },
  { id: 'rotate', label: 'Rotate', icon: RotateCw, shortcut: 'E' },
  { id: 'scale', label: 'Scale', icon: Maximize2, shortcut: 'R' },
];

export default function Toolbar() {
  const transformMode = useStore((s) => s.transformMode);
  const setTransformMode = useStore((s) => s.setTransformMode);
  const selectedIds = useStore((s) => s.selectedIds);
  const copySelected = useStore((s) => s.copySelected);
  const paste = useStore((s) => s.paste);
  const removeFurniture = useStore((s) => s.removeFurniture);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const history = useStore((s) => s.history);
  const future = useStore((s) => s.future);
  const clipboard = useStore((s) => s.clipboard);
  const resetRoom = useStore((s) => s.resetRoom);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const gridSize = useStore((s) => s.gridSize);
  const rotationSnap = useStore((s) => s.rotationSnap);
  const setGridSize = useStore((s) => s.setGridSize);
  const setRotationSnap = useStore((s) => s.setRotationSnap);
  const exportRoom = useStore((s) => s.exportRoom);
  const importRoom = useStore((s) => s.importRoom);

  const hasSelection = selectedIds.length > 0;

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-none flex items-center justify-center gap-1 h-14 px-4 bg-surface border-t border-border shadow-[0_-8px_24px_rgba(10,8,6,0.2)] z-50 overflow-x-auto no-scrollbar w-full"
      id="main-toolbar"
    >
      {/* Transform modes */}
      <Tabs
        items={TRANSFORM_ITEMS.map(({ shortcut, ...item }) => item)}
        value={transformMode}
        onChange={setTransformMode}
        size="sm"
      />

      <div className="w-px h-5 bg-border shrink-0 mx-2" />

      {/* Clipboard */}
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip label="Copy" shortcut="Ctrl+C">
          <Button variant="ghost" size="icon" icon={Copy} onClick={copySelected} disabled={!hasSelection} aria-label="Copy" className="h-8 w-8" />
        </Tooltip>
        <Tooltip label="Paste" shortcut="Ctrl+V">
          <Button variant="ghost" size="icon" icon={Clipboard} onClick={paste} disabled={clipboard.length === 0} aria-label="Paste" className="h-8 w-8" />
        </Tooltip>
        <Tooltip label="Delete" shortcut="Del">
          <Button
            variant="ghost"
            size="icon"
            icon={Trash2}
            onClick={() => hasSelection && removeFurniture(selectedIds)}
            disabled={!hasSelection}
            aria-label="Delete"
            className="h-8 w-8 text-danger hover:bg-danger/10 disabled:text-text-tertiary"
          />
        </Tooltip>
      </div>

      <div className="w-px h-5 bg-border shrink-0 mx-2" />

      {/* History */}
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip label="Undo" shortcut="Ctrl+Z">
          <Button variant="ghost" size="icon" icon={Undo2} onClick={undo} disabled={history.length === 0} aria-label="Undo" className="h-8 w-8" />
        </Tooltip>
        <Tooltip label="Redo" shortcut="Ctrl+Y">
          <Button variant="ghost" size="icon" icon={Redo2} onClick={redo} disabled={future.length === 0} aria-label="Redo" className="h-8 w-8" />
        </Tooltip>
      </div>

      {snapEnabled && (
        <>
          <div className="w-px h-5 bg-border shrink-0 mx-2" />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider hidden xl:block">Snap</span>
            <select
              className="h-8 rounded-md border border-border bg-bg-0 px-2 text-xs font-medium text-text-primary outline-none transition-colors hover:border-border-strong focus:border-accent-400"
              value={gridSize}
              onChange={(e) => setGridSize(parseFloat(e.target.value))}
              title="Grid snap size"
            >
              {GRID_SIZES.map((gs) => (
                <option key={gs.value} value={gs.value} className="bg-bg-0">{gs.label}</option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border border-border bg-bg-0 px-2 text-xs font-medium text-text-primary outline-none transition-colors hover:border-border-strong focus:border-accent-400"
              value={rotationSnap}
              onChange={(e) => setRotationSnap(parseFloat(e.target.value))}
              title="Rotation snap"
            >
              {ROTATION_SNAPS.map((rs) => (
                <option key={rs.value} value={rs.value} className="bg-bg-0">{rs.label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="w-px h-5 bg-border shrink-0 mx-2" />

      {/* Room actions */}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <Button variant="secondary" size="sm" icon={Download} onClick={() => downloadRoom(exportRoom())} title="Export room">
          Export
        </Button>
        <label
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3.5 text-sm font-medium text-text-primary transition-colors duration-150 hover:border-accent-400 focus-within:outline focus-within:outline-2 focus-within:outline-accent-400 focus-within:outline-offset-2"
          title="Import room"
        >
          <Upload size={15} aria-hidden="true" />
          Import
          <input className="sr-only" type="file" accept="application/json" onChange={(event) => importFile(event, importRoom)} />
        </label>
        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={resetRoom} title="Reset room">
          Reset
        </Button>
      </div>
    </motion.div>
  );
}

function downloadRoom(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `roomcraft-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importFile(event, importRoom) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { importRoom(JSON.parse(reader.result)); } catch { /* invalid files are ignored */ }
  };
  reader.readAsText(file);
}
