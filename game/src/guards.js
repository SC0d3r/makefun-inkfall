// Lantern watchmen: patrol, suspicion, search, chase, catch, plus the rotating brass-eye cameras.
import { GUARD, DETECT } from './config.js';
import { blockedCircle, lineBlocked, blockingPoint } from './level.js';

export const EV_CATCH = 1;
export const EV_NEAR = 2;
export const EV_ALERT = 4;
export const EV_SPOT = 8;
export const EV_CAMERA = 16;

const wrapAngle = (a) => {
  let v = a;
  while (v > Math.PI) v -= Math.PI * 2;
  while (v < -Math.PI) v += Math.PI * 2;
  return v;
};

const angleTo = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);

export function guardColor(guard) {
  if (guard.state === 'chase') return '#c94f3d';
  if (guard.state === 'suspicious' || guard.state === 'search') return '#f2a33c';
  return '#59d6c7';
}

function makeGuard(def, index) {
  const route = def.route.map(([x, y]) => ({ x, y }));
  const first = route[0];
  const next = route[1] ?? first;
  return {
    name: def.name,
    route,
    wp: 1 % route.length,
    x: first.x,
    y: first.y,
    angle: angleTo(first.x, first.y, next.x, next.y),
    lookBase: 0,
    lookClock: index * 1.7,
    pause: def.pause,
    pauseTimer: 0.5 + index * 0.17,
    state: 'patrol',
    awareness: 0,
    target: { x: first.x, y: first.y },
    lastSeen: { x: first.x, y: first.y },
    stateTimer: 0,
    searchTimer: 0,
    chase: 0,
    lost: 0,
    armed: false,
    chased: false,
    bubble: '',
    bubbleTimer: 0,
    stepPhase: 0,
    stepTick: false,
    radius: GUARD.radius,
    range: GUARD.range,
  };
}

export function createGuards(floor) {
  return floor.guardDefs.map((def, index) => makeGuard(def, index));
}

function turnTo(guard, target, dt, rate = GUARD.turn) {
  const delta = wrapAngle(target - guard.angle);
  const max = rate * dt;
  guard.angle += Math.max(-max, Math.min(max, delta));
}

function moveTo(guard, tx, ty, speed, dt, floor) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1.5) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  if (!blockedCircle(floor, nx, guard.y, guard.radius)) guard.x = nx;
  if (!blockedCircle(floor, guard.x, ny, guard.radius)) guard.y = ny;
  turnTo(guard, Math.atan2(dy, dx), dt, 7);
  return dist <= step + 1;
}

function speak(guard, text, time) {
  guard.bubble = text;
  guard.bubbleTimer = time;
}

function becomeSuspicious(guard, x, y) {
  guard.state = 'suspicious';
  guard.stateTimer = 1.2;
  guard.target = { x, y };
  guard.lastSeen = { x, y };
  speak(guard, 'What was that?', 2.1);
}

function becomeSearch(guard, x, y) {
  guard.state = 'search';
  guard.target = { x, y };
  guard.searchTimer = 2.6;
  speak(guard, 'Come out.', 2.2);
}

function becomeChase(guard, player) {
  guard.state = 'chase';
  guard.chase = 4.6;
  guard.lost = 0;
  guard.awareness = 1;
  guard.chased = true;
  guard.armed = false;
  guard.lastSeen = { x: player.x, y: player.y };
  speak(guard, 'Stop!', 2.5);
}

function canSeePlayer(guard, player, floor, clouds) {
  if (player.inHiding || player.entering) return false;
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > guard.range || dist < 1) return false;
  if (Math.abs(wrapAngle(angleTo(guard.x, guard.y, player.x, player.y) - guard.angle)) > GUARD.half) return false;
  if (player.lowHidden && dist > DETECT.lowCover) return false;
  return !lineBlocked(floor, guard.x, guard.y, player.x, player.y, clouds);
}

