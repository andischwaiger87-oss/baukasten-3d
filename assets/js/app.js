// Baukasten 3D – App-Steuerung
import { Scene3D, renderOptions } from './scene.js';
import { Model, makeBrick, aabb, footprint, payloadFromBricks, singlePayload, rotatePayload, snapAnchor, materialize, payloadDiag, alignAnchor } from './model.js';
import { PARTS, PART_MAP, CATEGORIES, COLORS, COLOR_GROUPS, colorInfo, partHeight, sizeLabel } from './catalog.js';
import * as Store from './storage.js';
import { TEMPLATES } from './templates.js';
import { partThumb, bricksThumb } from './thumbs.js';
import { icon } from './icons.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const h = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } if (html) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isTouch = matchMedia('(pointer: coarse)').matches;

const TOOLS = [
  { id: 'build', name: 'Bauen', key: 'B', icon: 'build' },
  { id: 'select', name: 'Auswählen', key: 'V', icon: 'select' },
  { id: 'pick', name: 'Pipette', key: 'I', icon: 'pick' },
  { id: 'paint', name: 'Färben', key: 'F', icon: 'paint' },
  { id: 'erase', name: 'Entfernen', key: 'E', icon: 'erase' },
];
const OUTLINE = { select: '#6f00ff', paint: '#d946ef', erase: '#e11d48', pick: '#f59e0b', step: '#6f00ff' };

// ---------------------------------------------------------------------------
const settings = Store.loadSettings();
const model = new Model();
const state = {
  tool: 'build', part: 'b24', color: 'red', rot: 0,
  payload: null, stamp: false,            // stamp = Gruppe aus Kopie / Duplikat
  selection: new Set(), clipboard: null,
  category: 'bricks', search: '',
  project: null, level: Infinity,
  instr: null, lastHover: null,
};
let scene;

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
function init() {
  renderOptions.edges = settings.edges;
  renderChrome();
  scene = new Scene3D($('#canvas'), { plate: 32, plateColor: settings.plateColor, shadows: settings.shadows });
  model.on(onModelChange);
  openInitialProject();
  bindCanvas();
  bindKeys();
  renderParts(); renderColors(); updateCurrentPart(); setTool('build');
  if (!settings.onboarded) showOnboarding();
  window.addEventListener('beforeunload', () => saveNow());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

function openInitialProject() {
  const legacy = Store.takeLegacyAutosave();
  if (legacy) {
    const p = Store.newProject('Übernommenes Modell');
    Store.saveProject(p, legacy, null);
    loadProjectIntoApp(p, legacy);
    toast('Dein bisheriges Modell wurde übernommen.');
    return;
  }
  const id = Store.currentProjectId();
  const p = id && Store.loadProject(id);
  if (p) { loadProjectIntoApp(p, p.bricks); return; }
  const list = Store.listProjects();
  if (list.length) { const q = Store.loadProject(list[0].id); if (q) { loadProjectIntoApp(q, q.bricks); return; } }
  const fresh = Store.newProject('Mein erstes Modell', settings.plate);
  loadProjectIntoApp(fresh, []);
}

function loadProjectIntoApp(project, bricks) {
  saveNow();
  state.project = { id: project.id, name: project.name, plate: project.plate || 32, created: project.created };
  Store.setCurrentProject(project.id);
  model.plate = state.project.plate;
  if (scene.plateSize !== model.plate) scene.buildPlate(model.plate, settings.plateColor);
  clearSelection();
  exitInstructions();
  setLevel(Infinity);
  model.reset(bricks);
  $('#project-name').value = state.project.name;
  updatePlateInfo();
  scene.setView(bricks.length ? 'fit' : 'iso', false);
  if (bricks.length) scene.setView('iso', false);
  setSaveState('saved');
}

// ---------------------------------------------------------------------------
// Grundgerüst der Oberfläche
// ---------------------------------------------------------------------------
function btn(ic, label, onclick, extra = {}) {
  const b = h('button', { class: 'ib ' + (extra.class || ''), type: 'button', title: label + (extra.key ? ` (${extra.key})` : ''), 'aria-label': label, onclick, ...(extra.attrs || {}) }, icon(ic) + (extra.text ? `<span>${extra.text}</span>` : ''));
  return b;
}

function renderChrome() {
  const top = $('#topbar');
  top.innerHTML = `
    <a class="brand" href="./" aria-label="Baukasten 3D">
      <img src="assets/img/logo.svg" alt="" width="30" height="30"><span>Baukasten <b>3D</b></span>
    </a>
    <div class="project">
      <input id="project-name" maxlength="60" spellcheck="false" aria-label="Name des Modells">
      <span id="save-state" class="save-state" aria-live="polite"></span>
    </div>
    <div class="grow"></div>`;
  $('#project-name').addEventListener('change', e => {
    const name = e.target.value.trim() || 'Ohne Namen';
    e.target.value = name; state.project.name = name; saveSoon(0);
  });
  $('#project-name').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });

  const g1 = h('div', { class: 'tgroup' });
  g1.append(btn('undo', 'Rückgängig', () => undo(), { key: 'Strg+Z', attrs: { id: 'btn-undo' } }), btn('redo', 'Wiederholen', () => redo(), { key: 'Strg+Y', attrs: { id: 'btn-redo' } }));
  const g2 = h('div', { class: 'tgroup wide-only' });
  g2.append(
    btn('folder', 'Meine Modelle', openProjects, { text: 'Modelle', class: 'labeled' }),
    btn('template', 'Vorlagen', openTemplates, { text: 'Vorlagen', class: 'labeled' }),
    btn('download', 'Datei', e => openFileMenu(e.currentTarget), { text: 'Datei', class: 'labeled' }),
    btn('book', 'Bauanleitung', startInstructions, { text: 'Anleitung', class: 'labeled' }),
    btn('list', 'Stückliste', openPartsList, { text: 'Stückliste', class: 'labeled' }),
  );
  const g3 = h('div', { class: 'tgroup' });
  g3.append(btn('help', 'Hilfe & Tastenkürzel', openHelp, { key: '?', class: 'wide-only' }), btn('gear', 'Einstellungen', openSettings, { class: 'wide-only' }), btn('more', 'Menü', e => openMainMenu(e.currentTarget), { class: 'narrow-only' }));
  top.append(g1, g2, g3);

  // Werkzeugleiste
  const tb = $('#toolbar');
  tb.append(h('button', { class: 'tool narrow-only', type: 'button', 'aria-label': 'Teile', onclick: () => toggleSheet('parts') }, icon('parts') + '<span>Teile</span>'));
  for (const t of TOOLS) {
    tb.append(h('button', { class: 'tool', type: 'button', 'data-tool': t.id, title: `${t.name} (${t.key})`, 'aria-label': t.name, onclick: () => setTool(t.id) }, icon(t.icon) + `<span>${t.name}</span>`));
  }
  tb.append(h('div', { class: 'tsep' }));
  tb.append(h('button', { class: 'tool', type: 'button', id: 'btn-rotate', title: 'Drehen (R, mit Umschalt 45°)', 'aria-label': 'Drehen', onclick: e => rotateAction(e.shiftKey ? 1 : 2) }, icon('rotate') + '<span>Drehen</span>'));
  tb.append(h('button', { class: 'tool narrow-only', type: 'button', 'aria-label': 'Farbe', onclick: () => toggleSheet('colors') }, `<i class="cdot" id="tb-color"></i><span>Farbe</span>`));

  // Ansicht
  const vw = $('#viewbar');
  vw.append(
    btn('cube', 'Schrägansicht', () => scene.setView('iso'), { key: '1' }),
    btn('top', 'Von oben', () => scene.setView('top'), { key: '2' }),
    btn('front', 'Von vorne', () => scene.setView('front'), { key: '3' }),
    btn('fit', 'Modell einpassen', () => scene.setView('fit'), { key: '0' }),
  );

  // Ebenen-Regler
  $('#level').innerHTML = `${icon('layers')}<input type="range" id="level-range" min="1" max="30" value="30" step="1" aria-label="Ebenen ausblenden" orient="vertical"><span id="level-label">Alle</span>`;
  $('#level-range').addEventListener('input', e => {
    const v = +e.target.value; setLevel(v >= +e.target.max ? Infinity : v);
  });

  // Seitenleisten
  $('#parts-head').innerHTML = `<div class="ph"><h2>Teile</h2><button class="ib narrow-only" aria-label="Schließen" type="button" data-close-sheet>${icon('close')}</button></div>
    <label class="search">${icon('search')}<input id="part-search" type="search" placeholder="Teil suchen …" aria-label="Teil suchen" autocomplete="off"></label>
    <div class="chips" id="cats" role="tablist"></div>`;
  $('#part-search').addEventListener('input', e => { state.search = e.target.value.trim().toLowerCase(); renderParts(); });
  const cats = $('#cats');
  const allCats = [{ id: 'recent', name: 'Zuletzt' }, ...CATEGORIES];
  for (const c of allCats) cats.append(h('button', { class: 'chip', type: 'button', role: 'tab', 'data-cat': c.id, onclick: () => { state.category = c.id; state.search = ''; $('#part-search').value = ''; renderParts(); } }, esc(c.name)));
  $$('[data-close-sheet]').forEach(b => b.addEventListener('click', () => toggleSheet(null)));
  $('#sheet-backdrop').addEventListener('click', () => toggleSheet(null));
}

