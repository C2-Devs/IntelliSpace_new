/**
 * Toolbar — bottom action bar.
 *
 * Contains transform mode buttons, copy/paste/delete,
 * undo/redo, and room save/load/reset.
 */
import React from 'react';
import useStore from '../../store/useStore';
import { TRANSFORM_MODES, GRID_SIZES, ROTATION_SNAPS } from '../../constants';
import { motion } from 'framer-motion';
import { Copy, Download, RotateCcw, Trash2, Upload } from 'lucide-react';

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
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-none flex items-center justify-center bg-panel border-t border-line shadow-[0_-8px_24px_rgba(0,0,0,0.16)] z-50 h-14 px-5 overflow-x-auto no-scrollbar w-full" 
      id="main-toolbar"
    >
      {/* Transform Modes */}
      <div className="flex items-center gap-1.5 h-full">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden xl:block">Transform</span>
        <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-black/5">
          {Object.entries(TRANSFORM_MODES).map(([mode, config]) => (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center justify-center w-8 h-7 rounded-lg transition-colors duration-200 ${transformMode === mode ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'bg-transparent text-slate-500 hover:text-slate-900'}`}
              onClick={() => setTransformMode(mode)}
              title={`${config.label} (${config.shortcut})`}
            >
              <span className="text-sm leading-none">{config.icon}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-black/10 shrink-0 mx-2" />

      {/* Clipboard */}
      <div className="flex items-center gap-1.5 h-full shrink-0">
        <motion.button
          whileHover={hasSelection ? { scale: 1.05 } : {}}
          whileTap={hasSelection ? { scale: 0.95 } : {}}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${hasSelection ? 'bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm border border-slate-200' : 'bg-transparent text-slate-400 opacity-40 cursor-not-allowed'}`}
          onClick={copySelected}
          disabled={!hasSelection}
          title="Copy (Ctrl+C)"
        >
          <span className="text-base leading-none">📋</span>
        </motion.button>
        <motion.button
          whileHover={clipboard.length > 0 ? { scale: 1.05 } : {}}
          whileTap={clipboard.length > 0 ? { scale: 0.95 } : {}}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${clipboard.length > 0 ? 'bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm border border-slate-200' : 'bg-transparent text-slate-400 opacity-40 cursor-not-allowed'}`}
          onClick={paste}
          disabled={clipboard.length === 0}
          title="Paste (Ctrl+V)"
        >
          <span className="text-base leading-none">📎</span>
        </motion.button>
        <motion.button
          whileHover={hasSelection ? { scale: 1.05 } : {}}
          whileTap={hasSelection ? { scale: 0.95 } : {}}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${hasSelection ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer shadow-sm border border-rose-100' : 'bg-transparent text-slate-400 opacity-40 cursor-not-allowed'}`}
          onClick={() => hasSelection && removeFurniture(selectedIds)}
          disabled={!hasSelection}
          title="Delete (Del)"
        >
          <span className="text-base leading-none">🗑️</span>
        </motion.button>
      </div>

      <div className="w-px h-5 bg-black/10 shrink-0 mx-2" />

      {/* History */}
      <div className="flex items-center gap-1.5 h-full shrink-0">
        <motion.button
          whileHover={history.length > 0 ? { scale: 1.05 } : {}}
          whileTap={history.length > 0 ? { scale: 0.95 } : {}}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${history.length > 0 ? 'bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm border border-slate-200' : 'bg-transparent text-slate-400 opacity-40 cursor-not-allowed'}`}
          onClick={undo}
          disabled={history.length === 0}
          title="Undo (Ctrl+Z)"
        >
          <span className="text-base leading-none">↩</span>
        </motion.button>
        <motion.button
          whileHover={future.length > 0 ? { scale: 1.05 } : {}}
          whileTap={future.length > 0 ? { scale: 0.95 } : {}}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${future.length > 0 ? 'bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm border border-slate-200' : 'bg-transparent text-slate-400 opacity-40 cursor-not-allowed'}`}
          onClick={redo}
          disabled={future.length === 0}
          title="Redo (Ctrl+Y)"
        >
          <span className="text-base leading-none">↪</span>
        </motion.button>
      </div>

      {snapEnabled && (
        <>
          <div className="w-px h-5 bg-black/10 shrink-0 mx-2" />
          {/* Snap Settings */}
          <div className="flex items-center gap-1.5 h-full shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden xl:block">Snap</span>
            <div className="flex items-center gap-1.5">
              <select
                className="bg-slate-50 border border-black/5 text-slate-700 px-2 py-1 rounded-lg text-xs font-semibold outline-none transition-colors hover:border-black/10 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                value={gridSize}
                onChange={(e) => setGridSize(parseFloat(e.target.value))}
                title="Grid snap size"
              >
                {GRID_SIZES.map((gs) => (
                  <option key={gs.value} value={gs.value} className="bg-white">
                    {gs.label}
                  </option>
                ))}
              </select>
              <select
                className="bg-slate-50 border border-black/5 text-slate-700 px-2 py-1 rounded-lg text-xs font-semibold outline-none transition-colors hover:border-black/10 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                value={rotationSnap}
                onChange={(e) => setRotationSnap(parseFloat(e.target.value))}
                title="Rotation snap"
              >
                {ROTATION_SNAPS.map((rs) => (
                  <option key={rs.value} value={rs.value} className="bg-white">
                    {rs.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      <div className="w-px h-5 bg-black/10 shrink-0 mx-2" />
      
      {/* Room Actions */}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <button className="toolbar-action" onClick={() => downloadRoom(exportRoom())} title="Export room">
          <Download className="size-3.5" aria-hidden="true" /> Export
        </button>
        <label className="toolbar-action cursor-pointer" title="Import room">
          <Upload className="size-3.5" aria-hidden="true" /> Import
          <input className="sr-only" type="file" accept="application/json" onChange={(event) => importFile(event, importRoom)} />
        </label>
        <button className="toolbar-action" onClick={resetRoom} title="Reset room">
          <RotateCcw className="size-3.5" aria-hidden="true" /> Reset
        </button>
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
