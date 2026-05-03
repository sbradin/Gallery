import { useCallback } from 'react';
import { Viewport } from '@/components/Viewport';
import { SceneRenderer } from '@/components/SceneRenderer';
import { FadeTransition } from '@/components/FadeTransition';
import { PhotoModal } from '@/components/PhotoModal';
import { DebugBoxes, DebugPanel, useDebug } from '@/components/DebugOverlay';
import { useGameLoop } from '@/engine/useGameLoop';
import { useInput } from '@/engine/useInput';
import { input } from '@/engine/input';
import { useGameStore } from '@/store/gameStore';
import { getScene } from '@/scenes';
import { clampToWalkable } from '@/engine/collision';
import { isTransitionLocked } from '@/engine/transitions';
import { isAudioUnlocked, playSceneMusic, unlockAudio } from '@/engine/audio';

export default function App() {
  useGameLoop();
  useInput();
  const debug = useDebug();

  const onPointerDown = useCallback((sceneX: number, sceneY: number) => {
    const state = useGameStore.getState();
    const wasUnlocked = isAudioUnlocked();
    unlockAudio();
    if (!wasUnlocked && isAudioUnlocked()) {
      playSceneMusic(state.sceneId);
    }
    if (isTransitionLocked(state.transition)) return;
    const scene = getScene(state.sceneId);
    const worldX = sceneX + state.camera.x;
    const worldY = sceneY + state.camera.y;
    const target = clampToWalkable({ x: worldX, y: worldY }, scene.walkable);
    input.noteClick();
    useGameStore.setState({ moveTarget: target });
  }, []);

  return (
    <>
      <Viewport onPointerDown={onPointerDown}>
        <SceneRenderer />
        <DebugBoxes visible={debug} />
        <FadeTransition />
      </Viewport>
      <PhotoModal />
      <DebugPanel visible={debug} />
    </>
  );
}
