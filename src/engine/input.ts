/**
 * Plain JS singleton for input state. Lives outside React because reading it
 * inside the rAF tick must not cause re-renders.
 *
 * - `held` is the set of normalized direction keys currently down.
 * - `lastInputAt` flags whether the most recent input was keyboard ('kb')
 *   or pointer ('click'). Movement resolution uses this for "most recent
 *   input wins": pressing WASD clears any pending click target.
 */

export type DirKey = 'up' | 'down' | 'left' | 'right';

const KEY_MAP: Record<string, DirKey> = {
  w: 'up',
  W: 'up',
  ArrowUp: 'up',
  s: 'down',
  S: 'down',
  ArrowDown: 'down',
  a: 'left',
  A: 'left',
  ArrowLeft: 'left',
  d: 'right',
  D: 'right',
  ArrowRight: 'right',
};

class InputState {
  held = new Set<DirKey>();
  lastInputAt: 'kb' | 'click' | 'none' = 'none';

  press(key: string) {
    const dir = KEY_MAP[key];
    if (!dir) return;
    this.held.add(dir);
    this.lastInputAt = 'kb';
  }
  release(key: string) {
    const dir = KEY_MAP[key];
    if (!dir) return;
    this.held.delete(dir);
  }
  noteClick() {
    this.lastInputAt = 'click';
  }
  clear() {
    this.held.clear();
  }
}

export const input = new InputState();

export const directionVector = (): { x: number; y: number } => {
  let x = 0;
  let y = 0;
  if (input.held.has('right')) x += 1;
  if (input.held.has('left')) x -= 1;
  if (input.held.has('down')) y += 1;
  if (input.held.has('up')) y -= 1;
  if (x !== 0 && y !== 0) {
    // normalize so diagonals aren't √2 faster
    const inv = 1 / Math.SQRT2;
    x *= inv;
    y *= inv;
  }
  return { x, y };
};
