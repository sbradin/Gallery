import type { TransitionState } from '@/store/gameStore';
import { TRANSITION_FADE_MS } from './constants';

const FADE_S = TRANSITION_FADE_MS / 1000;

export interface TransitionTickResult {
  transition: TransitionState;
  /** When non-null, swap to this scene this frame and place the cat at spawnAt. */
  swap: { sceneId: string; spawnAt: { x: number; y: number } } | null;
}

export const stepTransition = (
  current: TransitionState,
  dt: number,
): TransitionTickResult => {
  switch (current.phase) {
    case 'in-scene':
      return { transition: current, swap: null };
    case 'fade-out': {
      const t = current.t + dt / FADE_S;
      if (t >= 1) {
        return {
          transition: { phase: 'fade-in', t: 0 },
          swap: { sceneId: current.to, spawnAt: current.spawnAt },
        };
      }
      return { transition: { ...current, t }, swap: null };
    }
    case 'fade-in': {
      const t = current.t + dt / FADE_S;
      if (t >= 1) return { transition: { phase: 'in-scene' }, swap: null };
      return { transition: { ...current, t }, swap: null };
    }
  }
};

/** Returns the alpha (0..1) of the black overlay for the current transition. */
export const transitionAlpha = (t: TransitionState): number => {
  switch (t.phase) {
    case 'in-scene':
      return 0;
    case 'fade-out':
      return Math.min(1, t.t);
    case 'fade-in':
      return Math.max(0, 1 - t.t);
  }
};

/** Whether input should be ignored (cat frozen) during a transition. */
export const isTransitionLocked = (t: TransitionState): boolean =>
  t.phase !== 'in-scene';
