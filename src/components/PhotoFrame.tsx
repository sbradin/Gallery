import type { PhotoPlacement } from '@/types/scene';
import { resolvePhoto } from '@/data/photoManifest';
import styles from './PhotoFrame.module.css';

interface PhotoFrameProps {
  placement: PhotoPlacement;
}

/**
 * Renders only the photo image, sized to the cavity declared by the
 * hallway slot it lands in. The ornate frame around the photo is part of
 * the underlying hallway segment art, so this component is intentionally
 * minimal — it just slides the photo into the painted cavity.
 */
export function PhotoFrame({ placement }: Readonly<PhotoFrameProps>) {
  const photo = resolvePhoto(placement.photoId);
  const scale = placement.scale ?? 1;
  const w = placement.cavity.w * scale;
  const h = placement.cavity.h * scale;

  return (
    <div
      className={styles.cavity}
      style={{
        left: placement.position.x,
        top: placement.position.y,
        width: w,
        height: h,
      }}
    >
      {photo ? (
        <img
          className={styles.thumb}
          src={photo.thumbUrl}
          alt=""
          draggable={false}
          loading="lazy"
        />
      ) : (
        <div className={styles.placeholder} />
      )}
    </div>
  );
}
