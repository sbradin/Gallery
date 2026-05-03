import type { Facing, Vec2 } from '@/types/math';
import type { Scene } from '@/types/scene';
import { CAT_SPEED } from './constants';
import { directionVector, input } from './input';
import { slide } from './collision';
import { distance, sub, normalize } from '@/utils/vec';

const ARRIVAL_EPSILON = 1.5; // px

interface MovementInput {
  position: Vec2;
  facing: Facing;
  moveTarget: Vec2 | null;
  scene: Scene;
}

interface MovementOutput {
  position: Vec2;
  velocity: Vec2;
  facing: Facing;
  moving: boolean;
  moveTarget: Vec2 | null;
  distanceDelta: number;
}

const facingFromVelocity = (vx: number, vy: number, fallback: Facing): Facing => {
  if (vx === 0 && vy === 0) return fallback;
  // Prefer the dominant axis. Ties (rare diagonals) bias horizontal,
  // which reads as more "alive" with the side sprite.
  if (Math.abs(vx) >= Math.abs(vy)) return vx > 0 ? 'right' : 'left';
  return vy > 0 ? 'down' : 'up';
};

/**
 * Resolves one tick of movement. "Most recent input wins":
 * - If WASD is held, use direct keyboard control and clear any click target.
 * - Else if a click target exists, walk toward it; arrive when within ε.
 * - Else idle.
 *
 * Velocity is then applied with axis-separated collision so the cat slides
 * along walls instead of sticking on corners.
 */
export const stepMovement = (
  state: MovementInput,
  dt: number,
): MovementOutput => {
  const { position, facing, scene } = state;
  let { moveTarget } = state;

  let vx = 0;
  let vy = 0;

  const dir = directionVector();
  const kbActive = dir.x !== 0 || dir.y !== 0;

  if (kbActive) {
    // Keyboard takes over; drop any pending click target.
    moveTarget = null;
    vx = dir.x * CAT_SPEED;
    vy = dir.y * CAT_SPEED;
  } else if (moveTarget) {
    const delta = sub(moveTarget, position);
    if (distance(moveTarget, position) <= ARRIVAL_EPSILON) {
      moveTarget = null;
    } else {
      const n = normalize(delta);
      vx = n.x * CAT_SPEED;
      vy = n.y * CAT_SPEED;
    }
  }

  // If keyboard JUST became inactive, ensure input.lastInputAt isn't lying.
  // (Click events explicitly set 'click' via input.noteClick; keyboard sets 'kb'.)
  if (!kbActive && input.lastInputAt === 'kb' && moveTarget == null) {
    // No active intent; idle.
  }

  const before = position;
  const after = vx === 0 && vy === 0
    ? before
    : slide(before, { x: vx, y: vy }, dt, scene.walkable);

  // If we got blocked, snap velocity to actual displacement so footstep
  // accounting and facing reflect what actually happened.
  const realVx = (after.x - before.x) / dt;
  const realVy = (after.y - before.y) / dt;
  const moving = realVx !== 0 || realVy !== 0;
  const newFacing = facingFromVelocity(realVx, realVy, facing);
  const distanceDelta = Math.hypot(after.x - before.x, after.y - before.y);

  return {
    position: after,
    velocity: { x: realVx, y: realVy },
    facing: newFacing,
    moving,
    moveTarget,
    distanceDelta,
  };
};
