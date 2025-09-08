/**
 * Map Renderer - Barrel exports
 * 
 * Main entry point for the modularized map rendering system.
 * This maintains backward compatibility with the original mapRenderer.ts API.
 */

// Re-export types
export type { TerrainType, MapTile, PathSegment, NodeRect } from './types';

// Re-export utilities by category
export { preloadMapIcons } from './iconCache';
export { generateTerrainTiles, determineTileType } from './terrain';
export { prepareCanvas, determineSafePositionForChallenge } from './canvas';
export {
  findNearestAllowedTile,
  generatePaths
} from './pathfinding';
export { drawTileResponsive, drawRoadResponsive, drawChallengeBadge } from './drawing';

// Main renderer
export { renderMap } from './renderer';
