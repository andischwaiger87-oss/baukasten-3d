// Vorlagen: werden im Code erzeugt, damit sie immer exakt auf dem Raster liegen
import { makeBrick } from './model.js';

function kit() {
  const list = [];
  const put = (t, c, x, y, z, r = 0) => list.push(makeBrick(t, c, x, y, z, r));
  // Mauer aus 1er-Steinen: Zellen entlang X (axis 'x') oder Z, mit Lücken
  const wall = (axis, fixed, from, to, y, c, skip = [], course = 0) => {
    const cells = [];
    for (let v = from; v <= to; v++) if (!skip.includes(v)) cells.push(v);
    // zusammenhängende Läufe bilden
    const runs = []; let run = [];
    for (const v of cells) { if (run.length && v !== run[run.length - 1] + 1) { runs.push(run); run = []; } run.push(v); }
    if (run.length) runs.push(run);
    for (const r of runs) {
      let i = 0, first = true;
      while (i < r.length) {
        const left = r.length - i;
        let len = left >= 4 ? 4 : left;
        if (first && course % 2 === 1 && left > 2) len = 2;   // versetzter Verband
        if (len === 3 && left > 3) len = 2;
        first = false;
        const center = r[i] + (len - 1) / 2;
        const t = len === 1 ? 'b11' : `b1${len}`;
        if (axis === 'x') put(t, c, center, y, fixed, len > 1 ? 2 : 0);
        else put(t, c, fixed, y, center, 0);
        i += len;
      }
    }
  };
  return { list, put, wall };
}

function house() {
  const { list, put, wall } = kit();
  put('p1616', 'green', 0, 0, 0);
  const W = 'white';
  for (let c = 0; c < 4; c++) {
    const y = 1 + c * 3;
    wall('x', 2.5, -2.5, 3.5, y, W, [-0.5, 0.5, 1.5], c);                       // vorne mit Tür
    wall('x', -2.5, -2.5, 3.5, y, W, (c === 1 || c === 2) ? [-0.5, 0.5, 1.5] : [], c + 1); // hinten
    wall('z', -2.5, -1.5, 1.5, y, W, (c === 1 || c === 2) ? [-0.5, 0.5] : [], c + 1);
    wall('z', 3.5, -1.5, 1.5, y, W, (c === 1 || c === 2) ? [-0.5, 0.5] : [], c);
  }
  put('door13', 'brown', 0.5, 1, 2.5, 2);
  put('win13', W, 0.5, 4, -2.5, 2);
  put('win12', W, -2.5, 4, 0, 0);
  put('win12', W, 3.5, 4, 0, 0);
  // Dach
  const R = 'dark_red';
  for (const x of [-2, 0, 2]) { put('sl22', R, x, 13, 2, 0); put('sl22', R, x, 13, -2, 4); put('b22', R, x, 13, 0); put('sl22', R, x, 16, 1, 0); put('sl22', R, x, 16, -1, 4); put('ridge22', R, x, 19, 0); }
  put('sl12', R, 3.5, 13, 2, 0); put('sl12', R, 3.5, 13, -2, 4); put('b12', R, 3.5, 13, 0); put('sl12', R, 3.5, 16, 1, 0); put('sl12', R, 3.5, 16, -1, 4); put('ridge12', R, 3.5, 19, 0);
  // Garten
  for (const x of [-0.5, 0.5, 1.5]) { put('t12', 'light_grey', x, 1, 4); put('t12', 'light_grey', x, 1, 6); put('t11', 'light_grey', x, 1, 7.5); }
  put('tree_leaf', 'green', -5, 1, 4);
  put('tree_pine', 'dark_green', 6, 1, -5);
  put('bush22', 'lime', 6, 1, 4);
  for (const [x, c] of [[-2.5, 'red'], [-1.5, 'yellow'], [2.5, 'pink'], [3.5, 'red']]) put('flower11', c, x, 1, 3.5);
  put('fence14', 'white', -6.5, 1, -2, 0);
  put('lamp11', 'dark_grey', 2.5, 1, 6.5);
  return list;
}

function car() {
  const { list, put } = kit();
  put('axle42', 'dark_grey', 0, 0, -2.5); put('axle42', 'dark_grey', 0, 0, 2.5);
  put('p48', 'dark_grey', 0, 5, 0);
  const C = 'red';
  put('b23', C, -1, 6, 1.5); put('b23', C, 1, 6, 1.5);
  put('light11', 'white', -1.5, 6, 3.5); put('light11', 'white', 1.5, 6, 3.5); put('b12', C, 0, 6, 3.5, 2);
  put('seat22', 'black', 0, 6, -1);
  put('b12', C, -1.5, 6, -1); put('b12', C, 1.5, 6, -1);
  put('b24', C, 0, 6, -3, 2);
  put('shield42', C, 0, 9, 1);
  put('sl42', C, 0, 9, 3);
  put('spoiler14', 'black', 0, 9, -3.5, 2);
  put('t11', 'black', -1.5, 9, -1.5); put('t11', 'black', 1.5, 9, -1.5);
  return list;
}

