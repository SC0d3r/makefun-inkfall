// The paper-cream detection panel, top bar, segmented alarm, passes, checklist and rule strips.
import { ALARM, MONO, PALETTE } from './config.js';
import { font, rr, txt, wrap, spaced, rgba } from './draw.js';

const STAGE_COLOR = {
  CALM: PALETTE.teal,
  WARY: PALETTE.amber,
  HUNTED: '#e28743',
  ALARM: PALETTE.red,
};

function stageOf(alarm) {
  if (alarm >= ALARM.cuts[2]) return 'ALARM';
  if (alarm >= ALARM.cuts[1]) return 'HUNTED';
  if (alarm >= ALARM.cuts[0]) return 'WARY';
  return 'CALM';
}

function sentence(state) {
  if (state.caughtTimer > 0) return 'Caught. The pass is torn.';
  for (let i = 0; i < state.guards.length; i += 1) if (state.guards[i].state === 'chase') return 'A guard is chasing. Break line of sight!';
  if (state.cameraSeen) return 'A camera has you. Find its fuse.';
  if (state.alarmStage === 'ALARM') return 'The alarm is up. Break line of sight.';
  if (state.alarmStage === 'HUNTED') return 'They know you are here. Keep moving.';
  if (state.alarmStage === 'WARY') return 'A guard is searching. Stay out of the cone.';
  if (state.player.visibility === 'HIDDEN') return 'Out of sight. Let the lantern pass.';
  return 'Nothing has seen you. Keep to the dark.';
}

function timer(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function passPip(x, y, filled) {
  rr(ctx, x, y, 12, 16, 2);
  ctx.fillStyle = filled ? PALETTE.paper : 'rgba(239,227,200,0.18)';
  ctx.fill();
  ctx.strokeStyle = filled ? PALETTE.red : 'rgba(239,227,200,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  if (filled) {
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(x + 2, y + 4, 8, 2);
    ctx.fillRect(x + 2, y + 9, 8, 1);
  }
}

let ctx;

function topBar(state) {
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, 0, 1024, 56);
  ctx.fillStyle = PALETTE.red;
  ctx.fillRect(0, 54, 1024, 2);
  spaced(ctx, 'INKFALL', 16, 37, 26, PALETTE.paper, 2, 'left', '800');
  ctx.fillStyle = 'rgba(239,227,200,0.2)';
  ctx.fillRect(140, 12, 1, 32);
  txt(ctx, `FLOOR ${state.floor.meta.number} · ${state.floor.meta.name}`, 152, 22, 13, PALETTE.amber, 'left', '700');
  txt(ctx, state.floor.meta.objective, 152, 44, 16, PALETTE.paper, 'left', '400');
  txt(ctx, `SHIFT ${timer(state.time)}`, 1008, 38, 24, PALETTE.paper, 'right', '700', MONO);
}

