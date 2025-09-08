/**
 * Icon cache and preloading utilities
 */
import { MapNode } from '@/types/game';

// Simple in-memory cache for loaded map icon images. Keyed by the icon path.
const iconCache: Map<string, HTMLImageElement> = new Map();

// Preload function to be called during app initialization
export const preloadMapIcons = (challenges: MapNode[]): Promise<void[]> => {
  // Extract unique icon paths from challenges
  const iconPaths = challenges
    .map(challenge => challenge.nodeIcon)
    .filter((path): path is string => !!path && path.trim().length > 0)
    .filter((path, index, array) => array.indexOf(path) === index); // Remove duplicates

  if (iconPaths.length === 0) {
    console.warn('[mapRenderer] No icon paths found in challenges');
    return Promise.resolve([]);
  }

  return Promise.all(iconPaths.map(iconPath => {
    return new Promise<void>((resolve, reject) => {
      if (iconCache.has(iconPath)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        iconCache.set(iconPath, img);
        resolve();
      };
      img.onerror = (err) => {
        console.error('[mapRenderer] Failed to preload icon:', iconPath, err);
        reject(new Error(`Failed to load icon: ${iconPath}`));
      };
      img.src = iconPath;
    });
  }));
};

export { iconCache };
