// Erweiterung: Ritter & Mittelalter, Landschaft, zusätzliche Standardteile
import { PH, GAP, shape, THREE } from './geom.js';

// Deterministischer Zufall, damit jedes Teil immer gleich aussieht
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Steinstruktur auf einer Wandfläche (Normale ±X), Fläche z0..z1, y0..y1
function stonesX(B, x, sign, z0, z1, y0, y1, seed, mat = 'main', rowH = 0.4) {
  const r = rng(seed);
  for (let y = y0, row = 0; y < y1 - 0.05; y += rowH, row++) {
    const h = Math.min(rowH, y1 - y) - 0.05;
    let z = z0 + (row % 2 ? 0.35 : 0);
    if (row % 2) B.box(0.05, h, 0.3, x + sign * 0.025, y + 0.025, z0 + 0.175, mat);
    while (z < z1 - 0.1) {
      const len = Math.min(0.55 + r() * 0.5, z1 - z) - 0.05;
      if (len > 0.08) B.box(0.05, h, len, x + sign * 0.025, y + 0.025, z + len / 2 + 0.025, mat);
      z += len + 0.05;
    }
  }
}
function stonesZ(B, z, sign, x0, x1, y0, y1, seed, mat = 'main', rowH = 0.4) {
  const r = rng(seed);
  for (let y = y0, row = 0; y < y1 - 0.05; y += rowH, row++) {
    const h = Math.min(rowH, y1 - y) - 0.05;
    let x = x0 + (row % 2 ? 0.35 : 0);
    if (row % 2) B.box(0.3, h, 0.05, x0 + 0.175, y + 0.025, z + sign * 0.025, mat);
    while (x < x1 - 0.1) {
      const len = Math.min(0.55 + r() * 0.5, x1 - x) - 0.05;
      if (len > 0.08) B.box(len, h, 0.05, x + len / 2 + 0.025, y + 0.025, z + sign * 0.025, mat);
      x += len + 0.05;
    }
  }
}

function ringShape(ro, ri) {
  const s = new THREE.Shape(); s.absarc(0, 0, ro, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, ri, 0, Math.PI * 2, true); s.holes.push(hole);
  return s;
}
function lathe(points, seg = 20) { return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), seg); }

// Eckschräge außen: höchster Punkt hinten links
function cornerOuter(B, w, d, H) {
  const x0 = -w / 2 + GAP, x1 = w / 2 - GAP, z0 = -d / 2 + GAP, z1 = d / 2 - GAP, h = H - GAP, l = 0.12;
  const A = [x0, 0, z0], Bp = [x1, 0, z0], C = [x1, 0, z1], D = [x0, 0, z1];
  const T = [x0, h, z0], Bl = [x1, l, z0], Cl = [x1, l, z1], Dl = [x0, l, z1];
  const tris = [
    A, C, Bp, A, D, C,                // Boden
    A, Bp, Bl, A, Bl, T,               // Rückwand
    A, T, Dl, A, Dl, D,                // linke Wand
    Bp, C, Cl, Bp, Cl, Bl,             // rechte Kante
    D, Dl, Cl, D, Cl, C,               // vordere Kante
    T, Bl, Cl, T, Cl, Dl,              // Schrägflächen
  ];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3)); g.computeVertexNormals();
  B.add(g);
}
function cornerInner(B, w, d, H) {
  const x0 = -w / 2 + GAP, x1 = w / 2 - GAP, z0 = -d / 2 + GAP, z1 = d / 2 - GAP, h = H - GAP, l = 0.12;
  const A = [x0, 0, z0], Bp = [x1, 0, z0], C = [x1, 0, z1], D = [x0, 0, z1];
  const At = [x0, h, z0], Bt = [x1, h, z0], Dt = [x0, h, z1], Cl = [x1, l, z1];
  const tris = [
    A, C, Bp, A, D, C,
    A, Bp, Bt, A, Bt, At,
    A, At, Dt, A, Dt, D,
    Bp, C, Cl, Bp, Cl, Bt,
    D, Dt, Cl, D, Cl, C,
    At, Bt, Dt, Bt, Cl, Dt,
  ];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3)); g.computeVertexNormals();
  B.add(g);
  B.stud(-w / 2 + 0.5, H, -d / 2 + 0.5);
}

function wedgePlate(B, w, d, H, side) {
  const pts = side > 0 ? [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2 + w * 0.5, d / 2]] : [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2 - w * 0.5, d / 2], [-w / 2, d / 2]];
  const s = shape(pts.map(([x, z]) => [x * 0.99, z * 0.99]));
  B.shapeUp(s, H - GAP, 0);
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
    const x = -w / 2 + 0.5 + i, z = -d / 2 + 0.5 + j;
    const t = (z + d / 2) / d; // 0 hinten, 1 vorne
    const lim = side > 0 ? (-w / 2 + w * 0.5 * t) : (w / 2 - w * 0.5 * t);
    if (side > 0 ? x - 0.3 > lim : x + 0.3 < lim) B.stud(x, H, z);
  }
}

