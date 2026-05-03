/**
 * Generates placeholder cat sprites for the three facing directions.
 * Output: src/assets/sprites/cat-{side,back,front}.png at 24x20 px.
 *
 * The user can replace any of these by overwriting the file at the
 * same path. The game does not care how the sprite was authored.
 *
 * Palette intentionally matches the brown tabby reference image so
 * placeholders read coherently with later hand-drawn replacements.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'src', 'assets', 'sprites');

const W = 24;
const H = 20;

type Hex = `#${string}`;
const PALETTE: Record<string, Hex | null> = {
  '.': null,           // transparent
  B: '#8b6f47',        // body (mid brown)
  D: '#5e4a30',        // stripes (dark brown)
  C: '#d4a373',        // cream highlight
  W: '#f5e6d3',        // white-ish (paws/chest tip)
  E: '#0d0d0d',        // eye / detail black
  P: '#f4a8b0',        // pink (nose/ear inner)
};

const hexToRgba = (hex: Hex | null): [number, number, number, number] => {
  if (!hex) return [0, 0, 0, 0];
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, 255];
};

const renderSprite = (rows: string[]): Buffer => {
  if (rows.length !== H) throw new Error(`expected ${H} rows, got ${rows.length}`);
  const buf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    const row = rows[y];
    if (row.length !== W) throw new Error(`row ${y} width ${row.length}, expected ${W}`);
    for (let x = 0; x < W; x++) {
      const ch = row[x];
      const color = PALETTE[ch];
      if (color === undefined) throw new Error(`unknown palette char "${ch}" at (${x},${y})`);
      const [r, g, b, a] = hexToRgba(color);
      const i = (y * W + x) * 4;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = a;
    }
  }
  return buf;
};

// Cat in profile, facing right. 24x20.
const SIDE: string[] = [
  '........................',
  '..D.....................',
  '..DD....................',
  '...D....................',
  '...DD................B..',
  '....DDB.............BB..',
  '.....DBBBBBBBBBBBB.BBC..',
  '......BBBBBBBBBBBBBBBE..',
  '......BBDBBBBDBBBBBBBC..',
  '......BBBBBBBBBBBBBBPB..',
  '......BBDBBBBDBBBBBBB...',
  '......BBBBBBBBBBBBBB....',
  '......BBBBBBBBBBBBBB....',
  '......BB.BB....BB.BB....',
  '......BB.BB....BB.BB....',
  '......WW.WW....WW.WW....',
  '........................',
  '........................',
  '........................',
  '........................',
];

// Cat from behind. Symmetric body, tail centered, two ears at top.
const BACK: string[] = [
  '........................',
  '........................',
  '........BB....BB........',
  '.......BCB....BCB.......',
  '......BBBBBBBBBBBB......',
  '.....BBBBBBBBBBBBBB.....',
  '.....BDBBBBBBBBBBDB.....',
  '.....BBBBBBDDBBBBBB.....',
  '.....BBDBBBDDBBBDBB.....',
  '.....BBBBBBBBBBBBBB.....',
  '.....BBBBBBBBBBBBBB.....',
  '.....BBDBBBBBBBBDBB.....',
  '.....BBBBBBBBBBBBBB.....',
  '......BBBBBBBBBBBB......',
  '......BB.BB..BB.BB......',
  '......WW.WW..WW.WW......',
  '..........BBBB..........',
  '..........BCBB..........',
  '...........BB...........',
  '........................',
];

// Cat facing camera. Two eyes, pink nose, tail tip just visible behind.
const FRONT: string[] = [
  '........................',
  '........................',
  '........BB....BB........',
  '.......BPB....BPB.......',
  '......BBBBBBBBBBBB......',
  '.....BBBBBBBBBBBBBB.....',
  '.....BBBEBBBBBBEBBB.....',
  '.....BBBEBBPPBBEBBB.....',
  '.....BBBBBBPPBBBBBB.....',
  '.....BBBBBBBBBBBBBB.....',
  '.....BBDBBBBBBBBDBB.....',
  '.....BBBBBBBBBBBBBB.....',
  '......BBBBBBBBBBBB......',
  '......BBBBBBBBBBBB......',
  '......BB.BB..BB.BB......',
  '......WW.WW..WW.WW......',
  '...................B....',
  '...................B....',
  '...................B....',
  '........................',
];

const sprites: Record<string, string[]> = {
  'cat-side.png': SIDE,
  'cat-back.png': BACK,
  'cat-front.png': FRONT,
};

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const [name, rows] of Object.entries(sprites)) {
    const raw = renderSprite(rows);
    const png = await sharp(raw, { raw: { width: W, height: H, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const outPath = resolve(OUT_DIR, name);
    await writeFile(outPath, png);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
