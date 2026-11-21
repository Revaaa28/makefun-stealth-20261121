// The Lantern Vault — tuning constants. One place for every number that
// shapes how the heist feels: speeds, sight, suspicion and scoring.
export const WORLD = { width: 960, height: 640 };

export const PLAYER = {
  radius: 13,
  walkSpeed: 168,
  sneakSpeed: 88,
  runSpeed: 168, // running is the walk speed; sneak is the slow quiet mode
  noiseWalk: 92, // how far running footsteps carry (px)
  noiseSneak: 26,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 56,
  investigateSpeed: 84,
  chaseSpeed: 138,
  sightRange: 232,
  sightHalfAngle: 0.61, // ~35 degrees each side of facing
  catchDistance: 24,
  hearDistance: 118, // running footsteps heard inside this range
};

export const DETECTION = {
  baseClose: 58, // suspicion per second when the player is near and lit
  baseFar: 13, // suspicion per second at the edge of sight
  sneakFactor: 0.5,
  runFactor: 1.45,
  shadowFactor: 0.45, // standing in a shadow pool
  bushFactor: 0.06, // hidden in tall grass, unless the guard is on top of you
  bushRevealDistance: 46,
  hearRate: 20, // suspicion per second from heard footsteps
  decayPerSecond: 22, // suspicion falling while unseen
  decayHiddenPerSecond: 36, // falling while in shadow or bush
  suspiciousAt: 60, // guard starts investigating
  alertAt: 100, // guard starts chasing
  loseSightSeconds: 3, // alert guard gives up after this long blind
};

export const COLOURS = {
  floorA: '#20242e',
  floorB: '#232833',
  floorLine: '#2b3040',
  wallTop: '#4a3b28',
  wallFace: '#33291c',
  wallTrim: '#c9a227',
  shadowPool: 'rgba(8, 10, 18, 0.55)',
  bush: '#2f6b3a',
  bushDark: '#245430',
  exitGlow: '#37d67a',
  exitDark: '#0d5c2e',
  relic: '#ffd94d',
  player: '#e8e4d8',
  playerCloak: '#3b3f5c',
  guardCalm: '#f2c14e',
  guardSuspicious: '#ff9f1c',
  guardAlert: '#ff3b30',
  coneCalm: 'rgba(242, 193, 78, 0.20)',
  coneSuspicious: 'rgba(255, 159, 28, 0.30)',
  coneAlert: 'rgba(255, 59, 48, 0.34)',
};

export const RELIC_NAMES = ['Moon Idol', 'Sun Coin', 'Star Mask'];

export const RANKS = {
  ghost: { minRelics: 3, maxAlerts: 0, label: 'GHOST — unseen, every relic' },
  shadow: { minRelics: 3, maxAlerts: 1, label: 'SHADOW — clean getaway' },
  thief: { minRelics: 2, maxAlerts: 99, label: 'THIEF — out with the loot' },
  runner: { minRelics: 0, maxAlerts: 99, label: 'RUNNER — out alive, barely' },
};
