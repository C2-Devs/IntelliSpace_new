import React, { useCallback, useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { getFurnitureById } from '../../data/furnitureRegistry';
import { Copy, Lock, Move, Trash2, Unlock, X } from 'lucide-react';

function NumberField({ label, value, onChange, disabled = false }) {
  const [draft, setDraft] = useState(String(Number.isFinite(Number(value)) ? value : 0));
  useEffect(() => {
    if (document.activeElement?.type !== 'number') setDraft(String(Number.isFinite(Number(value)) ? value : 0));
  }, [value]);
  const commit = () => {
    const parsed = Number(draft);
    if (Number.isFinite(parsed)) {
      onChange(parsed);
      setDraft(String(parsed));
    } else {
      setDraft(String(Number.isFinite(Number(value)) ? value : 0));
    }
  };
  return <label className="intelli-transform-field"><span>{label}</span><input type="number" inputMode="decimal" step="0.01" value={draft} disabled={disabled} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }} /></label>;
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
  const selectedStructure = selectedIds.length === 1 ? structures.find((item) => item.id === selectedIds[0]) : null; const selectedItem = selectedIds.length === 1 ? furniture.find((item) => item.id === selectedIds[0]) : null; const registryDefinition = selectedItem
    ? getFurnitureById(selectedItem.catalogItemId ?? selectedItem.registryId)
    : null;
  const isUploadedCustom = Boolean(
    selectedItem &&
    (selectedItem.workspaceId || selectedItem.custom || selectedItem.backendCatalogItemId)
  );
  const definition = selectedItem && (registryDefinition || isUploadedCustom)
    ? {
        ...(registryDefinition || {}),
        ...(isUploadedCustom ? {
          id: selectedItem.catalogItemId ?? selectedItem.registryId,
          name: selectedItem.name ?? registryDefinition?.name ?? 'Custom furniture',
          category: selectedItem.category ?? registryDefinition?.category ?? 'decor',
          description: selectedItem.description ?? registryDefinition?.description ?? '',
          thumbnailPath: selectedItem.thumbnailPath ?? registryDefinition?.thumbnailPath ?? null,
          modelPath: selectedItem.modelPath ?? registryDefinition?.modelPath ?? null,
        } : {}),
      }
    : null;
  if (selectedStructure) return <StructureInspector item={selectedStructure} selectedIds={selectedIds} />;
  if (!selectedItem || !definition) return null;
  const updateTransform = (key, index, value) => { if (!Number.isFinite(value) || selectedItem.isLocked) return; const next = [...selectedItem[key]]; next[index] = value; updateFurnitureWithHistory(selectedItem.id, { [key]: next }); };
  const position = selectedItem.position || [0, 0, 0]; const rotation = selectedItem.rotation || [0, 0, 0]; const scale = selectedItem.scale || [1, 1, 1];
  return <aside className="intelli-selection-panel" id="inspector-panel" aria-label="Selected furniture configuration"><header className="intelli-selection-head"><div><h2>{definition.name} <span>(Selected)</span></h2><p>{definition.category.replace('-', ' ')} · ID: {selectedItem.id.slice(0, 7).toUpperCase()}</p></div><button className="intelli-icon-button" aria-label="Close selection" onClick={() => useStore.getState().clearSelection()}><X size={20} /></button></header><div className="intelli-selection-content"><div className="intelli-object-card"><div className="intelli-object-thumb"><Move size={22} /></div><div><strong>{definition.name}</strong><span>ID: {selectedItem.id.slice(0, 7).toUpperCase()}</span>{definition.description ? <p className="intelli-object-description">{definition.description}</p> : null}</div></div><div className="intelli-object-tabs"><button className="is-active">Transform</button><button>Details</button><button>Material</button></div><section className="intelli-transform-section"><h3>Position (m)</h3><div className="intelli-transform-grid">{['X', 'Y', 'Z'].map((axis, index) => <NumberField key={axis} label={axis} value={position[index]} onChange={(value) => updateTransform('position', index, value)} />)}</div></section><section className="intelli-transform-section"><h3>Rotation (°)</h3><div className="intelli-transform-grid">{['X', 'Y', 'Z'].map((axis, index) => <NumberField key={axis} label={axis} value={(rotation[index] * 180) / Math.PI} onChange={(value) => updateTransform('rotation', index, (value * Math.PI) / 180)} />)}</div></section><section className="intelli-transform-section"><h3>Scale</h3><div className="intelli-transform-grid">{['X', 'Y', 'Z'].map((axis, index) => <NumberField key={axis} label={axis} value={scale[index]} onChange={(value) => updateTransform('scale', index, value)} />)}</div></section><section className="intelli-transform-section furniture-material-section"><h3>Material appearance</h3><div className="material-color-row"><label className="material-color-field"><span>Custom Color</span><input type="color" value={selectedItem.materialColor || '#b98b62'} onChange={(event) => updateFurnitureWithHistory(selectedItem.id, { materialColor: event.target.value, hasCustomMaterial: true })} /></label>{selectedItem.hasCustomMaterial ? <button type="button" className="material-reset-btn" onClick={() => updateFurnitureWithHistory(selectedItem.id, { hasCustomMaterial: false, materialColor: null, materialTexture: null })}>Reset to Original</button> : null}</div><div className="material-choice-grid"><button type="button" className={!selectedItem.hasCustomMaterial ? 'is-selected' : ''} onClick={() => updateFurnitureWithHistory(selectedItem.id, { hasCustomMaterial: false, materialColor: null, materialTexture: null })}>Original</button>{['Solid', 'Wood grain', 'Linen', 'Velvet', 'Speckle'].map((texture) => <button type="button" key={texture} className={selectedItem.hasCustomMaterial && (selectedItem.materialTexture === texture || (!selectedItem.materialTexture && texture === 'Solid')) ? 'is-selected' : ''} onClick={() => updateFurnitureWithHistory(selectedItem.id, { materialTexture: texture, hasCustomMaterial: true, materialColor: selectedItem.materialColor || '#b98b62' })}>{texture}</button>)}</div></section><div className="intelli-selection-options"><div><span><Lock size={15} /> Lock Position</span><button className={`intelli-switch ${selectedItem.isLocked ? 'is-on' : ''}`} onClick={() => updateFurniture(selectedItem.id, { isLocked: !selectedItem.isLocked })}><span /></button></div></div><div className="intelli-selection-actions"><button onClick={() => duplicateFurniture(selectedIds)}><Copy size={15} /> Duplicate</button><button className="danger" onClick={() => removeFurniture(selectedIds)}><Trash2 size={15} /> Delete</button></div></div></aside>;
}
