import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useState, useEffect } from 'react';

const thumbnailCache = new Map();
const pendingPromises = new Map();
let sharedRenderer = null;
let sharedScene = null;
let sharedCamera = null;
let gltfLoader = null;

function initOffscreenPipeline() {
  if (typeof document === 'undefined') return null;
  if (sharedRenderer) return { renderer: sharedRenderer, scene: sharedScene, camera: sharedCamera };

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  try {
    sharedRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
  } catch (err) {
    console.warn('Could not initialize offscreen thumbnail renderer:', err);
    return null;
  }

  sharedRenderer.setSize(256, 256);
  sharedRenderer.setPixelRatio(1);
  sharedRenderer.setClearColor(0x000000, 0);
  sharedRenderer.outputColorSpace = THREE.SRGBColorSpace;

  sharedScene = new THREE.Scene();

  const ambient = new THREE.AmbientLight(0xffffff, 2.2);
  const dir1 = new THREE.DirectionalLight(0xfff6e5, 2.6);
  dir1.position.set(3, 5, 4);
  const dir2 = new THREE.DirectionalLight(0xd8e6ff, 1.2);
  dir2.position.set(-3, 2, -2);
  const rim = new THREE.DirectionalLight(0xffffff, 1.0);
  rim.position.set(0, 4, -4);

  sharedScene.add(ambient);
  sharedScene.add(dir1);
  sharedScene.add(dir2);
  sharedScene.add(rim);

  const aspect = 1;
  const d = 1.45;
  sharedCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.01, 100);
  sharedCamera.position.set(2.6, 2.0, 2.8);
  sharedCamera.lookAt(0, 0, 0);

  gltfLoader = new GLTFLoader();

  return { renderer: sharedRenderer, scene: sharedScene, camera: sharedCamera };
}

let renderQueue = Promise.resolve();

export function getFurnitureThumbnail(modelPath) {
  if (!modelPath) return Promise.resolve(null);

  if (thumbnailCache.has(modelPath)) {
    return Promise.resolve(thumbnailCache.get(modelPath));
  }

  try {
    const sessionCached = sessionStorage.getItem('thumb_' + modelPath);
    if (sessionCached) {
      thumbnailCache.set(modelPath, sessionCached);
      return Promise.resolve(sessionCached);
    }
  } catch (_) {}

  if (pendingPromises.has(modelPath)) {
    return pendingPromises.get(modelPath);
  }

  const promise = new Promise((resolve) => {
    renderQueue = renderQueue.then(async () => {
      try {
        const pipeline = initOffscreenPipeline();
        if (!pipeline) {
          resolve(null);
          return;
        }

        const gltf = await new Promise((res, rej) => {
          gltfLoader.load(modelPath, res, undefined, rej);
        });

        const root = gltf.scene;
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;

        root.position.sub(center);
        root.scale.setScalar(1.95 / maxDim);

        pipeline.scene.add(root);
        pipeline.renderer.render(pipeline.scene, pipeline.camera);

        const dataUrl = pipeline.renderer.domElement.toDataURL('image/webp', 0.85);
        pipeline.scene.remove(root);

        root.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m?.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });

        thumbnailCache.set(modelPath, dataUrl);
        try {
          sessionStorage.setItem('thumb_' + modelPath, dataUrl);
        } catch (_) {}

        resolve(dataUrl);
      } catch (error) {
        console.warn('Failed to render thumbnail for ' + modelPath, error);
        resolve(null);
      } finally {
        pendingPromises.delete(modelPath);
      }
    });
  });

  pendingPromises.set(modelPath, promise);
  return promise;
}

export function useFurnitureThumbnail(item) {
  const modelPath = item?.modelPath;
  const [thumbnail, setThumbnail] = useState(() => (modelPath ? thumbnailCache.get(modelPath) || null : null));

  useEffect(() => {
    if (!modelPath) return;
    if (thumbnailCache.has(modelPath)) {
      setThumbnail(thumbnailCache.get(modelPath));
      return;
    }

    let active = true;
    getFurnitureThumbnail(modelPath).then((url) => {
      if (active && url) {
        setThumbnail(url);
      }
    });

    return () => {
      active = false;
    };
  }, [modelPath]);

  return thumbnail;
}
