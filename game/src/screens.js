// Title, Night Desk gear choice, pause, floor card, caught card and the two result editions.
import { FLOOR_META, MONO, PALETTE, UPGRADES } from './config.js';
import { rr, txt, wrap, spaced, card, rgba, circle } from './draw.js';

export const TITLE_BUTTON = { x: 362, y: 390, w: 300, h: 46 };
export const RESULT_BUTTON = { x: 196, y: 404, w: 280, h: 46 };
export const DESK_CARDS = [
  { x: 152, y: 160, w: 224, h: 300 },
  { x: 400, y: 160, w: 224, h: 300 },
  { x: 648, y: 160, w: 224, h: 300 },
];

let ctx;

function dim(alpha) {
  ctx.fillStyle = `rgba(4,7,14,${alpha})`;
  ctx.fillRect(0, 0, 1024, 576);
}

function paperCard(x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  rr(ctx, x + 5, y + 7, w, h, 7);
  ctx.fill();
  card(ctx, x, y, w, h, PALETTE.paper, 'rgba(10,16,32,0.45)', 7);
  ctx.fillStyle = PALETTE.red;
  ctx.fillRect(x + 16, y, w - 32, 6);
}

function rail(x, y, w, items) {
  const gap = 14;
  const bw = (w - gap * (items.length - 1)) / items.length;
  for (let i = 0; i < items.length; i += 1) {
    const bx = x + i * (bw + gap);
    rr(ctx, bx, y, bw, 28, 3);
    ctx.fillStyle = items[i].on ? 'rgba(10,16,32,0.1)' : 'rgba(10,16,32,0.04)';
    ctx.fill();
    ctx.strokeStyle = items[i].on ? PALETTE.red : 'rgba(10,16,32,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
    txt(ctx, `${i + 1}`, bx + 8, y + 18, 11, items[i].on ? PALETTE.red : '#7a6a50', 'left', '800');
    txt(ctx, items[i].name, bx + 22, y + 18, 10, items[i].on ? '#232323' : '#7a6a50', 'left', '700');
    txt(ctx, items[i].status, bx + bw - 7, y + 18, 9, items[i].on ? '#20745d' : '#8b7a5d', 'right', '700');
  }
}

export function drawTitle(state) {
  ctx = state.ctx;
  dim(0.58);
  const x = 162;
  const y = 34;
  const w = 700;
  const h = 508;
  paperCard(x, y, w, h);
  txt(ctx, 'CALLOWAY PRESS · NIGHT DESK · 2:00 A.M.', 512, 64, 11, PALETTE.red, 'center', '700');
  spaced(ctx, 'INKFALL', 512, 134, 74, PALETTE.ink, 4, 'center', '800');
  txt(ctx, 'A silent heist in the midnight press', 512, 164, 20, '#3a342c', 'center', '500');
  ctx.fillStyle = 'rgba(10,16,32,0.2)';
  ctx.fillRect(232, 178, 560, 1);
  wrap(ctx, 'Wren, a night compositor, has one shift to lift the press key, the editor\'s ledger and the master plate from the Calloway Press. The night crew carries lanterns. The presses roll at dawn.', 222, 204, 580, 15, 20, '#332f29', '400');
  spaced(ctx, 'CONTROLS', 222, 286, 10, PALETTE.red, 1.4, 'left', '700');
  const controls = [
    ['WASD', 'move'], ['MOUSE', 'aim throw'], ['SHIFT', 'sneak'], ['SPACE', 'sprint'],
    ['E', 'interact'], ['Q', 'ink bomb'], ['F', 'wind-up decoy'], ['ESC', 'pause'],
  ];
  for (let i = 0; i < controls.length; i += 1) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 222 + col * 290;
    const cy = 310 + row * 20;
    txt(ctx, controls[i][0], cx, cy, 13, PALETTE.ink, 'left', '800', MONO);
    txt(ctx, controls[i][1], cx + 74, cy, 13, '#4b4439', 'left', '400');
  }
  const b = TITLE_BUTTON;
  rr(ctx, b.x, b.y, b.w, b.h, 4);
  ctx.fillStyle = PALETTE.red;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  txt(ctx, 'CLICK TO CLOCK IN', 512, 420, 21, PALETTE.paper, 'center', '800');
  spaced(ctx, "THE NIGHT'S RUN", 196, 458, 9, '#6b5d47', 1.4, 'left', '700');
  rail(196, 466, 628, FLOOR_META.map((f, i) => ({ name: f.name, status: i === 0 ? 'START' : 'LOCKED', on: i === 0 })));
  txt(ctx, 'THREE FLOORS · THREE PASSES · ONE EDITION', 512, 520, 9, '#7a6a50', 'center', '700');
}

