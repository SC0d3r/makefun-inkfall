// The three Calloway Press floors: tile maps, furniture, lamps, patrols, objectives and exits.
import { FIELD, FLOOR_META } from './config.js';

const T = FIELD.tile;
const BLOCK = new Set(['#', 'T', 'S', 'P', 'C', 'V', 'h']);
const LOW = new Set(['L', 'D', 'R', 'B']);

const FLOORS = [
  {
    map: [
      '##########################',
      '#........................#',
      '#..TTT.....L......TTT....#',
      '#..TTT............TTT....#',
      '#........................#',
      '#....L.......L...........#',
      '#........................#',
      '#..TTT...........TTT.....#',
      '#..TTT...........TTT.....#',
      '#.........L..............#',
      '#.....L.......L..........#',
      '#........................#',
      '#..TT.......h.....TT.....#',
      '#........................#',
      '##########################',
    ],
    spawn: { x: 58, y: 402 },
    exit: { x: 660, y: 30, w: 60, h: 30 },
    item: { id: 'key', x: 405, y: 166, label: 'PRESS KEY' },
    loot: [[92, 92], [700, 420], [300, 240], [480, 92]],
    guards: [
      { name: 'Marlow', route: [[465, 285], [495, 105], [675, 285], [525, 375]], pause: 0.8 },
      { name: 'Finch', route: [[105, 195], [225, 105], [75, 345], [225, 375]], pause: 1.1 },
      { name: 'Sable', route: [[405, 375], [525, 345], [285, 285], [195, 225]], pause: 0.9 },
    ],
    lamps: [[180, 120, 100], [600, 170, 115], [390, 300, 85], [690, 410, 85], [140, 390, 95]],
    shadows: [[240, 60, 110, 70], [450, 330, 140, 80], [60, 200, 100, 100], [700, 60, 80, 60]],
    sign: { x: 168, y: 64, text: 'NIGHT SHIFT: NO RUNNING' },
    fuse: null,
    camera: null,
  },
  {
    map: [
      '##########################',
      '#....SSSSSS....SSSSSS....#',
      '#....S....S....S....S....#',
      '#....S....S....S....S....#',
      '#........................#',
      '#..DDD.......h.......DDD.#',
      '#........................#',
      '#..SSSSSS......SSSSSS....#',
      '#..S....S......S....S....#',
      '#..S....S......S....S....#',
      '#........................#',
      '#....DDD.......DDD.......#',
      '#........................#',
      '#..h.....................#',
      '##########################',
    ],
    spawn: { x: 58, y: 402 },
    exit: { x: 660, y: 30, w: 60, h: 30 },
    item: { id: 'ledger', x: 450, y: 346, label: "EDITOR'S LEDGER" },
    loot: [[92, 92], [720, 92], [92, 420], [720, 420]],
    guards: [
      { name: 'Marlow', route: [[75, 105], [345, 105], [315, 225], [75, 225]], pause: 0.7 },
      { name: 'Crowe', route: [[585, 105], [675, 285], [435, 285]], pause: 0.9 },
      { name: 'Pell', route: [[165, 375], [585, 375], [585, 165]], pause: 0.8 },
      { name: 'Vane', route: [[675, 105], [675, 375], [435, 255]], pause: 1.0 },
    ],
    lamps: [[150, 120, 100], [630, 120, 100], [405, 300, 95], [120, 390, 85], [690, 390, 85]],
    shadows: [[240, 60, 120, 70], [450, 330, 150, 80], [60, 180, 100, 90]],
    sign: { x: 150, y: 64, text: 'SILENCE IS GOLDEN. THE LEDGER IS NOT.' },
    fuse: { x: 32, y: 315 },
    camera: { x: 330, y: 55, base: Math.PI / 2, sweep: 0.62, speed: 0.85, range: 152, half: 0.2 },
  },
  {
    map: [
      '##########################',
      '#........................#',
      '#..LLLLL.....VVVV........#',
      '#..L...L.....VVVV........#',
      '#..L...L.................#',
      '#..LLLLL........h........#',
      '#........................#',
      '#....TTT........LLLLL....#',
      '#....TTT........L...L....#',
      '#................L...L...#',
      '#................LLLLL...#',
      '#........................#',
      '#..TTT......TTT..........#',
      '#........................#',
      '##########################',
    ],
    spawn: { x: 58, y: 402 },
    exit: { x: 660, y: 390, w: 60, h: 30 },
    item: { id: 'plate', x: 450, y: 138, label: 'MASTER PLATE' },
    loot: [[92, 92], [720, 92], [92, 420], [720, 330]],
    guards: [
      { name: 'Sable', route: [[165, 105], [285, 105], [285, 285], [165, 285]], pause: 0.7 },
      { name: 'Rook', route: [[585, 165], [675, 315], [465, 315]], pause: 0.8 },
      { name: 'Hale', route: [[225, 375], [465, 375], [465, 225]], pause: 0.9 },
      { name: 'Crowe', route: [[675, 75], [675, 285], [555, 255]], pause: 0.7 },
      { name: 'Vane', route: [[285, 285], [555, 315], [555, 375], [285, 375]], pause: 0.8 },
    ],
    lamps: [[120, 120, 95], [450, 140, 92], [405, 300, 100], [690, 390, 100], [180, 390, 85]],
    shadows: [[240, 60, 120, 70], [600, 330, 120, 60], [60, 240, 100, 90]],
    sign: { x: 150, y: 64, text: 'THE CITY SLEEPS. THE PRESS DOES NOT.' },
    fuse: { x: 32, y: 195 },
    camera: { x: 300, y: 55, base: Math.PI / 2, sweep: 0.7, speed: 0.9, range: 145, half: 0.2 },
  },
];

