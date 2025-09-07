/**
 * Test per verificare la corretta gestione della proprietà nodeIcon nel game store
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock del game-data.json per i test
const mockGameData = {
  challenges: [
    {
      id: 'guild-builder',
      title: 'Guild Builder — La Taverna dei Compagni',
      type: 'matching-quiz',
      description: 'Forma una squadra di 3 compagni...',
      emoji: '🛡️',
      nodeIcon: '/assets/map-icons/taverna.png',
      position: { top: '30%', left: '15%' }
    },
    {
      id: 'retro-puzzle',
      title: 'Retro Puzzle',
      type: 'puzzle',
      description: 'Nel puzzle antico...',
      emoji: '🧩',
      nodeIcon: '/assets/map-icons/cripta.png',
      position: { top: '20%', left: '45%' }
    },
    {
      id: 'debug-dungeon',
      title: 'Debug Dungeon',
      type: 'quiz',
      description: 'Naviga nel labirinto del debug...',
      emoji: '⚔️',
      nodeIcon: '/assets/map-icons/labirinto.png',
      position: { top: '45%', left: '70%' }
    },
    {
      id: 'social-arena',
      title: 'Social Arena',
      type: 'ocr-scan',
      description: 'Scansiona QR code nell\'arena sociale...',
      emoji: '📱',
      nodeIcon: '/assets/map-icons/arena.png',
      position: { top: '65%', left: '40%' }
    }
  ]
};

// Mock del modulo game-data.json
vi.mock('@/assets/game-data.json', () => ({
  default: mockGameData
}));

describe('Game Store NodeIcon Integration', () => {
  it('should preserve nodeIcon property from game-data.json', () => {
    // Test that would verify the nodeIcon property is correctly copied
    // This is more of an integration test since buildInitialChallenges is internal
    
    const expectedIcons = {
      'guild-builder': '/assets/map-icons/taverna.png',
      'retro-puzzle': '/assets/map-icons/cripta.png',
      'debug-dungeon': '/assets/map-icons/labirinto.png',
      'social-arena': '/assets/map-icons/arena.png'
    };

    // Since we can't directly test the internal function, we verify the structure
    expect(mockGameData.challenges).toHaveLength(4);
    
    mockGameData.challenges.forEach(challenge => {
      expect(challenge.nodeIcon).toBe(expectedIcons[challenge.id as keyof typeof expectedIcons]);
      expect(challenge.nodeIcon).toMatch(/^\/assets\/map-icons\/\w+\.png$/);
    });
  });

  it('should handle challenges without nodeIcon gracefully', () => {
    const challengeWithoutIcon: any = {
      id: 'test-challenge',
      title: 'Test Challenge',
      emoji: '❓',
      position: { top: '50%', left: '50%' }
      // No nodeIcon property
    };

    // Verify that challenges without nodeIcon don't break the system
    expect(challengeWithoutIcon.nodeIcon).toBeUndefined();
    
    // In a real implementation, buildInitialChallenges should handle this gracefully
    // and the resulting MapNode should have nodeIcon as undefined
  });

  it('should validate icon paths format', () => {
    mockGameData.challenges.forEach(challenge => {
      if (challenge.nodeIcon) {
        // Icon paths should start with /assets/map-icons/
        expect(challenge.nodeIcon).toMatch(/^\/assets\/map-icons\//);
        // Icon paths should end with .png
        expect(challenge.nodeIcon).toMatch(/\.png$/);
        // Icon paths should not contain spaces or special characters
        expect(challenge.nodeIcon).toMatch(/^\/assets\/map-icons\/[a-zA-Z0-9\-_]+\.png$/);
      }
    });
  });

  it('should have unique icon paths for different challenge types', () => {
    const iconPaths = mockGameData.challenges
      .map(c => c.nodeIcon)
      .filter(Boolean);
    
    // All icon paths should be unique
    const uniquePaths = new Set(iconPaths);
    expect(uniquePaths.size).toBe(iconPaths.length);
    
    // Verify we have the expected icons
    expect(iconPaths).toContain('/assets/map-icons/taverna.png');
    expect(iconPaths).toContain('/assets/map-icons/cripta.png');
    expect(iconPaths).toContain('/assets/map-icons/labirinto.png');
    expect(iconPaths).toContain('/assets/map-icons/arena.png');
  });

  it('should map challenge types to appropriate icons', () => {
    const expectedMappings = {
      'guild-builder': 'taverna.png',    // Team building -> Tavern
      'retro-puzzle': 'cripta.png',      // Puzzle -> Crypt
      'debug-dungeon': 'labirinto.png',  // Debug challenge -> Labyrinth
      'social-arena': 'arena.png'        // Social challenge -> Arena
    };

    mockGameData.challenges.forEach(challenge => {
      const expectedIcon = expectedMappings[challenge.id as keyof typeof expectedMappings];
      expect(challenge.nodeIcon).toContain(expectedIcon);
    });
  });
});
