// Boot, the fixed-step loop, the run state machine and the small API the shot/test harness uses.
import { ALARM, FIELD, PLAYER, STEP, UPGRADES } from './config.js';
import { createInput } from './input.js';
import { buildFloor } from './level.js';
import { createGuards, updateGuards, updateCameras, alertGuards, EV_ALERT, EV_CATCH, EV_CAMERA, EV_NEAR } from './guards.js';
import { createPlayer, updatePlayer, interactPlayer, atExit, PL_LOOT, PL_STEP } from './player.js';
import { createGadgets, resetGadgets, throwInk, placeDecoy, updateGadgets, emitNoise, GE_SQUEAK } from './gadgets.js';
import { createRenderer } from './render.js';
import { createAudio } from './audio.js';
import { stageShot, runTests } from './shots.js';
import { DESK_CARDS, RESULT_BUTTON, TITLE_BUTTON } from './screens.js';

const params = new URLSearchParams(window.location.search);
const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const audio = createAudio();

const game = {
  mode: 'title',
  floorIndex: 0,
  floor: null,
  player: null,
  guards: [],
  gadgets: createGadgets(),
  ctx: null,
  alarm: 0,
  alarmStage: 'CALM',
  alarmHold: 0,
  alarms: 0,
  cameraSeen: false,
  passes: PLAYER.passCount,
  maxPasses: PLAYER.passCount,
  loot: 0,
  floorLoot: 0,
  catches: 0,
  floorCatches: 0,
  nearMisses: 0,
  ghostFloors: 0,
  time: 0,
  clock: 0,
  intro: 0,
  caughtTimer: 0,
  flash: 0,
  fade: 0,
  upgrades: {
    softSoles: false,
    extraInk: false,
    sparePass: false,
    quietHinges: false,
    widerLens: false,
    paperTrail: false,
  },
  deskChoices: [0, 1, 2],
  hoverCard: 0,
  result: null,
  cause: '',
  popups: [],
  campaign: [false, false, false],
  plateLoud: 0,
  objectiveDone: false,
  exitOpen: false,
  lastKnown: { x: 0, y: 0 },
  shot: false,
  transition: 0,
  nextMode: 'desk',
  catchGuard: null,
};

function stageOf(alarm) {
  if (alarm >= ALARM.cuts[2]) return 'ALARM';
  if (alarm >= ALARM.cuts[1]) return 'HUNTED';
  if (alarm >= ALARM.cuts[0]) return 'WARY';
  return 'CALM';
}

function loadFloor(index) {
  game.floorIndex = index;
  game.floor = buildFloor(index);
  game.player = createPlayer(game.floor.spawn, game.upgrades);
  game.guards = createGuards(game.floor);
  resetGadgets(game.gadgets);
  game.floorLoot = 0;
  game.floorCatches = 0;
  game.objectiveDone = false;
  game.exitOpen = false;
  game.floor.exit.open = false;
  game.alarm = 0;
  game.alarmStage = 'CALM';
  game.alarmHold = 0;
  game.cameraSeen = false;
  game.plateLoud = 0;
  game.intro = game.shot ? 0 : 2.8;
  game.caughtTimer = 0;
  game.flash = 0;
  game.fade = 0;
  game.popups.length = 0;
  game.catchGuard = null;
}

function resetRun() {
  game.passes = PLAYER.passCount;
  game.maxPasses = PLAYER.passCount;
  game.loot = 0;
  game.catches = 0;
  game.floorCatches = 0;
  game.nearMisses = 0;
  game.ghostFloors = 0;
  game.time = 0;
  game.alarms = 0;
  game.result = null;
  game.cause = '';
  game.campaign = [false, false, false];
  for (const key of Object.keys(game.upgrades)) game.upgrades[key] = false;
  loadFloor(0);
  game.mode = 'play';
}

function prepareTitle() {
  game.shot = false;
  loadFloor(0);
  game.intro = 0;
  game.mode = 'title';
}