// ---------------------------------------------------------------------------
// Teile-Auswahl
// ---------------------------------------------------------------------------
let thumbQueue = [], thumbBusy = false;
function queueThumb(img) {
  thumbQueue.push(img);
  if (!thumbBusy) { thumbBusy = true; requestAnimationFrame(runThumbs); }
}
function runThumbs() {
  const t0 = performance.now();
  while (thumbQueue.length && performance.now() - t0 < 12) {
    const img = thumbQueue.shift();
    if (!img.isConnected) continue;
    img.src = partThumb(img.dataset.part, state.color, 112, true);
    img.dataset.color = state.color;
  }
  if (thumbQueue.length) requestAnimationFrame(runThumbs); else thumbBusy = false;
}
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); queueThumb(e.target); }
}, { rootMargin: '200px' });

function renderParts() {
  $$('#cats .chip').forEach(c => c.classList.toggle('on', !state.search && c.dataset.cat === state.category));
  const grid = $('#parts-grid'); grid.innerHTML = '';
  let list;
  if (state.search) {
    const q = state.search.replace('x', '×');
    list = PARTS.filter(p => p.name.toLowerCase().includes(q) || (CATEGORIES.find(c => c.id === p.cat)?.name.toLowerCase().includes(q)));
  } else if (state.category === 'recent') {
    list = settings.recentParts.map(id => PART_MAP.get(id)).filter(Boolean);
    if (!list.length) { grid.innerHTML = '<p class="empty">Hier erscheinen die Teile, die du zuletzt verbaut hast.</p>'; return; }
  } else list = PARTS.filter(p => p.cat === state.category);
  if (!list.length) { grid.innerHTML = '<p class="empty">Kein Teil gefunden.</p>'; return; }
  for (const p of list) {
    const card = h('button', { class: 'part' + (p.id === state.part && !state.stamp ? ' on' : ''), type: 'button', 'data-part': p.id, title: p.name, onclick: () => selectPart(p.id) },
      `<img alt="" data-part="${p.id}" width="96" height="96"><span class="pn">${esc(p.name)}</span>`);
    grid.append(card);
    io.observe($('img', card));
  }
}

function refreshThumbColors() {
  thumbQueue = [];
  $$('#parts-grid img').forEach(img => { if (img.dataset.color && img.dataset.color !== state.color) io.observe(img); });
}

function selectPart(id) {
  state.part = id; state.stamp = false;
  const p = PART_MAP.get(id);
  if (p.suggest && p.cat === 'nature' && state.color !== p.suggest) { state.color = p.suggest; markColor(); refreshThumbColors(); }
  if (state.tool !== 'build') setTool('build'); else refreshPayload();
  $$('#parts-grid .part').forEach(c => c.classList.toggle('on', c.dataset.part === id));
  updateCurrentPart();
  if (isNarrow()) toggleSheet(null);
}

function updateCurrentPart() {
  const el = $('#current');
  if (!el) return;
  if (state.stamp && state.payload) {
    el.innerHTML = `<div class="cur"><div class="cur-ico">${icon('copy')}</div><div><b>Gruppe aus ${state.payload.members.length} Teilen</b><small>Klicke zum Einsetzen · Esc beendet</small></div></div>`;
  } else {
    const p = PART_MAP.get(state.part);
    el.innerHTML = `<div class="cur"><img alt="" src="${partThumb(state.part, state.color)}" width="56" height="56"><div><b>${esc(p.name)}</b><small>${sizeLabel(p)} · Höhe ${p.size[2] % 3 === 0 ? p.size[2] / 3 + ' Stein' + (p.size[2] > 3 ? 'e' : '') : p.size[2] + ' Platte' + (p.size[2] > 1 ? 'n' : '')} · ${rotLabel(state.rot)}</small></div></div>`;
  }
  const dot = $('#tb-color'); if (dot) dot.style.background = colorInfo(state.color).hex;
}
const rotLabel = r => `${((r % 8) + 8) % 8 * 45}°`;

// ---------------------------------------------------------------------------
// Farben
// ---------------------------------------------------------------------------
function renderColors() {
  const box = $('#colors'); box.innerHTML = '';
  const head = h('div', { class: 'ph' }, `<h2>Farbe</h2><span class="cname" id="color-name"></span><button class="ib narrow-only" aria-label="Schließen" type="button" data-close-sheet>${icon('close')}</button>`);
  box.append(head);
  $('[data-close-sheet]', head).addEventListener('click', () => toggleSheet(null));
  for (const g of COLOR_GROUPS) {
    const wrap = h('div', { class: 'cgroup' }, `<span class="glabel">${g.name}</span>`);
    const row = h('div', { class: 'swatches' });
    for (const c of COLORS.filter(c => c.g === g.id)) row.append(swatch(c.id));
    wrap.append(row); box.append(wrap);
  }
  // eigene Farbe + zuletzt
  const own = h('div', { class: 'cgroup' }, '<span class="glabel">Eigene Farbe</span>');
  const row = h('div', { class: 'swatches' });
  const pick = h('label', { class: 'sw custom', title: 'Eigene Farbe wählen' }, `${icon('plus')}<input type="color" aria-label="Eigene Farbe wählen" value="#6f00ff">`);
  $('input', pick).addEventListener('change', e => setColor(e.target.value.toLowerCase()));
  row.append(pick);
  for (const c of settings.recentColors.filter(c => c.startsWith('#')).slice(0, 7)) row.append(swatch(c));
  own.append(row); box.append(own);
  markColor();
}
function swatch(id) {
  const c = colorInfo(id);
  const b = h('button', { class: 'sw' + (c.opacity ? ' trans' : '') + (c.glow ? ' glow' : '') + (c.metalness ? ' metal' : ''), type: 'button', 'data-color': id, title: c.name, 'aria-label': c.name, onclick: () => setColor(id) });
  b.style.setProperty('--c', c.hex);
  return b;
}
function markColor() {
  $$('#colors .sw[data-color]').forEach(s => s.classList.toggle('on', s.dataset.color === state.color));
  const n = $('#color-name'); if (n) n.textContent = colorInfo(state.color).name;
}
function setColor(id) {
  state.color = id;
  if (id.startsWith('#')) {
    settings.recentColors = [id, ...settings.recentColors.filter(c => c !== id)].slice(0, 7);
    Store.saveSettings(settings); renderColors();
  } else markColor();
  if (state.tool === 'select' && state.selection.size) colorSelection(id);
  if (state.stamp) { /* Gruppe behält ihre Farben */ } else refreshPayload();
  refreshThumbColors(); updateCurrentPart();
}

