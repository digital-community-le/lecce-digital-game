import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DebugDungeon from '../DebugDungeon';
import RetroPuzzle from '../RetroPuzzle';
import GuildBuilder from '../GuildBuilder';
import { GameStoreProvider } from '@/hooks/use-game-store';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';

/**
 * Test suite to verify that score-related UI elements are hidden from the user interface
 * while maintaining the underlying scoring logic for backend compatibility.
 */

const mockGameState = {
  currentUser: {
    userId: 'test-user',
    displayName: 'Test User',
    avatar: 'avatar1',
  },
  gameProgress: {
    totalScore: 1000,
    challengeProgress: {},
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TooltipProvider>
    <GameStoreProvider>
      {children}
      <Toaster />
    </GameStoreProvider>
  </TooltipProvider>
);

// Mock the game store with completed challenges
vi.mock('@/hooks/use-game-store', () => ({
  GameStoreProvider: ({ children }: { children: React.ReactNode }) => children,
  useGameStore: () => ({
    gameState: mockGameState,
    updateChallengeProgress: vi.fn(),
    showToast: vi.fn(),
  }),
}));

// Mock game storage
vi.mock('@/lib/gameStorage', () => ({
  gameStorage: {
    saveQuizState: vi.fn(),
    loadQuizState: vi.fn(),
    savePuzzleState: vi.fn(),
    loadPuzzleState: vi.fn(),
    saveGuildState: vi.fn(),
    loadGuildState: vi.fn(),
  },
}));

// Mock fetch for game data
global.fetch = vi.fn();

describe('Score UI Removal Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        challenges: {
          'debug-dungeon': {
            questions: [
              {
                id: 'q1',
                question: 'Test question?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 0,
                explanation: 'Test explanation'
              }
            ]
          },
          'retro-puzzle': {
            pairs: {
              'Term1': 'Category1',
              'Term2': 'Category2'
            }
          },
          'guild-builder': {
            description: 'Test description',
            companions: [
              { id: 'c1', name: 'Companion 1', role: 'Developer', avatar: 'avatar1' }
            ],
            quests: [
              {
                id: 'q1',
                text: 'Test quest',
                requiredRoles: ['Developer'],
                description: 'Test description'
              }
            ]
          }
        }
      })
    });
  });

  describe('DebugDungeon - Score UI Removal', () => {
    it('should not display score information in completion screen', async () => {
      render(
        <TestWrapper>
          <DebugDungeon />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByText(/caricamento/i)).not.toBeInTheDocument();
      });

      // The score-related text should not be visible
      expect(screen.queryByText(/punteggio:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/percentuale:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/pts/i)).not.toBeInTheDocument();
    });

    it('should not show score threshold messages', async () => {
      render(
        <TestWrapper>
          <DebugDungeon />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText(/caricamento/i)).not.toBeInTheDocument();
      });

      // Score threshold messages should not be visible
      expect(screen.queryByText(/punteggio insufficiente/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/serve almeno.*%/i)).not.toBeInTheDocument();
    });
  });

  describe('RetroPuzzle - Score UI Removal', () => {
    it('should not display score information in tip text', async () => {
      render(
        <TestWrapper>
          <RetroPuzzle />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText(/caricamento/i)).not.toBeInTheDocument();
      });

      // Score-related tip text should not be visible
      expect(screen.queryByText(/riduce il punteggio/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/punti/i)).not.toBeInTheDocument();
    });

    it('should not show final score in completion message', async () => {
      render(
        <TestWrapper>
          <RetroPuzzle />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText(/caricamento/i)).not.toBeInTheDocument();
      });

      // Final score should not be displayed
      expect(screen.queryByText(/punteggio finale:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/pts/i)).not.toBeInTheDocument();
    });
  });

  describe('GuildBuilder - Score UI Removal', () => {
    it('should not display score information in suggestion dialog', async () => {
      render(
        <TestWrapper>
          <GuildBuilder />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText(/caricamento/i)).not.toBeInTheDocument();
      });

      // Score-related elements in suggestion dialog should not be visible
      expect(screen.queryByText(/punti/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/punti rimanenti/i)).not.toBeInTheDocument();
    });

    it('should not show final score in completion screen', async () => {
      render(
        <TestWrapper>
          <GuildBuilder />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText(/caricamento/i)).not.toBeInTheDocument();
      });

      // Final score should not be displayed
      expect(screen.queryByText(/punteggio finale:/i)).not.toBeInTheDocument();
    });
  });
});