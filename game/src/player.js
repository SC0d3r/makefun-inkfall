// Wren: movement, collision, sneak, sprint, visibility, noise, loot, passes and interactions.
import { PLAYER } from './config.js';
import { blockedCircle, nearLowCover, inShadow, inLamp, nearestHiding, pointInRect } from './level.js';
import { emitNoise } from './gadgets.js';

export const PL_LOOT = 1;
export const PL_STEP = 2;

export function createPlayer(spawn, upgrades) {
  return {
    x: spawn.x,
    y: spawn.y,
    r: PLAYER.radius,
    aim: -Math.PI / 2,
    crouched: false,
    sprinting: false,
    moving: false,
    visibility: 'DIM',
    noise: 'SILENT',
    lowHidden: false,
    inHiding: null,
    entering: false,
    enterSpot: null,
    enterTimer: 0,
    ink: PLAYER.inkCount + (upgrades.extraInk ? 1 : 0),
    decoys: PLAYER.decoyCount,
    stepTimer: 0,
    stepKind: 'soft',
    anim: 0,
    hideTime: 0,
  };
}

export function computeVisibility(state) {
  const p = state.player;
  if (p.inHiding || p.entering) return 'HIDDEN';
  if (p.lowHidden) return 'HIDDEN';
  if (p.sprinting) return 'EXPOSED';
  if (inLamp(state.floor, p.x, p.y)) return 'EXPOSED';
  if (inShadow(state.floor, p.x, p.y)) return 'HIDDEN';
  return 'DIM';
}

function movePlayer(state, dx, dy, speed, dt) {
  const p = state.player;
  const floor = state.floor;
  const len = Math.hypot(dx, dy);
  if (len === 0) return false;
  const step = speed * dt;
  const nx = p.x + (dx / len) * step;
  const ny = p.y + (dy / len) * step;
  let moved = false;
  if (!blockedCircle(floor, nx, p.y, p.r)) {
    p.x = nx;
    moved = true;
  }
  if (!blockedCircle(floor, p.x, ny, p.r)) {
    p.y = ny;
    moved = true;
  }
  return moved;
}

export function updatePlayer(state, dt, ctrl) {
  const p = state.player;
  let events = 0;
  if (p.entering) {
    p.enterTimer -= dt;
    p.visibility = 'HIDDEN';
    p.noise = 'SILENT';
    if (p.enterTimer <= 0) {
      p.entering = false;
      p.inHiding = p.enterSpot;
      p.x = p.enterSpot.cx;
      p.y = p.enterSpot.cy;
    }
    return 0;
  }
  if (p.inHiding) {
    p.x = p.inHiding.cx;
    p.y = p.inHiding.cy;
    p.crouched = true;
    p.moving = false;
    p.sprinting = false;
    p.visibility = 'HIDDEN';
    p.noise = 'SILENT';
    return 0;
  }

  p.aim = ctrl.aim;
  p.crouched = ctrl.sneak;
  const moving = movePlayer(state, ctrl.dx, ctrl.dy, ctrl.sneak ? (state.upgrades.softSoles ? PLAYER.softSoles : PLAYER.sneak) : ctrl.sprint ? PLAYER.sprint : PLAYER.walk, dt);
  p.moving = moving;
  p.sprinting = ctrl.sprint && !ctrl.sneak && moving;
  p.anim += moving ? dt * (p.sprinting ? 16 : 10) : 0;
  p.lowHidden = p.crouched && nearLowCover(state.floor, p.x, p.y) <= 16;
  p.visibility = computeVisibility(state);
  p.noise = p.crouched ? 'SILENT' : p.sprinting ? 'LOUD' : moving ? 'SOFT' : 'SILENT';

  if (p.noise !== 'SILENT') {
    p.stepTimer -= dt;
    if (p.stepTimer <= 0) {
      p.stepTimer = p.sprinting ? PLAYER.sprintStep : PLAYER.walkStep;
      p.stepKind = p.sprinting ? 'loud' : 'soft';
      emitNoise(state, p.x, p.y, p.sprinting ? PLAYER.noiseSprint : PLAYER.noiseWalk, 'step');
      events |= PL_STEP;
    }
  } else p.stepTimer = 0;

  const loot = state.floor.loot;
  for (let i = 0; i < loot.length; i += 1) {
    const item = loot[i];
    if (!item.active) continue;
    if (Math.hypot(p.x - item.x, p.y - item.y) < 18) {
      item.active = false;
      state.loot += 1;
      state.floorLoot += 1;
      events |= PL_LOOT;
    }
  }
  return events;
}

export function findInteract(state) {
  const p = state.player;
  if (p.inHiding) return { type: 'leave', x: p.inHiding.cx, y: p.inHiding.cy, label: 'LEAVE' };
  if (p.entering) return null;
  const floor = state.floor;
  if (floor.item.active && Math.hypot(p.x - floor.item.x, p.y - floor.item.y) < 27) {
    return { type: 'item', x: floor.item.x, y: floor.item.y, label: floor.item.label };
  }
  const spot = nearestHiding(floor, p.x, p.y, 32);
  if (spot) return { type: 'hide', x: spot.cx, y: spot.cy, spot, label: 'HIDE' };
  if (floor.fuse && !floor.fuse.cut && Math.hypot(p.x - floor.fuse.x, p.y - floor.fuse.y) < 34) {
    return { type: 'fuse', x: floor.fuse.x, y: floor.fuse.y, label: 'CUT CAMERA' };
  }
  if (!state.objectiveDone && pointInRect(p.x, p.y, floor.exit, 30)) {
    return { type: 'locked', x: floor.exit.x + floor.exit.w / 2, y: floor.exit.y + floor.exit.h / 2, label: 'LOCKED' };
  }
  return null;
}

export function interactPlayer(state) {
  const target = findInteract(state);
  if (target === null) return null;
  const p = state.player;
  if (target.type === 'leave') {
    const spot = p.inHiding;
    p.inHiding = null;
    p.y = spot.cy + 24;
    if (blockedCircle(state.floor, p.x, p.y, p.r)) p.y = spot.cy - 24;
    p.crouched = true;
    return 'leave';
  }
  if (target.type === 'hide') {
    p.entering = true;
    p.enterSpot = target.spot;
    p.enterTimer = state.upgrades.quietHinges ? 0.1 : 0.46;
    p.x = target.spot.cx;
    p.y = target.spot.cy;
    if (!state.upgrades.quietHinges) emitNoise(state, p.x, p.y, 28, 'hinge');
    for (let i = 0; i < state.guards.length; i += 1) {
      const guard = state.guards[i];
      if (guard.state === 'chase' || guard.awareness > 0.18) {
        guard.state = 'search';
        guard.target = { x: target.spot.cx, y: target.spot.cy };
        guard.searchTimer = 3;
        guard.bubble = 'Come out.';
        guard.bubbleTimer = 2.2;
      }
    }
    return 'hide';
  }
  if (target.type === 'item') {
    state.floor.item.active = false;
    state.objectiveDone = true;
    state.exitOpen = true;
    state.floor.exit.open = true;
    if (state.floor.item.id === 'plate') {
      state.alarm = Math.max(state.alarm, 0.82);
      state.alarmHold = 0;
      state.plateLoud = 1.5;
    }
    return 'objective';
  }
  if (target.type === 'fuse') {
    state.floor.fuse.cut = true;
    for (let i = 0; i < state.floor.cameras.length; i += 1) state.floor.cameras[i].disabled = true;
    return 'fuse';
  }
  return null;
}

export function atExit(state) {
  const e = state.floor.exit;
  return pointInRect(state.player.x, state.player.y, e, 2);
}
