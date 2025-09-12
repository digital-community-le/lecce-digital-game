import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { submitGameCompletion, getDevFestBadge } from '../completionService';
import { gameStorage } from '../../lib/storage';
import { handleGameCompletion } from '../devfestApiServiceFactory';

// Mock dependencies
vi.mock('../devfestApiServiceFactory');
vi.mock('@/lib/storage');

const mockHandleGameCompletion = vi.mocked(handleGameCompletion);
const mockGameStorage = vi.mocked(gameStorage);

// Global test data
const mockUserId = 'test-user-123';
const mockBadge = {
  id: 1,
  name: "Sigillo di Lecce - Master Quest",
  description: "Badge ottenuto completando la Quest Digitale di Lecce al DevFest 2025",
  picture: "https://api.devfest.gdglecce.it/assets/badges/lecce-quest-master.png",
  owned: true
};

describe('completionService - DevFest API Persistence', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock URL params for test mode
    Object.defineProperty(window, 'location', {
      value: { search: '?test=1' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should save successful API submission to game progress', async () => {
    // Arrange
    const mockProgress = {
      userId: mockUserId,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
    };

    mockGameStorage.getProgress.mockReturnValue(mockProgress);
    mockHandleGameCompletion.mockResolvedValue({
      success: true,
      badge: mockBadge
    });

    // Act
    const result = await submitGameCompletion();

    // Assert
    expect(result.success).toBe(true);
    expect(result.badge).toEqual(mockBadge);

    // Verify that progress was updated with API submission data
    expect(mockGameStorage.saveProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockProgress,
        devfestApiSubmission: expect.objectContaining({
          success: true,
          submittedAt: expect.any(String),
          badge: mockBadge,
        }),
        lastUpdated: expect.any(String),
      })
    );
  });

  it('should save failed API submission to game progress', async () => {
    // Arrange
    const mockProgress = {
      userId: mockUserId,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
    };

    const mockError = 'API temporarily unavailable';
    mockGameStorage.getProgress.mockReturnValue(mockProgress);
    mockHandleGameCompletion.mockResolvedValue({
      success: false,
      error: mockError
    });

    // Act
    const result = await submitGameCompletion();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(mockError);

    // Verify that progress was updated with failed submission data
    expect(mockGameStorage.saveProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockProgress,
        devfestApiSubmission: expect.objectContaining({
          success: false,
          submittedAt: expect.any(String),
          error: mockError,
        }),
        lastUpdated: expect.any(String),
      })
    );
  });

  it('should not retry if API submission was already successful', async () => {
    // Arrange
    const mockProgress = {
      userId: mockUserId,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
      devfestApiSubmission: {
        success: true,
        submittedAt: '2025-09-08T11:30:00Z',
        badge: mockBadge,
      }
    };

    mockGameStorage.getProgress.mockReturnValue(mockProgress);

    // Act
    const result = await submitGameCompletion();

    // Assert
    expect(result.success).toBe(true);
    expect(result.badge).toEqual(mockBadge);

    // Verify that API was NOT called again
    expect(mockHandleGameCompletion).not.toHaveBeenCalled();

    // Verify that progress was NOT updated again
    expect(mockGameStorage.saveProgress).not.toHaveBeenCalled();
  });

  it('should retry if previous API submission failed', async () => {
    // Arrange
    const mockProgress = {
      userId: mockUserId,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
      devfestApiSubmission: {
        success: false,
        submittedAt: '2025-09-08T11:00:00Z',
        error: 'Network error',
      }
    };

    mockGameStorage.getProgress.mockReturnValue(mockProgress);
    mockHandleGameCompletion.mockResolvedValue({
      success: true,
      badge: mockBadge
    });

    // Act
    const result = await submitGameCompletion();

    // Assert
    expect(result.success).toBe(true);
    expect(result.badge).toEqual(mockBadge);

    // Verify that API was called again
    expect(mockHandleGameCompletion).toHaveBeenCalled();

    // Verify that progress was updated with new successful submission
    expect(mockGameStorage.saveProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockProgress,
        devfestApiSubmission: expect.objectContaining({
          success: true,
          submittedAt: expect.any(String),
          badge: mockBadge,
        }),
        lastUpdated: expect.any(String),
      })
    );
  });

  it('should handle missing game progress gracefully', async () => {
    // Arrange
    mockGameStorage.getProgress.mockReturnValue(null);

    // Act
    const result = await submitGameCompletion();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Game progress not found');

    // Verify that API was NOT called
    expect(mockHandleGameCompletion).not.toHaveBeenCalled();
    expect(mockGameStorage.saveProgress).not.toHaveBeenCalled();
  });
});

describe('getDevFestBadge', () => {
  it('should return single badge from successful devfestApiSubmission', () => {
    // Arrange
    const mockProgress = {
      userId: mockUserId,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
      devfestApiSubmission: {
        success: true,
        submittedAt: '2025-09-08T11:30:00Z',
        badge: mockBadge,
      }
    };

    mockGameStorage.getProgress.mockReturnValue(mockProgress);

    // Act
    const result = getDevFestBadge();

    // Assert
    expect(result).toEqual(mockBadge);
  });

  it('should handle badge stored as array and return first element', () => {
    // Arrange
    const mockBadgeArray = [mockBadge];
    const mockProgress = {
      userId: mockUserId,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
      devfestApiSubmission: {
        success: true,
        submittedAt: '2025-09-08T11:30:00Z',
        badge: mockBadgeArray,
      }
    };

    mockGameStorage.getProgress.mockReturnValue(mockProgress);

    // Act
    const result = getDevFestBadge();

    // Assert
    expect(result).toEqual(mockBadge);
    expect(result).not.toEqual(mockBadgeArray);
  });

  it('should return null if no successful devfestApiSubmission exists', () => {
    // Arrange
    const mockProgress = {
      userId: mockUserId,
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
      devfestApiSubmission: {
        success: false,
        submittedAt: '2025-09-08T11:30:00Z',
        error: 'API Error',
      }
    };

    mockGameStorage.getProgress.mockReturnValue(mockProgress);

    // Act
    const result = getDevFestBadge();

    // Assert
    expect(result).toBeNull();
  });

  it('should return null if no game progress exists', () => {
    // Arrange
    mockGameStorage.getProgress.mockReturnValue(null);

    // Act
    const result = getDevFestBadge();

    // Assert
    expect(result).toBeNull();
  });
});
