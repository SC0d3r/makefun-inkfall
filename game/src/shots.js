// Deterministic screenshot staging and the accelerated self-test used by ?test=1.
import { PALETTE } from './config.js';

function placeGuard(guard, x, y, angle, state, awareness, bubble) {
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.lookBase = angle;
  guard.lookClock = 0;
  guard.pauseTimer = 999;
  guard.state = state;
  guard.awareness = awareness;
  guard.bubble = bubble ?? '';
  guard.bubbleTimer = bubble ? 4 : 0;
  guard.target = { x, y };
  guard.lastSeen = { x, y };
  guard.chase = state === 'chase' ? 4 : 0;
}

export function stageShot(name, api) {
  const game = api.game;
  game.shot = true;
  if (name === 'title') {
    api.loadFloor(0);
    game.mode = 'title';
    game.intro = 0;
    game.time = 0;
    game.alarm = 0;
    game.alarmStage = 'CALM';
    placeGuard(game.guards[0], 620, 170, -2.35, 'patrol', 0, '');
    placeGuard(game.guards[1], 120, 195, 0.18, 'patrol', 0, '');
    placeGuard(game.guards[2], 520, 390, -2.9, 'patrol', 0, '');
    return;
  }
  if (name === 'desk') {
    api.loadFloor(0);
    game.mode = 'desk';
    game.intro = 0;
    game.time = 95;
    game.loot = 2;
    game.floorLoot = 2;
    game.passes = 3;
    game.maxPasses = 3;
    game.alarm = 0.28;
    game.alarmStage = 'WARY';
    game.campaign = [true, false, false];
    game.floorIndex = 0;
    game.deskChoices = api.chooseUpgrades();
    game.hoverCard = 0;
    game.player.x = 315;
    game.player.y = 308;
    game.player.crouched = true;
    game.player.lowHidden = true;
    game.player.visibility = 'HIDDEN';
    game.player.noise = 'SILENT';
    placeGuard(game.guards[0], 470, 292, Math.PI, 'suspicious', 0.62, 'What was that?');
    placeGuard(game.guards[1], 110, 190, 0.25, 'patrol', 0, '');
    placeGuard(game.guards[2], 620, 410, -2.6, 'patrol', 0, '');
    return;
  }
  if (name === 'results') {
    api.loadFloor(2);
    game.mode = 'win';
    game.intro = 0;
    game.time = 344;
    game.loot = 9;
    game.catches = 1;
    game.alarms = 1;
    game.ghostFloors = 1;
    game.passes = 2;
    game.maxPasses = 3;
    game.floorLoot = 3;
    game.campaign = [true, true, true];
    game.objectiveDone = true;
    game.exitOpen = true;
    game.floor.exit.open = true;
    game.player.x = game.floor.exit.x + 30;
    game.player.y = game.floor.exit.y + 15;
    game.player.visibility = 'DIM';
    game.player.noise = 'SILENT';
    placeGuard(game.guards[0], 720, 300, 2.15, 'suspicious', 0.6, 'What was that?');
    placeGuard(game.guards[1], 540, 150, 2.5, 'patrol', 0, '');
    placeGuard(game.guards[2], 300, 390, -0.4, 'patrol', 0, '');
    placeGuard(game.guards[3], 690, 150, 2.1, 'patrol', 0, '');
    placeGuard(game.guards[4], 240, 240, 0.8, 'patrol', 0, '');
    game.result = { win: true, rank: 'A', time: '05:44', loot: 9, catches: 1, alarms: 1, ghost: 1, score: 1900 };
    return;
  }
  // The cover: mid-heist in the Press Hall.
  api.loadFloor(0);
  game.mode = 'play';
  game.intro = 0;
  game.time = 72;
  game.loot = 2;
  game.floorLoot = 2;
  game.passes = 3;
  game.maxPasses = 3;
  game.alarm = 0.28;
  game.alarmStage = 'WARY';
  game.alarmHold = 0;
  game.objectiveDone = false;
  game.exitOpen = false;
  game.floor.exit.open = false;
  game.player.x = 315;
  game.player.y = 308;
  game.player.crouched = true;
  game.player.lowHidden = true;
  game.player.visibility = 'HIDDEN';
  game.player.noise = 'SILENT';
  game.player.moving = false;
  game.player.aim = Math.PI;
  game.player.ink = 2;
  game.player.decoys = 2;
  placeGuard(game.guards[0], 470, 292, Math.PI, 'suspicious', 0.63, 'What was that?');
  placeGuard(game.guards[1], 110, 190, 0.25, 'patrol', 0, '');
  placeGuard(game.guards[2], 640, 420, -2.5, 'patrol', 0, '');
}

