import type { Vec2 } from '@/types/math';
import type { Scene } from '@/types/scene';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './constants';
import { clamp, lerp } from '@/utils/math';

/**
 * Computes camera offset to subtract from world coordinates when rendering.
 * - Lobby: camera is locked at (0, 0); the lobby is one viewport.
 * - Hallway: tracks the cat's x with a small deadzone, clamped to scene bounds.
 *
 * Vertical scrolling is not used (hallways are horizontal corridors). y stays 0.
 */

const HALLWAY_DEADZONE_HALF = 32; // px on either side of viewport center
const SMOOTHING = 0.18;           // 0=snap, 1=hold

export const stepCamera = (
  current: Vec2,
  catPos: Vec2,
  scene: Scene,
): Vec2 => {
  if (scene.kind === 'lobby') {
    return { x: 0, y: 0 };
  }

  // Hallway: target keeps cat in the central deadzone.
  const screenCenterX = current.x + DESIGN_WIDTH / 2;
  const dx = catPos.x - screenCenterX;

  let targetX = current.x;
  if (dx > HALLWAY_DEADZONE_HALF) {
    targetX = current.x + (dx - HALLWAY_DEADZONE_HALF);
  } else if (dx < -HALLWAY_DEADZONE_HALF) {
    targetX = current.x + (dx + HALLWAY_DEADZONE_HALF);
  }

  // Clamp so the camera never reveals beyond scene bounds.
  const maxX = Math.max(0, scene.size.w - DESIGN_WIDTH);
  targetX = clamp(targetX, 0, maxX);

  // Clamp Y similarly (hallways are usually height = DESIGN_HEIGHT, so this collapses to 0).
  const maxY = Math.max(0, scene.size.h - DESIGN_HEIGHT);
  const targetY = clamp(0, 0, maxY);

  return {
    x: lerp(current.x, targetX, SMOOTHING),
    y: lerp(current.y, targetY, SMOOTHING),
  };
};
