import { createHallwayScene } from './hallwayFactory';
import { photoIdsForGallery } from '@/data/photoManifest';

export const appalachianTrailScene = createHallwayScene({
  id: 'appalachian-trail',
  title: 'Appalachian Trail',
  photoIds: photoIdsForGallery('appalachian-trail'),
});
