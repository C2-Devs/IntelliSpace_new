import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, Environment, useGLTF } from '@react-three/drei';
import './App.css';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Inspector from './components/layout/Inspector';
import Toolbar from './components/layout/Toolbar';
import SceneCanvas from './components/canvas/SceneCanvas';
import Minimap from './components/ui/Minimap';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useAutosave from './hooks/useAutosave';
import { useDropTarget } from './hooks/useDragDrop';
import useStore from './store/useStore';
import { CAMERA_MODES, FLOORING_MATERIAL_OPTIONS, FLOORING_MATERIALS, LIGHT_PRESETS, WALL_MATERIAL_OPTIONS, WALL_MATERIALS } from './constants';
import { TEMPLATE_LIST } from './data/roomTemplates';
import { FLOORING_CATEGORIES, FLOORING_MATERIAL_CATALOG, FLOORING_PATTERNS, flooringPatternBackground, getFloorMaterialColor, getFloorMaterialId } from './data/flooringCatalog';
import useCatalog from './hooks/useCatalog';
import useWorkspaceStore from './store/useWorkspaceStore.js';
import { uploadCustomFurniture } from './utils/customFurnitureApi.js';
import { Heart, Plus, Search, SlidersHorizontal } from 'lucide-react';
import LandingPage from './pages/LandingPage.jsx';
import AuthPlaceholder from './pages/AuthPlaceholder.jsx';
import useAuthStore from './store/useAuthStore.js';
import { Box, ChevronDown, ChevronLeft, ChevronRight, Download, Expand, Grid2X2, Home, Layers3, Lightbulb, MousePointer2, Move, RotateCw, Ruler, Save, Settings2, Sparkles, Sun, Undo2, Redo2, X } from 'lucide-react';

const tools = [
  { label: 'Select', icon: MousePointer2 },
  { label: 'Move', icon: Move },
  { label: 'Rotate', icon: RotateCw },
  { label: 'Scale', icon: Expand },
  { label: 'Measure', icon: Ruler },
];

const configSections = [
  { label: 'Layout', icon: Grid2X2 },
  { label: 'Walls', icon: Layers3 },
  { label: 'Flooring', icon: Grid2X2 },
  { label: 'Ceiling', icon: Home },
  { label: 'Windows', icon: Box },
  { label: 'Lighting', icon: Sun },
  { label: 'Environment', icon: Sparkles },
  { label: 'Furniture', icon: Home },
  { label: 'Engineering', icon: Settings2 },
];

