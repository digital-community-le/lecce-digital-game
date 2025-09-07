/**
 * Test per il sistema di rendering delle icone delle challenge sulla mappa
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { preloadMapIcons } from '../mapRenderer';
import type { MapNode } from '../../types/game';

describe('MapRenderer Icons', () => {
  let mockImage: any;

  beforeEach(() => {
    // Mock Image constructor
    mockImage = {
      onload: null,
      onerror: null,
      src: '',
      complete: false,
      naturalWidth: 0,
      naturalHeight: 0,
    };
    
    global.Image = vi.fn(() => mockImage);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should extract icon paths from challenges correctly', () => {
    const challenges: MapNode[] = [
      {
        id: 'guild-builder',
        title: 'Guild Builder',
        emoji: '🛡️',
        nodeIcon: '/assets/map-icons/taverna.png',
        position: { top: '30%', left: '15%' },
        status: 'available',
        progress: 0,
        total: 1
      },
      {
        id: 'retro-puzzle',
        title: 'Retro Puzzle',
        emoji: '🧩',
        nodeIcon: '/assets/map-icons/cripta.png',
        position: { top: '20%', left: '45%' },
        status: 'locked',
        progress: 0,
        total: 1
      }
    ];

    // Call preload function (don't await, just verify setup)
    preloadMapIcons(challenges);

    // Verify Image constructor was called for each unique icon
    expect(global.Image).toHaveBeenCalledTimes(2);
  });

  it('should handle duplicate icon paths correctly', () => {
    const challenges: MapNode[] = [
      {
        id: 'challenge1',
        title: 'Challenge 1',
        emoji: '🛡️',
        nodeIcon: '/assets/map-icons/taverna.png',
        position: { top: '30%', left: '15%' },
        status: 'available',
        progress: 0,
        total: 1
      },
      {
        id: 'challenge2',
        title: 'Challenge 2',
        emoji: '🧩',
        nodeIcon: '/assets/map-icons/taverna.png', // Same icon
        position: { top: '20%', left: '45%' },
        status: 'locked',
        progress: 0,
        total: 1
      }
    ];

    // Call preload function
    preloadMapIcons(challenges);

    // Should only create the image once due to deduplication
    expect(global.Image).toHaveBeenCalledTimes(1);
  });

  it('should handle challenges without nodeIcon', async () => {
    const challenges: MapNode[] = [
      {
        id: 'challenge-no-icon',
        title: 'Challenge No Icon',
        emoji: '❓',
        position: { top: '30%', left: '15%' },
        status: 'available',
        progress: 0,
        total: 1
      }
    ];

    const result = await preloadMapIcons(challenges);
    
    // Should resolve immediately with no images to load
    expect(result).toEqual([]);
    expect(global.Image).not.toHaveBeenCalled();
  });

  it('should handle image load errors gracefully', async () => {
    const challenges: MapNode[] = [
      {
        id: 'bad-icon',
        title: 'Bad Icon',
        emoji: '❌',
        nodeIcon: '/nonexistent/path.png',
        position: { top: '30%', left: '15%' },
        status: 'available',
        progress: 0,
        total: 1
      }
    ];

    // Mock image load error
    setTimeout(() => {
      if (mockImage.onerror) {
        mockImage.onerror(new Error('Image not found'));
      }
    }, 10);

    await expect(preloadMapIcons(challenges)).rejects.toThrow('Failed to load icon: /nonexistent/path.png');
  });
});
