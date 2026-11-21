// Geometrie-Helfer: alle Teile werden aus einfachen Grundkörpern zusammengesetzt
// und pro Material zu einer einzigen BufferGeometry verschmolzen.
import * as THREE from '../../vendor/three.module.min.js';
import { mergeGeometries } from '../../vendor/BufferGeometryUtils.js';

export const PH = 0.4;      // Plattenhöhe (Welt-Einheiten)
export const GAP = 0.012;   // Fuge pro Seite
export const STUD_R = 0.29;
export const STUD_H = 0.18;

function clean(g) {
  let geo = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k);
  if (!geo.attributes.normal) geo.computeVertexNormals();
  return geo;
}

// Sammelt Geometrien nach Material-Schlüssel ('main' = gewählte Farbe, sonst feste Materialien)
export class Builder {
  constructor() { this.parts = new Map(); }
  add(geo, mat = 'main') {
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat).push(clean(geo));
    return this;
  }
  box(w, h, d, x = 0, y = 0, z = 0, mat) {
    const g = new THREE.BoxGeometry(Math.max(w, 0.001), Math.max(h, 0.001), Math.max(d, 0.001));
    g.translate(x, y + h / 2, z);
    return this.add(g, mat);
  }
  // Würfel mit Fuge (Grundkörper eines Steins)
  body(w, h, d, x = 0, y = 0, z = 0, mat) {
    return this.box(w - 2 * GAP, h - GAP, d - 2 * GAP, x, y, z, mat);
  }
  cyl(rt, rb, h, x = 0, y = 0, z = 0, seg = 24, mat, open = false) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
    g.translate(x, y + h / 2, z);
    return this.add(g, mat);
  }
  // liegender Zylinder entlang X
  cylX(r, len, x, y, z, seg = 24, mat) {
    const g = new THREE.CylinderGeometry(r, r, len, seg);
    g.rotateZ(Math.PI / 2); g.translate(x, y, z);
    return this.add(g, mat);
  }
  cylZ(r, len, x, y, z, seg = 24, mat, rt) {
    const g = new THREE.CylinderGeometry(rt ?? r, r, len, seg);
    g.rotateX(Math.PI / 2); g.translate(x, y, z);
    return this.add(g, mat);
  }
  sphere(r, x, y, z, mat, sx = 1, sy = 1, sz = 1, seg = 20) {
    const g = new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.6 | 0));
    g.scale(sx, sy, sz); g.translate(x, y, z);
    return this.add(g, mat);
  }
  cone(r, h, x = 0, y = 0, z = 0, seg = 24, mat) {
    const g = new THREE.ConeGeometry(r, h, seg);
    g.translate(x, y + h / 2, z);
    return this.add(g, mat);
  }
  torus(r, t, x, y, z, rx = 0, ry = 0, mat) {
    const g = new THREE.TorusGeometry(r, t, 10, 28);
    g.rotateX(rx); g.rotateY(ry); g.translate(x, y, z);
    return this.add(g, mat);
  }
  stud(x, y, z, mat, r = STUD_R, h = STUD_H) {
    return this.cyl(r, r, h, x, y, z, 18, mat);
  }
  studs(w, d, y, mat, ox = 0, oz = 0) {
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++)
      this.stud(-w / 2 + 0.5 + i + ox, y, -d / 2 + 0.5 + j + oz, mat);
    return this;
  }
  // Profil (u = Z, v = Y) entlang X extrudieren, zentriert
  profileX(points, width, mat, x = 0) {
    const s = new THREE.Shape();
    s.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1]);
    s.closePath();
    return this.shapeX(s, width, mat, x);
  }
  shapeX(shape, width, mat, x = 0) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 16 });
    g.rotateY(-Math.PI / 2);           // Shape-u -> Welt-Z, Extrusion -> -X
    g.translate(width / 2 + x, 0, 0);
    return this.add(g, mat);
  }
  // Profil (u = X, v = Z) als Grundriss nach oben extrudieren
  shapeUp(shape, height, y = 0, mat) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 16 });
    g.rotateX(Math.PI / 2);            // v -> +Z? (rotateX(+90): y->z) Extrusion -> -Y
    g.translate(0, y + height, 0);
    return this.add(g, mat);
  }
  addRaw(geo, mat) { return this.add(geo, mat); }

  finish() {
    const out = [];
    for (const [mat, list] of this.parts) {
      const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
      merged.computeBoundingBox(); merged.computeBoundingSphere();
      out.push({ mat, geo: merged });
    }
    return out;
  }
}

export function shape(points) {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1]);
  s.closePath();
  return s;
}

export { THREE };
