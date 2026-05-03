import type { Facing, Vec2 } from '@/types/math';
import type { HallwayScene, PhotoPlacement } from '@/types/scene';
import { distance } from '@/utils/vec';
import { PROXIMITY_ENTER, PROXIMITY_EXIT } from './constants';

const isFacingWall = (facing: Facing, wall: 'north' | 'south'): boolean => {
  // North wall photos are above the cat → cat must be facing up.
  // South wall photos are below the cat → cat must be facing down.
  if (wall === 'north') return facing === 'up';
  return facing === 'down';
};

interface ProximityInput {
  scene: HallwayScene | { kind: 'lobby' };
  catPos: Vec2;
  catFacing: Facing;
  /** Currently active photo id, used to apply hysteresis. */
  currentActiveId: string | null;
  /** Photos the user has dismissed via Escape; suppressed until exit-radius. */
  dismissedIds: ReadonlySet<string>;
}

export interface ProximityResult {
  activeId: string | null;
  /** Photos within 1.5× ENTER are good prefetch candidates. */
  prefetchIds: string[];
  /** Photos that have exited the EXIT radius — drop from dismissed set. */
  releasedDismissals: string[];
}

const isHallway = (
  s: ProximityInput['scene'],
): s is HallwayScene => s.kind === 'hallway';

export const stepProximity = (input: ProximityInput): ProximityResult => {
  const { scene, catPos, catFacing, currentActiveId, dismissedIds } = input;
  if (!isHallway(scene)) {
    return {
      activeId: null,
      prefetchIds: [],
      releasedDismissals: [],
    };
  }

  // Released dismissals: any dismissed photo now beyond EXIT radius.
  const releasedDismissals: string[] = [];
  for (const id of dismissedIds) {
    const placement = scene.photos.find((p) => p.photoId === id);
    if (!placement || distance(catPos, placement.position) > PROXIMITY_EXIT) {
      releasedDismissals.push(id);
    }
  }

  // Hysteresis: keep current active if still within EXIT.
  if (currentActiveId) {
    const cur = scene.photos.find((p) => p.photoId === currentActiveId);
    if (cur && distance(catPos, cur.position) <= PROXIMITY_EXIT) {
      return {
        activeId: currentActiveId,
        prefetchIds: collectPrefetch(scene.photos, catPos),
        releasedDismissals,
      };
    }
  }

  // Otherwise pick nearest within ENTER, gated by facing + dismissals.
  let best: PhotoPlacement | null = null;
  let bestDist = Infinity;
  for (const p of scene.photos) {
    if (dismissedIds.has(p.photoId)) continue;
    const d = distance(catPos, p.position);
    if (d > PROXIMITY_ENTER) continue;
    if (!isFacingWall(catFacing, p.wall)) continue;
    if (d < bestDist) {
      best = p;
      bestDist = d;
    }
  }

  return {
    activeId: best?.photoId ?? null,
    prefetchIds: collectPrefetch(scene.photos, catPos),
    releasedDismissals,
  };
};

const PREFETCH_DIST = PROXIMITY_ENTER * 1.5;

const collectPrefetch = (
  photos: readonly PhotoPlacement[],
  catPos: Vec2,
): string[] => {
  const out: string[] = [];
  for (const p of photos) {
    if (distance(catPos, p.position) <= PREFETCH_DIST) {
      out.push(p.photoId);
    }
  }
  return out;
};
