// Teile-Katalog, Farben und Materialien von Baukasten 3D
import { Builder, PH, GAP, shape, THREE } from './geom.js';
import { registerExtra } from './parts-extra.js';

// ---------------------------------------------------------------------------
// Farben
// ---------------------------------------------------------------------------
export const COLOR_GROUPS = [
  { id: 'solid', name: 'Standard' },
  { id: 'trans', name: 'Transparent' },
  { id: 'metal', name: 'Metall' },
  { id: 'glow', name: 'Leuchtend' },
];

export const COLORS = [
  { id: 'white', name: 'Weiß', hex: '#f4f4f1', g: 'solid' },
  { id: 'light_grey', name: 'Hellgrau', hex: '#a9adb3', g: 'solid' },
  { id: 'dark_grey', name: 'Dunkelgrau', hex: '#5d636b', g: 'solid' },
  { id: 'black', name: 'Schwarz', hex: '#232529', g: 'solid' },
  { id: 'red', name: 'Rot', hex: '#d1302c', g: 'solid' },
  { id: 'dark_red', name: 'Weinrot', hex: '#8a1e22', g: 'solid' },
  { id: 'orange', name: 'Orange', hex: '#f0882a', g: 'solid' },
  { id: 'yellow', name: 'Gelb', hex: '#f6c623', g: 'solid' },
  { id: 'tan', name: 'Sand', hex: '#dcc08f', g: 'solid' },
  { id: 'brown', name: 'Braun', hex: '#7b4b2a', g: 'solid' },
  { id: 'lime', name: 'Hellgrün', hex: '#9cc63f', g: 'solid' },
  { id: 'green', name: 'Grün', hex: '#2f9d4f', g: 'solid' },
  { id: 'dark_green', name: 'Tannengrün', hex: '#1f5c3a', g: 'solid' },
  { id: 'pastel_mint', name: 'Mint', hex: '#a6e2c7', g: 'solid' },
  { id: 'teal', name: 'Türkis', hex: '#17a39a', g: 'solid' },
  { id: 'light_blue', name: 'Himmelblau', hex: '#70b6ee', g: 'solid' },
  { id: 'blue', name: 'Blau', hex: '#1f5fc0', g: 'solid' },
  { id: 'navy', name: 'Nachtblau', hex: '#1e2f5c', g: 'solid' },
  { id: 'lavender', name: 'Flieder', hex: '#b8a4e4', g: 'solid' },
  { id: 'purple', name: 'Violett', hex: '#7449c6', g: 'solid' },
  { id: 'pink', name: 'Pink', hex: '#ea5d9a', g: 'solid' },
  { id: 'rose', name: 'Rosa', hex: '#f6b9cf', g: 'solid' },

  { id: 'trans_clear', name: 'Glas klar', hex: '#dfeff7', g: 'trans', opacity: 0.38 },
  { id: 'trans_blue', name: 'Glas blau', hex: '#3d8fe0', g: 'trans', opacity: 0.5 },
  { id: 'trans_ruby', name: 'Glas rot', hex: '#e8364f', g: 'trans', opacity: 0.55 },
  { id: 'trans_green', name: 'Glas grün', hex: '#3cc46a', g: 'trans', opacity: 0.5 },
  { id: 'trans_yellow', name: 'Glas gelb', hex: '#f7d23c', g: 'trans', opacity: 0.55 },

  { id: 'gold', name: 'Gold', hex: '#d9a72b', g: 'metal', metalness: 0.85, roughness: 0.28 },
  { id: 'silver', name: 'Silber', hex: '#c3c8cf', g: 'metal', metalness: 0.9, roughness: 0.25 },
  { id: 'dark_iron', name: 'Eisen', hex: '#4a5059', g: 'metal', metalness: 0.75, roughness: 0.42 },

  { id: 'neon_green', name: 'Leucht-Grün', hex: '#35e07a', g: 'glow', glow: 0.9 },
  { id: 'neon_orange', name: 'Leucht-Orange', hex: '#ff8a2a', g: 'glow', glow: 0.9 },
  { id: 'neon_cyan', name: 'Leucht-Blau', hex: '#2fd5ff', g: 'glow', glow: 0.9 },
  { id: 'neon_purple', name: 'Leucht-Violett', hex: '#b65cff', g: 'glow', glow: 0.9 },
];

export const COLOR_MAP = new Map(COLORS.map(c => [c.id, c]));

