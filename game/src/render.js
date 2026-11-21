// The Lantern Vault — everything drawn on the canvas: the moonlit floor,
// display cases, shadow pools, bushes, relics, the exit door, the guards
// with their vision cones, the thief, and the HUD and screens.
import { COLOURS, GUARD } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, world, time) {
  const tile = 64;
  for (let ty = 0; ty < world.height / tile; ty++) {
    for (let tx = 0; tx < world.width / tile; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLOURS.floorA : COLOURS.floorB;
      ctx.fillRect(tx * tile, ty * tile, tile, tile);
    }
  }
  ctx.strokeStyle = COLOURS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= world.width; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, world.height); ctx.stroke();
  }
  for (let y = 0; y <= world.height; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(world.width, y); ctx.stroke();
  }
  // Moonlight wash from the top-left, so the lit floor reads at a glance.
  const wash = ctx.createLinearGradient(0, 0, world.width, world.height);
  wash.addColorStop(0, 'rgba(150, 180, 255, 0.07)');
  wash.addColorStop(1, 'rgba(150, 180, 255, 0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, world.width, world.height);
  void time;
}

function drawWalls(ctx, world) {
  // Room border.
  ctx.fillStyle = '#171a21';
  ctx.fillRect(0, 0, world.width, 16);
  ctx.fillRect(0, world.height - 16, world.width, 16);
  ctx.fillRect(0, 0, 16, world.height);
  ctx.fillRect(world.width - 16, 0, 16, world.height);
  ctx.strokeStyle = COLOURS.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, world.width - 32, world.height - 32);

  for (const w of world.walls) {
    ctx.fillStyle = COLOURS.wallFace;
    roundRect(ctx, w.x, w.y, w.w, w.h, 6);
    ctx.fill();
    ctx.fillStyle = COLOURS.wallTop;
    roundRect(ctx, w.x + 4, w.y + 4, w.w - 8, w.h - 8, 4);
    ctx.fill();
    ctx.strokeStyle = COLOURS.wallTrim;
    ctx.lineWidth = 2;
    roundRect(ctx, w.x, w.y, w.w, w.h, 6);
    ctx.stroke();
    if (w.kind === 'case') {
      // Glass glint on the display case.
      ctx.strokeStyle = 'rgba(220, 235, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w.x + 10, w.y + w.h - 10);
      ctx.lineTo(w.x + w.w - 10, w.y + 10);
      ctx.stroke();
    }
    if (w.kind === 'crates') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w.x + w.w / 2, w.y + 4);
      ctx.lineTo(w.x + w.w / 2, w.y + w.h - 4);
      ctx.stroke();
    }
  }
}