// ---------------------------------------------------------------------------
// Werkzeuge
// ---------------------------------------------------------------------------
function setTool(t) {
  if (state.instr) return;
  state.tool = t;
  $$('#toolbar [data-tool]').forEach(b => { const on = b.dataset.tool === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  document.body.dataset.tool = t;
  if (t !== 'build') { state.stamp = false; }
  if (t !== 'select') clearSelection();
  scene.setOutlines('hover', null);
  refreshPayload();
  updateCurrentPart();
  updateStatus();
}

function refreshPayload() {
  if (state.tool !== 'build') { scene.setPreview(null); state.payload = null; return; }
  if (!state.stamp) state.payload = singlePayload(state.part, state.color, state.rot);
  scene.setPreview(state.payload);
  if (state.lastHover) hover(state.lastHover);
}

function rotateAction(eighths) {
  if (state.instr) return;
  if (state.tool === 'select' && state.selection.size) return rotateSelection(eighths);
  if (state.tool !== 'build') setTool('build');
  if (state.stamp && state.payload) { state.payload = rotatePayload(state.payload, eighths); scene.setPreview(state.payload); }
  else { state.rot = (state.rot + eighths + 8) % 8; refreshPayload(); }
  if (state.lastHover) hover(state.lastHover);
  updateCurrentPart(); sound('tick');
}

// ---------------------------------------------------------------------------
// Zeiger auf der Baufläche
// ---------------------------------------------------------------------------
function bindCanvas() {
  const el = scene.renderer.domElement;
  let down = null;
  el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now(), b: e.button, alt: e.altKey }; });
  el.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && e.buttons === 0) hover(e);
    else if (e.pointerType === 'mouse' && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { scene.hidePreview(); }
  });
  el.addEventListener('pointerleave', () => { state.lastHover = null; scene.hidePreview(); scene.setOutlines('hover', null); });
  el.addEventListener('pointerup', e => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
    const ok = down.b === 0 && moved < 7 && dt < 700;
    down = null;
    if (ok) click(e);
    if (e.pointerType === 'mouse') hover(e);
  });
  el.addEventListener('contextmenu', e => e.preventDefault());
}

function hover(e) {
  state.lastHover = { clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, altKey: e.altKey };
  if (state.instr) return;
  const hit = scene.pick(scene.ndcFromEvent(e));
  if (state.tool === 'build' && !e.altKey) {
    scene.setOutlines('hover', null);
    const pl = placement(hit);
    if (pl) scene.movePreview(pl.x, pl.y, pl.z, true); else scene.hidePreview();
  } else {
    scene.hidePreview();
    const tool = e.altKey && state.tool === 'build' ? 'pick' : state.tool;
    const b = hit && hit.type === 'brick' ? model.byId(hit.id) : null;
    scene.setOutlines('hover', b && !state.selection.has(b.id) ? [b] : null, OUTLINE[tool]);
  }
}

function payloadHeight(pl) { let m = 0; for (const x of pl.members) m = Math.max(m, x.dy + partHeight(x.t)); return m; }

function placement(hit) {
  const pl = state.payload;
  if (!hit || !pl) return null;
  if (hit.type === 'ground' && !hit.inside) return null;
  const target = hit.point.clone();
  let baseY = 0;
  if (hit.type === 'brick') {
    const b = model.byId(hit.id); if (!b) return null;
    const a = aabb(b);
    if (hit.normal.y > 0.5) baseY = a.y1;
    else if (hit.normal.y < -0.5) baseY = Math.max(0, a.y0 - payloadHeight(pl));
    else { target.x += hit.normal.x * 0.5; target.z += hit.normal.z * 0.5; baseY = a.y0; }
  }
  const [x, z] = alignAnchor(pl, target.x, target.z, model.plate);
  const cands = materialize(pl, x, baseY, z);
  const lift = model.resolveY(cands);
  return { x, y: baseY + lift, z };
}

function click(e) {
  if (state.instr) return;
  const hit = scene.pick(scene.ndcFromEvent(e));
  const brick = hit && hit.type === 'brick' ? model.byId(hit.id) : null;
  const tool = (e.altKey && state.tool === 'build') ? 'pick' : state.tool;
  switch (tool) {
    case 'build': {
      const pl = placement(hit);
      if (!pl) return;
      const list = materialize(state.payload, pl.x, pl.y, pl.z);
      if (!model.inBounds(list)) return toast('Das passt nicht mehr auf die Grundplatte.');
      lastAdded = new Set(list.map(b => b.id));
      model.add(list);
      if (!state.stamp) rememberPart(state.part);
      sound('place');
      break;
    }
    case 'select':
      if (!brick) { clearSelection(); break; }
      if (e.shiftKey || e.ctrlKey || e.metaKey) { state.selection.has(brick.id) ? state.selection.delete(brick.id) : state.selection.add(brick.id); }
      else if (state.selection.size === 1 && state.selection.has(brick.id)) { /* bleibt */ }
      else { state.selection = new Set([brick.id]); }
      selectionChanged(); sound('tick');
      break;
    case 'pick':
      if (!brick) break;
      state.part = brick.t; state.rot = brick.r; state.stamp = false;
      setColor(brick.c);
      state.category = PART_MAP.get(brick.t).cat; renderParts();
      setTool('build'); sound('tick');
      toast(`${PART_MAP.get(brick.t).name} in ${colorInfo(brick.c).name} übernommen`);
      break;
    case 'paint':
      if (!brick || brick.c === state.color) break;
      model.replace([makeBrick(brick.t, state.color, brick.x, brick.y, brick.z, brick.r, brick.id)]);
      sound('tick');
      break;
    case 'erase':
      if (!brick) break;
      model.remove([brick.id]); sound('remove');
      break;
  }
  if (e.pointerType !== 'mouse') { scene.hidePreview(); scene.setOutlines('hover', null); }
}

let lastAdded = null;
function onModelChange(reason) {
  scene.sync(model.bricks);
  lastAdded = null;
  // Auswahl bereinigen
  for (const id of [...state.selection]) if (!model.byId(id)) state.selection.delete(id);
  selectionChanged(false);
  $('#btn-undo').disabled = !model.canUndo; $('#btn-redo').disabled = !model.canRedo;
  updateLevelMax();
  updateStatus();
  if (reason !== 'load') saveSoon();
  if (state.lastHover && state.tool === 'build') hover(state.lastHover);
}

