// Canvas 2D world renderer: floors, cover, lamps, cones, watchmen, Wren, gadgets and grain.
import { FIELD, PALETTE, MONO } from './config.js';
import { conePolygon, cameraPolygon, guardColor } from './guards.js';
import { findInteract } from './player.js';
import { rr, txt, wrap, rgba, circle, spaced } from './draw.js';
import { drawHud } from './hud.js';
import { drawTitle, drawDesk, drawPause, drawResults, drawFloorCard, drawCaught } from './screens.js';

const W = FIELD.w;
const H = FIELD.h;

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const grain = [];
  let seed = 7;
  for (let i = 0; i < 620; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    grain.push({ x: (seed / 4294967296) * 1024, y: (seed / 2147483648 % 1) * 576, a: 0.018 + (seed % 7) * 0.006 });
  }

  function floorBase() {
    ctx.fillStyle = PALETTE.ink2;
    ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < FIELD.rows; r += 1) {
      for (let c = 0; c < FIELD.cols; c += 1) {
        if ((c + r) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.012)';
          ctx.fillRect(c * 30, r * 30, 30, 30);
        }
      }
    }
    ctx.strokeStyle = 'rgba(239,227,200,0.035)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= FIELD.cols; c += 1) {
      ctx.beginPath();
      ctx.moveTo(c * 30 + 0.5, 0);
      ctx.lineTo(c * 30 + 0.5, H);
      ctx.stroke();
    }
    for (let r = 0; r <= FIELD.rows; r += 1) {
      ctx.beginPath();
      ctx.moveTo(0, r * 30 + 0.5);
      ctx.lineTo(W, r * 30 + 0.5);
      ctx.stroke();
    }
  }

  function shadowRects(floor) {
    for (const s of floor.shadows) {
      ctx.fillStyle = 'rgba(3,6,14,0.42)';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = 'rgba(3,6,14,0.28)';
      ctx.fillRect(s.x + 5, s.y + 5, Math.max(0, s.w - 10), Math.max(0, s.h - 10));
    }
  }

  function inkSplats(gadgets) {
    for (const s of gadgets.splats) {
      if (!s.active) continue;
      ctx.fillStyle = 'rgba(5,8,18,0.86)';
      ctx.beginPath();
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2 + s.seed;
        const rad = s.r * (0.55 + hash(i + s.seed) * 0.5);
        const x = s.x + Math.cos(a) * s.r * 0.36;
        const y = s.y + Math.sin(a) * s.r * 0.36;
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(40,54,84,0.5)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function lightPools(floor) {
    for (const lamp of floor.lamps) {
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.r);
      g.addColorStop(0, 'rgba(242,163,60,0.22)');
      g.addColorStop(0.55, 'rgba(242,163,60,0.11)');
      g.addColorStop(1, 'rgba(242,163,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(242,163,60,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, lamp.r * 0.94, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function lampFixtures(floor) {
    for (const lamp of floor.lamps) {
      ctx.fillStyle = '#2a3446';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.amber;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(242,163,60,0.35)';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function exitGate(floor, clock) {
    const e = floor.exit;
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const pulse = 0.6 + Math.sin(clock * 3) * 0.16;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 64);
    g.addColorStop(0, `rgba(105,214,154,${0.26 * pulse})`);
    g.addColorStop(1, 'rgba(105,214,154,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0c201d';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = floor.exit.open ? PALETTE.green : '#4b8b70';
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x + 1.5, e.y + 1.5, e.w - 3, e.h - 3);
    ctx.strokeStyle = 'rgba(105,214,154,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, e.y + 4);
    ctx.lineTo(cx, e.y + e.h - 4);
    ctx.stroke();
    ctx.fillStyle = floor.exit.open ? PALETTE.green : PALETTE.amber;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    txt(ctx, floor.exit.open ? 'EXIT' : 'LOCKED', cx, e.y - 5, 10, floor.exit.open ? PALETTE.green : PALETTE.amber, 'center', '700');
  }

  function lowCover(c) {
    const x = c.x;
    const y = c.y;
    ctx.fillStyle = 'rgba(3,6,14,0.5)';
    ctx.fillRect(x + 3, y + 4, 28, 27);
    if (c.kind === 'L') {
      ctx.fillStyle = '#c9b992';
      ctx.fillRect(x + 2, y + 6, 26, 19);
      ctx.strokeStyle = '#8e7d5d';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2.5, y + 6.5, 25, 18);
      for (let i = 0; i < 3; i += 1) {
        ctx.strokeStyle = 'rgba(80,64,42,0.55)';
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 10 + i * 4);
        ctx.lineTo(x + 25, y + 10 + i * 4);
        ctx.stroke();
      }
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(x + 13, y + 5, 4, 21);
    } else if (c.kind === 'D') {
      ctx.fillStyle = '#6f5535';
      ctx.fillRect(x + 2, y + 5, 26, 20);
      ctx.fillStyle = '#9a7a4c';
      ctx.fillRect(x + 2, y + 5, 26, 4);
      ctx.fillStyle = PALETTE.paper;
      ctx.fillRect(x + 6, y + 12, 10, 7);
      ctx.fillStyle = '#3a2c1d';
      ctx.fillRect(x + 4, y + 24, 3, 4);
      ctx.fillRect(x + 23, y + 24, 3, 4);
    } else if (c.kind === 'R') {
      ctx.strokeStyle = '#7b6a4c';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, 22, 22);
      ctx.fillStyle = 'rgba(239,227,200,0.82)';
      ctx.fillRect(x + 7, y + 8, 6, 14);
      ctx.fillRect(x + 16, y + 6, 6, 17);
    } else {
      ctx.fillStyle = '#3c4a3c';
      ctx.fillRect(x + 3, y + 8, 24, 18);
      ctx.fillStyle = '#6f8b5e';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(x + 9 + i * 7, y + 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function tallCover(c) {
    const x = c.x;
    const y = c.y;
    ctx.fillStyle = 'rgba(3,6,14,0.62)';
    ctx.fillRect(x + 3, y + 4, 27, 27);
    if (c.kind === 'T') {
      ctx.fillStyle = '#cabd9d';
      ctx.fillRect(x + 2, y + 2, 26, 26);
      ctx.strokeStyle = '#8f8266';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2.5, y + 2.5, 25, 25);
      for (let i = 0; i < 4; i += 1) {
        ctx.strokeStyle = 'rgba(75,64,45,0.55)';
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 7 + i * 5);
        ctx.lineTo(x + 26, y + 7 + i * 5);
        ctx.stroke();
      }
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(x + 13, y + 2, 4, 26);
    } else if (c.kind === 'S') {
      ctx.fillStyle = '#354256';
      ctx.fillRect(x + 1, y + 1, 28, 28);
      ctx.strokeStyle = PALETTE.steel;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 2, y + 2, 26, 26);
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? '#d6c6a4' : '#a9b3c2';
        ctx.fillRect(x + 4, y + 5 + i * 8, 6 + (i % 2) * 3, 5);
        ctx.fillStyle = '#c7b997';
        ctx.fillRect(x + 12, y + 5 + i * 8, 5, 5);
        ctx.fillStyle = '#8e9aab';
        ctx.fillRect(x + 19, y + 5 + i * 8, 6, 5);
      }
    } else if (c.kind === 'P') {
      ctx.fillStyle = PALETTE.redDark;
      ctx.fillRect(x + 1, y + 1, 28, 28);
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(x + 3, y + 3, 24, 12);
      ctx.strokeStyle = '#e07a64';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4, y + 4, 22, 10);
      ctx.fillStyle = '#1b2334';
      ctx.fillRect(x + 3, y + 17, 24, 9);
      ctx.fillStyle = PALETTE.steel;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(x + 8 + i * 7, y + 21, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = PALETTE.amber;
      ctx.fillRect(x + 23, y + 6, 3, 3);
    } else if (c.kind === 'V') {
      ctx.fillStyle = '#3a4a5e';
      ctx.fillRect(x + 1, y + 1, 28, 28);
      ctx.strokeStyle = '#8292a6';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 2, y + 2, 26, 26);
      ctx.strokeStyle = '#c6d0dc';
      ctx.beginPath();
      ctx.arc(x + 15, y + 15, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.amber;
      ctx.beginPath();
      ctx.arc(x + 15, y + 15, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b2334';
      ctx.fillRect(x + 5, y + 24, 20, 2);
    } else if (c.kind === 'h') {
      ctx.fillStyle = '#1a2437';
      ctx.fillRect(x + 1, y + 1, 28, 28);
      ctx.strokeStyle = '#4a5a70';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 2, y + 2, 26, 26);
      ctx.strokeStyle = '#0b111d';
      ctx.beginPath();
      ctx.moveTo(x + 15, y + 3);
      ctx.lineTo(x + 15, y + 27);
      ctx.stroke();
      ctx.fillStyle = PALETTE.amber;
      ctx.beginPath();
      ctx.arc(x + 11, y + 15, 1.5, 0, Math.PI * 2);
      ctx.arc(x + 19, y + 15, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#465468';
      ctx.fillRect(x + 1, y + 1, 28, 28);
      ctx.strokeStyle = '#7d8ca0';
      ctx.strokeRect(x + 2, y + 2, 26, 26);
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 3);
      ctx.lineTo(x + 27, y + 27);
      ctx.moveTo(x + 27, y + 3);
      ctx.lineTo(x + 3, y + 27);
      ctx.stroke();
    }
  }

  function walls(floor) {
    for (const w of floor.walls) {
      ctx.fillStyle = PALETTE.steelDark;
      ctx.fillRect(w.x, w.y, 30, 30);
      ctx.fillStyle = 'rgba(91,107,127,0.22)';
      ctx.fillRect(w.x + 2, w.y + 2, 26, 4);
      ctx.strokeStyle = 'rgba(6,10,18,0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, 29, 29);
      ctx.fillStyle = 'rgba(239,227,200,0.05)';
      ctx.fillRect(w.x + 5, w.y + 16, 8, 1);
      ctx.fillRect(w.x + 17, w.y + 22, 7, 1);
    }
  }

  function signPlaque(floor) {
    const s = floor.sign;
    ctx.fillStyle = '#0b111e';
    ctx.fillRect(s.x + 2, s.y + 2, 214, 18);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(s.x, s.y, 214, 18);
    ctx.strokeStyle = PALETTE.red;
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x + 0.5, s.y + 0.5, 213, 17);
    txt(ctx, s.text, s.x + 7, s.y + 13, 10, PALETTE.ink, 'left', '700');
  }

  function fuseBox(floor) {
    if (floor.fuse === null) return;
    const f = floor.fuse;
    ctx.fillStyle = '#0b111e';
    ctx.fillRect(f.x - 8, f.y - 13, 20, 26);
    ctx.fillStyle = f.cut ? '#33414f' : '#4a5868';
    ctx.fillRect(f.x - 7, f.y - 12, 18, 24);
    ctx.strokeStyle = '#93a3b5';
    ctx.strokeRect(f.x - 6.5, f.y - 11.5, 17, 23);
    ctx.fillStyle = f.cut ? PALETTE.teal : PALETTE.red;
    ctx.fillRect(f.x - 2, f.y - 6, 8, 8);
    txt(ctx, 'FUSE', f.x + 2, f.y + 23, 9, f.cut ? PALETTE.teal : PALETTE.paper, 'center', '700');
  }

  function objectiveItem(floor, clock) {
    const item = floor.item;
    if (!item.active) return;
    const pulse = 0.65 + Math.sin(clock * 4) * 0.2;
    const g = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 36);
    g.addColorStop(0, `rgba(231,182,74,${0.5 * pulse})`);
    g.addColorStop(1, 'rgba(231,182,74,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 36, 0, Math.PI * 2);
    ctx.fill();
    if (item.id === 'key') {
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(item.x - 5, item.y - 2, 5, 0, Math.PI * 2);
      ctx.moveTo(item.x, item.y + 1);
      ctx.lineTo(item.x + 10, item.y + 9);
      ctx.moveTo(item.x + 6, item.y + 5);
      ctx.lineTo(item.x + 9, item.y + 2);
      ctx.stroke();
    } else if (item.id === 'ledger') {
      ctx.fillStyle = '#5d2f2b';
      ctx.fillRect(item.x - 9, item.y - 7, 18, 14);
      ctx.fillStyle = PALETTE.paper;
      ctx.fillRect(item.x - 7, item.y - 5, 14, 10);
      ctx.strokeStyle = PALETTE.red;
      ctx.strokeRect(item.x - 7, item.y - 5, 14, 10);
    } else {
      ctx.fillStyle = '#9aa8b8';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    txt(ctx, item.label, item.x, item.y - 16, 10, PALETTE.gold, 'center', '700');
  }

  function lootItems(floor) {
    for (const l of floor.loot) {
      if (!l.active) continue;
      ctx.fillStyle = 'rgba(231,182,74,0.2)';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.paper;
      ctx.fillRect(l.x - 6, l.y - 4, 12, 8);
      ctx.strokeStyle = PALETTE.amberDim;
      ctx.lineWidth = 1;
      ctx.strokeRect(l.x - 6, l.y - 4, 12, 8);
      ctx.strokeStyle = PALETTE.red;
      ctx.beginPath();
      ctx.moveTo(l.x - 6, l.y);
      ctx.lineTo(l.x + 6, l.y);
      ctx.stroke();
    }
  }

  function decoys(gadgets, clock) {
    for (const d of gadgets.decoys) {
      if (!d.active) continue;
      const bob = Math.sin(clock * 12) * 1.5;
      ctx.fillStyle = 'rgba(242,163,60,0.2)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b98a3f';
      ctx.beginPath();
      ctx.arc(d.x, d.y + bob, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.paper;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y + bob - 5);
      ctx.lineTo(d.x, d.y + bob - 10);
      ctx.stroke();
      ctx.fillStyle = PALETTE.amber;
      ctx.fillRect(d.x + 3, d.y + bob - 3, 3, 3);
    }
  }

  function cone(points, color, alpha) {
    if (points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.fillStyle = rgba(color, alpha);
    ctx.fill();
    ctx.strokeStyle = rgba(color, 0.62);
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  function guardBody(g, player, clock) {
    const color = guardColor(g);
    const dist = Math.hypot(g.x - player.x, g.y - player.y);
    const nameVisible = dist < 260 || g.state !== 'patrol';
    ctx.fillStyle = 'rgba(3,6,14,0.55)';
    ctx.beginPath();
    ctx.ellipse(g.x + 1, g.y + 6, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    const lg = ctx.createRadialGradient(g.x + 8, g.y - 1, 1, g.x + 8, g.y - 1, 26);
    lg.addColorStop(0, 'rgba(242,163,60,0.42)');
    lg.addColorStop(1, 'rgba(242,163,60,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(g.x + 8, g.y - 1, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a2334';
    ctx.beginPath();
    ctx.ellipse(g.x, g.y, 8, 10, g.angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6a7a90';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#d7c7a5';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 3, g.y + Math.sin(g.angle) * 3, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141c2b';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 3, g.y + Math.sin(g.angle) * 3 - 1.5, 4.8, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b9873d';
    ctx.fillRect(g.x + 7, g.y - 4, 5, 7);
    ctx.fillStyle = PALETTE.amber;
    ctx.fillRect(g.x + 8, g.y - 3, 3, 5);
    if (g.awareness > 0.03) {
      ctx.fillStyle = 'rgba(8,12,22,0.8)';
      ctx.fillRect(g.x - 10, g.y - 20, 20, 3);
      ctx.fillStyle = color;
      ctx.fillRect(g.x - 10, g.y - 20, 20 * Math.min(1, g.awareness), 3);
    }
    if (nameVisible) {
      ctx.font = '700 9px system-ui, sans-serif';
      const tw = ctx.measureText(g.name.toUpperCase()).width + 8;
      rr(ctx, g.x - tw / 2, g.y - 34, tw, 12, 3);
      ctx.fillStyle = 'rgba(8,12,22,0.82)';
      ctx.fill();
      txt(ctx, g.name.toUpperCase(), g.x, g.y - 25, 9, color, 'center', '700');
    }
    if (g.state === 'chase') {
      txt(ctx, '!', g.x, g.y - 40, 18, PALETTE.red, 'center', '800');
    } else if (g.state === 'suspicious' || g.state === 'search') {
      txt(ctx, '?', g.x, g.y - 40, 16, PALETTE.amber, 'center', '800');
    }
    if (g.bubbleTimer > 0 && g.bubble !== '') {
      ctx.font = '700 11px system-ui, sans-serif';
      const tw = ctx.measureText(g.bubble).width + 14;
      const bx = Math.max(4, Math.min(W - tw - 4, g.x - tw / 2));
      const by = g.y - 64;
      rr(ctx, bx, by, tw, 20, 4);
      ctx.fillStyle = PALETTE.paper;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(g.x - 4, by + 20);
      ctx.lineTo(g.x + 4, by + 20);
      ctx.lineTo(g.x, by + 26);
      ctx.closePath();
      ctx.fillStyle = PALETTE.paper;
      ctx.fill();
      txt(ctx, g.bubble, bx + tw / 2, by + 14, 11, PALETTE.ink, 'center', '700');
    }
    const stepA = 1 - (g.stepPhase / 22);
    if (g.stepPhase > 0) {
      ctx.strokeStyle = `rgba(239,227,200,${0.14 * stepA})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(g.x, g.y + 4, 8 + g.stepPhase * 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function cameraBody(cam, clock) {
    ctx.fillStyle = '#2a3446';
    ctx.fillRect(cam.x - 5, cam.y - 10, 10, 6);
    ctx.fillStyle = cam.disabled ? '#3b4553' : '#a77a36';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cam.disabled ? '#66707e' : PALETTE.amber;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = cam.disabled ? '#1b2334' : PALETTE.amber;
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 3, cam.y + Math.sin(cam.angle) * 3, 2, 0, Math.PI * 2);
    ctx.fill();
    txt(ctx, cam.disabled ? 'CUT' : 'CAM', cam.x, cam.y - 14, 9, cam.disabled ? PALETTE.teal : PALETTE.amber, 'center', '700');
  }

  function playerBody(state, clock) {
    const p = state.player;
    const alpha = p.visibility === 'HIDDEN' ? 0.3 : p.visibility === 'EXPOSED' ? 0.95 : 0.62;
    ctx.strokeStyle = `rgba(89,214,199,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.visibility === 'HIDDEN' ? 10 : 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(3,6,14,0.6)';
    ctx.beginPath();
    ctx.ellipse(p.x + 1, p.y + 6, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const bob = p.moving ? Math.sin(p.anim) * 0.8 : 0;
    ctx.fillStyle = '#d8c9a8';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + bob, p.crouched ? 7.5 : 8.5, p.crouched ? 7 : 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.teal;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#1b2334';
    ctx.beginPath();
    ctx.arc(p.x, p.y - (p.crouched ? 4 : 6), 5, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#efe3c8';
    ctx.fillRect(p.x - 4, p.y - (p.crouched ? 3 : 5), 8, 2);
    if (p.moving) {
      ctx.strokeStyle = 'rgba(27,35,52,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 3, p.y + 7);
      ctx.lineTo(p.x - 3 + Math.sin(p.anim) * 3, p.y + 11);
      ctx.moveTo(p.x + 3, p.y + 7);
      ctx.lineTo(p.x + 3 - Math.sin(p.anim) * 3, p.y + 11);
      ctx.stroke();
    }
    if (p.visibility === 'HIDDEN') {
      const label = p.inHiding ? 'HIDDEN · IN COVER' : 'HIDDEN';
      ctx.font = '700 10px system-ui, sans-serif';
      const tw = ctx.measureText(label).width + 12;
      rr(ctx, p.x - tw / 2, p.y - 30, tw, 15, 7);
      ctx.fillStyle = 'rgba(38,104,79,0.95)';
      ctx.fill();
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 1;
      ctx.stroke();
      txt(ctx, label, p.x, p.y - 19, 10, PALETTE.teal, 'center', '700');
    }
  }

  function inkClouds(gadgets) {
    for (const c of gadgets.clouds) {
      if (!c.active) continue;
      const fade = Math.min(1, c.t / 0.8);
      ctx.fillStyle = `rgba(4,7,15,${0.82 * fade})`;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2 + c.seed;
        const r = c.r * (0.55 + hash(i + c.seed) * 0.4);
        const x = c.x + Math.cos(a) * c.r * 0.26;
        const y = c.y + Math.sin(a) * c.r * 0.26;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = `rgba(91,107,127,${0.35 * fade})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function effects(state, clock) {
    const g = state.gadgets;
    for (const n of g.noises) {
      if (!n.active) continue;
      const t = Math.min(1, n.age / 0.55);
      ctx.strokeStyle = n.kind === 'decoy' ? `rgba(242,163,60,${0.55 * (1 - t)})` : `rgba(239,227,200,${0.34 * (1 - t)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 8 + n.r * t * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const p of g.particles) {
      if (!p.active) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const pop of state.popups) {
      const a = Math.min(1, pop.life * 3);
      ctx.globalAlpha = a;
      txt(ctx, pop.text, pop.x, pop.y - (1 - pop.life / pop.max) * 22, 13, pop.color, 'center', '800');
    }
    ctx.globalAlpha = 1;
  }

  function interactionPrompt(state) {
    const target = findInteract(state);
    if (target === null) return;
    const p = state.player;
    const x = target.type === 'locked' ? target.x : target.x;
    const y = target.type === 'locked' ? target.y - 18 : target.y - 14;
    ctx.fillStyle = 'rgba(8,12,22,0.86)';
    rr(ctx, x - 9, y - 10, 18, 18, 4);
    ctx.fill();
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = 1;
    ctx.stroke();
    txt(ctx, 'E', x, y + 4, 11, PALETTE.paper, 'center', '700');
    txt(ctx, target.label, x, y - 15, 9, PALETTE.paper, 'center', '700');
    if (target.type !== 'locked') {
      ctx.strokeStyle = 'rgba(239,227,200,0.22)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function vignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.8);
    g.addColorStop(0, 'rgba(2,4,10,0)');
    g.addColorStop(1, 'rgba(2,4,10,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawWorld(state) {
    const floor = state.floor;
    const p = state.player;
    const clouds = state.gadgets.clouds;
    ctx.save();
    ctx.translate(FIELD.x, FIELD.y);
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    floorBase();
    shadowRects(floor);
    inkSplats(state.gadgets);
    lightPools(floor);
    exitGate(floor, state.clock);
    for (const c of floor.lows) lowCover(c);
    for (const c of floor.talls) tallCover(c);
    walls(floor);
    signPlaque(floor);
    fuseBox(floor);
    lampFixtures(floor);
    objectiveItem(floor, state.clock);
    lootItems(floor);
    decoys(state.gadgets, state.clock);
    for (const cam of floor.cameras) {
      if (cam.disabled) continue;
      cone(cameraPolygon(cam, floor, clouds), cam.seen > 0.2 ? PALETTE.red : PALETTE.amber, 0.1);
    }
    for (const g of state.guards) cone(conePolygon(g, floor, clouds), guardColor(g), g.state === 'chase' ? 0.2 : 0.14);
    for (const cam of floor.cameras) cameraBody(cam, state.clock);
    for (const g of state.guards) guardBody(g, p, state.clock);
    playerBody(state, state.clock);
    inkClouds(state.gadgets);
    effects(state, state.clock);
    interactionPrompt(state);
    vignette();
    ctx.restore();
  }

  function drawGrain() {
    for (const d of grain) {
      ctx.fillStyle = `rgba(239,227,200,${d.a})`;
      ctx.fillRect(d.x, d.y, 1, 1);
    }
  }

  function draw(state) {
    state.ctx = ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#060a13';
    ctx.fillRect(0, 0, 1024, 576);
    if (state.floor !== null) drawWorld(state);
    if (state.mode !== 'title' && state.floor !== null) drawHud(state);
    if (state.mode === 'title') drawTitle(state);
    else if (state.mode === 'desk') drawDesk(state);
    else if (state.mode === 'paused') drawPause(state);
    else if (state.mode === 'win' || state.mode === 'lose') drawResults(state);
    else if (state.mode === 'play' || state.mode === 'transition') {
      if (state.intro > 0) drawFloorCard(state);
      if (state.caughtTimer > 0) drawCaught(state);
    }
    drawGrain();
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(201,79,61,${Math.min(0.5, state.flash * 0.5)})`;
      ctx.fillRect(0, 0, 1024, 576);
    }
    if (state.fade > 0) {
      ctx.fillStyle = `rgba(4,7,14,${state.fade})`;
      ctx.fillRect(0, 0, 1024, 576);
    }
  }

  return { draw };
}
