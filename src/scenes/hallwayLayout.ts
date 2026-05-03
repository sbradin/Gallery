import beginUrl from '@/assets/hallway/begin.webp';
import middleUrl from '@/assets/hallway/middle.webp';
import endUrl from '@/assets/hallway/end.webp';
import frameUrl from '@/assets/ui/frame.webp';

/**
 * Layout configuration for the hallway scene art. The user provides four
 * pixel-art assets:
 *
 *   src/assets/hallway/begin.webp   — left end of the corridor; shows the
 *                                     doorway back to the lobby on its left.
 *   src/assets/hallway/middle.webp  — repeatable middle section, tiled
 *                                     horizontally as more photos are added.
 *   src/assets/hallway/end.webp     — right end of the corridor; shows the
 *                                     dead-end wall on its right.
 *   src/assets/ui/frame.webp        — single ornate frame sprite used for
 *                                     the fullscreen photo modal.
 *
 * Each segment defines its width/height in scene pixels and the photo-slot
 * positions baked into its art. Slots are ordered the way the cat walks past
 * them (left to right). The hallway factory consumes these slots in order:
 * photo[0] lands in begin's first slot, etc.
 *
 * If your art has more or fewer slots per segment than the defaults, just
 * adjust the `slots` arrays — no other code needs to change.
 */

export interface PhotoSlot {
  /** Photo center, in segment-local scene pixels. */
  x: number;
  y: number;
  /** Inner cavity dimensions (where the user's actual photo image renders). */
  w: number;
  h: number;
  /** Which wall the photo hangs on — drives proximity facing-direction gating. */
  wall: 'north' | 'south';
}

export interface SegmentSpec {
  src: string;
  width: number;
  height: number;
  slots: readonly PhotoSlot[];
}

export interface BeginSegmentSpec extends SegmentSpec {
  /** Cat spawn position when entering the hallway, in segment-local coords. */
  spawnAt: { x: number; y: number };
  /** Trigger rect for the exit doorway (back to lobby), in segment-local coords. */
  exitTrigger: { x: number; y: number; w: number; h: number };
}

/* ---- Tunable defaults ----------------------------------------- */
/* Edit these to match your actual art. The shape of each segment is the
 * source of truth for both the visual and the playable geometry.
 */

const FRAME_CAVITY_W = 36;
const FRAME_CAVITY_H = 28;
const NORTH_FRAME_Y = 44;

const BEGIN: BeginSegmentSpec = {
  src: beginUrl,
  width: 384,
  height: 270,
  slots: [
    { x: 96, y: NORTH_FRAME_Y, w: FRAME_CAVITY_W, h: FRAME_CAVITY_H, wall: 'north' },
    { x: 184, y: NORTH_FRAME_Y, w: FRAME_CAVITY_W, h: FRAME_CAVITY_H, wall: 'north' },
  ],
  spawnAt: { x: 64, y: 134 },
  exitTrigger: { x: 16, y: 70, w: 18, h: 130 },
};

const MIDDLE: SegmentSpec = {
  src: middleUrl,
  width: 384,
  height: 270,
  slots: [
    { x: 24, y: NORTH_FRAME_Y, w: FRAME_CAVITY_W, h: FRAME_CAVITY_H, wall: 'north' },
    { x: 72, y: NORTH_FRAME_Y, w: FRAME_CAVITY_W, h: FRAME_CAVITY_H, wall: 'north' },
    { x: 120, y: NORTH_FRAME_Y, w: FRAME_CAVITY_W, h: FRAME_CAVITY_H, wall: 'north' },
    { x: 168, y: NORTH_FRAME_Y, w: FRAME_CAVITY_W, h: FRAME_CAVITY_H, wall: 'north' },
  ],
};

const END: SegmentSpec = {
  src: endUrl,
  width: 384,
  height: 270,
  slots: [
    { x: 56, y: NORTH_FRAME_Y, w: FRAME_CAVITY_W, h: FRAME_CAVITY_H, wall: 'north' },
    { x: 144, y: NORTH_FRAME_Y, w: FRAME_CAVITY_W, h: FRAME_CAVITY_H, wall: 'north' },
  ],
};

export const HALLWAY_LAYOUT = {
  begin: BEGIN,
  middle: MIDDLE,
  end: END,

  /** Y-range the cat is allowed to walk in (in scene-space). The corridor
   *  walkable strip is the same y-range across every segment. */
  floorYTop: 100,
  floorYBottom: 250,

  modalFrame: {
    src: frameUrl,
    /** 9-slice insets for CSS border-image (px in source asset). Adjust to
     *  match where your frame's ornaments end and the flat edge begins. */
    slice: { top: 32, right: 32, bottom: 48, left: 32 },
    /** Padding from the rendered frame's outer edge to the photo cavity. */
    padding: { top: 30, right: 30, bottom: 60, left: 30 },
  },
};
