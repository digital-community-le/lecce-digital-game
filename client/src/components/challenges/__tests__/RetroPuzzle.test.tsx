import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RetroPuzzle from '../RetroPuzzle';

// Mock delle dipendenze
vi.mock('@/hooks/use-game-store', () => ({
  useGameStore: () => ({
    gameState: {
      currentUser: { userId: 'test-user' },
    },
    updateChallengeProgress: vi.fn(),
    showToast: vi.fn(),
  }),
}));

vi.mock('@/lib/storage', () => ({
  gameStorage: {
    getPuzzleState: vi.fn(() => null),
    savePuzzleState: vi.fn(),
  },
}));

vi.mock('@/assets/game-data.json', () => ({
  default: {
    challenges: [
      {
        id: 'retro-puzzle',
        pairs: [
          { term: 'HTML', category: 'Markup Language' },
          { term: 'CSS', category: 'Styling' },
          { term: 'JavaScript', category: 'Programming Language' },
        ],
      },
    ],
  },
}));

describe('RetroPuzzle with ChallengeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render terms and categories with ChallengeButton styling', async () => {
    render(<RetroPuzzle />);

    // Attendi che il componente carichi
    await waitFor(() => {
      expect(screen.getByText('HTML')).toBeInTheDocument();
    });

    // Verifica che i pulsanti utilizzino le classi nes-btn
    const htmlButton = screen.getByTestId('term-html');
    expect(htmlButton).toHaveClass('nes-btn');
    expect(htmlButton).toHaveClass('transition-colors');
    expect(htmlButton).toHaveClass('p-3');
    expect(htmlButton).toHaveClass('text-left');

    const categoryButton = screen.getByTestId('category-markup-language');
    expect(categoryButton).toHaveClass('nes-btn');
    expect(categoryButton).toHaveClass('is-disabled');
  });

  it('should apply primary variant when term is selected', async () => {
    render(<RetroPuzzle />);

    await waitFor(() => {
      expect(screen.getByText('HTML')).toBeInTheDocument();
    });

    const htmlButton = screen.getByTestId('term-html');
    fireEvent.click(htmlButton);

    await waitFor(() => {
      expect(htmlButton).toHaveClass('is-primary');
    });
  });

  it('should apply success variant and blink animation on correct match', async () => {
    render(<RetroPuzzle />);

    await waitFor(() => {
      expect(screen.getByText('HTML')).toBeInTheDocument();
    });

    // Seleziona un termine
    const htmlButton = screen.getByTestId('term-html');
    fireEvent.click(htmlButton);

    // Seleziona la categoria corretta
    const categoryButton = screen.getByTestId('category-markup-language');
    fireEvent.click(categoryButton);

    await waitFor(() => {
      expect(htmlButton).toHaveClass('is-success');
      expect(categoryButton).toHaveClass('is-success');
    });
  });

  it('should apply disabled variant for matched pairs', async () => {
    render(<RetroPuzzle />);

    await waitFor(() => {
      expect(screen.getByText('HTML')).toBeInTheDocument();
    });

    // Fai un match
    const htmlButton = screen.getByTestId('term-html');
    fireEvent.click(htmlButton);

    const categoryButton = screen.getByTestId('category-markup-language');
    fireEvent.click(categoryButton);

    await waitFor(() => {
      expect(htmlButton).toBeDisabled();
      expect(categoryButton).toBeDisabled();
      expect(htmlButton).toHaveClass('is-success');
      expect(categoryButton).toHaveClass('is-success');
    });
  });

  it('should show restart button with warning variant', async () => {
    render(<RetroPuzzle />);

    await waitFor(() => {
      expect(screen.getByText('Ricomincia')).toBeInTheDocument();
    });

    const restartButton = screen.getByTestId('button-restart-puzzle');
    expect(restartButton).toHaveClass('nes-btn');
    expect(restartButton).toHaveClass('is-warning');
  });
});
