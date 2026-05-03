import { useEffect, useState } from 'react';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '@/engine/constants';

const computeScale = (): number => {
  const sx = window.innerWidth / DESIGN_WIDTH;
  const sy = window.innerHeight / DESIGN_HEIGHT;
  // Integer scaling preserves pixel-perfect rendering. Minimum 1 so
  // the viewport never collapses on very small screens.
  return Math.max(1, Math.floor(Math.min(sx, sy)));
};

export function useViewportScale(): number {
  const [scale, setScale] = useState<number>(() =>
    typeof window === 'undefined' ? 1 : computeScale(),
  );

  useEffect(() => {
    const onResize = () => setScale(computeScale());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return scale;
}
