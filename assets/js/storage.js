// Speichern im Browser, Dateiformat, Übernahme alter Modelle
import { makeBrick, newId, footprint, snapAnchor } from './model.js';
import { resolvePartId, COLOR_MAP, PART_MAP } from './catalog.js';

const K = { settings: 'b3d.settings', index: 'b3d.projects', project: id => 'b3d.project.' + id, current: 'b3d.current', legacyDone: 'b3d.legacyImported' };
export const FORMAT = 'baukasten-3d';

function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { console.warn('Speichern fehlgeschlagen', e); return false; }
}
function del(key) { try { localStorage.removeItem(key); } catch { /* egal */ } }

export const DEFAULT_SETTINGS = { plate: 32, plateColor: '#d6dbe1', sound: true, shadows: true, edges: true, onboarded: false, recentColors: [], recentParts: [] };
export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...read(K.settings, {}) });
export const saveSettings = s => write(K.settings, s);

// --- Projekte ---------------------------------------------------------------
export const listProjects = () => read(K.index, []).sort((a, b) => b.updated - a.updated);
export const currentProjectId = () => read(K.current, null);
export const setCurrentProject = id => write(K.current, id);

export function loadProject(id) {
  const p = read(K.project(id), null);
  if (!p) return null;
  return { ...p, bricks: decodeBricks(p.bricks) };
}

export function saveProject(project, bricks, thumb) {
  const now = Date.now();
  const data = { id: project.id, name: project.name, plate: project.plate, created: project.created || now, updated: now, bricks: encodeBricks(bricks) };
  const ok = write(K.project(project.id), data);
  const idx = read(K.index, []).filter(p => p.id !== project.id);
  const prev = read(K.index, []).find(p => p.id === project.id);
  idx.push({ id: project.id, name: project.name, updated: now, count: bricks.length, thumb: thumb ?? prev?.thumb ?? null });
  return write(K.index, idx) && ok;
}

export function renameProject(id, name) {
  const p = read(K.project(id), null); if (p) { p.name = name; write(K.project(id), p); }
  write(K.index, read(K.index, []).map(e => e.id === id ? { ...e, name } : e));
}

export function deleteProject(id) {
  del(K.project(id));
  write(K.index, read(K.index, []).filter(p => p.id !== id));
}

export function newProject(name = 'Neues Modell', plate = 32) {
  return { id: newId(), name, plate, created: Date.now() };
}

// --- Kompaktes Steinformat ------------------------------------------------------
export function encodeBricks(bricks) {
  return bricks.map(b => [b.t, b.c, round(b.x), b.y, round(b.z), b.r]);
}
const round = v => Math.round(v * 1000) / 1000;

export function decodeBricks(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const e of list) {
    if (Array.isArray(e)) {
      const [t, c, x, y, z, r] = e;
      if (!PART_MAP.has(t)) continue;
      out.push(makeBrick(t, validColor(c), +x || 0, Math.max(0, Math.round(+y || 0)), +z || 0, +r || 0));
    }
  }
  return out;
}

function validColor(c) {
  if (COLOR_MAP.has(c)) return c;
  if (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
  return 'red';
}

// --- Dateien ------------------------------------------------------------------
export function exportFile(name, plate, bricks) {
  return JSON.stringify({ format: FORMAT, version: 1, name, plate, exported: new Date().toISOString(), bricks: encodeBricks(bricks) });
}

// Liest eigenes Format und das Format der Vorgängerversion (Array mit pos/rot)
export function parseFile(text) {
  const data = JSON.parse(text);
  if (data && data.format === FORMAT) {
    return { name: data.name || 'Importiertes Modell', plate: data.plate || 32, bricks: decodeBricks(data.bricks) };
  }
  if (Array.isArray(data)) return { name: 'Importiertes Modell', plate: 32, bricks: convertLegacy(data) };
  throw new Error('Unbekanntes Dateiformat');
}

const LEGACY_COLORS = { pastel_mint: 'pastel_mint', dark_iron: 'dark_iron' };
export function convertLegacy(arr) {
  const out = [];
  for (const o of arr) {
    if (!o || !o.type || !Array.isArray(o.pos)) continue;
    const t = resolvePartId(o.type);
    const c = validColor(LEGACY_COLORS[o.color] || o.color);
    const y = Math.max(0, Math.round((+o.pos[1] || 0) / 0.4));
    const r = Math.round((+o.rot || 0) / (Math.PI / 4));
    const [fw, fd, diag] = footprint(t, r);
    out.push(makeBrick(t, c, snapAnchor(+o.pos[0] || 0, fw, diag), y, snapAnchor(+o.pos[2] || 0, fd, diag), r));
  }
  return out;
}

// Einmalig: automatisch gespeichertes Modell der Vorgängerversion übernehmen
export function takeLegacyAutosave() {
  if (read(K.legacyDone, false)) return null;
  write(K.legacyDone, true);
  try {
    const raw = localStorage.getItem('brickcraft_kid_save');
    if (!raw) return null;
    const bricks = convertLegacy(JSON.parse(raw));
    return bricks.length ? bricks : null;
  } catch { return null; }
}

export function storageUsage() {
  try { let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('b3d.')) n += (localStorage.getItem(k) || '').length; } return n; } catch { return 0; }
}