// --- Spielfiguren (eigener Stil: Kegelkörper, runder Kopf) --------------------
function figureBody(B, H, opt = {}) {
  const s = H / 2.4;
  B.cyl(0.36, 0.4, 0.1 * s, 0, 0, 0, 20, 'iron');
  const body = opt.bodyMat || 'main';
  if (opt.dress) B.cyl(0.18 * s, 0.42 * s, 1.15 * s, 0, 0.1 * s, 0, 20, body);
  else {
    B.cyl(0.12 * s, 0.14 * s, 0.55 * s, -0.11 * s, 0.1 * s, 0, 10, opt.legMat || 'trunk');
    B.cyl(0.12 * s, 0.14 * s, 0.55 * s, 0.11 * s, 0.1 * s, 0, 10, opt.legMat || 'trunk');
    B.cyl(0.24 * s, 0.29 * s, 0.6 * s, 0, 0.62 * s, 0, 16, body);
  }
  if (opt.belt !== false && !opt.dress) B.cyl(0.295 * s, 0.295 * s, 0.07 * s, 0, 0.66 * s, 0, 16, 'gold');
  // Arme
  for (const sx of [-1, 1]) {
    const g = new THREE.CylinderGeometry(0.075 * s, 0.085 * s, 0.55 * s, 8);
    g.translate(0, -0.27 * s, 0); g.rotateZ(sx * 0.22); g.translate(sx * 0.29 * s, 1.18 * s, 0);
    B.add(g, opt.armMat || body);
    B.sphere(0.08 * s, sx * 0.4 * s, 0.68 * s, 0.02, 'skin', 1, 1, 1, 8);
  }
  B.cyl(0.08 * s, 0.09 * s, 0.1 * s, 0, 1.22 * s, 0, 10, 'skin');
  if (!opt.noHead) B.sphere(0.24 * s, 0, 1.5 * s, 0, 'skin', 1, 1.05, 1, 16);
  if (!opt.noFace && !opt.noHead) for (const sx of [-0.08, 0.08]) B.sphere(0.03 * s, sx * s, 1.54 * s, 0.215 * s, 'black', 1, 1, 1, 6);
  return s;
}
function shieldShape(sc = 1) {
  const s = new THREE.Shape();
  s.moveTo(-0.22 * sc, 0.3 * sc); s.lineTo(0.22 * sc, 0.3 * sc); s.lineTo(0.22 * sc, 0.02 * sc);
  s.quadraticCurveTo(0.2 * sc, -0.22 * sc, 0, -0.32 * sc); s.quadraticCurveTo(-0.2 * sc, -0.22 * sc, -0.22 * sc, 0.02 * sc); s.closePath();
  return s;
}
function addShield(B, x, y, z, ry, sc, mat = 'main') {
  const g = new THREE.ExtrudeGeometry(shieldShape(sc), { depth: 0.05, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -0.025); g.rotateY(ry); g.translate(x, y, z); B.add(g, mat);
  const c1 = new THREE.BoxGeometry(0.05 * sc, 0.5 * sc, 0.02); c1.translate(0, -0.02 * sc, 0.03); c1.rotateY(ry); c1.translate(x, y, z); B.add(c1, 'gold');
  const c2 = new THREE.BoxGeometry(0.34 * sc, 0.05 * sc, 0.02); c2.translate(0, 0.1 * sc, 0.03); c2.rotateY(ry); c2.translate(x, y, z); B.add(c2, 'gold');
}

function knight(B, w, d, H) {
  const s = figureBody(B, H, { bodyMat: 'rim', armMat: 'rim', legMat: 'rim', noHead: true });
  B.box(0.42 * s, 0.6 * s, 0.05, 0, 0.6 * s, 0.25 * s);               // Wappenrock
  B.cyl(0.25 * s, 0.25 * s, 0.42 * s, 0, 1.3 * s, 0, 16, 'chrome');      // Topfhelm
  B.box(0.3 * s, 0.035 * s, 0.05, 0, 1.52 * s, 0.24 * s, 'black');
  B.cone(0.1 * s, 0.35 * s, 0, 1.72 * s, -0.05, 10);                    // Helmbusch
  addShield(B, -0.44 * s, 0.85 * s, 0.1, -0.5, s);
  B.cyl(0.025 * s, 0.025 * s, 0.95 * s, 0.4 * s, 0.68 * s, 0.05, 6, 'chrome');
  B.box(0.22 * s, 0.04 * s, 0.05, 0.4 * s, 0.75 * s, 0.05, 'gold');
}
function king(B, w, d, H) {
  const s = figureBody(B, H, { dress: true });
  const cape = new THREE.CylinderGeometry(0.3 * s, 0.46 * s, 1.15 * s, 18, 1, true, Math.PI * 0.6, Math.PI * 0.8);
  cape.translate(0, 0.68 * s, -0.02); B.add(cape);
  B.cyl(0.33 * s, 0.33 * s, 0.1 * s, 0, 1.12 * s, 0, 18, 'white');
  B.cyl(0.22 * s, 0.2 * s, 0.12 * s, 0, 1.68 * s, 0, 16, 'gold');
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; B.cone(0.045 * s, 0.12 * s, Math.cos(a) * 0.2 * s, 1.8 * s, Math.sin(a) * 0.2 * s, 6, 'gold'); }
  B.cone(0.17 * s, 0.25 * s, 0, 1.15 * s, 0.13 * s, 10, 'white');       // Bart (nach unten zeigend)
  B.cyl(0.025 * s, 0.025 * s, 1.05 * s, 0.42 * s, 0.4 * s, 0.05, 6, 'gold');
  B.sphere(0.07 * s, 0.42 * s, 1.47 * s, 0.05, 'gold', 1, 1, 1, 8);
}
function princess(B, w, d, H) {
  const s = figureBody(B, H, { dress: true });
  B.cyl(0.24 * s, 0.24 * s, 0.06 * s, 0, 1.12 * s, 0, 16, 'gold');
  const g = new THREE.ConeGeometry(0.17 * s, 0.75 * s, 16); g.rotateX(-0.35); g.translate(0, 1.95 * s, -0.12 * s); B.add(g);
  const v = new THREE.ConeGeometry(0.05 * s, 0.6 * s, 8); v.rotateX(2.5); v.translate(0, 2.05 * s, -0.4 * s); B.add(v, 'white');
}
function archer(B, w, d, H) {
  const s = figureBody(B, H, {});
  const hood = new THREE.SphereGeometry(0.28 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62); hood.translate(0, 1.5 * s, -0.03); B.add(hood);
  B.cone(0.08 * s, 0.25 * s, 0, 1.68 * s, -0.25 * s, 8);
  const bow = new THREE.TorusGeometry(0.5 * s, 0.025 * s, 6, 20, Math.PI * 0.9); bow.rotateZ(-Math.PI * 0.45); bow.rotateY(Math.PI / 2); bow.translate(-0.42 * s, 1.0 * s, 0.05); B.add(bow, 'trunk');
  B.cyl(0.09 * s, 0.07 * s, 0.6 * s, 0.12 * s, 0.85 * s, -0.27 * s, 10, 'trunk');
}
function wizard(B, w, d, H) {
  const s = figureBody(B, H, { dress: true });
  B.cyl(0.4 * s, 0.4 * s, 0.04 * s, 0, 1.68 * s, 0, 20);
  const hat = new THREE.ConeGeometry(0.24 * s, 0.75 * s, 16); hat.translate(0, 2.08 * s, 0); hat.rotateZ(0.12); B.add(hat);
  B.cone(0.16 * s, 0.45 * s, 0, 1.0 * s, 0.14 * s, 10, 'white');
  B.cyl(0.03 * s, 0.035 * s, 1.85 * s, 0.44 * s, 0.1 * s, 0.05, 6, 'trunk');
  B.sphere(0.09 * s, 0.44 * s, 2.0 * s, 0.05, 'magic', 1, 1, 1, 10);
}
function guard(B, w, d, H) {
  const s = figureBody(B, H, { legMat: 'iron', armMat: 'iron' });
  B.cyl(0.33 * s, 0.33 * s, 0.03 * s, 0, 1.62 * s, 0, 18, 'iron');
  const helm = new THREE.SphereGeometry(0.26 * s, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); helm.translate(0, 1.6 * s, 0); B.add(helm, 'iron');
  B.cyl(0.025 * s, 0.025 * s, 2.0 * s, 0.4 * s, 0.1 * s, 0.05, 6, 'trunk');
  B.cone(0.06 * s, 0.22 * s, 0.4 * s, 2.1 * s, 0.05, 6, 'chrome');
}
function villager(B, w, d, H) {
  const s = figureBody(B, H, {});
  B.cyl(0.36 * s, 0.36 * s, 0.03 * s, 0, 1.68 * s, 0, 18, 'sand');
  B.cyl(0.18 * s, 0.22 * s, 0.16 * s, 0, 1.7 * s, 0, 14, 'sand');
}