function updateStatus() {
  const n = model.count;
  const tool = TOOLS.find(t => t.id === state.tool);
  const hint = {
    build: isTouch ? 'Tippen zum Setzen' : 'Klick setzt · R dreht · Alt+Klick übernimmt ein Teil',
    select: isTouch ? 'Tippe Teile an' : 'Klick wählt · Umschalt+Klick ergänzt · Pfeiltasten verschieben',
    pick: 'Teil antippen, um Form und Farbe zu übernehmen',
    paint: 'Teil antippen, um es neu einzufärben',
    erase: 'Teil antippen, um es zu entfernen',
  }[state.tool];
  $('#status').innerHTML = `<b>${n.toLocaleString('de-AT')}</b> ${n === 1 ? 'Teil' : 'Teile'}<span class="sep"></span>${tool.name}<span class="hint">${hint}</span>`;
}

// ---------------------------------------------------------------------------
// Auswahl
// ---------------------------------------------------------------------------
function selectedBricks() { return model.bricks.filter(b => state.selection.has(b.id)); }
function clearSelection() { if (!state.selection.size) return; state.selection.clear(); selectionChanged(); }
function selectionChanged() {
  const list = selectedBricks();
  scene?.setOutlines('sel', list, OUTLINE.select);
  const bar = $('#selbar');
  if (!list.length || state.tool !== 'select') { bar.hidden = true; return; }
  bar.hidden = false;
  $('#sel-count').textContent = `${list.length} ${list.length === 1 ? 'Teil' : 'Teile'}`;
}

function buildSelbar() {
  const bar = $('#selbar');
  bar.innerHTML = '<span id="sel-count" class="selcount"></span>';
  const add = (ic, label, fn, key) => bar.append(btn(ic, label, fn, { key }));
  add('left', 'Nach links', () => nudge('left'), '←');
  add('up', 'Nach hinten', () => nudge('fwd'), '↑');
  add('down', 'Nach vorne', () => nudge('back'), '↓');
  add('right', 'Nach rechts', () => nudge('right'), '→');
  bar.append(h('span', { class: 'tsep' }));
  bar.append(h('button', { class: 'ib txt', type: 'button', title: 'Eine Platte höher (Bild ↑)', onclick: () => moveSelection(0, 1, 0) }, '<span>+1</span>'));
  bar.append(h('button', { class: 'ib txt', type: 'button', title: 'Eine Platte tiefer (Bild ↓)', onclick: () => moveSelection(0, -1, 0) }, '<span>−1</span>'));
  bar.append(h('span', { class: 'tsep' }));
  add('rotate', 'Drehen', () => rotateSelection(2), 'R');
  add('copy', 'Duplizieren', duplicateSelection, 'Strg+D');
  add('trash', 'Löschen', deleteSelection, 'Entf');
  add('close', 'Auswahl aufheben', clearSelection, 'Esc');
}

function nudge(dir) {
  const ax = scene.cameraAxes();
  const v = { fwd: ax.fwd, back: [-ax.fwd[0], -ax.fwd[1]], right: ax.right, left: [-ax.right[0], -ax.right[1]] }[dir];
  moveSelection(v[0], 0, v[1]);
}

function tryApply(moved, msg = 'Dort ist kein Platz.') {
  const ignore = new Set(moved.map(b => b.id));
  if (!model.inBounds(moved)) { toast('Das liegt außerhalb der Grundplatte.'); sound('deny'); return false; }
  if (model.collides(moved, ignore)) { toast(msg); sound('deny'); return false; }
  model.replace(moved); return true;
}

function moveSelection(dx, dy, dz) {
  const sel = selectedBricks(); if (!sel.length) return;
  const moved = sel.map(b => makeBrick(b.t, b.c, b.x + dx, b.y + dy, b.z + dz, b.r, b.id));
  if (tryApply(moved)) sound('tick');
}

function rotateSelection(eighths) {
  const sel = selectedBricks(); if (!sel.length) return;
  const pl = payloadFromBricks(sel);
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, y0 = Infinity;
  for (const b of sel) { const a = aabb(b); x0 = Math.min(x0, a.x0); x1 = Math.max(x1, a.x1); z0 = Math.min(z0, a.z0); z1 = Math.max(z1, a.z1); y0 = Math.min(y0, a.y0); }
  const rp = rotatePayload(pl, sel.length > 1 ? 2 * Math.sign(eighths) : eighths);
  const [x, z] = alignAnchor(rp, (x0 + x1) / 2, (z0 + z1) / 2);
  const moved = materialize(rp, x, y0, z, sel.map(b => b.id));
  if (tryApply(moved, 'Zum Drehen fehlt der Platz.')) sound('tick');
}

function duplicateSelection() {
  const sel = selectedBricks(); if (!sel.length) return;
  state.clipboard = payloadFromBricks(sel);
  startStamp(state.clipboard);
}
function startStamp(pl) {
  state.stamp = true; state.payload = { ...pl, members: pl.members.map(m => ({ ...m })) };
  state.tool = 'build';
  state.selection.clear(); selectionChanged();
  $$('#toolbar [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === 'build'));
  document.body.dataset.tool = 'build';
  scene.setPreview(state.payload);
  $$('#parts-grid .part').forEach(c => c.classList.remove('on'));
  updateCurrentPart(); updateStatus();
  toast(`Gruppe mit ${pl.members.length} Teilen bereit – klicke zum Einsetzen, Esc beendet.`);
}
function deleteSelection() {
  const ids = [...state.selection]; if (!ids.length) return;
  model.remove(ids); state.selection.clear(); selectionChanged(); sound('remove');
}
function colorSelection(c) {
  const sel = selectedBricks(); if (!sel.length) return;
  model.replace(sel.map(b => makeBrick(b.t, c, b.x, b.y, b.z, b.r, b.id)));
}

// ---------------------------------------------------------------------------
// Verlauf
// ---------------------------------------------------------------------------
function undo() { if (state.instr) return; if (model.undo()) sound('tick'); }
function redo() { if (state.instr) return; if (model.redo()) sound('tick'); }

// ---------------------------------------------------------------------------
// Ebenen
// ---------------------------------------------------------------------------
function updateLevelMax() {
  const r = $('#level-range'); if (!r) return;
  const top = Math.max(3, Math.ceil(model.topY()));
  const wasAll = state.level === Infinity;
  r.max = String(top + 1);
  if (wasAll) r.value = r.max;
  $('#level').classList.toggle('show', model.count > 0);
}
function setLevel(v) {
  state.level = v;
  if (scene) { scene.levelLimit = v; scene.applyVisibility(); }
  const label = $('#level-label');
  if (label) label.textContent = v === Infinity ? 'Alle' : `bis ${v}`;
  const r = $('#level-range'); if (r && v === Infinity) r.value = r.max;
  $('#level')?.classList.toggle('active', v !== Infinity);
}

// ---------------------------------------------------------------------------
// Tastatur
// ---------------------------------------------------------------------------
function bindKeys() {
  window.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if ($('dialog[open]')) return;
    const k = e.key, mod = e.ctrlKey || e.metaKey;
    if (state.instr) {
      if (k === 'ArrowRight' || k === ' ') { e.preventDefault(); stepInstr(1); }
      else if (k === 'ArrowLeft') { e.preventDefault(); stepInstr(-1); }
      else if (k === 'Escape') exitInstructions();
      return;
    }
    if (mod && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && k.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (mod && k.toLowerCase() === 's') { e.preventDefault(); saveNow(); toast('Gespeichert. Für eine Datei: Datei → Als Datei speichern.'); return; }
    if (mod && k.toLowerCase() === 'o') { e.preventDefault(); importFile(); return; }
    if (mod && k.toLowerCase() === 'a') { e.preventDefault(); setTool('select'); state.selection = new Set(model.bricks.map(b => b.id)); selectionChanged(); return; }
    if (mod && k.toLowerCase() === 'c') { const s = selectedBricks(); if (s.length) { state.clipboard = payloadFromBricks(s); toast(`${s.length} ${s.length === 1 ? 'Teil' : 'Teile'} kopiert`); } return; }
    if (mod && k.toLowerCase() === 'v') { if (state.clipboard) startStamp(state.clipboard); return; }
    if (mod && k.toLowerCase() === 'd') { e.preventDefault(); duplicateSelection(); return; }
    if (mod) return;
    const sel = state.tool === 'select' && state.selection.size;
    switch (k) {
      case 'b': case 'B': setTool('build'); break;
      case 'v': case 'V': setTool('select'); break;
      case 'i': case 'I': setTool('pick'); break;
      case 'f': case 'F': setTool('paint'); break;
      case 'e': case 'E': case 'x': case 'X': setTool('erase'); break;
      case 'r': case 'R': rotateAction(e.shiftKey ? 1 : 2); break;
      case '1': scene.setView('iso'); break;
      case '2': scene.setView('top'); break;
      case '3': scene.setView('front'); break;
      case '0': case 'Home': scene.setView('fit'); break;
      case '?': case 'h': case 'H': openHelp(); break;
      case 'Escape':
        if (state.stamp) { state.stamp = false; refreshPayload(); renderParts(); updateCurrentPart(); }
        else if (state.selection.size) clearSelection();
        else if (state.tool !== 'build') setTool('build');
        break;
      case 'Delete': case 'Backspace': if (sel) { e.preventDefault(); deleteSelection(); } break;
      case 'ArrowLeft': if (sel) { e.preventDefault(); nudge('left'); } break;
      case 'ArrowRight': if (sel) { e.preventDefault(); nudge('right'); } break;
      case 'ArrowUp': if (sel) { e.preventDefault(); nudge('fwd'); } break;
      case 'ArrowDown': if (sel) { e.preventDefault(); nudge('back'); } break;
      case 'PageUp': if (sel) { e.preventDefault(); moveSelection(0, e.shiftKey ? 3 : 1, 0); } break;
      case 'PageDown': if (sel) { e.preventDefault(); moveSelection(0, e.shiftKey ? -3 : -1, 0); } break;
      default: return;
    }
  });
  window.addEventListener('keyup', e => { if (e.key === 'Alt' && state.lastHover) hover({ ...state.lastHover, altKey: false }); });
  window.addEventListener('keydown', e => { if (e.key === 'Alt') { e.preventDefault(); if (state.lastHover) hover({ ...state.lastHover, altKey: true }); } });
}

