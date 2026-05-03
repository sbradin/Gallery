import { type ReactNode, useRef, useEffect } from 'react';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '@/engine/constants';
import { useViewportScale } from '@/hooks/useViewportScale';
import styles from './Viewport.module.css';

interface ViewportProps {
  children: ReactNode;
  onPointerDown?: (sceneX: number, sceneY: number) => void;
}

/**
 * Letterboxed integer-scaled stage. Children render in design-resolution
 * coordinates (DESIGN_WIDTH x DESIGN_HEIGHT). Pointer events are un-projected
 * back to design space so callers never deal with screen pixels.
 */
export function Viewport({ children, onPointerDown }: Readonly<ViewportProps>) {
  const scale = useViewportScale();
  const stageRef = useRef<HTMLDivElement>(null);

  // Keep the latest callback in a ref so the listener isn't re-attached every render.
  const cbRef = useRef(onPointerDown);
  useEffect(() => {
    cbRef.current = onPointerDown;
  }, [onPointerDown]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handler = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const sceneX = (e.clientX - rect.left) / scale;
      const sceneY = (e.clientY - rect.top) / scale;
      if (
        sceneX < 0 ||
        sceneY < 0 ||
        sceneX > DESIGN_WIDTH ||
        sceneY > DESIGN_HEIGHT
      ) {
        return;
      }
      cbRef.current?.(sceneX, sceneY);
    };
    stage.addEventListener('pointerdown', handler);
    return () => stage.removeEventListener('pointerdown', handler);
  }, [scale]);

  return (
    <div className={styles.outer}>
      <div
        ref={stageRef}
        className={styles.stage}
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