// --- Tiere & Wesen -------------------------------------------------------------
function horse(B, w, d, H, opt = {}) {
  const s = H / 2.8, body = opt.body || 'main';
  B.sphere(0.5 * s, 0, 1.45 * s, 0, body, 1, 0.95, 1.8, 18);
  for (const [x, z] of [[-0.25, 0.6], [0.25, 0.6], [-0.25, -0.6], [0.25, -0.6]]) {
    B.cyl(0.1 * s, 0.12 * s, 1.1 * s, x * s, 0.12 * s, z * s, 8, body);
    B.cyl(0.13 * s, 0.13 * s, 0.12 * s, x * s, 0, z * s, 8, 'black');
  }
  const neck = new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 0.9 * s, 12); neck.rotateX(0.6); neck.translate(0, 2.0 * s, 0.85 * s); B.add(neck, body);
  const head = new THREE.BoxGeometry(0.32 * s, 0.32 * s, 0.75 * s); head.rotateX(0.5); head.translate(0, 2.3 * s, 1.3 * s); B.add(head, body);
  B.box(0.08 * s, 0.7 * s, 0.6 * s, 0, 1.75 * s, 0.75 * s, 'black');
  for (const sx of [-0.1, 0.1]) B.cone(0.05 * s, 0.15 * s, sx * s, 2.55 * s, 1.15 * s, 6, body);
  const tail = new THREE.CylinderGeometry(0.06 * s, 0.12 * s, 0.9 * s, 8); tail.rotateX(-0.35); tail.translate(0, 1.15 * s, -1.05 * s); B.add(tail, 'black');
  if (opt.caparison) {
    const cap = new THREE.CylinderGeometry(0.56 * s, 0.62 * s, 0.75 * s, 20, 1, true); cap.scale(1, 1, 1.75); cap.translate(0, 1.05 * s, 0); B.add(cap, 'main');
    B.box(0.75 * s, 0.12 * s, 0.7 * s, 0, 1.88 * s, -0.1 * s, 'trunk');
  } else B.box(0.62 * s, 0.1 * s, 0.6 * s, 0, 1.88 * s, -0.05 * s, 'trunk');
}
function knightOnHorse(B, w, d, H) {
  horse(B, w, d, 2.8, { body: 'white', caparison: true });
  // Reiter auf dem Sattel
  const y0 = 1.95, s = 1;
  B.cyl(0.24, 0.29, 0.6, 0, y0, -0.05, 16, 'rim');
  for (const sx of [-1, 1]) { const g = new THREE.CylinderGeometry(0.1, 0.12, 0.6, 8); g.rotateX(1.3); g.rotateZ(sx * 0.2); g.translate(sx * 0.3, y0 + 0.05, 0.12); B.add(g, 'rim'); }
  B.box(0.42, 0.55, 0.05, 0, y0, 0.2);
  B.cyl(0.25, 0.25, 0.42, 0, y0 + 0.7, -0.05, 16, 'chrome');
  B.box(0.3, 0.035, 0.05, 0, y0 + 0.92, 0.19, 'black');
  B.cone(0.1, 0.35, 0, y0 + 1.12, -0.1, 10);
  addShield(B, -0.42, y0 + 0.3, -0.05, -Math.PI / 2 + 0.2, s);
  const lance = new THREE.CylinderGeometry(0.03, 0.06, 2.6, 8); lance.rotateX(Math.PI / 2 - 0.12); lance.translate(0.38, y0 + 0.55, 0.7); B.add(lance, 'trunk');
}
function dragon(B, w, d, H) {
  const s = H / 5.6;
  const body = 'main', belly = 'sand';
  B.sphere(1.2 * s, 0, 2.0 * s, -0.2 * s, body, 1, 0.85, 1.55, 22);
  B.sphere(0.95 * s, 0, 1.75 * s, 0, belly, 1, 0.75, 1.4, 18);
  for (const [x, z] of [[-0.85, 1.1], [0.85, 1.1], [-0.9, -1.3], [0.9, -1.3]]) {
    B.cyl(0.26 * s, 0.32 * s, 1.4 * s, x * s, 0.15 * s, z * s, 10, body);
    B.sphere(0.36 * s, x * s, 0.18 * s, (z + 0.15) * s, body, 1, 0.5, 1.4, 10);
    for (const cx of [-0.15, 0, 0.15]) B.cone(0.06 * s, 0.2 * s, (x + cx) * s, 0.05 * s, (z + 0.6) * s, 6, 'white');
  }
  // Hals
  const neck = [[0, 2.6, 1.3, 0.62], [0, 3.2, 1.9, 0.5], [0, 3.8, 2.35, 0.42], [0, 4.35, 2.65, 0.38]];
  for (const [x, y, z, r] of neck) B.sphere(r * s, x, y * s, z * s, body, 1, 1, 1, 14);
  // Kopf
  B.sphere(0.5 * s, 0, 4.75 * s, 2.95 * s, body, 1, 0.85, 1.15, 16);
  const snout = new THREE.BoxGeometry(0.62 * s, 0.42 * s, 0.9 * s); snout.translate(0, 4.6 * s, 3.55 * s); B.add(snout, body);
  B.box(0.55 * s, 0.12 * s, 0.75 * s, 0, 4.3 * s, 3.45 * s, belly);
  for (const sx of [-0.25, 0.25]) {
    B.sphere(0.1 * s, sx * s, 4.98 * s, 3.25 * s, 'lamp_yellow', 1, 1, 1, 8);
    const horn = new THREE.ConeGeometry(0.1 * s, 0.75 * s, 8); horn.rotateX(-1.0); horn.translate(sx * 1.2 * s, 5.25 * s, 2.55 * s); B.add(horn, 'white');
    B.sphere(0.05 * s, sx * 0.55 * s, 4.75 * s, 3.98 * s, 'black', 1, 1, 1, 6);
  }
  // Schwanz
  for (let i = 0; i < 9; i++) {
    const t = i / 8, r = (0.6 - t * 0.48) * s;
    B.sphere(r, Math.sin(t * 3) * 0.6 * s, (1.9 - t * 1.4 + Math.sin(t * 3.14) * 0.3) * s, (-1.8 - t * 2.1) * s, body, 1, 1, 1, 12);
  }
  const tip = new THREE.ConeGeometry(0.28 * s, 0.55 * s, 4); tip.rotateX(-Math.PI / 2); tip.translate(Math.sin(3) * 0.6 * s, 0.55 * s, -4.15 * s); B.add(tip, 'white');
  // Rückenstacheln
  for (let i = 0; i < 7; i++) B.cone(0.13 * s, 0.4 * s, 0, (3.0 - Math.abs(i - 2) * 0.08) * s, (1.5 - i * 0.55) * s, 4, 'white');
  // Flügel (links gespiegelt über die Koordinaten, damit die Flächen richtig herum liegen)
  const base = [[0, 0], [2.6, 1.9], [2.2, 0.7, 2.7, -0.1], [1.9, 0.2, 1.75, -0.6], [1.2, -0.2, 0.9, -1.0], [0.6, -0.4, 0, -0.6]];
  for (const sx of [-1, 1]) {
    const ws = new THREE.Shape();
    ws.moveTo(0, 0); ws.lineTo(sx * 2.6, 1.9);
    for (const q of base.slice(2)) ws.quadraticCurveTo(sx * q[0], q[1], sx * q[2], q[3]);
    ws.closePath();
    const place = g => { g.scale(s, s, 1); g.rotateX(-Math.PI / 2); g.rotateZ(sx * 0.5); g.translate(sx * 0.55 * s, 2.75 * s, 0.3 * s); return g; };
    const g = new THREE.ExtrudeGeometry(ws, { depth: 0.06, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, -0.03); B.add(place(g), body);
    const len = Math.hypot(2.6, 1.9), ang = Math.atan2(1.9, sx * 2.6);
    const bone = new THREE.CylinderGeometry(0.07, 0.11, len, 6); bone.rotateZ(-Math.PI / 2); bone.rotateZ(ang); bone.translate(sx * 1.3, 0.95, 0);
    B.add(place(bone), body);
  }
}
function fireBreath(B, w, d, H) {
  for (let i = 0; i < 4; i++) {
    const r = 0.18 + i * 0.12, z = -d / 2 + 0.4 + i * 0.85;
    const g = new THREE.ConeGeometry(r, 0.9, 10); g.rotateX(-Math.PI / 2); g.translate(Math.sin(i) * 0.08, H / 2 + Math.cos(i * 2) * 0.08, z); B.add(g, i % 2 ? 'flame' : 'lamp_yellow');
  }
  B.sphere(0.55, 0.05, H / 2, d / 2 - 0.5, 'flame', 1, 1, 1.2, 12);
}
function sheep(B, w, d, H) {
  B.sphere(0.45, 0, 0.75, 0, 'main', 0.9, 0.8, 1.25, 12);
  for (const [x, z, y] of [[0.2, 0.3, 0.95], [-0.2, -0.3, 0.95], [0, 0, 1.05], [-0.2, 0.3, 0.9], [0.2, -0.3, 0.9]]) B.sphere(0.25, x, y, z, 'main', 1, 1, 1, 10);
  for (const [x, z] of [[-0.18, 0.35], [0.18, 0.35], [-0.18, -0.35], [0.18, -0.35]]) B.cyl(0.06, 0.06, 0.45, x, 0, z, 6, 'black');
  B.sphere(0.2, 0, 0.95, 0.65, 'black', 1, 1, 1.3, 10);
}
function chicken(B, w, d, H) {
  B.sphere(0.25, 0, 0.35, 0, 'main', 1, 1, 1.2, 12);
  B.sphere(0.15, 0, 0.62, 0.17, 'main', 1, 1, 1, 10);
  B.box(0.04, 0.1, 0.12, 0, 0.74, 0.17, 'red');
  B.cone(0.05, 0.12, 0, 0.55, 0.32, 6, 'yellow');
  B.cone(0.12, 0.25, 0, 0.35, -0.28, 6);
  for (const x of [-0.08, 0.08]) B.cyl(0.02, 0.02, 0.12, x, 0, 0, 4, 'yellow');
}
function pig(B, w, d, H) {
  B.sphere(0.42, 0, 0.62, 0, 'main', 0.95, 0.85, 1.3, 14);
  B.cylZ(0.13, 0.14, 0, 0.65, 0.58, 12);
  for (const [x, z] of [[-0.2, 0.3], [0.2, 0.3], [-0.2, -0.3], [0.2, -0.3]]) B.cyl(0.08, 0.08, 0.3, x, 0, z, 6);
  for (const x of [-0.17, 0.17]) B.cone(0.08, 0.15, x, 0.92, 0.32, 4);
}

// --- Burg ----------------------------------------------------------------------
function stoneWall(B, w, d, H, seed) {
  const T = w - 2 * GAP - 0.1, L = d - 2 * GAP;
  B.box(T, H - GAP, L);
  stonesX(B, T / 2, 1, -L / 2, L / 2, 0, H - GAP, seed);
  stonesX(B, -T / 2, -1, -L / 2, L / 2, 0, H - GAP, seed + 7);
  B.studs(w, d, H);
}
function towerSquare(B, w, d, H) {
  const t = 1 - GAP, half = w / 2 - GAP;
  B.box(w - 2 * GAP, H - GAP, t, 0, 0, -d / 2 + t / 2 + GAP);
  // Vorderwand mit Schlitz
  const sw = 0.24, sy = H * 0.3, sh = H * 0.45, L = w - 2 * GAP;
  B.box(L, sy, t, 0, 0, d / 2 - t / 2 - GAP);
  B.box(L, H - GAP - sy - sh, t, 0, sy + sh, d / 2 - t / 2 - GAP);
  B.box((L - sw) / 2, sh, t, -L / 4 - sw / 4, sy, d / 2 - t / 2 - GAP);
  B.box((L - sw) / 2, sh, t, L / 4 + sw / 4, sy, d / 2 - t / 2 - GAP);
  for (const sx of [-1, 1]) B.box(t, H - GAP, d - 2 - 2 * GAP, sx * (half - t / 2), 0, 0);
  stonesZ(B, d / 2 - GAP, 1, -half, half, 0, H - GAP, 3);
  stonesZ(B, -d / 2 + GAP, -1, -half, half, 0, H - GAP, 5);
  stonesX(B, half, 1, -half, half, 0, H - GAP, 9);
  stonesX(B, -half, -1, -half, half, 0, H - GAP, 11);
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (i === 0 || j === 0 || i === w - 1 || j === d - 1) B.stud(-w / 2 + 0.5 + i, H, -d / 2 + 0.5 + j);
}
function towerRound(B, w, d, H) {
  const ro = w / 2 - GAP * 2, ri = ro - 0.85;
  B.shapeUp(ringShape(ro, ri), H - GAP, 0);
  // Steinbänder
  for (let y = 0.4; y < H - 0.2; y += 0.8) B.add(new THREE.TorusGeometry(ro, 0.03, 4, 32).rotateX(Math.PI / 2).translate(0, y, 0));
  B.box(0.18, H * 0.4, 0.06, 0, H * 0.3, ro - 0.01, 'black');
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
    const x = -w / 2 + 0.5 + i, z = -d / 2 + 0.5 + j, r = Math.hypot(x, z);
    if (r > ri + 0.25 && r < ro - 0.25) B.stud(x, H, z);
  }
}
function gate(B, w, d, H) {
  const span = d - 4, r = span / 2, z0 = -d / 2 + GAP, z1 = d / 2 - GAP;
  const ys = H * 0.62 - r;
  const s = new THREE.Shape();
  s.moveTo(z0, 0); s.lineTo(-r, 0); s.lineTo(-r, ys);
  s.absarc(0, ys, r, Math.PI, 0, true);
  s.lineTo(r, 0); s.lineTo(z1, 0); s.lineTo(z1, H - GAP); s.lineTo(z0, H - GAP); s.closePath();
  B.shapeX(s, w - 2 * GAP - 0.1);
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - GAP - 0.05);
    stonesX(B, x, sx, z0, -r - 0.05, 0, H - GAP, 21 + sx);
    stonesX(B, x, sx, r + 0.05, z1, 0, H - GAP, 25 + sx);
    stonesX(B, x, sx, -r, r, ys + r + 0.05, H - GAP, 29 + sx);
  }
  // Fallgitter (halb hochgezogen)
  const gy = ys * 0.45;
  for (let i = 0; i <= 8; i++) { const z = -r + 0.15 + (span - 0.3) / 8 * i; const top = ys + Math.sqrt(Math.max(0, r * r - z * z)) - 0.05; B.box(0.08, top - gy, 0.08, 0, gy, z, 'iron'); B.cone(0.05, 0.15, 0, gy - 0.15, z, 4, 'iron'); }
  for (let y = gy + 0.3; y < ys + r - 0.2; y += 0.45) { const half = y > ys ? Math.sqrt(Math.max(0, r * r - (y - ys) ** 2)) - 0.1 : r - 0.1; B.box(0.08, 0.07, half * 2, 0, y, 0, 'iron'); }
  B.studs(w, d, H);
}
function drawbridge(B, w, d, H) {
  const n = w * 2;
  for (let i = 0; i < n; i++) B.box((w - 0.1) / n - 0.03, H - GAP, d - 0.1, -w / 2 + 0.05 + (w - 0.1) / n * (i + 0.5), 0, 0);
  for (const z of [-d / 2 + 0.6, 0, d / 2 - 0.6]) B.box(w - 0.1, 0.05, 0.22, 0, H - GAP, z, 'iron');
  for (const sx of [-1, 1]) B.torus(0.14, 0.04, sx * (w / 2 - 0.35), H + 0.08, -d / 2 + 0.3, 0, Math.PI / 2, 'iron');
}
function battlementWalk(B, w, d, H) {
  B.body(w, PH, d);
  const x = w / 2 - 0.25 - GAP, L = d - 2 * GAP;
  B.box(0.48, 0.5, L, x, PH, 0);
  const n = d, mw = L / n * 0.55;
  for (let i = 0; i < n; i++) B.box(0.48, H - PH - 0.5 - GAP, mw, x, PH + 0.5, -L / 2 + L / n * (i + 0.5));
  stonesX(B, x + 0.24, 1, -L / 2, L / 2, 0, PH + 0.5, 31, 'main', 0.3);
  for (let j = 0; j < d; j++) for (let i = 0; i < w - 1; i++) B.stud(-w / 2 + 0.5 + i, PH, -d / 2 + 0.5 + j);
}
function turret(B, w, d, H) {
  const R = w / 2 - GAP * 2, bh = H * 0.55;
  B.cyl(R, R, bh, 0, 0, 0, 24);
  for (let y = 0.4; y < bh; y += 0.8) B.add(new THREE.TorusGeometry(R, 0.03, 4, 24).rotateX(Math.PI / 2).translate(0, y, 0));
  B.box(0.14, bh * 0.4, 0.05, 0, bh * 0.35, R, 'black');
  B.cyl(R + 0.12, R + 0.12, 0.12, 0, bh, 0, 24);
  B.cone(R + 0.15, H - bh - 0.12 - GAP, 0, bh + 0.12, 0, 24, 'roof');
}
function spiral(B, w, d, H) {
  B.cyl(0.18, 0.18, H - GAP, 0, 0, 0, 12, 'main');
  const steps = Math.round(H / PH);
  for (let i = 0; i < steps; i++) {
    const g = new THREE.BoxGeometry(w / 2 - 0.15, 0.12, 0.6); g.translate((w / 2 - 0.15) / 2 + 0.1, 0, 0);
    g.rotateY(i * Math.PI / 6); g.translate(0, (i + 1) * PH - 0.12 - GAP, 0); B.add(g);
  }
}
function banner(B, w, d, H) {
  B.cylZ(0.04, d - 0.1, 0, H - 0.12, 0, 8, 'gold');
  const s = new THREE.Shape(); const hw = d / 2 - 0.12;
  s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(hw, -(H - 0.6)); s.lineTo(0, -(H - 0.2)); s.lineTo(-hw, -(H - 0.6)); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(0.05, H - 0.15, 0); B.add(g);
  B.cylX(0.32, 0.03, 0.1, H * 0.55, 0, 20, 'gold');
  B.cylX(0.2, 0.035, 0.11, H * 0.55, 0, 20, 'main');
}
function lancet(B, w, d, H) {
  const L = d - 2 * GAP, hw = Math.min(0.55, L / 2 - 0.25), y0 = 0.45, yt = H - 0.35, ys = yt - hw * 1.6;
  const s = new THREE.Shape();
  s.moveTo(-L / 2, 0); s.lineTo(L / 2, 0); s.lineTo(L / 2, H - GAP); s.lineTo(-L / 2, H - GAP); s.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-hw, y0); hole.lineTo(hw, y0); hole.lineTo(hw, ys);
  hole.quadraticCurveTo(hw, yt - 0.25, 0, yt); hole.quadraticCurveTo(-hw, yt - 0.25, -hw, ys); hole.closePath();
  s.holes.push(hole);
  B.shapeX(s, w - 2 * GAP - 0.1);
  const gs = new THREE.Shape(); gs.moveTo(-hw, y0); gs.lineTo(hw, y0); gs.lineTo(hw, ys); gs.quadraticCurveTo(hw, yt - 0.25, 0, yt); gs.quadraticCurveTo(-hw, yt - 0.25, -hw, ys); gs.closePath();
  B.shapeX(gs, 0.05, 'glass');
  B.box(0.08, yt - y0, 0.06, 0, y0, 0, 'iron');
  B.studs(w, d, H);
}
function timberWall(B, w, d, H) {
  const L = d - 2 * GAP, T = w - 2 * GAP;
  B.box(T * 0.7, H - GAP, L, 0, 0, 0);
  const bt = 0.16;
  for (const sx of [-1, 1]) {
    const x = sx * (T * 0.35 + 0.02);
    for (const z of [-L / 2 + bt / 2, 0, L / 2 - bt / 2]) B.box(0.06, H - GAP, bt, x, 0, z, 'beam');
    for (const y of [0, H / 2 - bt / 2, H - GAP - bt]) B.box(0.06, bt, L, x, y, 0, 'beam');
    for (const [zs, sgn] of [[-L / 4, 1], [L / 4, -1]]) {
      const len = Math.hypot(L / 2 - bt, H / 2 - bt);
      const g = new THREE.BoxGeometry(0.06, len, bt); g.rotateX(sgn * Math.atan2(L / 2 - bt, H / 2 - bt)); g.translate(x, H / 4 + bt / 2, zs); B.add(g, 'beam');
    }
  }
  B.studs(w, d, H);
}
function palisade(B, w, d, H) {
  const n = d * 2;
  for (let i = 0; i < n; i++) {
    const z = -d / 2 + 0.25 + i * 0.5, h = H * (0.82 + ((i * 37) % 7) / 50);
    B.cyl(0.22, 0.24, h - 0.3, 0, 0, z, 9);
    B.cone(0.22, 0.32, 0, h - 0.3, z, 9);
  }
  B.box(0.1, 0.16, d - 0.1, 0.2, H * 0.6, 0, 'beam');
}
function castleDoor(B, w, d, H) {
  const L = d - 2 * GAP, r = (L - 0.5) / 2, ys = H - r - 0.25;
  const s = new THREE.Shape();
  s.moveTo(-L / 2, 0); s.lineTo(-r, 0); s.lineTo(-r, ys); s.absarc(0, ys, r, Math.PI, 0, true); s.lineTo(r, 0); s.lineTo(L / 2, 0); s.lineTo(L / 2, H - GAP); s.lineTo(-L / 2, H - GAP); s.closePath();
  B.shapeX(s, w - 2 * GAP);
  const ds = new THREE.Shape();
  ds.moveTo(-r, 0); ds.lineTo(r, 0); ds.lineTo(r, ys); ds.absarc(0, ys, r, 0, Math.PI, false); ds.closePath();
  B.shapeX(ds, 0.2, 'beam', 0.15);
  for (let i = 1; i < 5; i++) B.box(0.03, ys + r * 0.6, 0.03, 0.26, 0.05, -r + (2 * r / 5) * i, 'trunk');
  for (const y of [0.6, ys - 0.2]) B.box(0.04, 0.12, r * 2 - 0.1, 0.27, y, 0, 'iron');
  B.torus(0.12, 0.03, 0.3, ys * 0.55, r * 0.55, 0, Math.PI / 2, 'iron');
  B.studs(w, d, H);
}
function catapult(B, w, d, H) {
  for (const sx of [-1, 1]) B.box(0.25, 0.25, d - 0.4, sx * (w / 2 - 0.5), 0.35, 0);
  for (const z of [-d / 2 + 0.5, d / 2 - 0.5]) B.box(w - 0.6, 0.2, 0.25, 0, 0.4, z);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.cylX(0.38, 0.14, sx * (w / 2 - 0.25), 0.38, sz * (d / 2 - 0.7), 14, 'trunk');
  for (const sx of [-1, 1]) {
    const a = new THREE.BoxGeometry(0.18, 1.6, 0.18); a.rotateX(0.3); a.translate(sx * (w / 2 - 0.5), 1.25, -0.15); B.add(a);
    const b = new THREE.BoxGeometry(0.18, 1.6, 0.18); b.rotateX(-0.3); b.translate(sx * (w / 2 - 0.5), 1.25, 0.35); B.add(b);
  }
  B.cylX(0.07, w - 0.8, 0, 1.95, 0.1, 8, 'iron');
  const arm = new THREE.BoxGeometry(0.16, 0.16, 2.8); arm.rotateX(-0.45); arm.translate(0, 1.7, -0.4); B.add(arm);
  B.sphere(0.32, 0, 2.3, -1.6, 'trunk', 1, 0.55, 1, 10);
  B.sphere(0.2, 0, 2.42, -1.6, 'iron', 1, 1, 1, 8);
}
function throne(B, w, d, H) {
  B.box(w - 0.2, 0.5, d - 0.3, 0, 0, 0.05, 'gold');
  B.box(w - 0.4, 0.15, d - 0.6, 0, 0.5, 0.1);
  B.box(w - 0.2, H - 0.7, 0.25, 0, 0.5, -d / 2 + 0.25, 'gold');
  B.box(w - 0.6, H - 1.2, 0.08, 0, 0.75, -d / 2 + 0.41);
  B.cone(0.18, 0.4, 0, H - 0.4 - GAP, -d / 2 + 0.25, 4, 'gold');
  for (const sx of [-1, 1]) { B.box(0.2, 0.45, d - 0.5, sx * (w / 2 - 0.2), 0.5, 0.1, 'gold'); B.sphere(0.1, sx * (w / 2 - 0.2), H - 0.7 + 0.5, -d / 2 + 0.25, 'gold', 1, 1, 1, 8); }
}
function brazier(B, w, d, H) {
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const g = new THREE.CylinderGeometry(0.03, 0.03, H * 0.6, 6); g.rotateZ(0.25); g.rotateY(a); g.translate(Math.cos(a) * 0.18, H * 0.28, Math.sin(a) * 0.18); B.add(g, 'iron'); }
  B.add(lathe([[0.1, 0], [0.38, 0.18], [0.4, 0.22], [0.12, 0.05]], 16).translate(0, H * 0.55, 0), 'iron');
  B.sphere(0.24, 0, H * 0.55 + 0.32, 0, 'flame', 1, 1.6, 1, 10);
}
function chest(B, w, d, H) {
  const bh = H * 0.55;
  B.box(w - 0.15, bh, d - 0.15);
  B.cylZ((w - 0.15) / 2, d - 0.15, 0, bh, 0, 16, 'main');
  for (const z of [-d / 2 + 0.35, d / 2 - 0.35]) { B.box(w - 0.1, bh, 0.08, 0, 0, z, 'gold'); B.cylZ((w - 0.1) / 2, 0.08, 0, bh, z, 16, 'gold'); }
  B.box(0.18, 0.22, 0.06, (w - 0.15) / 2, bh - 0.15, 0, 'gold');
}
function barrel(B, w, d, H) {
  B.add(lathe([[0, 0], [0.36, 0], [0.44, H * 0.5], [0.36, H - GAP], [0, H - GAP]], 18));
  for (const y of [0.15, H - 0.25]) B.add(new THREE.TorusGeometry(0.38, 0.025, 4, 18).rotateX(Math.PI / 2).translate(0, y, 0), 'iron');
  B.add(new THREE.TorusGeometry(0.44, 0.025, 4, 18).rotateX(Math.PI / 2).translate(0, H * 0.5, 0), 'iron');
}
function crate(B, w, d, H) {
  B.box(w - 0.1, H - GAP, d - 0.1);
  const t = 0.1, e = (w - 0.1) / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(t + 0.02, H - GAP, t + 0.02, sx * (e - t / 2), 0, sz * (e - t / 2), 'beam');
  for (const y of [0, H - GAP - t]) for (const sz of [-1, 1]) { B.box(w - 0.08, t, 0.04, 0, y, sz * e); B.box(0.04, t, d - 0.08, sz * e, y, 0); }
  const dg = new THREE.BoxGeometry(0.04, Math.hypot(w - 0.3, H - 0.3), 0.08); dg.rotateZ(Math.atan2(w - 0.3, H - 0.3)); dg.translate(0, H / 2, e + 0.02); B.add(dg, 'beam');
}
function hay(B, w, d, H) {
  const g = new THREE.BoxGeometry(w - 0.15, H - GAP, d - 0.15, 1, 1, 1); g.translate(0, (H - GAP) / 2, 0); B.add(g);
  for (const z of [-d / 4, d / 4]) B.box(w - 0.1, H - 0.05, 0.05, 0, -0.01, z, 'trunk');
  const r = rng(77); for (let i = 0; i < 18; i++) B.box(0.03, 0.03, 0.3, (r() - 0.5) * (w - 0.3), H - 0.03, (r() - 0.5) * (d - 0.3), 'sand');
}
function well(B, w, d, H) {
  const ro = w / 2 - 0.1;
  B.shapeUp(ringShape(ro, ro - 0.4), 1.0, 0);
  for (let y = 0.25; y < 1; y += 0.25) B.add(new THREE.TorusGeometry(ro, 0.025, 4, 28).rotateX(Math.PI / 2).translate(0, y, 0));
  B.cyl(ro - 0.4, ro - 0.4, 0.05, 0, 0.7, 0, 24, 'water');
  for (const sx of [-1, 1]) B.box(0.18, H - 1.4, 0.18, sx * (ro - 0.2), 1.0, 0, 'beam');
  B.cylX(0.06, w - 0.4, 0, H - 1.6, 0, 8, 'beam');
  B.cyl(0.12, 0.14, 0.25, 0, H - 2.1, 0, 10, 'beam');
  B.profileX([[-d / 2 + 0.05, H - 0.9], [d / 2 - 0.05, H - 0.9], [0, H - GAP]], w - 0.1, 'roof');
}
function marketStall(B, w, d, H) {
  B.box(w - 0.2, 1.0, d - 0.2, 0, 0, 0.15, 'beam');
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(0.12, H - 0.6, 0.12, sx * (w / 2 - 0.15), 0, sz * (d / 2 - 0.15), 'beam');
  const n = 6;
  for (let i = 0; i < n; i++) {
    const zs = d - 0.1, len = Math.hypot(1.2, zs);
    const g = new THREE.BoxGeometry((w - 0.05) / n, 0.04, len); g.rotateX(-Math.atan2(0.9, zs)); g.translate(-w / 2 + (w / n) * (i + 0.5), H - 0.5, 0);
    B.add(g, i % 2 ? 'white' : 'main');
  }
  const r = rng(5), cols = ['red', 'yellow', 'stem', 'flame'];
  for (let i = 0; i < 14; i++) B.sphere(0.11, (r() - 0.5) * (w - 0.6), 1.1, (r() - 0.5) * (d - 0.8) + 0.15, cols[i % 4], 1, 1, 1, 8);
}
function tent(B, w, d, H) {
  const R = w / 2 - 0.1, wh = H * 0.42;
  B.cyl(R, R, wh, 0, 0, 0, 14, 'main');
  B.box(0.9, wh * 0.85, 0.05, 0, 0, R - 0.02, 'black');
  B.cone(R + 0.15, H * 0.5, 0, wh, 0, 14, 'white');
  B.cyl(0.03, 0.03, H * 0.12, 0, wh + H * 0.48, 0, 6, 'gold');
  const p = new THREE.BufferGeometry(); p.setAttribute('position', new THREE.Float32BufferAttribute([0, H - 0.05, 0, 0, H - 0.3, 0, 0.6, H - 0.17, 0, 0, H - 0.3, 0, 0, H - 0.05, 0, 0.6, H - 0.17, 0], 3)); p.computeVertexNormals(); B.add(p, 'main');
  for (let i = 0; i < 14; i += 2) { const a = i / 14 * Math.PI * 2 + Math.PI / 14; B.box(0.05, wh, 0.05, Math.cos(a) * R, 0, Math.sin(a) * R, 'white'); }
}
function cart(B, w, d, H) {
  B.box(w - 0.1, 0.12, d - 1.0, 0, 0.95, -0.3, 'beam');
  for (const sx of [-1, 1]) B.box(0.08, 0.45, d - 1.0, sx * (w / 2 - 0.09), 1.07, -0.3);
  for (const sz of [-1, 1]) B.box(w - 0.1, 0.45, 0.08, 0, 1.07, -0.3 + sz * ((d - 1.0) / 2 - 0.04));
  for (const sx of [-1, 1]) {
    B.cylX(0.65, 0.1, sx * (w / 2 + 0.0), 0.65, -0.4, 14, 'beam');
    B.cylX(0.18, 0.14, sx * (w / 2 + 0.0), 0.65, -0.4, 10, 'iron');
    const shaft = new THREE.BoxGeometry(0.08, 0.08, 1.4); shaft.rotateX(0.35); shaft.translate(sx * (w / 2 - 0.3), 0.75, d / 2 - 0.65); B.add(shaft, 'beam');
  }
  const r = rng(9); for (let i = 0; i < 6; i++) B.sphere(0.2, (r() - 0.5) * 0.8, 1.25, -0.3 + (r() - 0.5) * 1.6, 'sand', 1, 0.8, 1, 8);
}
function campfire(B, w, d, H) {
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; B.add(new THREE.DodecahedronGeometry(0.16, 0).translate(Math.cos(a) * 0.62, 0.1, Math.sin(a) * 0.62), 'iron'); }
  for (let i = 0; i < 4; i++) { const g = new THREE.CylinderGeometry(0.07, 0.07, 0.95, 6); g.rotateZ(Math.PI / 2 - 0.45); g.rotateY(i * Math.PI / 4); g.translate(0, 0.25, 0); B.add(g, 'trunk'); }
  B.cone(0.3, 0.6, 0, 0.15, 0, 8, 'flame'); B.cone(0.18, 0.45, 0.05, 0.2, 0.05, 6, 'lamp_yellow');
}
function anvil(B, w, d, H) {
  B.box(0.35, 0.35, 0.35, 0, 0, 0, 'beam');
  B.box(0.22, 0.25, 0.2, 0, 0.35, 0);
  B.box(0.3, 0.18, 0.75, 0, 0.6, -0.05);
  const horn = new THREE.ConeGeometry(0.1, 0.35, 8); horn.rotateX(Math.PI / 2); horn.translate(0, 0.72, 0.5); B.add(horn);
}
function weaponRack(B, w, d, H) {
  B.box(w - 0.3, 0.15, d - 0.2, 0, 0, 0, 'beam');
  for (const sz of [-1, 1]) B.box(0.12, H * 0.75, 0.12, 0, 0, sz * (d / 2 - 0.25), 'beam');
  B.box(0.1, 0.1, d - 0.3, 0, H * 0.6, 0, 'beam');
  for (const z of [-0.6, 0, 0.6]) { B.cyl(0.025, 0.025, H - 0.25, 0.08, 0.12, z, 6, 'trunk'); B.cone(0.05, 0.22, 0.08, H - 0.15 - GAP, z, 6, 'chrome'); }
  addShield(B, -0.12, H * 0.42, 0, -Math.PI / 2, 1.2);
}
function table(B, w, d, H) {
  B.box(w - 0.15, 0.12, d - 0.15, 0, H - 0.12 - GAP, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.14, H - 0.12, 0.14, sx * (w / 2 - 0.25), 0, sz * (d / 2 - 0.25));
}
function stool(B, w, d, H) { B.cyl(0.3, 0.3, 0.1, 0, H - 0.1 - GAP, 0, 14); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; B.cyl(0.04, 0.05, H - 0.1, Math.cos(a) * 0.18, 0, Math.sin(a) * 0.18, 6); } }
function bed(B, w, d, H) {
  B.box(w - 0.1, 0.5, d - 0.1, 0, 0, 0, 'beam');
  B.box(w - 0.3, 0.2, d - 0.4, 0, 0.5, 0.1, 'white');
  B.box(w - 0.25, 0.12, d * 0.6, 0, 0.62, d * 0.18);
  B.box(w * 0.5, 0.15, 0.5, 0, 0.7, -d / 2 + 0.6, 'white');
  B.box(w - 0.1, H - GAP, 0.15, 0, 0, -d / 2 + 0.1, 'beam');
}