// Farbangabe auflösen: Paletten-ID oder eigene Farbe als '#rrggbb'
export function colorInfo(id) {
  if (COLOR_MAP.has(id)) return COLOR_MAP.get(id);
  if (typeof id === 'string' && /^#[0-9a-f]{6}$/i.test(id)) return { id, name: id.toUpperCase(), hex: id, g: 'custom' };
  return COLOR_MAP.get('red');
}

// Feste Materialien für Details (Reifen, Glas, Holz …) – unabhängig von der Farbwahl
export const FIXED = {
  tyre: { hex: '#1d1e22', roughness: 0.85 },
  rim: { hex: '#c9ced6', metalness: 0.6, roughness: 0.35 },
  glass: { hex: '#cfe7f5', opacity: 0.35, roughness: 0.05 },
  chrome: { hex: '#d7dce3', metalness: 1, roughness: 0.18 },
  iron: { hex: '#3f454d', metalness: 0.6, roughness: 0.5 },
  trunk: { hex: '#6e4426', roughness: 0.8 },
  birch: { hex: '#efede6', roughness: 0.7 },
  stem: { hex: '#3e8a3a' },
  black: { hex: '#1f2124' },
  white: { hex: '#f6f6f3' },
  yellow: { hex: '#f6c623' },
  red: { hex: '#d1302c' },
  gold: { hex: '#d9a72b', metalness: 0.85, roughness: 0.3 },
  sand: { hex: '#d9b984', roughness: 0.8 },
  lamp: { hex: '#fff3c4', glow: 1.2 },
  lamp_red: { hex: '#ff3b3b', glow: 1.0 },
  lamp_yellow: { hex: '#ffc531', glow: 0.9 },
  lamp_green: { hex: '#2fe06d', glow: 0.9 },
  flame: { hex: '#ff8a1f', glow: 1.4 },
  solar: { hex: '#1e3a7a', metalness: 0.5, roughness: 0.25 },
  engine: { hex: '#ff7a1a', glow: 1.3 },
  skin: { hex: '#e8b98f', roughness: 0.6 },
  magic: { hex: '#6ee7ff', glow: 1.4 },
  beam: { hex: '#5b3a22', roughness: 0.8 },
  roof: { hex: '#8e2f2a', roughness: 0.6 },
  water: { hex: '#3d8fe0', opacity: 0.6, roughness: 0.1 },
  rose: { hex: '#f6b9cf' },
};

// ---------------------------------------------------------------------------
// Kategorien
// ---------------------------------------------------------------------------
export const CATEGORIES = [
  { id: 'bricks', name: 'Steine' },
  { id: 'plates', name: 'Platten' },
  { id: 'tiles', name: 'Fliesen' },
  { id: 'slopes', name: 'Schrägen' },
  { id: 'round', name: 'Rund & Bögen' },
  { id: 'build', name: 'Fenster & Türen' },
  { id: 'vehicle', name: 'Fahrzeug' },
  { id: 'nature', name: 'Natur & Landschaft' },
  { id: 'castle', name: 'Burg' },
  { id: 'village', name: 'Dorf & Markt' },
  { id: 'knights', name: 'Ritter & Wesen' },
  { id: 'city', name: 'Stadt' },
  { id: 'space', name: 'Raumfahrt' },
  { id: 'figure', name: 'Figurenteile' },
];

// ---------------------------------------------------------------------------
// Bau-Funktionen (Geometrie mit Ursprung unten Mitte; Breite w = X, Tiefe d = Z)
// ---------------------------------------------------------------------------
const brick = (B, w, d, H) => { B.body(w, H, d); B.studs(w, d, H); };
const tile = (B, w, d, H) => { B.body(w, H, d); };

function corner(B, w, d, H, studs = true) {
  // L-Form: volles Feld hinten links + rechts, vorne links
  B.body(w, H, d / 2, 0, 0, -d / 4);
  B.body(w / 2, H, d / 2, -w / 4, 0, d / 4);
  if (studs) { B.studs(w, d / 2, H, undefined, 0, -d / 4); B.studs(w / 2, d / 2, H, undefined, -w / 4, d / 4); }
}

function slope(B, w, d, H) {
  const flat = d >= 2 ? 1 : 0.15, lip = Math.min(0.2, H * 0.25);
  const z0 = -d / 2 + GAP, z1 = d / 2 - GAP;
  B.profileX([[z0, 0], [z1, 0], [z1, lip], [z0 + flat, H - GAP], [z0, H - GAP]], w - 2 * GAP);
  if (d >= 2) B.studs(w, 1, H, undefined, 0, -d / 2 + 0.5);
}

function slopeInv(B, w, d, H) {
  const flat = d >= 2 ? 1 : 0.15, lip = Math.min(0.2, H * 0.25);
  const z0 = -d / 2 + GAP, z1 = d / 2 - GAP;
  B.profileX([[z0, 0], [z0 + flat, 0], [z1, H - lip], [z1, H - GAP], [z0, H - GAP]], w - 2 * GAP);
  B.studs(w, d, H);
}

function ridge(B, w, d, H) {
  const z0 = -d / 2 + GAP, z1 = d / 2 - GAP, lip = 0.16;
  B.profileX([[z0, 0], [z1, 0], [z1, lip], [0.18, H - GAP], [-0.18, H - GAP], [z0, lip]], w - 2 * GAP);
}

function curve(B, w, d, H) {
  const z0 = -d / 2 + GAP, z1 = d / 2 - GAP;
  const s = new THREE.Shape();
  s.moveTo(z0, 0); s.lineTo(z1, 0); s.lineTo(z1, 0.1);
  s.quadraticCurveTo(z1 - 0.1, H - GAP, z0 + 0.1, H - GAP);
  s.lineTo(z0, H - GAP); s.closePath();
  B.shapeX(s, w - 2 * GAP);
}

function pyramid(B, w, d, H) {
  const g = new THREE.ConeGeometry(Math.SQRT1_2 * (w - 0.04), H, 4, 1);
  g.rotateY(Math.PI / 4); g.translate(0, H / 2, 0);
  B.add(g);
}

function arch(B, w, d, H) {
  const span = d - 2, r = span / 2, z0 = -d / 2 + GAP, z1 = d / 2 - GAP;
  const top = Math.min(H - 0.4, H * 0.7), ys = top - r;
  const s = new THREE.Shape();
  s.moveTo(z0, 0); s.lineTo(-r, 0); s.lineTo(-r, ys);
  s.absarc(0, ys, r, Math.PI, 0, true);
  s.lineTo(r, 0); s.lineTo(z1, 0); s.lineTo(z1, H - GAP); s.lineTo(z0, H - GAP); s.closePath();
  B.shapeX(s, w - 2 * GAP);
  B.studs(w, d, H);
}

function roundBrick(B, w, d, H, studs = true, seg = 32) {
  B.cyl(w / 2 - GAP * 2, w / 2 - GAP * 2, H - GAP, 0, 0, 0, seg);
  if (studs) {
    if (w <= 1) B.stud(0, H, 0);
    else B.studs(w, d, H);
  }
}

function frame(B, w, d, H, opts = {}) {
  // Wandelement: Länge entlang Z (d), Stärke entlang X (w)
  const t = 0.22, L = d - 2 * GAP, T = w - 2 * GAP * 2;
  const tw = opts.thin ? T * 0.5 : T;
  B.box(tw, 0.32, L, 0, 0, 0);                               // Brüstung
  B.box(tw, 0.24, L, 0, H - 0.24 - GAP, 0);                  // Sturz
  B.box(tw, H - 0.56 - GAP, t, 0, 0.32, -L / 2 + t / 2);     // Pfosten
  B.box(tw, H - 0.56 - GAP, t, 0, 0.32, L / 2 - t / 2);
  B.studs(w, d, H);
}

function windowPart(B, w, d, H, mullions = 0) {
  frame(B, w, d, H);
  const L = d - 2 * GAP - 0.44, ih = H - 0.56 - GAP;
  B.box(0.06, ih, L, 0, 0.32, 0, 'glass');
  if (mullions) {
    B.box(0.1, 0.07, L, 0, 0.32 + ih / 2, 0);
    for (let i = 1; i <= mullions; i++) B.box(0.1, ih, 0.07, 0, 0.32, -L / 2 + (L / (mullions + 1)) * i);
  }
}

function door(B, w, d, H) {
  frame(B, w, d, H);
  const L = d - 2 * GAP - 0.46, ih = H - 0.58;
  B.box(0.14, ih, L, 0.12, 0.33, 0);
  B.sphere(0.07, 0.24, 0.33 + ih * 0.48, L / 2 - 0.22, 'gold');
  for (const yy of [0.3, 0.62]) B.box(0.04, ih * 0.28, L * 0.7, 0.2, 0.33 + ih * yy, 0);
}

function bars(B, w, d, H) {
  frame(B, w, d, H);
  const L = d - 2 * GAP - 0.44, ih = H - 0.56 - GAP, n = Math.round(d * 2);
  for (let i = 1; i < n; i++) B.cyl(0.035, 0.035, ih, 0, 0.32, -L / 2 + (L / n) * i, 8, 'iron');
}

function slitWall(B, w, d, H) {
  const L = d - 2 * GAP, T = w - 2 * GAP, sw = 0.22, sh = H * 0.55, sy = H * 0.22;
  B.box(T, sy, L);
  B.box(T, H - GAP - sy - sh, L, 0, sy + sh, 0);
  B.box(T, sh, (L - sw) / 2, 0, sy, -L / 2 + (L - sw) / 4);
  B.box(T, sh, (L - sw) / 2, 0, sy, L / 2 - (L - sw) / 4);
  B.studs(w, d, H);
}

function fence(B, w, d, H, ornate = false) {
  const L = d - 2 * GAP;
  B.box(w - 0.1, PH * 0.6, L, 0, 0, 0);
  B.box(0.16, 0.12, L, 0, H * 0.45, 0);
  B.box(0.16, 0.12, L, 0, H * 0.85, 0);
  const n = ornate ? d * 2 + 1 : d + 1;
  for (let i = 0; i < n; i++) {
    const z = -L / 2 + 0.08 + ((L - 0.16) / (n - 1)) * i;
    B.box(0.14, H - GAP - 0.12, 0.14, 0, 0, z);
    if (ornate) B.cone(0.09, 0.18, 0, H - GAP - 0.12, z, 4);
  }
}

function stairs(B, w, d, H) {
  const steps = d, sh = H / steps;
  for (let i = 0; i < steps; i++) {
    const hh = sh * (i + 1);
    B.body(w, hh, 1, 0, 0, d / 2 - 0.5 - i);
    B.studs(w, 1, hh, undefined, 0, d / 2 - 0.5 - i);
  }
}

function crenel(B, w, d, H) {
  const L = d - 2 * GAP, T = w - 2 * GAP;
  B.box(T, H * 0.4, L);
  const mw = L * 0.36;
  B.box(T, H * 0.6 - GAP, mw, 0, H * 0.4, -L / 2 + mw / 2);
  B.box(T, H * 0.6 - GAP, mw, 0, H * 0.4, L / 2 - mw / 2);
  B.stud(0, H, -d / 2 + 0.5); if (d > 1) B.stud(0, H, d / 2 - 0.5);
}

// --- Fahrzeug ---------------------------------------------------------------
function wheel(B, w, d, H) {
  const r = Math.min(d, H) / 2 - 0.02, t = Math.min(w, 1) * 0.62;
  B.cylX(r, t, 0, r, 0, 32, 'tyre');
  B.cylX(r * 0.58, t + 0.02, 0, r, 0, 24);
  B.cylX(r * 0.22, t + 0.06, 0, r, 0, 16, 'rim');
}

function axle(B, w, d, H) {
  const r = 0.72, t = 0.56, cy = r;
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - t / 2 - 0.02);
    B.cylX(r, t, x, cy, 0, 32, 'tyre');
    B.cylX(r * 0.58, t + 0.02, x, cy, 0, 24, 'rim');
    B.cylX(r * 0.2, t + 0.05, x, cy, 0, 12);
  }
  B.cylX(0.1, w - 0.4, 0, cy, 0, 10, 'iron');
  B.body(2, PH * 2, d, 0, H - PH * 2, 0);
  B.box(0.5, H - PH * 2 - cy, 0.5, 0, cy, 0, 'iron');
  B.studs(2, d, H);
}

