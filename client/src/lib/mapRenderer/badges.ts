/**
 * Badge rendering utilities for challenge nodes
 */

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
