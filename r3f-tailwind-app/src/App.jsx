import React, { useEffect, useState } from 'react';
import './App.css';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Inspector from './components/layout/Inspector';
import Toolbar from './components/layout/Toolbar';
import ConfigurationPanel from './components/layout/ConfigurationPanel';
import SceneCanvas from './components/canvas/SceneCanvas';
import Minimap from './components/ui/Minimap';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useAutosave from './hooks/useAutosave';
import { useDropTarget } from './hooks/useDragDrop';
import useStore from './store/useStore';
import { CAMERA_MODES } from './constants';
import useCatalog from './hooks/useCatalog';
import LandingPage from './pages/LandingPage.jsx';
import AuthPlaceholder from './pages/AuthPlaceholder.jsx';
import useAuthStore from './store/useAuthStore.js';
import {
  Box,
  ChevronDown,
  Expand,
  Grid2X2,
  Layers3,
  Lightbulb,
  Maximize2,
  MousePointer2,
  Move,
  Redo2,
  RotateCw,
  Ruler,
  Sun,
  Undo2,
} from 'lucide-react';
import Button from './components/ui/Button';
import Tabs from './components/ui/Tabs';
import Tooltip from './components/ui/Tooltip';

const RAIL_TOOLS = [
  { label: 'Select', icon: MousePointer2, mode: null },
  { label: 'Move', icon: Move, mode: 'translate' },
  { label: 'Rotate', icon: RotateCw, mode: 'rotate' },
  { label: 'Scale', icon: Maximize2, mode: 'scale' },
  { label: 'Measure', icon: Ruler, mode: null },
];

const DOCK_ACTIONS = [
  { label: 'Sunlight', icon: Sun },
  { label: 'Camera', icon: Box },
  { label: 'Environment', icon: Lightbulb },
  { label: 'Materials', icon: Grid2X2 },
  { label: 'View Modes', icon: Layers3 },
  { label: 'Presentation', icon: Expand },
];

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
  const openConfig = (section) => window.dispatchEvent(new CustomEvent('intelli:open-config', { detail: { section } }));
  const cycleCamera = () => { const modes = Object.keys(CAMERA_MODES); setCameraMode(modes[(modes.indexOf(cameraMode) + 1) % modes.length]); };

  const dockHandlers = {
    Sunlight: () => openConfig('Lighting'),
    Camera: cycleCamera,
    Environment: () => openConfig('Environment'),
    Materials: () => openConfig('Flooring'),
    'View Modes': () => setView(view === '3D View' ? 'Apartment Plan' : '3D View'),
    Presentation: () => document.documentElement.requestFullscreen?.(),
  };

  return <>
    <Tabs
      className="absolute z-[12] top-[18px] left-5 glass-panel !border-border !p-1"
      items={[{ id: '3D View', label: '3D View' }, { id: 'Apartment Plan', label: 'Apartment Plan' }, { id: 'Floor Plan', label: 'Floor Plan' }]}
      value={view}
      onChange={setView}
      size="sm"
    />

    <div className="absolute z-[12] top-[18px] right-[22px] flex gap-1.5">
      <Tooltip label="Undo" shortcut="Ctrl+Z">
        <Button variant="ghost" size="icon" icon={Undo2} onClick={undo} disabled={!history.length} aria-label="Undo" className="glass-panel h-9 w-9 !rounded-full" />
      </Tooltip>
      <Tooltip label="Redo" shortcut="Ctrl+Y">
        <Button variant="ghost" size="icon" icon={Redo2} onClick={redo} disabled={!future.length} aria-label="Redo" className="glass-panel h-9 w-9 !rounded-full" />
      </Tooltip>
      <Button
        variant="ghost"
        size="icon"
        icon={Sun}
        onClick={() => setLightPreset(lightPreset === 'night' ? 'midday' : 'night')}
        aria-label="Toggle sunlight"
        className="glass-panel h-9 w-9 !rounded-full text-accent-300"
      />
      <Button variant="ghost" size="sm" className="glass-panel !rounded-full">
        Shadows <ChevronDown size={14} className="ml-1" aria-hidden="true" />
      </Button>
    </div>

    <div className="absolute z-[12] top-[116px] left-5 flex flex-col gap-1 glass-panel p-1.5">
      {RAIL_TOOLS.map(({ label, icon, mode }, index) => {
        const isActive = mode ? transformMode === mode : index === 0;
        return (
          <Tooltip key={label} label={label} placement="right">
            <Button
              variant="ghost"
              size="icon"
              icon={icon}
              active={isActive}
              onClick={() => mode && selectedIds.length === 1 && setTransformMode(mode)}
              aria-label={label}
              className="!h-10 !w-10 flex-col gap-0.5 !rounded-md text-[9px] [&>svg]:size-[18px]"
            >
              <span className="text-[9px] leading-none">{label}</span>
            </Button>
          </Tooltip>
        );
      })}
    </div>

    <div className="absolute z-[12] bottom-[22px] left-1/2 -translate-x-1/2 flex gap-2 glass-panel px-2.5 py-1.5">
      {DOCK_ACTIONS.map(({ label, icon }) => {
        const isActive = label === 'Sunlight';
        return (
          <Button
            key={label}
            variant="ghost"
            size="icon"
            icon={icon}
            active={isActive}
            onClick={dockHandlers[label]}
            title={label === 'Camera' ? `Camera: ${CAMERA_MODES[cameraMode]?.label || 'Perspective'}` : undefined}
            aria-label={label}
            className="!h-14 !w-16 flex-col gap-1 !rounded-lg text-[9px] [&>svg]:size-5"
          >
            <span className="text-[9px] leading-none">{label}</span>
          </Button>
        );
      })}
    </div>

    {/* Zoom, fit-to-screen, and 2D/3D toggle are visual placeholders carried over
        unchanged — they had no onClick in the previous version either. */}
    <div className="absolute z-[12] left-5 bottom-[22px] flex items-center glass-panel overflow-hidden !p-0">
      <button className="grid h-9 w-9 place-items-center text-text-secondary hover:text-text-primary" aria-label="Zoom out">−</button>
      <span className="tabular grid h-9 w-12 place-items-center border-x border-border text-xs text-text-secondary">90%</span>
      <button className="grid h-9 w-9 place-items-center text-text-secondary hover:text-text-primary" aria-label="Zoom in">+</button>
    </div>
    <Button variant="ghost" size="sm" icon={Expand} className="absolute z-[12] left-[185px] bottom-[22px] glass-panel">
      Fit to Screen
    </Button>
    <div className="absolute z-[12] right-5 bottom-[22px] flex glass-panel overflow-hidden !p-0">
      <button className="h-9 min-w-10 px-3 text-xs text-text-secondary hover:text-text-primary">2D</button>
      <button className="h-9 min-w-10 px-3 text-xs font-medium text-accent-200 bg-accent-tint">3D</button>
      <button className="grid h-9 w-9 place-items-center text-text-secondary hover:text-text-primary" aria-label="Fullscreen">
        <Expand size={15} aria-hidden="true" />
      </button>
    </div>
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
