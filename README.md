# Gallery

A Stardew Valley–style interactive photography portfolio. A pixel-art cat
roams a top-down lobby; each labeled hallway opens onto a corridor of
photos. Walking up to a photo enlarges it to full screen; walking away
closes it.

- WASD or arrow keys to move
- Click anywhere reachable to walk there
- Escape (or click the backdrop) to dismiss a photo
- Backtick (`) toggles the debug overlay

Built with Vite + React + TypeScript. Photos are hosted on Vercel Blob.
The runtime bundle is small; photos are loaded lazily.

## Local development

```bash
npm install
npm run dev          # localhost:5173
npm run typecheck
npm run build        # → dist/
npm run preview      # serves dist/ for a smoke test
```

## Adding a new gallery

The architecture is photo-data-driven. Adding a new gallery is three steps:

1. **Drop photos** into `photos-source/<gallery-name>/`. Any mix of
   `.jpg`, `.jpeg`, `.png`, `.webp` works. Filenames become photo IDs:
   `photos-source/europe/01-paris.jpg` → photo id `europe/01-paris`.

2. **Upload** them. The script generates a 512px-wide thumbnail and a
   1920px-capped full WebP for each source, uploads both to Vercel Blob,
   and rewrites `src/data/photoManifest.ts`.

   ```bash
   # one-time: store secrets in .env.local (gitignored)
   echo 'BLOB_READ_WRITE_TOKEN=vercel_blob_rw_…' >> .env.local
   echo 'VITE_BLOB_BASE=https://<your-store>.public.blob.vercel-storage.com' >> .env.local

   npm run upload-photos
   ```

   The script caches by sha256, so re-running only uploads changed
   photos.

3. **Register the hallway** if it's a brand-new collection:
   - Create `src/scenes/<gallery-name>.ts` mirroring `src/scenes/europe.ts`.
   - Add it to `SCENES` in `src/scenes/index.ts` and add a return-spawn
     to `HALLWAY_RETURN_SPAWNS` in the same file.
   - Add a `Door` to `src/scenes/lobby.ts`.

For the three galleries shipped here (`europe`, `madison`,
`appalachian-trail`), step 3 is already done — adding photos is just steps
1 and 2.

## Replacing the hallway art (begin / middle / end + modal frame)

The hallway is composed at runtime from three segment images and one frame
sprite. Drop your art at these paths:

| Path | Purpose |
| --- | --- |
| `src/assets/hallway/begin.webp` | Left end of the hallway. Doorway back to the lobby visible on its left side. The cat spawns just past this doorway. |
| `src/assets/hallway/middle.webp` | Repeatable middle section. Tiled horizontally as photo count grows. |
| `src/assets/hallway/end.webp` | Right end of the hallway. Dead-end wall on its right. |
| `src/assets/ui/frame.webp` | Standalone ornate frame used by the fullscreen photo modal (the reference image with the moon photo + plaque). |

Each segment image bakes in the wall, lamps, ornate frames, plaques, runner
rug, and floor — everything *except* the user's photos, which the runtime
overlays into the empty cavity inside each frame.

**You don't need to do anything to make new photos extend the hallway.** As
you add more, the factory inserts more middle segments automatically, the
scene grows wider, and the camera tracks the cat through the longer
corridor. The end segment always anchors the right edge.

### Tuning the slot positions

After dropping in your real art, open
[src/scenes/hallwayLayout.ts](src/scenes/hallwayLayout.ts) and adjust the
numbers to line up the photos with the frame openings in your art:

- `width` / `height` — the segment image's intended size in scene pixels
  (the design space is 480×270; segments are typically wider than the
  viewport because the hallway scrolls horizontally).
- `slots[].x`, `slots[].y` — center of each frame's photo cavity, in
  segment-local coordinates.
- `slots[].w`, `slots[].h` — inner cavity dimensions (how big the actual
  photo image renders inside the frame painted in the art).
- `begin.spawnAt` — where the cat appears when entering the hallway from
  the lobby (just past the painted doorway).
- `begin.exitTrigger` — the rect that, when the cat enters it, sends them
  back to the lobby. Match it to where the doorway is in `begin.webp`.
- `floorYTop` / `floorYBottom` — the y-range the cat is allowed to walk
  in. Match it to where the painted floor begins/ends in your segments.
- `modalFrame.slice` — 9-slice insets in the frame sprite's source pixels.
  Set them so the corner ornaments fall inside the four corner slices and
  the flat edges fall in the middle slices. CSS will then stretch the
  edges as the modal grows without distorting the corners.
- `modalFrame.padding` — how far the photo cavity is inset from the frame's
  outer edge (top/right/bottom/left). The bottom padding usually needs to
  be larger to leave room for the brass plaque.

### Regenerating placeholders

If you want fresh placeholder art (e.g. you changed dimensions in
hallwayLayout.ts and want the placeholders to reflect them), edit the
matching constants in
[scripts/generate-hallway-placeholders.ts](scripts/generate-hallway-placeholders.ts)
and run:

```bash
npm run gen-hallway
```

## Replacing the placeholder cat sprites

Drop replacements at the same paths:

- `src/assets/sprites/cat-side.png` (24×20, faces right)
- `src/assets/sprites/cat-back.png` (24×20, seen from behind)
- `src/assets/sprites/cat-front.png` (24×20, faces camera)

The runtime knows nothing about how the sprites were authored — overwrite
the files and reload. To regenerate the placeholders, `npm run gen-cat`.

## Pushing the visuals further (asset packs)

The walls, floor, doorway recesses, lamps, frames, and plants you see
right now are pure CSS — designed to look reasonable while staying tiny
in the bundle (no asset downloads). To match the cozy painted-pixel feel
of a real Stardew-class gallery you'll want sprite art. Three places to
look, ranked by fit for this project:

1. **Itch.io — top-down interior tilesets.** Best fit. Search
   `rpg tileset interior`, `cozy room`, or browse:
   - **LimeZu — Modern Interiors** — huge, polished top-down interior
     pack with wood floors, walls, paintings, lamps, plants, rugs.
     Drop-in for nearly every prop in this scene.
   - **Cup Nooble — Sweet 16x16 RPG** packs — gentle palette, very
     close to the reference look you sent.
   - **PIPOYA RPG Tileset** — free and CC, thinner coverage but a fine
     starter.
2. **OpenGameArt.org** — CC-licensed. Search `wood floor`, `interior
   tileset`, `LPC interior`. Quality varies; LPC sets are reliable.
3. **CraftPix.net** — commercial bundles. The top-down `Gallery /
   Museum` and `Cozy Tavern` packs are exactly this aesthetic if you
   want one buy-everything-included option.

### How to swap CSS art for sprite art

The CSS chrome lives in three files; each has a clear seam to swap a
sprite into:

- **Floors:** in [src/components/Lobby.module.css](src/components/Lobby.module.css)
  and [src/components/Hallway.module.css](src/components/Hallway.module.css)
  the `.floor` rule paints a wood gradient. Replace with
  `background: url('@/assets/tiles/floor.png') repeat;` (Vite resolves the
  alias). Keep `image-rendering: pixelated` global rule.
- **Walls:** the `.wallNorth/South/West/East` rules. Same approach — swap
  the gradients for tiled background images.
- **Doorways:** [src/components/Door.tsx](src/components/Door.tsx) renders
  a recess + frame + lamp + sign + halo. The shapes are absolutely
  positioned with computed coords, so each piece can become an `<img>`
  with the same coords. The halo (warm light) is best left as CSS — it
  blends with whatever sprite floor you choose.
- **Photo frames:** [src/components/PhotoFrame.tsx](src/components/PhotoFrame.tsx).
  Replace `.molding` with a 9-slice frame sprite (CSS `border-image`)
  for ornate gold trim that scales cleanly.
- **Lamps:** any `.lamp` div can become an `<img>` of a wall sconce
  sprite. Keep its computed `left/top` and let the sprite handle visuals.

### Sourcing audio

The procedural ambient pads are placeholders. To swap for real loops:

- **Pixabay Music** — free, attribution often optional. Search
  `lofi loop`, `cozy ambient`, `chiptune calm`.
- **Freesound.org** — community-licensed sound effects (footsteps,
  ambient room tones).

Drop files in `public/audio/` (so they're served at the root URL) and
edit `SCENE_MUSIC` in [src/engine/audio.ts](src/engine/audio.ts) to
reference them by URL.

## Replacing the procedural music

`src/engine/audio.ts` ships a procedural ambient pad per scene. To use a
real audio file instead, edit `SCENE_MUSIC` to point that scene at a URL:

```ts
const SCENE_MUSIC: Record<string, MusicSpec | { url: string }> = {
  lobby: { url: '/audio/lobby-loop.mp3' },
  // …
};
```

Drop the file in `public/audio/` so it's served at the matching URL.

## Architecture in 30 seconds

- **Internal resolution: 480 × 270.** Everything (cat speed, walls, photo
  positions) is in those coordinates. The viewport scales to the window
  by an integer factor with letterbox bars — pixel-perfect at any size.
- **Single fixed-timestep game loop** in `src/engine/gameLoop.ts`. Each
  tick: time, movement, door triggers, transitions, camera, proximity.
- **Zustand store** holds cat state, scene id, camera, active photo, and
  transition phase. Components subscribe with narrow selectors so only
  the cat re-renders per frame.
- **Scenes are data**, not code. `src/types/scene.ts` defines a
  discriminated union (`lobby` | `hallway`); `src/scenes/*.ts` are
  configurations. `SceneRenderer` picks the right component.
- **Movement: WASD + click-to-move; most-recent-input-wins.** Click sets
  `moveTarget`; pressing a direction key clears it and switches to direct
  control. Collision is axis-separated so the cat slides along walls.
- **Photo modals open by proximity, not by click.** The cat must be
  facing the wall and within 48 in-game pixels; hysteresis closes the
  modal at 64 px to prevent flicker. Pressing Escape suppresses that
  photo until the cat physically moves outside the exit radius.

## Deploying

The repo is set up for Vercel out of the box.

1. Push to a Git remote and import the repo in Vercel. Framework preset
   = Vite.
2. Set environment variables in Vercel:
   - `VITE_BLOB_BASE` — public URL prefix for your Blob store.
3. The bundled `vercel.json` provides:
   - SPA fallback (`/*` → `/index.html`)
   - Immutable cache headers for `/assets/*` (hashed filenames)

Photos are *not* in the build output — they're served directly from
Vercel Blob, which has its own CDN.

## Known limitations

- Mobile portrait gets a small (1×) integer scale; landscape is the
  intended experience. A "rotate to landscape" hint would be a nice
  v1.1 addition.
- Procedural music is a placeholder vibe; pair a real loop per scene
  for finished feel.
- Cat sprites are placeholders. Replace them when you have real ones.
"# Gallery" 
