import React, { useCallback } from 'react';
import useStore from '../../store/useStore';
import { getFurnitureById } from '../../data/furnitureRegistry';
import { Copy, Lock, Move, Trash2, Unlock, X } from 'lucide-react';

const MATERIAL_LIBRARIES = {
  wood: [
    { name: 'Natural Oak', texture: 'Natural Oak', color: '#b98b62', swatch: 'wood-oak' },
    { name: 'Walnut', texture: 'Walnut', color: '#6e4935', swatch: 'wood-walnut' },
    { name: 'Ash', texture: 'Ash', color: '#d7c09a', swatch: 'wood-ash' },
  ],
  fabric: [
    { name: 'Linen', texture: 'Linen', color: '#c9bca6', swatch: 'fabric-linen' },
    { name: 'Velvet', texture: 'Velvet', color: '#6e4b62', swatch: 'fabric-velvet' },
    { name: 'Bouclé', texture: 'Bouclé', color: '#e4ded3', swatch: 'fabric-boucle' },
  ],
  metal: [
    { name: 'Brushed Steel', texture: 'Brushed Steel', color: '#aeb4b2', swatch: 'metal-steel' },
    { name: 'Matte Black', texture: 'Matte Black', color: '#292d2c', swatch: 'metal-black' },
    { name: 'Brass', texture: 'Brass', color: '#b18a4f', swatch: 'metal-brass' },
  ],
  floor: [
    { name: 'Warm Oak', texture: 'Warm Oak Floor', color: '#b88b5d', swatch: 'floor-oak' },
    { name: 'Concrete', texture: 'Concrete', color: '#969893', swatch: 'floor-concrete' },
    { name: 'Terrazzo', texture: 'Terrazzo', color: '#c8c3b8', swatch: 'floor-terrazzo' },
  ],
  wall: [
    { name: 'Warm Paint', texture: 'Warm Paint', color: '#d7c6ad', swatch: 'wall-warm' },
    { name: 'Sage Paint', texture: 'Sage Paint', color: '#9cae9b', swatch: 'wall-sage' },
    { name: 'Plaster', texture: 'Plaster', color: '#eee9df', swatch: 'wall-plaster' },
  ],
};

const MATERIAL_CATEGORY_LABELS = { wood: 'Wood', fabric: 'Fabric', metal: 'Metal', floor: 'Floor', wall: 'Wall' };

