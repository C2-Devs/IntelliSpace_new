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
import { Heart, Plus, Search, SlidersHorizontal } from 'lucide-react';
import LandingPage from './pages/LandingPage.jsx';
import AuthPlaceholder from './pages/AuthPlaceholder.jsx';
import useAuthStore from './store/useAuthStore.js';
import { useFurnitureThumbnail } from './utils/furnitureThumbnailService.js';
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


function WorkspaceOverlay() {
  const [view, setView] = useState('3D View');
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

