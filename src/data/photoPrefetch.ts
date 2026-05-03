import { resolvePhoto } from './photoManifest';

/**
 * Warms the browser cache for a photo's full-res image. Called from the game
 * loop on every prefetch candidate; idempotent — once requested, never again.
 *
 * `<link rel="prefetch">` would also work but `new Image()` is simpler and
 * doesn't require manipulating <head>.
 */
const requested = new Set<string>();

export const prefetchPhoto = (id: string): void => {
  if (requested.has(id)) return;
  const photo = resolvePhoto(id);
  if (!photo) return;
  requested.add(id);
  const img = new Image();
  img.decoding = 'async';
  img.src = photo.fullUrl;
};
