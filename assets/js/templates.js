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
  put('axle42', 'dark_grey', 0, 0, -3); put('axle42', 'dark_grey', 0, 0, 3);
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

function knightsCastle() {
  const { list, put } = kit();
  const G = 'green', S = 'light_grey', D = 'dark_grey';
  for (const x of [-16, 16]) for (const z of [-16, 16]) put('p3232', G, x, 0, z);
  // Ecktürme rund
  for (const [x, z] of [[-10, -14], [10, -14], [-10, 2], [10, 2]]) {
    for (const y of [1, 10, 19]) put('tower_r44', S, x, y, z);
    put('roof44', 'blue', x, 28, z);
    put('flag11', 'red', x + 0.5, 31, z + 0.5);
  }
  // Rückmauer
  for (const x of [-6, -2, 2, 6]) { put('wall14h', S, x, 1, -13.5, 2); put('wall14', S, x, 13, -13.5, 2); }
  for (let x = -7; x <= 7; x += 2) put('crenel12', D, x, 19, -13.5, 2);
  // Seitenmauern
  for (const sx of [-9.5, 9.5]) {
    for (const z of [-10, -6, -2]) { put('wall14h', S, sx, 1, z); put('wall14', S, sx, 13, z); }
    for (let z = -11; z <= -1; z += 2) put('crenel12', D, sx, 19, z);
  }
  // Vordermauer mit Tor
  put('gate18', S, 0, 1, 1.5, 2);
  put('b14', S, -2, 16, 1.5, 2); put('b14', S, 2, 16, 1.5, 2);
  for (const x of [-6, 6]) { put('wall14h', S, x, 1, 1.5, 2); put('wall14', S, x, 13, 1.5, 2); }
  for (let x = -7; x <= 7; x += 2) put('crenel12', D, x, 19, 1.5, 2);
  put('banner12', 'blue', -3, 7, 2.5, 2); put('banner12', 'blue', 3, 7, 2.5, 2);
  // Bergfried
  for (const y of [1, 10, 19, 28]) put('tower_s44', S, 0, y, -8);
  put('roof44', 'dark_red', 0, 37, -8);
  put('flag11', 'yellow', 0.5, 40, -7.5);
  // Burghof
  put('well33', S, -4.5, 1, -3.5);
  put('fig_king', 'dark_red', 3.5, 1, -3.5);
  put('fig_lady', 'pink', 4.5, 1, -3.5);
  put('fig_knight', 'blue', 2.5, 1, -1.5); put('fig_knight', 'blue', 3.5, 1, -1.5);
  put('knight_horse', 'blue', 6, 1, -8);
  put('torch11', 'brown', -4.5, 1, 0.5); put('torch11', 'brown', 4.5, 1, 0.5);
  put('barrel11', 'brown', -7.5, 1, -11.5); put('barrel11', 'brown', -6.5, 1, -11.5); put('crate11', 'tan', -7.5, 4, -11.5);
  put('fig_guard', 'red', -2.5, 1, -1.5); put('fig_archer', 'dark_green', -3.5, 1, -0.5);
  // Graben und Zugbrücke
  for (const x of [-14, -10, -6]) put('p24', 'trans_blue', x, 1, 5, 2);
  for (const x of [6, 10, 14]) put('p24', 'trans_blue', x, 1, 5, 2);
  put('p22', 'trans_blue', -3, 1, 5); put('p22', 'trans_blue', 3, 1, 5);
  put('bridge46', 'brown', 0, 1, 5);
  // Weg ins Dorf
  for (let z = 10; z <= 30; z += 4) put('cobble44', S, 0, 1, z);
  // Drachenhort
  put('dragon68', 'dark_green', 20, 1, -18);
  put('fire14', 'orange', 19.5, 11, -12);
  put('rock44', D, 26, 1, -24); put('rock44', D, 25, 1, -12); put('rock22', D, 16, 1, -24);
  put('chest12', 'brown', 16.5, 1, -11); put('fig_wizard', 'purple', 13.5, 1, -17.5);
  put('fig_knight', 'red', 15.5, 1, -8.5);
  // Dorf
  put('tent44', 'blue', -20, 1, 14); put('tent44', 'red', -14, 1, 18);
  put('fire22', 'brown', -17, 1, 11);
  put('fig_archer', 'dark_green', -18.5, 1, 9.5); put('fig_villager', 'brown', -15.5, 1, 10.5);
  put('stall34', 'red', 12.5, 1, 14); put('stall34', 'blue', 17.5, 1, 14);
  put('fig_villager', 'tan', 12.5, 1, 17.5); put('fig_lady', 'purple', 17.5, 1, 17.5);
  put('cart24', 'brown', 22, 1, 20);
  put('hay22', 'yellow', 25, 1, 16); put('hay22', 'yellow', 25, 4, 16);
  put('barrel11', 'brown', 9.5, 1, 18.5); put('barrel11', 'brown', 10.5, 1, 18.5); put('crate11', 'tan', 9.5, 4, 18.5);
  put('horse24', 'brown', 6, 1, 24);
  for (const [x, z] of [[-6.5, 22], [-4.5, 25], [-8.5, 26]]) put('sheep12', 'white', x, 1, z);
  put('chicken11', 'white', 8.5, 1, 27.5); put('chicken11', 'white', 9.5, 1, 28.5); put('pig12', 'rose', 11.5, 1, 26);
  for (let z = 20; z <= 28; z += 4) put('fence14', 'brown', -10.5, 1, z);
  // Natur
  put('tree_oak', 'green', -24, 1, -20); put('tree_oak', 'dark_green', -26, 1, 0);
  put('tree_pine', 'dark_green', -20, 1, -26); put('tree_pine', 'dark_green', 28, 1, 4); put('tree_pine', 'dark_green', -29, 1, 24);
  put('tree_leaf', 'green', -16, 1, 26); put('tree_birch', 'lime', 27.5, 1, 28.5);
  put('bush22', 'green', -12, 1, -18); put('bush22', 'dark_green', 14, 1, 2);
  put('hill46', 'green', -24, 1, 27, 4); put('hill44', 'green', 26, 1, 8, 6);
  for (const [x, z] of [[-3.5, 12.5], [3.5, 16.5], [-2.5, 20.5], [2.5, 26.5]]) put('flower11', 'yellow', x, 1, z);
  put('mushroom11', 'red', -21.5, 1, -16.5); put('stump22', 'brown', -22, 1, -6);
  put('water44', 'trans_blue', 22, 1, -2); put('lily44', 'green', 26, 1, -2); put('reeds11', 'lime', 19.5, 1, -0.5);
  return list;
}

