import { create } from 'zustand';
import type { Vec2, Facing } from '@/types/math';
import type { SceneId } from '@/types/scene';

export type TransitionState =
  | { phase: 'in-scene' }
  | { phase: 'fade-out'; from: SceneId; to: SceneId; spawnAt: Vec2; t: number }
  | { phase: 'fade-in'; t: number };

export interface GameState {
  // Time
  tElapsed: number;            // seconds since boot, accumulated by the game loop

  // Cat
  cat: {
    position: Vec2;
    velocity: Vec2;
    facing: Facing;
    moving: boolean;
    distanceTravelled: number; // for footstep cadence
  };

  // Scene
  sceneId: SceneId;
  camera: Vec2;
  transition: TransitionState;

  // Movement target (click-to-move). Cleared when keyboard input takes over.
  moveTarget: Vec2 | null;

  // Photo modal
  activePhotoId: string | null;
  // Photos the user explicitly dismissed; suppressed until the cat exits exit-radius.
  dismissedPhotoIds: Set<string>;
}

export const useGameStore = create<GameState>(() => ({
  tElapsed: 0,
  cat: {
    position: { x: 240, y: 135 },
    velocity: { x: 0, y: 0 },
    facing: 'down',
    moving: false,
    distanceTravelled: 0,
  },
  sceneId: 'lobby',
  camera: { x: 0, y: 0 },
  transition: { phase: 'in-scene' },
  moveTarget: null,
  activePhotoId: null,
  dismissedPhotoIds: new Set(),
}));