function mudguard(B, w, d, H) {
  const r = 0.85, z0 = -d / 2 + GAP, z1 = d / 2 - GAP, ys = H - r - 0.25;
  const s = new THREE.Shape();
  s.moveTo(z0, 0); s.lineTo(-r, 0); s.lineTo(-r, ys);
  s.absarc(0, ys, r, Math.PI, 0, true);
  s.lineTo(r, 0); s.lineTo(z1, 0); s.lineTo(z1, H - GAP); s.lineTo(z0, H - GAP); s.closePath();
  B.shapeX(s, w - 2 * GAP);
  B.studs(w, d, H);
}

function windshield(B, w, d, H) {
  B.body(w, PH * 0.6, d);
  const z0 = d / 2 - 0.25, z1 = -d / 2 + 0.35, t = 0.1;
  B.profileX([[z0, PH * 0.6], [z0 + t, PH * 0.6], [z1 + t, H - GAP], [z1, H - GAP]], w - 0.3, 'glass');
  B.box(w - 0.1, 0.12, 0.3, 0, H - 0.12 - GAP, z1 + 0.05);
  for (const sx of [-1, 1]) B.profileX([[z0, PH * 0.6], [z0 + 0.12, PH * 0.6], [z1 + 0.12, H - GAP], [z1, H - GAP]], 0.12, undefined, sx * (w / 2 - 0.08));
}

function seat(B, w, d, H) {
  B.body(w, PH, d);
  B.box(w - 0.4, 0.3, d - 0.5, 0, PH, 0.15);
  B.box(w - 0.4, H - PH - GAP, 0.3, 0, PH, -d / 2 + 0.3);
  B.box(w - 0.7, 0.25, 0.3, 0, H - 0.25, -d / 2 + 0.3);
}

function steering(B, w, d, H) {
  B.body(w, PH, d);
  const g = new THREE.CylinderGeometry(0.07, 0.07, H * 0.6, 8);
  g.rotateX(-0.45); g.translate(0, PH + H * 0.25, 0.05);
  B.add(g, 'black');
  B.torus(0.32, 0.05, 0, PH + H * 0.52, 0.18, -0.45 + Math.PI / 2, 0, 'black');
}

function headlight(B, w, d, H) {
  B.body(w, H, d);
  B.stud(0, H, 0);
  B.cylZ(0.3, 0.06, 0, H / 2, d / 2 + 0.01, 24, 'lamp');
}

function spoiler(B, w, d, H) {
  B.body(w, PH, d);
  for (const sz of [-1, 1]) B.box(0.2, H - PH - 0.2, 0.2, 0, PH, sz * (d / 2 - 0.6));
  const g = new THREE.BoxGeometry(1.1, 0.1, d - 0.1); g.rotateZ(0.18); g.translate(0, H - 0.16, 0); B.add(g);
  for (const sz of [-1, 1]) B.box(1.0, 0.36, 0.06, 0, H - 0.36, sz * (d / 2 - 0.08));
}

function exhaust(B, w, d, H) {
  B.body(w, PH, d);
  for (const sx of [-0.22, 0.22]) {
    B.cylZ(0.16, d - 0.1, sx, PH + 0.2, 0, 16, 'chrome');
    B.cylZ(0.11, 0.05, sx, PH + 0.2, d / 2 - 0.02, 16, 'black');
  }
}

function engine(B, w, d, H) {
  B.body(w, H * 0.6, d);
  B.box(w - 0.5, H * 0.25, d - 0.4, 0, H * 0.6, 0, 'iron');
  for (let i = 0; i < 4; i++) B.cyl(0.18, 0.18, H * 0.15, (i % 2 ? 0.4 : -0.4), H * 0.85 - GAP, -0.6 + (i >> 1) * 1.2, 16, 'chrome');
}

