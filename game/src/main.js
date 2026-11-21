// The Lantern Vault — the game loop. Owns the screens (title / play /
// win / caught), moves the thief, updates the guards, collects relics,
// checks the exit and the catch, and stages the four screenshot scenes
// the maker takes with ?shot=cover|mid|alert|win.
import { COLOURS, GUARD, PLAYER, RANKS, WORLD } from './config.js';
import { buildWorld, moveWithWalls, pointInBush, pointInShadow } from './world.js';
import { createGuard, updateGuard } from './guards.js';
import { createInput, consumePresses, moveDirection } from './input.js';
import { createAudio } from './audio.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / WORLD.width, window.innerHeight / WORLD.height);
  canvas.width = Math.floor(WORLD.width * scale);
  canvas.height = Math.floor(WORLD.height * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const input = createInput(canvas);
const audio = createAudio();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const game = {
  screen: 'title',
  world: buildWorld(),
  guards: [],
  player: null,
  elapsed: 0,
  alerts: 0,
  alarmPulse: 0,
  caughtBy: '',
  rankLabel: '',
  muted: false,
  coverBanner: false,
  frozen: false,
};

function resetGame() {
  game.world = buildWorld();
  game.guards = game.world.guards.map((def, i) => createGuard(def, i));
  game.player = {
    x: game.world.playerStart.x,
    y: game.world.playerStart.y,
    angle: 0,
    sneaking: false,
    moving: false,
    inShadow: false,
    inBush: false,
    stepAcc: 0,
  };
  game.elapsed = 0;
  game.alerts = 0;
  game.alarmPulse = 0;
  game.caughtBy = '';
  game.rankLabel = '';
  game.screen = 'play';
}

function rankFor(relics, alerts) {
  if (relics >= RANKS.ghost.minRelics && alerts <= RANKS.ghost.maxAlerts) return RANKS.ghost.label;
  if (relics >= RANKS.shadow.minRelics && alerts <= RANKS.shadow.maxAlerts) return RANKS.shadow.label;
  if (relics >= RANKS.thief.minRelics) return RANKS.thief.label;
  return RANKS.runner.label;
}

function winGame() {
  const relics = game.world.relics.filter((r) => r.taken).length;
  game.rankLabel = rankFor(relics, game.alerts);
  game.screen = 'win';
  audio.win();
}

function catchPlayer(guard) {
  game.caughtBy = guard.name;
  game.screen = 'caught';
  audio.caught();
}

function update(dt) {
  const presses = consumePresses(input);
  if (presses.mute) game.muted = audio.toggleMute();
  if (presses.anyKey || presses.click) audio.unlock();

  if (game.screen === 'title') {
    if (presses.enter || presses.click) resetGame();
    return;
  }
  if (game.screen === 'win' || game.screen === 'caught') {
    if (presses.enter || presses.click) {
      game.screen = 'title';
    }
    return;
  }
  if (game.frozen) return;

  game.elapsed += dt;
  game.alarmPulse = Math.max(0, game.alarmPulse - dt * 1.4);

  // Move the thief.
  const dir = moveDirection(input);
  const p = game.player;
  p.sneaking = input.sneakHeld;
  p.moving = dir.x !== 0 || dir.y !== 0;
  if (p.moving) {
    const speed = p.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    const moved = moveWithWalls(game.world, p.x, p.y, dir.x * speed * dt, dir.y * speed * dt, PLAYER.radius);
    p.x = moved.x;
    p.y = moved.y;
    p.angle = Math.atan2(dir.y, dir.x);
    p.stepAcc += dt * (p.sneaking ? 3.2 : 5.4);
    if (p.stepAcc > 1) {
      p.stepAcc -= 1;
      audio.footstep(0.9);
    }
  }
  p.inShadow = pointInShadow(game.world, p.x, p.y);
  p.inBush = pointInBush(game.world, p.x, p.y);

  // Guards see, hear, chase — and their state changes raise events.
  const events = [];
  for (const guard of game.guards) {
    updateGuard(guard, game.world, p, dt, events);
    if (guard.stepped) {
      const dist = Math.hypot(guard.x - p.x, guard.y - p.y);
      audio.guardStep(Math.max(0, 1 - dist / 320));
    }
  }
  for (const event of events) {
    if (event.type === 'alarm') {
      game.alerts += 1;
      game.alarmPulse = 1;
      audio.alarm();
    } else if (event.type === 'spotted') {
      audio.spotted();
    }
  }

  // Caught: an alert guard touches the thief.
  for (const guard of game.guards) {
    if (guard.state === 'alert' && Math.hypot(guard.x - p.x, guard.y - p.y) < GUARD.catchDistance + PLAYER.radius) {
      catchPlayer(guard);
      return;
    }
  }

  // Relics: step close to collect.
  for (const relic of game.world.relics) {
    if (!relic.taken && Math.hypot(relic.x - p.x, relic.y - p.y) < 26) {
      relic.taken = true;
      audio.pickup();
    }
  }

  // Exit: step into the green door to win.
  const e = game.world.exit;
  if (p.x > e.x - 4 && p.x < e.x + e.w + 4 && p.y > e.y - 4 && p.y < e.y + e.h + 4) {
    winGame();
  }
}

// Staged scenes for the maker's screenshots (?shot=...). Each one sets
// a real game state — patrols, cones, suspicion, screens — then freezes
// it so the render is deterministic.
function applyShot() {
  if (!shot) return;
  resetGame();
  game.frozen = true;
  const [g1, g2, g3, g4] = game.guards;

  if (shot === 'cover') {
    // Level overview: thief mid-floor, cones sweeping, exit glowing.
    game.player.x = 470; game.player.y = 430;
    game.player.sneaking = true; game.player.moving = true;
    g1.x = 300; g1.y = 130; g1.angle = 0.4;
    g2.x = 760; g2.y = 140; g2.angle = 2.6;
    g3.x = 170; g3.y = 380; g3.angle = -0.5;
    g4.x = 800; g4.y = 500; g4.angle = Math.PI;
    game.world.relics[0].taken = true;
    game.elapsed = 87;
    game.coverBanner = true;
  } else if (shot === 'mid') {
    // Mid-sneak: thief crouched behind the centre case, a cone sweeping near.
    game.player.x = 440; game.player.y = 368;
    game.player.sneaking = true; game.player.moving = true;
    game.player.inShadow = true;
    g1.x = 400; g1.y = 250; g1.angle = 1.35; g1.suspicion = 34; g1.state = 'calm';
    g2.x = 700; g2.y = 120; g2.angle = 2.2;
    g3.x = 200; g3.y = 460; g3.angle = 0.2;
    g4.x = 850; g4.y = 480; g4.angle = Math.PI;
    game.world.relics[0].taken = true;
    game.elapsed = 132;
  } else if (shot === 'alert') {
    // Alarm: Keeper Sova has spotted the thief and is chasing, cone red.
    game.player.x = 700; game.player.y = 230;
    game.player.sneaking = false; game.player.moving = true;
    g2.x = 640; g2.y = 190; g2.angle = 0.6; g2.suspicion = 92; g2.state = 'alert';
    g2.lastSeen = { x: 700, y: 230 };
    g1.x = 320; g1.y = 90; g1.angle = 0.3; g1.suspicion = 41; g1.state = 'calm';
    g3.x = 150; g3.y = 420; g3.angle = -0.4;
    g4.x = 780; g4.y = 520; g4.angle = 2.8; g4.suspicion = 18; g4.state = 'calm';
    game.alerts = 1;
    game.alarmPulse = 0.85;
    game.elapsed = 154;
  } else if (shot === 'win') {
    // Getaway: thief at the green door, all three relics, clean run.
    game.player.x = 905; game.player.y = 52;
    g1.x = 200; g1.y = 150; g1.angle = 0.9;
    g2.x = 700; g2.y = 280; g2.angle = 2.4;
    g3.x = 180; g3.y = 380; g3.angle = 0.1;
    g4.x = 760; g4.y = 520; g4.angle = Math.PI;
    for (const relic of game.world.relics) relic.taken = true;
    game.elapsed = 161;
    game.alerts = 0;
    game.rankLabel = RANKS.ghost.label;
    game.screen = 'win';
  }
}

// Start on the title screen with a live level behind it.
resetGame();
game.screen = 'title';
if (shot) applyShot();

let last = performance.now();
let lastTickAt = 0;
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  lastTickAt = now;
  update(dt);
  render(ctx, game, game.world, now / 1000);
}
function frame(now) {
  tick(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// A headless browser may throttle requestAnimationFrame to almost nothing;
// this timer keeps the game alive, firing only when rAF has stalled.
setInterval(() => {
  const now = performance.now();
  if (now - lastTickAt > 120) tick(now);
}, 50);

// Exposed for the maker's play-tests: window.__vault.state(), and a
// teleport so a test can place the thief in front of a guard, at the
// exit, or inside a shadow pool without walking the whole level.
window.__vault = {
  state() {
    return {
      screen: game.screen,
      player: { x: Math.round(game.player.x), y: Math.round(game.player.y) },
      suspicion: game.guards.map((g) => ({ name: g.name, state: g.state, suspicion: Math.round(g.suspicion), x: Math.round(g.x), y: Math.round(g.y), blind: +g.blindSeconds.toFixed(1), lastSeen: g.lastSeen })),
      relics: game.world.relics.filter((r) => r.taken).length,
      alerts: game.alerts,
      elapsed: Math.round(game.elapsed),
    };
  },
  teleport(x, y) {
    game.player.x = x;
    game.player.y = y;
  },
};
