import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getScene } from '@/scenes';
import { useKeyToggle } from '@/hooks/useKeyToggle';
import { PROXIMITY_ENTER, PROXIMITY_EXIT } from '@/engine/constants';
import styles from './DebugOverlay.module.css';

/**
 * Use the `useDebug` hook to know whether debug mode is on.
 * Render `<DebugPanel/>` outside the scaled stage and `<DebugBoxes/>` inside
 * the scaled world so coordinates line up.
 */

export const useDebug = (): boolean => useKeyToggle('`');

export function DebugPanel({ visible }: Readonly<{ visible: boolean }>) {
  const fps = useFps(visible);
  const sceneId = useGameStore((s) => s.sceneId);
  const cat = useGameStore((s) => s.cat);
  const camera = useGameStore((s) => s.camera);
  const moveTarget = useGameStore((s) => s.moveTarget);
  const transition = useGameStore((s) => s.transition);
  const activePhotoId = useGameStore((s) => s.activePhotoId);

  if (!visible) return null;

  const scene = getScene(sceneId);
  const targetText = moveTarget
    ? `${moveTarget.x.toFixed(0)}, ${moveTarget.y.toFixed(0)}`
    : '—';
  const lines = [
    `scene    ${scene.id} (${scene.kind})`,
    `cat      ${cat.position.x.toFixed(1)}, ${cat.position.y.toFixed(1)}  facing=${cat.facing}`,
    `vel      ${cat.velocity.x.toFixed(0)}, ${cat.velocity.y.toFixed(0)}  moving=${cat.moving}`,
    `dist     ${cat.distanceTravelled.toFixed(0)}`,
    `camera   ${camera.x.toFixed(1)}, ${camera.y.toFixed(1)}`,
    `target   ${targetText}`,
    `trans    ${transition.phase}`,
    `photo    ${activePhotoId ?? '—'}`,
    `fps      ${fps}`,
    ``,
    '[` debug] [esc close modal]',
  ];

  return <div className={styles.panel}>{lines.join('\n')}</div>;
}

export function DebugBoxes({ visible }: Readonly<{ visible: boolean }>) {
  const sceneId = useGameStore((s) => s.sceneId);
  const moveTarget = useGameStore((s) => s.moveTarget);
  const cameraX = useGameStore((s) => s.camera.x);
  const cameraY = useGameStore((s) => s.camera.y);
  if (!visible) return null;
  const scene = getScene(sceneId);

  return (
    <div
      className={styles.boxes}
      style={{
        transform: `translate3d(${-Math.round(cameraX)}px, ${-Math.round(cameraY)}px, 0)`,
      }}
    >
      {scene.walkable.map((r) => (
        <div
          key={`walk-${r.x},${r.y},${r.w},${r.h}`}
          className={styles.walk}
          style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
        />
      ))}
      {scene.kind === 'lobby' &&
        scene.doors.map((d) => (
          <div
            key={d.id}
            className={styles.door}
            style={{ left: d.rect.x, top: d.rect.y, width: d.rect.w, height: d.rect.h }}
          />
        ))}
      {scene.kind === 'hallway' && (
        <div
          className={styles.door}
          style={{
            left: scene.exit.rect.x,
            top: scene.exit.rect.y,
            width: scene.exit.rect.w,
            height: scene.exit.rect.h,
          }}
        />
      )}
      {scene.kind === 'hallway' &&
        scene.photos.map((p) => (
          <div
            key={p.photoId}
            className={styles.photo}
            style={{
              left: p.position.x - PROXIMITY_ENTER,
              top: p.position.y - PROXIMITY_ENTER,
              width: PROXIMITY_ENTER * 2,
              height: PROXIMITY_ENTER * 2,
              borderRadius: '50%',
              borderColor: 'rgba(180, 200, 255, 0.4)',
            }}
            title={`enter=${PROXIMITY_ENTER} exit=${PROXIMITY_EXIT}`}
          />
        ))}
      {moveTarget && (
        <div
          className={styles.target}
          style={{ left: moveTarget.x, top: moveTarget.y }}
        />
      )}
    </div>
  );
}

function useFps(active: boolean): number {
  const [fps, setFps] = useState(0);
  const samples = useRef<number[]>([]);
  const last = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
      return;
    }
    const tick = (now: number) => {
      if (last.current !== 0) {
        const dt = now - last.current;
        samples.current.push(dt);
        if (samples.current.length > 30) samples.current.shift();
        const avg =
          samples.current.reduce((a, b) => a + b, 0) / samples.current.length;
        setFps(Math.round(1000 / avg));
      }
      last.current = now;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
      last.current = 0;
      samples.current = [];
    };
  }, [active]);

  return fps;
}