function park() {
  const { list, put } = kit();
  put('p1616', 'green', 0, 0, 0);
  for (const x of [-6, -2, 2, 6]) put('t24', 'tan', x, 1, 0, 2);
  put('tree_leaf', 'green', -5, 1, -5);
  put('tree_apple', 'green', 5, 1, -5);
  put('tree_pine', 'dark_green', -2, 1, -5);
  put('tree_birch', 'lime', 2.5, 1, -4.5);
  put('bush22', 'green', 5, 1, 5);
  put('bush22', 'dark_green', 7, 1, 3);
  for (const [x, z, c] of [[-6.5, 3.5, 'red'], [-5.5, 3.5, 'yellow'], [-6.5, 4.5, 'pink'], [-4.5, 4.5, 'purple'], [-3.5, 3.5, 'white']]) put('flower11', c, x, 1, z);
  put('bench13', 'brown', 0.5, 1, -1.5, 6);
  put('lamp11', 'dark_grey', -1.5, 1, -1.5);
  put('trash11', 'dark_green', 2.5, 1, -1.5);
  put('rock22', 'light_grey', -6, 1, 6);
  for (const [x, z] of [[3.5, 3.5], [7.5, 7.5], [-3.5, 6.5], [-0.5, 6.5]]) put('grass11', 'lime', x, 1, z);
  put('t22_round', 'trans_blue', 2, 1, 3); put('t22_round', 'trans_blue', 2, 1, 5); put('t22_round', 'trans_blue', 0, 1, 4);
  return list;
}

function tower() {
  const { list, put, wall } = kit();
  put('p66', 'green', 0, 0, 0);
  const S = 'light_grey';
  for (let c = 0; c < 5; c++) {
    const y = 1 + c * 3;
    if (c >= 2) wall('x', 1.5, -1.5, 1.5, y, S, [], c);
    wall('x', -1.5, -1.5, 1.5, y, S, [], c + 1);
    const sideSkip = (c === 2 || c === 3) ? [-0.5, 0.5] : [];
    wall('z', -1.5, -0.5, 0.5, y, S, sideSkip, c);
    wall('z', 1.5, -0.5, 0.5, y, S, sideSkip, c);
  }
  put('arch14', 'dark_grey', 0, 1, 1.5, 2);
  put('slit12', S, -1.5, 7, 0); put('slit12', S, 1.5, 7, 0);
  for (const x of [-1, 1]) { put('crenel12', 'dark_grey', x, 16, 1.5, 2); put('crenel12', 'dark_grey', x, 16, -1.5, 2); }
  put('crenel12', 'dark_grey', -1.5, 16, 0); put('crenel12', 'dark_grey', 1.5, 16, 0);
  put('p22', 'brown', 0, 16, 0);
  put('flag11', 'red', 0.5, 17, -0.5);
  put('torch11', 'brown', -2.5, 1, 2.5); put('torch11', 'brown', 2.5, 1, 2.5);
  return list;
}

function glider() {
  const { list, put } = kit();
  put('p26', 'white', 0, 0, 0);
  put('wing_l', 'light_grey', -2.5, 0, 0); put('wing_r', 'light_grey', 2.5, 0, 0);
  put('b26', 'white', 0, 1, 0);
  put('b22', 'white', 0, 4, -2);
  put('dome22', 'trans_blue', 0, 4, 0);
  put('sl22', 'blue', 0, 4, 2);
  put('thruster11', 'dark_grey', -1.5, 1, -1.5); put('thruster11', 'dark_grey', 1.5, 1, -1.5);
  put('antenna11', 'light_grey', 0.5, 7, -2.5);
  put('t11', 'neon_cyan', -0.5, 7, -2.5);
  return list;
}

function lighthouse() {
  const { list, put } = kit();
  put('p88', 'tan', 0, 0, 0);
  put('p44', 'light_grey', 0, 1, 0);
  for (let i = 0; i < 8; i++) put('r22', i % 2 ? 'white' : 'red', 0, 2 + i * 3, 0);
  put('p44', 'dark_grey', 0, 26, 0);
  put('r22', 'trans_yellow', 0, 27, 0);
  put('dome22', 'red', 0, 30, 0);
  put('rock22', 'dark_grey', -3, 1, 3); put('rock22', 'light_grey', 3, 1, -3);
  put('grass11', 'lime', 2.5, 1, 2.5); put('grass11', 'green', -2.5, 1, -2.5);
  return list;
}

export const TEMPLATES = [
  { id: 'house', name: 'Haus mit Garten', build: house },
  { id: 'car', name: 'Sportwagen', build: car },
  { id: 'park', name: 'Stadtpark', build: park },
  { id: 'tower', name: 'Burgturm', build: tower },
  { id: 'glider', name: 'Raumgleiter', build: glider },
  { id: 'lighthouse', name: 'Leuchtturm', build: lighthouse },
];
