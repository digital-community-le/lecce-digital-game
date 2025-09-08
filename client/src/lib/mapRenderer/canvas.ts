/**
 * Canvas utilities and preparation functions
 */

/**
 * Prepare canvas for high-DPI, pixel-perfect drawing and compute tile size.
 * Returns drawing context and layout sizes.
 */
import type { MapNode, TerrainType } from './types';
import { findNearestAllowedTile } from './pathfinding';

/**
 * Canvas preparation and challenge positioning utilities
 */

/**
 * Prepares canvas for rendering by calculating responsive dimensions
 */
export const prepareCanvas = (
  canvas: HTMLCanvasElement,
  mapWidth: number,
  mapHeight: number,
  headerHeight = 48
) => {
  const rect = canvas.getBoundingClientRect();
  const containerWidth = rect.width;
  const containerHeight = rect.height - headerHeight;

  canvas.width = containerWidth;
  canvas.height = containerHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const tileSizeX = containerWidth / mapWidth;
  const tileSizeY = containerHeight / mapHeight;
  const actualTileSize = Math.min(tileSizeX, tileSizeY);

  return { ctx, containerWidth, containerHeight, actualTileSize };
};

/**
 * Determines a safe position for a challenge node, avoiding forbidden terrain types
 */
export const determineSafePositionForChallenge = (
  node: MapNode,
  canvasWidth: number,
  canvasHeight: number,
  mapWidth: number,
  mapHeight: number,
  forbidden: TerrainType[] = ['mountain', 'lake'] // Removed forest - nodes can be on trees
) => {
  const leftPct = parseFloat(node.position.left.replace('%', ''));
  const topPct = parseFloat(node.position.top.replace('%', ''));

  const tileX = Math.floor((leftPct / 100) * mapWidth);
  const tileY = Math.floor((topPct / 100) * mapHeight);

  const allowed = findNearestAllowedTile(tileX, tileY, mapWidth, mapHeight, forbidden);
  let finalX = tileX;
  let finalY = tileY;
  if (allowed) {
    finalX = allowed.x;
    finalY = allowed.y;
  }

  const centerLeftPct = ((finalX + 0.5) / mapWidth) * 100;
  const centerTopPct = ((finalY + 0.5) / mapHeight) * 100;

  const pixelX = (centerLeftPct / 100) * canvasWidth;
  const pixelY = (centerTopPct / 100) * canvasHeight;

  return { leftPercent: `${centerLeftPct}%`, topPercent: `${centerTopPct}%`, pixelX, pixelY };
};
