// INKFALL tuning: palette, movement, detection, alarm stages, floor table and gear pool.
export const VIEW = { width: 1024, height: 576 };
export const FIELD = { x: 8, y: 60, w: 780, h: 450, cols: 26, rows: 15, tile: 30 };
export const STEP = 1 / 60;

export const PALETTE = {
  ink: '#0a1020',
  ink2: '#111a2e',
  ink3: '#18233a',
  paper: '#efe3c8',
  paperDim: '#cbbf9f',
  red: '#c94f3d',
  redDark: '#7f2f28',
  amber: '#f2a33c',
  amberDim: '#9a6727',
  teal: '#59d6c7',
  tealDark: '#2c7a72',
  steel: '#5b6b7f',
  steelDark: '#2d394b',
  shadow: '#050912',
  gold: '#e7b64a',
  green: '#69d69a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
export const MONO = 'Consolas, "Liberation Mono", "Courier New", monospace';

export const PLAYER = {
  radius: 9,
  sneak: 55,
  softSoles: 78,
  walk: 95,
  sprint: 155,
  noiseWalk: 45,
  noiseSprint: 110,
  walkStep: 0.46,
  sprintStep: 0.3,
  catchFreeze: 1.25,
  inkCount: 2,
  decoyCount: 2,
  passCount: 3,
};

export const GUARD = {
  radius: 9,
  patrol: 38,
  search: 58,
  chase: 112,
  range: 165,
  half: (58 * Math.PI) / 360,
  pause: 0.9,
  turn: 4.2,
};

export const DETECT = {
  near: 0.42,
  far: 0.78,
  decay: 0.24,
  suspicious: 0.55,
  chase: 1,
  lowCover: 38,
  hiddenNear: 0.15,
};

export const ALARM = {
  stages: ['CALM', 'WARY', 'HUNTED', 'ALARM'],
  cuts: [0.2, 0.45, 0.7],
  rise: 0.1,
  riseChase: 0.055,
  decay: 0.065,
  hold: 8,
  segments: 10,
};

export const FLOOR_META = [
  {
    number: 1,
    name: 'THE PRESS HALL',
    objective: 'Steal the press key, then reach the archive door.',
    exit: 'ARCHIVE DOOR',
    sign: 'NIGHT SHIFT: NO RUNNING',
    rule: 'Learn the lantern cones. Cover is your friend.',
  },
  {
    number: 2,
    name: 'THE PAPER ARCHIVE',
    objective: "Take the editor's ledger, then reach the stair door.",
    exit: 'STAIR DOOR',
    sign: 'SILENCE IS GOLDEN. THE LEDGER IS NOT.',
    rule: 'Low cover hides a crouched Wren. Wardrobes hide anyone.',
  },
  {
    number: 3,
    name: "THE EDITOR'S OFFICE",
    objective: 'Lift the master plate, then run for the loading dock.',
    exit: 'LOADING DOCK',
    sign: 'THE CITY SLEEPS. THE PRESS DOES NOT.',
    rule: 'The plate is lit and loud. Break sight, then run.',
  },
];

export const UPGRADES = [
  { id: 'softSoles', name: 'SOFT SOLES', icon: 'soles', line: 'Sneak is faster and still silent.' },
  { id: 'extraInk', name: 'EXTRA INK', icon: 'ink', line: 'One more ink bomb on every floor.' },
  { id: 'sparePass', name: 'SPARE PASS', icon: 'pass', line: 'One more press pass for the run.' },
  { id: 'quietHinges', name: 'QUIET HINGES', icon: 'hinge', line: 'Hiding spots are quick and silent.' },
  { id: 'widerLens', name: 'WIDER LENS', icon: 'lens', line: 'The alarm cools twice as fast.' },
  { id: 'paperTrail', name: 'PAPER TRAIL', icon: 'paper', line: 'The decoy winds longer and calls twice.' },
];