function makeCover(c, r, kind) {
  return { x: c * T, y: r * T, w: T, h: T, kind, cx: c * T + T / 2, cy: r * T + T / 2 };
}

export function buildFloor(index) {
  const def = FLOORS[index];
  const meta = FLOOR_META[index];
  const grid = def.map.map((row) => row.split(''));
  const walls = [];
  const talls = [];
  const lows = [];
  const hidingSpots = [];
  for (let r = 0; r < FIELD.rows; r += 1) {
    for (let c = 0; c < FIELD.cols; c += 1) {
      const kind = grid[r][c];
      const tile = makeCover(c, r, kind);
      if (kind === '#') walls.push(tile);
      else if (BLOCK.has(kind)) talls.push(tile);
      else if (LOW.has(kind)) lows.push(tile);
      if (kind === 'h') hidingSpots.push({ x: tile.x + 3, y: tile.y + 3, w: T - 6, h: T - 6, cx: tile.cx, cy: tile.cy });
    }
  }
  const cameras = (def.camera === null ? [] : [].concat(def.camera)).map((cam, i) => ({
    ...cam,
    id: i,
    angle: cam.base,
    disabled: false,
    seen: 0,
    ping: 0,
  }));
  return {
    index,
    def,
    meta,
    grid,
    walls,
    talls,
    lows,
    hidingSpots,
    lamps: def.lamps.map(([x, y, r]) => ({ x, y, r })),
    shadows: def.shadows.map(([x, y, w, h]) => ({ x, y, w, h })),
    spawn: { ...def.spawn },
    exit: { ...def.exit, name: meta.exit, open: false },
    item: { ...def.item, active: true },
    loot: def.loot.map(([x, y], i) => ({ x, y, id: i, active: true })),
    guardDefs: def.guards,
    cameras,
    fuse: def.fuse === null ? null : { ...def.fuse, cut: false },
    sign: { ...def.sign },
  };
}

export function tileAt(floor, x, y) {
  const c = Math.floor(x / T);
  const r = Math.floor(y / T);
  if (c < 0 || r < 0 || c >= FIELD.cols || r >= FIELD.rows) return '#';
  return floor.grid[r][c];
}

export function blockingPoint(floor, x, y, clouds = null) {
  if (BLOCK.has(tileAt(floor, x, y))) return true;
  if (clouds) {
    for (let i = 0; i < clouds.length; i += 1) {
      const cloud = clouds[i];
      if (!cloud.active) continue;
      const dx = x - cloud.x;
      const dy = y - cloud.y;
      if (dx * dx + dy * dy < cloud.r * cloud.r) return true;
    }
  }
  return false;
}

export function blockedCircle(floor, x, y, radius) {
  const minC = Math.floor((x - radius) / T);
  const maxC = Math.floor((x + radius) / T);
  const minR = Math.floor((y - radius) / T);
  const maxR = Math.floor((y + radius) / T);
  for (let r = minR; r <= maxR; r += 1) {
    for (let c = minC; c <= maxC; c += 1) {
      if (c < 0 || r < 0 || c >= FIELD.cols || r >= FIELD.rows) return true;
      if (!BLOCK.has(floor.grid[r][c])) continue;
      const nx = Math.max(c * T, Math.min(x, c * T + T));
      const ny = Math.max(r * T, Math.min(y, r * T + T));
      const dx = x - nx;
      const dy = y - ny;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
  }
  return false;
}

export function lineBlocked(floor, x1, y1, x2, y2, clouds = null) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(2, Math.ceil(dist / 4));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (blockingPoint(floor, x1 + dx * t, y1 + dy * t, clouds)) return true;
  }
  return false;
}

export function nearLowCover(floor, x, y) {
  let best = Infinity;
  for (let i = 0; i < floor.lows.length; i += 1) {
    const c = floor.lows[i];
    const nx = Math.max(c.x, Math.min(x, c.x + c.w));
    const ny = Math.max(c.y, Math.min(y, c.y + c.h));
    const d = Math.hypot(x - nx, y - ny);
    if (d < best) best = d;
  }
  return best;
}

export function inShadow(floor, x, y) {
  for (let i = 0; i < floor.shadows.length; i += 1) {
    const s = floor.shadows[i];
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}

export function inLamp(floor, x, y) {
  for (let i = 0; i < floor.lamps.length; i += 1) {
    const l = floor.lamps[i];
    const dx = x - l.x;
    const dy = y - l.y;
    if (dx * dx + dy * dy < l.r * l.r) return true;
  }
  return false;
}

export function pointInRect(x, y, rect, pad = 0) {
  return x >= rect.x - pad && x <= rect.x + rect.w + pad && y >= rect.y - pad && y <= rect.y + rect.h + pad;
}

export function nearestHiding(floor, x, y, radius = 32) {
  let best = null;
  let bestD = radius;
  for (let i = 0; i < floor.hidingSpots.length; i += 1) {
    const spot = floor.hidingSpots[i];
    const d = Math.hypot(x - spot.cx, y - spot.cy);
    if (d < bestD) {
      bestD = d;
      best = spot;
    }
  }
  return best;
}
