// Vorschaubilder für Teile und Vorlagen – ein einziger, gemeinsam genutzter Renderer
import * as THREE from '../../vendor/three.module.min.js';
import { buildBrickObject } from './scene.js';
import { PH } from './geom.js';
import { PART_MAP } from './catalog.js';

let R = null, S = null, C = null;
const cache = new Map();

function setup() {
  if (R) return;
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1);
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  S = new THREE.Scene();
  S.add(new THREE.HemisphereLight('#ffffff', '#8d94a0', 1.5));
  const d = new THREE.DirectionalLight('#ffffff', 2.0); d.position.set(4, 8, 6); S.add(d);
  C = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
}

function render(group, size) {
  setup();
  R.setSize(size, size, false);
  S.add(group);
  const box = new THREE.Box3().setFromObject(group);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const dir = new THREE.Vector3(1, 0.8, 1.15).normalize();
  const dist = sphere.radius / Math.sin((C.fov * Math.PI / 180) / 2) * 1.02;
  C.position.copy(sphere.center).add(dir.multiplyScalar(dist));
  C.lookAt(sphere.center);
  C.near = dist / 50; C.far = dist * 4; C.updateProjectionMatrix();
  R.render(S, C);
  const url = R.domElement.toDataURL('image/png');
  S.remove(group);
  return url;
}

export function partThumb(t, c, size = 112, useSuggest = false) {
  if (useSuggest) { const p = PART_MAP.get(t); if (p && p.suggest) c = p.suggest; }
  const key = `${t}|${c}|${size}`;
  if (cache.has(key)) return cache.get(key);
  const url = render(buildBrickObject(t, c, false, false), size);
  cache.set(key, url);
  return url;
}

export function bricksThumb(bricks, size = 220) {
  const g = new THREE.Group();
  for (const b of bricks) {
    const o = buildBrickObject(b.t, b.c, false, false);
    o.position.set(b.x, b.y * PH, b.z); o.rotation.y = b.r * Math.PI / 4;
    g.add(o);
  }
  return render(g, size);
}
