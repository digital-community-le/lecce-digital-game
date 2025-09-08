/**
 * Pathfinding and positioning utilities
 */
import type { MapNode } from '@/types/game';
import type { TerrainType, PathSegment } from './types';
import { determineTileType } from './terrain';

/**
 * Find nearest allowed tile index starting from (sx,sy)
 */
export const findNearestAllowedTile = (
  sx: number,
  sy: number,
  mapWidth: number,
  mapHeight: number,
  forbidden: TerrainType[]
) => {
  if (sx < 0 || sy < 0 || sx >= mapWidth || sy >= mapHeight) return null;
  if (!forbidden.includes(determineTileType(sx, sy, mapWidth, mapHeight))) return { x: sx, y: sy };

  const maxRadius = Math.max(mapWidth, mapHeight);
  for (let r = 1; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      const dy = r - Math.abs(dx);
      const candidates = [[sx + dx, sy + dy], [sx + dx, sy - dy]];
      for (const [cx, cy] of candidates) {
        if (cx < 0 || cy < 0 || cx >= mapWidth || cy >= mapHeight) continue;
        const t = determineTileType(cx, cy, mapWidth, mapHeight);
        if (!forbidden.includes(t)) return { x: cx, y: cy };
      }
    }
  }

  return null;
};

/**
 * Like findNearestAllowedTile but excludes any tiles present in `excludedSet`.
 */
export const findNearestAllowedTileExcluding = (
  sx: number,
  sy: number,
  mapWidth: number,
  mapHeight: number,
  forbidden: TerrainType[],
  excludedSet: Set<string>
) => {
  if (sx < 0 || sy < 0 || sx >= mapWidth || sy >= mapHeight) return null;
  const key0 = `${sx},${sy}`;
  if (!excludedSet.has(key0) && !forbidden.includes(determineTileType(sx, sy, mapWidth, mapHeight))) return { x: sx, y: sy };

  const maxRadius = Math.max(mapWidth, mapHeight);
  for (let r = 1; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      const dy = r - Math.abs(dx);
      const candidates = [[sx + dx, sy + dy], [sx + dx, sy - dy]];
      for (const [cx, cy] of candidates) {
        if (cx < 0 || cy < 0 || cx >= mapWidth || cy >= mapHeight) continue;
        const key = `${cx},${cy}`;
        const t = determineTileType(cx, cy, mapWidth, mapHeight);
        if (excludedSet.has(key)) continue;
        if (!forbidden.includes(t)) return { x: cx, y: cy };
      }
    }
  }

  return null;
};

/**
 * Enhanced A* pathfinder with improved turn penalty and better obstacle avoidance.
 * Prioritizes straight paths and prevents road intersections.
 */
export const findTilePath = (
  start: { x: number; y: number },
  goal: { x: number; y: number },
  mapWidth: number,
  mapHeight: number,
  forbidden: TerrainType[],
  excluded: Set<string>,
  used: Set<string>
) => {
  const key = (x: number, y: number, d: number | null) => `${x},${y},${d === null ? 'n' : d}`;
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const turnPenalty = 5; // Increased penalty to favor straight paths

  const open: Array<{ x: number; y: number; g: number; f: number; dir: number | null }> = [];
  const cameFrom = new Map<string, string | null>();
  const gScore = new Map<string, number>();

  const h = (x: number, y: number) => Math.abs(goal.x - x) + Math.abs(goal.y - y);

  const startKey = key(start.x, start.y, null);
  open.push({ x: start.x, y: start.y, g: 0, f: h(start.x, start.y), dir: null });
  gScore.set(startKey, 0);
  cameFrom.set(startKey, null);

  while (open.length > 0) {
    // pop lowest f
    open.sort((a, b) => a.f - b.f);
    const current = open.shift() as any;
    if (current.x === goal.x && current.y === goal.y) {
      // reconstruct path
      // find the key in cameFrom that corresponds to goal with some dir
      let foundKey: string | undefined;
      for (const k of Array.from(cameFrom.keys())) {
        const parts = k.split(',');
        const gx = parseInt(parts[0], 10);
        const gy = parseInt(parts[1], 10);
        if (gx === goal.x && gy === goal.y) { foundKey = k; break; }
      }
      if (!foundKey) return null;
      const path: { x: number; y: number }[] = [];
      let cur: string | null = foundKey;
      while (cur) {
        const [sx, sy] = cur.split(',');
        path.push({ x: parseInt(sx, 10), y: parseInt(sy, 10) });
        cur = cameFrom.get(cur) || null;
      }
      path.reverse();
      return path;
    }

    for (let d = 0; d < dirs.length; d++) {
      const nx = current.x + dirs[d][0];
      const ny = current.y + dirs[d][1];
      if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) continue;
      const tileKey = `${nx},${ny}`;
      if (excluded.has(tileKey)) continue;
      if (used.has(tileKey)) continue;
      const t = determineTileType(nx, ny, mapWidth, mapHeight);
      if (forbidden.includes(t)) continue;

      const turnCost = current.dir === null || current.dir === d ? 0 : turnPenalty;
      const tentativeG = current.g + 1 + turnCost;
      const neighborKey = key(nx, ny, d);
      const prevG = gScore.get(neighborKey);
      if (prevG === undefined || tentativeG < prevG) {
        gScore.set(neighborKey, tentativeG);
        const f = tentativeG + h(nx, ny);
        cameFrom.set(neighborKey, `${current.x},${current.y},${current.dir === null ? 'n' : current.dir}`);
        open.push({ x: nx, y: ny, g: tentativeG, f, dir: d });
      }
    }
  }

  return null;
};

/** Return 8-neighbor keys (and the tile itself) for a given tile */
export const adjacentKeys = (x: number, y: number, mapWidth: number, mapHeight: number) => {
  const keys: string[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) continue;
      keys.push(`${nx},${ny}`);
    }
  }
  return keys;
};

/**
 * Given a challenge node with percentage position, return a safe position
 * (pixel coords and percent strings) that is not on forbidden terrain.
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

/**
 * Convert challenge positions (percentage strings) into pixel path segments.
 * Side-effect free - depends only on inputs.
 */
export const generatePaths = (
  challenges: MapNode[],
  canvasWidth: number,
  canvasHeight: number,
  mapWidth: number,
  mapHeight: number,
  forbidden: TerrainType[] = ['forest', 'mountain', 'lake']
): PathSegment[] => {
  const paths: PathSegment[] = [];
  for (let i = 0; i < challenges.length - 1; i++) {
    const current = challenges[i];
    const next = challenges[i + 1];

    const fromSafe = determineSafePositionForChallenge(current, canvasWidth, canvasHeight, mapWidth, mapHeight, forbidden);
    const toSafe = determineSafePositionForChallenge(next, canvasWidth, canvasHeight, mapWidth, mapHeight, forbidden);

    paths.push({ fromX: fromSafe.pixelX, fromY: fromSafe.pixelY, toX: toSafe.pixelX, toY: toSafe.pixelY });
  }

  return paths;
};