function upgradeIcon(id, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = PALETTE.ink;
  ctx.fillStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  if (id === 'soles') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.4);
    ctx.lineTo(s * 0.1, -s * 0.4);
    ctx.lineTo(s * 0.12, s * 0.18);
    ctx.lineTo(s * 0.38, s * 0.28);
    ctx.lineTo(s * 0.38, s * 0.42);
    ctx.lineTo(-s * 0.32, s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, s * 0.34);
    ctx.lineTo(s * 0.34, s * 0.34);
    ctx.stroke();
  } else if (id === 'ink') {
    ctx.fillRect(-s * 0.24, -s * 0.15, s * 0.48, s * 0.55);
    ctx.fillRect(-s * 0.1, -s * 0.42, s * 0.2, s * 0.3);
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(-s * 0.3, -s * 0.2, s * 0.6, s * 0.12);
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(0, s * 0.12, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'pass') {
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(-s * 0.42, -s * 0.28, s * 0.84, s * 0.56);
    ctx.strokeStyle = PALETTE.ink;
    ctx.strokeRect(-s * 0.42, -s * 0.28, s * 0.84, s * 0.56);
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(-s * 0.34, -s * 0.2, s * 0.16, s * 0.4);
    txt(ctx, 'P', s * 0.12, s * 0.14, 22, PALETTE.ink, 'center', '800', MONO);
  } else if (id === 'hinge') {
    ctx.fillRect(-s * 0.4, -s * 0.32, s * 0.3, s * 0.64);
    ctx.fillRect(s * 0.1, -s * 0.32, s * 0.3, s * 0.64);
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'lens') {
    ctx.strokeStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(-s * 0.08, -s * 0.08, s * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.14, s * 0.14);
    ctx.lineTo(s * 0.4, s * 0.4);
    ctx.stroke();
    ctx.fillStyle = rgba(PALETTE.teal, 0.5);
    ctx.beginPath();
    ctx.arc(-s * 0.08, -s * 0.08, s * 0.17, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(-s * 0.3, -s * 0.4, s * 0.6, s * 0.8);
    ctx.strokeStyle = PALETTE.ink;
    ctx.strokeRect(-s * 0.3, -s * 0.4, s * 0.6, s * 0.8);
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = i === 0 ? PALETTE.red : PALETTE.ink;
      ctx.fillRect(-s * 0.2, -s * 0.24 + i * s * 0.13, s * 0.4, 1.6);
    }
  }
  ctx.restore();
}