function canCameraSee(cam, player, floor, clouds) {
  if (player.inHiding || player.entering) return false;
  const dx = player.x - cam.x;
  const dy = player.y - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > cam.range || dist < 1) return false;
  if (Math.abs(wrapAngle(angleTo(cam.x, cam.y, player.x, player.y) - cam.angle)) > cam.half) return false;
  if (player.lowHidden && dist > DETECT.lowCover) return false;
  return !lineBlocked(floor, cam.x, cam.y, player.x, player.y, clouds);
}

function checkNoises(guard, noises, dt) {
  for (let i = 0; i < noises.length; i += 1) {
    const noise = noises[i];
    if (!noise.active || noise.age > dt * 2.2) continue;
    const d = Math.hypot(guard.x - noise.x, guard.y - noise.y);
    if (d > noise.r) continue;
    if (guard.state === 'chase') continue;
    guard.awareness = Math.max(guard.awareness, 0.38);
    becomeSuspicious(guard, noise.x, noise.y);
    guard.stateTimer = 1.35;
    return EV_SPOT;
  }
  return 0;
}

export function updateGuards(state, dt) {
  const floor = state.floor;
  const player = state.player;
  const clouds = state.gadgets.clouds;
  let events = 0;
  state.catchGuard = null;
  for (let i = 0; i < state.guards.length; i += 1) {
    const guard = state.guards[i];
    guard.bubbleTimer = Math.max(0, guard.bubbleTimer - dt);
    guard.stepTick = false;
    const visible = canSeePlayer(guard, player, floor, clouds);
    events |= checkNoises(guard, state.gadgets.noises, dt);

    if (visible) {
      const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
      const base = DETECT.far - (DETECT.far - DETECT.near) * Math.min(1, dist / guard.range);
      let factor = player.visibility === 'EXPOSED' ? 1.45 : player.visibility === 'HIDDEN' ? 0.35 : 1;
      if (player.crouched) factor *= 0.7;
      if (player.sprinting) factor *= 1.25;
      if (player.lowHidden) factor *= DETECT.hiddenNear;
      guard.awareness = Math.min(1, guard.awareness + base * factor * dt);
      guard.lastSeen = { x: player.x, y: player.y };
      guard.lost = 0;
      if (guard.awareness > 0.4) guard.armed = true;
      if (guard.awareness >= DETECT.chase && guard.state !== 'chase') {
        becomeChase(guard, player);
        events |= EV_ALERT;
      } else if (guard.awareness >= DETECT.suspicious && (guard.state === 'patrol' || guard.state === 'return')) {
        becomeSuspicious(guard, player.x, player.y);
        events |= EV_SPOT;
      } else if (guard.awareness >= DETECT.suspicious && guard.state === 'search') {
        guard.state = 'suspicious';
        guard.stateTimer = 1.1;
        speak(guard, 'What was that?', 1.8);
        events |= EV_SPOT;
      }
    } else {
      guard.awareness = Math.max(0, guard.awareness - DETECT.decay * dt);
      if (guard.state === 'chase') guard.lost += dt;
    }

    if (guard.armed && !guard.chased && guard.awareness < 0.4) {
      guard.armed = false;
      events |= EV_NEAR;
    }

    let speed = 0;
    if (guard.state === 'chase') {
      guard.chase -= dt;
      if (visible) {
        guard.target = { x: player.x, y: player.y };
        guard.lastSeen = { x: player.x, y: player.y };
      }
      speed = GUARD.chase;
      moveTo(guard, guard.target.x, guard.target.y, speed, dt, floor);
      if (guard.lost > 1.35 || guard.chase <= 0) becomeSearch(guard, guard.lastSeen.x, guard.lastSeen.y);
      if (visible && Math.hypot(player.x - guard.x, player.y - guard.y) < 15) {
        events |= EV_CATCH;
        state.catchGuard = guard;
        break;
      }
    } else if (guard.state === 'suspicious') {
      guard.stateTimer -= dt;
      turnTo(guard, angleTo(guard.x, guard.y, guard.target.x, guard.target.y), dt, 3.2);
      if (guard.stateTimer <= 0) becomeSearch(guard, guard.target.x, guard.target.y);
    } else if (guard.state === 'search') {
      speed = GUARD.search;
      const arrived = moveTo(guard, guard.target.x, guard.target.y, speed, dt, floor);
      if (arrived) {
        guard.searchTimer -= dt;
        guard.lookClock += dt;
        guard.angle = guard.lookBase + Math.sin(guard.lookClock * 2.1) * 0.7;
        if (guard.searchTimer <= 0) {
          guard.state = 'return';
          guard.bubbleTimer = 0;
        }
      }
    } else if (guard.state === 'return') {
      speed = GUARD.search * 0.8;
      const wp = guard.route[guard.wp];
      if (moveTo(guard, wp.x, wp.y, speed, dt, floor)) {
        guard.state = 'patrol';
        guard.wp = (guard.wp + 1) % guard.route.length;
        guard.pauseTimer = 0.4;
      }
    } else {
      if (guard.pauseTimer > 0) {
        guard.pauseTimer -= dt;
        guard.lookClock += dt;
        guard.angle = guard.lookBase + Math.sin(guard.lookClock * 1.6) * 0.55;
      } else {
        const wp = guard.route[guard.wp];
        speed = GUARD.patrol;
        if (moveTo(guard, wp.x, wp.y, speed, dt, floor)) {
          guard.lookBase = guard.angle;
          guard.pauseTimer = guard.pause;
          guard.wp = (guard.wp + 1) % guard.route.length;
        }
      }
    }

    guard.stepPhase += speed * dt;
    if (guard.stepPhase > 22) {
      guard.stepPhase = 0;
      guard.stepTick = true;
    }
  }
  return events;
}