function chooseUpgrades() {
  const order = ['softSoles', 'extraInk', 'sparePass', 'quietHinges', 'widerLens', 'paperTrail'];
  return order.filter((id) => !game.upgrades[id]).slice(0, 3).map((id) => UPGRADES.findIndex((u) => u.id === id));
}

function applyUpgrade(index) {
  const up = UPGRADES[index];
  if (!up || game.upgrades[up.id]) return;
  game.upgrades[up.id] = true;
  if (up.id === 'extraInk' && game.player) game.player.ink += 1;
  if (up.id === 'sparePass') {
    game.passes += 1;
    game.maxPasses += 1;
  }
  const next = game.floorIndex + 1;
  loadFloor(next);
  game.mode = 'play';
  game.intro = 2.8;
  audio.pickup();
  announce(`Kit chosen: ${up.name}. Floor ${game.floor.meta.number}.`);
}

function popup(text, color = '#efe3c8') {
  if (!game.player) return;
  game.popups.push({ text, x: game.player.x, y: game.player.y - 18, life: 1.35, max: 1.35, color });
  if (game.popups.length > 4) game.popups.shift();
}

function makeResult(win) {
  const score = game.loot * 100 + game.ghostFloors * 450 + (win ? 900 : 0) - game.catches * 150 - Math.floor(game.time / 10) * 5;
  const rank = score >= 2400 ? 'S' : score >= 1600 ? 'A' : score >= 800 ? 'B' : 'C';
  const s = Math.max(0, Math.floor(game.time));
  return {
    win,
    rank,
    time: `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`,
    loot: game.loot,
    catches: game.catches,
    alarms: game.alarms,
    ghost: game.ghostFloors,
    score,
  };
}

function completeFloor() {
  game.campaign[game.floorIndex] = true;
  if (game.floorCatches === 0) game.ghostFloors += 1;
  game.mode = 'transition';
  game.transition = 0.85;
  game.nextMode = game.floorIndex < 2 ? 'desk' : 'win';
  game.fade = 0;
  audio.pickup();
}

function doCatch() {
  game.catches += 1;
  game.floorCatches += 1;
  game.passes -= 1;
  game.flash = 1;
  game.caughtTimer = PLAYER.catchFreeze;
  game.alarm = 0;
  game.alarmStage = 'CALM';
  game.alarmHold = 0;
  game.cameraSeen = false;
  game.player.inHiding = null;
  game.player.entering = false;
  game.player.sprinting = false;
  audio.caught();
  if (game.passes <= 0) game.cause = 'CAUGHT THREE TIMES';
}

function finishCaught() {
  if (game.passes <= 0) {
    game.result = makeResult(false);
    game.mode = 'lose';
    audio.lose();
    return;
  }
  game.player = createPlayer(game.floor.spawn, game.upgrades);
  game.player.ink = Math.max(1, game.player.ink);
  game.guards = createGuards(game.floor);
  for (const cloud of game.gadgets.clouds) cloud.active = false;
  for (const decoy of game.gadgets.decoys) decoy.active = false;
  for (const noise of game.gadgets.noises) noise.active = false;
  game.alarm = 0;
  game.alarmStage = 'CALM';
  game.alarmHold = 0;
  game.cameraSeen = false;
  game.caughtTimer = 0;
  popup('PASS TORN · BACK TO THE ENTRANCE', '#f2a33c');
}

