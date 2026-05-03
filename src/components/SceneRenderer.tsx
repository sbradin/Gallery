import { useGameStore } from '@/store/gameStore';
import { getScene } from '@/scenes';
import { Lobby } from './Lobby';
import { Hallway } from './Hallway';
import { Cat } from './Cat';
import styles from './SceneRenderer.module.css';

/**
 * Renders the current scene with the camera applied as a single translate.
 * Children inside the world (scene chrome + cat) use scene-space coordinates;
 * the world transform is the only thing that knows about the camera.
 */
export function SceneRenderer() {
  const sceneId = useGameStore((s) => s.sceneId);
  const cameraX = useGameStore((s) => s.camera.x);
  const cameraY = useGameStore((s) => s.camera.y);

  const scene = getScene(sceneId);

  return (
    <div
      className={styles.world}
      style={{
        transform: `translate3d(${-Math.round(cameraX)}px, ${-Math.round(cameraY)}px, 0)`,
      }}
    >
      {scene.kind === 'lobby' ? (
        <Lobby scene={scene} />
      ) : (
        <Hallway scene={scene} />
      )}
      <Cat />
    </div>
  );
}
