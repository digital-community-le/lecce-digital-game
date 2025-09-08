/**
 * @file mapRenderer.clickArea.test.ts
 * @description Tests for click area detection including both node and badge areas
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateClickableAreas, isPointInClickableArea } from '../mapRenderer';
import type { MapNode } from '../../types/game';

describe('MapRenderer - Click Area Detection', () => {
  const sampleChallenges: MapNode[] = [
    {
      id: 'guild-builder',
      title: 'Guild Builder',
      shortTitle: 'Guild',
      emoji: '🏰',
      nodeIcon: '/assets/map-icons/taverna.png',
      position: { top: '30%', left: '20%' },
      status: 'available',
      progress: 0,
      total: 1
    },
    {
      id: 'retro-puzzle',
      title: 'Retro Puzzle Challenge',
      shortTitle: 'Puzzle',
      emoji: '🧩',
      nodeIcon: '/assets/map-icons/dungeon.png',
      position: { top: '50%', left: '60%' },
      status: 'locked',
      progress: 0,
      total: 1
    }
  ];

  const mockNodeRects = {
    'guild-builder': {
      cx: 160, // 20% of 800px
      cy: 180, // 30% of 600px
      w: 64,
      h: 64,
      bgColor: '#16a34a',
      title: 'Guild',
      emoji: '🏰'
    },
    'retro-puzzle': {
      cx: 480, // 60% of 800px
      cy: 300, // 50% of 600px
      w: 64,
      h: 64,
      bgColor: '#f59e0b',
      title: 'Puzzle',
      emoji: '🧩'
    }
  };

  describe('calculateClickableAreas', () => {
    it('should calculate both node and badge areas for each challenge', () => {
      const clickableAreas = calculateClickableAreas(mockNodeRects);

      expect(clickableAreas).toHaveProperty('guild-builder');
      expect(clickableAreas).toHaveProperty('retro-puzzle');

      const guildArea = clickableAreas['guild-builder'];
      expect(guildArea).toHaveProperty('nodeArea');
      expect(guildArea).toHaveProperty('badgeArea');

      // Node area should match the original NodeRect
      expect(guildArea.nodeArea).toEqual({
        x: 160 - 32, // cx - w/2
        y: 180 - 32, // cy - h/2
        width: 64,
        height: 64
      });

      // Badge area should be below the node
      expect(guildArea.badgeArea.y).toBeGreaterThan(guildArea.nodeArea.y + guildArea.nodeArea.height);
    });

    it('should calculate badge dimensions based on title length', () => {
      const clickableAreas = calculateClickableAreas(mockNodeRects);

      const guildBadge = clickableAreas['guild-builder'].badgeArea;
      const puzzleBadge = clickableAreas['retro-puzzle'].badgeArea;

      // Both badges should have reasonable dimensions
      expect(guildBadge.width).toBeGreaterThan(0);
      expect(guildBadge.height).toBeGreaterThan(0);
      expect(puzzleBadge.width).toBeGreaterThan(0);
      expect(puzzleBadge.height).toBeGreaterThan(0);

      // Badge dimensions should be proportional to content
      expect(typeof guildBadge.width).toBe('number');
      expect(typeof guildBadge.height).toBe('number');
    });
  });

  describe('isPointInClickableArea', () => {
    let clickableAreas: ReturnType<typeof calculateClickableAreas>;

    beforeEach(() => {
      clickableAreas = calculateClickableAreas(mockNodeRects);
    });

    it('should detect clicks within node area', () => {
      const guildNodeCenter = { x: 160, y: 180 };

      expect(isPointInClickableArea(guildNodeCenter.x, guildNodeCenter.y, clickableAreas['guild-builder']))
        .toBe(true);
    });

    it('should detect clicks within badge area', () => {
      const guildBadgeArea = clickableAreas['guild-builder'].badgeArea;
      const badgeCenter = {
        x: guildBadgeArea.x + guildBadgeArea.width / 2,
        y: guildBadgeArea.y + guildBadgeArea.height / 2
      };

      expect(isPointInClickableArea(badgeCenter.x, badgeCenter.y, clickableAreas['guild-builder']))
        .toBe(true);
    });

    it('should not detect clicks outside both areas', () => {
      // Point far away from both node and badge
      expect(isPointInClickableArea(50, 50, clickableAreas['guild-builder']))
        .toBe(false);

      // Point between node and badge (should be false)
      const guildArea = clickableAreas['guild-builder'];
      const betweenY = guildArea.nodeArea.y + guildArea.nodeArea.height + 5;

      expect(isPointInClickableArea(160, betweenY, guildArea))
        .toBe(false);
    });

    it('should handle edge cases gracefully', () => {
      const guildArea = clickableAreas['guild-builder'];

      // Click exactly on node border
      expect(isPointInClickableArea(
        guildArea.nodeArea.x,
        guildArea.nodeArea.y,
        guildArea
      )).toBe(true);

      // Click exactly on badge border
      expect(isPointInClickableArea(
        guildArea.badgeArea.x,
        guildArea.badgeArea.y,
        guildArea
      )).toBe(true);
    });
  });
});