export function updateCameras(state, dt) {
  const floor = state.floor;
  const player = state.player;
  const clouds = state.gadgets.clouds;
  let events = 0;
  state.cameraSeen = false;
  for (let i = 0; i < floor.cameras.length; i += 1) {
    const cam = floor.cameras[i];
    if (cam.disabled) continue;
    cam.angle = cam.base + Math.sin(state.clock * cam.speed) * cam.sweep;
    cam.ping = Math.max(0, cam.ping - dt);
    if (canCameraSee(cam, player, floor, clouds)) {
      state.cameraSeen = true;
      cam.seen = 1;
      if (cam.ping <= 0) {
        cam.ping = 2.2;
        events |= EV_CAMERA;
      }
    } else {
      cam.seen = Math.max(0, cam.seen - dt * 1.5);
    }
  }
  return events;
}

export function alertGuards(state, x, y) {
  for (let i = 0; i < state.guards.length; i += 1) {
    const guard = state.guards[i];
    if (guard.state === 'chase') continue;
    guard.state = 'search';
    guard.target = { x, y };
    guard.searchTimer = 3.2;
    guard.awareness = Math.max(guard.awareness, 0.55);
    guard.lookBase = guard.angle;
    speak(guard, 'Come out.', 2.2);
  }
}

function rayPolygon(floor, clouds, x, y, angle, half, range, rays = 17) {
  const points = [{ x, y }];
  for (let i = 0; i <= rays; i += 1) {
    const a = angle - half + (i / rays) * half * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    let hit = range;
    for (let d = 6; d <= range; d += 6) {
      if (blockingPoint(floor, x + cos * d, y + sin * d, clouds)) {
        hit = Math.max(4, d - 5);
        break;
      }
    }
    points.push({ x: x + cos * hit, y: y + sin * hit });
  }
  return points;
}

export function conePolygon(guard, floor, clouds) {
  return rayPolygon(floor, clouds, guard.x, guard.y, guard.angle, GUARD.half, guard.range);
}

export function cameraPolygon(cam, floor, clouds) {
  return rayPolygon(floor, clouds, cam.x, cam.y, cam.angle, cam.half, cam.range, 11);
}

export function guardSeesPlayer(guard, player, floor, clouds) {
  return canSeePlayer(guard, player, floor, clouds);
}