function drawCover(ctx, world) {
  // Shadow pools: darker ground, clearly safer.
  for (const s of world.shadows) {
    ctx.fillStyle = COLOURS.shadowPool;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 150, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Bushes: tall grass planters to hide in.
  for (const b of world.bushes) {
    ctx.fillStyle = COLOURS.bushDark;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLOURS.bush;
    ctx.beginPath(); ctx.arc(b.x - 4, b.y - 4, b.r - 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7fc98a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(b.x + Math.cos(a) * (b.r - 14), b.y + Math.sin(a) * (b.r - 14));
      ctx.lineTo(b.x + Math.cos(a) * (b.r - 2), b.y + Math.sin(a) * (b.r - 2));
      ctx.stroke();
    }
  }
}

function drawRelics(ctx, world, time) {
  for (const relic of world.relics) {
    if (relic.taken) continue;
    const pulse = 1 + Math.sin(time * 3 + relic.x) * 0.12;
    const glow = ctx.createRadialGradient(relic.x, relic.y, 2, relic.x, relic.y, 34 * pulse);
    glow.addColorStop(0, 'rgba(255, 217, 77, 0.5)');
    glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(relic.x, relic.y, 34 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(relic.x, relic.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLOURS.relic;
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = '#8a6d00';
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.restore();
    ctx.fillStyle = '#fff6c9';
    ctx.beginPath(); ctx.arc(relic.x - 3, relic.y - 3, 3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawExit(ctx, world, time) {
  const e = world.exit;
  const pulse = 0.5 + Math.sin(time * 2.4) * 0.2;
  const glow = ctx.createRadialGradient(e.x + e.w / 2, e.y + e.h / 2, 4, e.x + e.w / 2, e.y + e.h / 2, 90);
  glow.addColorStop(0, `rgba(55, 214, 122, ${0.45 + pulse * 0.3})`);
  glow.addColorStop(1, 'rgba(55, 214, 122, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(e.x - 60, e.y - 60, e.w + 120, e.h + 120);
  ctx.fillStyle = COLOURS.exitDark;
  roundRect(ctx, e.x, e.y, e.w, e.h, 6);
  ctx.fill();
  ctx.fillStyle = COLOURS.exitGlow;
  roundRect(ctx, e.x + 4, e.y + 4, e.w - 8, e.h - 8, 4);
  ctx.fill();
  ctx.fillStyle = '#062b16';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 1);
}

function coneColour(guard) {
  if (guard.state === 'alert') return COLOURS.coneAlert;
  if (guard.state === 'suspicious') return COLOURS.coneSuspicious;
  return COLOURS.coneCalm;
}

function drawGuard(ctx, guard, time) {
  // Vision cone.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, GUARD.sightRange, guard.angle - GUARD.sightHalfAngle, guard.angle + GUARD.sightHalfAngle);
  ctx.closePath();
  ctx.fillStyle = coneColour(guard);
  ctx.fill();
  ctx.restore();

  // Lantern glow.
  const glow = ctx.createRadialGradient(guard.x, guard.y, 2, guard.x, guard.y, 46);
  glow.addColorStop(0, guard.state === 'alert' ? 'rgba(255, 59, 48, 0.55)' : 'rgba(242, 193, 78, 0.45)');
  glow.addColorStop(1, 'rgba(242, 193, 78, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 46, 0, Math.PI * 2); ctx.fill();

  // Body: uniformed guard with a lantern.
  ctx.fillStyle = guard.state === 'alert' ? '#7a1f1a' : '#4a3220';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = guard.state === 'alert' ? COLOURS.guardAlert : COLOURS.guardCalm;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = guard.lantern;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 5.5, 0, Math.PI * 2); ctx.fill();
  // Facing tick.
  ctx.strokeStyle = guard.lantern;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x + Math.cos(guard.angle) * 10, guard.y + Math.sin(guard.angle) * 10);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * 20, guard.y + Math.sin(guard.angle) * 20);
  ctx.stroke();

  // Suspicion arc above the guard.
  if (guard.suspicion > 2) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(guard.x, guard.y - 24, 11, -Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = guard.state === 'alert' ? COLOURS.guardAlert : guard.state === 'suspicious' ? COLOURS.guardSuspicious : '#ffe9a8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - 24, 11, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
  }
  if (guard.state === 'alert') {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 34 + Math.sin(time * 8) * 2);
  } else if (guard.state === 'suspicious') {
    ctx.fillStyle = '#ff9f1c';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 34);
  }
}

function drawPlayer(ctx, player, time) {
  // Noise ring while moving: running is loud, sneaking is quiet.
  if (player.moving) {
    const radius = player.sneaking ? 26 : 92;
    ctx.strokeStyle = player.sneaking ? 'rgba(200, 220, 255, 0.25)' : 'rgba(255, 220, 120, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(player.x, player.y, radius, 0, Math.PI * 2); ctx.stroke();
  }
  // Shadow cloak: the thief melts into the dark when hidden.
  const hidden = player.inShadow || player.inBush;
  ctx.globalAlpha = hidden ? 0.55 : 1;
  const bob = player.moving ? Math.sin(time * (player.sneaking ? 6 : 11)) * 1.5 : 0;
  ctx.fillStyle = COLOURS.playerCloak;
  ctx.beginPath(); ctx.arc(player.x, player.y + bob * 0.4, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLOURS.player;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(player.x, player.y + bob * 0.4, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = COLOURS.player;
  ctx.beginPath(); ctx.arc(player.x, player.y - 3 + bob * 0.4, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1c2030';
  ctx.beginPath(); ctx.arc(player.x - 2.4, player.y - 4 + bob * 0.4, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(player.x + 2.4, player.y - 4 + bob * 0.4, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  if (player.sneaking) {
    ctx.fillStyle = '#9db4ff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', player.x, player.y + 26);
  }
}

function drawHud(ctx, game, world) {
  const maxSuspicion = Math.max(0, ...game.guards.map((g) => g.suspicion));
  const barW = 220;
  const barX = 24;
  const barY = 18;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  roundRect(ctx, 12, 10, 936, 44, 8);
  ctx.fill();
  // Suspicion meter.
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPOTTED', barX, barY + 9);
  ctx.fillStyle = '#222';
  roundRect(ctx, barX + 70, barY, barW, 16, 8);
  ctx.fill();
  const fill = maxSuspicion / 100;
  ctx.fillStyle = fill >= 1 ? '#ff3b30' : fill >= 0.6 ? '#ff9f1c' : '#ffd94d';
  if (fill > 0.01) {
    roundRect(ctx, barX + 70, barY, Math.max(14, barW * fill), 16, 8);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.fillText(`${Math.round(maxSuspicion)}%`, barX + 70 + barW + 10, barY + 9);

  // Relics, timer, alerts.
  const relicsTaken = world.relics.filter((r) => r.taken).length;
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`◆ Relics ${relicsTaken}/3`, 420, barY + 9);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`⏱ ${formatTime(game.elapsed)}`, 560, barY + 9);
  ctx.fillText(`⚠ Alerts ${game.alerts}`, 680, barY + 9);
  ctx.fillStyle = game.muted ? '#ff9f1c' : '#9db4ff';
  ctx.fillText(game.muted ? 'MUTED (M)' : 'M = mute', 830, barY + 9);

  // Legend along the bottom: what is safe, at a glance.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  roundRect(ctx, 12, world.height - 34, 936, 24, 8);
  ctx.fill();
  ctx.fillStyle = '#cfd6e4';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'WASD / arrows move  •  SHIFT sneak (slow, quiet)  •  dark shadow pools + bushes hide you  •  grab the relics, reach the green EXIT',
    world.width / 2,
    world.height - 22,
  );
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function overlay(ctx, world, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 7, 14, 0.78)';
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, world.width / 2, world.height / 2 - 90);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, world.width / 2, world.height / 2 - 30 + i * 28);
  });
}