function NumberField({ label, value, onChange, disabled = false }) {
  return <label className="intelli-transform-field"><span>{label}</span><input type="number" step="0.01" value={Number(value ?? 0).toFixed(2)} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function MaterialLibrary({ selectedItem, updateFurniture }) {
  const [activeCategory, setActiveCategory] = React.useState('wood');
  const activeMaterials = MATERIAL_LIBRARIES[activeCategory];
  return <section className="intelli-transform-section furniture-material-section">
    <div className="material-library-heading"><div><h3>Material library</h3><p>Choose a category and apply a finish</p></div><label className="material-color-field" aria-label="Custom material color"><span>Color</span><input type="color" value={selectedItem.materialColor || '#b98b62'} onChange={(event) => updateFurniture(selectedItem.id, { materialColor: event.target.value })} /></label></div>
    <div className="material-category-tabs" role="tablist" aria-label="Material categories">{Object.keys(MATERIAL_LIBRARIES).map((category) => <button type="button" role="tab" aria-selected={activeCategory === category} key={category} className={activeCategory === category ? 'is-active' : ''} onClick={() => setActiveCategory(category)}>{MATERIAL_CATEGORY_LABELS[category]}</button>)}</div>
    <div className="material-thumbnail-grid">{activeMaterials.map((material) => <button type="button" key={material.name} className={`material-thumbnail ${selectedItem.materialTexture === material.texture ? 'is-selected' : ''}`} onClick={() => updateFurniture(selectedItem.id, { materialTexture: material.texture, materialColor: material.color })}><span className={`material-swatch ${material.swatch}`} aria-hidden="true" /><span>{material.name}</span></button>)}</div>
  </section>;
}

function StructureInspector({ item, selectedIds }) {
  const updateStructure = useStore((s) => s.updateStructureWithHistory);
  const updateStructureRaw = useStore((s) => s.updateStructure);
  const removeStructure = useStore((s) => s.removeStructure);
  const duplicateStructure = useStore((s) => s.duplicateStructure);
  const toggleLock = useStore((s) => s.toggleStructureLock);
  const updateVector = useCallback((key, index, value) => { if (!Number.isFinite(value) || item.isLocked) return; const next = [...item[key]]; next[index] = value; updateStructure(item.id, { [key]: next }); }, [item, updateStructure]);
  const updateDimension = (index, value) => { if (!Number.isFinite(value) || item.isLocked) return; const dimensions = [...item.dimensions]; dimensions[index] = Math.max(0.05, value); if (index === 1) { const position = [...item.position]; position[1] = dimensions[1] / 2; updateStructure(item.id, { dimensions, position }); } else updateStructure(item.id, { dimensions }); };
  const rotation = item.rotation.map((value) => value * 180 / Math.PI);
  return <aside className="intelli-selection-panel" id="inspector-panel" aria-label="Selected partition wall configuration"><header className="intelli-selection-head"><div><h2>{item.label} <span>(Selected)</span></h2><p>Layout structure · ID: {item.id.slice(0, 7).toUpperCase()}</p></div><button className="intelli-icon-button" aria-label="Close selection" onClick={() => useStore.getState().clearSelection()}><X size={20} /></button></header><div className="intelli-selection-content"><div className="intelli-object-card"><div className="intelli-object-thumb"><Move size={22} /></div><div><strong>{item.label}</strong><span>Editable layout object</span></div></div><div className="intelli-object-tabs"><button className="is-active">Transform</button><button>Details</button><button>Material</button></div><section className="intelli-transform-section"><h3>Position (m)</h3><div className="intelli-transform-grid">{['X', 'Y', 'Z'].map((axis, index) => <NumberField key={axis} label={axis} value={item.position[index]} disabled={item.isLocked} onChange={(value) => updateVector('position', index, value)} />)}</div></section><section className="intelli-transform-section"><h3>Rotation (°)</h3><div className="intelli-transform-grid">{['X', 'Y', 'Z'].map((axis, index) => <NumberField key={axis} label={axis} value={rotation[index]} disabled={item.isLocked} onChange={(value) => { const next = [...item.rotation]; next[index] = value * Math.PI / 180; updateStructure(item.id, { rotation: next }); }} />)}</div></section><section className="intelli-transform-section"><h3>Dimensions (m)</h3><div className="intelli-transform-grid">{[['Length', 0], ['Height', 1], ['Thickness', 2]].map(([label, index]) => <NumberField key={label} label={label} value={item.dimensions[index]} disabled={item.isLocked} onChange={(value) => updateDimension(index, value)} />)}</div></section><div className="intelli-selection-options"><div><span>{item.isLocked ? <Lock size={15} /> : <Unlock size={15} />} Lock</span><button className={`intelli-switch ${item.isLocked ? 'is-on' : ''}`} onClick={() => toggleLock(item.id)}><span /></button></div><div><span>Visibility</span><button className={`intelli-switch ${item.isVisible ? 'is-on' : ''}`} onClick={() => updateStructureRaw(item.id, { isVisible: !item.isVisible })}><span /></button></div></div><div className="intelli-selection-actions"><button onClick={() => duplicateStructure(item.id)}><Copy size={15} /> Duplicate</button><button className="danger" onClick={() => removeStructure(item.id)}><Trash2 size={15} /> Delete</button></div><button className="intelli-apply" onClick={() => updateStructureRaw(item.id, {})}>Apply Changes</button></div></aside>;
}

export default function Inspector() {
  const selectedIds = useStore((s) => s.selectedIds); const furniture = useStore((s) => s.furniture); const structures = useStore((s) => s.structures);
  const updateFurnitureWithHistory = useStore((s) => s.updateFurnitureWithHistory); const updateFurniture = useStore((s) => s.updateFurniture); const removeFurniture = useStore((s) => s.removeFurniture); const duplicateFurniture = useStore((s) => s.duplicateFurniture);
  const selectedStructure = selectedIds.length === 1 ? structures.find((item) => item.id === selectedIds[0]) : null; const selectedItem = selectedIds.length === 1 ? furniture.find((item) => item.id === selectedIds[0]) : null; const definition = selectedItem ? getFurnitureById(selectedItem.catalogItemId ?? selectedItem.registryId) : null;
  if (selectedStructure) return <StructureInspector item={selectedStructure} selectedIds={selectedIds} />;
  if (!selectedItem || !definition) return null;
  const updateTransform = (key, index, value) => { if (!Number.isFinite(value) || selectedItem.isLocked) return; const next = [...selectedItem[key]]; next[index] = value; updateFurnitureWithHistory(selectedItem.id, { [key]: next }); };
  const position = selectedItem.position || [0, 0, 0]; const rotation = selectedItem.rotation || [0, 0, 0]; const scale = selectedItem.scale || [1, 1, 1];
  return <aside className="intelli-selection-panel" id="inspector-panel" aria-label="Selected furniture configuration"><header className="intelli-selection-head"><div><h2>{definition.name} <span>(Selected)</span></h2><p>{definition.category.replace('-', ' ')} · ID: {selectedItem.id.slice(0, 7).toUpperCase()}</p></div><button className="intelli-icon-button" aria-label="Close selection" onClick={() => useStore.getState().clearSelection()}><X size={20} /></button></header><div className="intelli-selection-content"><div className="intelli-object-card"><div className="intelli-object-thumb"><Move size={22} /></div><div><strong>{definition.name}</strong><span>ID: {selectedItem.id.slice(0, 7).toUpperCase()}</span></div></div><div className="intelli-object-tabs"><button className="is-active">Transform</button><button>Details</button><button>Material</button></div><section className="intelli-transform-section"><h3>Position (m)</h3><div className="intelli-transform-grid">{['X', 'Y', 'Z'].map((axis, index) => <NumberField key={axis} label={axis} value={position[index]} onChange={(value) => updateTransform('position', index, value)} />)}</div></section><section className="intelli-transform-section"><h3>Rotation (°)</h3><div className="intelli-transform-grid">{['X', 'Y', 'Z'].map((axis, index) => <NumberField key={axis} label={axis} value={(rotation[index] * 180) / Math.PI} onChange={(value) => updateTransform('rotation', index, (value * Math.PI) / 180)} />)}</div></section><section className="intelli-transform-section"><h3>Scale</h3><div className="intelli-transform-grid">{['X', 'Y', 'Z'].map((axis, index) => <NumberField key={axis} label={axis} value={scale[index]} onChange={(value) => updateTransform('scale', index, value)} />)}</div></section><MaterialLibrary selectedItem={selectedItem} updateFurniture={updateFurnitureWithHistory} /><div className="intelli-selection-options"><div><span><Lock size={15} /> Lock Position</span><button className={`intelli-switch ${selectedItem.isLocked ? 'is-on' : ''}`} onClick={() => updateFurniture(selectedItem.id, { isLocked: !selectedItem.isLocked })}><span /></button></div></div><div className="intelli-selection-actions"><button onClick={() => duplicateFurniture(selectedIds)}><Copy size={15} /> Duplicate</button><button className="danger" onClick={() => removeFurniture(selectedIds)}><Trash2 size={15} /> Delete</button></div></div></aside>;
}