function detectionPanel(state) {
  const x = 792;
  const y = 60;
  const w = 224;
  const h = 450;
  rr(ctx, x, y, w, h, 6);
  ctx.fillStyle = PALETTE.paper;
  ctx.fill();
  ctx.strokeStyle = 'rgba(10,16,32,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const ix = x + 14;
  const iw = w - 28;
  spaced(ctx, 'DETECTION', ix, 80, 11, '#5b4d39', 1.6, 'left', '700');
  const stage = state.alarmStage;
  const color = STAGE_COLOR[stage];
  rr(ctx, ix, 88, iw, 32, 4);
  ctx.fillStyle = color;
  ctx.fill();
  txt(ctx, stage, ix + 10, 111, 23, PALETTE.ink, 'left', '800');
  ctx.fillStyle = 'rgba(10,16,32,0.65)';
  ctx.beginPath();
  ctx.arc(ix + iw - 12, 104, 4, 0, Math.PI * 2);
  ctx.fill();
  wrap(ctx, sentence(state), ix, 140, iw, 16, 18, '#2a2a28', '400');

  spaced(ctx, 'ALARM', ix, 198, 10, '#5b4d39', 1.3, 'left', '700');
  const seg = 10;
  const gap = 2;
  const sw = (iw - gap * (seg - 1)) / seg;
  for (let i = 0; i < seg; i += 1) {
    const filled = i < Math.floor(state.alarm * seg + 0.001);
    rr(ctx, ix + i * (sw + gap), 204, sw, 9, 2);
    ctx.fillStyle = filled ? color : 'rgba(10,16,32,0.14)';
    ctx.fill();
  }
  const words = ALARM.stages;
  for (let i = 0; i < words.length; i += 1) {
    const wx = ix + i * (iw / 4) + iw / 8;
    txt(ctx, words[i], wx, 226, 9, stage === words[i] ? '#1a1a18' : 'rgba(42,42,40,0.45)', 'center', stage === words[i] ? '800' : '600');
  }

  ctx.fillStyle = 'rgba(10,16,32,0.16)';
  ctx.fillRect(ix, 236, iw, 1);

  spaced(ctx, 'VISIBILITY', ix, 254, 10, '#5b4d39', 1.2, 'left', '700');
  const vis = state.player.visibility;
  txt(ctx, vis, ix, 277, 20, vis === 'HIDDEN' ? '#20745d' : vis === 'EXPOSED' ? PALETTE.red : '#3d3b35', 'left', '800');
  for (let i = 0; i < 3; i += 1) {
    const on = vis === 'HIDDEN' ? i < 1 : vis === 'DIM' ? i < 2 : true;
    ctx.fillStyle = on ? (vis === 'HIDDEN' ? PALETTE.tealDark : vis === 'EXPOSED' ? PALETTE.red : PALETTE.steel) : 'rgba(10,16,32,0.12)';
    ctx.fillRect(ix + 88 + i * 36, 266, 31, 8);
  }

  spaced(ctx, 'NOISE', ix, 300, 10, '#5b4d39', 1.2, 'left', '700');
  const noise = state.player.noise;
  txt(ctx, noise, ix, 323, 20, noise === 'SILENT' ? '#20745d' : noise === 'SOFT' ? '#8a5a18' : PALETTE.red, 'left', '800');
  for (let i = 0; i < 3; i += 1) {
    const on = noise === 'SILENT' ? i < 1 : noise === 'SOFT' ? i < 2 : true;
    ctx.fillStyle = on ? (noise === 'LOUD' ? PALETTE.red : noise === 'SOFT' ? PALETTE.amberDim : PALETTE.tealDark) : 'rgba(10,16,32,0.12)';
    ctx.fillRect(ix + 88 + i * 36, 312, 31, 8);
  }

  ctx.fillStyle = 'rgba(10,16,32,0.16)';
  ctx.fillRect(ix, 336, iw, 1);

  spaced(ctx, 'LOOT', ix, 354, 10, '#5b4d39', 1.2, 'left', '700');
  txt(ctx, `${state.floorLoot} / ${state.floor.loot.length}`, ix, 378, 21, '#1f2a3a', 'left', '800', MONO);
  spaced(ctx, 'PRESS PASSES', ix + 92, 354, 10, '#5b4d39', 1.1, 'left', '700');
  for (let i = 0; i < state.maxPasses; i += 1) passPip(ix + 94 + i * 17, 362, i < state.passes);
  txt(ctx, `CATCHES ${state.catches} / ${state.maxPasses}`, ix + 92, 386, 12, state.catches > 0 ? PALETTE.red : '#5b4d39', 'left', '700', MONO);

  spaced(ctx, 'OBJECTIVE', ix, 400, 10, '#5b4d39', 1.2, 'left', '700');
  const itemDone = !state.floor.item.active;
  txt(ctx, `${itemDone ? '✓' : '□'} ${state.floor.item.label}`, ix, 419, 13, itemDone ? '#20745d' : '#2a2a28', 'left', '700');
  txt(ctx, `${state.objectiveDone ? '✓' : '□'} ${state.floor.exit.name}`, ix, 438, 13, state.objectiveDone ? '#20745d' : '#2a2a28', 'left', '700');

  const owned = Object.keys(state.upgrades).filter((k) => state.upgrades[k]);
  txt(ctx, owned.length === 0 ? 'KIT · NONE YET' : `KIT · ${owned.length} UPGRADE${owned.length === 1 ? '' : 'S'}`, ix, 466, 10, '#6b5d47', 'left', '700');
  ctx.fillStyle = PALETTE.red;
  ctx.fillRect(ix, 474, 30, 2);
  txt(ctx, 'CALLOWAY PRESS · 2 A.M.', ix, 492, 8, 'rgba(42,42,40,0.5)', 'left', '600');
}

function bottomStrips(state) {
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, 512, 1024, 26);
  txt(ctx, 'WASD MOVE   SHIFT SNEAK   SPACE SPRINT   E INTERACT   Q INK   F DECOY   ESC PAUSE', 16, 531, 14, PALETTE.paper, 'left', '600');
  txt(ctx, `${state.player.ink} INK · ${state.player.decoys} DECOY`, 1008, 531, 12, PALETTE.amber, 'right', '700', MONO);
  txt(ctx, 'WIN: take the objective and reach the green exit.    LOSE: three catches.    ALARM: the night crew hunts you.', 512, 553, 14, PALETTE.paperDim, 'center', '500');
}

const NOTE_FONT = "'Liberation Sans Narrow', 'Arial Narrow', 'DejaVu Sans Condensed', system-ui, sans-serif";