// ---------------------------------------------------------------------------
// Speichern
// ---------------------------------------------------------------------------
let saveTimer = null, thumbTimer = null, dirty = false;
function saveSoon(ms = 600) {
  dirty = true; setSaveState('saving');
  clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, ms);
  clearTimeout(thumbTimer); thumbTimer = setTimeout(saveThumb, 2500);
}
function saveNow() {
  clearTimeout(saveTimer);
  if (!dirty || !state.project) return;
  const ok = Store.saveProject(state.project, model.bricks);
  dirty = false;
  setSaveState(ok ? 'saved' : 'full');
}
function saveThumb() {
  if (!state.project || model.count > 4000) return;
  try {
    const url = model.count ? bricksThumb(model.bricks, 240) : null;
    Store.saveProject(state.project, model.bricks, url);
  } catch (e) { console.warn(e); }
}
function setSaveState(s) {
  const el = $('#save-state'); if (!el) return;
  el.dataset.state = s;
  el.textContent = { saved: 'Gespeichert', saving: 'Speichert …', full: 'Speicher voll – bitte als Datei sichern' }[s];
}

// ---------------------------------------------------------------------------
// Dialoge
// ---------------------------------------------------------------------------
function modal(title, body, { wide = false, actions = [] } = {}) {
  const d = h('dialog', { class: 'modal' + (wide ? ' wide' : ''), 'aria-label': title });
  d.innerHTML = `<header><h2>${esc(title)}</h2><button class="ib" type="button" aria-label="Schließen" data-x>${icon('close')}</button></header><div class="mbody"></div>`;
  const mb = $('.mbody', d);
  if (typeof body === 'string') mb.innerHTML = body; else mb.append(body);
  if (actions.length) {
    const f = h('footer');
    for (const a of actions) f.append(h('button', { class: 'btn ' + (a.kind || ''), type: 'button', onclick: () => { const r = a.onclick?.(); if (r !== false) close(); } }, esc(a.label)));
    d.append(f);
  }
  const close = () => { d.close(); };
  d.addEventListener('close', () => d.remove());
  d.addEventListener('click', e => { if (e.target === d) close(); });
  $('[data-x]', d).addEventListener('click', close);
  document.body.append(d); d.showModal();
  return { el: d, close };
}

function confirmBox(title, text, okLabel = 'OK', danger = false) {
  return new Promise(res => {
    let result = false;
    const m = modal(title, `<p>${esc(text)}</p>`, { actions: [{ label: 'Abbrechen', onclick: () => { result = false; } }, { label: okLabel, kind: danger ? 'danger' : 'primary', onclick: () => { result = true; } }] });
    m.el.addEventListener('close', () => res(result));
  });
}

function popover(anchor, items) {
  closePopover();
  const p = h('div', { class: 'popover', role: 'menu' });
  for (const it of items) {
    if (it === '-') { p.append(h('div', { class: 'psep' })); continue; }
    p.append(h('button', { class: 'pitem' + (it.danger ? ' danger' : ''), type: 'button', role: 'menuitem', onclick: () => { closePopover(); it.onclick(); } }, icon(it.icon) + `<span>${esc(it.label)}</span>` + (it.key ? `<kbd>${it.key}</kbd>` : '')));
  }
  document.body.append(p);
  const r = anchor.getBoundingClientRect();
  const left = Math.min(Math.max(8, r.right - p.offsetWidth), innerWidth - p.offsetWidth - 8);
  p.style.left = left + 'px'; p.style.top = (r.bottom + 6) + 'px';
  setTimeout(() => document.addEventListener('pointerdown', outside), 0);
  function outside(e) { if (!p.contains(e.target)) closePopover(); }
  p._outside = outside;
  $('button', p)?.focus();
}
function closePopover() { const p = $('.popover'); if (p) { document.removeEventListener('pointerdown', p._outside); p.remove(); } }

function fileItems() {
  return [
    { icon: 'plus', label: 'Neues Modell …', onclick: newModel },
    { icon: 'top', label: 'Grundplatte ändern …', onclick: openPlateDialog },
    '-',
    { icon: 'download', label: 'Als Datei speichern', key: '', onclick: exportFile },
    { icon: 'upload', label: 'Datei öffnen …', key: 'Strg+O', onclick: importFile },
    '-',
    { icon: 'image', label: 'Bild speichern (PNG)', onclick: exportImage },
    { icon: 'list', label: 'Stückliste (CSV)', onclick: exportCSV },
  ];
}
function openFileMenu(anchor) { popover(anchor, fileItems()); }
function openMainMenu(anchor) {
  popover(anchor, [
    { icon: 'folder', label: 'Meine Modelle', onclick: openProjects },
    { icon: 'template', label: 'Vorlagen', onclick: openTemplates },
    '-', ...fileItems(), '-',
    { icon: 'book', label: 'Bauanleitung', onclick: startInstructions },
    { icon: 'list', label: 'Stückliste ansehen', onclick: openPartsList },
    { icon: 'top', label: 'Grundplatte ändern', onclick: openPlateDialog },
    { icon: 'gear', label: 'Einstellungen', onclick: openSettings },
    { icon: 'help', label: 'Hilfe', onclick: openHelp },
  ]);
}