export function drawDesk(state) {
  ctx = state.ctx;
  dim(0.72);
  paperCard(72, 28, 880, 520);
  txt(ctx, 'THE NIGHT DESK', 512, 78, 36, PALETTE.ink, 'center', '800');
  txt(ctx, 'CHOOSE ONE PIECE OF KIT BEFORE THE NEXT FLOOR', 512, 101, 12, PALETTE.red, 'center', '700');
  rail(150, 116, 724, FLOOR_META.map((f, i) => ({
    name: f.name,
    status: state.campaign[i] ? 'CLEARED' : i === state.floorIndex + 1 ? 'NEXT' : 'LOCKED',
    on: state.campaign[i] || i === state.floorIndex + 1,
  })));
  for (let i = 0; i < 3; i += 1) {
    const up = UPGRADES[state.deskChoices[i]];
    if (!up) continue;
    const r = DESK_CARDS[i];
    const chosen = state.hoverCard === i;
    rr(ctx, r.x, r.y, r.w, r.h, 5);
    ctx.fillStyle = chosen ? '#fff3d8' : '#f5ead2';
    ctx.fill();
    ctx.strokeStyle = chosen ? PALETTE.red : 'rgba(10,16,32,0.25)';
    ctx.lineWidth = chosen ? 3 : 1;
    ctx.stroke();
    if (chosen) {
      rr(ctx, r.x + r.w / 2 - 36, r.y - 9, 72, 18, 3);
      ctx.fillStyle = PALETTE.red;
      ctx.fill();
      txt(ctx, 'SELECTED', r.x + r.w / 2, r.y + 4, 9, PALETTE.paper, 'center', '800');
    }
    upgradeIcon(up.icon, r.x + r.w / 2, r.y + 64, 52);
    txt(ctx, up.name, r.x + r.w / 2, r.y + 132, 22, PALETTE.ink, 'center', '800');
    wrap(ctx, up.line, r.x + 22, r.y + 162, r.w - 44, 14, 18, '#4b4439', '400');
    ctx.fillStyle = 'rgba(10,16,32,0.15)';
    ctx.fillRect(r.x + 22, r.y + 246, r.w - 44, 1);
    txt(ctx, `PRESS ${i + 1}`, r.x + r.w / 2, r.y + 274, 11, PALETTE.red, 'center', '800', MONO);
  }
  txt(ctx, '1   2   3   ·   CLICK A CARD   ·   THE KIT APPLIES AT ONCE', 512, 496, 12, '#5a4e3d', 'center', '700');
  txt(ctx, 'EVERY FLOOR IS ONE MORE PRESS RUN', 512, 520, 9, '#8b7a5d', 'center', '600');
}

export function drawPause(state) {
  ctx = state.ctx;
  dim(0.7);
  paperCard(282, 178, 460, 220);
  txt(ctx, 'PAUSED', 512, 250, 42, PALETTE.ink, 'center', '800');
  txt(ctx, 'ESC  RESUME', 512, 300, 16, PALETTE.red, 'center', '800', MONO);
  txt(ctx, 'R  RESTART THE NIGHT', 512, 330, 14, '#4b4439', 'center', '700', MONO);
  txt(ctx, 'The lanterns will wait.', 512, 366, 12, '#7a6a50', 'center', '500');
}

export function drawFloorCard(state) {
  ctx = state.ctx;
  const a = Math.max(0, Math.min(1, state.intro / 0.8));
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(4,7,14,0.45)';
  ctx.fillRect(0, 0, 1024, 576);
  paperCard(78, 164, 700, 236);
  const meta = state.floor.meta;
  txt(ctx, `FLOOR ${meta.number}`, 512, 202, 13, PALETTE.red, 'center', '800');
  txt(ctx, meta.name, 512, 244, 33, PALETTE.ink, 'center', '800');
  txt(ctx, meta.objective, 512, 278, 16, '#332f29', 'center', '600');
  ctx.fillStyle = 'rgba(10,16,32,0.18)';
  ctx.fillRect(160, 294, 704, 1);
  txt(ctx, meta.rule, 512, 320, 14, '#4b4439', 'center', '500');
  txt(ctx, 'WIN: take the objective and reach the green exit.   LOSE: three catches.', 512, 350, 12, '#5a4e3d', 'center', '700');
  txt(ctx, 'The card fades. Move when you are ready.', 512, 378, 11, '#8b7a5d', 'center', '500');
  ctx.globalAlpha = 1;
}

