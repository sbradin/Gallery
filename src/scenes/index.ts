import type { Scene, SceneId } from '@/types/scene';
import { LOBBY_RETURN_SPAWNS, lobbyScene } from './lobby';
import { europeScene } from './europe';
import { madisonScene } from './madison';
import { appalachianTrailScene } from './appalachian-trail';

export const SCENES: Record<SceneId, Scene> = {
  [lobbyScene.id]: lobbyScene,
  [europeScene.id]: europeScene,
  [madisonScene.id]: madisonScene,
  [appalachianTrailScene.id]: appalachianTrailScene,
};

export const getScene = (id: SceneId): Scene => {
  const scene = SCENES[id];
  if (!scene) throw new Error(`Unknown scene: ${id}`);
  return scene;
};

export const getReturnSpawn = (fromHallwayId: SceneId): { x: number; y: number } =>
  LOBBY_RETURN_SPAWNS[fromHallwayId] ?? lobbyScene.spawnAt;
