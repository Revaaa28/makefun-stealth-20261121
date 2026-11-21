// Maker's play-test + screenshot driver for The Lantern Vault.
// Serves game/ on :8080 first (node serve.ts in another shell), then:
//   node shots.mjs shots   — take the 4 screenshots into screenshots/
//   node shots.mjs test    — play-test: move, sneak, detect, win, caught
// Uses the Playwright install already on this machine.
import { chromium } from '/home/hatch/workspace/tools/pwcli/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:8080';
const SHOTS = [
  { name: '1-cover.jpg', query: '?shot=cover' },
  { name: '2-mid-sneak.jpg', query: '?shot=mid' },
  { name: '3-alert.jpg', query: '?shot=alert' },
  { name: '4-win.jpg', query: '?shot=win' },
];

const browser = await chromium.launch({
  executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome`,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

const mode = process.argv[2] ?? 'shots';
const state = () => page.evaluate(() => window.__vault.state());

if (mode === 'shots') {
  for (const shot of SHOTS) {
    await page.goto(`${BASE}/${shot.query}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `screenshots/${shot.name}`, type: 'jpeg', quality: 82 });
    console.log(`shot ${shot.name} state=`, JSON.stringify(await state()));
  }
} else if (mode === 'test') {
  const restart = async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  };

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  console.log('title:', JSON.stringify(await state()));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  console.log('after Enter:', JSON.stringify(await state()));

  // Walk right for 1s: the thief must move.
  const before = await state();
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1000);
  await page.keyboard.up('KeyD');
  const after = await state();
  console.log('walk right: x', before.player.x, '->', after.player.x, before.player.x < after.player.x ? 'MOVED OK' : 'DID NOT MOVE');

  // Sneak up: slow movement still moves.
  const s0 = await state();
  await page.keyboard.down('Shift');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1000);
  await page.keyboard.up('KeyW');
  await page.keyboard.up('Shift');
  const s1 = await state();
  console.log('sneak up: y', s0.player.y, '->', s1.player.y, s1.player.y < s0.player.y ? 'SNEAK MOVED OK' : 'SNEAK FAILED');

  // Detection: drop the thief in Warden Bram's patrol lane, briefly, then
  // slip away before he can close in and catch the stationary thief.
  await page.evaluate(() => window.__vault.teleport(300, 80));
  await page.waitForTimeout(900);
  const seen = await state();
  console.log('detection at (300,80):', JSON.stringify(seen.suspicion), 'screen=', seen.screen);
  const maxS = Math.max(...seen.suspicion.map((g) => g.suspicion));
  console.log(maxS > 10 ? 'SUSPICION RISING OK' : 'SUSPICION DID NOT RISE');

  // Recovery: slip to a far shadow pool the guard cannot see, watch it fall.
  await page.evaluate(() => window.__vault.teleport(560, 520));
  await page.waitForTimeout(3000);
  const hidden = await state();
  const maxS2 = Math.max(...hidden.suspicion.map((g) => g.suspicion));
  console.log('recovery in shadow: peak', maxS, '->', maxS2, 'screen=', hidden.screen, maxS2 < maxS ? 'DECAY OK' : 'NO DECAY');

  // Relic pickup on a fresh run: teleport onto the Moon Idol.
  await restart();
  await page.evaluate(() => window.__vault.teleport(330, 90));
  await page.waitForTimeout(400);
  const relic = await state();
  console.log('relic pickup:', JSON.stringify(relic), relic.relics === 1 ? 'RELIC OK' : 'RELIC FAILED');

  // Win on a fresh run: teleport into the exit door.
  await restart();
  await page.evaluate(() => window.__vault.teleport(905, 50));
  await page.waitForTimeout(400);
  const win = await state();
  console.log('win check:', JSON.stringify(win), win.screen === 'win' ? 'WIN OK' : 'WIN FAILED');

  // Caught on a fresh run: stand in Bram's lane until he closes in.
  await restart();
  await page.evaluate(() => window.__vault.teleport(300, 80));
  let caught = false;
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(1000);
    const c = await state();
    if (c.screen === 'caught') { caught = true; console.log('caught check:', JSON.stringify(c), 'CAUGHT OK'); break; }
  }
  if (!caught) console.log('caught check: NOT CAUGHT after 10s — check guard chase');
}

console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