function LayoutContent({ room, setRoomAppearance }) {
  const setTemplate = useStore((s) => s.setTemplate); const currentTemplate = useStore((s) => s.currentTemplate); const customTemplates = useStore((s) => s.customTemplates); const createCustomRoom = useStore((s) => s.createCustomRoom);
  const structures = useStore((s) => s.structures); const selectedIds = useStore((s) => s.selectedIds); const selectedStructure = structures.find((item) => selectedIds.includes(item.id));
  const addStructure = useStore((s) => s.addStructure); const removeStructure = useStore((s) => s.removeStructure); const updateStructure = useStore((s) => s.updateStructure); const toggleStructureLock = useStore((s) => s.toggleStructureLock);
  const [tab, setTab] = useState('Room Types'); const [isAddRoomOpen, setIsAddRoomOpen] = useState(false); const [roomName, setRoomName] = useState(''); const [dimensionDrafts, setDimensionDrafts] = useState({}); const selected = structures.find((item) => selectedIds.includes(item.id));
  const updateDimension = (key, value) => { setDimensionDrafts((drafts) => ({ ...drafts, [key]: value })); if (value !== '' && Number.isFinite(Number(value))) setRoomAppearance({ [key]: Math.max(key === 'height' ? 2.4 : 3, Number(value)) }); };
  const commitDimension = (key) => { const value = dimensionDrafts[key]; if (value === '' || value === undefined) { setDimensionDrafts((drafts) => ({ ...drafts, [key]: Number(room[key]).toFixed(2) })); return; } setRoomAppearance({ [key]: Math.max(key === 'height' ? 2.4 : 3, Number(value) || 0) }); setDimensionDrafts((drafts) => ({ ...drafts, [key]: undefined })); };
  const typeMap = { 'Partition Wall': 'partition', Column: 'column', 'Room Opening': 'opening', Niche: 'niche' };
  return <div className="layout-content"><div className="intelli-section-title"><div><h3>Layout</h3><p>Design your space structure</p></div></div><div className="intelli-tabs layout-tabs">{['Room Types', 'Dimensions', 'Structures'].map((item) => <button key={item} className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === 'Room Types' && <><div className="layout-subheading"><strong>Room Templates</strong></div><div className="room-template-grid">{[...TEMPLATE_LIST.slice(0, 6), ...customTemplates].map((template, index) => <button key={template.id} className={`room-template-card ${currentTemplate === template.id ? 'is-selected' : ''}`} onClick={() => setTemplate(template.id)}><span className={`room-template-preview preview-${index % 6}`}><Home size={30} strokeWidth={1.1} /></span><span>{template.name.replace('Modern ', '').replace('Scandinavian ', '')}</span></button>)}</div><div className="layout-tools"><h4>Layout Tools</h4><div className="layout-tool-grid"><button onClick={() => { setRoomName(''); setIsAddRoomOpen(true); }}><strong>+</strong><span>Add Room</span></button><button onClick={() => selectedStructure?.type === 'partition' && removeStructure(selectedStructure.id)} disabled={selectedStructure?.type !== 'partition'}><strong>⌁</strong><span>Remove Wall</span></button><button onClick={() => addStructure('partition')}><strong>⊞</strong><span>Split Room</span></button><button onClick={() => addStructure('opening')}><strong>▥</strong><span>Merge Room</span></button></div></div></>}
    {tab === 'Dimensions' && <><div className="layout-subheading"><strong>Room Dimensions</strong><select aria-label="Units"><option>Metric (m)</option></select></div><p className="layout-helper">Adjust the size of your room</p><div className="dimension-fields">{[['width', 'Length (X)'], ['depth', 'Width (Z)'], ['height', 'Height (Y)']].map(([key, label]) => <label key={key}><span>{label}</span><div><button onClick={() => updateDimension(key, room[key] - 0.1)}>−</button><input type="number" min={key === 'height' ? 2.4 : 3} step="0.1" value={dimensionDrafts[key] ?? Number(room[key]).toFixed(2)} onChange={(event) => updateDimension(key, event.target.value)} onBlur={() => commitDimension(key)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /><b>m</b><button onClick={() => updateDimension(key, room[key] + 0.1)}>+</button></div></label>)}</div><div className="dimension-summary"><div><strong>Interior area</strong><span>{(room.width * room.depth).toFixed(2)} m²</span></div><div><strong>Volume</strong><span>{(room.width * room.depth * room.height).toFixed(2)} m³</span></div></div></>}
    {tab === 'Structures' && <><div className="structure-grid">{Object.entries(typeMap).map(([label, type]) => <button key={type} onClick={() => addStructure(type)}><span>{label[0]}</span><small>Add {label}</small></button>)}</div><div className="structure-properties">{selected ? <><strong>{selected.label}</strong><button onClick={() => toggleStructureLock(selected.id)}>{selected.isLocked ? 'Unlock' : 'Lock'}</button><button onClick={() => removeStructure(selected.id)}>Delete</button>{['x','y','z'].map((axis, index) => <label key={axis}>{axis.toUpperCase()}<input type="number" step="0.1" value={selected.position[index]} disabled={selected.isLocked} onChange={(event) => { const position = [...selected.position]; position[index] = Number(event.target.value); updateStructure(selected.id, { position }); }} /></label>)}</> : <p>Select a structure to edit it.</p>}</div></>}
    <div className="wall-settings"><h4>Wall Settings</h4><label>Wall Thickness <strong>{Number(room.wallThickness || 0.2).toFixed(2)} m</strong><input type="range" min="0.1" max="0.4" step="0.01" value={room.wallThickness || 0.2} onChange={(event) => setRoomAppearance({ wallThickness: Number(event.target.value) })} /></label></div>{isAddRoomOpen && <div className="room-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setIsAddRoomOpen(false)}><div className="room-dialog" role="dialog" aria-modal="true" aria-labelledby="add-room-title"><button className="room-dialog-close" type="button" aria-label="Close" onClick={() => setIsAddRoomOpen(false)}><X size={16} /></button><h3 id="add-room-title">Add a room</h3><p>Name your new room. It starts empty with default dimensions.</p><label htmlFor="new-room-name">Room name</label><input id="new-room-name" autoFocus value={roomName} onChange={(event) => setRoomName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && roomName.trim()) { createCustomRoom(roomName); setIsAddRoomOpen(false); } }} placeholder="e.g. Guest Bedroom" /><div className="room-dialog-actions"><button type="button" onClick={() => setIsAddRoomOpen(false)}>Cancel</button><button type="button" disabled={!roomName.trim()} onClick={() => { createCustomRoom(roomName); setIsAddRoomOpen(false); }}>Add room</button></div></div></div>}</div>;
}

const WALL_PAINTS = [
  ['Pure White', '#f4f3ef'], ['Warm White', '#e9e0d2'], ['Ivory', '#ded5c8'], ['Sand Beige', '#cbb9a4'], ['Taupe', '#9d9182'],
  ['Sage Green', '#9aa991'], ['Olive', '#69725c'], ['Dusty Blue', '#8da0af'], ['Terracotta', '#bd735a'], ['Charcoal', '#3e4141'],
];
const WALL_TEXTURES = [
  ['Carrara Marble', 'linear-gradient(135deg,#f3f1ed 20%,#c9c4bd 22%,#fbfaf7 35%,#d3cdc5 60%,#f7f5f0 62%)', 'Premium'],
  ['Emperador Stone', 'linear-gradient(135deg,#302b2b,#756457 45%,#242326 70%,#968272)', 'Premium'],
  ['Travertine', 'repeating-linear-gradient(90deg,#c9b08e 0 16px,#dfc7a3 17px 22px)', 'Premium'],
  ['Limestone', 'linear-gradient(145deg,#e7e2d9,#bcb8ad 48%,#f2eee5)', 'Premium'],
  ['Concrete Textured', 'linear-gradient(145deg,#747676,#a8aaa5 45%,#676a69)', 'Modern'],
  ['Slate Grey', 'linear-gradient(135deg,#303338,#65666b 35%,#25272c 70%,#57585d)', 'Modern'],
  ['Sandstone', 'linear-gradient(145deg,#b9a187,#d8c1a0 45%,#a78e71)', 'Modern'],
  ['White Brick', 'repeating-linear-gradient(0deg,#e9e7e2 0 14px,#b9b8b4 15px 16px),repeating-linear-gradient(90deg,transparent 0 27px,#b9b8b4 28px 30px)', 'Modern'],
  ['Wood Slat', 'repeating-linear-gradient(90deg,#70462d 0 5px,#c18c5c 6px 10px,#4d3023 11px 13px)', 'Modern'],
  ['Textured Plaster', 'linear-gradient(145deg,#d5cec0,#9e9589 45%,#eee9df)', 'Modern'],
  ['Fabric Finish', 'repeating-linear-gradient(135deg,#b9b8b2 0 2px,#e1ded7 3px 5px)', 'Modern'],
  ['Geometric 3D', 'linear-gradient(135deg,#e6e3db 25%,#bcbab5 25% 50%,#eeeae3 50% 75%,#aaa9a7 75%)', 'Modern'],
];

function WallsContent({ room, setRoomAppearance }) {
  const [tab, setTab] = useState('Material');
  const [wallTab, setWallTab] = useState('Material');
  const [applied, setApplied] = useState(false);
  const [selectedPaint, setSelectedPaint] = useState('Warm White');
  const [selectedTexture, setSelectedTexture] = useState('Limestone');
  const selectedMaterial = room.wallMaterial || 'warmPaint';
  const apply = (updates) => { setRoomAppearance(updates); setApplied(true); window.setTimeout(() => setApplied(false), 1500); };
  return <div className="walls-content">
    <div className="walls-heading"><div><h3>Walls</h3><p>Customize wall materials, height and style</p></div></div>
    <div className="intelli-tabs walls-tabs">{['Material', 'Paint', 'Textures', 'Properties'].map((item) => <button key={item} className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === 'Material' && <>
      <div className="wall-selection"><div><strong>Wall Selection</strong><select aria-label="Wall selection"><option>Living Room - North Wall</option><option>Living Room - East Wall</option><option>Hallway - South Wall</option></select></div><span className="wall-mini-map">⌂</span></div>
      <div className="wall-subheading"><strong>Material Library</strong></div><div className="wall-filters">{['All', 'Paint', 'Wallpaper', 'Wood', 'Stone', 'Concrete'].map((filter) => <button key={filter} className={filter === 'All' ? 'is-active' : ''}>{filter}</button>)}</div><input className="wall-search" placeholder="Search wall materials..." />
      <div className="wall-card-grid">{WALL_MATERIAL_OPTIONS.map((id) => { const item = WALL_MATERIALS[id]; return <button key={id} className={`wall-card ${selectedMaterial === id ? 'is-selected' : ''}`} onClick={() => apply({ wallMaterial: id, wallColor: item.color })}><span className="wall-swatch" style={{ background: item.color }} /><strong>{item.label}</strong><small>{item.finish}</small>{selectedMaterial === id && <b>✓</b>}</button>; })}</div>
      <div className="wall-subheading wall-quick"><strong>Quick Presets</strong></div><div className="wall-presets">{['Modern', 'Minimal', 'Classic', 'Industrial', 'Scandinavian'].map((preset, index) => <button key={preset} onClick={() => apply({ wallMaterial: index === 0 ? 'warmPaint' : index === 3 ? 'concrete' : 'plaster' })}><span className={`preset-swatch preset-${index}`} /><small>{preset}</small></button>)}</div>
    </>}
    {tab === 'Paint' && <PaintWallContent selectedPaint={selectedPaint} setSelectedPaint={setSelectedPaint} apply={apply} />}
    {tab === 'Textures' && <TextureWallContent selectedTexture={selectedTexture} setSelectedTexture={setSelectedTexture} apply={apply} />}
    {tab === 'Properties' && <div className="wall-properties"><div className="wall-preview" /><h4>Wall Information</h4><label>Name<input value="North Wall" readOnly /></label><label>Type<select><option>Interior Wall</option></select></label><div className="wall-info-grid"><span>Area<strong>12.96 m²</strong></span><span>Length<strong>4.80 m</strong></span><span>Height<strong>{Number(room.height || 2.7).toFixed(2)} m</strong></span><span>Thickness<strong>{Number(room.wallThickness || 0.2).toFixed(2)} m</strong></span></div><div className="wall-toggle-list"><span>Visible <i className="intelli-switch is-on"><b /></i></span><span>Cast Shadows <i className="intelli-switch is-on"><b /></i></span><span>Collidable <i className="intelli-switch is-on"><b /></i></span></div></div>}
    <div className="wall-settings"><h4>Wall Settings</h4><label>Wall Height <strong>{Number(room.height || 2.7).toFixed(2)} m</strong><input type="range" min="2.4" max="3.3" step="0.1" value={room.height || 2.7} onChange={(event) => setRoomAppearance({ height: Number(event.target.value) })} /></label><label>Wall Thickness <strong>{Number(room.wallThickness || 0.2).toFixed(2)} m</strong><input type="range" min="0.1" max="0.4" step="0.01" value={room.wallThickness || 0.2} onChange={(event) => setRoomAppearance({ wallThickness: Number(event.target.value) })} /></label></div>
    <div className="wall-actions"><button className="intelli-apply" onClick={() => apply({})}>{applied ? 'Applied to Wall' : 'Apply to Wall'}</button><button onClick={() => apply({})}>Apply to All Walls</button></div>
  </div>;
}

function PaintWallContent({ selectedPaint, setSelectedPaint, apply }) { return <div className="wall-paint-content"><div className="wall-subheading"><strong>Color Palette</strong></div><div className="wall-filters">{['All', 'Neutrals', 'Warm', 'Cool', 'Earth', 'Pastels', 'Dark'].map((filter) => <button key={filter} className={filter === 'All' ? 'is-active' : ''}>{filter}</button>)}</div><input className="wall-search" placeholder="Search colors..." /><div className="paint-grid">{WALL_PAINTS.map(([name, color]) => <button key={name} className={selectedPaint === name ? 'is-selected' : ''} onClick={() => { setSelectedPaint(name); apply({ wallColor: color, wallMaterial: 'warmPaint' }); }}><span style={{ background: color }} /><strong>{name}</strong><small>{color.toUpperCase()}</small></button>)}</div><div className="wall-subheading"><strong>Finish</strong></div><div className="finish-grid">{['Matte', 'Eggshell', 'Satin', 'Semi-Gloss', 'Gloss'].map((finish, index) => <button key={finish} className={index === 0 ? 'is-selected' : ''}><span className={`finish-orb finish-${index}`} /><small>{finish}</small></button>)}</div><div className="wall-preview wide-preview" /></div>; }
function TextureWallContent({ selectedTexture, setSelectedTexture, apply }) { return <div className="wall-texture-content"><input className="wall-search" placeholder="Search textures (e.g. marble, wood, concrete...)" /><div className="wall-filters">{['All', 'Marble', 'Stone', 'Wood', 'Concrete', 'Fabric', 'Brick'].map((filter) => <button key={filter} className={filter === 'All' ? 'is-active' : ''}>{filter}</button>)}</div><div className="texture-grid">{WALL_TEXTURES.map(([name, background, tier]) => <button key={name} className={selectedTexture === name ? 'is-selected' : ''} onClick={() => { setSelectedTexture(name); apply({ wallMaterial: name === 'Limestone' ? 'stone' : 'wallpaper' }); }}><span style={{ background }} /><strong>{name}</strong><small>{tier}</small>{selectedTexture === name && <b>✓</b>}</button>)}</div><div className="texture-controls"><label>Texture Scale<strong>1.0x</strong><input type="range" min="0.5" max="2" step="0.1" defaultValue="1" /></label><label>Rotation<strong>0°</strong><input type="range" min="0" max="360" step="15" defaultValue="0" /></label></div><div className="wall-preview wide-preview texture-preview" /></div>; }



function FlooringContent({ room, setRoomAppearance }) {
  const [tab, setTab] = useState('Materials');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [pattern, setPattern] = useState(room.floorPattern || 'Straight');
  const [patternScale, setPatternScale] = useState(Number(room.floorPatternScale || 1));
  const [patternRotation, setPatternRotation] = useState(Number(room.floorPatternRotation || 0));
  const [selectedMaterialId, setSelectedMaterialId] = useState(room.floorMaterial || FLOORING_MATERIAL_CATALOG[0].id);
  const [heating, setHeating] = useState(false);
  const [heatingType, setHeatingType] = useState('Electric');
  const [temperature, setTemperature] = useState(24);
  const [applied, setApplied] = useState(false);
  const apply = (updates = {}) => { setRoomAppearance(updates); setApplied(true); window.setTimeout(() => setApplied(false), 1500); };
  const current = FLOORING_MATERIAL_CATALOG.find((material) => material.id === selectedMaterialId) || FLOORING_MATERIAL_CATALOG[0];
  const filtered = FLOORING_MATERIAL_CATALOG.filter((material) => material.name.toLowerCase().includes(query.toLowerCase()) && (category === 'All' || material.category === category));
  return <div className="flooring-content">
    <div className="flooring-heading"><h3>Flooring</h3><p>Choose materials and finishes for your floor</p></div>
    <div className="intelli-tabs flooring-tabs">{['Materials', 'Patterns', 'Properties', 'Heating'].map((item) => <button key={item} className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === 'Materials' && <>
      <div className="floor-filters">{FLOORING_CATEGORIES.map((item) => <button key={item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <input className="wall-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search flooring materials..." />
      <div className="floor-card-grid">{filtered.map((material) => <button key={material.id} className={`floor-card ${selectedMaterialId === material.id ? 'is-selected' : ''}`} onClick={() => { setSelectedMaterialId(material.id); apply({ floorMaterial: material.id, floorColor: material.color }); }}><span style={{ background: /marble/i.test(material.name) ? 'linear-gradient(135deg,#faf9f5 0 32%,#aeb3b5 34% 37%,#f4f3ef 40% 60%,#8d969a 63% 67%,#faf9f5 70%)' : /oak/i.test(material.name) ? 'repeating-linear-gradient(8deg,#b98a58 0 5px,#d8b17a 6px 10px,#a57447 11px 13px)' : /concrete/i.test(material.name) ? 'linear-gradient(145deg,#c5c4bd,#8c8e8b)' : /porcelain/i.test(material.name) ? 'linear-gradient(135deg,#c2c1bc,#929493 50%,#b5b5b0)' : material.color }} /><strong>{material.name}</strong><small>{material.category}</small>{selectedMaterialId === material.id && <b>✓</b>}</button>)}</div>
      <div className="floor-feature"><span style={{ background: current.color }} /><div><strong>{current.name}</strong><small>{current.category} finish</small></div><button type="button" onClick={() => apply({ floorMaterial: current.id, floorColor: current.color })}>View Details →</button></div>
    </>}
    {tab === 'Patterns' && <>
      <div className="floor-hero-preview pattern-hero"><strong>{pattern} Pattern</strong><small>A timeless pattern that adds elegance and depth to your space.</small></div>
      <div className="floor-pattern-grid">{FLOORING_PATTERNS.map((name) => <button key={name} className={pattern === name ? 'is-selected' : ''} onClick={() => { setPattern(name); apply({ floorPattern: name, floorPatternScale: patternScale, floorPatternRotation: patternRotation }); }}><span style={{ background: flooringPatternBackground(name) }} /><small>{name}</small>{pattern === name && <b>✓</b>}</button>)}</div>
      <div className="floor-control-grid"><label>Pattern Scale<strong>{patternScale.toFixed(1)}x</strong><input type="range" min="0.5" max="2" step="0.1" value={patternScale} onChange={(event) => setPatternScale(Number(event.target.value))} /></label><label>Direction<select defaultValue="auto"><option value="auto">Auto (Room Orientation)</option><option value="north">North / South</option><option value="east">East / West</option></select></label><label>Rotation<strong>{patternRotation}°</strong><input type="range" min="0" max="360" step="15" value={patternRotation} onChange={(event) => setPatternRotation(Number(event.target.value))} /></label><label>Offset<input value="X 0.00 m   Y 0.00 m" readOnly /></label></div>
    </>}
    {tab === 'Properties' && <>
      <div className="selected-flooring"><span style={{ background: current.color }} /><div><strong>{current.name}</strong><small>{pattern} Pattern</small><button onClick={() => setTab('Materials')}>Change Material →</button></div></div>
      <div className="floor-property-section"><h4>Dimensions</h4><label>Thickness<strong>18 mm</strong><input type="range" min="8" max="30" defaultValue="18" /></label><div className="floor-input-row"><label>Plank Size (L × W)<input value="600 mm" readOnly /></label><span>×</span><input value="120 mm" readOnly /></div></div>
      <div className="floor-property-section"><h4>Pattern Settings</h4><label>Pattern Type<select value={pattern} onChange={(event) => setPattern(event.target.value)}>{FLOORING_PATTERNS.map((name) => <option key={name}>{name}</option>)}</select></label><label>Pattern Scale<strong>{patternScale.toFixed(1)}x</strong><input type="range" min="0.5" max="2" step="0.1" value={patternScale} onChange={(event) => setPatternScale(Number(event.target.value))} /></label><label>Rotation<strong>{patternRotation}°</strong><input type="range" min="0" max="360" step="15" value={patternRotation} onChange={(event) => setPatternRotation(Number(event.target.value))} /></label></div>
    </>}
    {tab === 'Heating' && <>
      <div className="floor-hero-preview heating-hero"><strong>Underfloor Heating</strong><small>Comfort in every step. A warmer, smarter home.</small></div><div className="heating-toggle"><div><strong>Enable Heating</strong><small>Turn on to add underfloor heating to this floor</small></div><button className={`intelli-switch ${heating ? 'is-on' : ''}`} onClick={() => setHeating(!heating)}><span /></button></div><div className="heating-types"><button className={heatingType === 'Electric' ? 'is-selected' : ''} onClick={() => setHeatingType('Electric')}><strong>ϟ Electric</strong><small>Quick heating, ideal for apartments</small></button><button className={heatingType === 'Water-based' ? 'is-selected' : ''} onClick={() => setHeatingType('Water-based')}><strong>◌ Water-based</strong><small>Energy efficient, ideal for large spaces</small></button></div><label className="heating-range">Target Temperature<strong>{temperature} °C</strong><input type="range" min="16" max="30" value={temperature} onChange={(event) => setTemperature(event.target.value)} /></label><div className="coverage-buttons"><span>Coverage Area</span>{['This Room', 'All Rooms', 'Custom'].map((item) => <button key={item} className={item === 'This Room' ? 'is-selected' : ''}>{item}</button>)}</div><div className="heating-options"><span>Warm-up Time<strong>30 min</strong></span><span>Energy Consumption (Est.)<strong>120 W/m²</strong></span><span>Show Heating Pipes (Preview)<i className="intelli-switch is-on"><b /></i></span><span>Include in Cost<i className="intelli-switch is-on"><b /></i></span></div></>}
    <div className="floor-actions"><button className="intelli-apply" onClick={() => apply({ floorMaterial: selectedMaterialId, floorColor: getFloorMaterialColor(selectedMaterialId), floorPattern: pattern, floorPatternScale: patternScale, floorPatternRotation: patternRotation, floorHeating: heating, heatingType, heatingTemperature: Number(temperature) })}>{applied ? 'Applied' : tab === 'Heating' ? 'Apply Heating' : tab === 'Patterns' ? 'Apply Pattern' : 'Apply to Floor'}</button><button onClick={() => apply({})}>{tab === 'Properties' ? 'Reset' : tab === 'Patterns' ? 'Apply to All Floors' : '◈'}</button></div>
  </div>;
}

const CEILING_MATERIALS = [['Matte White','#d7d5ce','$8/m²','Painted'],['Warm White','#e4d5c1','$10/m²','Painted'],['Off White','#d8d5ce','$10/m²','Painted'],['Light Grey','#b9bdba','$12/m²','Painted'],['Concrete Finish','#777875','$18/m²','Concrete'],['Wood Panel','#b48557','$22/m²','Wood'],['Slatted Wood','#986238','$26/m²','Wood'],['Gypsum Board','#c9c7c2','$14/m²','Gypsum'],['Acoustic Panel','#ded8ce','$28/m²','Specialty'],['Plaster Finish','#b9b6ae','$16/m²','Specialty'],['Metallic Finish','#5d5e61','$32/m²','Specialty'],['Custom Texture','#4f5659','Upload / Select','Specialty']];
const CEILING_DESIGNS = [['Flat','Simple & clean'],['Tray','Elegant & modern'],['Coffered','Classic & luxurious'],['Recessed','Minimal & sleek'],['Slatted','Modern & stylish'],['Beam','Rustic & bold'],['Suspended','Contemporary'],['Vaulted','Spacious & grand'],['Curved','Soft & modern'],['Geometric','Unique & artistic'],['Acoustic','Functional & modern'],['Custom Design','Upload / Create']];
function CeilingContent({ room, setRoomAppearance }) { const [tab,setTab]=useState('Materials'); const [material,setMaterial]=useState(room.ceilingMaterial || 'Matte White'); const [design,setDesign]=useState(room.ceilingDesign || 'Tray'); const [query,setQuery]=useState(''); const [category,setCategory]=useState('All'); const [height,setHeight]=useState(Number(room.ceilingHeight || room.height || 2.7)); const [depth,setDepth]=useState(Number(room.ceilingDepth || .15)); const [border,setBorder]=useState(Number(room.ceilingBorder || .2)); const [layers,setLayers]=useState(Number(room.ceilingLayers || 2)); const [lighting,setLighting]=useState(room.ceilingLighting !== false); const [applied,setApplied]=useState(false); const apply=(updates={})=>{setRoomAppearance({ceilingMaterial:material,ceilingDesign:design,ceilingHeight:height,ceilingDepth:depth,ceilingBorder:border,ceilingLayers:layers,ceilingLighting:lighting,...updates});setApplied(true);window.setTimeout(()=>setApplied(false),1400)}; useEffect(()=>{setRoomAppearance({ceilingMaterial:material,ceilingDesign:design,ceilingHeight:height,ceilingDepth:depth,ceilingBorder:border,ceilingLayers:layers,ceilingLighting:lighting})},[material,design,height,depth,border,layers,lighting]); const visible=CEILING_MATERIALS.filter(([name,,,group])=>(category==='All'||group===category)&&name.toLowerCase().includes(query.toLowerCase())); return <div className="ceiling-content"><div className="ceiling-heading"><h3>Ceiling</h3><p>Choose the perfect ceiling for your space</p></div><div className="intelli-tabs ceiling-tabs">{['Materials','Designs','Properties'].map(item=><button key={item} className={tab===item?'is-active':''} onClick={()=>setTab(item)}>{item}</button>)}</div>{tab==='Materials'&&<><div className="ceiling-filters">{['All','Painted','Gypsum','Wood','Concrete','Specialty'].map(item=><button key={item} className={category===item?'is-active':''} onClick={()=>setCategory(item)}>{item}</button>)}</div><input className="wall-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ceiling materials..."/><div className="ceiling-card-grid">{visible.map(([name,color,price])=><button key={name} className={material===name?'is-selected':''} onClick={()=>{setMaterial(name);apply({ceilingMaterial:name,ceilingColor:color})}}><span style={{background:color}}/><strong>{name}</strong><small>{price}</small>{material===name&&<b>✓</b>}</button>)}</div><div className="ceiling-feature"><span/><div><strong>{material}</strong><small>Clean, modern and timeless</small></div><button>View Details →</button></div></>}{tab==='Designs'&&<><div className="ceiling-design-grid">{CEILING_DESIGNS.map(([name,caption],i)=><button key={name} className={design===name?'is-selected':''} onClick={()=>{setDesign(name);apply({ceilingDesign:name})}}><span className={`ceiling-design-art ceiling-art-${i}`}/><strong>{name}</strong><small>{caption}</small>{design===name&&<b>✓</b>}</button>)}</div><div className="ceiling-settings"><h4>Design Settings</h4><CeilingRange label="Ceiling Height" value={height} min="2.4" max="3.6" step=".1" suffix="m" onChange={setHeight}/><CeilingRange label="Recessed Depth" value={depth} min="0" max=".5" step=".01" suffix="m" onChange={setDepth}/><CeilingRange label="Border Width" value={border} min="0" max="1" step=".01" suffix="m" onChange={setBorder}/><div className="ceiling-layer-row"><span>Layer Count</span><button onClick={()=>setLayers(Math.max(1,layers-1))}>−</button><strong>{layers}</strong><button onClick={()=>setLayers(Math.min(4,layers+1))}>+</button></div><div className="ceiling-light-row"><span>Lighting Integration</span><button className={`intelli-switch ${lighting?'is-on':''}`} onClick={()=>setLighting(!lighting)}><span/></button></div></div></>}{tab==='Properties'&&<><div className="selected-ceiling"><span className="ceiling-property-art"/><div><strong>{design} Ceiling</strong><small>{material} | Painted White</small><button onClick={()=>setTab('Designs')}>Change Design →</button></div></div><div className="ceiling-settings"><h4>Dimensions</h4><CeilingRange label="Ceiling Height" value={height} min="2.4" max="3.6" step=".1" suffix="m" onChange={setHeight}/><CeilingRange label="Recessed Depth" value={depth} min="0" max=".5" step=".01" suffix="m" onChange={setDepth}/><CeilingRange label="Border Width" value={border} min="0" max="1" step=".01" suffix="m" onChange={setBorder}/><h4>Material &amp; Finish</h4><label className="ceiling-select-label">Material<select value={material} onChange={e=>setMaterial(e.target.value)}>{CEILING_MATERIALS.map(([name])=><option key={name}>{name}</option>)}</select></label><label className="ceiling-select-label">Finish<select><option>Matte White</option><option>Eggshell</option><option>Satin</option></select></label><div className="ceiling-color-row"><span>Color</span><i style={{background:CEILING_MATERIALS.find(([name])=>name===material)?.[1]}}/><input value={CEILING_MATERIALS.find(([name])=>name===material)?.[1]||'#D7D5CE'} readOnly/></div><div className="ceiling-layer-row"><span>Layer Count</span><button onClick={()=>setLayers(Math.max(1,layers-1))}>−</button><strong>{layers}</strong><button onClick={()=>setLayers(Math.min(4,layers+1))}>+</button></div><div className="ceiling-light-row"><span>Lighting Integration</span><button className={`intelli-switch ${lighting?'is-on':''}`} onClick={()=>setLighting(!lighting)}><span/></button></div></div></> }<div className="ceiling-actions"><button className="intelli-apply" onClick={()=>apply()}>{applied?'Applied':tab==='Materials'?'Apply Material':tab==='Designs'?'Apply Design':'Apply Changes'}</button><button onClick={()=>{setHeight(2.7);setDepth(.15);setBorder(.2);setLayers(2);setLighting(true)}}>{tab==='Materials'?'◈':'Reset'}</button></div></div> }
function CeilingRange({label,value,min,max,step,suffix,onChange}) { return <label className="ceiling-range"><span>{label}<strong>{Number(value).toFixed(2)} {suffix}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label> }

// ── Window Library Data ───────────────────────────────────────────────────────
// Each entry: [name, description, category, defaultPanels, defaultOpening]
const WINDOW_CATALOG = [
  { name: 'Sliding Window',    desc: 'Modern & space-saving',   cat: 'Sliding',   panels: '2', opening: 'Sliding'  },
  { name: 'Casement Window',   desc: 'Classic & versatile',     cat: 'Casement',  panels: '2', opening: 'Casement' },
  { name: 'Fixed Window',      desc: 'Panoramic view',          cat: 'Fixed',     panels: '1', opening: 'Fixed'    },
  { name: 'Bay Window',        desc: 'Adds space & light',      cat: 'Bay',       panels: '3', opening: 'Fixed'    },
  { name: 'Awning Window',     desc: 'Top-hinged ventilation',  cat: 'Specialty', panels: '1', opening: 'Awning'   },
  { name: 'Tilt & Turn Window',desc: 'Flexible & secure',       cat: 'Specialty', panels: '1', opening: 'Casement' },
  { name: 'French Window',     desc: 'Elegant double panel',    cat: 'Specialty', panels: '2', opening: 'Casement' },
  { name: 'Floor-to-Ceiling',  desc: 'Maximum natural light',   cat: 'Specialty', panels: '3', opening: 'Fixed'    },
  { name: 'Custom Window',     desc: 'Upload / Design',         cat: 'Specialty', panels: '2', opening: 'Sliding'  },
];

// SVG thumbnail for each window type — architectural top-level perspective drawings
function WindowThumbnailSVG({ type, selected }) {
  const accent = selected ? '#e8aa40' : '#8aaabb';
  const frame  = selected ? '#c8880a' : '#2e4050';
  const glass  = 'rgba(180,210,225,0.55)';

  const svgs = {
    'Sliding Window': (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="112" height="72" rx="2" fill={frame} />
        <rect x="8" y="8" width="51" height="64" rx="1" fill={glass} />
        <rect x="61" y="8" width="51" height="64" rx="1" fill={glass} />
        <rect x="58" y="8" width="4" height="64" fill={frame} />
        <rect x="34" y="8" width="2" height="64" fill={accent} opacity="0.5" />
        <rect x="84" y="8" width="2" height="64" fill={accent} opacity="0.5" />
        <rect x="8" y="38" width="51" height="2" fill={accent} opacity="0.3" />
        <rect x="61" y="38" width="51" height="2" fill={accent} opacity="0.3" />
        <circle cx="59" cy="40" r="3" fill={accent} />
      </svg>
    ),
    'Casement Window': (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="112" height="72" rx="2" fill={frame} />
        <rect x="8" y="8" width="50" height="64" rx="1" fill={glass} />
        <rect x="62" y="8" width="50" height="64" rx="1" fill={glass} />
        <rect x="57" y="4" width="6" height="72" fill={frame} />
        <line x1="8" y1="39" x2="58" y2="39" stroke={accent} strokeWidth="1.5" opacity="0.5" />
        <line x1="62" y1="39" x2="112" y2="39" stroke={accent} strokeWidth="1.5" opacity="0.5" />
        {/* Hinge marks */}
        <rect x="8" y="10" width="3" height="8" fill={accent} opacity="0.7" />
        <rect x="8" y="62" width="3" height="8" fill={accent} opacity="0.7" />
        <rect x="109" y="10" width="3" height="8" fill={accent} opacity="0.7" />
        <rect x="109" y="62" width="3" height="8" fill={accent} opacity="0.7" />
        {/* Handle */}
        <rect x="53" y="36" width="4" height="8" rx="2" fill={accent} />
        <rect x="63" y="36" width="4" height="8" rx="2" fill={accent} />
      </svg>
    ),
    'Fixed Window': (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="112" height="72" rx="2" fill={frame} />
        <rect x="8" y="8" width="104" height="64" rx="1" fill={glass} />
        <line x1="8" y1="40" x2="112" y2="40" stroke={accent} strokeWidth="1" opacity="0.3" />
        <line x1="60" y1="8" x2="60" y2="72" stroke={accent} strokeWidth="1" opacity="0.3" />
        <rect x="28" y="20" width="64" height="40" rx="2" fill="none" stroke={accent} strokeWidth="1" opacity="0.25" />
      </svg>
    ),
    'Bay Window': (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        {/* Left wing */}
        <rect x="4" y="8" width="28" height="64" rx="1" fill={frame} transform="skewX(8)" />
        <rect x="7" y="10" width="22" height="60" fill={glass} transform="skewX(8)" />
        {/* Center */}
        <rect x="34" y="4" width="52" height="72" rx="2" fill={frame} />
        <rect x="38" y="8" width="44" height="64" rx="1" fill={glass} />
        <line x1="60" y1="8" x2="60" y2="72" stroke={accent} strokeWidth="1.5" opacity="0.4" />
        {/* Right wing */}
        <rect x="88" y="8" width="28" height="64" rx="1" fill={frame} transform="skewX(-8)" />
        <rect x="91" y="10" width="22" height="60" fill={glass} transform="skewX(-8)" />
      </svg>
    ),
    'Awning Window': (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="112" height="72" rx="2" fill={frame} />
        <rect x="8" y="8" width="104" height="64" rx="1" fill={glass} />
        {/* Awning top-hinged panel open indicator */}
        <rect x="8" y="8" width="104" height="36" rx="1" fill={glass} stroke={accent} strokeWidth="1.5" opacity="0.9" />
        <rect x="10" y="42" width="100" height="28" rx="1" fill={glass} />
        {/* Hinge top */}
        <rect x="30" y="5" width="12" height="5" rx="1" fill={accent} opacity="0.8" />
        <rect x="78" y="5" width="12" height="5" rx="1" fill={accent} opacity="0.8" />
        {/* Open angle lines */}
        <line x1="12" y1="8" x2="12" y2="42" stroke={accent} strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
        <line x1="108" y1="8" x2="108" y2="42" stroke={accent} strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
      </svg>
    ),
    'Tilt & Turn Window': (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="112" height="72" rx="2" fill={frame} />
        <rect x="8" y="8" width="104" height="64" rx="1" fill={glass} />
        {/* Diagonal tilt lines */}
        <line x1="8" y1="72" x2="112" y2="8" stroke={accent} strokeWidth="2" opacity="0.5" />
        <line x1="8" y1="8" x2="112" y2="72" stroke={accent} strokeWidth="1" opacity="0.25" />
        {/* Handle */}
        <rect x="109" y="34" width="5" height="12" rx="2.5" fill={accent} />
        {/* Hinge marks */}
        <rect x="5" y="10" width="4" height="7" rx="1" fill={accent} opacity="0.7" />
        <rect x="5" y="63" width="4" height="7" rx="1" fill={accent} opacity="0.7" />
      </svg>
    ),
    'French Window': (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="112" height="72" rx="2" fill={frame} />
        <rect x="8" y="8" width="50" height="64" rx="1" fill={glass} />
        <rect x="62" y="8" width="50" height="64" rx="1" fill={glass} />
        <rect x="57" y="4" width="6" height="72" fill={frame} />
        {/* Decorative cross bars */}
        <line x1="8" y1="27" x2="58" y2="27" stroke={accent} strokeWidth="1.2" opacity="0.5" />
        <line x1="62" y1="27" x2="112" y2="27" stroke={accent} strokeWidth="1.2" opacity="0.5" />
        <line x1="8" y1="52" x2="58" y2="52" stroke={accent} strokeWidth="1.2" opacity="0.5" />
        <line x1="62" y1="52" x2="112" y2="52" stroke={accent} strokeWidth="1.2" opacity="0.5" />
        {/* Knobs */}
        <circle cx="55" cy="40" r="3" fill={accent} />
        <circle cx="65" cy="40" r="3" fill={accent} />
      </svg>
    ),
    'Floor-to-Ceiling': (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="116" height="76" rx="1" fill={frame} />
        <rect x="5" y="2" width="36" height="76" fill={glass} opacity="0.9" />
        <rect x="43" y="2" width="34" height="76" fill={glass} />
        <rect x="79" y="2" width="36" height="76" fill={glass} opacity="0.9" />
        <rect x="41" y="2" width="2" height="76" fill={frame} />
        <rect x="77" y="2" width="2" height="76" fill={frame} />
        {/* Floor indicator */}
        <rect x="2" y="72" width="116" height="6" fill={frame} opacity="0.8" />
        {/* Ceiling indicator */}
        <rect x="2" y="2" width="116" height="4" fill={frame} opacity="0.8" />
        <line x1="23" y1="2" x2="23" y2="78" stroke={accent} strokeWidth="0.8" opacity="0.25" />
        <line x1="97" y1="2" x2="97" y2="78" stroke={accent} strokeWidth="0.8" opacity="0.25" />
      </svg>
    ),
    'Custom Window': (
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="112" height="72" rx="3" fill={frame} strokeDasharray="6,3" stroke={accent} strokeWidth="2" />
        <rect x="8" y="8" width="104" height="64" rx="2" fill={glass} />
        {/* Plus / Design icon */}
        <line x1="60" y1="25" x2="60" y2="55" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <line x1="45" y1="40" x2="75" y2="40" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <text x="60" y="70" textAnchor="middle" fontSize="8" fill={accent} opacity="0.7" fontFamily="Inter, sans-serif">CUSTOM</text>
      </svg>
    ),
  };

  return (
    <div style={{
      width: '100%', height: 76, borderRadius: '6px 6px 0 0',
      overflow: 'hidden', flexShrink: 0,
      background: selected ? 'rgba(40,32,18,0.95)' : 'rgba(18,24,32,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 6,
    }}>
      {svgs[type] || svgs['Fixed Window']}
    </div>
  );
}

const WINDOW_CATEGORIES = ['All', 'Sliding', 'Casement', 'Fixed', 'Bay', 'Specialty'];

function WindowRange({ label, value, min, max, step, suffix, onChange }) {
  return (
    <label className="window-range">
      <span>{label}<strong>{Number(value).toFixed(suffix === 'm' ? 1 : 0)}{suffix ? ` ${suffix}` : ''}</strong></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </label>
  );
}

function WindowToggle({ label, value, onChange }) {
  return (
    <label className="window-toggle-row">
      <span>{label}</span>
      <button
        className={`window-toggle-btn ${value ? 'on' : 'off'}`}
        onClick={() => onChange(!value)}
      >
        <span className="window-toggle-thumb" />
      </button>
    </label>
  );
}

function WindowsContent({ room, setRoomAppearance }) {
  const addWindow    = useStore((s) => s.addWindow);
  const updateWindow = useStore((s) => s.updateWindow);
  const deleteWindow = useStore((s) => s.deleteWindow);
  const windows      = useStore((s) => s.windows);
  const selectedWindowId = useStore((s) => s.selectedWindowId);
  const selectWindow = useStore((s) => s.selectWindow);
  const selectedWindow = windows.find((w) => w.id === selectedWindowId);

  const [tab, setTab]           = useState('Library');
  const [query, setQuery]       = useState('');
  const [category, setCategory] = useState('All');

  // Placement controls (synced with selected window)
  const [wall,     setWall]     = useState('back');
  const [position, setPosition] = useState(0.5);
  const [width,    setWidth]    = useState(2.4);
  const [height,   setHeight]   = useState(1.6);
  const [sill,     setSill]     = useState(0.7);
  const [panels,   setPanels]   = useState('2');
  const [opening,  setOpening]  = useState('Sliding');

  // Properties tab extras
  const [frameMat,  setFrameMat]  = useState('Aluminium');
  const [frameCol,  setFrameCol]  = useState('Black');
  const [glassType, setGlassType] = useState('Double Glazed');
  const [tint,      setTint]      = useState('Clear');
  const [frosted,   setFrosted]   = useState(false);
  const [uv,        setUv]        = useState(true);
  const [sound,     setSound]     = useState(true);

  // Sync form with selected window
  useEffect(() => {
    if (!selectedWindow) return;
    setWall(selectedWindow.wall || 'back');
    setPosition(selectedWindow.position ?? 0.5);
    setWidth(selectedWindow.width ?? 2.4);
    setHeight(selectedWindow.height ?? 1.6);
    setSill(selectedWindow.sillHeight ?? 0.7);
    setPanels(selectedWindow.panels || '2');
    setOpening(selectedWindow.opening || 'Sliding');
  }, [selectedWindowId]);

  // Live-update selected window when placement controls change
  const updateLive = (updates) => {
    if (selectedWindowId) updateWindow(selectedWindowId, updates);
  };

  const filtered = WINDOW_CATALOG.filter((w) => {
    const matchQuery = w.name.toLowerCase().includes(query.toLowerCase())
                    || w.desc.toLowerCase().includes(query.toLowerCase());
    const matchCat   = category === 'All' || w.cat === category;
    return matchQuery && matchCat;
  });

  const handleAddWindow = (catalogEntry) => {
    const windowId = addWindow({
      type: catalogEntry.name,
      wall, position, width, height,
      sillHeight: sill,
      panels: catalogEntry.panels,
      opening: catalogEntry.opening,
    });
    selectWindow(windowId);
    setPanels(catalogEntry.panels);
    setOpening(catalogEntry.opening);
  };

  const handleSelectType = (catalogEntry) => {
    if (selectedWindowId) {
      // Update existing window type
      updateWindow(selectedWindowId, {
        type: catalogEntry.name,
        panels: catalogEntry.panels,
        opening: catalogEntry.opening,
      });
      setPanels(catalogEntry.panels);
      setOpening(catalogEntry.opening);
    }
  };

  return (
    <div className="windows-content">
      {/* Header */}
      <div className="windows-heading">
        <h3>Windows</h3>
        <p>
          {tab === 'Properties'
            ? 'Adjust dimensions, frame material and glass options'
            : 'Choose a window type and place it on any wall'}
        </p>
      </div>

      {/* Placement bar */}
      {tab === 'Library' && (
        <div className="window-placement-controls">
          <label>
            <span>Wall</span>
            <select value={wall} onChange={e => { setWall(e.target.value); updateLive({ wall: e.target.value }); }}>
              <option value="back">Back wall</option>
              <option value="front">Front wall</option>
              <option value="left">Left wall</option>
              <option value="right">Right wall</option>
            </select>
          </label>
          <label className="window-range">
            <span>Position<strong>{Math.round(position * 100)}%</strong></span>
            <input type="range" min="0.12" max="0.88" step="0.01" value={position}
              onChange={e => { const v = Number(e.target.value); setPosition(v); updateLive({ position: v }); }} />
          </label>
          <label className="window-range">
            <span>Width<strong>{width.toFixed(1)} m</strong></span>
            <input type="range" min="0.6" max="4.8" step="0.1" value={width}
              onChange={e => { const v = Number(e.target.value); setWidth(v); updateLive({ width: v }); }} />
          </label>
          <label className="window-range">
            <span>Height<strong>{height.toFixed(1)} m</strong></span>
            <input type="range" min="0.6" max="2.8" step="0.1" value={height}
              onChange={e => { const v = Number(e.target.value); setHeight(v); updateLive({ height: v }); }} />
          </label>
        </div>
      )}

      {/* Tabs */}
      <div className="intelli-tabs windows-tabs">
        {['Library', 'Properties'].map(t => (
          <button key={t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* ── LIBRARY TAB ── */}
      {tab === 'Library' && (
        <>
          <input
            className="wall-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search window types..."
          />
          <div className="window-filters">
            {WINDOW_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={category === cat ? 'is-active' : ''}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Window cards */}
          <div className="window-card-grid-v2">
            {filtered.map((entry) => {
              const isSelected = selectedWindow?.type === entry.name;
              return (
                <div key={entry.name} className={`window-card-v2 ${isSelected ? 'is-selected' : ''}`}>
                  {/* SVG thumbnail */}
                  <WindowThumbnailSVG type={entry.name} selected={isSelected} />
                  <div className="window-card-v2-body">
                    <strong>{entry.name}</strong>
                    <small>{entry.desc}</small>
                  </div>
                  <div className="window-card-v2-actions">
                    {selectedWindowId && (
                      <button className="wc-btn wc-apply" onClick={() => handleSelectType(entry)} title="Apply type to selected window">
                        Apply
                      </button>
                    )}
                    <button className="wc-btn wc-add" onClick={() => handleAddWindow(entry)} title="Add new window">
                      + Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Placed Windows list */}
          {windows.length > 0 && (
            <div className="placed-windows-list">
              <h4>Placed Windows ({windows.length})</h4>
              {windows.map((win, idx) => (
                <div
                  key={win.id}
                  className={`placed-window-row ${win.id === selectedWindowId ? 'is-selected' : ''}`}
                  onClick={() => selectWindow(win.id)}
                >
                  <span className="placed-win-icon">
                    <Box size={13} />
                  </span>
                  <span className="placed-win-label">
                    <strong>{win.type || 'Window'}</strong>
                    <small>{win.wall} wall · {(win.width ?? 0).toFixed(1)}×{(win.height ?? 0).toFixed(1)} m</small>
                  </span>
                  <button
                    className="placed-win-delete"
                    onClick={e => { e.stopPropagation(); deleteWindow(win.id); }}
                    title="Remove"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {windows.length === 0 && (
            <div className="windows-empty-hint">
              <Box size={28} strokeWidth={1.2} style={{ opacity: 0.3 }} />
              <span>Click "+ Add" on a window type to place it on the selected wall.</span>
            </div>
          )}
        </>
      )}

      {/* ── PROPERTIES TAB ── */}
      {tab === 'Properties' && (
        <>
          {selectedWindow ? (
            <>
              <div className="selected-window">
                <div style={{ width: 120, flexShrink: 0 }}>
                  <WindowThumbnailSVG type={selectedWindow.type} selected={true} />
                </div>
                <div>
                  <strong>{selectedWindow.type}</strong>
                  <small>{selectedWindow.wall} wall · {(selectedWindow.width ?? 0).toFixed(1)} × {(selectedWindow.height ?? 0).toFixed(1)} m</small>
                  <button onClick={() => setTab('Library')}>Change Type →</button>
                </div>
              </div>

              <div className="window-property-grid">
                <div>
                  <h4>Dimensions</h4>
                  <WindowRange label="Width"       value={width}    min="0.5" max="5"   step="0.1" suffix="m" onChange={v => { setWidth(v);    updateWindow(selectedWindowId, { width: v }); }} />
                  <WindowRange label="Height"      value={height}   min="0.5" max="3"   step="0.1" suffix="m" onChange={v => { setHeight(v);   updateWindow(selectedWindowId, { height: v }); }} />
                  <WindowRange label="Sill Height" value={sill}     min="0"   max="1.5" step="0.1" suffix="m" onChange={v => { setSill(v);     updateWindow(selectedWindowId, { sillHeight: v }); }} />

                  <h4>Position</h4>
                  <label>
                    Wall
                    <select value={wall} onChange={e => { setWall(e.target.value); updateWindow(selectedWindowId, { wall: e.target.value }); }}>
                      <option value="back">Back wall</option>
                      <option value="front">Front wall</option>
                      <option value="left">Left wall</option>
                      <option value="right">Right wall</option>
                    </select>
                  </label>
                  <WindowRange label="Position" value={position} min="0.12" max="0.88" step="0.01" suffix="%" onChange={v => { setPosition(v); updateWindow(selectedWindowId, { position: v }); }} />
                </div>

                <div>
                  <h4>Frame & Glass</h4>
                  <label>Frame Material
                    <select value={frameMat} onChange={e => setFrameMat(e.target.value)}>
                      <option>Aluminium</option>
                      <option>Wood</option>
                      <option>uPVC</option>
                      <option>Steel</option>
                    </select>
                  </label>
                  <label>Frame Color
                    <select value={frameCol} onChange={e => setFrameCol(e.target.value)}>
                      <option>Black</option>
                      <option>White</option>
                      <option>Bronze</option>
                      <option>Anthracite</option>
                    </select>
                  </label>
                  <label>Glass Type
                    <select value={glassType} onChange={e => setGlassType(e.target.value)}>
                      <option>Double Glazed</option>
                      <option>Triple Glazed</option>
                      <option>Single Glazed</option>
                      <option>Laminated</option>
                    </select>
                  </label>
                  <label>Tint
                    <select value={tint} onChange={e => setTint(e.target.value)}>
                      <option>Clear</option>
                      <option>Smoke</option>
                      <option>Blue</option>
                      <option>Bronze</option>
                    </select>
                  </label>
                  <WindowToggle label="Frosted Glass"     value={frosted} onChange={setFrosted} />
                  <WindowToggle label="UV Protection"     value={uv}      onChange={setUv}      />
                  <WindowToggle label="Sound Insulation"  value={sound}   onChange={setSound}   />

                  <h4>Opening</h4>
                  <label>Opening Type
                    <select value={opening} onChange={e => { setOpening(e.target.value); updateWindow(selectedWindowId, { opening: e.target.value }); }}>
                      <option>Sliding</option>
                      <option>Casement</option>
                      <option>Awning</option>
                      <option>Fixed</option>
                    </select>
                  </label>
                  <label>Panels
                    <select value={panels} onChange={e => { setPanels(e.target.value); updateWindow(selectedWindowId, { panels: e.target.value }); }}>
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                      <option>4</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="window-prop-actions">
                <button className="wc-btn wc-delete" onClick={() => { deleteWindow(selectedWindowId); setTab('Library'); }}>
                  Remove Window
                </button>
              </div>
            </>
          ) : (
            <div className="windows-empty-hint">
              <Box size={28} strokeWidth={1.2} style={{ opacity: 0.3 }} />
              <span>Select a window in the 3D view or the Library to edit its properties.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}



const EMPTY_ENVIRONMENT_SETTINGS = { background: '#121313', ambientIntensity: .58, sunlightIntensity: 1.55, sunlightColor: '#fff8ea', azimuth: 218, elevation: 62, exposure: 1.08, shadows: true };
const ENVIRONMENT_PRESETS = {
  'Bright Day': { background: '#b9d2e5', ambientIntensity: .9, sunlightIntensity: 2.1, sunlightColor: '#fffdf3', azimuth: 205, elevation: 68, exposure: 1.12, shadows: true },
  'Natural Daylight': { background: '#9db8c6', ambientIntensity: .7, sunlightIntensity: 1.65, sunlightColor: '#fff8ea', azimuth: 218, elevation: 62, exposure: 1.08, shadows: true },
  'Warm Sunset': { background: '#6e4d50', ambientIntensity: .42, sunlightIntensity: 1.05, sunlightColor: '#f3a06c', azimuth: 248, elevation: 28, exposure: 1, shadows: true },
  Overcast: { background: '#737d85', ambientIntensity: .82, sunlightIntensity: .48, sunlightColor: '#d7e3ec', azimuth: 218, elevation: 58, exposure: .96, shadows: false },
  Evening: { background: '#29364d', ambientIntensity: .34, sunlightIntensity: .72, sunlightColor: '#b7c5ef', azimuth: 232, elevation: 38, exposure: .94, shadows: true },
  Night: { background: '#111827', ambientIntensity: .16, sunlightIntensity: .28, sunlightColor: '#7184c4', azimuth: 220, elevation: 52, exposure: .88, shadows: false },
};
function EnvironmentContent({ setRoomAppearance }) {
  const environmentPreset=useStore((s)=>s.environmentPreset||'Natural Daylight'); const settings=useStore((s)=>s.environmentSettings||EMPTY_ENVIRONMENT_SETTINGS); const setEnvironmentPreset=useStore((s)=>s.setEnvironmentPreset); const setEnvironmentSettings=useStore((s)=>s.setEnvironmentSettings); const [tab,setTab]=useState('Presets');
  const applyPreset=(name)=>{const next=ENVIRONMENT_PRESETS[name]; if(!next)return; setEnvironmentPreset(name,next); setRoomAppearance({environmentPreset:name,environmentBackground:next.background});}; const update=(updates)=>{setEnvironmentSettings(updates); setEnvironmentPreset('Custom'); setRoomAppearance({environmentPreset:'Custom',environmentBackground:updates.background||settings.background});};
  return <div className="environment-content"><div className="intelli-section-title"><div><h3>Environment</h3><p>Set the atmosphere, sky, and sunlight for your room</p></div><Sparkles size={18}/></div><div className="intelli-tabs">{['Presets','Atmosphere','Sunlight'].map((item)=><button key={item} className={tab===item?'is-active':''} onClick={()=>setTab(item)}>{item}</button>)}</div>{tab==='Presets'&&<><div className="environment-preset-grid">{Object.keys(ENVIRONMENT_PRESETS).map((name)=><button key={name} className={`environment-preset-card ${environmentPreset===name?'is-selected':''}`} onClick={()=>applyPreset(name)}><span style={{background:ENVIRONMENT_PRESETS[name].background}}/><strong>{name}</strong><small>{environmentPreset===name?'Active environment':'Apply environment'}</small></button>)}</div><button className="intelli-apply" onClick={()=>applyPreset(environmentPreset==='Custom'?'Natural Daylight':environmentPreset)}>Apply Environment</button></>}{tab==='Atmosphere'&&<div className="environment-properties"><label>Background color<input type="color" value={settings.background||'#121313'} onChange={(e)=>update({background:e.target.value})}/></label><label>Ambient illumination<strong>{Number(settings.ambientIntensity||0).toFixed(2)}</strong><input type="range" min="0" max="1.2" step=".01" value={settings.ambientIntensity||0} onChange={(e)=>update({ambientIntensity:Number(e.target.value)})}/></label><label>Exposure<strong>{Number(settings.exposure||1).toFixed(2)}</strong><input type="range" min=".7" max="1.35" step=".01" value={settings.exposure||1} onChange={(e)=>update({exposure:Number(e.target.value)})}/></label><button className="intelli-secondary" onClick={()=>applyPreset('Natural Daylight')}>Restore default environment</button></div>}{tab==='Sunlight'&&<div className="environment-properties"><label>Sunlight intensity<strong>{Number(settings.sunlightIntensity||0).toFixed(2)}</strong><input type="range" min="0" max="2.8" step=".01" value={settings.sunlightIntensity||0} onChange={(e)=>update({sunlightIntensity:Number(e.target.value)})}/></label><label>Sunlight color<input type="color" value={settings.sunlightColor||'#fff8ea'} onChange={(e)=>update({sunlightColor:e.target.value})}/></label><label>Azimuth<strong>{Math.round(settings.azimuth||0)}┬░</strong><input type="range" min="0" max="360" value={settings.azimuth||0} onChange={(e)=>update({azimuth:Number(e.target.value)})}/></label><label>Elevation<strong>{Math.round(settings.elevation||0)}┬░</strong><input type="range" min="5" max="85" value={settings.elevation||0} onChange={(e)=>update({elevation:Number(e.target.value)})}/></label><div className="light-toggle"><span>Shadows</span><button className={`intelli-switch ${settings.shadows?'is-on':''}`} aria-pressed={settings.shadows} onClick={()=>update({shadows:!settings.shadows})}><span/></button></div></div>}</div>;
}

function EnvironmentControls() {
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const lightPreset = useStore((s) => s.lightPreset);
  const setLightPreset = useStore((s) => s.setLightPreset);
  return <section className="environment-controls" aria-label="Environment controls">
    <div className="environment-control-heading"><div><strong>Scene environment</strong><small>Camera and daylight are configured here</small></div><Sparkles size={16} aria-hidden="true" /></div>
    <label className="environment-select"><span><Box size={14} /> Camera view</span><select value={cameraMode} onChange={(event) => setCameraMode(event.target.value)}>{Object.entries(CAMERA_MODES).map(([key, mode]) => <option key={key} value={key}>{mode.label}</option>)}</select></label>
    <label className="environment-select"><span><Sun size={14} /> Lighting preset</span><select value={lightPreset} onChange={(event) => setLightPreset(event.target.value)}>{Object.entries(LIGHT_PRESETS).map(([key, preset]) => <option key={key} value={key}>{preset.label}</option>)}</select></label>
  </section>;
}

const EMPTY_LIGHTING_FIXTURES=[];
const FUNCTIONAL_LIGHT_PRESETS={
  'Natural Daylight':{key:'midday',ambientIntensity:.72,mainIntensity:1.8,color:'#fff8ea',shadows:true},
  'Warm Evening':{key:'evening',ambientIntensity:.48,mainIntensity:1.15,color:'#ffc58f',shadows:true},
  'Bright Day':{key:'midday',ambientIntensity:.9,mainIntensity:2.3,color:'#ffffff',shadows:true},
  'Cozy Night':{key:'night',ambientIntensity:.2,mainIntensity:.35,color:'#9aa9d8',shadows:false},
  Sunset:{key:'goldenHour',ambientIntensity:.4,mainIntensity:.8,color:'#e9895e',shadows:true},
  Studio:{key:'studio',ambientIntensity:.65,mainIntensity:1.35,color:'#f4f1e8',shadows:true},
  Cinematic:{key:'night',ambientIntensity:.12,mainIntensity:.7,color:'#7886c7',shadows:true},
};
const LIGHT_PRESETS_UI = [
  ['Natural Daylight', 'Bright, natural and refreshing', '#d9e5dd'],
  ['Warm Evening', 'Cozy and comfortable', '#8d6547'],
  ['Bright Day', 'Clean and energetic', '#cfd8d5'],
  ['Cozy Night', 'Relaxed and intimate', '#3b2f2a'],
  ['Sunset', 'Warm golden tones', '#b76843'],
  ['Studio', 'Balanced and neutral', '#b9b8b0'],
  ['Cinematic', 'Dramatic and stylish', '#262321'],
  ['Custom', 'Create your own lighting setup', '#263039']
];

const LIGHT_FIXTURES_UI = [
  ['Recessed Light', 'Clean & minimal'],
  ['Pendant Light', 'Modern & stylish'],
  ['Chandelier', 'Luxury & elegant'],
  ['Track Light', 'Flexible & directional'],
  ['Ceiling Light', 'Simple & functional'],
  ['Wall Sconce', 'Ambient lighting'],
  ['Floor Lamp', 'Decorative & warm'],
  ['Table Lamp', 'Compact & cozy'],
  ['Spotlight', 'Focused lighting'],
  ['LED Strip', 'Modern & versatile'],
  ['Linear Light', 'Sleek & contemporary'],
  ['Smart Light', 'Color & app control']
];
function LightingContent({ setRoomAppearance }) {
  const setLightPreset=useStore((s)=>s.setLightPreset); const setLightingSettings=useStore((s)=>s.setLightingSettings); const fixtureState=useStore((s)=>s.lightingFixtures); const fixtures=fixtureState||EMPTY_LIGHTING_FIXTURES; const addFixture=useStore((s)=>s.addLightingFixture); const updateFixture=useStore((s)=>s.updateLightingFixture); const removeFixture=useStore((s)=>s.removeLightingFixture); const selectLightingFixture=useStore((s)=>s.selectLightingFixture);
  const customPresets=useStore((s)=>s.customLightingPresets||EMPTY_LIGHTING_FIXTURES); const saveCustomPreset=useStore((s)=>s.saveCustomLightingPreset); const deleteCustomPreset=useStore((s)=>s.deleteCustomLightingPreset); const applyCustomPreset=useStore((s)=>s.applyCustomLightingPreset); const selectedFixtureId=useStore((s)=>s.selectedLightingFixtureId); const selectedFixture=fixtures.find((item)=>item.id===selectedFixtureId); const lightingSettings=useStore((s)=>s.lightingSettings||{}); const [tab,setTab]=useState('Presets'); const [preset,setPreset]=useState('Natural Daylight'); const [intensity,setIntensity]=useState(Math.round((lightingSettings.mainIntensity||1.55)*45)); const [temperature,setTemperature]=useState(3000); const [shadows,setShadows]=useState(lightingSettings.shadows!==false); const [customName,setCustomName]=useState('');
  const applyPreset=(name=preset)=>{const config=FUNCTIONAL_LIGHT_PRESETS[name]||FUNCTIONAL_LIGHT_PRESETS['Natural Daylight']; setPreset(name); setLightPreset(config.key); setLightingSettings({ambientIntensity:config.ambientIntensity,mainIntensity:config.mainIntensity,color:config.color,shadows:config.shadows}); setShadows(config.shadows); setRoomAppearance({lightPreset:config.key,lightingPreset:name});};
  const setProperty=(updates)=>{setLightingSettings(updates); setLightPreset('custom'); setRoomAppearance({lightPreset:'custom',lightingPreset:'Custom'});};
  return <div className="lighting-content"><div className="intelli-section-title"><div><h3>Lighting</h3><p>Shape the atmosphere of your room</p></div></div><div className="intelli-tabs">{['Presets','Fixtures','Properties'].map((item)=><button key={item} className={tab===item?'is-active':''} onClick={()=>setTab(item)}>{item}</button>)}</div>{tab==='Presets'&&<><div className="lighting-preset-grid">{LIGHT_PRESETS_UI.map(([name,description,color])=><button key={name} className={`lighting-preset-card ${preset===name?'is-selected':''}`} onClick={()=>{setPreset(name); if(name==='Custom'){setLightPreset('custom');setLightingSettings({...lightingSettings});setRoomAppearance({lightPreset:'custom',lightingPreset:'Custom'});}}}><span style={{background:color}}/><strong>{name}</strong><small>{description}</small></button>)}</div><button className="intelli-apply" onClick={()=>applyPreset()}>Apply Preset</button>{preset==='Custom'&&<div className="custom-preset-save"><input value={customName} onChange={(e)=>setCustomName(e.target.value)} placeholder="Preset name" aria-label="Custom preset name"/><button onClick={()=>{const id=saveCustomPreset(customName);if(id)setCustomName('')}}>Save as Custom Preset</button></div>}{customPresets.map((item)=><div className="saved-lighting-preset" key={item.id}><button onClick={()=>{applyCustomPreset(item.id);setPreset(item.name)}}>{item.name}</button><button aria-label={`Delete ${item.name}`} onClick={()=>deleteCustomPreset(item.id)}>×</button></div>)}</>}{tab==='Fixtures'&&<><div className="lighting-fixture-grid">{LIGHT_FIXTURES_UI.map(([name,description])=><button key={name} className={`lighting-fixture-card ${selectedFixture?.type===name?'is-selected':''}`} onClick={()=>{addFixture(name)}}><strong>{name}</strong><small>{description}</small></button>)}</div>{selectedFixture&&<div className="lighting-fixture-editor"><strong>{selectedFixture.type}</strong><label>Intensity<input type="range" min="0" max="3" step=".05" value={selectedFixture.intensity} onChange={(e)=>updateFixture(selectedFixture.id,{intensity:Number(e.target.value)})}/></label><label>Color<input type="color" value={selectedFixture.color} onChange={(e)=>updateFixture(selectedFixture.id,{color:e.target.value})}/></label><button onClick={()=>{removeFixture(selectedFixture.id);selectLightingFixture(null)}}>Delete fixture</button></div>}</>}{tab==='Properties'&&<div className="lighting-properties"><label>Intensity<input type="range" min="10" max="100" value={intensity} onChange={(e)=>{const value=Number(e.target.value);setIntensity(value);setProperty({mainIntensity:value/45,ambientIntensity:value/100})}}/></label><label>Temperature<input type="range" min="2200" max="6500" step="100" value={temperature} onChange={(e)=>{const value=Number(e.target.value);setTemperature(value);setProperty({color:value<3500?'#ffc58f':'#fff8ea'})}}/></label><label className="light-toggle">Shadows <button className={`intelli-switch ${shadows?'is-on':''}`} onClick={()=>{setShadows(!shadows);setProperty({shadows:!shadows})}}><span/></button></label></div>}</div>;
}

function LegacyLightingContent({ setRoomAppearance }) { const setLightingSettings=useStore((s)=>s.setLightingSettings); const [tab,setTab]=useState('Presets'); const [preset,setPreset]=useState('Warm Evening'); const [fixture,setFixture]=useState('Pendant Light'); const [query,setQuery]=useState(''); const [intensity,setIntensity]=useState(70); const [temperature,setTemperature]=useState(3000); const [height,setHeight]=useState(.75); const [range,setRange]=useState(5); const [shadows,setShadows]=useState(true); const [affectGlobal,setAffectGlobal]=useState(true); const [visible,setVisible]=useState(true); const [dimmable,setDimmable]=useState(true); const [applied,setApplied]=useState(false); const presetKeyByName={'Natural Daylight':'midday','Warm Evening':'evening','Bright Day':'midday','Cozy Night':'night','Sunset':'goldenHour','Studio':'studio','Cinematic':'night','Custom':'custom'}; const apply=(updates={})=>{const nextPreset=updates.presetName || preset; const key=presetKeyByName[nextPreset] || 'midday'; setPreset(nextPreset); setLightingSettings({ ambientIntensity: Math.max(0.1, intensity / 100), mainIntensity: Math.max(0.2, intensity / 45), color: key === 'night' ? '#9aa9d8' : temperature < 3500 ? '#f6bd82' : '#fff8ea', shadows }); setRoomAppearance({lightPreset:key,lightingPreset:nextPreset,lightingFixture:fixture,lightingIntensity:intensity,lightingTemperature:temperature,lightingHeight:height,lightingRange:range,lightingShadows:shadows,lightingAffectGlobal:affectGlobal,lightingVisible:visible,lightingDimmable:dimmable,...updates});setApplied(true);window.setTimeout(()=>setApplied(false),1400)}; const list=(tab==='Fixtures'?LIGHT_FIXTURES_UI:LIGHT_PRESETS_UI).filter(([name])=>name.toLowerCase().includes(query.toLowerCase())); return <div className="lighting-content"><EnvironmentControls /><div className="lighting-heading"><h3>Lighting</h3><p>{tab==='Presets'?'Choose a lighting preset to set the perfect mood for your space':tab==='Fixtures'?'Add and configure lighting fixtures for your space':'Adjust the selected lighting fixture\'s properties'}</p></div><div className="intelli-tabs lighting-tabs">{['Presets','Fixtures','Properties'].map(item=><button key={item} className={tab===item?'is-active':''} onClick={()=>setTab(item)}>{item}</button>)}</div>{tab!=='Properties'&&<><input className="wall-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={tab==='Fixtures'?'Search lighting fixtures...':'Search presets...'}/><div className="lighting-card-grid">{list.map(([name,caption,color],i)=><button key={name} className={(tab==='Presets'?preset:fixture)===name?'is-selected':''} onClick={()=>{tab==='Presets'?setPreset(name):setFixture(name); useStore.getState().addLightingFixture(name);apply(tab==='Presets'?{lightPreset:name,lightingPreset:name}:{lightingFixture:name})}}><span className={`lighting-art lighting-art-${i%8}`} style={color?{background:color}:undefined}/><strong>{name}</strong><small>{caption}</small>{(tab==='Presets'?preset:fixture)===name&&<b>Γ£ô</b>}</button>)}</div><div className="lighting-feature"><strong>{tab==='Presets'?preset:fixture}</strong><small>{tab==='Presets'?'Combine light sources to create a space that matches your mood and style.':'Set the perfect ambience with a considered fixture arrangement.'}</small></div></>}{tab==='Properties'&&<><div className="selected-light"><span className="selected-light-art"/><div><strong>{fixture}</strong><small>Warm White (3000K)</small><button onClick={()=>setTab('Fixtures')}>Change Fixture ΓåÆ</button></div></div><div className="lighting-property-grid"><div><h4>Basic Properties</h4><label>Name<input value={fixture} readOnly/></label><label>Type<select><option>Pendant</option><option>Recessed</option><option>Wall</option></select></label><label>Qty<input value="3" readOnly/></label><label>Price (each)<input value="$120" readOnly/></label><h4>Light Settings</h4><LightRange label="Intensity" value={intensity} min="0" max="100" suffix="%" onChange={setIntensity}/><LightRange label="Color Temperature" value={temperature} min="1800" max="6500" suffix="K" onChange={setTemperature}/><label>Light Color<input value="#FFF4E0" readOnly/></label><LightRange label="Beam Angle" value={66} min="30" max="120" suffix="┬░" onChange={()=>{}}/><LightToggle label="Dimmable" value={dimmable} onChange={setDimmable}/></div><div><h4>Position &amp; Dimensions</h4><LightRange label="Height from Floor" value={height} min=".3" max="2.5" suffix="m" onChange={setHeight}/><LightRange label="Light Range" value={range} min="1" max="10" suffix="m" onChange={setRange}/><h4>Behavior &amp; Effects</h4><LightToggle label="Cast Shadows" value={shadows} onChange={setShadows}/><LightToggle label="Affect Global Lighting" value={affectGlobal} onChange={setAffectGlobal}/><LightToggle label="Visible in Renders" value={visible} onChange={setVisible}/></div></div></>}<div className="lighting-actions"><button className="intelli-apply" onClick={()=>apply()}>{applied?'Applied':tab==='Presets'?'Apply Preset':tab==='Fixtures'?'Add to Room ΓåÆ':'Apply Changes ΓåÆ'}</button>{tab==='Presets'&&<button onClick={()=>apply({lightingCustomPreset:true})}>Save as Custom Preset</button>}</div></div> }
function LightRange({label,value,min,max,suffix,onChange}){return <label className="light-range"><span>{label}<strong>{Number(value).toFixed(0)} {suffix}</strong></span><input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}
function LightToggle({label,value,onChange}){return <div className="light-toggle"><span>{label}</span><button className={`intelli-switch ${value?'is-on':''}`} onClick={()=>onChange(!value)}><span/></button></div>}

function ActualFurnitureModel({ item }) { const { scene } = useGLTF(item.modelPath); return <Center><primitive object={scene.clone()} scale={item.defaultScale || [1, 1, 1]} rotation={item.defaultRotation || [0, 0, 0]} /></Center>; }
class ActualPreviewBoundary extends React.Component { state = { failed: false }; static getDerivedStateFromError() { return { failed: true }; } render() { return this.state.failed ? <FurnitureThumbnail item={this.props.item} /> : this.props.children; } }
function ActualFurniturePreview({ item }) { return <ActualPreviewBoundary item={item}><div className="furniture-object-preview-art"><Canvas camera={{ position: [2.8, 2, 2.8], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}><ambientLight intensity={1.5} /><directionalLight position={[3, 4, 2]} intensity={2.2} /><Suspense fallback={null}><Bounds fit clip observe margin={1.25}><ActualFurnitureModel item={item} /></Bounds><Environment preset="studio" /></Suspense></Canvas></div></ActualPreviewBoundary>; }
function formatFurniturePrice(item, fallback) {
  if (item.price == null || !Number.isFinite(Number(item.price))) return fallback;
  const currency = /^[A-Z]{3}$/.test(item.currency || '') ? item.currency : 'INR';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(item.price));
  } catch {
    return `${Number(item.price).toLocaleString('en-IN')} ${currency}`;
  }
}

function FurnitureThumbnail({ item }) { const category = item.category.replace('-', ' '); const imageByCategory = { 'living-room': '/furniture-thumbnails/sofa.png', chairs: '/furniture-thumbnails/chair.png', tables: '/furniture-thumbnails/table.png', bedroom: '/furniture-thumbnails/bed.png' }; const image = item.thumbnailPath || imageByCategory[item.category]; return <div className={`furniture-thumb-preview furniture-thumb-${item.category}`} aria-label={`${item.name} preview`}><div className="furniture-thumb-object" aria-hidden="true">{image ? <img src={image} alt="" /> : <><span className="furniture-thumb-surface" /><span className="furniture-thumb-form" /></>}</div><div className="furniture-thumb-meta"><span>{category}</span><b>PREVIEW</b></div></div>; }

function CustomFurnitureUploadForm() {
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('decor');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!workspaceId) {
      setMessage('Create or open a cloud workspace before uploading.');
      return;
    }

    if (!model || !thumbnail) {
      setMessage('Select both a GLB model and a thumbnail image.');
      return;
    }

    const formElement = event.currentTarget;
    setBusy(true);
    setMessage('');

    try {
      await uploadCustomFurniture(workspaceId, {
        name: name.trim(),
        category,
        description: description.trim(),
        model,
        thumbnail,
      });

      setName('');
      setCategory('decor');
      setDescription('');
      setModel(null);
      setThumbnail(null);
      formElement.reset();

      setMessage('Upload complete. Your furniture is being added to the catalog.');
      window.dispatchEvent(new Event('intelli:custom-furniture-updated'));
    } catch (error) {
      setMessage(error.message || 'The upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="custom-furniture-upload">
      <div className="custom-furniture-upload-heading">
        <h4>Upload your own furniture</h4>
        <p>Add a GLB model and a thumbnail to this workspace's catalog.</p>
      </div>

      {!workspaceId && (
        <p className="custom-furniture-upload-notice">
          Create or open a cloud workspace to enable uploads.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <label>
          Furniture name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={150}
            required
            placeholder="e.g. My custom armchair"
          />
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
          >
            <option value="living-room">Sofas and living room</option>
            <option value="chairs">Chairs</option>
            <option value="tables">Tables</option>
            <option value="bedroom">Bedroom</option>
            <option value="office">Office</option>
            <option value="kitchen">Kitchen</option>
            <option value="bathroom">Bathroom</option>
            <option value="plants">Plants</option>
            <option value="storage">Storage</option>
            <option value="lighting">Lighting</option>
            <option value="decor">Decor</option>
          </select>
        </label>

        <label>
          Description (optional)
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Describe this furniture piece"
          />
        </label>

        <label>
          3D model (.glb, maximum 50 MB)
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            required
            onChange={(event) => setModel(event.target.files?.[0] ?? null)}
          />
        </label>

        <label>
          Thumbnail (PNG, JPEG, or WebP; maximum 5 MB)
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            onChange={(event) =>
              setThumbnail(event.target.files?.[0] ?? null)
            }
          />
        </label>

        <button
          type="submit"
          disabled={
            busy || !workspaceId || !name.trim() || !model || !thumbnail
          }
        >
          {busy ? 'Uploading…' : 'Upload to workspace catalog'}
        </button>

        <p className="custom-furniture-upload-message" role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </section>
  );
}
function FurnitureContent() {
  const { items: catalogItems, status: catalogStatus } = useCatalog();
  const addFurniture = useStore((s) => s.addFurniture);
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const selectedCategory = useStore((s) => s.selectedCategory);
  const setSelectedCategory = useStore((s) => s.setSelectedCategory);
  const [query, setQuery] = useState('');
  const [previewItem, setPreviewItem] = useState(null);
  const categoryLabels = {
    all: 'All',
    'living-room': 'Sofas',
    bedroom: 'Beds',
    office: 'Office',
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    plants: 'Plants',
    chairs: 'Chairs',
    tables: 'Tables',
    storage: 'Storage',
    lighting: 'Lighting',
    decor: 'Decor'
  };
  const category = categoryLabels[selectedCategory] || 'All';
  const categories = ['All', 'Sofas', 'Chairs', 'Tables', 'Beds', 'Office', 'Kitchen', 'Bathroom', 'Plants', 'Storage', 'Lighting', 'Decor'];
  const categoryKeys = {
    Sofas: 'living-room',
    Chairs: 'chairs',
    Tables: 'tables',
    Beds: 'bedroom',
    Office: 'office',
    Kitchen: 'kitchen',
    Bathroom: 'bathroom',
    Plants: 'plants',
    Storage: 'storage',
    Lighting: 'lighting',
    Decor: 'decor'
  };
  const categoryKey = categoryKeys[category];
  const filtered = catalogItems.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'All' || item.category === categoryKey;
    return matchesQuery && matchesCategory;
  });
  const prices = ['$2,400', '$1,250', '$980', '$2,800', '$4,200', '$3,600', '$850', '$620', '$1,450', '$1,800', '$120', '$980'];
  const activePreview = previewItem || filtered[0];

  return (
    <div className="furniture-content">
      <header className="furniture-heading">
        <div>
          <h3>Furniture</h3>
          <p>Find the perfect pieces for your space</p>
        </div>
        <button aria-label="Close furniture"><X size={19} /></button>
      </header>
      <div className="furniture-search">
        <Search size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search furniture, e.g. sofa, chair, table..." />
        <button aria-label="Filter furniture"><SlidersHorizontal size={16} /></button>
        <button aria-label="Show favorites" className="furniture-favorite-filter"><Heart size={17} /></button>
      </div>
      <div className="furniture-categories">
        {categories.map((item) => (
          <button key={item} className={category === item ? 'is-active' : ''} onClick={() => setSelectedCategory(categoryKeys[item] || 'all')}>
            {item}
          </button>
        ))}
      </div>
      {activePreview && (
        <section className="furniture-object-preview" aria-live="polite">
          <ActualFurniturePreview item={activePreview} />
          <div className="furniture-object-preview-copy">
            <span>SELECTED PREVIEW</span>
            <strong>{activePreview.name}</strong>
            <small>Review this piece before adding it to your room.</small>
          </div>
        </section>
      )}
      <section className="furniture-hero">
        <div>
          <small>FEATURED</small>
          <h4>Modern Living</h4>
          <p>Timeless pieces for contemporary spaces.</p>
          <button>Explore Collection <ChevronRight size={14} /></button>
        </div>
      </section>
      <p className="catalog-source-status" role="status">
        {catalogStatus === 'live' ? `Live catalog · ${catalogItems.length} items` : catalogStatus === 'loading' ? 'Connecting to live catalog…' : 'Live catalog unavailable; showing local items'}
      </p>
      <CustomFurnitureUploadForm />
      <div className="furniture-grid">
        {filtered.map((item, index) => (
          <article
            className="furniture-product"
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', item.id);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => addFurniture(item, [0, 0, 0])}
          >
            <button
              className={`furniture-heart ${favorites.includes(item.id) ? 'is-favorite' : ''}`}
              aria-label={`Favorite ${item.name}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(item.id);
              }}
            >
              <Heart size={15} fill={favorites.includes(item.id) ? 'currentColor' : 'none'} />
            </button>
            <div className="furniture-thumb"><FurnitureThumbnail item={item} /></div>
            <div className="furniture-product-copy">
              <strong>{item.name}</strong>
              <span>{formatFurniturePrice(item, prices[index % prices.length])}</span>
            </div>
            <button
              className="furniture-add"
              aria-label={`Add ${item.name}`}
              onClick={(e) => {
                e.stopPropagation();
                addFurniture(item, [0, 0, 0]);
              }}
            >
              <Plus size={15} />
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

class ConfigErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Configuration panel error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', color: '#f87171' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Something went wrong in this section.</p>
          <button
            style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


function ConfigurationPanel() {
  const selectedIds = useStore((s) => s.selectedIds);
  const room = useStore((s) => s.room);
  const setRoomAppearance = useStore((s) => s.setRoomAppearance);
  const [activeSection, setActiveSection] = useState('Layout');
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Materials');
  const [heating, setHeating] = useState(true);
  const [panelWidth, setPanelWidth] = useState(366);
  const resizeState = React.useRef(null);
  useEffect(() => {
    const openSection = (event) => { setActiveSection(event.detail?.section || 'Layout'); setIsOpen(true); };
    window.addEventListener('intelli:open-config', openSection);
    return () => window.removeEventListener('intelli:open-config', openSection);
  }, []);
  const beginResize = (event) => { event.preventDefault(); resizeState.current = { startX: event.clientX, startWidth: panelWidth }; let latestWidth = panelWidth; const move = (moveEvent) => { latestWidth = Math.min(640, Math.max(330, resizeState.current.startWidth + resizeState.current.startX - moveEvent.clientX)); setPanelWidth(latestWidth); }; const stop = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', stop); };

  if (selectedIds.length > 0) return null;
  if (!isOpen) return <button className="config-reopen-button" type="button" aria-label="Open configuration" onClick={() => setIsOpen(true)}><ChevronRight size={20} strokeWidth={1.8} /></button>;
  return (
    <aside className={`intelli-config ${activeSection === 'Furniture' ? 'is-furniture-config' : ''}`} style={{ width: panelWidth }} aria-label="Configuration"><button className="config-resize-handle" type="button" aria-label="Resize configuration panel" onPointerDown={beginResize}><span /></button>
      <div className="intelli-config-head">
        <div>
          <h2>Configuration</h2>
          <p>Customize your space</p>
        </div>
        <button className="intelli-icon-button" type="button" aria-label="Close configuration" onClick={() => setIsOpen(false)}><X size={18} /></button>
      </div>
      <div className="intelli-config-body">
        <nav className="intelli-config-nav" aria-label="Configuration sections">
          {configSections.map(({ label, icon: Icon }) => (
            <button key={label} className={activeSection === label ? 'is-active' : ''} onClick={() => setActiveSection(label)}>
              <Icon size={18} strokeWidth={1.6} />
              <span>{label}</span>
            </button>
          ))}
          <button className="intelli-config-nav-bottom"><Settings2 size={18} strokeWidth={1.6} /><span>Settings</span></button>
        </nav>
        <div className="intelli-config-content"><ConfigErrorBoundary key={activeSection}>
          {activeSection === 'Layout' ? <LayoutContent room={room} setRoomAppearance={setRoomAppearance} /> : activeSection === 'Walls' ? <WallsContent room={room} setRoomAppearance={setRoomAppearance} /> : activeSection === 'Flooring' ? <FlooringContent room={room} setRoomAppearance={setRoomAppearance} /> : activeSection === 'Ceiling' ? <CeilingContent room={room} setRoomAppearance={setRoomAppearance} /> : activeSection === 'Windows' ? <WindowsContent room={room} setRoomAppearance={setRoomAppearance} /> : activeSection === 'Lighting' ? <LightingContent setRoomAppearance={setRoomAppearance} /> : activeSection === 'Environment' ? <EnvironmentContent setRoomAppearance={setRoomAppearance} /> : activeSection === 'Furniture' ? <FurnitureContent /> : <>
          <div className="intelli-section-title">
            <div><h3>{activeSection}</h3><p>{activeSection === 'Flooring' ? 'Select material and finish' : 'Configure this layer'}</p></div>
          </div>
          <div className="intelli-tabs">
            {['Materials', 'Patterns', 'Properties'].map((tab) => <button key={tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </div>
          {activeSection === 'Flooring' && activeTab === 'Materials' ? (
            <div className="intelli-material-list">
              {FLOORING_MATERIAL_OPTIONS.map((materialId) => {
                const material = FLOORING_MATERIALS[materialId];
                const selected = room.floorMaterial === materialId;
                return (
                  <button key={materialId} className={`intelli-material-card ${selected ? 'is-selected' : ''}`} onClick={() => setRoomAppearance({ floorMaterial: materialId, floorColor: material.color })}>
                    <span className="intelli-material-swatch" style={{ backgroundColor: material.color }} />
                    <span className="intelli-material-copy"><strong>{material.label}</strong><small>{material.price ? `+Γé╣${material.price.toLocaleString('en-IN')}` : 'Included'}</small></span>
                    <span className="intelli-radio">{selected ? 'Γ£ô' : ''}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="intelli-empty-state"><Box size={24} /><strong>{activeTab}</strong><span>Fine tune your {activeSection.toLowerCase()} configuration.</span></div>
          )}
          <div className="intelli-setting-row"><div><strong>Floor Heating</strong><small>Included</small></div><button className={`intelli-switch ${heating ? 'is-on' : ''}`} onClick={() => setHeating(!heating)} aria-pressed={heating}><span /></button></div>
          <button className="intelli-apply">Apply Selection</button>
          </>}
        </ConfigErrorBoundary></div>
      </div>
    </aside>
  );
}

function PlanView({ view, room, furniture, onClose }) {
  const canvasRef = React.useRef(null);
  const isApartment = view === 'Apartment Plan';
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const rW = (room && room.width) || 6, rD = (room && room.depth) || 5;
    const scale = Math.min((W - 80) / rW, (H - 80) / rD);
    const ox = (W - rW * scale) / 2, oy = (H - rD * scale) / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = isApartment ? 'rgba(180,160,120,0.12)' : 'rgba(100,120,255,0.08)';
    ctx.fillRect(ox, oy, rW * scale, rD * scale);
    ctx.strokeStyle = isApartment ? '#c9a96e' : '#6c8cf5';
    ctx.lineWidth = 3;
    ctx.strokeRect(ox, oy, rW * scale, rD * scale);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', W / 2, oy - 8);
    ctx.fillText('S', W / 2, oy + rD * scale + 18);
    ctx.fillText('W', ox - 12, oy + rD * scale / 2 + 4);
    ctx.fillText('E', ox + rW * scale + 14, oy + rD * scale / 2 + 4);
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(rW + 'm', ox + rW * scale / 2, oy - 20);
    ctx.textAlign = 'right';
    ctx.fillText(rD + 'm', ox - 18, oy + rD * scale / 2 + 4);
    ctx.textAlign = 'center';
    (furniture || []).forEach(function(item) {
      if (!item.position) return;
      const fx = item.position[0], fz = item.position[2];
      const fw = item.width || 1.2, fd = item.depth || 0.8;
      const px = ox + (fx + rW / 2 - fw / 2) * scale;
      const py = oy + (fz + rD / 2 - fd / 2) * scale;
      ctx.fillStyle = 'rgba(108,140,245,0.35)';
      ctx.fillRect(px, py, fw * scale, fd * scale);
      ctx.strokeStyle = '#6c8cf5';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, py, fw * scale, fd * scale);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px Inter, sans-serif';
      const label = (item.name || 'Item').substring(0, 8);
      ctx.fillText(label, px + fw * scale / 2, py + fd * scale / 2 + 4);
    });
    const barW = 60;
    const barM = (barW / scale).toFixed(1);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, H - 20); ctx.lineTo(20 + barW, H - 20); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(barM + 'm', 24 + barW, H - 16);
  }, [room, furniture, view, isApartment]);
  return (
    React.createElement('div', {
      style: {
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'linear-gradient(135deg, #0d1018 0%, #131928 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 } },
        React.createElement('h2', { style: { color: '#e2c97e', fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 600, margin: 0 } }, view),
        React.createElement('span', { style: { color: 'rgba(255,255,255,0.3)', fontSize: 12 } }, ((room && room.width) || 6) + 'm x ' + ((room && room.depth) || 5) + 'm'),
        React.createElement('button', { onClick: onClose, style: { marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 } }, 'Close')
      ),
      React.createElement('canvas', { ref: canvasRef, width: 760, height: 520, style: { borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 80px rgba(0,0,0,0.6)' } }),
      React.createElement('p', { style: { color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 12, fontFamily: 'Inter, sans-serif' } }, 'Top-down ' + view.toLowerCase() + ' ΓÇö furniture footprints shown to scale')
    )
  );
}


function WorkspaceOverlay() {
  const selectedIds = useStore((s) => s.selectedIds);
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const transformMode = useStore((s) => s.transformMode);
  const setTransformMode = useStore((s) => s.setTransformMode);
  const lightPreset = useStore((s) => s.lightPreset);
  const history = useStore((s) => s.history);
  const future = useStore((s) => s.future);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const setLightPreset = useStore((s) => s.setLightPreset);
  const [view, setView] = useState('3D View');
  const room = useStore((s) => s.room);
  const furniture = useStore((s) => s.furniture);
  const openConfig = (section) => window.dispatchEvent(new CustomEvent('intelli:open-config', { detail: { section } }));
  const cycleCamera = () => { const modes = Object.keys(CAMERA_MODES); setCameraMode(modes[(modes.indexOf(cameraMode) + 1) % modes.length]); };
  return <>
    {(view === 'Floor Plan' || view === 'Apartment Plan') && <PlanView view={view} room={room} furniture={furniture} onClose={() => setView('3D View')} />}
    <div className="intelli-view-tabs"><button className={view === '3D View' ? 'is-active' : ''} onClick={() => setView('3D View')}>3D View</button><button className={view === 'Apartment Plan' ? 'is-active' : ''} onClick={() => setView('Apartment Plan')}>Apartment Plan</button><button className={view === 'Floor Plan' ? 'is-active' : ''} onClick={() => setView('Floor Plan')}>Floor Plan</button></div>
    <div className="intelli-canvas-actions"><button onClick={undo} disabled={!history.length} aria-label="Undo"><Undo2 size={17} /></button><button onClick={redo} disabled={!future.length} aria-label="Redo"><Redo2 size={17} /></button><button className="sun-action" onClick={() => setLightPreset(lightPreset === 'night' ? 'midday' : 'night')} aria-label="Toggle sunlight"><Sun size={18} /></button><button className="shadow-action">Shadows <ChevronDown size={14} /></button></div>
    <div className="intelli-tool-rail">{tools.map(({ label, icon: Icon }, index) => { const mode = label === 'Move' ? 'translate' : label === 'Rotate' ? 'rotate' : label === 'Scale' ? 'scale' : null; return <button key={label} className={(mode ? transformMode === mode : index === 0) ? 'is-active' : ''} onClick={() => mode && selectedIds.length === 1 && setTransformMode(mode)}><Icon size={20} strokeWidth={1.6} /><span>{label}</span></button>; })}</div>
    <div className="intelli-bottom-dock"><button className="is-active" onClick={() => openConfig('Lighting')}><Sun size={21} /><span>Sunlight</span></button><button onClick={cycleCamera} title={`Camera: ${CAMERA_MODES[cameraMode]?.label || 'Perspective'}`}><Box size={21} /><span>Camera</span></button><button onClick={() => openConfig('Environment')}><Lightbulb size={21} /><span>Environment</span></button><button onClick={() => openConfig('Flooring')}><Grid2X2 size={21} /><span>Materials</span></button><button onClick={() => setView(view === '3D View' ? 'Apartment Plan' : '3D View')}><Layers3 size={21} /><span>View Modes</span></button><button onClick={() => document.documentElement.requestFullscreen?.()}><Expand size={21} /><span>Presentation</span></button></div>
    <div className="intelli-zoom"><button>-</button><span>90%</span><button>+</button></div><button className="intelli-fit"><Expand size={15} /> Fit to Screen</button><div className="intelli-view-toggle"><button className={view === 'Floor Plan' ? 'is-active' : ''} onClick={() => setView('Floor Plan')}>2D</button><button className={view === '3D View' ? 'is-active' : ''} onClick={() => setView('3D View')}>3D</button><button aria-label="Fullscreen" onClick={() => document.documentElement.requestFullscreen?.()}><Expand size={15} /></button></div>
  </>;
}

function EditorApp() {
  useKeyboardShortcuts();
  useCatalog();
  useAutosave();
  const dropTargetProps = useDropTarget();
  return <div className="intelli-app">
    <Navbar />
    <main className="intelli-workspace">
      <Sidebar />
      <section className="intelli-viewport" {...dropTargetProps}>
        <div className="intelli-viewport-glow" aria-hidden="true" /><SceneCanvas /><Minimap /><WorkspaceOverlay />
      </section>
      <ConfigurationPanel />
      <Inspector />
    </main>
    <Toolbar />
  </div>;
}

function getRoute() { const path = window.location.pathname.replace(/^\/+/, ''); const hash = window.location.hash.replace(/^#\/?/, ''); const route = path || hash; if (route.startsWith('editor')) return 'editor'; if (route.startsWith('login')) return 'login'; if (route.startsWith('register')) return 'register'; return 'landing'; }

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  useEffect(() => { const onHashChange = () => setRoute(getRoute()); window.addEventListener('popstate', onHashChange); window.addEventListener('hashchange', onHashChange); return () => { window.removeEventListener('popstate', onHashChange); window.removeEventListener('hashchange', onHashChange); }; }, []);
  if (route === 'editor' && !isAuthenticated) return <AuthPlaceholder mode="login" />;
  if (route === 'editor') return <EditorApp />;
  if (route === 'login') return <AuthPlaceholder mode="login" />;
  if (route === 'register') return <AuthPlaceholder mode="register" />;
  return <LandingPage />;
}

