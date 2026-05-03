import type { LobbyScene } from '@/types/scene';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '@/engine/constants';

/**
 * Lobby layout (480 x 270 design space, top-down):
 *
 *   x=0           x=48                            x=432         x=480
 *   ╔═══════════════════[ MADISON ]══════════════════════════════╗  y=0
 *   ║                       ║                                     ║   north wall
 *   ║                       ║                                     ║   (h=72)
 *   ║                       ║                                     ║
 *   ╠═══════════════════════╝═════════════════════════════════════╣  y=72
 *   ║                                                             ║
 *  [E]            walkable interior                              [A]   side walls
 *  [U]              floor                                        [P]   open into
 *  [R]                                                           [P]   the lobby
 *   ║                                                             ║
 *   ╠═════════════════════════════════════════════════════════════╣  y=200
 *   ║                  south wall (decorative)                    ║
 *   ╚═════════════════════════════════════════════════════════════╝  y=270
 *
 * Doors are positioned with their trigger rect just inside the walkable edge
 * against each wall. The visual cutout extends into the wall from there.
 */

const WALL_NORTH = 72;
const WALL_SOUTH = 70;
const WALL_SIDE = 48;

const WALK = {
  x: WALL_SIDE,
  y: WALL_NORTH,
  w: DESIGN_WIDTH - WALL_SIDE * 2,
  h: DESIGN_HEIGHT - WALL_NORTH - WALL_SOUTH,
};

const DOOR_THICKNESS = 8; // how far inside walkable the trigger sits
const NORTH_DOOR_W = 44;
const SIDE_DOOR_H = 44;

const sideDoorY = Math.round(WALK.y + WALK.h / 2 - SIDE_DOOR_H / 2);

export const lobbyScene: LobbyScene = {
  kind: 'lobby',
  id: 'lobby',
  title: 'Lobby',
  size: { w: DESIGN_WIDTH, h: DESIGN_HEIGHT },
  walkable: [WALK],
  spawnAt: { x: DESIGN_WIDTH / 2, y: WALK.y + WALK.h - 28 },
  background: { kind: 'tile', color: '#5b3a22' },
  doors: [
    {
      id: 'door-madison',
      label: 'Madison',
      orientation: 'north',
      rect: {
        x: Math.round(DESIGN_WIDTH / 2 - NORTH_DOOR_W / 2),
        y: WALK.y,
        w: NORTH_DOOR_W,
        h: DOOR_THICKNESS,
      },
      targetSceneId: 'madison',
      spawnAt: { x: 0, y: 0 }, // not used; hallway provides its own spawn
    },
    {
      id: 'door-europe',
      label: 'Europe',
      orientation: 'west',
      rect: {
        x: WALK.x,
        y: sideDoorY,
        w: DOOR_THICKNESS,
        h: SIDE_DOOR_H,
      },
      targetSceneId: 'europe',
      spawnAt: { x: 0, y: 0 },
    },
    {
      id: 'door-appalachian',
      label: 'Appalachian Trail',
      orientation: 'east',
      rect: {
        x: WALK.x + WALK.w - DOOR_THICKNESS,
        y: sideDoorY,
        w: DOOR_THICKNESS,
        h: SIDE_DOOR_H,
      },
      targetSceneId: 'appalachian-trail',
      spawnAt: { x: 0, y: 0 },
    },
  ],
};

/**
 * Where the cat appears when returning from a hallway. Must sit OUTSIDE the
 * lobby door's trigger rect (otherwise the cat would re-trigger and bounce
 * back to the hallway it just exited).
 */
export const LOBBY_RETURN_SPAWNS: Record<string, { x: number; y: number }> = {
  madison: { x: DESIGN_WIDTH / 2, y: WALK.y + 20 },
  europe: { x: WALK.x + 24, y: sideDoorY + SIDE_DOOR_H / 2 },
  'appalachian-trail': {
    x: WALK.x + WALK.w - 24,
    y: sideDoorY + SIDE_DOOR_H / 2,
  },
};

export const LOBBY_GEOMETRY = {
  walkable: WALK,
  walls: {
    north: WALL_NORTH,
    south: WALL_SOUTH,
    side: WALL_SIDE,
  },
};
