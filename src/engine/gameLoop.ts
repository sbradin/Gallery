import { FIXED_STEP } from './constants';

export type TickFn = (dt: number) => void;

/**
 * Fixed-timestep game loop with an accumulator. The tick function is called
 * with a constant dt so movement, hysteresis, and time-based animations stay
 * deterministic regardless of frame rate.
 *
 * Call start() once from a useEffect; stop() from its cleanup.
 */
export function createGameLoop(tick: TickFn) {
  let rafId: number | null = null;
  let last = 0;
  let accumulator = 0;
  // Hard cap to avoid spiral-of-death on a tab that just unfroze.
  const MAX_FRAME = 0.25;

  const frame = (now: number) => {
    if (last === 0) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > MAX_FRAME) dt = MAX_FRAME;
    accumulator += dt;
    while (accumulator >= FIXED_STEP) {
      tick(FIXED_STEP);
      accumulator -= FIXED_STEP;
    }
    rafId = requestAnimationFrame(frame);
  };

  return {
    start() {
      if (rafId != null) return;
      last = 0;
      accumulator = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}
