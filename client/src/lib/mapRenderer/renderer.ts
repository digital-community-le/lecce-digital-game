import type { MapNode, NodeRect, TerrainType, MapTile } from './types';
import { iconCache } from './iconCache';
import { determineTileType } from './terrain';
import { prepareCanvas, determineSafePositionForChallenge } from './canvas';
import { findTilePath, findNearestAllowedTile } from './pathfinding';
import { drawTileResponsive, drawChallengeBadge } from './drawing';

/**
 * Main map rendering function that draws the complete map with terrain, roads, and challenges.
 */
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
        // Prefer shortTitle over title for badges
        title: node.shortTitle || node.title,
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
  const restrictedUsedRoadTiles = new Set<string>();
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

      // Use the resolved title from NodeRect (which should already prefer shortTitle)
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