// --- Modelle -------------------------------------------------------------------
function openProjects() {
  saveNow(); saveThumb();
  const wrap = h('div');
  const bar = h('div', { class: 'mbar' });
  bar.append(h('button', { class: 'btn primary', type: 'button', onclick: () => { m.close(); newModel(); } }, icon('plus') + 'Neues Modell'));
  bar.append(h('button', { class: 'btn', type: 'button', onclick: () => { m.close(); importFile(); } }, icon('upload') + 'Datei öffnen'));
  wrap.append(bar);
  const grid = h('div', { class: 'cards' });
  wrap.append(grid);
  const m = modal('Meine Modelle', wrap, { wide: true });
  const render = () => {
    grid.innerHTML = '';
    const list = Store.listProjects();
    if (!list.length) { grid.innerHTML = '<p class="empty">Noch keine Modelle gespeichert.</p>'; return; }
    for (const p of list) {
      const cur = state.project && p.id === state.project.id;
      const card = h('div', { class: 'card' + (cur ? ' current' : '') });
      card.innerHTML = `<button class="cimg" type="button" aria-label="${esc(p.name)} öffnen">${p.thumb ? `<img src="${p.thumb}" alt="">` : icon('cube')}</button>
        <div class="cinfo"><b title="${esc(p.name)}">${esc(p.name)}</b><small>${p.count} ${p.count === 1 ? 'Teil' : 'Teile'} · ${new Date(p.updated).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' })}${cur ? ' · geöffnet' : ''}</small></div>
        <div class="cact"></div>`;
      $('.cimg', card).addEventListener('click', () => { const q = Store.loadProject(p.id); if (q) { loadProjectIntoApp(q, q.bricks); m.close(); } });
      const act = $('.cact', card);
      act.append(btn('edit', 'Umbenennen', async () => {
        const name = await promptBox('Modell umbenennen', p.name); if (!name) return;
        Store.renameProject(p.id, name); if (cur) { state.project.name = name; $('#project-name').value = name; } render();
      }));
      act.append(btn('copy', 'Duplizieren', () => {
        const q = Store.loadProject(p.id); if (!q) return;
        const np = Store.newProject(q.name + ' (Kopie)', q.plate); Store.saveProject(np, q.bricks, p.thumb); render();
      }));
      act.append(btn('trash', 'Löschen', async () => {
        if (!await confirmBox('Modell löschen?', `„${p.name}" wird endgültig gelöscht.`, 'Löschen', true)) return;
        Store.deleteProject(p.id);
        if (cur) { const rest = Store.listProjects(); if (rest.length) { const q = Store.loadProject(rest[0].id); loadProjectIntoApp(q, q.bricks); } else { dirty = false; loadProjectIntoApp(Store.newProject('Neues Modell', settings.plate), []); } }
        render();
      }, { class: 'danger' }));
      grid.append(card);
    }
  };
  render();
}

function promptBox(title, value = '') {
  return new Promise(res => {
    let result = null;
    const inp = h('input', { class: 'field', value, maxlength: 60, 'aria-label': title });
    const m = modal(title, inp, { actions: [{ label: 'Abbrechen' }, { label: 'Übernehmen', kind: 'primary', onclick: () => { result = inp.value.trim() || null; } }] });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { result = inp.value.trim() || null; m.close(); } });
    m.el.addEventListener('close', () => res(result));
    setTimeout(() => { inp.focus(); inp.select(); }, 30);
  });
}

function newModel() {
  saveNow();
  let size = settings.plate || 32;
  const b = h('div', { class: 'plates-pick' });
  const inp = h('input', { class: 'field', value: 'Neues Modell', maxlength: 60, 'aria-label': 'Name' });
  b.append(h('label', { class: 'flabel' }, 'Name'), inp, h('span', { class: 'flabel' }, 'Grundplatte'));
  const grid = h('div', { class: 'sizegrid' });
  for (const [s, n] of PLATE_SIZES) grid.append(h('button', { class: 'sizebtn' + (s === size ? ' on' : ''), type: 'button', 'data-s': s, onclick: e => { size = s; $$('.sizebtn', grid).forEach(x => x.classList.toggle('on', +x.dataset.s === s)); } }, `<i style="--s:${Math.round(14 + s / 128 * 34)}px"></i><b>${s} × ${s}</b><small>${n}</small>`));
  b.append(grid);
  const create = () => {
    const p = Store.newProject(inp.value.trim() || 'Neues Modell', size);
    settings.plate = size; Store.saveSettings(settings);
    Store.saveProject(p, [], null);
    loadProjectIntoApp(p, []);
  };
  const m = modal('Neues Modell', b, { actions: [{ label: 'Abbrechen' }, { label: 'Anlegen', kind: 'primary', onclick: create }] });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { create(); m.close(); } });
  setTimeout(() => { inp.focus(); inp.select(); }, 30);
}

// --- Vorlagen ------------------------------------------------------------------
function openTemplates() {
  const grid = h('div', { class: 'cards' });
  const m = modal('Vorlagen', grid, { wide: true });
  for (const t of TEMPLATES) {
    const bricks = t.build();
    const card = h('div', { class: 'card' });
    card.innerHTML = `<button class="cimg" type="button" aria-label="${esc(t.name)} laden"><img alt=""></button><div class="cinfo"><b>${esc(t.name)}</b><small>${bricks.length} Teile</small></div>`;
    $('.cimg', card).addEventListener('click', () => {
      const p = Store.newProject(t.name, t.plate || 32);
      Store.saveProject(p, bricks, null);
      loadProjectIntoApp(p, bricks); saveThumb();
      m.close(); toast(`Vorlage „${t.name}" als neues Modell geöffnet.`);
    });
    grid.append(card);
    requestAnimationFrame(() => { $('img', card).src = bricksThumb(bricks, 260); });
  }
}

// --- Dateien -------------------------------------------------------------------
function slug(s) { return (s || 'modell').toLowerCase().replace(/[äöüß]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'modell'; }
function download(name, blob) {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function exportFile() {
  if (!model.count) return toast('Das Modell ist noch leer.');
  download(slug(state.project.name) + '.baukasten.json', new Blob([Store.exportFile(state.project.name, model.plate, model.bricks)], { type: 'application/json' }));
}
function importFile() {
  const inp = h('input', { type: 'file', accept: '.json,application/json' });
  inp.addEventListener('change', () => {
    const f = inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = Store.parseFile(rd.result);
        const name = data.name === 'Importiertes Modell' ? f.name.replace(/\.(baukasten\.)?json$/i, '') : data.name;
        let plate = data.plate || 32;
        for (const s of [32, 48, 64, 96, 128]) { const test = new Model(); test.plate = s; if (s >= plate && test.inBounds(data.bricks)) { plate = s; break; } }
        const p = Store.newProject(name, plate);
        Store.saveProject(p, data.bricks, null);
        loadProjectIntoApp(p, data.bricks); saveThumb();
        toast(`„${name}" mit ${data.bricks.length} Teilen geöffnet.`);
      } catch (e) { console.warn(e); toast('Diese Datei kann ich nicht lesen.'); }
    };
    rd.readAsText(f);
  });
  inp.click();
}
function exportImage() {
  if (!model.count) return toast('Das Modell ist noch leer.');
  const url = scene.snapshot(1920, 1280, { transparent: false });
  fetch(url).then(r => r.blob()).then(b => download(slug(state.project.name) + '.png', b));
}
function partsSummary() {
  const map = new Map();
  for (const b of model.bricks) { const k = b.t + '|' + b.c; map.set(k, (map.get(k) || 0) + 1); }
  const order = new Map(PARTS.map((p, i) => [p.id, i]));
  return [...map].map(([k, n]) => { const [t, c] = k.split('|'); return { t, c, n }; })
    .sort((a, b) => (order.get(a.t) - order.get(b.t)) || colorInfo(a.c).name.localeCompare(colorInfo(b.c).name));
}
function exportCSV() {
  if (!model.count) return toast('Das Modell ist noch leer.');
  const rows = [['Teil', 'Größe', 'Farbe', 'Anzahl']];
  for (const r of partsSummary()) { const p = PART_MAP.get(r.t); rows.push([p.name, sizeLabel(p), colorInfo(r.c).name, r.n]); }
  const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  download(slug(state.project.name) + '-stueckliste.csv', new Blob([csv], { type: 'text/csv;charset=utf-8' }));
}

