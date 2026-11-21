// 3D-Szene: Rendering, Kamera, Grundplatte, Steine, Vorschau, Hervorhebung
import * as THREE from '../../vendor/three.module.min.js';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { RoomEnvironment } from '../../vendor/RoomEnvironment.js';
import { partGeometry, colorInfo, FIXED, partHeight } from './catalog.js';
import { PH } from './geom.js';
import { aabb } from './model.js';

const matCache = new Map();
function makeMaterial(info, ghost = false) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(info.hex),
    roughness: info.roughness ?? 0.42,
    metalness: info.metalness ?? 0.0,
  });
  if (info.glow) { m.emissive = new THREE.Color(info.hex); m.emissiveIntensity = info.glow; }
  const op = info.opacity ?? 1;
  if (op < 1 || ghost) {
    m.transparent = true; m.opacity = ghost ? Math.min(op, 0.55) : op; m.depthWrite = !ghost && op > 0.9;
  }
  return m;
}
export function materialFor(key, colorId, ghost = false) {
  const ck = (key === 'main' ? 'c:' + colorId : 'f:' + key) + (ghost ? ':g' : '');
  if (matCache.has(ck)) return matCache.get(ck);
  const info = key === 'main' ? colorInfo(colorId) : (FIXED[key] || FIXED.black);
  const m = makeMaterial(info, ghost);
  matCache.set(ck, m);
  return m;
}

const edgeCache = new Map();
const edgeMat = new THREE.LineBasicMaterial({ color: '#0b0d10', transparent: true, opacity: 0.2, depthWrite: false });
export const renderOptions = { edges: true };
function edgesFor(t) {
  if (edgeCache.has(t)) return edgeCache.get(t);
  const list = partGeometry(t).filter(p => p.mat === 'main' || p.mat === 'white' || p.mat === 'rim').map(p => new THREE.EdgesGeometry(p.geo, 38));
  let geo = null;
  if (list.length === 1) geo = list[0];
  else if (list.length > 1) {
    const arr = []; for (const g of list) arr.push(...g.attributes.position.array);
    geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  }
  edgeCache.set(t, geo);
  return geo;
}

export function buildBrickObject(t, c, ghost = false, shadows = true) {
  const group = new THREE.Group();
  for (const { mat, geo } of partGeometry(t)) {
    const material = materialFor(mat, c, ghost);
    const mesh = new THREE.Mesh(geo, material);
    if (!ghost && shadows) { mesh.castShadow = !material.transparent; mesh.receiveShadow = true; }
    group.add(mesh);
  }
  if (!ghost && renderOptions.edges) {
    const info = colorInfo(c);
    const eg = edgesFor(t);
    if (eg && !(info.opacity < 1)) { const l = new THREE.LineSegments(eg, edgeMat); l.raycast = () => {}; group.add(l); }
  }
  return group;
}