// --- Landschaft ------------------------------------------------------------------
function bigRock(B, w, d, H) {
  const r = rng(w * 13 + d);
  B.add(new THREE.DodecahedronGeometry(1, 0).scale(w * 0.42, H * 0.55, d * 0.42).rotateY(0.3).translate(0, H * 0.42, 0));
  for (let i = 0; i < 4; i++) B.add(new THREE.DodecahedronGeometry(0.5 + r() * 0.5, 0).translate((r() - 0.5) * w * 0.6, 0.35, (r() - 0.5) * d * 0.6));
}
function cobble(B, w, d, H) {
  B.body(w, H * 0.45, d);
  const r = rng(w * 7 + d * 3);
  const n = Math.round(w * 2.2);
  for (let i = 0; i < n; i++) for (let j = 0; j < Math.round(d * 2.2); j++) {
    const s = 0.34 + r() * 0.08, x = -w / 2 + (w / n) * (i + 0.5) + (r() - 0.5) * 0.05, z = -d / 2 + (d / Math.round(d * 2.2)) * (j + 0.5) + (r() - 0.5) * 0.05;
    B.box(s, H * 0.5 - GAP, s, x, H * 0.45, z);
  }
}
function waves(B, w, d, H) {
  B.body(w, H * 0.5, d);
  for (let j = 0; j < d * 2; j++) for (let i = 0; i < w; i++) {
    const g = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); g.translate(-w / 2 + 0.5 + i + (j % 2) * 0.25 - 0.12, H * 0.5, -d / 2 + 0.25 + j * 0.5); B.add(g);
  }
}
function reeds(B, w, d, H) {
  const r = rng(3);
  for (let i = 0; i < 7; i++) {
    const x = (r() - 0.5) * 0.6, z = (r() - 0.5) * 0.6, h = H * (0.6 + r() * 0.4);
    const g = new THREE.CylinderGeometry(0.02, 0.03, h, 5); g.translate(0, h / 2, 0); g.rotateZ((r() - 0.5) * 0.3); g.translate(x, 0, z); B.add(g);
    if (i % 2 === 0) B.cyl(0.05, 0.05, 0.22, x, h * 0.8, z, 6, 'trunk');
  }
}
function mushroom(B, w, d, H) {
  B.cyl(0.1, 0.13, H * 0.55, 0, 0, 0, 10, 'white');
  const cap = new THREE.SphereGeometry(0.32, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); cap.scale(1, 0.75, 1); cap.translate(0, H * 0.5, 0); B.add(cap);
  for (const [x, z] of [[0.12, 0.08], [-0.1, 0.14], [0.02, -0.15], [-0.15, -0.05]]) B.sphere(0.04, x, H * 0.5 + 0.2, z, 'white', 1, 0.5, 1, 6);
}
function stump(B, w, d, H) {
  B.cyl(0.6, 0.7, H - GAP, 0, 0, 0, 14, 'trunk');
  B.cyl(0.55, 0.55, 0.02, 0, H - GAP, 0, 14, 'sand');
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; const g = new THREE.ConeGeometry(0.16, 0.6, 6); g.rotateZ(Math.PI / 2 + 0.5); g.rotateY(-a); g.translate(Math.cos(a) * 0.7, 0.12, Math.sin(a) * 0.7); B.add(g, 'trunk'); }
}
function oak(B, w, d, H) {
  B.cyl(0.42, 0.65, H * 0.45, 0, 0, 0, 12, 'trunk');
  for (let i = 0; i < 3; i++) { const a = i * 2.1; const g = new THREE.CylinderGeometry(0.12, 0.22, 1.6, 8); g.translate(0, 0.8, 0); g.rotateZ(0.7); g.rotateY(a); g.translate(0, H * 0.4, 0); B.add(g, 'trunk'); }
  const r = rng(11), R = w * 0.46;
  B.sphere(R * 1.1, 0, H * 0.66, 0, 'main', 1.1, 0.8, 1.1, 16);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; B.sphere(R * (0.55 + r() * 0.2), Math.cos(a) * R * 0.9, H * (0.6 + r() * 0.14), Math.sin(a) * R * 0.9, 'main', 1, 0.8, 1, 12); }
  B.sphere(R * 0.75, 0, H * 0.85, 0, 'main', 1, 0.8, 1, 12);
}
function lowStoneWall(B, w, d, H) {
  const r = rng(d * 5);
  for (let y = 0, row = 0; y < H - 0.1; y += 0.4, row++) {
    let z = -d / 2 + 0.05 + (row % 2) * 0.25;
    while (z < d / 2 - 0.15) {
      const len = Math.min(0.4 + r() * 0.4, d / 2 - 0.05 - z);
      B.add(new THREE.BoxGeometry(w - 0.15 - r() * 0.15, 0.36, len - 0.05).translate((r() - 0.5) * 0.06, y + 0.18, z + len / 2));
      z += len;
    }
  }
}
function lilies(B, w, d, H) {
  const r = rng(2);
  for (let i = 0; i < 4; i++) {
    const x = (r() - 0.5) * (w - 0.8), z = (r() - 0.5) * (d - 0.8);
    B.add(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 14, 1, false, 0.4, Math.PI * 1.8).translate(x, 0.03, z));
    if (i % 2 === 0) B.sphere(0.1, x, 0.12, z, 'rose', 1, 0.6, 1, 8);
  }
}

