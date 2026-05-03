/**
 * Generates placeholder hallway segment art and a placeholder modal frame
 * sprite so the project builds without the user's real assets.
 *
 * The placeholders communicate the LAYOUT clearly: north wall band,
 * walkable floor strip, frame slot positions, and the doorway location in
 * the begin segment. Replace any of these PNG/WebPs with your real art at
 * the same path; if the dimensions match what's declared in
 * src/scenes/hallwayLayout.ts, everything just works.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const HALLWAY_DIR = resolve(ROOT, 'src', 'assets', 'hallway');
const UI_DIR = resolve(ROOT, 'src', 'assets', 'ui');

// Mirror layout constants from hallwayLayout.ts so placeholders agree with
// the runtime config. (Hand-kept; intentionally not imported to keep this
// script standalone.)
const FLOOR_Y_TOP = 78;
const FLOOR_Y_BOTTOM = 198;
const NORTH_FRAME_Y = 44;
const CAV_W = 36;
const CAV_H = 28;

const NORTH_WALL_FILL = '#1d3326';      // dark green
const SOUTH_WALL_FILL = '#15261c';
const FLOOR_FILL = '#5b3a22';
const FLOOR_DARK = '#4a2f1c';
const RUNNER_FILL = '#26402f';
const FRAME_OUTLINE = '#7a5a36';
const FRAME_INNER = '#181818';
const TEXT_COLOR = '#f5d090';
const DOORWAY_FILL = '#0a0a08';

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

const segmentSvg = (
  width: number,
  height: number,
  slots: Slot[],
  label: string,
  showLeftDoorway = false,
  showRightWall = false,
): string => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges">
  <!-- north wall -->
  <rect x="0" y="0" width="${width}" height="${FLOOR_Y_TOP}" fill="${NORTH_WALL_FILL}" />
  <!-- baseboard between wall and floor -->
  <rect x="0" y="${FLOOR_Y_TOP - 4}" width="${width}" height="3" fill="${FRAME_OUTLINE}" />
  <!-- floor: walkable strip -->
  <rect x="0" y="${FLOOR_Y_TOP}" width="${width}" height="${FLOOR_Y_BOTTOM - FLOOR_Y_TOP}" fill="${FLOOR_FILL}" />
  <!-- floor plank lines -->
  ${Array.from({ length: 10 }, (_, i) => {
    const y = FLOOR_Y_TOP + 6 + i * 12;
    return `<rect x="0" y="${y}" width="${width}" height="1" fill="${FLOOR_DARK}" />`;
  }).join('\n  ')}
  <!-- runner rug -->
  <rect x="0" y="${(FLOOR_Y_TOP + FLOOR_Y_BOTTOM) / 2 - 14}" width="${width}" height="28" fill="${RUNNER_FILL}" />
  <rect x="0" y="${(FLOOR_Y_TOP + FLOOR_Y_BOTTOM) / 2 - 14}" width="${width}" height="1" fill="#7a5a36" />
  <rect x="0" y="${(FLOOR_Y_TOP + FLOOR_Y_BOTTOM) / 2 + 13}" width="${width}" height="1" fill="#7a5a36" />
  <!-- south wall -->
  <rect x="0" y="${FLOOR_Y_BOTTOM}" width="${width}" height="${height - FLOOR_Y_BOTTOM}" fill="${SOUTH_WALL_FILL}" />
  <rect x="0" y="${FLOOR_Y_BOTTOM}" width="${width}" height="3" fill="${FRAME_OUTLINE}" />

  <!-- frame slots (empty rectangles where photos overlay) -->
  ${slots
    .map(
      (s) => `
    <g>
      <!-- frame outline -->
      <rect x="${s.x - s.w / 2 - 3}" y="${s.y - s.h / 2 - 3}" width="${s.w + 6}" height="${s.h + 6}" fill="${FRAME_OUTLINE}" />
      <rect x="${s.x - s.w / 2 - 1}" y="${s.y - s.h / 2 - 1}" width="${s.w + 2}" height="${s.h + 2}" fill="#3a2914" />
      <rect x="${s.x - s.w / 2}" y="${s.y - s.h / 2}" width="${s.w}" height="${s.h}" fill="${FRAME_INNER}" />
      <!-- lamp above -->
      <rect x="${s.x - 5}" y="${s.y - s.h / 2 - 14}" width="10" height="6" fill="#b08040" />
      <rect x="${s.x - 1}" y="${s.y - s.h / 2 - 16}" width="2" height="2" fill="#3a2914" />
      <!-- plaque below -->
      <rect x="${s.x - 8}" y="${s.y + s.h / 2 + 6}" width="16" height="4" fill="#b08858" />
    </g>
  `,
    )
    .join('\n')}

  ${showLeftDoorway ? `
    <!-- doorway back to lobby on the LEFT side of begin segment -->
    <rect x="0" y="${FLOOR_Y_TOP - 8}" width="40" height="${FLOOR_Y_BOTTOM - FLOOR_Y_TOP + 16}" fill="${DOORWAY_FILL}" />
    <rect x="38" y="${FLOOR_Y_TOP - 8}" width="3" height="${FLOOR_Y_BOTTOM - FLOOR_Y_TOP + 16}" fill="${FRAME_OUTLINE}" />
    <text x="20" y="${(FLOOR_Y_TOP + FLOOR_Y_BOTTOM) / 2 + 3}" font-family="monospace" font-size="6" fill="${TEXT_COLOR}" text-anchor="middle">EXIT</text>
  ` : ''}

  ${showRightWall ? `
    <!-- end-of-corridor wall on the RIGHT -->
    <rect x="${width - 36}" y="${FLOOR_Y_TOP}" width="36" height="${FLOOR_Y_BOTTOM - FLOOR_Y_TOP}" fill="${NORTH_WALL_FILL}" />
    <rect x="${width - 39}" y="${FLOOR_Y_TOP}" width="3" height="${FLOOR_Y_BOTTOM - FLOOR_Y_TOP}" fill="${FRAME_OUTLINE}" />
  ` : ''}

  <!-- segment label centered -->
  <text x="${width / 2}" y="${height - 10}" font-family="monospace" font-size="10" fill="${TEXT_COLOR}" text-anchor="middle" font-weight="bold">${label}</text>
</svg>`;

const frameSvg = (): string => {
  // Modal frame placeholder: ornate gold/wood ring with a transparent center.
  const W = 96;
  const H = 120;
  const slot = { x: 12, y: 12, w: 72, h: 72 }; // photo cavity
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" shape-rendering="crispEdges">
  <!-- outer wood molding -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="#7a5a36" />
  <rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="#3a2914" />
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="#a07840" />
  <rect x="9" y="9" width="${W - 18}" height="${H - 18}" fill="#3a2914" />
  <!-- transparent photo cavity -->
  <rect x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" fill="none" stroke="#222" stroke-width="1" />
  <rect x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" fill="rgba(0,0,0,0.001)" />
  <!-- corner ornaments -->
  ${[
    [3, 3],
    [W - 11, 3],
    [3, slot.y + slot.h - 5],
    [W - 11, slot.y + slot.h - 5],
  ]
    .map(([x, y]) => `<rect x="${x}" y="${y}" width="8" height="8" fill="#d4a060" />`)
    .join('\n  ')}
  <!-- brass plaque under photo -->
  <rect x="${W / 2 - 18}" y="${slot.y + slot.h + 6}" width="36" height="14" fill="#b08858" stroke="#3a2914" stroke-width="1" />
  <text x="${W / 2}" y="${slot.y + slot.h + 16}" font-family="monospace" font-size="6" fill="#1a1208" text-anchor="middle" font-weight="bold">PLAQUE</text>
</svg>`;
};

async function svgToWebp(svg: string, outPath: string): Promise<void> {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  // Convert via PNG → WebP for consistent rendering of vector text.
  const webp = await sharp(png).webp({ quality: 92 }).toBuffer();
  await writeFile(outPath, webp);
  // eslint-disable-next-line no-console
  console.log(`wrote ${outPath}`);
}

async function main() {
  await mkdir(HALLWAY_DIR, { recursive: true });
  await mkdir(UI_DIR, { recursive: true });

  // begin: 2 slots + visible doorway on left
  await svgToWebp(
    segmentSvg(
      240,
      270,
      [
        { x: 96, y: NORTH_FRAME_Y, w: CAV_W, h: CAV_H },
        { x: 184, y: NORTH_FRAME_Y, w: CAV_W, h: CAV_H },
      ],
      'BEGIN',
      true,
      false,
    ),
    resolve(HALLWAY_DIR, 'begin.webp'),
  );

  // middle: 4 slots, repeatable
  await svgToWebp(
    segmentSvg(
      192,
      270,
      [
        { x: 24, y: NORTH_FRAME_Y, w: CAV_W, h: CAV_H },
        { x: 72, y: NORTH_FRAME_Y, w: CAV_W, h: CAV_H },
        { x: 120, y: NORTH_FRAME_Y, w: CAV_W, h: CAV_H },
        { x: 168, y: NORTH_FRAME_Y, w: CAV_W, h: CAV_H },
      ],
      'MIDDLE  · repeatable',
      false,
      false,
    ),
    resolve(HALLWAY_DIR, 'middle.webp'),
  );

  // end: 2 slots + dead-end wall on right
  await svgToWebp(
    segmentSvg(
      240,
      270,
      [
        { x: 56, y: NORTH_FRAME_Y, w: CAV_W, h: CAV_H },
        { x: 144, y: NORTH_FRAME_Y, w: CAV_W, h: CAV_H },
      ],
      'END',
      false,
      true,
    ),
    resolve(HALLWAY_DIR, 'end.webp'),
  );

  // modal frame
  await svgToWebp(frameSvg(), resolve(UI_DIR, 'frame.webp'));
}

try {
  await main();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
}
