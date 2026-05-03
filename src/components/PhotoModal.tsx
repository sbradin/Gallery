import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { resolvePhoto } from '@/data/photoManifest';
import { HALLWAY_LAYOUT } from '@/scenes/hallwayLayout';
import styles from './PhotoModal.module.css';

/**
 * Fullscreen photo modal. The photo is wrapped in the ornate hallway frame
 * sprite using a CSS border-image (9-slice). Slice values + padding are
 * driven by HALLWAY_LAYOUT.modalFrame so swapping the frame asset doesn't
 * require touching this file.
 *
 * Open/close is driven by proximity in the game loop; user dismissal
 * (Escape or backdrop click) adds the id to `dismissedPhotoIds` so it stays
 * closed until the cat physically moves outside the EXIT radius.
 */
export function PhotoModal() {
  const activePhotoId = useGameStore((s) => s.activePhotoId);
  const photo = activePhotoId ? resolvePhoto(activePhotoId) : null;
  const [vw, vh] = useViewportSize();

  const dismiss = useCallback(() => {
    const id = useGameStore.getState().activePhotoId;
    if (!id) return;
    useGameStore.setState((s) => {
      const next = new Set(s.dismissedPhotoIds);
      next.add(id);
      return { dismissedPhotoIds: next, activePhotoId: null };
    });
  }, []);

  useEffect(() => {
    if (!activePhotoId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [activePhotoId, dismiss]);

  // Compute frame dimensions: fit photo aspect into ~85% of the viewport.
  const frameStyle = useMemo(() => {
    if (!photo) return undefined;
    return computeFrameStyle(photo.width, photo.height, vw, vh);
  }, [photo, vw, vh]);

  return (
    <AnimatePresence>
      {photo && frameStyle && (
        <motion.div
          key={photo.id}
          className={styles.backdrop}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) dismiss();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className={styles.frame}
            style={frameStyle.outer}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          >
            <div style={frameStyle.cavity}>
              <img
                className={styles.photo}
                src={photo.fullUrl}
                alt=""
                draggable={false}
              />
            </div>
          </motion.div>
          <div className={styles.hint}>esc · or walk away</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function computeFrameStyle(
  photoW: number,
  photoH: number,
  vw: number,
  vh: number,
): { outer: React.CSSProperties; cavity: React.CSSProperties } {
  const { src, slice, padding } = HALLWAY_LAYOUT.modalFrame;

  // Decide the cavity (visible photo area) size: fit photo into ~80% of vw,vh.
  const maxCavityW = vw * 0.78;
  const maxCavityH = vh * 0.74;
  const aspect = photoW / photoH;
  let cavityW = maxCavityW;
  let cavityH = cavityW / aspect;
  if (cavityH > maxCavityH) {
    cavityH = maxCavityH;
    cavityW = cavityH * aspect;
  }

  // Outer frame size = cavity + padding on each side.
  const outerW = cavityW + padding.left + padding.right;
  const outerH = cavityH + padding.top + padding.bottom;

  return {
    outer: {
      width: outerW,
      height: outerH,
      borderStyle: 'solid',
      borderColor: 'transparent',
      borderTopWidth: padding.top,
      borderRightWidth: padding.right,
      borderBottomWidth: padding.bottom,
      borderLeftWidth: padding.left,
      // 9-slice
      borderImageSource: `url(${src})`,
      borderImageSlice: `${slice.top} ${slice.right} ${slice.bottom} ${slice.left} fill`,
      borderImageWidth: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
      borderImageOutset: 0,
      borderImageRepeat: 'stretch',
      boxSizing: 'border-box',
    } as React.CSSProperties,
    cavity: {
      width: cavityW,
      height: cavityH,
    } as React.CSSProperties,
  };
}

function useViewportSize(): [number, number] {
  const [size, setSize] = useState<[number, number]>(() => [
    globalThis.innerWidth,
    globalThis.innerHeight,
  ]);
  useEffect(() => {
    const onResize = () => setSize([globalThis.innerWidth, globalThis.innerHeight]);
    globalThis.addEventListener('resize', onResize);
    return () => globalThis.removeEventListener('resize', onResize);
  }, []);
  return size;
}