function dragonLair() {
  const { list, put } = kit();
  put('p1616', 'dark_grey', 0, 0, 0);
  put('rock44', 'dark_grey', -5, 1, -5); put('rock44', 'light_grey', 5, 1, -5); put('rock22', 'dark_grey', -6, 1, 1);
  put('dragon68', 'red', 0, 1, -2);
  put('fire14', 'orange', -0.5, 11, 4);
  put('chest12', 'brown', -3.5, 1, 3); put('crystal11', 'trans_blue', -4.5, 1, 4.5); put('crystal11', 'trans_ruby', 4.5, 1, 4.5);
  put('fig_knight', 'blue', 1.5, 1, 6.5); put('fig_wizard', 'purple', -1.5, 1, 6.5);
  put('brazier11', 'dark_grey', -6.5, 1, 6.5); put('brazier11', 'dark_grey', 6.5, 1, 6.5);
  put('mushroom11', 'red', 6.5, 1, 0.5);
  return list;
}

function moatedCastle() {
  const { list, put } = kit();
  const S = 'light_grey', D = 'dark_grey', W = 'trans_blue';
  for (const x of [-16, 0, 16]) for (const z of [-16, 0, 16]) put('p1616', 'green', x, 0, z);
  // Wassergraben rundum
  const C = [-14, -10, -6, -2, 2, 6, 10, 14];
  for (const x of C) put(x === 6 && false ? 'lily44' : 'water44', W, x, 1, -14);
  for (const x of C) if (x !== -2 && x !== 2) put('water44', W, x, 1, 14);
  put('p24', W, -3, 1, 14); put('p24', W, 3, 1, 14);
  for (const z of [-10, -6, -2, 2, 6, 10]) { put('water44', W, -14, 1, z); put(z === -2 ? 'lily44' : 'water44', z === -2 ? 'green' : W, 14, 1, z); }
  put('bridge46', 'brown', 0, 1, 15);
  // Ecktürme
  for (const sx of [-8, 8]) for (const sz of [-8, 8]) {
    put('tower_r44', S, sx, 1, sz); put('tower_r44', S, sx, 10, sz);
    put('roof44', 'dark_red', sx, 19, sz); put('flag11', 'yellow', sx + 0.5, 22, sz + 0.5);
  }
  // Mauern
  for (const x of [-4, 0, 4]) put('wall14h', S, x, 1, -8.5, 2);
  for (let x = -5; x <= 5; x += 2) put('crenel12', D, x, 13, -8.5, 2);
  for (const sx of [-8.5, 8.5]) {
    for (const z of [-4, 0, 4]) put('wall14h', S, sx, 1, z);
    for (let z = -5; z <= 5; z += 2) put('crenel12', D, sx, 13, z);
  }
  put('gate18', S, 0, 1, 8.5, 2);
  for (const x of [-5, 5]) { put('wall12', S, x, 1, 8.5, 2); put('wall12', S, x, 7, 8.5, 2); put('crenel12', D, x, 13, 8.5, 2); }
  for (const x of [-3, -1, 1, 3]) put('crenel12', D, x, 16, 8.5, 2);
  put('banner12', 'dark_red', -3, 7, 9.5, 2); put('banner12', 'dark_red', 3, 7, 9.5, 2);
  // Bergfried und Hof
  for (const y of [1, 10, 19]) put('tower_s44', S, 0, y, -3);
  put('roof44', 'dark_red', 0, 28, -3); put('flag11', 'yellow', 0.5, 31, -2.5);
  put('well33', S, -4.5, 1, 3.5);
  put('fig_knight', 'dark_red', 3.5, 1, 4.5); put('fig_knight', 'dark_red', 4.5, 1, 4.5);
  put('fig_guard', 'dark_red', -1.5, 1, 6.5); put('fig_guard', 'dark_red', 1.5, 1, 6.5);
  put('fig_king', 'purple', 2.5, 1, 1.5);
  // Umgebung
  for (let z = 20; z <= 20; z += 4) put('cobble44', S, 0, 1, z);
  put('knight_horse', 'dark_red', 6, 1, 21);
  put('tree_pine', 'dark_green', -20, 1, -20); put('tree_pine', 'dark_green', 20, 1, -20); put('tree_pine', 'dark_green', -20, 1, 20);
  put('tree_oak', 'green', 20, 1, 20); put('tree_leaf', 'green', -21, 1, 0); put('bush22', 'green', 21, 1, -6);
  put('reeds11', 'lime', -17.5, 1, -5.5); put('reeds11', 'lime', 17.5, 1, 7.5); put('reeds11', 'lime', -5.5, 1, -17.5);
  return list;
}

