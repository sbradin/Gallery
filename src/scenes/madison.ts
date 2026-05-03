import { createHallwayScene } from './hallwayFactory';
import { photoIdsForGallery } from '@/data/photoManifest';

export const madisonScene = createHallwayScene({
  id: 'madison',
  title: 'Madison',
  photoIds: photoIdsForGallery('madison'),
});
