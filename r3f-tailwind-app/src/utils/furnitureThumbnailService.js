import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Cache for generated data URLs: item.id -> dataUrl string
const thumbnailCache = new Map();
const subscribers = new Map();
const queue = [];
let isProcessing = false;

// Singleton offscreen renderer components
let renderer = null;
let scene = null;
let camera = null;
let loader = null;

function initThumbnailRenderer() {
  if (typeof window === 'undefined') return false;
  if (renderer) return true;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 220;

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(220, 220);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    scene = new THREE.Scene();

    // Studio lighting setup
    const ambLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff6e8, 2.4);
    dirLight1.position.set(2.5, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xdbeafe, 1.0);
    dirLight2.position.set(-3, 2, -2);
    scene.add(dirLight2);

    const groundBounce = new THREE.DirectionalLight(0xedd4b6, 0.6);
    groundBounce.position.set(0, -3, 1);
    scene.add(groundBounce);

    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.set(2.2, 1.6, 2.5);
    camera.lookAt(0, 0.05, 0);

    loader = new GLTFLoader();
    return true;
  } catch (err) {
    console.warn('Failed to initialize thumbnail renderer:', err);
    return false;
  }
}

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  if (!initThumbnailRenderer()) return;

  isProcessing = true;
  const item = queue.shift();

  try {
    if (thumbnailCache.has(item.id)) {
      notifySubscribers(item.id, thumbnailCache.get(item.id));
      isProcessing = false;
      setTimeout(processQueue, 8);
      return;
    }

    if (!item.modelPath) {
      isProcessing = false;
      setTimeout(processQueue, 8);
      return;
    }

    const gltf = await loader.loadAsync(item.modelPath);
    const model = gltf.scene.clone();

    // Compute bounding box and normalize scale & center
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const targetScale = 1.45 / maxDim;

    model.scale.multiplyScalar(targetScale);
    model.position.set(-center.x * targetScale, -center.y * targetScale, -center.z * targetScale);

    // Apply custom default rotation if specified
    if (item.defaultRotation) {
      model.rotation.set(
        item.defaultRotation[0] || 0,
        (item.defaultRotation[1] || 0) + 0.15,
        item.defaultRotation[2] || 0
      );
    } else {
      model.rotation.y = 0.2;
    }

    scene.add(model);
    renderer.render(scene, camera);

    const dataUrl = renderer.domElement.toDataURL('image/webp', 0.85);
    thumbnailCache.set(item.id, dataUrl);

    // Remove model from scene and clean up
    scene.remove(model);
    notifySubscribers(item.id, dataUrl);
  } catch (err) {
    console.warn(`Could not render thumbnail for ${item.id}:`, err);
  } finally {
    isProcessing = false;
    setTimeout(processQueue, 16);
  }
}

function notifySubscribers(itemId, dataUrl) {
  const cbs = subscribers.get(itemId);
  if (cbs) {
    cbs.forEach((cb) => {
      try {
        cb(dataUrl);
      } catch (e) {
        // ignore subscriber errors
      }
    });
    subscribers.delete(itemId);
  }
}

export function getCachedThumbnail(itemId) {
  return thumbnailCache.get(itemId) || null;
}

export function requestFurnitureThumbnail(item, callback) {
  if (!item || !item.id) return () => {};

  if (thumbnailCache.has(item.id)) {
    callback(thumbnailCache.get(item.id));
    return () => {};
  }

  if (!subscribers.has(item.id)) {
    subscribers.set(item.id, new Set());
  }
  subscribers.get(item.id).add(callback);

  if (!queue.some((q) => q.id === item.id)) {
    queue.push(item);
    processQueue();
  }

  return () => {
    const set = subscribers.get(item.id);
    if (set) set.delete(callback);
  };
}
