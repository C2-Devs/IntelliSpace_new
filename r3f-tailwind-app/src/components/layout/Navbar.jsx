/**
 * Navbar — top navigation bar.
 *
 * Contains: logo, template selector, camera mode, light preset,
 * save indicator, undo/redo, export/import, settings toggles.
 */
import React from 'react';
import useStore from '../../store/useStore';
import { TEMPLATE_LIST } from '../../data/roomTemplates';
import REGISTRY from '../../data/furnitureRegistry';
import SaveIndicator from '../ui/SaveIndicator';
import { motion } from 'framer-motion';
import { Magnet, Grid, Map as MapIcon, Ruler, Undo, Redo, ArrowDown, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

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
  const metrics = useMemo(() => {
    const area = Math.max(0, Number(room.width || 0) * Number(room.depth || 0));
    const flooring = Number(room.floorMaterial ? 1800 : 0);
    const furnishing = furniture.reduce((sum, item) => sum + (REGISTRY.find((entry) => entry.id === item.catalogItemId)?.price || 5000), 0);
    const base = Math.round(area * 18000 + flooring + furnishing);
    return { area, base, total: Math.round(base * 1.135) };
  }, [room.width, room.depth, room.floorMaterial, furniture]);
  const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-none flex items-center gap-3 px-4 bg-[#181918] border-b border-[#343631] z-50 h-14 shadow-[0_8px_24px_rgba(0,0,0,0.24)]" 
      id="main-navbar"
    >
      {/* Logo & Title */}
      <div className="intelli-brand" aria-label="IntelliSpace editor">
        <motion.div whileHover={{ scale: 1.04 }} className="intelli-brand-mark" aria-hidden="true"><span /><span /><i /></motion.div>
        <div className="intelli-brand-copy"><h1>INTELLI<span>SPACE</span></h1><span>Spatial design studio</span></div>
      </div>

      {/* Template Selector */}
      <div className="intelli-project-picker">
        <span className="intelli-project-label">Project</span>
        <div className="intelli-project-select-wrap"><select
          className="intelli-project-select"
          value={currentTemplate}
          onChange={(e) => setTemplate(e.target.value)}
          id="template-selector"
          aria-label="Select project template"
        >
          {TEMPLATE_LIST.map((t) => (
            <option key={t.id} value={t.id} className="bg-[#16191c] text-[#eee9df] font-medium">{t.name}</option>
          ))}
        </select><ArrowDown className="intelli-project-chevron" size={13} aria-hidden="true" /></div>
      </div>

      <div className="intelli-header-divider" />

      <div className="intelli-metrics" aria-label="Live project totals">
        <div><span>Total Area</span><strong>{metrics.area.toFixed(1)} m²</strong></div>
        <div><span>Base Price</span><strong>{formatCurrency(metrics.base)}</strong></div>
        <div className="intelli-total"><span>Total Price</span><strong>{formatCurrency(metrics.total)}</strong></div>
      </div>

      {/* Toggles */}
      <div className="flex gap-0.5 bg-[#121313] border border-[#343631] rounded-md p-0.5 shadow-[0_6px_18px_rgba(0,0,0,0.18)] ml-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${snapEnabled ? 'bg-[#c7a66a]/15 text-[#c7a66a] border border-[#c7a66a]/40 shadow-sm' : 'text-[#9a9a90] hover:bg-[#232421] hover:text-[#eee9df] border border-transparent'}`}
          onClick={toggleSnap}
          title="Toggle Snap"
        >
          <span className="text-sm">🧲</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${showGrid ? 'bg-[#c7a66a]/15 text-[#c7a66a] border border-[#c7a66a]/40 shadow-sm' : 'text-[#9a9a90] hover:bg-[#232421] hover:text-[#eee9df] border border-transparent'}`}
          onClick={toggleGrid}
          title="Toggle Grid"
        >
          <span className="text-sm">📏</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${showMinimap ? 'bg-[#c7a66a]/15 text-[#c7a66a] border border-[#c7a66a]/40 shadow-sm' : 'text-[#9a9a90] hover:bg-[#232421] hover:text-[#eee9df] border border-transparent'}`}
          onClick={toggleMinimap}
          title="Toggle Minimap"
        >
          <span className="text-sm">🗺️</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${showMeasurements ? 'bg-[#c7a66a]/15 text-[#c7a66a] border border-[#c7a66a]/40 shadow-sm' : 'text-[#9a9a90] hover:bg-[#232421] hover:text-[#eee9df] border border-transparent'}`}
          onClick={toggleMeasurements}
          title="Toggle Measurements"
        >
          <span className="text-sm">📐</span>
        </motion.button>
      </div>

      {/* Save Indicator */}
      <SaveIndicator />

      {/* Actions */}
      <div className="flex items-center gap-1 ml-2 border-l border-[#343631] pl-3">
        <motion.button
          whileHover={history.length > 0 ? { scale: 1.05 } : {}}
          whileTap={history.length > 0 ? { scale: 0.95 } : {}}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${history.length > 0 ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm cursor-pointer' : 'bg-transparent border border-transparent text-slate-400 opacity-40 cursor-not-allowed'}`}
          onClick={undo}
          disabled={history.length === 0}
          title="Undo (Ctrl+Z)"
          id="btn-undo"
        >
          <span className="text-sm">↩</span>
        </motion.button>
        <motion.button
          whileHover={future.length > 0 ? { scale: 1.05 } : {}}
          whileTap={future.length > 0 ? { scale: 0.95 } : {}}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${future.length > 0 ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm cursor-pointer' : 'bg-transparent border border-transparent text-slate-400 opacity-40 cursor-not-allowed'}`}
          onClick={redo}
          disabled={future.length === 0}
          title="Redo (Ctrl+Y)"
          id="btn-redo"
        >
          <span className="text-sm">↪</span>
        </motion.button>
      </div>
    </motion.nav>
  );
}