function propeller(B, w, d, H) {
  B.cyl(0.25, 0.32, H * 0.5, 0, 0, 0, 16);
  B.cone(0.22, H * 0.4, 0, H * 0.6 - GAP, 0, 16);
  const b1 = new THREE.BoxGeometry(2.6, 0.06, 0.28); b1.rotateX(0.25); b1.translate(0, H * 0.5, 0); B.add(b1);
  const b2 = new THREE.BoxGeometry(0.28, 0.06, 2.6); b2.rotateZ(0.25); b2.translate(0, H * 0.5, 0); B.add(b2);
}

// --- Natur ------------------------------------------------------------------
function treeLeaf(B, w, d, H, opts = {}) {
  const th = H * 0.35;
  B.cyl(0.2, 0.28, th + 0.3, 0, 0, 0, 12, opts.trunk || 'trunk');
  B.cyl(0.45, 0.45, PH * 0.5, 0, 0, 0, 16, opts.trunk || 'trunk');
  const cy = th + (H - th) * 0.48, R = Math.min(w, d) * 0.48;
  B.sphere(R, 0, cy, 0, 'main', 1, 0.95, 1, 18);
  B.sphere(R * 0.7, R * 0.45, cy + R * 0.35, 0.15, 'main', 1, 1, 1, 14);
  B.sphere(R * 0.68, -R * 0.4, cy + R * 0.25, -0.25, 'main', 1, 1, 1, 14);
  B.sphere(R * 0.62, 0.05, cy + R * 0.62, -0.1, 'main', 1, 1, 1, 14);
  if (opts.fruit) {
    const pts = [[0.7, 0.1, 0.55], [-0.6, -0.15, 0.6], [0.3, 0.45, -0.75], [-0.35, 0.5, -0.7], [0.85, 0.35, -0.15], [-0.85, 0.25, 0.1], [0.1, -0.3, 0.88]];
    for (const [x, y, z] of pts) B.sphere(0.13, x * R, cy + y * R, z * R, opts.fruit, 1, 1, 1, 10);
  }
}

function treePine(B, w, d, H) {
  const th = H * 0.18;
  B.cyl(0.18, 0.24, th + 0.3, 0, 0, 0, 10, 'trunk');
  const R = Math.min(w, d) * 0.5;
  const levels = 4, lh = (H - th) / levels * 1.35;
  for (let i = 0; i < levels; i++) {
    const r = R * (1 - i * 0.2);
    B.cone(r, lh, 0, th + i * (H - th - lh) / (levels - 1), 0, 14);
  }
}

function treeBirch(B, w, d, H) {
  B.cyl(0.14, 0.18, H * 0.65, 0, 0, 0, 10, 'birch');
  for (const y of [0.15, 0.32, 0.5]) B.cyl(0.185, 0.185, 0.04, 0, H * y, 0, 10, 'black');
  B.sphere(0.5, 0, H * 0.72, 0, 'main', 1, 1.6, 1, 16);
}

function treePalm(B, w, d, H) {
  const seg = 7, sh = (H * 0.78) / seg;
  for (let i = 0; i < seg; i++) {
    const x = Math.pow(i / seg, 1.6) * 0.5;
    B.cyl(0.17 - i * 0.008, 0.2 - i * 0.008, sh * 1.05, x, i * sh, 0, 10, 'sand');
  }
  const topY = H * 0.78, tx = 0.5;
  B.sphere(0.24, tx, topY, 0, 'trunk', 1, 0.8, 1, 10);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const g = new THREE.BoxGeometry(1.5, 0.05, 0.42);
    g.translate(0.72, 0, 0); g.rotateZ(-0.38); g.rotateY(a); g.translate(tx, topY + 0.05, 0);
    B.add(g);
  }
}

function bush(B, w, d, H) {
  const R = Math.min(w, d) * 0.36;
  B.sphere(R, -0.3, R * 0.8, 0.15, 'main', 1, 0.9, 1, 14);
  B.sphere(R * 0.9, 0.35, R * 0.75, -0.2, 'main', 1, 0.9, 1, 14);
  B.sphere(R * 0.8, 0.1, R * 1.35, 0.1, 'main', 1, 0.9, 1, 14);
  B.sphere(R * 0.7, 0, R * 0.65, 0.5, 'main', 1, 0.9, 1, 12);
}

function flower(B, w, d, H) {
  B.body(w, PH * 0.5, d, 0, 0, 0, 'stem');
  B.cyl(0.04, 0.04, H * 0.62, 0, PH * 0.5, 0, 6, 'stem');
  const leaf = new THREE.SphereGeometry(0.16, 8, 6); leaf.scale(1, 0.25, 0.5); leaf.translate(0.16, H * 0.35, 0); B.add(leaf, 'stem');
  const cy = H * 0.82;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    B.sphere(0.13, Math.cos(a) * 0.17, cy, Math.sin(a) * 0.17, 'main', 1, 0.45, 1, 10);
  }
  B.sphere(0.1, 0, cy + 0.03, 0, 'yellow', 1, 0.6, 1, 10);
}

function grass(B, w, d, H) {
  B.body(w, PH * 0.4, d);
  const blades = [[0, 0, 0, 1], [0.18, 0.1, 0.35, 0.8], [-0.18, -0.08, -0.35, 0.85], [0.05, -0.18, 0.2, 0.7], [-0.08, 0.2, -0.25, 0.75]];
  for (const [x, z, tilt, s] of blades) {
    const g = new THREE.ConeGeometry(0.07, H * s, 4);
    g.translate(0, (H * s) / 2, 0); g.rotateZ(tilt); g.translate(x, PH * 0.4, z);
    B.add(g);
  }
}

function rock(B, w, d, H) {
  const g = new THREE.DodecahedronGeometry(0.8, 0);
  g.scale(w / 1.7, H / 1.5, d / 1.7); g.rotateY(0.4); g.translate(0, H * 0.44, 0);
  B.add(g);
  const g2 = new THREE.DodecahedronGeometry(0.4, 0);
  g2.translate(w * 0.32, 0.3, d * 0.28); B.add(g2);
}

function crystal(B, w, d, H) {
  B.cone(0.36, H * 0.35, 0, H * 0.65 - GAP, 0, 6);
  const g = new THREE.CylinderGeometry(0.36, 0.26, H * 0.65, 6); g.translate(0, H * 0.325, 0); B.add(g);
}

// --- Stadt ------------------------------------------------------------------
function lamp(B, w, d, H) {
  B.cyl(0.32, 0.4, PH, 0, 0, 0, 16, 'iron');
  B.cyl(0.07, 0.09, H - 0.6, 0, PH, 0, 10, 'iron');
  B.cyl(0.3, 0.12, 0.25, 0, H - 0.5, 0, 16);
  B.cyl(0.24, 0.24, 0.22, 0, H - 0.72, 0, 16, 'lamp');
  B.cone(0.3, 0.12, 0, H - 0.25 - GAP, 0, 16);
}

