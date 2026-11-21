// The Lantern Vault — sight and hearing. A guard sees the player only
// inside the vision cone, inside range, with a clear line of sight past
// the display cases; shadows, bushes and sneaking slow the suspicion
// meter, and running footsteps can be heard around a corner.
import { DETECTION, GUARD } from './config.js';
import { pointInBush, pointInShadow } from './world.js';

// Do the segments (x1,y1)-(x2,y2) and (x3,y3)-(x4,y4) cross?
function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  const d3 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d4 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// True when the straight line from guard to player is not cut by a wall.
export function hasLineOfSight(world, gx, gy, px, py) {
  for (const w of world.walls) {
    if (segmentsCross(gx, gy, px, py, w.x, w.y, w.x + w.w, w.y)) return false;
    if (segmentsCross(gx, gy, px, py, w.x + w.w, w.y, w.x + w.w, w.y + w.h)) return false;
    if (segmentsCross(gx, gy, px, py, w.x + w.w, w.y + w.h, w.x, w.y + w.h)) return false;
    if (segmentsCross(gx, gy, px, py, w.x, w.y + w.h, w.x, w.y)) return false;
  }
  return true;
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// How fast this guard's suspicion should rise right now (per second).
// Returns 0 when the player cannot be seen at all.
export function suspicionRate(world, guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.sightRange) return 0;
  const facing = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(facing, guard.angle)) > GUARD.sightHalfAngle) return 0;
  if (!hasLineOfSight(world, guard.x, guard.y, player.x, player.y)) return 0;

  const inBush = pointInBush(world, player.x, player.y);
  if (inBush && dist > DETECTION.bushRevealDistance) return 0;

  // Nearer = spotted faster; the rate fades linearly to the cone's edge.
  const closeness = 1 - dist / GUARD.sightRange;
  let rate = DETECTION.baseFar + (DETECTION.baseClose - DETECTION.baseFar) * closeness;
  if (player.sneaking) rate *= DETECTION.sneakFactor;
  else rate *= DETECTION.runFactor;
  if (pointInShadow(world, player.x, player.y)) rate *= DETECTION.shadowFactor;
  if (inBush) rate *= DETECTION.bushFactor;
  return rate;
}

// True when the guard can hear the player's running footsteps.
export function hearsFootsteps(guard, player) {
  if (player.sneaking) return false;
  const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
  return dist < GUARD.hearDistance && player.moving;
}

// The guard's current state from its suspicion meter.
export function stateForSuspicion(suspicion) {
  if (suspicion >= DETECTION.alertAt) return 'alert';
  if (suspicion >= DETECTION.suspiciousAt) return 'suspicious';
  return 'calm';
}
