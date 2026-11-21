// Datenmodell: unveränderliche Stein-Objekte, Verlauf, Kollision
import { PART_MAP, partHeight } from './catalog.js';

let seq = 0;
export const newId = () => (Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6));

// Stein: { id, t (Teil), c (Farbe), x, y (Platten), z, r (Achtel-Drehungen 0..7) }
export function makeBrick(t, c, x, y, z, r = 0, id = newId()) {
  return Object.freeze({ id, t, c, x, y, z, r: ((r % 8) + 8) % 8 });
}

// Grundfläche nach Drehung
export function footprint(t, r) {
  const p = PART_MAP.get(t); const [w, d] = p ? p.size : [1, 1];
  const q = ((r % 8) + 8) % 8;
  if (q % 2 === 1) { const e = (w + d) / Math.SQRT2; return [e, e, true]; }
  return (q === 2 || q === 6) ? [d, w, false] : [w, d, false];
}

export function aabb(b) {
  const [fw, fd, diag] = footprint(b.t, b.r);
  const h = partHeight(b.t);
  return { x0: b.x - fw / 2, x1: b.x + fw / 2, z0: b.z - fd / 2, z1: b.z + fd / 2, y0: b.y, y1: b.y + h, diag };
}

const EPS = 0.02;
export function overlaps(a, b) {
  const shrink = (a.diag || b.diag) ? 0.25 : 0;
  return a.x0 + EPS + shrink < b.x1 && b.x0 + EPS + shrink < a.x1 &&
         a.z0 + EPS + shrink < b.z1 && b.z0 + EPS + shrink < a.z1 &&
         a.y0 < b.y1 && b.y0 < a.y1;
}