function trafficLight(B, w, d, H) {
  B.cyl(0.3, 0.38, PH, 0, 0, 0, 16, 'iron');
  B.cyl(0.07, 0.07, H - 1.4, 0, PH, 0, 10, 'iron');
  B.box(0.46, 1.25, 0.36, 0, H - 1.3, 0);
  [['lamp_red', 0.92], ['lamp_yellow', 0.55], ['lamp_green', 0.18]].forEach(([m, y]) => B.cylZ(0.13, 0.06, 0, H - 1.3 + y + 0.1, 0.19, 18, m));
}

function bench(B, w, d, H) {
  const L = d - 0.1;
  for (const sz of [-1, 1]) B.box(0.7, 0.4, 0.14, 0, 0, sz * (L / 2 - 0.25), 'iron');
  B.box(0.8, 0.1, L, 0, 0.4, 0);
  B.box(0.1, 0.45, L, -0.38, 0.5, 0);
  for (const sz of [-1, 1]) B.box(0.1, 0.5, 0.12, -0.38, 0.4, sz * (L / 2 - 0.25), 'iron');
}

function trash(B, w, d, H) {
  B.cyl(0.36, 0.32, H * 0.85, 0, 0, 0, 20);
  B.cyl(0.4, 0.4, 0.08, 0, H * 0.85, 0, 20);
  B.cyl(0.18, 0.3, H * 0.15 - 0.08 - GAP, 0, H * 0.85 + 0.08, 0, 20);
}

function hydrant(B, w, d, H) {
  B.cyl(0.33, 0.36, 0.14, 0, 0, 0, 16);
  B.cyl(0.24, 0.24, H * 0.62, 0, 0.14, 0, 16);
  B.sphere(0.24, 0, H * 0.62 + 0.14, 0, 'main', 1, 0.8, 1, 14);
  B.cylX(0.1, 0.72, 0, H * 0.45, 0, 10);
  B.cyl(0.06, 0.06, 0.12, 0, H * 0.62 + 0.3, 0, 8, 'chrome');
}

function barrier(B, w, d, H) {
  const L = d - 0.1;
  for (const sz of [-1, 1]) { B.box(0.6, 0.12, 0.3, 0, 0, sz * (L / 2 - 0.2), 'black'); B.box(0.1, H - 0.12, 0.1, 0, 0.12, sz * (L / 2 - 0.2), 'black'); }
  B.box(0.08, 0.36, L, 0.06, H * 0.55, 0);
  const n = Math.round(d * 2);
  for (let i = 0; i < n; i += 2) B.box(0.09, 0.36, L / n, 0.06, H * 0.55, -L / 2 + (L / n) * (i + 0.5), 'white');
}

function sign(B, w, d, H) {
  B.cyl(0.3, 0.36, PH, 0, 0, 0, 16, 'iron');
  B.cyl(0.05, 0.05, H - 0.8, 0, PH, 0, 8, 'rim');
  B.cylZ(0.4, 0.06, 0, H - 0.45, 0.06, 28);
  B.cylZ(0.3, 0.07, 0, H - 0.45, 0.065, 28, 'white');
}

// --- Burg -------------------------------------------------------------------
function flag(B, w, d, H) {
  B.cyl(0.28, 0.32, PH, 0, 0, 0, 16, 'iron');
  B.cyl(0.06, 0.06, H - PH - 0.1, 0, PH, 0, 8, 'rim');
  B.sphere(0.1, 0, H - 0.1, 0, 'gold', 1, 1, 1, 10);
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(0.6, 0.12, 1.3, 0); s.lineTo(1.3, -0.95); s.quadraticCurveTo(0.6, -0.8, 0, -0.95); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false, curveSegments: 10 });
  g.translate(0.06, H - 0.2, -0.02); B.add(g);
}

function shield(B, w, d, H) {
  B.body(w, PH, d);
  const s = new THREE.Shape();
  s.moveTo(-0.42, 0.95); s.lineTo(0.42, 0.95); s.lineTo(0.42, 0.45); s.quadraticCurveTo(0.4, 0.05, 0, -0.1); s.quadraticCurveTo(-0.4, 0.05, -0.42, 0.45); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, PH + 0.12, -0.05); B.add(g);
  B.box(0.08, 0.8, 0.02, 0, PH + 0.1, 0.06, 'gold');
  B.box(0.6, 0.08, 0.02, 0, PH + 0.6, 0.06, 'gold');
}

function torch(B, w, d, H) {
  B.body(w, PH, d, 0, 0, 0, 'iron');
  B.cyl(0.08, 0.05, H * 0.55, 0, PH, 0, 8, 'trunk');
  B.cyl(0.14, 0.09, 0.14, 0, PH + H * 0.5, 0, 10, 'iron');
  B.sphere(0.14, 0, PH + H * 0.7, 0, 'flame', 1, 1.5, 1, 12);
}

function coneRoof(B, w, d, H) {
  B.cyl(w / 2, w / 2, 0.2, 0, 0, 0, 32);
  B.cone(w / 2 + 0.05, H - 0.2 - GAP, 0, 0.2, 0, 32);
}

// --- Raumfahrt --------------------------------------------------------------
function thruster(B, w, d, H) {
  B.cyl(0.42, 0.42, H * 0.55, 0, H * 0.45 - GAP, 0, 20);
  B.stud(0, H - GAP, 0);
  B.cyl(0.32, 0.46, H * 0.45, 0, 0, 0, 20, 'iron');
  B.cyl(0.26, 0.26, 0.04, 0, 0.02, 0, 20, 'engine');
}

function wing(B, w, d, H, mirror = 1) {
  // Grundriss: Wurzel bei -X (mirror=1), Spitze nach +X
  const pts = [[-w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2 - 0.8], [w / 2, d / 2 - 1.6]].map(([x, z]) => [x * mirror, z]);
  if (mirror < 0) pts.reverse();
  const s = shape(pts.map(([x, z]) => [x, z]));
  B.shapeUp(s, H - GAP, 0);
  for (let j = 0; j < d; j++) B.stud(-mirror * (w / 2 - 0.5), H, -d / 2 + 0.5 + j);
}

function antenna(B, w, d, H) {
  B.body(w, PH, d, 0, 0, 0, 'iron');
  B.cyl(0.04, 0.06, H - PH - 0.15, 0, PH, 0, 8);
  B.sphere(0.11, 0, H - 0.12, 0, 'lamp_red', 1, 1, 1, 10);
}

function solar(B, w, d, H) {
  B.body(w, H, d);
  const cw = (w - 0.3) / 2, cd = (d - 0.3) / 4;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++)
    B.box(cw - 0.06, 0.03, cd - 0.06, -w / 2 + 0.15 + cw * (i + 0.5), H - GAP, -d / 2 + 0.15 + cd * (j + 0.5), 'solar');
}

