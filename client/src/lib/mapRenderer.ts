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
 * Draw a retro-style badge below a challenge node with the challenge title.
 * The badge has a retro 8-bit appearance with rounded corners and contrasting colors.
 * 
 * @param ctx - Canvas 2D rendering context
 * @param title - Challenge title to display in the badge
 * @param centerX - X coordinate of the badge center
 * @param centerY - Y coordinate of the badge center  
 * @param maxWidth - Maximum width for the badge
 */
const drawChallengeBadge = (
  ctx: CanvasRenderingContext2D,
  title: string,
  centerX: number,
  centerY: number,
  maxWidth: number = 120
) => {
  if (!title || title.length === 0) return;

  // Badge styling constants
  const padding = 8;
  const borderWidth = 2;
  const cornerRadius = 4;

  // Calculate font size based on available space
  const baseFontSize = 11;
  const fontSize = Math.max(baseFontSize, Math.min(16, maxWidth / 8));
  ctx.font = `${fontSize}px monospace`;

  // Measure text to determine badge size
  const textMetrics = ctx.measureText(title);
  let textWidth = textMetrics.width;

  // Handle long titles by truncating if necessary
  let displayTitle = title;
  if (textWidth > maxWidth - padding * 2) {
    // Try to fit the text by truncating and adding ellipsis
    let truncated = title;
    while (textWidth > maxWidth - padding * 2 - 20 && truncated.length > 3) {
      truncated = truncated.slice(0, -1);
      displayTitle = truncated + '...';
      textWidth = ctx.measureText(displayTitle).width;
    }
  }

  // Badge dimensions
  const badgeWidth = Math.min(maxWidth, textWidth + padding * 2);
  const badgeHeight = fontSize + padding * 2;

  // Badge position
  const badgeX = centerX - badgeWidth / 2;
  const badgeY = centerY - badgeHeight / 2;

  // Draw badge background with retro style
  // Outer border (darker)
  ctx.fillStyle = '#2d3748'; // Dark gray border
  ctx.fillRect(badgeX - borderWidth, badgeY - borderWidth, badgeWidth + borderWidth * 2, badgeHeight + borderWidth * 2);

  // Inner background (lighter)
  ctx.fillStyle = '#4a5568'; // Medium gray background
  ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);

  // Top highlight for 3D effect
  ctx.fillStyle = '#718096'; // Light gray highlight
  ctx.fillRect(badgeX, badgeY, badgeWidth, 2);

  // Left highlight for 3D effect  
  ctx.fillStyle = '#718096';
  ctx.fillRect(badgeX, badgeY, 2, badgeHeight);

  // Draw text
  ctx.fillStyle = '#ffffff'; // White text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add text shadow for better readability
  ctx.fillStyle = '#000000';
  ctx.fillText(displayTitle, centerX + 1, centerY + 1);

  // Main text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(displayTitle, centerX, centerY);
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
 * Enhanced A* pathfinder with improved turn penalty and better obstacle avoidance.
 * Prioritizes straight paths and prevents road intersections.
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

  // If nodeRects is not provided, compute it here for road calculations
  let actualNodeRects = nodeRects;
  if (!actualNodeRects) {
    actualNodeRects = {};
    challenges.forEach((node) => {
      const safe = determineSafePositionForChallenge(
        node,
        containerWidth,
        containerHeight,
        mapWidth,
        mapHeight,
      );
      const left = (parseFloat(safe.leftPercent.replace('%', '')) / 100) * containerWidth;
      const top = (parseFloat(safe.topPercent.replace('%', '')) / 100) * containerHeight;
      const w = 64; // default visual size
      const h = 64;
      const colorMap: Record<string, string> = {
        'guild-builder': '#16a34a',
        'retro-puzzle': '#f59e0b',
        'debug-dungeon': '#7c3aed',
        'social-arena': '#f97316',
      };
      const bg = colorMap[node.id] || '#9ca3af';
      actualNodeRects![node.id] = {
        cx: left,
        cy: top,
        w,
        h,
        bgColor: bg,
        title: node.title,
        emoji: node.emoji,
      };
    });
  }

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
  const forbiddenForRoads: TerrainType[] = ['mountain', 'lake']; // Removed forest - roads can pass through trees

  // Calculate node positions for roads using EXACT coordinates from where nodes are drawn
  // This ensures perfect alignment between road endpoints and visible node positions
  const nodePixelPositions = challenges.map(ch => {
    let pixelX, pixelY, tx, ty;

    if (actualNodeRects && actualNodeRects[ch.id]) {
      // Use exact coordinates from where the node is actually drawn
      const nr = actualNodeRects[ch.id];
      pixelX = nr.cx;
      pixelY = nr.cy;
      // Convert pixel coordinates back to tile coordinates
      tx = Math.floor(pixelX / actualTileSize);
      ty = Math.floor(pixelY / actualTileSize);
    } else {
      // Fallback to safe position calculation
      const safePos = determineSafePositionForChallenge(
        ch,
        containerWidth,
        containerHeight,
        mapWidth,
        mapHeight,
        ['forest', 'mountain', 'lake']
      );
      pixelX = safePos.pixelX;
      pixelY = safePos.pixelY;
      const leftPct = parseFloat(safePos.leftPercent.replace('%', ''));
      const topPct = parseFloat(safePos.topPercent.replace('%', ''));
      tx = Math.floor((leftPct / 100) * mapWidth);
      ty = Math.floor((topPct / 100) * mapHeight);
    }

    return { pixelX, pixelY, tx, ty, challenge: ch };
  });

  // Track node tiles where road overlaps are allowed (for convergence at nodes)
  const nodeTiles = new Set<string>();

  // Ensure the tile directly under each node is marked as a road tile
  // This ensures roads visually connect to where nodes are actually rendered
  for (const nodePos of nodePixelPositions) {
    if (nodePos.tx >= 0 && nodePos.ty >= 0 && nodePos.tx < mapWidth && nodePos.ty < mapHeight) {
      const nodeTileKey = `${nodePos.tx},${nodePos.ty}`;
      roadTiles.add(nodeTileKey);
      nodeTiles.add(nodeTileKey); // Mark this as a node tile where overlaps are allowed

      // NO adjacent tiles - this was creating the crosses around nodes!
    }
  }

  for (let i = 0; i < nodePixelPositions.length - 1; i++) {
    const nodeA = nodePixelPositions[i];
    const nodeB = nodePixelPositions[i + 1];

    // Prefer the exact tile under the node as the road endpoint
    let start = { x: nodeA.tx, y: nodeA.ty };
    let goal = { x: nodeB.tx, y: nodeB.ty };

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

    // Enhanced exclusion: prevent roads from crossing existing roads
    // EXCEPT on node tiles where convergence is allowed
    const excludedDueToAdjacency = new Set<string>();

    // Block tiles adjacent to used roads to prevent crossings
    for (const usedKey of Array.from(usedRoadTiles)) {
      // Skip anti-crossing logic if this is a node tile (overlaps allowed)
      if (nodeTiles.has(usedKey)) continue;

      const [ux, uy] = usedKey.split(',').map(s => parseInt(s, 10));
      // Only block adjacent tiles in cross pattern to allow parallel roads
      const crossKeys = [`${ux - 1},${uy}`, `${ux + 1},${uy}`, `${ux},${uy - 1}`, `${ux},${uy + 1}`];
      for (const k of crossKeys) {
        // Don't block node tiles - roads can converge there
        if (nodeTiles.has(k)) continue;

        if (k.split(',').every(coord => {
          const c = parseInt(coord, 10);
          return c >= 0 && c < (k.includes(',0') || k.includes(`,${mapHeight - 1}`) ? mapHeight : mapWidth);
        })) {
          excludedDueToAdjacency.add(k);
        }
      }
    }

    // Always allow endpoints
    excludedDueToAdjacency.delete(`${start.x},${start.y}`);
    excludedDueToAdjacency.delete(`${goal.x},${goal.y}`);

    // Create modified usedRoadTiles that excludes node tiles (where overlaps are allowed)
    const restrictedUsedRoadTiles = new Set<string>();
    for (const usedTile of Array.from(usedRoadTiles)) {
      if (!nodeTiles.has(usedTile)) {
        restrictedUsedRoadTiles.add(usedTile);
      }
    }

    let path = findTilePath(start, goal, mapWidth, mapHeight, forbiddenForRoads, excludedDueToAdjacency, restrictedUsedRoadTiles);
    if (!path) {
      // Fallback: less strict adjacency rules but still respect node-only overlaps
      path = findTilePath(start, goal, mapWidth, mapHeight, forbiddenForRoads, new Set<string>(), restrictedUsedRoadTiles);
    }
    if (!path) {
      // Final fallback: direct connection if needed
      path = findTilePath(start, goal, mapWidth, mapHeight, forbiddenForRoads, new Set<string>(), new Set<string>());
    }
    if (!path) continue; // Skip if pathfinding still fails with reduced restrictions

    // Add path tiles to road sets
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
  if (actualNodeRects) {
    for (const ch of challenges) {
      const nr = actualNodeRects[ch.id];
      if (!nr) continue;
      const boxW = Math.max(24, nr.w);
      const boxH = Math.max(24, nr.h);
      const bx = nr.cx - boxW / 2;
      const by = nr.cy - boxH / 2;

      // Background: try to draw the challenge's nodeIcon (preferred) or the
      const mapIconPath = ch.nodeIcon;
      let drewImage = false;

      if (mapIconPath) {
        const cached = iconCache.get(mapIconPath);

        if (cached && cached.complete && cached.naturalWidth > 0) {
          // draw image centered and covering the node box
          ctx.drawImage(cached, bx, by, boxW, boxH);
          drewImage = true;
        } else if (!cached) {
          // start loading and store placeholder in cache to avoid duplicate loads
          const img = new Image();
          // Attach handlers before setting src to avoid missing the load event
          img.onload = () => {
            iconCache.set(mapIconPath, img);
            try { window.dispatchEvent(new CustomEvent('map-icon-loaded', { detail: { path: mapIconPath } })); } catch (e) { }
          };
          img.onerror = (err) => {
            console.warn('[mapRenderer] Image failed to load', mapIconPath, err);
            try { window.dispatchEvent(new CustomEvent('map-icon-loaded', { detail: { path: mapIconPath, error: true } })); } catch (e) { }
          };
          img.src = mapIconPath;
          iconCache.set(mapIconPath, img);
          // If the image is already complete (e.g. browser cache), trigger redraw now
          try {
            if (img.complete && img.naturalWidth > 0) {
              try { window.dispatchEvent(new CustomEvent('map-icon-loaded', { detail: { path: mapIconPath } })); } catch (e) { }
            }
          } catch (e) { }
        }
      }

      if (!drewImage) {
        // No filled background per design request — leave the node box transparent
        // so the underlying tile or the node icon is visible. We keep the border
        // below so the node is still visually defined.
      }
      // No border: nodes should render without a surrounding rectangle per request.

      // Only render emoji as fallback when no image was drawn
      if (!drewImage && nr.emoji) {
        // Emoji / icon: draw a faint white stroke behind the emoji for contrast
        // then fill with black for legibility on varied backgrounds.
        ctx.font = `${Math.floor(boxH * 0.5)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const emojiY = by + boxH * 0.45;
        // stroke for contrast
        ctx.lineWidth = Math.max(2, Math.floor(boxH * 0.08));
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.strokeText(nr.emoji, bx + boxW / 2, emojiY);
        ctx.fillStyle = '#000';
        ctx.fillText(nr.emoji, bx + boxW / 2, emojiY);
      }

      // Draw retro-style badge below the node with challenge title
      const badgeCenterX = nr.cx;
      const badgeCenterY = by + boxH + 20; // Position badge below the node with some margin
      const maxBadgeWidth = Math.max(boxW, 100); // Ensure badge is at least as wide as the node

      drawChallengeBadge(ctx, nr.title || '', badgeCenterX, badgeCenterY, maxBadgeWidth);
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
    if (actualNodeRects && actualNodeRects[ch.id]) {
      const nr = actualNodeRects[ch.id];
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
