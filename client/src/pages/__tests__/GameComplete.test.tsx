import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Router } from 'wouter';
import GameComplete from '../GameComplete';
import { getDevFestBadge, isDevFestSubmissionSuccessful, submitGameCompletion } from '../../services/completionService';
import { useGameStore } from '../../hooks/use-game-store';

// Mock dependencies
vi.mock('../../services/completionService');
vi.mock('../../hooks/use-game-store');

const mockGetDevFestBadge = vi.mocked(getDevFestBadge);
const mockIsDevFestSubmissionSuccessful = vi.mocked(isDevFestSubmissionSuccessful);
const mockSubmitGameCompletion = vi.mocked(submitGameCompletion);
const mockUseGameStore = vi.mocked(useGameStore);

describe('GameComplete - DevFest API Persistence', () => {
  const mockBadge = {
    id: 1,
    name: "Sigillo di Lecce - Master Quest",
    description: "Badge ottenuto completando la Quest Digitale di Lecce al DevFest 2025",
    picture: "https://api.devfest.gdglecce.it/assets/badges/lecce-quest-master.png",
    owned: new Date().toISOString()
  };

  const mockGameState = {
    gameProgress: {
      userId: 'test-user',
      currentChallengeIndex: 4,
      completedChallenges: ['networking-forest', 'retro-puzzle', 'debug-dungeon', 'social-arena'],
      totalScore: 1000,
      startedAt: '2025-09-08T10:00:00Z',
      lastUpdated: '2025-09-08T12:00:00Z',
      gameCompleted: true,
    },
    challenges: [],
    currentChallenge: null,
    currentUser: {
      userId: 'test-user',
      displayName: 'Test Player',
      avatar: 'avatar1'
    },
    currentChallengeId: null,
    theme: 'default',
    auth: { isAuthenticated: true },
    avatarAnimation: null,
    modals: {}
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGameStore.mockReturnValue({
      gameState: mockGameState,
      toasts: [],
      modals: {},
      saveProfile: vi.fn(),
      updateChallengeProgress: vi.fn(),
      completeChallenge: vi.fn(),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      addToast: vi.fn(),
      removeToast: vi.fn(),
      completeGame: vi.fn(),
      setCurrentUser: vi.fn(),
      setLocation: vi.fn(),
      startAvatarAnimation: vi.fn(),
      stopAvatarAnimation: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display existing badge without API call if already successful', async () => {
    // Arrange
    mockGetDevFestBadge.mockReturnValue(mockBadge);
    mockIsDevFestSubmissionSuccessful.mockReturnValue(true);

    // Act
    render(
      <Router>
        <GameComplete />
      </Router>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('final-completion-title')).toBeInTheDocument();
    });

    // Should display the existing badge
    await waitFor(() => {
      expect(screen.getByText(mockBadge.name)).toBeInTheDocument();
    });

    // Should NOT call the API again
    expect(mockSubmitGameCompletion).not.toHaveBeenCalled();
  });

  it('should call API if no successful submission exists', async () => {
    // Arrange
    mockGetDevFestBadge.mockReturnValue(null);
    mockIsDevFestSubmissionSuccessful.mockReturnValue(false);
    mockSubmitGameCompletion.mockResolvedValue({
      success: true,
      badge: mockBadge
    });

    // Act
    render(
      <Router>
        <GameComplete />
      </Router>
    );

    // Assert
    await waitFor(() => {
      expect(mockSubmitGameCompletion).toHaveBeenCalled();
    });

    // Should display the new badge
    await waitFor(() => {
      expect(screen.getByText(mockBadge.name)).toBeInTheDocument();
    });
  });

  it('should handle failed API submission gracefully', async () => {
    // Arrange
    mockGetDevFestBadge.mockReturnValue(null);
    mockIsDevFestSubmissionSuccessful.mockReturnValue(false);
    mockSubmitGameCompletion.mockResolvedValue({
      success: false,
      error: 'API temporarily unavailable'
    });

    // Act
    render(
      <Router>
        <GameComplete />
      </Router>
    );

    // Assert
    await waitFor(() => {
      expect(mockSubmitGameCompletion).toHaveBeenCalled();
    });

    // Should display completion page without badge section
    expect(screen.getByTestId('final-completion-title')).toBeInTheDocument();
    expect(screen.queryByText('BADGE DEVFEST OTTENUTO!')).not.toBeInTheDocument();
  });

  it('should display cached badge immediately if submission was successful', async () => {
    // Arrange
    mockGetDevFestBadge.mockReturnValue(mockBadge);
    mockIsDevFestSubmissionSuccessful.mockReturnValue(true);

    // Act
    render(
      <Router>
        <GameComplete />
      </Router>
    );

    // Assert - Badge should be displayed immediately without waiting for API
    expect(screen.getByText(mockBadge.name)).toBeInTheDocument();
    expect(screen.getByText(mockBadge.description)).toBeInTheDocument();
    expect(screen.getByText('🏆 BADGE DEVFEST OTTENUTO!')).toBeInTheDocument();
    
    // API should not be called
    expect(mockSubmitGameCompletion).not.toHaveBeenCalled();
  });
});