function fairyCastle() {
  const { list, put } = kit();
  const Wh = 'white', R = 'blue';
  for (const x of [-8, 8]) for (const z of [-8, 8]) put('p1616', 'lime', x, 0, z);
  // Festsaal
  put('door14c', Wh, 0, 1, 1.5, 2);
  put('lancet12', Wh, -3, 1, 1.5, 2); put('lancet12', Wh, 3, 1, 1.5, 2);
  put('wall12', Wh, -3, 10, 1.5, 2); put('wall12', Wh, 3, 10, 1.5, 2);
  put('wall14h', Wh, -2, 1, -5.5, 2); put('wall14h', Wh, 2, 1, -5.5, 2);
  put('b14', Wh, -2, 13, -5.5, 2); put('b14', Wh, 2, 13, -5.5, 2);
  for (const sx of [-3.5, 3.5]) { put('wall14h', Wh, sx, 1, -3); put('wall12', Wh, sx, 1, 0); put('wall12', Wh, sx, 7, 0); put('b14', Wh, sx, 13, -3); put('b12', Wh, sx, 13, 0); }
  // Dach
  for (const x of [-2, 2]) {
    put('sl42', R, x, 16, 1, 0); put('sl42', R, x, 16, -5, 4);
    put('b24', Wh, x, 16, -3, 2); put('b24', Wh, x, 16, -1, 2);
    put('sl42', R, x, 19, -1, 0); put('sl42', R, x, 19, -3, 4);
  }
  for (const x of [-3, -1, 1, 3]) put('ridge22', R, x, 22, -2);
  // Türme
  for (const sx of [-6, 6]) {
    for (const y of [1, 10, 19]) put('tower_r44', Wh, sx, y, 0);
    put('roof44', R, sx, 28, 0); put('flag11', 'pink', sx + 0.5, 31, 0.5);
    put('turret22', Wh, sx > 0 ? 7 : -7, 1, -5);
  }
  for (const y of [1, 10, 19, 28]) put('tower_s44', Wh, 0, y, -8);
  put('roof44', R, 0, 37, -8); put('flag11', 'pink', 0.5, 40, -7.5);
  // Garten
  for (const z of [6, 10, 14]) put('cobble44', 'tan', 0, 1, z);
  put('fig_king', 'blue', -1.5, 2, 5.5); put('fig_lady', 'pink', 1.5, 2, 5.5);
  put('well33', Wh, -9.5, 1, 6.5);
  put('horse24', 'white', 8, 1, 10);
  put('tree_leaf', 'rose', -12, 1, -12); put('tree_leaf', 'rose', 12, 1, -12); put('tree_birch', 'lime', -12.5, 1, 12.5);
  put('bush22', 'green', 12, 1, 4); put('bush22', 'green', -12, 1, 2);
  for (const [x, z, c] of [[-4.5, 4.5, 'pink'], [-5.5, 4.5, 'red'], [4.5, 4.5, 'yellow'], [5.5, 4.5, 'pink'], [-4.5, 8.5, 'lavender'], [4.5, 8.5, 'lavender']]) put('flower11', c, x, 1, z);
  for (const z of [5, 9]) { put('fence14o', 'white', -2.5, 1, z + 4 > 15 ? 13 : z + 4); put('fence14o', 'white', 2.5, 1, z + 4 > 15 ? 13 : z + 4); }
  return list;
}