const IDLE = { dx: 0, dy: 0, sneak: false, sprint: false, aim: 0 };

export function runTests(api) {
  const game = api.game;
  const STEP = api.STEP;
  const checks = [];
  const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });
  const steps = (n, ctrl = IDLE) => {
    for (let i = 0; i < n; i += 1) api.simStep(STEP, ctrl);
  };
  const fresh = (floor = 0) => {
    api.resetRun();
    if (floor !== 0) api.loadFloor(floor);
    game.intro = 0;
    game.mode = 'play';
    game.clock = 0;
  };

  fresh(0);
  check('guards spawned', game.guards.length === 3, `${game.guards.length} guards`);

  fresh(0);
  const watcher = game.guards[0];
  watcher.x = 405;
  watcher.y = 240;
  watcher.angle = -Math.PI / 2;
  watcher.lookBase = -Math.PI / 2;
  watcher.pauseTimer = 999;
  watcher.state = 'patrol';
  watcher.awareness = 0;
  game.player.x = 405;
  game.player.y = 160;
  game.player.inHiding = null;
  game.player.entering = false;
  game.player.crouched = false;
  steps(60);
  check('cone awareness rises', watcher.awareness > 0.25, watcher.awareness.toFixed(2));
  const seenAt = watcher.awareness;
  game.player.x = 90;
  game.player.y = 420;
  steps(120);
  check('awareness decays out of sight', watcher.awareness < seenAt - 0.05, watcher.awareness.toFixed(2));

  fresh(0);
  const listener = game.guards[1];
  api.emitNoise(listener.x + 8, listener.y, 120);
  steps(1);
  check('noise makes a guard suspicious', listener.state === 'suspicious', listener.state);

  fresh(0);
  const catcher = game.guards[0];
  catcher.x = game.player.x + 10;
  catcher.y = game.player.y;
  catcher.angle = Math.PI;
  catcher.lookBase = Math.PI;
  catcher.pauseTimer = 0;
  catcher.state = 'chase';
  catcher.awareness = 1;
  catcher.chase = 4;
  game.player.inHiding = null;
  steps(4);
  check('a catch costs one pass', game.passes === 2 && game.catches === 1, `passes ${game.passes}, catches ${game.catches}`);

  fresh(0);
  game.player.x = game.floor.item.x;
  game.player.y = game.floor.item.y;
  const taken = api.interact();
  check('objective pickup unlocks exit', taken === 'objective' && game.objectiveDone && game.exitOpen && game.floor.exit.open, taken);

  fresh(0);
  game.player.x = game.floor.item.x;
  game.player.y = game.floor.item.y;
  api.interact();
  game.player.x = game.floor.exit.x + 30;
  game.player.y = game.floor.exit.y + 15;
  api.simStep(STEP, IDLE);
  check('exit completes the floor', game.mode === 'transition' && game.campaign[0], game.mode);

  const floors = [];
  for (let i = 0; i < 3; i += 1) {
    fresh(i);
    game.player.x = game.floor.item.x;
    game.player.y = game.floor.item.y;
    const picked = api.interact();
    game.player.x = game.floor.exit.x + 30;
    game.player.y = game.floor.exit.y + 15;
    api.simStep(STEP, IDLE);
    floors.push({ floor: i + 1, picked, mode: game.mode, campaign: game.campaign[i] });
  }
  check('all three floors can be completed', floors.every((f) => f.picked === 'objective' && f.campaign), floors);

  fresh(1);
  const cam = game.floor.cameras[0];
  game.player.x = cam.x;
  game.player.y = cam.y + 70;
  game.player.inHiding = null;
  game.player.lowHidden = false;
  api.simStep(STEP, IDLE);
  check('camera sees the player', game.cameraSeen === true, game.cameraSeen);

  api.resetRun();
  check(
    'restart is clean',
    game.mode === 'play' && game.passes === 3 && game.loot === 0 && game.catches === 0 && game.floorIndex === 0 && game.guards.length === 3 && game.alarm === 0,
    `mode ${game.mode}, passes ${game.passes}, floor ${game.floorIndex + 1}`,
  );

  const summary = {
    ok: checks.every((c) => c.ok),
    checks,
    guards: game.guards.length,
    passes: game.passes,
    floor: game.floorIndex + 1,
    mode: game.mode,
  };
  window.__testSummary = summary;
  document.body.classList.add('test');
  const pre = document.getElementById('testout');
  if (pre) pre.textContent = JSON.stringify(summary, null, 2);
  console.log(`INKFALL TEST ${JSON.stringify(summary)}`);
  window.__shotReady = true;
}
