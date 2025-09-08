/**
 * Terrain generation utilities
 */
import type { TerrainType, MapTile } from './types';

/**
 * Generate deterministic terrain tiles for a map grid.
 * Kept pure for testability.
 */
export const generateTerrainTiles = (mapWidth: number, mapHeight: number): MapTile[] => {
  const tiles: MapTile[] = [];

  for (let x = 0; x < mapWidth; x++) {
    for (let y = 0; y < mapHeight; y++) {
      const tileType = determineTileType(x, y, mapWidth, mapHeight);
      tiles.push({ x, y, type: tileType });
    }
  }

  return tiles;
};

/**
 * Determine tile type for given coordinates; extracted for reuse and testing.
 */
export const determineTileType = (x: number, y: number, mapWidth: number, mapHeight: number): TerrainType => {
  // Default
  let tileType: TerrainType = 'grass';

  if ((x < 16 && y < 12) || (x < 12 && y > 24)) {
    tileType = 'forest';
  } else if (y < 8 && x > 20 && x < 40) {
    tileType = 'mountain';
  } else if (x > 36 && y > 26) {
    tileType = 'lake';
  } else if ((x + y) % 14 === 0 && x > 10 && x < 36 && y > 16) {
    tileType = 'forest';
  }

  return tileType;
};