export function render(ctx, game, world, time) {
  const w = world.width;
  const h = world.height;
  ctx.clearRect(0, 0, w, h);
  drawFloor(ctx, world, time);
  drawCover(ctx, world);
  drawExit(ctx, world, time);
  drawRelics(ctx, world, time);
  drawWalls(ctx, world);
  for (const guard of game.guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, game.player, time);

  // Alarm pulse: the whole room flashes when a guard raises the alarm.
  if (game.alarmPulse > 0) {
    ctx.strokeStyle = `rgba(255, 59, 48, ${Math.min(0.8, game.alarmPulse)})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);
  }

  drawHud(ctx, game, world);

  if (game.screen === 'title') {
    overlay(ctx, world, 'THE LANTERN VAULT', [
      'A night thief. A moonlit museum. Four lantern-guards on patrol.',
      'Sneak through the shadows, hide behind the cases, steal 3 relics,',
      'and slip out the green EXIT unseen.',
      '',
      'WASD / arrows — move      SHIFT — sneak      M — mute',
      '',
      'Press ENTER or click to begin the heist',
    ], '#ffd94d');
  } else if (game.screen === 'win') {
    overlay(ctx, world, 'CLEAN GETAWAY!', [
      `Time ${formatTime(game.elapsed)}   •   Relics ${world.relics.filter((r) => r.taken).length}/3   •   Alerts ${game.alerts}`,
      game.rankLabel,
      '',
      'Press ENTER to steal again',
    ], '#37d67a');
  } else if (game.screen === 'caught') {
    overlay(ctx, world, 'CAUGHT!', [
      `${game.caughtBy} shone a lantern in your face.`,
      `Relics ${world.relics.filter((r) => r.taken).length}/3   •   Time ${formatTime(game.elapsed)}`,
      '',
      'Press ENTER to try again',
    ], '#ff3b30');
  }

  // Cover banner for the title screenshot: the game's name over the level.
  if (game.coverBanner) {
    ctx.fillStyle = 'rgba(5, 7, 14, 0.72)';
    roundRect(ctx, w / 2 - 330, 78, 660, 108, 12);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    roundRect(ctx, w / 2 - 330, 78, 660, 108, 12);
    ctx.stroke();
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 46px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THE LANTERN VAULT', w / 2, 122);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '16px sans-serif';
    ctx.fillText('a stealth heist — dodge the lantern-guards • steal 3 relics • reach the EXIT', w / 2, 160);
  }
}
