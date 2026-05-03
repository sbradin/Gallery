import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getScene, getReturnSpawn } from '@/scenes';
import { createGameLoop } from './gameLoop';
import { stepMovement } from './movement';
import { stepCamera } from './camera';
import { isTransitionLocked, stepTransition } from './transitions';
import { stepProximity } from './proximity';
import { pointInRect } from '@/utils/vec';
import type { Door, Scene } from '@/types/scene';
import { prefetchPhoto } from '@/data/photoPrefetch';
import { playFootstep, playSceneMusic } from './audio';

const FOOTSTEP_DIST_PX = 14;

/**
 * Mounts the global game loop. Each fixed tick:
 *  1. advances tElapsed
 *  2. resolves cat movement (input + collision + facing) — skipped during transitions
 *  3. detects door triggers (cat enters a door's rect → start fade)
 *  4. steps the transition state machine; on fade-out completion, swaps scenes
 *  5. steps the camera
 *  6. steps photo proximity (hallway only) and triggers full-res prefetch
 */
export function useGameLoop() {
  useEffect(() => {
    const loop = createGameLoop((dt) => {
      const s = useGameStore.getState();
      const scene = getScene(s.sceneId);
      const locked = isTransitionLocked(s.transition);

      // 1 + 2: time + movement
      const movement = locked
        ? null
        : stepMovement(
            {
              position: s.cat.position,
              facing: s.cat.facing,
              moveTarget: s.moveTarget,
              scene,
            },
            dt,
          );

      const catPos = movement?.position ?? s.cat.position;
      const catFacing = movement?.facing ?? s.cat.facing;
      const catVelocity = movement?.velocity ?? { x: 0, y: 0 };
      const catMoving = movement?.moving ?? false;
      const moveTarget = movement?.moveTarget ?? s.moveTarget;
      const distanceTravelled =
        s.cat.distanceTravelled + (movement?.distanceDelta ?? 0);

      // Footstep ticks: play a step each FOOTSTEP_DIST_PX of travel.
      const prevSteps = Math.floor(s.cat.distanceTravelled / FOOTSTEP_DIST_PX);
      const nextSteps = Math.floor(distanceTravelled / FOOTSTEP_DIST_PX);
      if (nextSteps > prevSteps && (movement?.distanceDelta ?? 0) > 0) {
        playFootstep();
      }

      // 3: door triggers
      let pendingTransition = s.transition;
      if (!locked) {
        const triggered = findTriggeredDoor(scene, catPos);
        if (triggered) {
          const targetSpawn = computeTargetSpawn(scene.id, triggered);
          pendingTransition = {
            phase: 'fade-out',
            from: scene.id,
            to: triggered.targetSceneId,
            spawnAt: targetSpawn,
            t: 0,
          };
        }
      }

      // 4: step transition; possibly swap scenes
      const transStep = stepTransition(pendingTransition, dt);
      let nextSceneId = s.sceneId;
      let nextCatPos = catPos;
      let nextMoveTarget = moveTarget;
      if (transStep.swap) {
        nextSceneId = transStep.swap.sceneId;
        nextCatPos = transStep.swap.spawnAt;
        nextMoveTarget = null;
        playSceneMusic(nextSceneId);
      }

      // 5: camera
      const camScene = getScene(nextSceneId);
      const nextCamera = transStep.swap
        ? stepCamera({ x: 0, y: 0 }, nextCatPos, camScene)
        : stepCamera(s.camera, nextCatPos, camScene);

      // 6: proximity (no-op during transitions or in lobby)
      const proxResult = resolveProximity({
        scene: camScene,
        locked,
        catPos: nextCatPos,
        catFacing,
        prevActive: s.activePhotoId,
        prevDismissed: s.dismissedPhotoIds,
      });

      useGameStore.setState({
        tElapsed: s.tElapsed + dt,
        cat: {
          position: nextCatPos,
          velocity: catVelocity,
          facing: catFacing,
          moving: catMoving,
          distanceTravelled,
        },
        moveTarget: nextMoveTarget,
        transition: transStep.transition,
        sceneId: nextSceneId,
        camera: nextCamera,
        activePhotoId: proxResult.activePhotoId,
        dismissedPhotoIds: proxResult.dismissed,
      });
    });
    loop.start();
    return () => loop.stop();
  }, []);
}

function findTriggeredDoor(
  scene: Scene,
  catPos: { x: number; y: number },
): Door | null {
  if (scene.kind === 'lobby') {
    for (const d of scene.doors) {
      if (pointInRect(catPos, d.rect)) return d;
    }
    return null;
  }
  return pointInRect(catPos, scene.exit.rect) ? scene.exit : null;
}

function computeTargetSpawn(
  fromSceneId: string,
  door: Door,
): { x: number; y: number } {
  if (door.targetSceneId === 'lobby') {
    return getReturnSpawn(fromSceneId);
  }
  const target = getScene(door.targetSceneId);
  return target.spawnAt;
}

interface ProximityArgs {
  scene: Scene;
  locked: boolean;
  catPos: { x: number; y: number };
  catFacing: import('@/types/math').Facing;
  prevActive: string | null;
  prevDismissed: ReadonlySet<string>;
}

interface ProximityOutcome {
  activePhotoId: string | null;
  dismissed: Set<string>;
}

function resolveProximity(args: ProximityArgs): ProximityOutcome {
  const { scene, locked, catPos, catFacing, prevActive, prevDismissed } = args;

  // In the lobby (or while locked) there is no active photo and no dismissals
  // to track.
  if (locked || scene.kind !== 'hallway') {
    // Outside a hallway there's nothing to dismiss; reset state.
    const dismissed =
      prevDismissed.size === 0 ? (prevDismissed as Set<string>) : new Set<string>();
    return { activePhotoId: null, dismissed };
  }

  const prox = stepProximity({
    scene,
    catPos,
    catFacing,
    currentActiveId: prevActive,
    dismissedIds: prevDismissed,
  });

  let dismissed: Set<string>;
  if (prox.releasedDismissals.length === 0) {
    dismissed = prevDismissed as Set<string>;
  } else {
    dismissed = new Set(prevDismissed);
    for (const id of prox.releasedDismissals) dismissed.delete(id);
  }

  for (const id of prox.prefetchIds) prefetchPhoto(id);

  return { activePhotoId: prox.activeId, dismissed };
}
