import { createHallwayScene } from './hallwayFactory';
import { photoIdsForGallery } from '@/data/photoManifest';

export const europeScene = createHallwayScene({
  id: 'europe',
  title: 'Europe',
  photoIds: photoIdsForGallery('europe'),
});
