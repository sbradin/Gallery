import { useEffect } from 'react';
import { input } from './input';
import { isAudioUnlocked, playSceneMusic, unlockAudio } from './audio';
import { useGameStore } from '@/store/gameStore';

/**
 * Attaches keyboard listeners to the window. Pointer events are handled
 * by Viewport since they need un-projection to design-space coordinates.
 *
 * Keyboard release on blur prevents "stuck keys" when the user alt-tabs
 * mid-walk. The first keypress also unlocks the AudioContext (browsers
 * require a user gesture).
 */
export function useInput() {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      const wasUnlocked = isAudioUnlocked();
      unlockAudio();
      if (!wasUnlocked && isAudioUnlocked()) {
        playSceneMusic(useGameStore.getState().sceneId);
      }
      input.press(e.key);
    };
    const onUp = (e: KeyboardEvent) => input.release(e.key);
    const onBlur = () => input.clear();

    globalThis.addEventListener('keydown', onDown);
    globalThis.addEventListener('keyup', onUp);
    globalThis.addEventListener('blur', onBlur);
    return () => {
      globalThis.removeEventListener('keydown', onDown);
      globalThis.removeEventListener('keyup', onUp);
      globalThis.removeEventListener('blur', onBlur);
    };
  }, []);
}
