import type { LobbyScene } from '@/types/scene';
import { Door } from './Door';
import { LOBBY_GEOMETRY } from '@/scenes/lobby';
import styles from './Lobby.module.css';

interface LobbyProps {
  scene: LobbyScene;
}

export function Lobby({ scene }: Readonly<LobbyProps>) {
  const { walkable, walls } = LOBBY_GEOMETRY;

  // Center rug, sized smaller than walkable so it doesn't crowd the doorways.
  const rugW = Math.round(walkable.w * 0.55);
  const rugH = Math.round(walkable.h * 0.55);
  const rugX = walkable.x + Math.round((walkable.w - rugW) / 2);
  const rugY = walkable.y + Math.round((walkable.h - rugH) / 2);

  return (
    <div
      className={styles.lobby}
      style={{ width: scene.size.w, height: scene.size.h }}
    >
      <div className={styles.floor} />

      <div className={styles.rug} style={{ left: rugX, top: rugY, width: rugW, height: rugH }} />

      <div className={styles.wallNorth} style={{ height: walls.north }} />
      <div className={styles.wallSouth} style={{ height: walls.south }} />
      <div className={styles.wallWest} style={{ width: walls.side }} />
      <div className={styles.wallEast} style={{ width: walls.side }} />

      <div className={styles.moldingNorth} style={{ top: walls.north - 1 }} />
      <div className={styles.moldingSouth} style={{ bottom: walls.south - 1 }} />
      <div className={styles.moldingWest} style={{ left: walls.side - 1 }} />
      <div className={styles.moldingEast} style={{ right: walls.side - 1 }} />

      <div className={styles.welcomePlaque} style={{ bottom: 10 }}>
        SAM&apos;S GALLERY · WASD or click
      </div>

      {/* Decorative plants in the four corners of the walkable area. */}
      <div className={styles.plant} style={{ left: walkable.x + 6, top: walkable.y + 6 }} />
      <div className={styles.plant} style={{ left: walkable.x + walkable.w - 20, top: walkable.y + 6 }} />
      <div className={styles.plant} style={{ left: walkable.x + 6, top: walkable.y + walkable.h - 24 }} />
      <div className={styles.plant} style={{ left: walkable.x + walkable.w - 20, top: walkable.y + walkable.h - 24 }} />

      {scene.doors.map((door) => (
        <Door key={door.id} door={door} />
      ))}
    </div>
  );
}