// --- Standard-Ergänzungen -------------------------------------------------------
function panel(B, w, d, H) {
  B.box(w - 2 * GAP, 0.15, d - 2 * GAP);
  B.box(0.15, H - GAP, d - 2 * GAP, -w / 2 + GAP + 0.075, 0, 0);
}
function column(B, w, d, H) {
  const R = w / 2 - 0.08;
  B.cyl(R + 0.06, R + 0.06, 0.25, 0, 0, 0, 20);
  B.cyl(R * 0.75, R * 0.8, H - 0.5 - GAP, 0, 0.25, 0, 20);
  B.cyl(R + 0.06, R * 0.75, 0.25, 0, H - 0.25 - GAP, 0, 20);
  B.studs(w, d, H);
}
function railing(B, w, d, H) {
  B.box(w - 0.3, 0.12, d - 2 * GAP);
  B.box(0.12, 0.08, d - 0.1, 0, H - 0.08 - GAP, 0);
  const n = d * 2 + 1;
  for (let i = 0; i < n; i++) B.cyl(0.035, 0.035, H - 0.2, 0, 0.12, -d / 2 + 0.1 + ((d - 0.2) / (n - 1)) * i, 6);
}
function ladder(B, w, d, H) {
  for (const sz of [-1, 1]) B.box(0.12, H - GAP, 0.12, 0, 0, sz * (d / 2 - 0.2));
  for (let y = 0.3; y < H - 0.1; y += 0.4) B.cylZ(0.035, d - 0.4, 0, y, 0, 6);
}
function flowerBox(B, w, d, H) {
  B.box(w - 0.15, H * 0.55, d - 0.15);
  const r = rng(4), cols = ['red', 'yellow', 'white', 'rose'];
  for (let i = 0; i < d * 3; i++) {
    const z = -d / 2 + 0.3 + i * ((d - 0.6) / (d * 3 - 1));
    B.sphere(0.12, (r() - 0.5) * 0.3, H * 0.55 + 0.15, z, 'stem', 1, 1, 1, 8);
    B.sphere(0.08, (r() - 0.5) * 0.3, H * 0.55 + 0.28, z, cols[i % 4], 1, 1, 1, 8);
  }
}
function chimney(B, w, d, H) {
  B.box(w - 2 * GAP, H - 0.3, d - 2 * GAP);
  stonesX(B, (w - 2 * GAP) / 2, 1, -(d - 2 * GAP) / 2, (d - 2 * GAP) / 2, 0, H - 0.3, 41, 'main', 0.25);
  stonesX(B, -(w - 2 * GAP) / 2, -1, -(d - 2 * GAP) / 2, (d - 2 * GAP) / 2, 0, H - 0.3, 43, 'main', 0.25);
  B.box(w + 0.1, 0.2, d + 0.1, 0, H - 0.3, 0);
  B.box(w - 0.5, 0.1, d - 0.5, 0, H - 0.1 - GAP, 0, 'black');
}