function dish(B, w, d, H) {
  B.body(1, PH, 1, 0, 0, 0, 'iron');
  B.cyl(0.12, 0.12, H * 0.4, 0, PH, 0, 10, 'iron');
  const g = new THREE.SphereGeometry(w / 2 - 0.1, 28, 10, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38);
  g.translate(0, (w / 2 - 0.1), 0); g.rotateX(-0.5); g.translate(0, H * 0.22, 0);
  B.add(g);
  B.cyl(0.03, 0.03, 0.9, 0, H * 0.45, 0.15, 6, 'iron');
  B.sphere(0.07, 0, H * 0.45 + 0.9, 0.15, 'lamp', 1, 1, 1, 8);
}

function dome(B, w, d, H) {
  const R = w / 2 - GAP * 2;
  B.cyl(R, R, 0.15, 0, 0, 0, 32);
  const g = new THREE.SphereGeometry(R, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  g.scale(1, (H - 0.15 - GAP) / R, 1); g.translate(0, 0.15, 0);
  B.add(g);
}

function turntable(B, w, d, H) {
  B.body(w, H * 0.45, d, 0, 0, 0, 'iron');
  B.cyl(w / 2 - 0.06, w / 2 - 0.06, H * 0.55 - GAP, 0, H * 0.45, 0, 32);
  B.studs(w, d, H);
}

function grill(B, w, d, H) {
  B.body(w, H * 0.5, d);
  const n = d * 3;
  for (let i = 0; i < n; i++) B.box(w - 0.1, H * 0.5 - GAP, (d - 0.1) / n * 0.55, 0, H * 0.5, -d / 2 + 0.05 + (d - 0.1) / n * (i + 0.5));
}

// --- Figuren ----------------------------------------------------------------
function eye(B, w, d, H) {
  B.body(w, PH, d);
  B.sphere(0.4, 0, PH + 0.38, 0, 'white', 1, 1, 1, 20);
  B.cylZ(0.2, 0.05, 0, PH + 0.42, 0.36, 20);
  B.cylZ(0.1, 0.05, 0, PH + 0.42, 0.39, 16, 'black');
}

function horn(B, w, d, H) {
  B.body(w, PH, d, 0, 0, 0, 'white');
  const segs = 6, sh = (H - PH) / segs;
  for (let i = 0; i < segs; i++) {
    const r0 = 0.3 * (1 - i / segs), r1 = 0.3 * (1 - (i + 1) / segs) + 0.01;
    const g = new THREE.CylinderGeometry(r1, r0, sh * 1.02, 14);
    g.translate(0, sh / 2, 0); g.rotateY(i * 0.5); g.translate(0, PH + i * sh, i * i * 0.012);
    B.add(g);
  }
}

function featherWing(B, w, d, H) {
  B.body(w, PH, 1, 0, 0, -d / 2 + 0.5);
  B.stud(0, PH, -d / 2 + 0.5);
  for (let i = 0; i < 4; i++) {
    const len = d * (1 - i * 0.18), g = new THREE.BoxGeometry(0.12, 0.34, len);
    g.translate(0, 0, len / 2); g.rotateX(-0.25 - i * 0.18); g.translate(0, PH + 0.2 + i * 0.3, -d / 2 + 0.3);
    B.add(g);
  }
}

function fin(B, w, d, H) {
  B.body(w, PH, d);
  const s = new THREE.Shape();
  s.moveTo(-d / 2 + 0.1, 0); s.lineTo(d / 2 - 0.1, 0);
  s.quadraticCurveTo(d / 2 - 0.4, H * 0.4, -d / 2 + 0.2, H - PH - GAP);
  s.quadraticCurveTo(-d / 2 + 0.25, H * 0.3, -d / 2 + 0.1, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false, curveSegments: 12 });
  g.rotateY(-Math.PI / 2); g.translate(0.08, PH, 0);
  B.add(g);
}

function tail(B, w, d, H) {
  B.body(w, PH, 1, 0, 0, -d / 2 + 0.5);
  for (let i = 0; i < 6; i++) {
    const t = i / 5, r = 0.32 * (1 - t * 0.7);
    B.sphere(r, 0, PH + 0.2 + Math.sin(t * 2.2) * (H - PH - 0.5), -d / 2 + 0.5 + t * (d - 0.8), 'main', 1, 1, 1.2, 12);
  }
}

// ---------------------------------------------------------------------------
// Teileliste
// size = [Breite X, Tiefe Z, Höhe in Platten]
// ---------------------------------------------------------------------------
const P = [];
const def = (id, name, cat, size, build, extra = {}) => P.push({ id, name, cat, size, build, ...extra });

// Steine
for (const [w, d] of [[1, 1], [1, 2], [1, 3], [1, 4], [1, 6], [1, 8], [2, 2], [2, 3], [2, 4], [2, 6], [2, 8]])
  def(`b${w}${d}`, `Stein ${w}×${d}`, 'bricks', [w, d, 3], brick);
def('b11x3', 'Säule 1×1×3', 'bricks', [1, 1, 9], brick);
def('b12x3', 'Hoher Stein 1×2×3', 'bricks', [1, 2, 9], brick);
def('b22x3', 'Hoher Stein 2×2×3', 'bricks', [2, 2, 9], brick);
def('b22_corner', 'Eckstein 2×2', 'bricks', [2, 2, 3], (B, w, d, H) => corner(B, w, d, H));

// Platten
for (const [w, d] of [[1, 1], [1, 2], [1, 3], [1, 4], [1, 6], [2, 2], [2, 3], [2, 4], [2, 6], [2, 8], [4, 4], [4, 6], [4, 8], [6, 6], [8, 8], [8, 16], [16, 16]])
  def(`p${w}${d}`, `Platte ${w}×${d}`, 'plates', [w, d, 1], brick);
def('p22_corner', 'Eckplatte 2×2', 'plates', [2, 2, 1], (B, w, d, H) => corner(B, w, d, H));
def('p11_round', 'Rundplatte 1×1', 'plates', [1, 1, 1], (B, w, d, H) => roundBrick(B, w, d, H));
def('p22_round', 'Rundplatte 2×2', 'plates', [2, 2, 1], (B, w, d, H) => roundBrick(B, w, d, H));

// Fliesen
for (const [w, d] of [[1, 1], [1, 2], [1, 4], [1, 6], [2, 2], [2, 4], [4, 4]])
  def(`t${w}${d}`, `Fliese ${w}×${d}`, 'tiles', [w, d, 1], tile);
def('t11_round', 'Rundfliese 1×1', 'tiles', [1, 1, 1], (B, w, d, H) => roundBrick(B, w, d, H, false));
def('t22_round', 'Rundfliese 2×2', 'tiles', [2, 2, 1], (B, w, d, H) => roundBrick(B, w, d, H, false));
def('t22_corner', 'Eckfliese 2×2', 'tiles', [2, 2, 1], (B, w, d, H) => corner(B, w, d, H, false));
def('t12_grill', 'Gitterfliese 1×2', 'tiles', [1, 2, 1], grill);

