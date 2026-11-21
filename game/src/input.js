// Keyboard, pointer position and one-shot presses. Keys are held; presses are drained once a frame.
const GAME_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'Space', 'KeyE', 'KeyQ', 'KeyF', 'KeyR', 'Escape',
  'Enter', 'Digit1', 'Digit2', 'Digit3',
]);

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const mouse = { x: 512, y: 300 };
  let click = false;

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 1024;
    mouse.y = ((event.clientY - rect.top) / rect.height) * 576;
  }

  window.addEventListener('keydown', (event) => {
    if (GAME_KEYS.has(event.code)) event.preventDefault();
    if (!event.repeat) pressed.add(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointermove', toCanvas);
  canvas.addEventListener('pointerdown', (event) => {
    toCanvas(event);
    click = true;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    down(code) {
      return held.has(code);
    },
    takePressed() {
      const out = new Set(pressed);
      pressed.clear();
      return out;
    },
    takeClick() {
      const out = click;
      click = false;
      return out;
    },
    mouse,
  };
}
