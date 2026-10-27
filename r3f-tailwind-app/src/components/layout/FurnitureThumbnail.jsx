import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function ThumbnailModel({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  return (
    <Bounds fit clip observe margin={1.25}>
      <primitive object={clonedScene} />
    </Bounds>
  );
}

function ThumbnailFallback() {
  return <div className="size-10 animate-pulse rounded-full bg-slate-300/60" aria-hidden="true" />;
}

export default function FurnitureThumbnail({ item }) {
  if (!item?.modelPath) return <ThumbnailFallback />;

  return (
    <div className="absolute inset-0" aria-label={`${item.name} preview`}>
      <Canvas
        orthographic
        camera={{ position: [2.8, 2.2, 3.2], zoom: 92, near: 0.01, far: 100 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, outputColorSpace: THREE.SRGBColorSpace }}
        onCreated={({ gl }) => {
          gl.setClearColor('#e9e6df', 1);
        }}
      >
        <ambientLight intensity={1.6} color="#fffaf2" />
        <directionalLight position={[3, 5, 4]} intensity={2.4} color="#fff3dc" />
        <directionalLight position={[-3, 2, -2]} intensity={0.8} color="#dce8ff" />
        <Suspense fallback={null}>
          <ThumbnailModel modelPath={item.modelPath} />
          <Environment preset="studio" environmentIntensity={0.45} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded border border-slate-500/70 bg-slate-950/80 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">
        Preview
      </span>
    </div>
  );
}
