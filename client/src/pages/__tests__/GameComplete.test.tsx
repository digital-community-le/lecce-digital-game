import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Router } from 'wouter';
import GameComplete from '../GameComplete';
import { useGameStore } from '../../hooks/use-game-store';

// Mock dependencies
vi.mock('../../hooks/use-game-store');
vi.mock('wouter', () => ({
  Router: ({ children }: any) => children,
  useLocation: vi.fn(() => ['', vi.fn()]),
}));

const mockUseGameStore = vi.mocked(useGameStore);

describe('GameComplete', () => {
  const mockGameState = {
    gameProgress: {
      userId: 'test-user',
      currentChallengeIndex: 4,
      completedChallenges: [
        'networking-forest',
        'retro-puzzle',
        'debug-dungeon',
        'social-arena',
      ],
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
      avatar: 'avatar1',
    },
    currentChallengeId: null,
    theme: 'default',
    auth: { isAuthenticated: true },
    avatarAnimation: null,
    modals: {},
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

  it('should display completion page when game is completed', async () => {
    render(
      <Router>
        <GameComplete />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByTestId('final-completion-title')).toBeInTheDocument();
      expect(
        screen.getByTestId('final-completion-description')
      ).toBeInTheDocument();
    });
  });

  it('should have a button to view the badge', async () => {
    render(
      <Router>
        <GameComplete />
      </Router>
    );

    await waitFor(() => {
      const button = screen.getByTestId('button-view-badge');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Vai al badge DevFest');
    });
  });

  // Note: Navigation tests are complex with wouter mocking, skipping for now
});