// Schrägen
def('sl11', 'Schräge 1×1', 'slopes', [1, 1, 3], slope);
def('sl12', 'Schräge 1×2', 'slopes', [1, 2, 3], slope);
def('sl22', 'Schräge 2×2', 'slopes', [2, 2, 3], slope);
def('sl42', 'Schräge 4×2', 'slopes', [4, 2, 3], slope);
def('sl13', 'Flache Schräge 1×3', 'slopes', [1, 3, 3], slope);
def('sl23', 'Flache Schräge 2×3', 'slopes', [2, 3, 3], slope);
def('sli12', 'Gegenschräge 1×2', 'slopes', [1, 2, 3], slopeInv);
def('sli22', 'Gegenschräge 2×2', 'slopes', [2, 2, 3], slopeInv);
def('ridge22', 'Dachfirst 2×2', 'slopes', [2, 2, 3], ridge);
def('ridge12', 'Dachfirst 1×2', 'slopes', [1, 2, 3], ridge);
def('curve12', 'Bogenschräge 1×2', 'slopes', [1, 2, 2], curve);
def('curve22', 'Bogenschräge 2×2', 'slopes', [2, 2, 2], curve);
def('pyr22', 'Pyramide 2×2', 'slopes', [2, 2, 4], pyramid);

// Rund & Bögen
def('r11', 'Rundstein 1×1', 'round', [1, 1, 3], (B, w, d, H) => roundBrick(B, w, d, H));
def('r22', 'Rundstein 2×2', 'round', [2, 2, 3], (B, w, d, H) => roundBrick(B, w, d, H));
def('r22x3', 'Rundturm 2×2×3', 'round', [2, 2, 9], (B, w, d, H) => roundBrick(B, w, d, H));
def('cone11', 'Kegel 1×1', 'round', [1, 1, 3], (B, w, d, H) => { B.cyl(0.18, 0.47, H - 0.12, 0, 0, 0, 24); B.stud(0, H - 0.12, 0, 'main', 0.17, 0.12); });
def('cone22', 'Kegel 2×2', 'round', [2, 2, 6], (B, w, d, H) => { B.cyl(0.3, 0.96, H - 0.14, 0, 0, 0, 28); B.stud(0, H - 0.14, 0, 'main', 0.28, 0.14); });
def('dome22', 'Kuppel 2×2', 'round', [2, 2, 3], dome);
def('dome44', 'Kuppel 4×4', 'round', [4, 4, 5], dome);
def('arch13', 'Bogen 1×3', 'round', [1, 3, 6], arch);
def('arch14', 'Bogen 1×4', 'round', [1, 4, 6], arch);
def('arch16', 'Großer Bogen 1×6', 'round', [1, 6, 9], arch);
def('turn22', 'Drehteller 2×2', 'round', [2, 2, 1], turntable);

// Fenster & Türen
def('win12', 'Fenster 1×2×2', 'build', [1, 2, 6], (B, w, d, H) => windowPart(B, w, d, H), { suggest: 'white' });
def('win13', 'Sprossenfenster 1×3×2', 'build', [1, 3, 6], (B, w, d, H) => windowPart(B, w, d, H, 2), { suggest: 'white' });
def('win14', 'Panoramafenster 1×4×3', 'build', [1, 4, 9], (B, w, d, H) => windowPart(B, w, d, H, 1), { suggest: 'white' });
def('door13', 'Tür 1×3×4', 'build', [1, 3, 12], door, { suggest: 'brown' });
def('bars12', 'Gitterfenster 1×2×2', 'build', [1, 2, 6], bars, { suggest: 'dark_grey' });
def('fence14', 'Lattenzaun 1×4', 'build', [1, 4, 3], (B, w, d, H) => fence(B, w, d, H), { suggest: 'white' });
def('fence14o', 'Ziergitter 1×4', 'build', [1, 4, 4], (B, w, d, H) => fence(B, w, d, H, true), { suggest: 'black' });
def('stairs23', 'Treppe 2×3', 'build', [2, 3, 9], stairs);

// Fahrzeug
def('axle42', 'Achse mit Rädern', 'vehicle', [4, 2, 5], axle, { suggest: 'dark_grey' });
def('wheel_s', 'Rad klein', 'vehicle', [1, 1, 3], wheel);
def('wheel_l', 'Rad groß', 'vehicle', [1, 2, 5], wheel);
def('guard24', 'Radkasten 2×4', 'vehicle', [2, 4, 4], mudguard);
def('shield42', 'Windschutzscheibe 4×2', 'vehicle', [4, 2, 5], windshield);
def('seat22', 'Sitz 2×2', 'vehicle', [2, 2, 5], seat, { suggest: 'black' });
def('steer11', 'Lenkrad', 'vehicle', [1, 1, 4], steering, { suggest: 'dark_grey' });
def('light11', 'Scheinwerfer 1×1', 'vehicle', [1, 1, 3], headlight);
def('spoiler14', 'Heckflügel 1×4', 'vehicle', [1, 4, 4], spoiler);
def('exhaust12', 'Auspuff', 'vehicle', [1, 2, 2], exhaust, { suggest: 'dark_grey' });
def('engine22', 'Motorblock 2×2', 'vehicle', [2, 3, 4], engine, { suggest: 'dark_grey' });
def('prop11', 'Propeller', 'vehicle', [1, 1, 3], propeller);

// Natur
def('tree_leaf', 'Laubbaum', 'nature', [2, 2, 12], (B, w, d, H) => treeLeaf(B, w, d, H), { suggest: 'green' });
def('tree_apple', 'Apfelbaum', 'nature', [2, 2, 12], (B, w, d, H) => treeLeaf(B, w, d, H, { fruit: 'red' }), { suggest: 'green' });
def('tree_pine', 'Nadelbaum', 'nature', [2, 2, 14], treePine, { suggest: 'dark_green' });
def('tree_birch', 'Birke', 'nature', [1, 1, 13], treeBirch, { suggest: 'lime' });
def('tree_palm', 'Palme', 'nature', [2, 2, 14], treePalm, { suggest: 'green' });
def('bush22', 'Busch', 'nature', [2, 2, 4], bush, { suggest: 'green' });
def('flower11', 'Blume', 'nature', [1, 1, 3], flower);
def('grass11', 'Grasbüschel', 'nature', [1, 1, 2], grass, { suggest: 'lime' });
def('rock22', 'Fels', 'nature', [2, 2, 4], rock, { suggest: 'light_grey' });
def('crystal11', 'Kristall', 'nature', [1, 1, 4], crystal, { suggest: 'trans_blue' });

// Stadt
def('lamp11', 'Straßenlaterne', 'city', [1, 1, 10], lamp, { suggest: 'dark_grey' });
def('traffic11', 'Ampel', 'city', [1, 1, 9], trafficLight, { suggest: 'dark_grey' });
def('sign11', 'Verkehrsschild', 'city', [1, 1, 7], sign, { suggest: 'red' });
def('bench13', 'Parkbank', 'city', [1, 3, 3], bench, { suggest: 'brown' });
def('trash11', 'Mülleimer', 'city', [1, 1, 3], trash, { suggest: 'dark_green' });
def('hydrant11', 'Hydrant', 'city', [1, 1, 2], hydrant);
def('barrier12', 'Absperrung', 'city', [1, 2, 3], barrier);

