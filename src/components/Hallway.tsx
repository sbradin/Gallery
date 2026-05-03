import type { HallwayScene } from '@/types/scene';
import { PhotoFrame } from './PhotoFrame';
import styles from './Hallway.module.css';

interface HallwayProps {
  scene: HallwayScene;
}

/**
 * Renders a hallway as a horizontal stitch of pre-painted segment images
 * (begin + N×middle + end). The lamps, frames, plaques, walls, and runner
 * rug are all baked into those segment assets — we only overlay the user's
 * photos at the slot positions declared in hallwayLayout.ts.
 */
export function Hallway({ scene }: Readonly<HallwayProps>) {
  return (
    <div
      className={styles.hallway}
      style={{ width: scene.size.w, height: scene.size.h }}
    >
      {scene.segments.map((seg, i) => (
        <img
          key={`${seg.src}-${i}`}
          className={styles.segment}
          src={seg.src}
          alt=""
          draggable={false}
          style={{ left: seg.x, top: 0, width: seg.width, height: seg.height }}
        />
      ))}

      <div className={styles.title}>{scene.title.toUpperCase()}</div>

      {scene.photos.map((p) => (
        <PhotoFrame key={p.photoId} placement={p} />
      ))}
    </div>
  );
}
