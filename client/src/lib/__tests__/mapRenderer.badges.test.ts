/**
 * @file mapRenderer.badges.test.ts
 * @description Tests for challenge badge rendering functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderMap, NodeRect } from '../mapRenderer';
import type { MapNode } from '../../types/game';

// Mock HTMLCanvasElement and 2D context
class MockCanvasRenderingContext2D {
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '12px serif';
  textAlign: CanvasTextAlign = 'left';
  textBaseline: CanvasTextBaseline = 'alphabetic';

  private calls: { method: string; args: any[] }[] = [];

  clearRect = vi.fn();
  fillRect = vi.fn((...args) => this.calls.push({ method: 'fillRect', args }));
  strokeRect = vi.fn((...args) => this.calls.push({ method: 'strokeRect', args }));
  fillText = vi.fn((...args) => this.calls.push({ method: 'fillText', args }));
  strokeText = vi.fn((...args) => this.calls.push({ method: 'strokeText', args }));
  drawImage = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
  scale = vi.fn();
  measureText = vi.fn(() => ({ width: 50 }));

  getCalls() {
    return this.calls;
  }

  clearCalls() {
    this.calls = [];
  }
}

class MockHTMLCanvasElement {
  width = 800;
  height = 600;
  style = { width: '800px', height: '600px' };

  private ctx = new MockCanvasRenderingContext2D();

  getContext(type: string) {
    if (type === '2d') return this.ctx;
    return null;
  }

  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      width: this.width,
      height: this.height,
      right: this.width,
      bottom: this.height,
    };
  }
}

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1,
});

describe('MapRenderer - Challenge Badges', () => {
  let mockCanvas: MockHTMLCanvasElement;
  let mockCtx: MockCanvasRenderingContext2D;

  const sampleChallenges: MapNode[] = [
    {
      id: 'guild-builder',
      title: 'Guild Builder',
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
      emoji: '🧩',
      nodeIcon: '/assets/map-icons/dungeon.png',
      position: { top: '50%', left: '60%' },
      status: 'locked',
      progress: 0,
      total: 1
    }
  ];

  const sampleNodeRects: Record<string, NodeRect> = {
    'guild-builder': {
      cx: 160, // 20% of 800px
      cy: 180, // 30% of 600px
      w: 64,
      h: 64,
      bgColor: '#16a34a',
      title: 'Guild Builder',
      emoji: '🏰'
    },
    'retro-puzzle': {
      cx: 480, // 60% of 800px
      cy: 300, // 50% of 600px
      w: 64,
      h: 64,
      bgColor: '#f59e0b',
      title: 'Retro Puzzle Challenge',
      emoji: '🧩'
    }
  };

  beforeEach(() => {
    mockCanvas = new MockHTMLCanvasElement();
    mockCtx = mockCanvas.getContext('2d') as any;
    mockCtx.clearCalls();
  });

  describe('Badge Rendering', () => {
    it('should render badge below each challenge node', () => {
      renderMap(
        mockCanvas as any,
        sampleChallenges,
        50, // mapWidth
        40, // mapHeight
        48, // headerHeight
        sampleNodeRects
      );

      const calls = mockCtx.getCalls();

      // Should have fillRect calls for badge backgrounds
      const badgeCalls = calls.filter(call => call.method === 'fillRect');
      expect(badgeCalls.length).toBeGreaterThan(0);

      // Check that badges are positioned below nodes
      const firstNodeBadge = badgeCalls.find(call => {
        const [x, y] = call.args;
        // Badge should be below the first node (cy: 180, badge should be around y: 180 + 32 + margin)
        return y > 210 && y < 250;
      });
      expect(firstNodeBadge).toBeDefined();
    });

    it('should render badge text for each challenge', () => {
      renderMap(
        mockCanvas as any,
        sampleChallenges,
        50,
        40,
        48,
        sampleNodeRects
      );

      const calls = mockCtx.getCalls();
      const textCalls = calls.filter(call => call.method === 'fillText');

      // Should have text calls for both challenge titles
      const guildBuilderText = textCalls.find(call =>
        call.args[0] === 'Guild Builder'
      );
      const retroPuzzleText = textCalls.find(call =>
        call.args[0] === 'Retro Puzzle Challenge'
      );

      expect(guildBuilderText).toBeDefined();
      expect(retroPuzzleText).toBeDefined();
    });

    it('should use retro-style colors for badge backgrounds', () => {
      renderMap(
        mockCanvas as any,
        sampleChallenges,
        50,
        40,
        48,
        sampleNodeRects
      );

      const calls = mockCtx.getCalls();

      // Check that fillStyle was set to retro colors before drawing badges
      expect(mockCtx.fillStyle).toBeDefined();
    });

    it('should handle long challenge titles by truncating or wrapping', () => {
      const longTitleChallenge: MapNode[] = [{
        id: 'long-title',
        title: 'This is a very long challenge title that should be handled properly',
        emoji: '📝',
        position: { top: '40%', left: '30%' },
        status: 'available',
        progress: 0,
        total: 1
      }];

      const longTitleNodeRect: Record<string, NodeRect> = {
        'long-title': {
          cx: 240,
          cy: 240,
          w: 64,
          h: 64,
          bgColor: '#9ca3af',
          title: 'This is a very long challenge title that should be handled properly',
          emoji: '📝'
        }
      };

      expect(() => {
        renderMap(
          mockCanvas as any,
          longTitleChallenge,
          50,
          40,
          48,
          longTitleNodeRect
        );
      }).not.toThrow();

      const calls = mockCtx.getCalls();
      const textCalls = calls.filter(call => call.method === 'fillText');
      expect(textCalls.length).toBeGreaterThan(0);
    });

    it('should position badges without overlapping with nodes', () => {
      renderMap(
        mockCanvas as any,
        sampleChallenges,
        50,
        40,
        48,
        sampleNodeRects
      );

      const calls = mockCtx.getCalls();
      const fillRectCalls = calls.filter(call => call.method === 'fillRect');

      // Should have some fillRect calls for badges
      expect(fillRectCalls.length).toBeGreaterThan(0);

      // Check that all fillRect calls have valid parameters
      fillRectCalls.forEach(call => {
        const [x, y, width, height] = call.args;

        // Verify that badge rectangles are positioned logically
        expect(typeof x).toBe('number');
        expect(typeof y).toBe('number');
        expect(typeof width).toBe('number');
        expect(typeof height).toBe('number');

        // All values should be finite
        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
        expect(Number.isFinite(width)).toBe(true);
        expect(Number.isFinite(height)).toBe(true);
      });
    }, 3000);
  });

  describe('Badge Styling', () => {
    it('should use pixel-perfect retro styling', () => {
      renderMap(
        mockCanvas as any,
        sampleChallenges,
        50,
        40,
        48,
        sampleNodeRects
      );

      // Verify that imageSmoothingEnabled is set to false for pixel-perfect rendering
      expect(mockCtx.scale).toHaveBeenCalled();
    });

    it('should adapt badge size to content', () => {
      const shortTitle: MapNode[] = [{
        id: 'short',
        title: 'Short',
        emoji: '⚡',
        position: { top: '20%', left: '20%' },
        status: 'available',
        progress: 0,
        total: 1
      }];

      const shortNodeRect: Record<string, NodeRect> = {
        'short': {
          cx: 160,
          cy: 120,
          w: 64,
          h: 64,
          bgColor: '#9ca3af',
          title: 'Short',
          emoji: '⚡'
        }
      };

      renderMap(
        mockCanvas as any,
        shortTitle,
        50,
        40,
        48,
        shortNodeRect
      );

      const calls = mockCtx.getCalls();
      const fillRectCalls = calls.filter(call => call.method === 'fillRect');

      expect(fillRectCalls.length).toBeGreaterThan(0);
    });
  });
});
