import type { Rect, Vec2 } from './math';

export type SceneId = string;

export type DoorOrientation = 'north' | 'south' | 'east' | 'west';

export interface Door {
  id: string;
  /** Trigger rect — overlaps the inside edge of the walkable area against the wall. */
  rect: Rect;
  label: string;
  targetSceneId: SceneId;
  spawnAt: Vec2;
  /** Which wall this doorway sits in. Drives visual orientation. */
  orientation: DoorOrientation;
}

export interface PhotoPlacement {
  photoId: string;
  /** Center of the photo in scene-space. */
  position: Vec2;
  wall: 'north' | 'south';
  /** Inner cavity (the visible photo image) in scene pixels. The frame
   *  art is part of the underlying segment image, so this is just the
   *  pane the user's photo fills. */
  cavity: { w: number; h: number };
  scale?: number;
}

export type Background =
  | { kind: 'tile'; color: string; gridColor?: string; gridSize?: number }
  | { kind: 'image'; url: string };

interface SceneBase {
  id: SceneId;
  title: string;
  size: { w: number; h: number };
  walkable: Rect[];
  spawnAt: Vec2;
  background: Background;
  music?: string;
}

export interface LobbyScene extends SceneBase {
  kind: 'lobby';
  doors: Door[];
}

export interface HallwaySegmentInstance {
  src: string;
  /** Left edge of this segment in scene-space. */
  x: number;
  width: number;
  height: number;
}

export interface HallwayScene extends SceneBase {
  kind: 'hallway';
  photos: PhotoPlacement[];
  exit: Door;
  scrollAxis: 'x';
  /** Composed segment images (begin + N×middle + end), positioned absolutely. */
  segments: HallwaySegmentInstance[];
}

export type Scene = LobbyScene | HallwayScene;
