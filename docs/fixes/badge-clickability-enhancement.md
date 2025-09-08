# Click Area Enhancement - Badge Clickability

## Overview
This enhancement extends the clickable areas of challenge nodes on the game map to include both the challenge icon/image and the challenge badge (title label) below it.

## Changes Made

### 1. New Types and Interfaces (`mapRenderer.ts`)

```typescript
export interface ClickableRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChallengeClickableArea {
  nodeArea: ClickableRect;
  badgeArea: ClickableRect;
}
```

### 2. New Functions (`mapRenderer.ts`)

#### `calculateBadgeDimensions(title: string, maxWidth: number)`
- Calculates badge dimensions based on title text
- Matches the logic used in `drawChallengeBadge` function
- Handles text truncation and ellipsis

#### `calculateClickableAreas(nodeRects: Record<string, NodeRect>)`
- Calculates clickable areas for all challenges
- Returns both node area and badge area for each challenge
- Badge positioning matches the rendering logic

#### `isPointInClickableArea(x: number, y: number, challengeArea: ChallengeClickableArea)`
- Checks if a point is within either the node area or badge area
- Returns true if the point is clickable

### 3. Component Updates (`CanvasMap.tsx`)

- Added `clickableAreas` state to track clickable regions
- Updated click handler to check both node and badge areas
- Enhanced imports to include new functions

## Usage

The enhancement is automatically active. Users can now click on:
1. **Challenge Icon/Image** (original behavior)
2. **Challenge Badge** (new behavior) - the text label below each challenge

Both click areas will open the corresponding challenge.

## Testing

Added comprehensive tests in `mapRenderer.clickArea.test.ts`:
- Badge dimension calculation
- Clickable area computation
- Point-in-area detection
- Edge cases and boundary conditions

All existing tests continue to pass, ensuring backward compatibility.

## Benefits

1. **Improved UX**: Larger clickable area makes it easier to interact with challenges
2. **Mobile Friendly**: Badge text is often easier to tap than small icons on mobile
3. **Accessibility**: Provides larger touch targets for users with motor difficulties
4. **Intuitive**: Users naturally expect text labels to be clickable

## Implementation Details

- Badge dimensions are calculated based on actual text length and font size
- Clickable areas are recalculated whenever challenges or canvas size changes
- The implementation maintains pixel-perfect accuracy with the rendered badges
- No visual changes - only functional enhancement