function openPartsList() {
  if (!model.count) return toast('Das Modell ist noch leer.');
  const rows = partsSummary();
  const total = model.count;
  const body = h('div');
  body.innerHTML = `<p class="muted">${total} Teile in ${rows.length} Sorten</p><div class="bom">${rows.map(r => { const p = PART_MAP.get(r.t), c = colorInfo(r.c); return `<div class="bomrow"><img alt="" src="${partThumb(r.t, r.c, 72)}" width="44" height="44"><span class="bn">${esc(p.name)}</span><span class="bc"><i style="background:${c.hex}"></i>${esc(c.name)}</span><b>${r.n}×</b></div>`; }).join('')}</div>`;
  modal('Stückliste', body, { wide: true, actions: [{ label: 'Als CSV speichern', onclick: exportCSV }, { label: 'Drucken', kind: 'primary', onclick: () => { document.body.classList.add('print-bom'); window.print(); document.body.classList.remove('print-bom'); return false; } }] });
}

function setPlate(s) {
  model.plate = s; state.project.plate = s; scene.buildPlate(s, settings.plateColor); saveSoon(0);
  updatePlateInfo();
  if (state.lastHover) hover(state.lastHover);
}
function updatePlateInfo() {
  const el = $('#plate-info'); if (!el) return;
  el.innerHTML = `<span>Grundplatte <b>${model.plate} × ${model.plate}</b></span>`;
  const b = h('button', { class: 'linkbtn', type: 'button', onclick: openPlateDialog }, 'Größe ändern');
  el.append(b);
}
function openPlateDialog() {
  const b = h('div', { class: 'plates-pick' });
  const m = modal('Grundplatte', b);
  const render = () => {
    b.innerHTML = '<p class="muted small">Größere Flächen für ganze Landschaften. Dein Modell bleibt in der Mitte.</p>';
    const grid = h('div', { class: 'sizegrid' });
    for (const [s, n] of PLATE_SIZES) {
      const test = new Model(); test.plate = s;
      const fits = test.inBounds(model.bricks);
      grid.append(h('button', { class: 'sizebtn' + (s === model.plate ? ' on' : ''), type: 'button', disabled: !fits, title: fits ? '' : 'Dein Modell ist dafür zu groß', onclick: () => { setPlate(s); m.close(); toast(`Grundplatte jetzt ${s} × ${s}`); } },
        `<i style="--s:${Math.round(14 + s / 128 * 34)}px"></i><b>${s} × ${s}</b><small>${n}</small>`));
    }
    b.append(grid);
  };
  render();
}

// --- Einstellungen & Hilfe ---------------------------------------------------------
const PLATE_SIZES = [[16, 'Mini'], [24, 'Klein'], [32, 'Standard'], [48, 'Groß'], [64, 'Burg'], [96, 'Landschaft'], [128, 'Riesig']];
const PLATE_COLORS = [['#d6dbe1', 'Hellgrau'], ['#5fae55', 'Grün'], ['#f2f2ee', 'Weiß'], ['#4f8fd6', 'Blau'], ['#d9c49a', 'Sand'], ['#4a4f57', 'Dunkel']];
function openSettings() {
  const b = h('div', { class: 'settings' });
  b.innerHTML = `
    <div class="row"><label for="s-plate">Grundplatte dieses Modells</label><select id="s-plate" class="field">${PLATE_SIZES.map(([s, n]) => `<option value="${s}" ${s === model.plate ? 'selected' : ''}>${s} × ${s} · ${n}</option>`).join('')}</select></div>
    <div class="row"><span>Farbe der Grundplatte</span><div class="swatches" id="s-pc">${PLATE_COLORS.map(([c, n]) => `<button type="button" class="sw ${c === settings.plateColor ? 'on' : ''}" style="--c:${c}" data-c="${c}" title="${n}" aria-label="${n}"></button>`).join('')}</div></div>
    <div class="row"><label for="s-shadow">Schatten</label><input type="checkbox" class="switch" id="s-shadow" ${settings.shadows ? 'checked' : ''}></div>
    <div class="row"><label for="s-edges">Kanten betonen</label><input type="checkbox" class="switch" id="s-edges" ${settings.edges ? 'checked' : ''}></div>
    <div class="row"><label for="s-sound">Klickgeräusche</label><input type="checkbox" class="switch" id="s-sound" ${settings.sound ? 'checked' : ''}></div>
    <div class="row"><span>Einführung</span><button type="button" class="btn" id="s-intro">Erneut zeigen</button></div>
    <p class="muted small">Deine Modelle werden nur in diesem Browser gespeichert (${Math.round(Store.storageUsage() / 1024)} KB belegt). Sichere wichtige Modelle zusätzlich über „Datei → Als Datei speichern".</p>`;
  const m = modal('Einstellungen', b);
  $('#s-plate', b).addEventListener('change', e => {
    const s = +e.target.value, test = new Model(); test.plate = s;
    if (!test.inBounds(model.bricks)) { toast('Dein Modell ragt über diese Größe hinaus.'); e.target.value = model.plate; return; }
    setPlate(s);
  });
  $$('#s-pc .sw', b).forEach(sw => sw.addEventListener('click', () => {
    settings.plateColor = sw.dataset.c; Store.saveSettings(settings); scene.buildPlate(model.plate, settings.plateColor);
    $$('#s-pc .sw', b).forEach(x => x.classList.toggle('on', x === sw));
  }));
  $('#s-shadow', b).addEventListener('change', e => { settings.shadows = e.target.checked; Store.saveSettings(settings); scene.setShadows(settings.shadows); });
  $('#s-edges', b).addEventListener('change', e => { settings.edges = e.target.checked; Store.saveSettings(settings); renderOptions.edges = settings.edges; scene.refreshAll(); });
  $('#s-sound', b).addEventListener('change', e => { settings.sound = e.target.checked; Store.saveSettings(settings); });
  $('#s-intro', b).addEventListener('click', () => { m.close(); showOnboarding(); });
}

