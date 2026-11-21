// Ink bombs, wind-up decoys, noise rings and pooled particles. No allocation after boot.
import { blockedCircle } from './level.js';

export const GE_SQUEAK = 1;
export const GE_INK = 2;

function pool(count, make) {
  const list = [];
  for (let i = 0; i < count; i += 1) list.push(make(i));
  return list;
}

export function createGadgets() {
  return {
    clouds: pool(6, () => ({ active: false, x: 0, y: 0, r: 48, t: 0, max: 5, seed: 0 })),
    splats: pool(24, (i) => ({ active: false, x: 0, y: 0, r: 30, seed: i * 7.3 })),
    decoys: pool(4, (i) => ({ active: false, x: 0, y: 0, age: 0, dir: 0, squeaked: 0, seed: i * 3.1 })),
    noises: pool(24, () => ({ active: false, x: 0, y: 0, r: 0, age: 0, kind: '' })),
    particles: pool(110, (i) => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, color: '#efe3c8', size: 2, seed: i })),
  };
}

export function resetGadgets(gadgets) {
  for (const key of ['clouds', 'splats', 'decoys', 'noises', 'particles']) {
    for (const item of gadgets[key]) item.active = false;
  }
}

export function emitNoise(state, x, y, radius, kind) {
  const noises = state.gadgets.noises;
  let slot = null;
  for (let i = 0; i < noises.length; i += 1) {
    if (!noises[i].active) {
      slot = noises[i];
      break;
    }
  }
  if (slot === null) slot = noises[0];
  slot.active = true;
  slot.x = x;
  slot.y = y;
  slot.r = radius;
  slot.age = 0;
  slot.kind = kind;
}

function free(list) {
  for (let i = 0; i < list.length; i += 1) if (!list[i].active) return list[i];
  return null;
}

export function spawnParticles(state, x, y, count, color, speed = 40, size = 2) {
  const parts = state.gadgets.particles;
  for (let n = 0; n < count; n += 1) {
    const p = free(parts);
    if (p === null) return;
    const a = (n / count) * Math.PI * 2 + Math.random() * 0.5;
    const v = speed * (0.35 + Math.random() * 0.75);
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(a) * v;
    p.vy = Math.sin(a) * v;
    p.life = 0.5 + Math.random() * 0.45;
    p.max = p.life;
    p.color = color;
    p.size = size;
  }
}

export function throwInk(state) {
  const p = state.player;
  if (p.ink <= 0 || p.inHiding || p.entering) return false;
  let tx = p.x + Math.cos(p.aim) * 92;
  let ty = p.y + Math.sin(p.aim) * 92;
  for (let d = 92; d >= 32; d -= 10) {
    const x = p.x + Math.cos(p.aim) * d;
    const y = p.y + Math.sin(p.aim) * d;
    if (!blockedCircle(state.floor, x, y, 6)) {
      tx = x;
      ty = y;
      break;
    }
  }
  p.ink -= 1;
  const cloud = free(state.gadgets.clouds);
  if (cloud !== null) {
    cloud.active = true;
    cloud.x = tx;
    cloud.y = ty;
    cloud.r = 48;
    cloud.t = 5;
    cloud.max = 5;
    cloud.seed = (tx * 0.17 + ty * 0.11) % 9;
  }
  const splat = free(state.gadgets.splats);
  if (splat !== null) {
    splat.active = true;
    splat.x = tx;
    splat.y = ty;
    splat.r = 30;
    splat.seed = (tx * 0.13 + ty * 0.29) % 11;
  }
  emitNoise(state, tx, ty, 70, 'ink');
  spawnParticles(state, tx, ty, 10, '#0a1020', 65, 3);
  return true;
}

export function placeDecoy(state) {
  const p = state.player;
  if (p.decoys <= 0 || p.inHiding || p.entering) return false;
  const decoy = free(state.gadgets.decoys);
  if (decoy === null) return false;
  p.decoys -= 1;
  decoy.active = true;
  decoy.x = p.x;
  decoy.y = p.y;
  decoy.age = 0;
  decoy.dir = p.aim;
  decoy.squeaked = 0;
  decoy.seed = p.x * 0.21 + p.y * 0.07;
  return true;
}

export function updateGadgets(state, dt) {
  const g = state.gadgets;
  let events = 0;
  for (let i = 0; i < g.clouds.length; i += 1) {
    const c = g.clouds[i];
    if (!c.active) continue;
    c.t -= dt;
    if (c.t <= 0) c.active = false;
  }
  for (let i = 0; i < g.decoys.length; i += 1) {
    const d = g.decoys[i];
    if (!d.active) continue;
    d.age += dt;
    const wind = state.upgrades.paperTrail ? 1.8 : 1.3;
    if (d.age < wind) {
      const nx = d.x + Math.cos(d.dir) * 12 * dt;
      const ny = d.y + Math.sin(d.dir) * 12 * dt;
      if (!blockedCircle(state.floor, nx, ny, 4)) {
        d.x = nx;
        d.y = ny;
      }
    } else if (d.squeaked === 0) {
      d.squeaked = 1;
      emitNoise(state, d.x, d.y, state.upgrades.paperTrail ? 230 : 195, 'decoy');
      spawnParticles(state, d.x, d.y, 7, '#f2a33c', 35, 2);
      events |= GE_SQUEAK;
    } else if (state.upgrades.paperTrail && d.squeaked === 1 && d.age > wind + 1.15) {
      d.squeaked = 2;
      emitNoise(state, d.x, d.y, 230, 'decoy');
      spawnParticles(state, d.x, d.y, 7, '#f2a33c', 35, 2);
      events |= GE_SQUEAK;
    }
    if (d.age > wind + (state.upgrades.paperTrail ? 3.2 : 1.7)) d.active = false;
  }
  for (let i = 0; i < g.noises.length; i += 1) {
    const n = g.noises[i];
    if (!n.active) continue;
    n.age += dt;
    if (n.age > 0.55) n.active = false;
  }
  for (let i = 0; i < g.particles.length; i += 1) {
    const p = g.particles[i];
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
  }
  return events;
}

export function inkCloudBlocks(clouds, x, y) {
  for (let i = 0; i < clouds.length; i += 1) {
    const c = clouds[i];
    if (!c.active) continue;
    const dx = x - c.x;
    const dy = y - c.y;
    if (dx * dx + dy * dy < c.r * c.r) return true;
  }
  return false;
}
