// The Lantern Vault — keyboard and mouse input. WASD or arrows to move,
// Shift to sneak, Enter to start or restart, M to mute. The mouse is
// optional: click the title screen to start, click to sneak-toggle.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    sneakHeld: false,
    clicked: false,
    pressedEnter: false,
    pressedMute: false,
    anyKey: false,
  };

  const keyName = (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    return k === ' ' ? 'space' : k;
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    const k = keyName(e);
    if (!keys.has(k)) {
      input.anyKey = true;
      if (k === 'Enter') input.pressedEnter = true;
      if (k === 'm' || k === 'M') input.pressedMute = true;
    }
    keys.add(k);
    input.sneakHeld = keys.has('Shift');
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(keyName(e));
    input.sneakHeld = keys.has('Shift');
  });
  window.addEventListener('blur', () => {
    keys.clear();
    input.sneakHeld = false;
  });
  canvas.addEventListener('pointerdown', () => {
    input.clicked = true;
    input.anyKey = true;
  });

  return input;
}

// Movement direction from the held keys, normalised. Returns {x, y}.
export function moveDirection(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('a') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('d') || input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('w') || input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('s') || input.keys.has('ArrowDown')) y += 1;
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}

// One-shot flags the game loop consumes each frame.
export function consumePresses(input) {
  const out = {
    enter: input.pressedEnter,
    mute: input.pressedMute,
    click: input.clicked,
    anyKey: input.anyKey,
  };
  input.pressedEnter = false;
  input.pressedMute = false;
  input.clicked = false;
  input.anyKey = false;
  return out;
}
