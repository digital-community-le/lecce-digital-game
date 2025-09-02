/**
 * forestRenderer.ts
 *
 * Helper utilities to render forest tiles: separates concerns from mapRenderer
 * so tree drawing can be tested and extended independently.
 */
import { MapTile } from './mapRenderer';

export type ForestVariant = 'broadleaf' | 'pine';

/**
 * Choose a deterministic forest variant based on tile coordinates.
 */
export const chooseForestVariant = (tile: MapTile): ForestVariant => {
  // Simple deterministic choice: alternate patterns based on coords
  return (tile.x + tile.y) % 3 === 0 ? 'pine' : 'broadleaf';
};

/**
 * Draw a rounded blob using horizontal rows of pixels to avoid rectangular
 * silhouettes. Keeps look pixel-art friendly while leaving corners transparent.
 */
const drawBlob = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  w: number,
  h: number,
  color: string
) => {
  ctx.fillStyle = color;
  // simple approach: draw rows with varying length to simulate a rounded shape
  const rows = h;
  for (let r = 0; r < rows; r++) {
    // compute relative width for this row (rounded shape)
    const rel = Math.sin((r / rows) * Math.PI); // 0..1..0
    const rowW = Math.max(1, Math.floor(w * (0.4 + 0.6 * rel)));
    const offsetX = Math.floor((w - rowW) / 2);
    const rx = startX + offsetX;
    const ry = startY + r;
    ctx.fillRect(rx, ry, rowW, 1);
  }
};

/**
 * Draw a broadleaf-style tree (multi-layer canopy, trunk, speckles, flowers)
 */
export const drawBroadleaf = (
  ctx: CanvasRenderingContext2D,
  tile: MapTile,
  x: number,
  y: number,
  size: number,
  overlay = false
) => {
  // Base ground only if not overlay pass
  if (!overlay) {
    ctx.fillStyle = '#144728';
    ctx.fillRect(x, y, size, size);
  }

  const canopyBaseX = x + Math.floor(size * 0.15);
  const canopyBaseY = y + Math.floor(size * 0.05);
  const canopyWidth = Math.floor(size * 0.7);
  const canopyHeight = Math.floor(size * 0.6);

  // Ensure normal compositing (no blending modes)
  ctx.globalCompositeOperation = 'source-over';

  // Back layer (blob) - darker
  drawBlob(ctx, canopyBaseX, canopyBaseY + Math.floor(canopyHeight * 0.25), canopyWidth, Math.floor(canopyHeight * 0.6), '#0f3f20');

  // Mid layer (blob) - main foliage
  drawBlob(ctx, canopyBaseX - 2, canopyBaseY, canopyWidth + 4, canopyHeight, '#166534');

  // Highlights (small dots inside canopy)
  ctx.fillStyle = '#1e7a3b';
  const highlightCount = Math.max(2, Math.floor(size / 10));
  for (let i = 0; i < highlightCount; i++) {
    const hx = canopyBaseX + ((tile.x * 5 + i * 3) % Math.max(1, canopyWidth - 2));
    const hy = canopyBaseY + ((tile.y * 7 + i * 2) % Math.max(1, canopyHeight - 2));
    ctx.fillRect(hx, hy, Math.max(1, Math.floor(size / 12)), Math.max(1, Math.floor(size / 20)));
  }

  // Trunk
  const trunkWidth = Math.max(2, Math.floor(size / 10));
  const trunkHeight = Math.max(4, Math.floor(size / 3));
  const trunkX = x + Math.floor(size / 2) - Math.floor(trunkWidth / 2);
  const trunkY = y + size - trunkHeight - 1;
  ctx.fillStyle = '#4b2f1b';
  ctx.fillRect(trunkX, trunkY, trunkWidth, trunkHeight);
  ctx.fillStyle = '#352012';
  for (let t = 0; t < Math.floor(trunkWidth); t += Math.max(1, Math.floor(trunkWidth / 2))) {
    ctx.fillRect(trunkX + t, trunkY + 1, 1, trunkHeight - 2);
  }

  // Speckles and flowers
  const speckleCount = Math.max(4, Math.floor(size / 6));
  for (let i = 0; i < speckleCount; i++) {
    const lx = canopyBaseX + ((tile.x * 13 + tile.y * 7 + i * 11) % (canopyWidth - 1));
    const ly = canopyBaseY + ((tile.y * 17 + tile.x * 3 + i * 5) % (canopyHeight - 1));
    ctx.fillStyle = (i % 6 === 0) ? '#9ae6b4' : '#0f5f2a';
    ctx.fillRect(lx, ly, 1, 1);
    if ((tile.x + tile.y + i) % 13 === 0) {
      const flowerColor = (i % 2 === 0) ? '#ffd6e0' : '#fff59d';
      ctx.fillStyle = flowerColor;
      ctx.fillRect(lx + 1, ly, 1, 1);
    }
  }

  // Ground shadow under canopy only in non-overlay pass (so it doesn't darken background layer)
  if (!overlay) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(x + 1, y + size - Math.max(2, Math.floor(size * 0.08)), size - 2, Math.max(1, Math.floor(size * 0.08)));
  }
};

/**
 * Draw a pine-style tree (pointed layered canopy, slim trunk)
 */
export const drawPine = (
  ctx: CanvasRenderingContext2D,
  tile: MapTile,
  x: number,
  y: number,
  size: number,
  overlay = false
) => {
  // Base ground slightly different tone for pines only if not overlay
  if (!overlay) {
    ctx.fillStyle = '#0f3a24';
    ctx.fillRect(x, y, size, size);
  }

  const centerX = x + Math.floor(size / 2);
  const baseY = y + Math.floor(size * 0.8);

  // Draw three stacked layers
  const layers = 3;
  // Ensure normal compositing
  ctx.globalCompositeOperation = 'source-over';

  for (let l = 0; l < layers; l++) {
    const layerWidth = Math.floor(size * (0.8 - l * 0.2));
    const layerHeight = Math.max(1, Math.floor(size * 0.18));
    const lx = centerX - Math.floor(layerWidth / 2);
    const ly = baseY - (layers - l) * Math.floor(size * 0.18) - Math.floor(size * 0.06);
    const color = l === 2 ? '#1e7a3b' : (l === 1 ? '#166534' : '#0f5f2a');
    // draw as blob to avoid rectangular silhouette
    drawBlob(ctx, lx, ly, layerWidth, layerHeight, color);
    // small highlight dots
    ctx.fillStyle = '#9ae6b4';
    for (let d = 0; d < Math.max(1, Math.floor(layerWidth / 8)); d++) {
      const dx = lx + ((tile.x * 3 + d * 5 + l) % Math.max(1, layerWidth - 1));
      const dy = ly + ((tile.y * 5 + d * 7 + l) % Math.max(1, layerHeight));
      ctx.fillRect(dx, dy, 1, 1);
    }
  }

  // Slim trunk
  const trunkW = Math.max(1, Math.floor(size / 12));
  const trunkH = Math.max(3, Math.floor(size * 0.18));
  const trunkX = centerX - Math.floor(trunkW / 2);
  const trunkY = y + size - trunkH - 1;
  ctx.fillStyle = '#3e2a1b';
  ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
};

export default {
  chooseForestVariant,
  drawBroadleaf,
  drawPine,
};