// ---------------------------------------------------------------------------------
export function registerExtra(def, h) {
  const { brick, slope, tile } = h;
  // Standard
  def('b44', 'Stein 4×4', 'bricks', [4, 4, 3], brick);
  def('p3232', 'Grundplatte 32×32', 'plates', [32, 32, 1], brick);
  def('p1632', 'Platte 16×32', 'plates', [16, 32, 1], brick);
  def('p68', 'Platte 6×8', 'plates', [6, 8, 1], brick);
  def('wedge24l', 'Keilplatte 2×4 links', 'plates', [2, 4, 1], (B, w, d, H) => wedgePlate(B, w, d, H, -1));
  def('wedge24r', 'Keilplatte 2×4 rechts', 'plates', [2, 4, 1], (B, w, d, H) => wedgePlate(B, w, d, H, 1));
  def('t26', 'Fliese 2×6', 'tiles', [2, 6, 1], tile);
  def('t88', 'Fliese 8×8', 'tiles', [8, 8, 1], tile);
  def('sl11f', 'Flache Schräge 1×1', 'slopes', [1, 1, 2], slope);
  def('slc22', 'Eckschräge außen 2×2', 'slopes', [2, 2, 3], cornerOuter);
  def('slci22', 'Eckschräge innen 2×2', 'slopes', [2, 2, 3], cornerInner);
  def('sl34', 'Flache Dachschräge 4×3', 'slopes', [4, 3, 3], slope);
  def('col11', 'Säule 1×1×3', 'round', [1, 1, 9], column);
  def('col22', 'Große Säule 2×2×6', 'round', [2, 2, 18], column);
  def('pan12', 'Paneel 1×2×1', 'build', [1, 2, 3], panel);
  def('pan14', 'Wandpaneel 1×4×3', 'build', [1, 4, 9], panel);
  def('rail14', 'Geländer 1×4', 'build', [1, 4, 3], railing);
  def('ladder12', 'Leiter 1×2×4', 'build', [1, 2, 12], ladder, { suggest: 'brown' });
  def('flowerbox12', 'Blumenkasten 1×2', 'build', [1, 2, 2], flowerBox, { suggest: 'brown' });
  def('chimney12', 'Schornstein 1×2×3', 'build', [1, 2, 9], chimney, { suggest: 'dark_red' });

  // Burg
  def('wall14', 'Burgmauer 1×4×2', 'castle', [1, 4, 6], (B, w, d, H) => stoneWall(B, w, d, H, 1), { suggest: 'light_grey' });
  def('wall14h', 'Hohe Burgmauer 1×4×4', 'castle', [1, 4, 12], (B, w, d, H) => stoneWall(B, w, d, H, 2), { suggest: 'light_grey' });
  def('wall12', 'Burgmauer 1×2×2', 'castle', [1, 2, 6], (B, w, d, H) => stoneWall(B, w, d, H, 3), { suggest: 'light_grey' });
  def('walk24', 'Wehrgang 2×4', 'castle', [2, 4, 4], battlementWalk, { suggest: 'light_grey' });
  def('tower_s44', 'Turmsegment eckig 4×4', 'castle', [4, 4, 9], towerSquare, { suggest: 'light_grey' });
  def('tower_r44', 'Turmsegment rund 4×4', 'castle', [4, 4, 9], towerRound, { suggest: 'light_grey' });
  def('turret22', 'Ecktürmchen 2×2', 'castle', [2, 2, 12], turret, { suggest: 'light_grey' });
  def('gate18', 'Burgtor 1×8×5', 'castle', [1, 8, 15], gate, { suggest: 'light_grey' });
  def('bridge46', 'Zugbrücke 4×6', 'castle', [4, 6, 1], drawbridge, { suggest: 'brown' });
  def('door14c', 'Burgtür 1×4×5', 'castle', [1, 4, 15], castleDoor, { suggest: 'light_grey' });
  def('lancet12', 'Spitzbogenfenster 1×2×3', 'castle', [1, 2, 9], lancet, { suggest: 'light_grey' });
  def('spiral33', 'Wendeltreppe 3×3', 'castle', [3, 3, 12], spiral, { suggest: 'light_grey' });
  def('banner12', 'Wandbanner', 'castle', [1, 2, 9], banner, { suggest: 'blue' });
  def('timber14', 'Fachwerkwand 1×4×3', 'castle', [1, 4, 9], timberWall, { suggest: 'white' });
  def('palisade14', 'Palisade 1×4', 'castle', [1, 4, 9], palisade, { suggest: 'brown' });
  def('catapult34', 'Katapult', 'castle', [3, 4, 7], catapult, { suggest: 'brown' });
  def('throne22', 'Thron', 'castle', [2, 2, 9], throne, { suggest: 'dark_red' });
  def('brazier11', 'Feuerschale', 'castle', [1, 1, 3], brazier, { suggest: 'dark_grey' });

  // Dorf & Markt
  def('chest12', 'Schatztruhe', 'village', [1, 2, 3], chest, { suggest: 'brown' });
  def('barrel11', 'Fass', 'village', [1, 1, 3], barrel, { suggest: 'brown' });
  def('crate11', 'Kiste', 'village', [1, 1, 3], crate, { suggest: 'tan' });
  def('hay22', 'Heuballen', 'village', [2, 2, 3], hay, { suggest: 'yellow' });
  def('well33', 'Brunnen', 'village', [3, 3, 9], well, { suggest: 'light_grey' });
  def('stall34', 'Marktstand', 'village', [3, 4, 12], marketStall, { suggest: 'red' });
  def('tent44', 'Ritterzelt', 'village', [4, 4, 10], tent, { suggest: 'blue' });
  def('cart24', 'Karren', 'village', [2, 4, 4], cart, { suggest: 'brown' });
  def('fire22', 'Lagerfeuer', 'village', [2, 2, 2], campfire, { suggest: 'brown' });
  def('anvil11', 'Amboss', 'village', [1, 1, 2], anvil, { suggest: 'dark_iron' });
  def('rack13', 'Waffenständer', 'village', [1, 3, 5], weaponRack, { suggest: 'red' });
  def('table26', 'Lange Tafel', 'village', [2, 6, 3], table, { suggest: 'brown' });
  def('stool11', 'Hocker', 'village', [1, 1, 2], stool, { suggest: 'brown' });
  def('bed24', 'Bett', 'village', [2, 4, 3], bed, { suggest: 'blue' });

  // Ritter & Wesen
  def('fig_knight', 'Ritter', 'knights', [1, 1, 7], knight, { suggest: 'blue' });
  def('fig_king', 'König', 'knights', [1, 1, 7], king, { suggest: 'dark_red' });
  def('fig_lady', 'Burgfräulein', 'knights', [1, 1, 8], princess, { suggest: 'pink' });
  def('fig_archer', 'Bogenschütze', 'knights', [1, 1, 6], archer, { suggest: 'dark_green' });
  def('fig_wizard', 'Zauberer', 'knights', [1, 1, 8], wizard, { suggest: 'purple' });
  def('fig_guard', 'Wache', 'knights', [1, 1, 7], guard, { suggest: 'red' });
  def('fig_villager', 'Bauer', 'knights', [1, 1, 6], villager, { suggest: 'brown' });
  def('horse24', 'Pferd', 'knights', [2, 4, 7], horse, { suggest: 'brown' });
  def('knight_horse', 'Ritter zu Pferd', 'knights', [2, 4, 9], knightOnHorse, { suggest: 'red' });
  def('dragon68', 'Großer Drache', 'knights', [6, 8, 14], dragon, { suggest: 'dark_green' });
  def('dragon24', 'Kleiner Drache', 'knights', [2, 3, 5], dragon, { suggest: 'red' });
  def('fire14', 'Feueratem', 'knights', [1, 4, 3], fireBreath, { suggest: 'orange' });
  def('sheep12', 'Schaf', 'knights', [1, 2, 4], sheep, { suggest: 'white' });
  def('chicken11', 'Huhn', 'knights', [1, 1, 2], chicken, { suggest: 'white' });
  def('pig12', 'Schwein', 'knights', [1, 2, 3], pig, { suggest: 'rose' });

  // Landschaft
  def('hill44', 'Hang 4×4', 'nature', [4, 4, 6], slope, { suggest: 'green' });
  def('hill46', 'Langer Hang 4×6', 'nature', [4, 6, 6], slope, { suggest: 'green' });
  def('hillc44', 'Hangecke 4×4', 'nature', [4, 4, 6], cornerOuter, { suggest: 'green' });
  def('hillci44', 'Hang-Innenecke 4×4', 'nature', [4, 4, 6], cornerInner, { suggest: 'green' });
  def('rock44', 'Großer Fels', 'nature', [4, 4, 9], bigRock, { suggest: 'dark_grey' });
  def('cobble44', 'Pflaster 4×4', 'nature', [4, 4, 1], cobble, { suggest: 'light_grey' });
  def('water44', 'Wasser 4×4', 'nature', [4, 4, 1], waves, { suggest: 'trans_blue' });
  def('lily44', 'Seerosen', 'nature', [4, 4, 1], lilies, { suggest: 'green' });
  def('reeds11', 'Schilf', 'nature', [1, 1, 5], reeds, { suggest: 'lime' });
  def('mushroom11', 'Pilz', 'nature', [1, 1, 2], mushroom, { suggest: 'red' });
  def('stump22', 'Baumstumpf', 'nature', [2, 2, 2], stump, { suggest: 'brown' });
  def('tree_oak', 'Alte Eiche', 'nature', [4, 4, 22], oak, { suggest: 'green' });
  def('stonewall14', 'Steinmäuerchen 1×4', 'nature', [1, 4, 3], lowStoneWall, { suggest: 'light_grey' });
}