function simStep(dt, ctrl) {
  if (game.mode !== 'play') return;
  if (game.intro > 0) game.intro = Math.max(0, game.intro - dt);
  if (game.caughtTimer > 0) {
    game.caughtTimer -= dt;
    if (game.caughtTimer <= 0) finishCaught();
    return;
  }
  game.time += dt;
  const pe = updatePlayer(game, dt, ctrl);
  if (pe & PL_LOOT) {
    popup('+ LOOT', '#e7b64a');
    audio.pickup();
  }
  if (pe & PL_STEP) {
    const pan = (game.player.x - FIELD.w / 2) / 500;
    audio.step(pan, game.player.sprinting ? 0.08 : 0.035);
  }
  const ge = updateGadgets(game, dt);
  if (ge & GE_SQUEAK) audio.squeak();
  const guardEvents = updateGuards(game, dt);
  if (guardEvents & EV_CATCH) {
    doCatch();
    return;
  }
  if (guardEvents & EV_NEAR) {
    game.nearMisses += 1;
    popup('+ NEAR MISS', '#59d6c7');
    audio.nearMiss();
  }
  if (guardEvents & EV_ALERT) {
    popup('SPOTTED', '#c94f3d');
    audio.alert();
  }
  const cameraEvents = updateCameras(game, dt);
  if (cameraEvents & EV_CAMERA) audio.ping();

  let chasers = 0;
  for (let i = 0; i < game.guards.length; i += 1) {
    const guard = game.guards[i];
    if (guard.state === 'chase') chasers += 1;
    if (guard.awareness > 0.25) {
      game.lastKnown = { x: guard.lastSeen.x, y: guard.lastSeen.y };
    }
    if (guard.stepTick) {
      const dist = Math.hypot(guard.x - game.player.x, guard.y - game.player.y);
      const pan = (guard.x - game.player.x) / 320;
      const vol = Math.max(0.008, 0.075 - dist / 2600);
      audio.guardStep(pan, vol);
    }
  }
  if (game.plateLoud > 0) {
    game.plateLoud -= dt;
    game.alarm = Math.max(game.alarm, 0.72);
  }
  const seen = chasers > 0 || game.cameraSeen;
  if (seen) {
    game.alarm = Math.min(1, game.alarm + dt * (ALARM.rise + ALARM.riseChase * Math.min(3, chasers)));
    game.alarmHold = 0;
  } else {
    game.alarmHold += dt;
    if (game.alarmHold > ALARM.hold) game.alarm = Math.max(0, game.alarm - dt * ALARM.decay * (game.upgrades.widerLens ? 2 : 1));
  }
  const previous = game.alarmStage;
  game.alarmStage = stageOf(game.alarm);
  if (game.alarmStage === 'ALARM' && previous !== 'ALARM') {
    game.alarms += 1;
    audio.horn();
    alertGuards(game, game.lastKnown.x, game.lastKnown.y);
    popup('ALARM', '#c94f3d');
  }
  if (game.objectiveDone && atExit(game)) completeFloor();
}

function tickTimers(dt) {
  game.clock += dt;
  game.flash = Math.max(0, game.flash - dt * 1.6);
  for (let i = game.popups.length - 1; i >= 0; i -= 1) {
    game.popups[i].life -= dt;
    if (game.popups[i].life <= 0) game.popups.splice(i, 1);
  }
  if (game.mode === 'transition') {
    game.transition -= dt;
    game.fade = Math.min(1, Math.max(0, 1 - game.transition / 0.85) * 1.3);
    if (game.transition <= 0) {
      game.fade = 0;
      if (game.nextMode === 'desk') {
        game.deskChoices = chooseUpgrades();
        game.hoverCard = 0;
        game.mode = 'desk';
      } else {
        game.result = makeResult(true);
        game.mode = 'win';
        audio.win();
      }
    }
  } else if (game.fade > 0) game.fade = Math.max(0, game.fade - dt * 3);
}

function announce(message) {
  if (status) status.textContent = message;
}

const input = createInput(canvas);
let accumulator = 0;
let last = performance.now();

function readControls() {
  const p = game.player;
  const dx = (input.down('KeyD') || input.down('ArrowRight') ? 1 : 0) - (input.down('KeyA') || input.down('ArrowLeft') ? 1 : 0);
  const dy = (input.down('KeyS') || input.down('ArrowDown') ? 1 : 0) - (input.down('KeyW') || input.down('ArrowUp') ? 1 : 0);
  const mx = input.mouse.x - FIELD.x;
  const my = input.mouse.y - FIELD.y;
  return {
    dx,
    dy,
    sneak: input.down('ShiftLeft') || input.down('ShiftRight'),
    sprint: input.down('Space'),
    aim: p ? Math.atan2(my - p.y, mx - p.x) : 0,
  };
}