// Burg
def('crenel12', 'Zinne 1×2', 'castle', [1, 2, 4], crenel);
def('slit12', 'Mauer mit Schlitz 1×2×2', 'castle', [1, 2, 6], slitWall);
def('flag11', 'Fahne', 'castle', [1, 1, 10], flag);
def('shield11', 'Wappenschild', 'castle', [1, 1, 4], shield);
def('torch11', 'Fackel', 'castle', [1, 1, 3], torch, { suggest: 'brown' });
def('roof33', 'Turmdach 3×3', 'castle', [3, 3, 7], coneRoof);
def('roof44', 'Turmdach 4×4', 'castle', [4, 4, 9], coneRoof);

// Raumfahrt
def('thruster11', 'Triebwerk', 'space', [1, 1, 4], thruster, { suggest: 'dark_grey' });
def('wing_l', 'Flügel links 3×4', 'space', [3, 4, 1], (B, w, d, H) => wing(B, w, d, H, -1));
def('wing_r', 'Flügel rechts 3×4', 'space', [3, 4, 1], (B, w, d, H) => wing(B, w, d, H, 1));
def('antenna11', 'Antenne', 'space', [1, 1, 6], antenna);
def('solar24', 'Solarpanel 2×4', 'space', [2, 4, 1], solar, { suggest: 'light_grey' });
def('dish33', 'Parabolantenne', 'space', [3, 3, 6], dish, { suggest: 'white' });

// Figuren
def('eye11', 'Auge', 'figure', [1, 1, 3], eye, { suggest: 'blue' });
def('horn11', 'Horn', 'figure', [1, 1, 5], horn, { suggest: 'gold' });
def('wing13', 'Federflügel 1×3', 'figure', [1, 3, 4], featherWing);
def('fin12', 'Flosse 1×2', 'figure', [1, 2, 4], fin);
def('tail14', 'Schwanz 1×4', 'figure', [1, 4, 4], tail);

registerExtra(def, { brick, slope, tile });

export const PARTS = P;
export const PART_MAP = new Map(P.map(p => [p.id, p]));

// Alte Teile-Kennungen (Version bis Mai 2026) auf neue abbilden
export const LEGACY_PARTS = {
  b11: 'b11', b12: 'b12', b13: 'b13', b14: 'b14', b16: 'b16', b22: 'b22', b23: 'b23', b24: 'b24', b26: 'b26',
  b11x3: 'b11x3', b22_corner: 'b22_corner', b12_profile: 'b12',
  p12: 'p12', p13: 'p13', p14: 'p14', p16: 'p16', p22: 'p22', p23: 'p23', p24: 'p24', p26: 'p26', p44: 'p44', p48: 'p48',
  p11_round: 'p11_round', p22_round: 'p22_round', p22_corner: 'p22_corner', p12_clip: 'p12',
  s_slope1: 'sl11', s_slope2: 'sl12', s_slope_inverted: 'sli12', s_pyramid_2x2: 'pyr22',
  s_cyl1: 'r11', s_cyl2: 'r22', s_round_brick_2x2: 'r22', ca_tower_round: 'r22x3', s_cone: 'cone11',
  s_arch: 'arch13', s_wheel: 'wheel_s', ve_wheel_big: 'wheel_l', s_turntable_2x2: 'turn22',
  s_smooth_tile_2x2: 't22', s_flat_round_2x2: 't22_round', s_grill_tile: 't12_grill',
  s_window_2x2: 'win12', ci_window_big: 'win13', ci_door_frame: 'door13', ca_window_bars: 'bars12', ca_arrow_slit: 'slit12',
  s_fence_wood: 'fence14', s_fence_picket: 'fence14', s_fence_classic: 'fence14o', ci_fence_iron: 'fence14o',
  ca_stairs: 'stairs23', ca_crenel: 'crenel12', ca_flag_knights: 'flag11', ca_wall_shield: 'shield11', ca_wall_torch: 'torch11',
  ca_roof_cone_large: 'roof33', ca_drawbridge: 't14',
  s_mudguard_car: 'guard24', ve_windshield_2x4: 'shield42', s_windshield_curved: 'shield42',
  s_steering_wheel: 'steer11', ve_steering_wheel: 'steer11', s_headlight_brick: 'light11', ve_spoiler_sport: 'spoiler14',
  ve_exhaust_chrome: 'exhaust12', ve_engine_block: 'engine22', s_propeller: 'prop11',
  na_tree_classic: 'tree_leaf', na_tree_sakura: 'tree_leaf', na_tree_willow: 'tree_leaf', na_tree_apple: 'tree_apple',
  na_tree_birch: 'tree_birch', na_pine_leaf_4x4: 'tree_pine', na_palm_trunk: 'tree_palm', na_bush_round_2x2: 'bush22',
  na_leaf_small: 'bush22', na_flower: 'flower11', na_grass_3prong: 'grass11', na_rock_boulder: 'rock22',
  na_crystal: 'crystal11', s_gem_giant: 'crystal11', na_trunk: 'r11', na_bamboo_stem: 'r11', na_hanging_vine: 'grass11',
  ci_street_lamp: 'lamp11', ci_traffic_light: 'traffic11', ci_park_bench: 'bench13', ci_trash_can: 'trash11',
  ci_fire_hydrant: 'hydrant11', ci_barrier: 'barrier12',
  sp_thruster: 'thruster11', sp_wing_l: 'wing_l', sp_wing_r: 'wing_r', sp_antenna: 'antenna11',
  sp_cockpit: 'dome22', s_ufo_top: 'dome44', sp_solar_grid: 'solar24', s_radar_dish: 'dish33',
  s_eye_big: 'eye11', s_horn_unicorn: 'horn11', s_wing_curved: 'wing13', we_shark_fin: 'fin12', we_tail_scaly: 'tail14',
  we_tail_furry: 'tail14',
};

export function resolvePartId(id) {
  if (PART_MAP.has(id)) return id;
  if (LEGACY_PARTS[id]) return LEGACY_PARTS[id];
  return 'b11';
}

// Geometrie je Teil wird einmal erzeugt und dann geteilt
const geoCache = new Map();
export function partGeometry(id) {
  if (geoCache.has(id)) return geoCache.get(id);
  const p = PART_MAP.get(id) || PART_MAP.get('b11');
  const B = new Builder();
  p.build(B, p.size[0], p.size[1], p.size[2] * PH);
  const res = B.finish();
  geoCache.set(id, res);
  return res;
}

export function partHeight(id) { return (PART_MAP.get(id) || PART_MAP.get('b11')).size[2]; }
export function sizeLabel(p) {
  const [w, d, h] = p.size;
  return `${w}×${d}`;
}