function palisadeFort() {
  const { list, put } = kit();
  const B = 'brown';
  for (const x of [-8, 8]) for (const z of [-8, 8]) put('p1616', 'green', x, 0, z);
  for (const x of [-6, -2, 2, 6]) put('palisade14', B, x, 1, -8.5, 2);
  for (const x of [-6, 6]) put('palisade14', B, x, 1, 8.5, 2);
  for (const sx of [-8.5, 8.5]) for (const z of [-6, -2, 2, 6]) put('palisade14', B, sx, 1, z);
  for (const sx of [-8.5, 8.5]) for (const sz of [-8.5, 8.5]) put('barrel11', B, sx, 1, sz);
  put('door14c', B, 0, 1, 8.5, 2);
  put('b12x3', B, -3, 1, 8.5, 2); put('b12x3', B, 3, 1, 8.5, 2);
  put('torch11', B, -3.5, 10, 8.5); put('torch11', B, 3.5, 10, 8.5);
  // Holzturm
  put('tower_s44', B, 0, 1, -3); put('tower_s44', B, 0, 10, -3);
  put('roof44', 'dark_red', 0, 19, -3); put('flag11', 'red', 0.5, 22, -2.5);
  // Lager
  put('tent44', 'red', -5, 1, 3); put('tent44', 'tan', 5, 1, 3);
  put('fire22', B, 0, 1, 4);
  put('fig_guard', 'red', -1.5, 1, 6.5); put('fig_guard', 'red', 1.5, 1, 6.5);
  put('fig_archer', 'dark_green', -6.5, 1, -6.5); put('fig_villager', 'brown', 4.5, 1, -6.5);
  put('hay22', 'yellow', 6, 1, -7); put('rack13', 'red', -6.5, 1, -1.5);
  put('cart24', B, 6, 1, -2);
  // Umgebung
  put('cobble44', 'tan', 0, 1, 12);
  put('catapult34', B, 13.5, 1, 0);
  put('knight_horse', 'red', -12, 1, 10);
  put('tree_pine', 'dark_green', -13, 1, -13); put('tree_pine', 'dark_green', 13, 1, -13); put('tree_oak', 'green', 12, 1, 12);
  put('rock22', 'dark_grey', -13, 1, 0); put('stump22', 'brown', -13, 1, 4);
  return list;
}

export const TEMPLATES = [
  { id: 'castle', name: 'Ritterburg mit Dorf', build: knightsCastle, plate: 64 },
  { id: 'moat', name: 'Wasserburg', build: moatedCastle, plate: 48 },
  { id: 'fairy', name: 'Märchenschloss', build: fairyCastle },
  { id: 'fort', name: 'Palisadenfort', build: palisadeFort },
  { id: 'lair', name: 'Drachenhort', build: dragonLair },
  { id: 'house', name: 'Haus mit Garten', build: house },
  { id: 'car', name: 'Sportwagen', build: car },
  { id: 'park', name: 'Stadtpark', build: park },
  { id: 'tower', name: 'Burgturm', build: tower },
  { id: 'glider', name: 'Raumgleiter', build: glider },
  { id: 'lighthouse', name: 'Leuchtturm', build: lighthouse },
];