export class Model {
  constructor() {
    this.bricks = [];         // Array unveränderlicher Steine
    this.history = [[]];
    this.hIndex = 0;
    this.listeners = new Set();
    this.plate = 32;
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(reason) { for (const fn of this.listeners) fn(reason); }

  get count() { return this.bricks.length; }
  byId(id) { return this.bricks.find(b => b.id === id); }

  commit(next, reason = 'edit') {
    this.bricks = next;
    this.history = this.history.slice(0, this.hIndex + 1);
    this.history.push(next);
    if (this.history.length > 300) this.history.shift();
    this.hIndex = this.history.length - 1;
    this.emit(reason);
  }
  reset(bricks = []) {
    this.bricks = bricks; this.history = [bricks]; this.hIndex = 0; this.emit('load');
  }
  get canUndo() { return this.hIndex > 0; }
  get canRedo() { return this.hIndex < this.history.length - 1; }
  undo() { if (!this.canUndo) return false; this.hIndex--; this.bricks = this.history[this.hIndex]; this.emit('undo'); return true; }
  redo() { if (!this.canRedo) return false; this.hIndex++; this.bricks = this.history[this.hIndex]; this.emit('redo'); return true; }

  add(list) { if (!list.length) return; this.commit([...this.bricks, ...list], 'add'); }
  remove(ids) {
    const set = new Set(ids); if (!set.size) return;
    this.commit(this.bricks.filter(b => !set.has(b.id)), 'remove');
  }
  replace(changed) {
    const map = new Map(changed.map(b => [b.id, b]));
    this.commit(this.bricks.map(b => map.get(b.id) || b), 'change');
  }

  // Kollision einer Kandidatenliste gegen das Modell (ignore = IDs, die bewegt werden)
  collides(cands, ignore) {
    const boxes = this.bricks.filter(b => !ignore || !ignore.has(b.id)).map(aabb);
    for (const c of cands) {
      const a = aabb(c);
      for (const b of boxes) if (overlaps(a, b)) return b;
    }
    return null;
  }

  inBounds(cands) {
    const half = this.plate / 2 + 0.01;
    for (const c of cands) {
      const a = aabb(c);
      if (a.x0 < -half || a.x1 > half || a.z0 < -half || a.z1 > half || a.y0 < 0) return false;
    }
    return true;
  }

  // Niedrigste freie Höhe ab baseY für eine Gruppe (relativ positioniert)
  resolveY(cands, ignore) {
    const boxes = this.bricks.filter(b => !ignore || !ignore.has(b.id)).map(aabb);
    let lift = 0;
    for (let guard = 0; guard < 200; guard++) {
      let need = 0;
      for (const c of cands) {
        const a = aabb(c); a.y0 += lift; a.y1 += lift;
        for (const b of boxes) if (overlaps(a, b)) need = Math.max(need, b.y1 - a.y0);
      }
      if (need <= 0) return lift;
      lift += need;
    }
    return lift;
  }

  topY() { let m = 0; for (const b of this.bricks) m = Math.max(m, b.y + partHeight(b.t)); return m; }
}

// ---------------------------------------------------------------------------
// Payload: was gerade platziert wird (ein Teil oder eine Gruppe)
// members: [{ t, c, dx, dy, dz, r }] relativ zur Mitte unten der Gruppe
// ---------------------------------------------------------------------------
export function payloadFromBricks(list) {
  if (!list.length) return null;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, y0 = Infinity;
  for (const b of list) { const a = aabb(b); x0 = Math.min(x0, a.x0); x1 = Math.max(x1, a.x1); z0 = Math.min(z0, a.z0); z1 = Math.max(z1, a.z1); y0 = Math.min(y0, a.y0); }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  return {
    members: list.map(b => ({ t: b.t, c: b.c, dx: b.x - cx, dy: b.y - y0, dz: b.z - cz, r: b.r })),
    fw: x1 - x0, fd: z1 - z0, group: list.length > 1,
  };
}

export function singlePayload(t, c, r) {
  const [fw, fd] = footprint(t, r);
  return { members: [{ t, c, dx: 0, dy: 0, dz: 0, r }], fw, fd, group: false };
}

// Gruppe um 90° (q = +1/-1) oder Einzelteil um 45° drehen
export function rotatePayload(pl, eighths) {
  if (!pl.group) {
    const m = pl.members[0];
    return singlePayload(m.t, m.c, m.r + eighths);
  }
  const quarter = Math.sign(eighths) * 2;
  const ang = quarter * Math.PI / 4;
  const cos = Math.round(Math.cos(ang)), sin = Math.round(Math.sin(ang));
  const rotated = pl.members.map(m => makeBrick(m.t, m.c, m.dx * cos + m.dz * sin, m.dy, -m.dx * sin + m.dz * cos, m.r + quarter, 'tmp'));
  const res = payloadFromBricks(rotated);
  res.members.forEach((m, i) => { m.dy = pl.members[i].dy; });
  return res;
}

// Ankerpunkt einrasten: linke Kante der Gruppe liegt auf dem Raster
export function snapAnchor(v, size, diag) {
  if (diag) return Math.round(v * 2) / 2;
  return Math.round(v - size / 2) + size / 2;
}

// Gruppe so ausrichten, dass das erste Teil exakt auf dem Raster liegt (ganzzahlige Verschiebung hält alle anderen ausgerichtet)
export function alignAnchor(pl, x, z, plate) {
  const m = pl.members[0];
  const [fw, fd, diag] = footprint(m.t, m.r);
  x = snapAnchor(x + m.dx, fw, diag) - m.dx;
  z = snapAnchor(z + m.dz, fd, diag) - m.dz;
  if (plate) {
    const half = plate / 2;
    const l = x - pl.fw / 2, r = x + pl.fw / 2, f = z - pl.fd / 2, b = z + pl.fd / 2;
    if (l < -half) x += Math.ceil(-half - l - 1e-6); else if (r > half) x -= Math.ceil(r - half - 1e-6);
    if (f < -half) z += Math.ceil(-half - f - 1e-6); else if (b > half) z -= Math.ceil(b - half - 1e-6);
  }
  return [x, z];
}

export function materialize(pl, x, y, z, keepIds) {
  return pl.members.map((m, i) => makeBrick(m.t, m.c, x + m.dx, y + m.dy, z + m.dz, m.r, keepIds ? keepIds[i] : undefined));
}

export function payloadDiag(pl) { return !pl.group && pl.members[0].r % 2 === 1; }
