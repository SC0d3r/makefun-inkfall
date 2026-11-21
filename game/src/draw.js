// Small Canvas 2D primitives shared by the world, HUD and screens: cards, text, wrapped text.
import { FONT } from './config.js';

const fontCache = new Map();

export function font(size, weight = '400', family = FONT) {
  const key = `${weight}|${size}|${family}`;
  let value = fontCache.get(key);
  if (value === undefined) {
    value = `${weight} ${size}px ${family}`;
    fontCache.set(key, value);
  }
  return value;
}

export function rr(ctx, x, y, w, h, r = 4) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function txt(ctx, value, x, y, size, color, align = 'left', weight = '400', family = FONT) {
  ctx.font = font(size, weight, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

export function spaced(ctx, value, x, y, size, color, gap = 2, align = 'left', weight = '700') {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  let width = gap * (value.length - 1);
  for (let i = 0; i < value.length; i += 1) width += ctx.measureText(value[i]).width;
  let at = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  ctx.textAlign = 'left';
  for (let i = 0; i < value.length; i += 1) {
    ctx.fillText(value[i], at, y);
    at += ctx.measureText(value[i]).width + gap;
  }
  return width;
}

export function wrap(ctx, value, x, y, maxWidth, size, lineHeight, color, weight = '400') {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const words = value.split(' ');
  let line = '';
  let cursor = y;
  for (const word of words) {
    const test = line === '' ? word : `${line} ${word}`;
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      ctx.fillText(line, x, cursor);
      cursor += lineHeight;
      line = word;
    } else line = test;
  }
  if (line !== '') {
    ctx.fillText(line, x, cursor);
    cursor += lineHeight;
  }
  return cursor - y;
}

export function card(ctx, x, y, w, h, fill = '#efe3c8', stroke = null, r = 6) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function rgba(hex, alpha) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function bar(ctx, x, y, w, h, value, color, back = '#23304a') {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = back;
  ctx.fill();
  if (value > 0) {
    rr(ctx, x, y, Math.max(2, w * Math.min(1, value)), h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

export function circle(ctx, x, y, r, fill, stroke = null, line = 1) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;
    ctx.stroke();
  }
}
