import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameStorage } from '../../lib/storage';
import { getDevFestBadge, isDevFestSubmissionSuccessful, getDevFestSubmissionStatus } from '../completionService';

// Mock localStorage
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.data[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.data = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('DevFest Badge Persistence Integration Tests', () => {
  const testUserId = 'test-user-123';
  const mockBadge = {
    id: 1,
    name: "Sigillo di Lecce - Master Quest",
    description: "Badge ottenuto completando la Quest Digitale di Lecce al DevFest 2025",
    picture: "https://api.devfest.gdglecce.it/assets/badges/lecce-quest-master.png",
    owned: "2025-09-08T12:00:00.000Z"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    
    // Setup a test profile
    gameStorage.saveProfile({
      userId: testUserId,
      displayName: 'Test User',
      avatar: 'avatar1',
      createdAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T10:00:00Z'
    });
  });

  it('should persist successful DevFest submission in game progress', () => {
    // Arrange
    const gameProgress = {
      userId: testUserId,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
      devfestApiSubmission: {
        success: true,
        submittedAt: '2025-09-08T12:30:00Z',
        badge: mockBadge,
      }
    };

    // Act
    gameStorage.saveProgress(gameProgress);

    // Assert
    const retrievedProgress = gameStorage.getProgress(testUserId);
    expect(retrievedProgress).toEqual(gameProgress);
    
    // Test utility functions
    expect(isDevFestSubmissionSuccessful()).toBe(true);
    expect(getDevFestBadge()).toEqual(mockBadge);
    
    const submissionStatus = getDevFestSubmissionStatus();
    expect(submissionStatus).toEqual({
      success: true,
      submittedAt: '2025-09-08T12:30:00Z',
      badge: mockBadge,
    });
  });

  it('should persist failed DevFest submission in game progress', () => {
    // Arrange
    const gameProgress = {
      userId: testUserId,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
      devfestApiSubmission: {
        success: false,
        submittedAt: '2025-09-08T12:30:00Z',
        error: 'API temporarily unavailable',
      }
    };

    // Act
    gameStorage.saveProgress(gameProgress);

    // Assert
    const retrievedProgress = gameStorage.getProgress(testUserId);
    expect(retrievedProgress).toEqual(gameProgress);
    
    // Test utility functions
    expect(isDevFestSubmissionSuccessful()).toBe(false);
    expect(getDevFestBadge()).toBe(null);
    
    const submissionStatus = getDevFestSubmissionStatus();
    expect(submissionStatus).toEqual({
      success: false,
      submittedAt: '2025-09-08T12:30:00Z',
      error: 'API temporarily unavailable',
    });
  });

  it('should return null for utility functions when no submission exists', () => {
    // Arrange
    const gameProgress = {
      userId: testUserId,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
      // No devfestApiSubmission
    };

    // Act
    gameStorage.saveProgress(gameProgress);

    // Assert
    expect(isDevFestSubmissionSuccessful()).toBe(false);
    expect(getDevFestBadge()).toBe(null);
    expect(getDevFestSubmissionStatus()).toBe(null);
  });

  it('should support multiple users with different submission statuses', () => {
    // Arrange
    const user1Id = 'user-1';
    const user2Id = 'user-2';
    
    const gameProgress1 = {
      userId: user1Id,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
      devfestApiSubmission: {
        success: true,
        submittedAt: '2025-09-08T12:30:00Z',
        badge: mockBadge,
      }
    };

    const gameProgress2 = {
      userId: user2Id,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 800,
      startedAt: '2025-09-08T11:00:00Z',
      lastUpdated: '2025-09-08T13:00:00Z',
      gameCompleted: true,
      devfestApiSubmission: {
        success: false,
        submittedAt: '2025-09-08T13:30:00Z',
        error: 'Network timeout',
      }
    };

    // Act
    gameStorage.saveProgress(gameProgress1);
    gameStorage.saveProgress(gameProgress2);

    // Assert
    expect(isDevFestSubmissionSuccessful(user1Id)).toBe(true);
    expect(getDevFestBadge(user1Id)).toEqual(mockBadge);
    
    expect(isDevFestSubmissionSuccessful(user2Id)).toBe(false);
    expect(getDevFestBadge(user2Id)).toBe(null);
    
    const status1 = getDevFestSubmissionStatus(user1Id);
    expect(status1?.success).toBe(true);
    expect(status1?.badge).toEqual(mockBadge);
    
    const status2 = getDevFestSubmissionStatus(user2Id);
    expect(status2?.success).toBe(false);
    expect(status2?.error).toBe('Network timeout');
  });
});
