import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { useState, useEffect } from 'react';

const thumbnailCache = new Map();
const pendingPromises = new Map();
let sharedRenderer = null;
let sharedScene = null;
let sharedCamera = null;
let gltfLoader = null;
let dracoLoader = null;

function initOffscreenPipeline() {
  if (typeof document === 'undefined') return null;
  if (sharedRenderer && gltfLoader) {
    return { renderer: sharedRenderer, scene: sharedScene, camera: sharedCamera };
  }

  if (!sharedRenderer) {
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
  }

  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    gltfLoader.setDRACOLoader(dracoLoader);
    if (typeof MeshoptDecoder === 'function' || typeof MeshoptDecoder === 'object') {
      gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    }
  }

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

  // Fetch model concurrently across network; queue only the rapid WebGL draw pass
  const promise = (async () => {
    try {
      const pipeline = initOffscreenPipeline();
      if (!pipeline || !gltfLoader) return null;

      const gltf = await new Promise((res, rej) => {
        gltfLoader.load(modelPath, res, undefined, rej);
      });

      return await (renderQueue = renderQueue.catch(() => {}).then(() => {
        const pipe = initOffscreenPipeline();
        if (!pipe) return null;

        const root = gltf.scene;
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;

        root.position.sub(center);
        root.scale.setScalar(2.1 / maxDim);

        pipe.scene.add(root);
        pipe.renderer.render(pipe.scene, pipe.camera);

        const dataUrl = pipe.renderer.domElement.toDataURL('image/webp', 0.88);
        pipe.scene.remove(root);

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

        return dataUrl;
      }));
    } catch (error) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn('Failed to render thumbnail for ' + modelPath, error);
      }
      return null;
    } finally {
      pendingPromises.delete(modelPath);
    }
  })();

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
    let retryTimer = null;

    const requestThumb = (attempt = 0) => {
      getFurnitureThumbnail(modelPath).then((url) => {
        if (!active) return;
        if (url) {
          setThumbnail(url);
        } else if (attempt < 2) {
          retryTimer = setTimeout(() => {
            if (active) requestThumb(attempt + 1);
          }, 1200 * (attempt + 1));
        }
      });
    };

    requestThumb(0);

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [modelPath]);

  return thumbnail;
}