function noteText(value, x, y, maxWidth) {
  ctx.font = font(17, '700', NOTE_FONT);
  const width = ctx.measureText(value).width;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(Math.min(1, maxWidth / width), 1);
  txt(ctx, value, 0, 0, 17, '#2a2a28', 'left', '700', NOTE_FONT);
  ctx.restore();
}

function noteIcon(kind, x, y) {
  ctx.save();
  ctx.lineWidth = 1.2;
  if (kind === 'ink') {
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(x + 7, y + 1, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 13, y - 4, 3, 0, Math.PI * 2);
    ctx.arc(x + 1, y - 3, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.steel;
    ctx.beginPath();
    ctx.arc(x + 7, y + 1, 6.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'decoy') {
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 8);
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x + 8, y + 8);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = PALETTE.amber;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.stroke();
  } else {
    ctx.fillStyle = PALETTE.green;
    ctx.fillRect(x + 2, y - 7, 12, 14);
    ctx.strokeStyle = PALETTE.ink;
    ctx.strokeRect(x + 2.5, y - 6.5, 11, 13);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(x + 10, y - 1, 2, 2);
  }
  ctx.restore();
}

function shotLeader(x1, y1, x2, y2) {
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function shotLabel(value, x, y, endX, endY, side = 'right') {
  ctx.font = font(15, '700');
  const w = ctx.measureText(value).width + 12;
  const h = 22;
  rr(ctx, x + 2, y + 2, w, h, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  rr(ctx, x, y, w, h, 4);
  ctx.fillStyle = PALETTE.paper;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  txt(ctx, value, x + 6, y + 16, 15, PALETTE.ink, 'left', '700');
  const sx = side === 'right' ? x + w : side === 'bottom' ? x + w / 2 : x;
  const sy = side === 'bottomleft' || side === 'bottom' ? y + h : y + h / 2;
  shotLeader(sx, sy, endX, endY);
}

// In-world exit tag for the cover: green type with a thin leader to the recess.
function shotExitLabel() {
  const x = 640;
  const y = 86;
  ctx.save();
  ctx.strokeStyle = PALETTE.green;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(704, 72);
  ctx.lineTo(690, 62);
  ctx.stroke();
  ctx.fillStyle = PALETTE.green;
  ctx.beginPath();
  ctx.arc(690, 62, 2, 0, Math.PI * 2);
  ctx.fill();
  txt(ctx, 'ARCHIVE DOOR', x + 1, y + 1, 18, PALETTE.ink, 'left', '800');
  txt(ctx, 'ARCHIVE DOOR', x, y, 18, PALETTE.green, 'left', '800');
  ctx.restore();
}

function shotDecoy(state) {
  const d = state.shotDecoy;
  if (!d) return;
  ctx.save();
  ctx.strokeStyle = rgba(PALETTE.amber, 0.55 + Math.sin((state.clock || 0) * 5) * 0.15);
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(d.x, d.y, 27, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(d.x, d.y - 9);
  ctx.lineTo(d.x + 8, d.y);
  ctx.lineTo(d.x, d.y + 9);
  ctx.lineTo(d.x - 8, d.y);
  ctx.closePath();
  ctx.fillStyle = PALETTE.amber;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(d.x - 1, d.y - 3, 2, 6);
  ctx.restore();
}

// Shot-only field guide: the cover explains its own rules, then points at Wren and the decoy.
export function drawShotNotes(state) {
  ctx = state.ctx;
  shotDecoy(state);
  const x = 16;
  const y = 84;
  const w = 228;
  const h = 104;
  rr(ctx, x + 3, y + 4, w, h, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();
  rr(ctx, x, y, w, h, 6);
  ctx.fillStyle = PALETTE.paper;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.red;
  ctx.fillRect(x + 12, y, w - 24, 4);
  spaced(ctx, 'FIELD NOTES', x + 14, y + 24, 13, '#5b4d39', 1.4, 'left', '800');
  ctx.fillStyle = 'rgba(10,16,32,0.18)';
  ctx.fillRect(x + 14, y + 32, w - 28, 1);
  const rows = [
    ['ink', 'Ink Q: blinds a guard 3s'],
    ['decoy', 'Decoy F: pulls him off route'],
    ['door', 'Archive door: needs the key'],
  ];
  for (let i = 0; i < rows.length; i += 1) {
    const ry = y + 48 + i * 24;
    noteIcon(rows[i][0], x + 14, ry - 5);
    noteText(rows[i][1], x + 38, ry, w - 40);
  }
  shotLabel('YOU: in low cover, unseen', 300, 350, 390, 318, 'bottom');
  shotLabel('DECOY: he heard it and turned', 520, 400, 470, 332, 'left');
  shotExitLabel();
}

export function drawHud(state) {
  ctx = state.ctx;
  topBar(state);
  detectionPanel(state);
  bottomStrips(state);
}