function openHelp() {
  const keys = [
    ['Bauen / Auswählen / Pipette', 'B · V · I'], ['Färben / Entfernen', 'F · E'], ['Drehen 90° / 45°', 'R · Umschalt+R'],
    ['Rückgängig / Wiederholen', 'Strg+Z · Strg+Y'], ['Teil übernehmen', 'Alt + Klick'], ['Alles auswählen', 'Strg+A'],
    ['Kopieren / Einfügen / Duplizieren', 'Strg+C · Strg+V · Strg+D'], ['Auswahl verschieben', 'Pfeiltasten'], ['Höher / tiefer', 'Bild↑ · Bild↓'],
    ['Auswahl löschen', 'Entf'], ['Ansichten', '1 · 2 · 3 · 0'], ['Abbrechen', 'Esc'],
  ];
  const b = h('div', { class: 'help' });
  b.innerHTML = `
    <div class="hcols">
      <section><h3>Maus</h3><ul><li><b>Linksklick</b> – Werkzeug anwenden</li><li><b>Linke Taste ziehen</b> – Ansicht drehen</li><li><b>Rechte Taste ziehen</b> – Ansicht verschieben</li><li><b>Mausrad</b> – Zoomen</li></ul>
      <h3>Touch</h3><ul><li><b>Tippen</b> – Werkzeug anwenden</li><li><b>Ein Finger ziehen</b> – drehen</li><li><b>Zwei Finger</b> – zoomen und verschieben</li></ul></section>
      <section><h3>Tastenkürzel</h3><table>${keys.map(([a, k]) => `<tr><td>${a}</td><td><kbd>${k}</kbd></td></tr>`).join('')}</table></section>
    </div>
    <p class="muted small">Teile rasten automatisch ein und stapeln sich, wo Platz ist. Mit dem Ebenen-Regler rechts blendest du obere Lagen aus und baust innen weiter.</p>`;
  modal('Hilfe', b, { wide: true });
}

function showOnboarding() {
  const el = $('#onboard');
  el.hidden = false;
  el.innerHTML = `<h3>Willkommen im Baukasten 3D</h3>
    <ol>${isTouch
      ? '<li>Wähle unten bei <b>Teile</b> einen Stein und eine <b>Farbe</b>.</li><li><b>Tippe</b> auf die Platte, um ihn zu setzen.</li><li>Mit einem Finger drehst du die Ansicht, mit zwei zoomst du.</li>'
      : '<li>Wähle links ein Teil und rechts eine Farbe.</li><li><b>Klicke</b> auf die Platte, um es zu setzen – <b>R</b> dreht es.</li><li>Linke Maustaste ziehen dreht die Ansicht, rechte verschiebt, Mausrad zoomt.</li>'}</ol>
    <div class="obtn"><button class="btn" type="button" id="ob-tpl">Vorlage ansehen</button><button class="btn primary" type="button" id="ob-ok">Los geht's</button></div>`;
  const done = () => { el.hidden = true; settings.onboarded = true; Store.saveSettings(settings); };
  $('#ob-ok').addEventListener('click', done);
  $('#ob-tpl').addEventListener('click', () => { done(); openTemplates(); });
}

// ---------------------------------------------------------------------------
// Bauanleitung
// ---------------------------------------------------------------------------
function startInstructions() {
  if (!model.count) return toast('Baue zuerst etwas – dann entsteht die Anleitung automatisch.');
  clearSelection(); setLevel(Infinity);
  const order = [...model.bricks].sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
  state.instr = { order, step: 0, timer: null };
  document.body.classList.add('in-instr');
  scene.setPreview(null); scene.setOutlines('hover', null);
  const bar = $('#instr');
  bar.hidden = false;
  bar.innerHTML = `<div class="ipart"><img alt="" id="i-img" width="52" height="52"><div><b id="i-name"></b><small id="i-col"></small></div></div>
    <div class="inav"></div>`;
  const nav = $('.inav', bar);
  nav.append(btn('prev', 'Zurück', () => stepInstr(-1), { key: '←' }));
  nav.append(h('div', { class: 'istep' }, `<span id="i-count"></span><input type="range" id="i-range" min="1" max="${order.length}" value="1" aria-label="Schritt">`));
  nav.append(btn('next', 'Weiter', () => stepInstr(1), { key: '→' }));
  nav.append(btn('play', 'Abspielen', togglePlay, { attrs: { id: 'i-play' } }));
  nav.append(h('button', { class: 'btn primary', type: 'button', onclick: exitInstructions }, 'Fertig'));
  $('#i-range').addEventListener('input', e => { state.instr.step = +e.target.value - 1; syncInstr(); });
  syncInstr();
}
function stepInstr(d) {
  if (!state.instr) return;
  const n = state.instr.order.length;
  state.instr.step = Math.min(n - 1, Math.max(0, state.instr.step + d));
  syncInstr(); sound('tick');
}
function togglePlay() {
  const I = state.instr; if (!I) return;
  if (I.timer) { clearInterval(I.timer); I.timer = null; }
  else {
    if (I.step >= I.order.length - 1) I.step = 0;
    I.timer = setInterval(() => { if (I.step >= I.order.length - 1) { togglePlay(); return; } I.step++; syncInstr(); }, 650);
  }
  $('#i-play').innerHTML = icon(I.timer ? 'pause' : 'play');
}
function syncInstr() {
  const I = state.instr; const cur = I.order[I.step];
  scene.hidden = new Set(I.order.slice(I.step + 1).map(b => b.id));
  scene.applyVisibility();
  scene.setOutlines('sel', [cur], OUTLINE.step);
  $('#i-count').textContent = `Schritt ${I.step + 1} von ${I.order.length}`;
  $('#i-range').value = I.step + 1;
  $('#i-img').src = partThumb(cur.t, cur.c, 104);
  $('#i-name').textContent = PART_MAP.get(cur.t).name;
  $('#i-col').textContent = colorInfo(cur.c).name;
}
function exitInstructions() {
  if (!state.instr) return;
  if (state.instr.timer) clearInterval(state.instr.timer);
  state.instr = null;
  document.body.classList.remove('in-instr');
  $('#instr').hidden = true;
  scene.hidden = new Set(); scene.applyVisibility(); scene.setOutlines('sel', null);
  refreshPayload(); selectionChanged();
}

// ---------------------------------------------------------------------------
// Kleinkram
// ---------------------------------------------------------------------------
function rememberPart(id) {
  if (settings.recentParts[0] === id) return;
  settings.recentParts = [id, ...settings.recentParts.filter(p => p !== id)].slice(0, 18);
  Store.saveSettings(settings);
}

function toast(msg) {
  const t = h('div', { class: 'toast', role: 'status' }, esc(msg));
  $('#toasts').append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 2800);
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
}

const isNarrow = () => matchMedia('(max-width: 899px)').matches;
function toggleSheet(which) {
  const cur = document.body.dataset.sheet || '';
  const next = which && cur !== which ? which : '';
  document.body.dataset.sheet = next;
  $('#sheet-backdrop').hidden = !next;
}

let actx = null;
function sound(kind) {
  if (!settings.sound) return;
  try {
    actx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    const cfg = { place: [520, 900, 0.06, 0.05], tick: [700, 760, 0.025, 0.03], remove: [380, 160, 0.07, 0.06], deny: [180, 140, 0.05, 0.08] }[kind] || [600, 600, 0.03, 0.03];
    o.type = kind === 'deny' ? 'square' : 'triangle';
    o.frequency.setValueAtTime(cfg[0], t); o.frequency.exponentialRampToValueAtTime(cfg[1], t + cfg[3]);
    g.gain.setValueAtTime(cfg[2], t); g.gain.exponentialRampToValueAtTime(0.0001, t + cfg[3] + 0.03);
    o.start(t); o.stop(t + cfg[3] + 0.04);
  } catch { /* ohne Ton weiter */ }
}

buildSelbar();
init();
if (location.hash === '#debug') window.B3D = { scene, model, state, placement };
