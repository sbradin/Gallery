export interface Photo {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  width: number;
  height: number;
}

export type PhotoManifest = Record<string, Omit<Photo, 'thumbUrl' | 'fullUrl'>>;
