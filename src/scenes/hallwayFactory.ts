import type {
  HallwayScene,
  HallwaySegmentInstance,
  PhotoPlacement,
} from '@/types/scene';
import { HALLWAY_LAYOUT, type SegmentSpec } from './hallwayLayout';

/**
 * Composes a hallway scene by tiling begin + N×middle + end segments based
 * on photo count. Photos fill slots in walking order:
 *
 *   [ begin slots ][ middle×0 slots ][ middle×1 slots ] … [ end slots ]
 *
 * If the photo count fits in begin + end alone, no middle segments are
 * inserted (short hallway). Otherwise we add as many middles as needed
 * to fit every photo, leaving any trailing empty slots in end visible as
 * blank frames in the art.
 *
 * Scene size is derived from the segment widths so the hallway grows with
 * the gallery automatically.
 */

export interface HallwayConfig {
  id: string;
  title: string;
  photoIds: readonly string[];
  music?: string;
}

const computeMiddleCount = (
  photoCount: number,
  beginSlots: number,
  middleSlots: number,
  endSlots: number,
): number => {
  if (photoCount <= beginSlots + endSlots) return 0;
  const overflow = photoCount - beginSlots - endSlots;
  return Math.ceil(overflow / middleSlots);
};

const placePhotosInSegment = (
  seg: SegmentSpec,
  segmentX: number,
  photoIds: readonly string[],
  cursor: { i: number },
): PhotoPlacement[] => {
  const out: PhotoPlacement[] = [];
  for (const slot of seg.slots) {
    if (cursor.i >= photoIds.length) break;
    out.push({
      photoId: photoIds[cursor.i++],
      position: { x: segmentX + slot.x, y: slot.y },
      wall: slot.wall,
      cavity: { w: slot.w, h: slot.h },
    });
  }
  return out;
};

export const createHallwayScene = (config: HallwayConfig): HallwayScene => {
  const { id, title, photoIds, music } = config;
  const { begin, middle, end, floorYTop, floorYBottom } = HALLWAY_LAYOUT;

  const middleCount = computeMiddleCount(
    photoIds.length,
    begin.slots.length,
    middle.slots.length,
    end.slots.length,
  );

  // Compose segment instances, accumulating x as we go.
  const segments: HallwaySegmentInstance[] = [];
  let xCursor = 0;
  segments.push({ src: begin.src, x: xCursor, width: begin.width, height: begin.height });
  xCursor += begin.width;
  for (let i = 0; i < middleCount; i++) {
    segments.push({ src: middle.src, x: xCursor, width: middle.width, height: middle.height });
    xCursor += middle.width;
  }
  segments.push({ src: end.src, x: xCursor, width: end.width, height: end.height });
  xCursor += end.width;

  const sceneWidth = xCursor;
  const sceneHeight = Math.max(begin.height, middle.height, end.height);

  // Lay photos into slots in walking order.
  const cursor = { i: 0 };
  const placements: PhotoPlacement[] = [];
  let segX = 0;
  placements.push(...placePhotosInSegment(begin, segX, photoIds, cursor));
  segX += begin.width;
  for (let i = 0; i < middleCount; i++) {
    placements.push(...placePhotosInSegment(middle, segX, photoIds, cursor));
    segX += middle.width;
  }
  placements.push(...placePhotosInSegment(end, segX, photoIds, cursor));

  // Walkable strip & exit doorway come from the begin spec so the cat spawns
  // in the correct relationship to its built-in doorway art.
  const walkable = [
    {
      x: begin.exitTrigger.x + begin.exitTrigger.w + 4, // start floor JUST past the exit
      y: floorYTop,
      w: sceneWidth - (begin.exitTrigger.x + begin.exitTrigger.w + 4) - 16,
      h: floorYBottom - floorYTop,
    },
    // The exit trigger itself is also walkable so the cat can step into it.
    {
      x: begin.exitTrigger.x,
      y: begin.exitTrigger.y,
      w: begin.exitTrigger.w + 4,
      h: begin.exitTrigger.h,
    },
  ];

  return {
    kind: 'hallway',
    id,
    title,
    size: { w: sceneWidth, h: sceneHeight },
    walkable,
    spawnAt: begin.spawnAt,
    background: { kind: 'tile', color: '#1a1a1a' },
    photos: placements,
    segments,
    exit: {
      id: `${id}-exit`,
      label: 'Lobby',
      orientation: 'west',
      rect: { ...begin.exitTrigger },
      targetSceneId: 'lobby',
      spawnAt: { x: 0, y: 0 },
    },
    scrollAxis: 'x',
    music,
  };
};