export class Scene3D {
  constructor(container, settings) {
    this.container = container;
    this.settings = settings;
    this.bricks = [];
    this.dirty = true;
    this.hidden = new Set();           // IDs, die ausgeblendet sind (Anleitung / Ebenen)
    this.levelLimit = Infinity;

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = settings.shadows;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(r.domElement);
    r.domElement.setAttribute('aria-label', 'Baufläche');

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#e9ecf1');
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1600);
    this.controls = new OrbitControls(this.camera, r.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.12, maxPolarAngle: Math.PI / 2 - 0.03, minDistance: 4, maxDistance: 160, screenSpacePanning: true });
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.addEventListener('change', () => { this.dirty = true; });

    // Licht
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#9aa1ad', 0.8));
    const sun = this.sun = new THREE.DirectionalLight('#ffffff', 2.1);
    sun.position.set(18, 34, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    this.scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight('#dfe7ff', 0.55); fill.position.set(-20, 12, -14); this.scene.add(fill);

    this.world = new THREE.Group(); this.scene.add(this.world);
    this.helpers = new THREE.Group(); this.scene.add(this.helpers);

    this.raycaster = new THREE.Raycaster();
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ visible: false }));
    this.scene.add(this.ground);

    this.buildPlate(settings.plate, settings.plateColor);
    this.setView('iso', false);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
    this.animations = [];
    const loop = (t) => {
      requestAnimationFrame(loop);
      const moved = this.controls.update();
      if (moved || this.dirty) this.followShadow();
      if (this.animations.length) { this.stepAnimations(t); this.dirty = true; }
      if (moved || this.dirty) { this.renderer.render(this.scene, this.camera); this.dirty = false; }
    };
    requestAnimationFrame(loop);
  }

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  buildPlate(size, colorHex) {
    if (this.plateGroup) { this.scene.remove(this.plateGroup); this.plateGroup.traverse(o => { o.geometry?.dispose(); if (o.material?.map) o.material.map.dispose(); }); }
    const g = this.plateGroup = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex), roughness: 0.6 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(size, 0.3, size), mat);
    base.position.y = -0.15; base.receiveShadow = true; g.add(base);
    if (size <= 64) {
      const seg = size <= 32 ? 14 : 10;
      const studGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.14, seg, 1, true); studGeo.translate(0, 0.07, 0);
      const cap = new THREE.CircleGeometry(0.29, seg); cap.rotateX(-Math.PI / 2); cap.translate(0, 0.14, 0);
      for (const geo of [studGeo, cap]) {
        const inst = new THREE.InstancedMesh(geo, mat, size * size);
        const m = new THREE.Matrix4(); let i = 0;
        for (let x = 0; x < size; x++) for (let z = 0; z < size; z++) { m.makeTranslation(-size / 2 + 0.5 + x, 0, -size / 2 + 0.5 + z); inst.setMatrixAt(i++, m); }
        inst.receiveShadow = true; g.add(inst);
      }
    } else {
      // Große Flächen: Noppen als Textur, damit es flüssig bleibt
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d');
      x.fillStyle = '#d9d9d9'; x.fillRect(0, 0, 64, 64);
      x.strokeStyle = 'rgba(0,0,0,0.10)'; x.lineWidth = 1; x.strokeRect(0.5, 0.5, 63, 63);
      const grd = x.createRadialGradient(27, 26, 3, 32, 32, 20);
      grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.7, '#efefef'); grd.addColorStop(1, '#c4c4c4');
      x.fillStyle = 'rgba(0,0,0,0.28)'; x.beginPath(); x.arc(35, 36, 19, 0, Math.PI * 2); x.fill();
      x.fillStyle = grd; x.beginPath(); x.arc(32, 32, 18.5, 0, Math.PI * 2); x.fill();
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(size, size); tex.anisotropy = 8;
      const top = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex), map: tex, roughness: 0.6 }));
      top.position.y = 0.002; top.receiveShadow = true; g.add(top);
    }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.12 }));
    floor.position.y = -0.3; floor.receiveShadow = true; g.add(floor);
    this.scene.add(g);
    this.plateSize = size;
    this.controls.maxDistance = Math.max(160, size * 2.6);
    this.shadowHalf = Math.min(size * 0.75 + 6, 46);
    const sc = this.sun.shadow.camera;
    Object.assign(sc, { left: -this.shadowHalf, right: this.shadowHalf, top: this.shadowHalf, bottom: -this.shadowHalf, near: 1, far: 260 });
    sc.updateProjectionMatrix();
    this.shadowKey = null; this.followShadow();
    this.dirty = true;
  }

  // Schattenbereich wandert mit dem Blickpunkt – scharfe Schatten auch auf großen Flächen
  followShadow() {
    const t = this.controls.target, half = this.plateSize / 2, sh = this.shadowHalf || 30;
    const cx = Math.round(Math.max(-half + sh * 0.6, Math.min(half - sh * 0.6, t.x)) / 4) * 4;
    const cz = Math.round(Math.max(-half + sh * 0.6, Math.min(half - sh * 0.6, t.z)) / 4) * 4;
    const key = cx + ',' + cz;
    if (key === this.shadowKey) return;
    this.shadowKey = key;
    this.sun.position.set(cx + 36, 68, cz + 44);
    this.sun.target.position.set(cx, 0, cz);
    this.sun.target.updateMatrixWorld();
  }

  setShadows(on) {
    this.renderer.shadowMap.enabled = on;
    this.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    this.dirty = true;
  }

  setView(mode, animate = true) {
    const target = new THREE.Vector3(0, 0, 0);
    const box = this.modelBox();
    let dist = Math.max(this.plateSize * 0.95, 18);
    if (box) { box.getCenter(target); target.y = Math.min(target.y, 6); dist = Math.max(box.getSize(new THREE.Vector3()).length() * 1.75, 16); }
    if (mode === 'fit' && !box) mode = 'iso';
    const dirs = { iso: [1, 0.85, 1.05], top: [0.0001, 1, 0.0001], front: [0, 0.32, 1], side: [1, 0.32, 0], fit: null };
    let dir;
    if (mode === 'fit') dir = this.camera.position.clone().sub(this.controls.target).normalize();
    else dir = new THREE.Vector3(...dirs[mode]).normalize();
    if (!box && mode !== 'fit') dist = this.plateSize * 1.4;
    const pos = target.clone().add(dir.multiplyScalar(dist));
    if (!animate) { this.camera.position.copy(pos); this.controls.target.copy(target); this.controls.update(); this.dirty = true; return; }
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone();
    this.animate(320, k => {
      const e = 1 - Math.pow(1 - k, 3);
      this.camera.position.lerpVectors(p0, pos, e);
      this.controls.target.lerpVectors(t0, target, e);
    });
  }

  animate(ms, fn, done) { this.animations.push({ start: performance.now(), ms, fn, done }); this.dirty = true; }
  stepAnimations(t) {
    const now = performance.now();
    this.animations = this.animations.filter(a => {
      const k = Math.min(1, (now - a.start) / a.ms);
      a.fn(k);
      if (k >= 1) { a.done?.(); return false; }
      return true;
    });
  }

  // --- Steine: gleiche Teile in gleicher Farbe werden als Instanzen gezeichnet ---
  sync(bricks) { this.bricks = bricks; this.rebuild(); }
  applyVisibility() { this.rebuild(); }

  rebuild() {
    const bricks = this.bricks || [];
    const visible = bricks.filter(b => !this.hidden.has(b.id) && b.y < this.levelLimit);
    this.visibleBricks = visible;
    this.byId = new Map(bricks.map(b => [b.id, b]));
    const groups = new Map();
    for (const b of visible) { const k = b.t + '|' + b.c; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(b); }
    this.buckets ??= new Map();
    const drop = bk => { for (const m of bk.meshes) { this.world.remove(m); m.dispose(); } if (bk.edges) { this.world.remove(bk.edges); bk.edges.geometry.dispose(); } };
    for (const [k, bk] of this.buckets) if (!groups.has(k)) { drop(bk); this.buckets.delete(k); }
    const edgesOn = renderOptions.edges && visible.length <= 12000;
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
    for (const [k, list] of groups) {
      let bk = this.buckets.get(k);
      // unverändert? dann nichts tun
      if (bk && bk.list && bk.list.length === list.length && bk.edgesOn === edgesOn && list.every((b, i) => b === bk.list[i])) continue;
      if (!bk || bk.cap < list.length) {
        if (bk) drop(bk);
        const [t, c] = k.split('|');
        const cap = Math.max(8, 1 << Math.ceil(Math.log2(list.length)));
        bk = { cap, ids: [], meshes: [], t, c };
        for (const { mat, geo } of partGeometry(t)) {
          const material = materialFor(mat, c, false);
          const im = new THREE.InstancedMesh(geo, material, cap);
          im.castShadow = !material.transparent; im.receiveShadow = true;
          im.userData.bucket = bk;
          this.world.add(im); bk.meshes.push(im);
        }
        this.buckets.set(k, bk);
      }
      bk.list = list; bk.ids = list.map(b => b.id); bk.edgesOn = edgesOn;
      list.forEach((b, i) => {
        P.set(b.x, b.y * PH, b.z); Q.setFromAxisAngle(UP, b.r * Math.PI / 4); M.compose(P, Q, S);
        for (const m of bk.meshes) m.setMatrixAt(i, M);
      });
      for (const m of bk.meshes) { m.count = list.length; m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.computeBoundingBox?.(); }
      this.bucketEdges(bk, list, edgesOn);
    }
    this.dirty = true;
  }

  bucketEdges(bk, list, on) {
    if (bk.edges) { this.world.remove(bk.edges); bk.edges.geometry.dispose(); bk.edges = null; }
    if (!on || colorInfo(bk.c).opacity < 1) return;
    const eg = edgesFor(bk.t); if (!eg) return;
    const arr = eg.attributes.position.array;
    const out = new Float32Array(arr.length * list.length); let o = 0;
    for (const b of list) {
      const a = b.r * Math.PI / 4, cs = Math.cos(a), sn = Math.sin(a), ty = b.y * PH;
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i], y = arr[i + 1], z = arr[i + 2];
        out[o++] = x * cs + z * sn + b.x; out[o++] = y + ty; out[o++] = -x * sn + z * cs + b.z;
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(out, 3));
    bk.edges = new THREE.LineSegments(geo, edgeMat); bk.edges.raycast = () => {};
    this.world.add(bk.edges);
  }

  // Kanten an/aus: alles neu aufbauen
  refreshAll() { if (this.buckets) for (const bk of this.buckets.values()) bk.list = null; this.rebuild(); }

  modelBox() {
    const list = this.visibleBricks || [];
    if (!list.length) return null;
    const box = new THREE.Box3();
    for (const b of list) { const a = aabb(b); box.expandByPoint(new THREE.Vector3(a.x0, a.y0 * PH, a.z0)); box.expandByPoint(new THREE.Vector3(a.x1, a.y1 * PH, a.z1)); }
    return box;
  }

  // --- Vorschau ------------------------------------------------------------
  setPreview(payload) {
    if (this.preview) { this.helpers.remove(this.preview); this.preview = null; }
    if (!payload) { this.dirty = true; return; }
    const g = new THREE.Group();
    for (const m of payload.members) {
      const o = buildBrickObject(m.t, m.c, true, false);
      o.position.set(m.dx, m.dy * PH, m.dz);
      o.rotation.y = m.r * Math.PI / 4;
      g.add(o);
    }
    g.visible = false;
    this.preview = g; this.helpers.add(g); this.dirty = true;
  }
  movePreview(x, y, z, visible = true) {
    if (!this.preview) return;
    this.preview.position.set(x, y * PH, z);
    this.preview.visible = visible;
    this.dirty = true;
  }
  hidePreview() { if (this.preview && this.preview.visible) { this.preview.visible = false; this.dirty = true; } }

  // --- Hervorhebung (Rahmen) ----------------------------------------------
  setOutlines(key, bricks, color) {
    this.outlines ??= {};
    if (this.outlines[key]) { this.helpers.remove(this.outlines[key]); this.outlines[key].geometry.dispose(); this.outlines[key] = null; }
    if (!bricks || !bricks.length) { this.dirty = true; return; }
    const pos = [];
    for (const b of bricks) {
      const a = aabb(b), p = 0.04;
      const x0 = a.x0 - p, x1 = a.x1 + p, y0 = a.y0 * PH - p, y1 = a.y1 * PH + p + 0.18, z0 = a.z0 - p, z1 = a.z1 + p;
      const c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
      for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) pos.push(...c[i], ...c[j]);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95 }));
    line.renderOrder = 10;
    this.outlines[key] = line; this.helpers.add(line); this.dirty = true;
  }

  // --- Treffer unter dem Zeiger ---------------------------------------------
  pick(ndc) {
    this.raycaster.setFromCamera(ndc, this.camera);
    const targets = [];
    for (const bk of (this.buckets || new Map()).values()) targets.push(...bk.meshes);
    const hits = this.raycaster.intersectObjects(targets, false);
    for (const h of hits) {
      const bk = h.object.userData.bucket; const id = bk && bk.ids[h.instanceId];
      if (!id) continue;
      const b = this.byId.get(id);
      const n = h.face ? h.face.normal.clone() : new THREE.Vector3(0, 1, 0);
      if (b) n.applyAxisAngle(new THREE.Vector3(0, 1, 0), b.r * Math.PI / 4);
      return { type: 'brick', id, point: h.point, normal: n };
    }
    const g = this.raycaster.intersectObject(this.ground, false);
    if (g.length) {
      const half = this.plateSize / 2;
      const p = g[0].point;
      const inside = Math.abs(p.x) <= half && Math.abs(p.z) <= half;
      return { type: 'ground', point: p, normal: new THREE.Vector3(0, 1, 0), inside };
    }
    return null;
  }

  ndcFromEvent(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  // Kamerarichtung als Rasterachse (für Pfeiltasten)
  cameraAxes() {
    const f = new THREE.Vector3(); this.camera.getWorldDirection(f); f.y = 0;
    if (f.lengthSq() < 1e-6) f.set(0, 0, -1);
    f.normalize();
    const snap = v => Math.abs(v.x) > Math.abs(v.z) ? [Math.sign(v.x), 0] : [0, Math.sign(v.z)];
    const fwd = snap(f);
    return { fwd, right: [-fwd[1], fwd[0]] };
  }

  // Bild des Modells (für Export und Vorschaubilder)
  snapshot(width, height, { transparent = false, type = 'image/png', quality = 0.9 } = {}) {
    const prevSize = new THREE.Vector2(); this.renderer.getSize(prevSize);
    const prevRatio = this.renderer.getPixelRatio();
    const prevBg = this.scene.background;
    const helpersVis = this.helpers.visible;
    this.helpers.visible = false;
    if (transparent) this.scene.background = null;
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    const cam = this.camera.clone(); cam.aspect = width / height; cam.updateProjectionMatrix();
    this.renderer.render(this.scene, cam);
    const url = this.renderer.domElement.toDataURL(type, quality);
    this.scene.background = prevBg; this.helpers.visible = helpersVis;
    this.renderer.setPixelRatio(prevRatio);
    this.renderer.setSize(prevSize.x, prevSize.y, false);
    this.dirty = true;
    return url;
  }
}
