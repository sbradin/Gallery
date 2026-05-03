/**
 * Walks `photos-source/<gallery>/*.{jpg,jpeg,png,heic}`, generates two WebP
 * variants per source (a 512px-wide thumb and a 1920px-capped "full"), uploads
 * both to Vercel Blob, and writes `src/data/photoManifest.ts` with intrinsic
 * dimensions.
 *
 * Re-running is safe: identical content (by sha256) is skipped. The script is
 * idempotent so adding new photos is incremental.
 *
 * Required env: BLOB_READ_WRITE_TOKEN, VITE_BLOB_BASE
 *   - BLOB_READ_WRITE_TOKEN is your Vercel Blob token (Project Settings → Storage)
 *   - VITE_BLOB_BASE is the public URL prefix where your blobs live
 *     (e.g. "https://<store>.public.blob.vercel-storage.com/gallery")
 *
 * Usage:
 *   1) drop originals in photos-source/<gallery>/*
 *   2) put the env vars in .env.local
 *   3) `npm run upload-photos`
 *   4) update src/scenes/<gallery>.ts to pass photoIdsForGallery('<gallery>')
 *      to createHallwayScene if you want them in the hallway.
 */

import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { put, list, type PutBlobResult } from '@vercel/blob';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const SOURCE_DIR = resolve(ROOT, 'photos-source');
const MANIFEST_PATH = resolve(ROOT, 'src', 'data', 'photoManifest.ts');
const CACHE_PATH = resolve(ROOT, '.upload-cache.json');

const VARIANTS = {
  thumb: { width: 512, quality: 78 },
  full: { width: 1920, quality: 86 },
} as const;

type Variant = keyof typeof VARIANTS;

interface ManifestEntry {
  id: string;
  width: number;
  height: number;
}

interface CacheEntry {
  hash: string;
  width: number;
  height: number;
  thumbUrl: string;
  fullUrl: string;
}

const SUPPORTED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(p);
    } else if (e.isFile() && SUPPORTED_EXT.has(extname(e.name).toLowerCase())) {
      yield p;
    }
  }
}

const sha256 = (path: string): Promise<string> =>
  new Promise((res, rej) => {
    const h = createHash('sha256');
    const s = createReadStream(path);
    s.on('data', (chunk) => h.update(chunk));
    s.on('end', () => res(h.digest('hex')));
    s.on('error', rej);
  });

const photoIdFromPath = (absPath: string): string => {
  const rel = relative(SOURCE_DIR, absPath).split(sep).join('/');
  // strip extension
  const dot = rel.lastIndexOf('.');
  return dot === -1 ? rel : rel.slice(0, dot);
};

const blobKey = (id: string, variant: Variant): string => {
  const safe = id.replaceAll('/', '_');
  return `${safe}-${variant}.webp`;
};

async function loadCache(): Promise<Record<string, CacheEntry>> {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(await readFile(CACHE_PATH, 'utf8')) as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

async function saveCache(cache: Record<string, CacheEntry>): Promise<void> {
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function uploadVariant(
  buffer: Buffer,
  key: string,
  token: string,
): Promise<PutBlobResult> {
  return put(key, buffer, {
    access: 'public',
    token,
    contentType: 'image/webp',
    addRandomSuffix: false,
  });
}

async function processOne(
  absPath: string,
  cache: Record<string, CacheEntry>,
  token: string,
): Promise<ManifestEntry> {
  const id = photoIdFromPath(absPath);
  const hash = await sha256(absPath);

  const cached = cache[id];
  if (cached?.hash === hash) {
    return { id, width: cached.width, height: cached.height };
  }

  const source = sharp(absPath, { failOn: 'none' }).rotate(); // honor EXIF orientation
  const meta = await source.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width === 0 || height === 0) {
    throw new Error(`Could not read dimensions of ${absPath}`);
  }

  const thumbBuf = await source
    .clone()
    .resize({ width: VARIANTS.thumb.width, withoutEnlargement: true })
    .webp({ quality: VARIANTS.thumb.quality })
    .toBuffer();

  const fullBuf = await source
    .clone()
    .resize({ width: VARIANTS.full.width, withoutEnlargement: true })
    .webp({ quality: VARIANTS.full.quality })
    .toBuffer();

  const thumb = await uploadVariant(thumbBuf, blobKey(id, 'thumb'), token);
  const full = await uploadVariant(fullBuf, blobKey(id, 'full'), token);

  cache[id] = {
    hash,
    width,
    height,
    thumbUrl: thumb.url,
    fullUrl: full.url,
  };

  // eslint-disable-next-line no-console
  console.log(`uploaded ${id}  (${width}x${height})`);

  return { id, width, height };
}

async function writeManifest(entries: ManifestEntry[]): Promise<void> {
  const sorted = [...entries].sort((a, b) => a.id.localeCompare(b.id));
  const body = sorted
    .map((e) => `  '${e.id}': { id: '${e.id}', width: ${e.width}, height: ${e.height} },`)
    .join('\n');

  const file = `import type { Photo, PhotoManifest } from '@/types/photo';

/**
 * AUTO-GENERATED by scripts/upload-photos.ts.
 * Do not edit by hand — re-run the upload script instead.
 */
export const PHOTO_MANIFEST: PhotoManifest = {
${body}
};

const BLOB_BASE = (import.meta.env.VITE_BLOB_BASE as string | undefined) ?? '';

const getPhotoUrl = (id: string, variant: 'thumb' | 'full'): string => {
  const safeId = id.replace(/\\//g, '_');
  return \`\${BLOB_BASE}/\${safeId}-\${variant}.webp\`;
};

export const resolvePhoto = (id: string): Photo | null => {
  const meta = PHOTO_MANIFEST[id];
  if (!meta) return null;
  return {
    id,
    width: meta.width,
    height: meta.height,
    thumbUrl: getPhotoUrl(id, 'thumb'),
    fullUrl: getPhotoUrl(id, 'full'),
  };
};

export const allPhotoIds = (): string[] => Object.keys(PHOTO_MANIFEST);

export const photoIdsForGallery = (gallery: string): string[] =>
  allPhotoIds().filter((id) => id.startsWith(\`\${gallery}/\`));
`;

  await writeFile(MANIFEST_PATH, file, 'utf8');
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is required. Set it in .env.local or your shell environment.',
    );
  }

  if (!existsSync(SOURCE_DIR)) {
    await mkdir(SOURCE_DIR, { recursive: true });
    // eslint-disable-next-line no-console
    console.warn(
      `photos-source/ was empty; created ${SOURCE_DIR}. Drop image folders into it and re-run.`,
    );
    return;
  }

  // Cache stops repeated uploads of unchanged files.
  const cache = await loadCache();

  // Optional: list existing blobs once to surface state in the log.
  try {
    const existing = await list({ token });
    // eslint-disable-next-line no-console
    console.log(`current blob store: ${existing.blobs.length} object(s)`);
  } catch {
    // ignore
  }

  const entries: ManifestEntry[] = [];
  for await (const absPath of walk(SOURCE_DIR)) {
    const s = await stat(absPath);
    if (s.size === 0) continue;
    entries.push(await processOne(absPath, cache, token));
  }

  await saveCache(cache);
  await writeManifest(entries);

  // eslint-disable-next-line no-console
  console.log(
    `wrote ${MANIFEST_PATH} with ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}.`,
  );
}

try {
  await main();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
}
