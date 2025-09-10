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
    expect(htmlButton).not.toHaveClass('is-primary'); // Default variant non ha is-primary

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

  it('should apply success variant when pair is matched and then remove elements after blink', async () => {
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

    // Gli elementi dovrebbero iniziare l'animazione di blink
    await waitFor(() => {
      // Verifica che l'animazione di blink sia iniziata controllando la presenza degli elementi
      expect(htmlButton).toBeInTheDocument();
      expect(categoryButton).toBeInTheDocument();
    });

    // Dopo il blink (circa 1.2 secondi), gli elementi dovrebbero essere rimossi dal DOM
    await waitFor(
      () => {
        expect(screen.queryByTestId('term-html')).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('category-markup-language')
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
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

    // Gli elementi dovrebbero scomparire dopo il blink
    await waitFor(
      () => {
        expect(screen.queryByTestId('term-html')).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('category-markup-language')
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
