import type { Rect, Vec2 } from '@/types/math';
import { clamp } from '@/utils/math';

/**
 * Returns true iff the point lies inside the union of walkable rects.
 * Walkable is an inclusive set: anywhere outside is "wall."
 */
export const isWalkable = (p: Vec2, walkable: readonly Rect[]): boolean => {
  for (const r of walkable) {
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
      return true;
    }
  }
  return false;
};

/**
 * Axis-separated movement: move along x first, then y, accepting each axis
 * independently. If the cat hits a wall in one axis, the other axis still
 * advances so the cat slides along the wall instead of sticking on corners.
 */
export const slide = (
  pos: Vec2,
  vel: Vec2,
  dt: number,
  walkable: readonly Rect[],
): Vec2 => {
  let { x, y } = pos;
  const dx = vel.x * dt;
  const dy = vel.y * dt;

  const candidateX = { x: x + dx, y };
  if (isWalkable(candidateX, walkable)) {
    x = candidateX.x;
  }

  const candidateY = { x, y: y + dy };
  if (isWalkable(candidateY, walkable)) {
    y = candidateY.y;
  }

  return { x, y };
};

/**
 * Projects a point onto the nearest walkable rect. If the point is already
 * walkable, returns it unchanged. Used to "snap" click-to-move targets so
 * a click on a wall walks the cat to the closest reachable spot instead of
 * oscillating against the wall.
 */
export const clampToWalkable = (p: Vec2, walkable: readonly Rect[]): Vec2 => {
  if (isWalkable(p, walkable)) return p;
  let best: Vec2 = p;
  let bestDist = Infinity;
  for (const r of walkable) {
    const cx = clamp(p.x, r.x, r.x + r.w);
    const cy = clamp(p.y, r.y, r.y + r.h);
    const d = Math.hypot(cx - p.x, cy - p.y);
    if (d < bestDist) {
      bestDist = d;
      best = { x: cx, y: cy };
    }
  }
  return best;
};
