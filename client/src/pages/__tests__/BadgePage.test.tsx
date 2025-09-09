import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from 'wouter';
import BadgePage from '../BadgePage';
import {
  getDevFestBadge,
  submitGameCompletion,
  isDevFestSubmissionSuccessful,
} from '@/services/completionService';

// Mock dei servizi
vi.mock('@/services/completionService');
vi.mock('@/components/Header', () => ({
  default: () =>
    React.createElement('header', { 'data-testid': 'header' }, 'Header'),
}));

// Mock del game store
vi.mock('@/hooks/use-game-store', () => ({
  useGameStore: () => ({
    gameState: {
      gameProgress: {
        gameCompleted: true,
      },
    },
  }),
}));

const mockBadge = {
  id: 1,
  name: 'Sigillo di Lecce - Master Quest',
  description:
    'Badge ottenuto completando la Quest Digitale di Lecce al DevFest 2025',
  picture:
    'https://api.devfest.gdglecce.it/assets/badges/lecce-quest-master.png',
  owned: '2025-09-03T10:30:00.000Z',
};

describe('BadgePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display the badge when available', async () => {
    (getDevFestBadge as any).mockReturnValue(mockBadge);

    await act(async () => {
      render(
        <Router>
          <BadgePage />
        </Router>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Badge COMMUNITY ottenuto!')).toBeInTheDocument();
      expect(screen.getByText(mockBadge.name)).toBeInTheDocument();
      expect(screen.getByText(mockBadge.description)).toBeInTheDocument();
      expect(screen.getByAltText(mockBadge.name)).toBeInTheDocument();
    });
  });

  it('should display loading state when badge is not available', async () => {
    (getDevFestBadge as any).mockReturnValue(null);
    (isDevFestSubmissionSuccessful as any).mockReturnValue(false);
    (submitGameCompletion as any).mockReturnValue(new Promise(() => {})); // Never resolves

    render(
      <Router>
        <BadgePage />
      </Router>
    );

    expect(screen.getByText('Caricamento badge...')).toBeInTheDocument();
  });

  it('should submit game completion if not already done', async () => {
    (getDevFestBadge as any).mockReturnValue(null);
    (submitGameCompletion as any).mockResolvedValue({
      success: true,
      badge: mockBadge,
    });

    render(
      <Router>
        <BadgePage />
      </Router>
    );

    await waitFor(() => {
      expect(submitGameCompletion).toHaveBeenCalled();
      expect(screen.getByText(mockBadge.name)).toBeInTheDocument();
    });
  });
});
