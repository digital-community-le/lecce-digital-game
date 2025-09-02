/**
 * mapRenderer.ts
 *
 * Service module that encapsulates all map generation and canvas rendering
 * responsibilities. This keeps the Canvas component focused on React/DOM
 * concerns (single responsibility) and makes rendering/testable logic
 * reusable.
 */
import { MapNode } from '@/types/game';
import forestRenderer from './forestRenderer';

// Simple in-memory cache for loaded map icon images. Keyed by the icon path.
const iconCache: Map<string, HTMLImageElement> = new Map();

export type TerrainType = 'grass' | 'forest' | 'mountain' | 'lake' | 'road';

export interface MapTile {
  x: number;
  y: number;
  type: TerrainType;
}

export interface PathSegment {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

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

/**
 * Find nearest allowed tile index starting from (sx,sy)
 */
const findNearestAllowedTile = (
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
      const candidates = [ [sx + dx, sy + dy], [sx + dx, sy - dy] ];
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
const findNearestAllowedTileExcluding = (
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
 * A simple A* pathfinder on the tile grid that minimizes turns by applying a
 * turn penalty. It avoids tiles that are forbidden, excluded, or already used
 * by existing roads.
 */
const findTilePath = (
  start: { x: number; y: number },
  goal: { x: number; y: number },
  mapWidth: number,
  mapHeight: number,
  forbidden: TerrainType[],
  excluded: Set<string>,
  used: Set<string>
) => {
  const key = (x: number, y: number, d: number | null) => `${x},${y},${d === null ? 'n' : d}`;
  const dirs = [ [0, -1], [1, 0], [0, 1], [-1, 0] ];
  const turnPenalty = 2;

  const open: Array<{ x: number; y: number; g: number; f: number; dir: number | null }>= [];
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
const adjacentKeys = (x: number, y: number, mapWidth: number, mapHeight: number) => {
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
  forbidden: TerrainType[] = ['forest', 'mountain', 'lake']
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
 * Draw a single tile on the provided 2D context using a pixel-art style.
 * Implementation intentionally mirrors the earlier component behaviour but
 * is now reusable and easier to test in isolation.
 */
export const drawTileResponsive = (
  ctx: CanvasRenderingContext2D,
  tile: MapTile,
  x: number,
  y: number,
  size: number,
  overlay = false
) => {
  switch (tile.type) {
    case 'grass':
      if (overlay) return; // grass drawn only on base layer
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#16a34a';
      const dotCount = Math.max(4, Math.floor(size / 4));
      for (let i = 0; i < dotCount; i++) {
        const dotX = x + ((tile.x * 7 + tile.y * 3 + i) % size);
        const dotY = y + ((tile.y * 5 + tile.x * 2 + i) % size);
        const dotSize = Math.max(1, Math.floor(size / 16));
        ctx.fillRect(dotX, dotY, dotSize, dotSize);
      }
      break;

    case 'forest':
      // Delegate to forestRenderer which exposes variants and helpers
      const variant = forestRenderer.chooseForestVariant(tile);
      if (variant === 'pine') {
        forestRenderer.drawPine(ctx, tile, x, y, size, overlay);
      } else {
        forestRenderer.drawBroadleaf(ctx, tile, x, y, size, overlay);
      }
      break;

    case 'mountain':
      // Mountains are drawn as overlay elements on layer 2. If this is the
      // base pass (overlay === false) skip to let grass/lake be visible.
      if (!overlay) return;
      ctx.fillStyle = '#6b7280';
      // Only draw rocky texture, avoid full background to preserve underlying tile
      ctx.fillStyle = '#374151';
      const rockCount = Math.max(8, Math.floor((size * size) / 32));
      for (let i = 0; i < rockCount; i++) {
        const rockX = x + ((tile.x * 17 + tile.y * 11 + i) % size);
        const rockY = y + ((tile.y * 19 + tile.x * 7 + i) % size);
        if ((rockX + rockY) % 8 < 4) {
          const rockSize = Math.max(1, Math.floor(size / 16));
          ctx.fillRect(rockX, rockY, rockSize, rockSize);
        }
      }
      break;

    case 'lake':
      if (overlay) return; // lake drawn only on base layer
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#1d4ed8';
      const rippleCount = Math.max(3, Math.floor(size / 6));
      for (let i = 0; i < rippleCount; i++) {
        const rippleX = x + ((tile.x * 23 + i * 9) % (size - 4));
        const rippleY = y + ((tile.y * 29 + i * 7) % (size - 4));
        const rippleSize = Math.max(1, Math.floor(size / 16));
        ctx.fillRect(rippleX, rippleY, rippleSize * 3, rippleSize);
        ctx.fillRect(rippleX + rippleSize, rippleY + rippleSize * 2, rippleSize, rippleSize * 3);
      }
      break;

    case 'road':
      // Roads are special elements; draw only in overlay/pass 3 if requested
      if (!overlay) return;
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#654321';
      const roadDotCount = Math.max(6, Math.floor(size / 3));
      for (let i = 0; i < roadDotCount; i++) {
        const dotX = x + ((tile.x * 31 + i * 13) % size);
        const dotY = y + ((tile.y * 37 + i * 11) % size);
        const dotSize = Math.max(1, Math.floor(size / 32));
        ctx.fillRect(dotX, dotY, dotSize, dotSize);
      }
      break;
  }
};

/**
 * Draw a road between two pixel coordinates. Road width scales with
 * viewport to remain readable on different devices.
 */
export const drawRoadResponsive = (
  ctx: CanvasRenderingContext2D,
  path: PathSegment,
  nodeCenterOffset = 40,
  viewportMin = Math.min(window.innerWidth, window.innerHeight)
) => {
  const startX = path.fromX + nodeCenterOffset;
  const startY = path.fromY + nodeCenterOffset;
  const endX = path.toX + nodeCenterOffset;
  const endY = path.toY + nodeCenterOffset;

  const roadWidth = Math.max(8, Math.floor(viewportMin / 80));
  const borderWidth = roadWidth + 4;

  ctx.strokeStyle = '#654321';
  ctx.lineWidth = borderWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = roadWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
};

/**
 * Prepare canvas for high-DPI, pixel-perfect drawing and compute tile size.
 * Returns drawing context and layout sizes.
 */
export const prepareCanvas = (
  canvas: HTMLCanvasElement,
  mapWidth: number,
  mapHeight: number,
  headerHeight = 48
) => {
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight - headerHeight;

  canvas.style.width = `${containerWidth}px`;
  canvas.style.height = `${containerHeight}px`;

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = containerWidth * pixelRatio;
  canvas.height = containerHeight * pixelRatio;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingEnabled = false;

  const tileWidth = containerWidth / mapWidth;
  const tileHeight = containerHeight / mapHeight;
  // Round tile size to integer CSS pixels to avoid subpixel drawing
  // which can introduce halos/bleeding between adjacent tiles (especially
  // when background colors like water are present).
  const actualTileSize = Math.max(tileWidth, tileHeight);
  const actualTileSizeInt = Math.max(1, Math.ceil(actualTileSize));

  ctx.clearRect(0, 0, containerWidth, containerHeight);

  return { ctx, containerWidth, containerHeight, actualTileSize: actualTileSizeInt };
};

/**
 * High-level render function that composes preparation, generation and drawing
 * steps. Keeps CanvasMap component extremely thin.
 */
export type NodeRect = { cx: number; cy: number; w: number; h: number; bgColor?: string; title?: string; emoji?: string };

export const renderMap = (
  canvas: HTMLCanvasElement,
  challenges: MapNode[],
  mapWidth: number,
  mapHeight: number,
  headerHeight = 48,
  nodeRects?: Record<string, NodeRect>
) => {
  const prepared = prepareCanvas(canvas, mapWidth, mapHeight, headerHeight);
  if (!prepared) return;

  const { ctx, containerWidth, containerHeight, actualTileSize } = prepared;

  // Compute visible tile range and draw only tiles within viewport
  const cols = mapWidth;
  const rows = mapHeight;
  const minCol = 0;
  const minRow = 0;
  const maxCol = Math.min(cols - 1, Math.ceil(containerWidth / actualTileSize));
  const maxRow = Math.min(rows - 1, Math.ceil(containerHeight / actualTileSize));

  // Compute reserved tiles from challenge node percent positions.
  // Tiles in this set will not receive forests/mountains/lakes so nodes
  // remain visually unobstructed. We do not move or alter node positions.
  const reservedTiles = new Set<string>();
  const reservedRadius = 2; // increased neighborhood so overlays don't touch the node
  for (const ch of challenges) {
    const leftPct = parseFloat(ch.position.left.replace('%', ''));
    const topPct = parseFloat(ch.position.top.replace('%', ''));
    const baseTx = Math.floor((leftPct / 100) * mapWidth);
    const baseTy = Math.floor((topPct / 100) * mapHeight);
    for (let dx = -reservedRadius; dx <= reservedRadius; dx++) {
      for (let dy = -reservedRadius; dy <= reservedRadius; dy++) {
        const rx = baseTx + dx;
        const ry = baseTy + dy;
        if (rx >= 0 && ry >= 0 && rx < mapWidth && ry < mapHeight) {
          reservedTiles.add(`${rx},${ry}`);
        }
      }
    }
  }

  // Compute tile-based roads between challenge nodes, avoiding forbidden and
  // reserved tiles and ensuring roads don't overlap. The algorithm uses the
  // A* variant `findTilePath` with a turn penalty to minimize curves.
  const roadTiles = new Set<string>();
  const usedRoadTiles = new Set<string>();
  const forbiddenForRoads: TerrainType[] = ['forest', 'mountain', 'lake'];

  // Ensure the tile directly under each node is marked as a road tile so
  // roads visually connect to nodes even if the pathfinder later routes
  // around obstacles. We don't mark these as `usedRoadTiles` yet to allow
  // the path algorithm to incorporate them into actual paths.
  for (const ch of challenges) {
    const leftPct = parseFloat(ch.position.left.replace('%', ''));
    const topPct = parseFloat(ch.position.top.replace('%', ''));
    const tx = Math.floor((leftPct / 100) * mapWidth);
    const ty = Math.floor((topPct / 100) * mapHeight);
    if (tx >= 0 && ty >= 0 && tx < mapWidth && ty < mapHeight) {
      roadTiles.add(`${tx},${ty}`);
    }
  }

  for (let i = 0; i < challenges.length - 1; i++) {
    const a = challenges[i];
    const b = challenges[i + 1];
    const aLeft = parseFloat(a.position.left.replace('%', ''));
    const aTop = parseFloat(a.position.top.replace('%', ''));
    const bLeft = parseFloat(b.position.left.replace('%', ''));
    const bTop = parseFloat(b.position.top.replace('%', ''));

    const aTx = Math.floor((aLeft / 100) * mapWidth);
    const aTy = Math.floor((aTop / 100) * mapHeight);
    const bTx = Math.floor((bLeft / 100) * mapWidth);
    const bTy = Math.floor((bTop / 100) * mapHeight);

    // Prefer the exact tile under the node as the road endpoint so roads
    // visually connect to nodes. Only if that tile is forbidden we search
    // for the nearest allowed tile.
    let start = { x: aTx, y: aTy } as { x: number; y: number };
    let goal = { x: bTx, y: bTy } as { x: number; y: number };
    const startType = determineTileType(start.x, start.y, mapWidth, mapHeight);
    const goalType = determineTileType(goal.x, goal.y, mapWidth, mapHeight);
    if (forbiddenForRoads.includes(startType)) {
      const s = findNearestAllowedTile(start.x, start.y, mapWidth, mapHeight, forbiddenForRoads);
      if (!s) continue;
      start = s;
    }
    if (forbiddenForRoads.includes(goalType)) {
      const g = findNearestAllowedTile(goal.x, goal.y, mapWidth, mapHeight, forbiddenForRoads);
      if (!g) continue;
      goal = g;
    }

    // Build an excluded set containing tiles adjacent to already used road tiles
    // so new roads won't touch existing roads. This is conservative: it blocks
    // the 8-neighborhood around any used road tile.
    const excludedDueToAdjacency = new Set<string>();
    for (const usedKey of Array.from(usedRoadTiles)) {
      const [ux, uy] = usedKey.split(',').map(s => parseInt(s, 10));
      for (const k of adjacentKeys(ux, uy, mapWidth, mapHeight)) excludedDueToAdjacency.add(k);
    }
    // Ensure we do not exclude the actual endpoints: start/goal must be allowed
    // so roads can visibly touch nodes.
    excludedDueToAdjacency.delete(`${start.x},${start.y}`);
    excludedDueToAdjacency.delete(`${goal.x},${goal.y}`);

    let path = findTilePath(start, goal, mapWidth, mapHeight, forbiddenForRoads, excludedDueToAdjacency, usedRoadTiles);
    if (!path) {
      // Fallback 1: allow adjacency but still avoid used tiles
      path = findTilePath(start, goal, mapWidth, mapHeight, forbiddenForRoads, new Set<string>(), usedRoadTiles);
    }
    if (!path) {
      // Fallback 2: allow overlap completely if needed to ensure connectivity
      path = findTilePath(start, goal, mapWidth, mapHeight, forbiddenForRoads, new Set<string>(), new Set<string>());
    }
    if (!path) continue;

    for (const p of path) {
      const key = `${p.x},${p.y}`;
      roadTiles.add(key);
      usedRoadTiles.add(key);
    }
  }

  // Layer 1: base grass for all visible tiles; lakes drawn above grass
  for (let tx = minCol; tx <= maxCol; tx++) {
    for (let ty = minRow; ty <= maxRow; ty++) {
      const tileX = Math.round(tx * actualTileSize);
      const tileY = Math.round(ty * actualTileSize);
      const tileType = determineTileType(tx, ty, mapWidth, mapHeight);

      // Always draw grass as base so overlays never show water underneath
      const grassTile = { x: tx, y: ty, type: 'grass' } as MapTile;
      drawTileResponsive(ctx, grassTile, tileX, tileY, actualTileSize, false);

      if (tileType === 'lake') {
        // Skip lakes when the tile is reserved for a node to keep node visuals clear.
        if (!reservedTiles.has(`${tx},${ty}`)) {
          const lakeTile = { x: tx, y: ty, type: 'lake' } as MapTile;
          drawTileResponsive(ctx, lakeTile, tileX, tileY, actualTileSize, false);
        }
      }
    }
  }

  // Layer 2: forests then road tiles (roads visually on top of forest).
  for (let tx = minCol; tx <= maxCol; tx++) {
    for (let ty = minRow; ty <= maxRow; ty++) {
      const tileKey = `${tx},${ty}`;
      const tileType = determineTileType(tx, ty, mapWidth, mapHeight);

      // Draw forest elements in layer 2 (unless reserved)
      if (tileType === 'forest' && !reservedTiles.has(tileKey)) {
        const tileX = Math.round(tx * actualTileSize);
        const tileY = Math.round(ty * actualTileSize);
        const tile = { x: tx, y: ty, type: tileType } as MapTile;
        drawTileResponsive(ctx, tile, tileX, tileY, actualTileSize, true);
      }
    }
  }

  // After forests, draw road tiles so they appear on top of forest.
  for (let tx = minCol; tx <= maxCol; tx++) {
    for (let ty = minRow; ty <= maxRow; ty++) {
      const tileKey = `${tx},${ty}`;
      if (roadTiles.has(tileKey)) {
        const tileX = Math.round(tx * actualTileSize);
        const tileY = Math.round(ty * actualTileSize);
        const tile = { x: tx, y: ty, type: 'road' } as MapTile;
        drawTileResponsive(ctx, tile, tileX, tileY, actualTileSize, true);
      }
    }
  }

  // Layer 3: mountains and other heavy overlays. Mountains cannot overlap
  // roads, nor should they be drawn on reserved tiles.
  for (let tx = minCol; tx <= maxCol; tx++) {
    for (let ty = minRow; ty <= maxRow; ty++) {
      const tileKey = `${tx},${ty}`;
      const tileType = determineTileType(tx, ty, mapWidth, mapHeight);
      if (tileType === 'mountain' && !reservedTiles.has(tileKey) && !roadTiles.has(tileKey)) {
        const tileX = Math.round(tx * actualTileSize);
        const tileY = Math.round(ty * actualTileSize);
        const tile = { x: tx, y: ty, type: 'mountain' } as MapTile;
        drawTileResponsive(ctx, tile, tileX, tileY, actualTileSize, true);
      }
    }
  }

  // Layer 4: reserved for special elements (UI markers, collectibles, etc.).
  // Currently handled elsewhere by the Canvas component; kept here as a placeholder.
  // Draw nodes on layer 4 if nodeRects information is available. This renders
  // node boxes directly on the canvas so roads can visibly connect beneath.
  if (nodeRects) {
    for (const ch of challenges) {
      const nr = nodeRects[ch.id];
      if (!nr) continue;
      const boxW = Math.max(24, nr.w);
      const boxH = Math.max(24, nr.h);
      const bx = nr.cx - boxW / 2;
      const by = nr.cy - boxH / 2;

  // Background: try to draw the challenge's nodeIcon (preferred) or the
  const mapIconPath = (ch as MapNode & any).nodeIcon as string | undefined;
  let drewImage = false;
    if (mapIconPath) {
      const cached = iconCache.get(mapIconPath);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        // draw image centered and covering the node box
        ctx.drawImage(cached, bx, by, boxW, boxH);
        drewImage = true;
      } else if (cached && !cached.complete) {
        // image is already being loaded elsewhere; ensure we have a load
        // and error handler attached so we trigger a redraw when ready.
        const anyCached = cached as any;
        if (!anyCached.__mapListenerAttached) {
          const onLoad = () => {
            iconCache.set(mapIconPath, cached);
            try { window.dispatchEvent(new CustomEvent('map-icon-loaded', { detail: { path: mapIconPath } })); } catch (e) {}
          };
          const onErr = () => {
            try { window.dispatchEvent(new CustomEvent('map-icon-loaded', { detail: { path: mapIconPath, error: true } })); } catch (e) {}
          };
          cached.addEventListener('load', onLoad);
          cached.addEventListener('error', onErr);
          anyCached.__mapListenerAttached = true;
        }
      } else if (!cached) {
        // start loading and store placeholder in cache to avoid duplicate loads
        const img = new Image();
        // log load start
        try { console.debug('[mapRenderer] start loading icon', mapIconPath); } catch (e) {}
        // Attach handlers before setting src to avoid missing the load event
        img.onload = () => {
          try { console.debug('[mapRenderer] loaded icon', mapIconPath, img.naturalWidth, img.naturalHeight); } catch (e) {}
          iconCache.set(mapIconPath, img);
          try { window.dispatchEvent(new CustomEvent('map-icon-loaded', { detail: { path: mapIconPath } })); } catch (e) {}
        };
        img.onerror = (err) => {
          try { console.warn('[mapRenderer] failed loading icon', mapIconPath, err); } catch (e) {}
          try { window.dispatchEvent(new CustomEvent('map-icon-loaded', { detail: { path: mapIconPath, error: true } })); } catch (e) {}
        };
        img.src = mapIconPath;
        iconCache.set(mapIconPath, img);
        // If the image is already complete (e.g. browser cache), trigger redraw now
        try {
          if (img.complete && img.naturalWidth > 0) {
            try { window.dispatchEvent(new CustomEvent('map-icon-loaded', { detail: { path: mapIconPath } })); } catch (e) {}
          }
        } catch (e) {}
      }
    }

  if (!drewImage) {
    // No filled background per design request — leave the node box transparent
    // so the underlying tile or the node icon is visible. We keep the border
    // below so the node is still visually defined.
  }
  // No border: nodes should render without a surrounding rectangle per request.

  // Emoji / icon: draw a faint white stroke behind the emoji for contrast
  // then fill with black for legibility on varied backgrounds.
  ctx.font = `${Math.floor(boxH * 0.5)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const emojiY = by + boxH * 0.45;
  // stroke for contrast
  ctx.lineWidth = Math.max(2, Math.floor(boxH * 0.08));
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  if (nr.emoji) ctx.strokeText(nr.emoji, bx + boxW / 2, emojiY);
  ctx.fillStyle = '#000';
  if (nr.emoji) ctx.fillText(nr.emoji, bx + boxW / 2, emojiY);

  // Title small (subtle, no stroke)
  ctx.font = `${Math.floor(boxH * 0.15)}px serif`;
  ctx.fillStyle = '#000';
  ctx.fillText(nr.title || '', bx + boxW / 2, by + boxH * 0.85);
    }
  }

  // Paths are now drawn as tile-based roads on layer 2; no stroke-based
  // drawing required here.

  // Draw short connector segments from nearest road tile toward each node's
  // tile center so roads visually touch node boxes. This draws a short
  // stroked line on the canvas pointing to the node; the node overlay may
  // cover the segment's end but the border will typically reveal the join.
  const findNearestRoadTile = (tx: number, ty: number, maxR = 3) => {
    for (let r = 0; r <= maxR; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const nx = tx + dx;
          const ny = ty + dy;
          if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) continue;
          if (roadTiles.has(`${nx},${ny}`)) return { x: nx, y: ny };
        }
      }
    }
    return null;
  };

  for (const ch of challenges) {
    const leftPct = parseFloat(ch.position.left.replace('%', ''));
    const topPct = parseFloat(ch.position.top.replace('%', ''));
    const ntx = Math.floor((leftPct / 100) * mapWidth);
    const nty = Math.floor((topPct / 100) * mapHeight);
    const roadTile = findNearestRoadTile(ntx, nty, 4);
    if (!roadTile) continue;

    let nodeCenterX = (ntx + 0.5) * actualTileSize;
    let nodeCenterY = (nty + 0.5) * actualTileSize;
    let nodeRadius = Math.min(actualTileSize, actualTileSize) * 0.5; // fallback
    if (nodeRects && nodeRects[ch.id]) {
      const nr = nodeRects[ch.id];
      nodeCenterX = nr.cx;
      nodeCenterY = nr.cy;
      nodeRadius = Math.min(nr.w, nr.h) * 0.5;
    }
    const roadCenterX = (roadTile.x + 0.5) * actualTileSize;
    const roadCenterY = (roadTile.y + 0.5) * actualTileSize;

    const dx = nodeCenterX - roadCenterX;
    const dy = nodeCenterY - roadCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) continue;

    // Draw segment from road center toward node center, but stop short so
    // the node border reveals the connection. Length is min(dist, tile*0.75)
  const ux = dx / dist;
  const uy = dy / dist;
  // Endpoint should sit on the border of the node box (nodeRadius from center)
  const ex = nodeCenterX - ux * nodeRadius;
  const ey = nodeCenterY - uy * nodeRadius;

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = Math.max(2, Math.floor(actualTileSize / 8));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(roadCenterX, roadCenterY);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
};