export function drawCaught(state) {
  ctx = state.ctx;
  dim(0.42);
  paperCard(302, 196, 420, 176);
  ctx.fillStyle = PALETTE.red;
  ctx.fillRect(302, 196, 420, 8);
  txt(ctx, 'CAUGHT', 512, 264, 62, PALETTE.ink, 'center', '800');
  txt(ctx, 'A PRESS PASS IS TORN', 512, 300, 17, PALETTE.red, 'center', '800');
  txt(ctx, `${Math.max(0, state.passes)} PASS${state.passes === 1 ? '' : 'ES'} LEFT · BACK TO THE ENTRANCE`, 512, 334, 12, '#4b4439', 'center', '700');
}

export function drawResults(state) {
  ctx = state.ctx;
  const win = state.mode === 'win';
  const result = state.result;
  dim(0.58);
  // A left-hand front page: the loading dock, its green exit and a lantern cone stay visible on the right.
  paperCard(36, 30, 600, 516);
  txt(ctx, 'INKFALL · NIGHT EDITION', 336, 58, 10, PALETTE.red, 'center', '700');
  if (win) {
    txt(ctx, 'THE MORNING EDITION', 336, 102, 42, PALETTE.ink, 'center', '800');
    txt(ctx, 'IS YOURS', 336, 146, 42, PALETTE.ink, 'center', '800');
    circle(ctx, 124, 238, 48, PALETTE.red);
    txt(ctx, result.rank, 124, 260, 56, PALETTE.paper, 'center', '800');
    txt(ctx, 'RANK', 124, 306, 11, '#5a4e3d', 'center', '700');
    txt(ctx, 'GHOST BONUS', 124, 336, 10, '#7a6a50', 'center', '700');
    txt(ctx, `${result.ghost} / 3 FLOORS`, 124, 354, 12, '#20745d', 'center', '800');
  } else {
    txt(ctx, 'THE PRESSES ROLL', 336, 102, 42, PALETTE.ink, 'center', '800');
    txt(ctx, 'WITHOUT YOU', 336, 146, 42, PALETTE.ink, 'center', '800');
    txt(ctx, state.cause, 336, 182, 17, PALETTE.red, 'center', '800');
    txt(ctx, `FLOOR REACHED · ${state.floor.meta.number} ${state.floor.meta.name}`, 336, 204, 11, '#4b4439', 'center', '700');
    circle(ctx, 124, 238, 42, PALETTE.redDark);
    txt(ctx, result.rank, 124, 258, 48, PALETTE.paper, 'center', '800');
    txt(ctx, 'RANK', 124, 300, 10, '#5a4e3d', 'center', '700');
  }
  const rows = [
    ['TIME', result.time],
    ['LOOT', `${result.loot} / 12`],
    ['CATCHES', `${result.catches}`],
    ['ALARMS', `${result.alarms}`],
    ['GHOST BONUS', `${result.ghost} / 3`],
  ];
  const sx = 210;
  const start = win ? 196 : 226;
  for (let i = 0; i < rows.length; i += 1) {
    const ry = start + i * 30;
    txt(ctx, rows[i][0], sx, ry, 13, '#5a4e3d', 'left', '700');
    txt(ctx, rows[i][1], 620, ry, 16, PALETTE.ink, 'right', '800', MONO);
    ctx.fillStyle = 'rgba(10,16,32,0.12)';
    ctx.fillRect(sx, ry + 9, 620 - sx, 1);
  }
  txt(ctx, win ? 'PRESS R TO RUN IT AGAIN' : 'PRESS R TO TRY THE NIGHT AGAIN', 336, 382, 24, PALETTE.ink, 'center', '800');
  const b = RESULT_BUTTON;
  rr(ctx, b.x, b.y, b.w, b.h, 4);
  ctx.fillStyle = PALETTE.red;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  txt(ctx, 'RUN IT AGAIN', 336, b.y + 30, 18, PALETTE.paper, 'center', '800');
  txt(ctx, win ? 'The dock is quiet. The edition is yours.' : 'Three passes gone. The night keeps its secrets.', 336, 492, 10, '#6b5d47', 'center', '500');
  txt(ctx, 'INKFALL · A CALLOWAY PRESS HEIST', 336, 520, 9, '#8b7a5d', 'center', '700');
}
