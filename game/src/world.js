// The Lantern Vault — the museum floor: walls, shadow pools, bushes,
// relics, guard routes and the exit. The level is one hand-placed room;
// every waypoint runs down an open lane so patrols never clip a wall.
import { WORLD } from './config.js';

export function buildWorld() {
  return {
    width: WORLD.width,
    height: WORLD.height,
    // Display cases and crates. These block movement and block sight.
    walls: [
      { x: 150, y: 120, w: 120, h: 40, kind: 'case' }, // north-west case
      { x: 430, y: 100, w: 120, h: 40, kind: 'case' }, // north case
      { x: 640, y: 190, w: 140, h: 40, kind: 'case' }, // east case
      { x: 180, y: 340, w: 60, h: 90, kind: 'crates' }, // west crates
      { x: 380, y: 300, w: 120, h: 40, kind: 'case' }, // centre case
      { x: 610, y: 380, w: 70, h: 80, kind: 'crates' }, // south-east crates
      { x: 300, y: 470, w: 40, h: 90, kind: 'case' }, // south pillar case
      { x: 760, y: 430, w: 120, h: 40, kind: 'case' }, // south-east case
      { x: 520, y: 180, w: 36, h: 36, kind: 'pillar' }, // marble pillar
      { x: 250, y: 520, w: 36, h: 36, kind: 'pillar' }, // marble pillar
    ],
    // Shadow pools: moonlight cannot reach here. Detection is much slower.
    shadows: [
      { x: 300, y: 250, rx: 72, ry: 46 },
      { x: 560, y: 520, rx: 82, ry: 50 },
      { x: 820, y: 300, rx: 62, ry: 42 },
      { x: 120, y: 540, rx: 70, ry: 44 },
    ],
    // Tall grass planters: hide inside them unless a guard is right on you.
    bushes: [
      { x: 350, y: 430, r: 34 },
      { x: 700, y: 120, r: 30 },
      { x: 520, y: 220, r: 28 },
      { x: 150, y: 180, r: 26 },
    ],
    // Three relics, optional but scored. Grab them, then reach the exit.
    relics: [
      { x: 330, y: 90, name: 'Moon Idol', taken: false },
      { x: 520, y: 545, name: 'Sun Coin', taken: false },
      { x: 850, y: 340, name: 'Star Mask', taken: false },
    ],
    // The green service door, top-right. Reach it unseen to win.
    exit: { x: 878, y: 24, w: 66, h: 52 },
    playerStart: { x: 60, y: 580 },
    guards: [
      {
        name: 'Warden Bram', lantern: '#f2c14e',
        waypoints: [
          { x: 90, y: 80 }, { x: 400, y: 80 }, { x: 400, y: 200 }, { x: 90, y: 200 },
        ],
      },
      {
        name: 'Keeper Sova', lantern: '#ffd94d',
        waypoints: [
          { x: 600, y: 70 }, { x: 900, y: 70 }, { x: 900, y: 320 }, { x: 600, y: 320 },
        ],
      },
      {
        name: 'Patrol Marek', lantern: '#f2c14e',
        waypoints: [
          { x: 90, y: 470 }, { x: 250, y: 470 }, { x: 250, y: 300 }, { x: 90, y: 300 },
        ],
      },
      {
        name: 'Lantern Ilya', lantern: '#ffd94d',
        waypoints: [
          { x: 700, y: 540 }, { x: 900, y: 540 }, { x: 900, y: 380 }, { x: 700, y: 380 },
        ],
      },
    ],
  };
}

// True when point (px, py) is inside any wall rectangle.
export function pointInWall(world, px, py) {
  for (const w of world.walls) {
    if (px >= w.x && px <= w.x + w.w && py >= w.y && py <= w.y + w.h) return true;
  }
  return false;
}

// True when point (px, py) is inside a shadow pool (ellipse test).
export function pointInShadow(world, px, py) {
  for (const s of world.shadows) {
    const dx = (px - s.x) / s.rx;
    const dy = (py - s.y) / s.ry;
    if (dx * dx + dy * dy <= 1) return true;
  }
  return false;
}

// True when point (px, py) is inside a bush circle.
export function pointInBush(world, px, py) {
  for (const b of world.bushes) {
    const dx = px - b.x;
    const dy = py - b.y;
    if (dx * dx + dy * dy <= b.r * b.r) return true;
  }
  return false;
}

// Move a circle (radius r) from (x, y) by (dx, dy), sliding along walls.
// Returns the new position; the border walls of the room also block.
export function moveWithWalls(world, x, y, dx, dy, r) {
  let nx = x + dx;
  let ny = y + dy;
  const blocked = (cx, cy) => {
    if (cx < 16 + r || cx > world.width - 16 - r) return true;
    if (cy < 16 + r || cy > world.height - 16 - r) return true;
    for (const w of world.walls) {
      const nearX = Math.max(w.x, Math.min(cx, w.x + w.w));
      const nearY = Math.max(w.y, Math.min(cy, w.y + w.h));
      const ddx = cx - nearX;
      const ddy = cy - nearY;
      if (ddx * ddx + ddy * ddy < r * r) return true;
    }
    return false;
  };
  if (!blocked(nx, y)) x = nx;
  if (!blocked(x, ny)) y = ny;
  return { x, y };
}