function inRect(mx, my, r) {
  return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
}

function handleActions(pressed, click) {
  const mx = input.mouse.x;
  const my = input.mouse.y;
  if (game.mode === 'title') {
    if ((click && inRect(mx, my, TITLE_BUTTON)) || pressed.has('Enter') || pressed.has('Space') || pressed.has('KeyE')) {
      resetRun();
      announce('Floor 1. The Press Hall.');
    }
    return;
  }
  if (game.mode === 'desk') {
    for (let i = 0; i < 3; i += 1) {
      if (pressed.has(`Digit${i + 1}`)) {
        applyUpgrade(game.deskChoices[i]);
        return;
      }
    }
    if (click) {
      for (let i = 0; i < 3; i += 1) {
        if (inRect(mx, my, DESK_CARDS[i])) {
          applyUpgrade(game.deskChoices[i]);
          return;
        }
      }
    }
    return;
  }
  if (game.mode === 'win' || game.mode === 'lose') {
    if (pressed.has('KeyR') || (click && inRect(mx, my, RESULT_BUTTON))) {
      resetRun();
      announce('A new night begins. Floor 1.');
    }
    return;
  }
  if (game.mode === 'paused') {
    if (pressed.has('Escape')) game.mode = 'play';
    else if (pressed.has('KeyR')) {
      resetRun();
      announce('Run restarted. Floor 1.');
    }
    return;
  }
  if (game.mode !== 'play' || game.caughtTimer > 0) return;
  if (pressed.has('Escape')) {
    game.mode = 'paused';
    announce('Paused.');
    return;
  }
  if (pressed.has('KeyE')) {
    const result = interactPlayer(game);
    if (result === 'objective') {
      popup(`${game.floor.item.label} TAKEN`, '#e7b64a');
      audio.pickup();
      announce(`${game.floor.item.label} taken. The ${game.floor.exit.name} is open.`);
    } else if (result === 'fuse') {
      popup('CAMERA CUT', '#59d6c7');
      audio.ping();
    } else if (result === 'hide') {
      audio.hide();
    }
  } else if (pressed.has('KeyQ')) {
    if (throwInk(game)) {
      audio.splat();
      popup('INK', '#8fa0bb');
    }
  } else if (pressed.has('KeyF')) {
    if (placeDecoy(game)) {
      audio.hide();
      popup('DECOY SET', '#f2a33c');
    }
  }
}

function updateHover() {
  if (game.mode !== 'desk') return;
  for (let i = 0; i < 3; i += 1) {
    if (inRect(input.mouse.x, input.mouse.y, DESK_CARDS[i])) {
      game.hoverCard = i;
      return;
    }
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const frameDt = Math.min(0.25, (now - last) / 1000);
  last = now;
  const pressed = input.takePressed();
  const click = input.takeClick();
  tickTimers(frameDt);
  updateHover();
  handleActions(pressed, click);
  if (game.mode === 'play') {
    const ctrl = readControls();
    accumulator += frameDt;
    while (accumulator >= STEP && game.mode === 'play') {
      simStep(STEP, ctrl);
      accumulator -= STEP;
    }
    if (game.mode !== 'play') accumulator = 0;
  } else accumulator = 0;
  renderer.draw(game);
}

const api = {
  game,
  STEP,
  loadFloor,
  resetRun,
  simStep,
  interact: () => interactPlayer(game),
  emitNoise: (x, y, r) => emitNoise(game, x, y, r, 'test'),
  chooseUpgrades,
  applyUpgrade,
  makeResult,
  tickTimers,
  setMode: (mode) => {
    game.mode = mode;
  },
};

function unlockAudio() {
  audio.unlock();
}
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

if (params.get('test') === '1') {
  prepareTitle();
  runTests(api);
} else if (params.get('shot')) {
  prepareTitle();
  stageShot(params.get('shot'), api);
  let painted = 0;
  function paint() {
    renderer.draw(game);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
} else {
  prepareTitle();
  announce('INKFALL. Click to clock in.');
  requestAnimationFrame(frame);
}
