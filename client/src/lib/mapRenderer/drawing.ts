/**
 * Tile drawing utilities
 */
import type { MapTile, PathSegment } from './types';
import forestRenderer from '../forestRenderer';

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
 * Draws a retro-style challenge badge
 */
export const drawChallengeBadge = (
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
