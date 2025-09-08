import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ChallengeLayout from '@/components/layout/ChallengeLayout';

// Mock the navigation hook to avoid side effects
vi.mock('wouter', () => ({ useLocation: () => [null, vi.fn()] }));

// Mock useNavigateWithTransition used by the component
vi.mock('@/hooks/use-navigate-with-transition', () => ({
  __esModule: true,
  default: () => vi.fn()
}));

// Provide a mock for useGameStore so we can control gameState
const mockGameState = {
  currentUser: { userId: 'user-1' },
  challenges: [
    { id: 'guild-builder', title: 'Guild Builder — La Taverna dei Compagni', status: 'unlocked' },
    { id: 'retro-puzzle', title: 'Retro Puzzle', status: 'unlocked' }
  ]
};

vi.mock('@/hooks/use-game-store', () => ({
  useGameStore: () => ({ gameState: mockGameState })
}));

describe('ChallengeLayout', () => {
  it('shows the title taken from gameState.challenges', () => {
    render(
      <ChallengeLayout challengeId="guild-builder"> 
        <div>child</div>
      </ChallengeLayout>
    );

    const title = screen.getByTestId('challenge-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Guild Builder — La Taverna dei Compagni');
  });
});
