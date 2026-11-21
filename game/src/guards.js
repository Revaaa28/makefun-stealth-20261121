// The Lantern Vault — the lantern-guards. Each one walks a fixed patrol
// route the player can learn, then reacts: calm patrol, suspicious
// investigation of the last-seen spot, and an alert chase. Lose them in
// the dark and they cool down and go back to their route.
import { DETECTION, GUARD } from './config.js';
import { moveWithWalls } from './world.js';
import { hearsFootsteps, stateForSuspicion, suspicionRate } from './vision.js';

export function createGuard(def, index) {
  const start = def.waypoints[0];
  return {
    name: def.name,
    lantern: def.lantern,
    waypoints: def.waypoints,
    waypointIndex: 1 % def.waypoints.length,
    x: start.x,
    y: start.y,
    angle: 0,
    suspicion: 0,
    state: 'calm',
    lastSeen: null,
    blindSeconds: 0,
    pauseSeconds: 0,
    stepPhase: index * 1.7,
    stepped: false,
  };
}

function moveToward(guard, world, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const moved = moveWithWalls(world, guard.x, guard.y, (dx / dist) * step, (dy / dist) * step, GUARD.radius);
  guard.x = moved.x;
  guard.y = moved.y;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

export function updateGuard(guard, world, player, dt, events) {
  const seen = suspicionRate(world, guard, player);
  const heard = hearsFootsteps(guard, player);

  if (seen > 0) {
    guard.suspicion = Math.min(100, guard.suspicion + seen * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.blindSeconds = 0;
  } else if (heard) {
    guard.suspicion = Math.min(100, guard.suspicion + DETECTION.hearRate * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.blindSeconds = 0;
  } else {
    const hidden = player.inShadow || player.inBush;
    const decay = hidden ? DETECTION.decayHiddenPerSecond : DETECTION.decayPerSecond;
    guard.suspicion = Math.max(0, guard.suspicion - decay * dt);
    guard.blindSeconds += dt;
  }

  const nextState = stateForSuspicion(guard.suspicion);
  if (nextState !== guard.state) {
    if (nextState === 'suspicious') events.push({ type: 'spotted', guard });
    if (nextState === 'alert') events.push({ type: 'alarm', guard });
    guard.state = nextState;
    if (nextState === 'calm') guard.lastSeen = null;
  }

  if (guard.state === 'alert') {
    // Chase the last-seen spot; give up after being blind for a while.
    const target = guard.lastSeen || { x: player.x, y: player.y };
    moveToward(guard, world, target.x, target.y, GUARD.chaseSpeed, dt);
    if (guard.blindSeconds > DETECTION.loseSightSeconds) {
      guard.suspicion = DETECTION.suspiciousAt - 1;
      guard.state = 'suspicious';
    }
  } else if (guard.state === 'suspicious' && guard.lastSeen) {
    const arrived = moveToward(guard, world, guard.lastSeen.x, guard.lastSeen.y, GUARD.investigateSpeed, dt);
    if (arrived) {
      // Look around the spot, then cool down and resume the patrol.
      guard.pauseSeconds += dt;
      guard.angle += dt * 1.6;
      if (guard.pauseSeconds > 2.2) {
        guard.pauseSeconds = 0;
        guard.lastSeen = null;
        guard.suspicion = Math.min(guard.suspicion, DETECTION.suspiciousAt - 1);
      }
    }
  } else {
    // Patrol: walk the route, pausing a beat at each waypoint to look around.
    if (guard.pauseSeconds > 0) {
      guard.pauseSeconds -= dt;
      guard.angle += dt * 0.9;
    } else {
      const wp = guard.waypoints[guard.waypointIndex];
      const arrived = moveToward(guard, world, wp.x, wp.y, GUARD.patrolSpeed, dt);
      if (arrived) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.pauseSeconds = 0.7;
      }
    }
  }

  // Footstep ticks for the audio layer: true once per stride.
  guard.stepPhase += dt * (guard.state === 'alert' ? 5.2 : guard.state === 'suspicious' ? 3.6 : 2.4);
  guard.stepped = false;
  if (guard.stepPhase > Math.PI * 2) {
    guard.stepPhase -= Math.PI * 2;
    guard.stepped = true;
  }
}
