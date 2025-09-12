import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from 'wouter';
import BadgePage from '../BadgePage';
import {
  getDevFestBadge,
  submitGameCompletion,
  isDevFestSubmissionSuccessful,
  getDevFestSubmissionStatus,
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
    // Setup default mocks
    (getDevFestSubmissionStatus as any).mockReturnValue(null);
  });

  describe('localStorage-first approach', () => {
    it('should display cached badge immediately when found in localStorage', async () => {
      // Arrange: Mock localStorage has badge
      (getDevFestBadge as any).mockReturnValue(mockBadge);

      // Act
      render(
        <Router>
          <BadgePage />
        </Router>
      );

      // Assert: Should show badge immediately without loading
      await waitFor(() => {
        expect(
          screen.getByText('Hai ottenuto un nuovo badge!')
        ).toBeInTheDocument();
        expect(
          screen.getByAltText('Sigillo di Lecce - Master Quest')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Sigillo di Lecce - Master Quest')
        ).toBeInTheDocument();
      });

      // Should NOT call API since badge is already in localStorage
      expect(submitGameCompletion).not.toHaveBeenCalled();
      expect(getDevFestBadge).toHaveBeenCalledTimes(1);
    });

    it('should call API only when badge is not in localStorage', async () => {
      // Arrange: No badge in localStorage
      (getDevFestBadge as any).mockReturnValue(null);
      (getDevFestSubmissionStatus as any).mockReturnValue(null);
      (isDevFestSubmissionSuccessful as any).mockReturnValue(false);
      (submitGameCompletion as any).mockResolvedValue({
        success: true,
        badge: mockBadge,
      });

      // Act
      render(
        <Router>
          <BadgePage />
        </Router>
      );

      // Assert: Should show loading first
      expect(screen.getByText(/Caricamento badge.../)).toBeInTheDocument();

      // Wait for API call and badge display
      await waitFor(() => {
        expect(
          screen.getByText('Hai ottenuto un nuovo badge!')
        ).toBeInTheDocument();
        expect(
          screen.getByAltText('Sigillo di Lecce - Master Quest')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Sigillo di Lecce - Master Quest')
        ).toBeInTheDocument();
      });

      // Should call API since no badge in localStorage
      expect(submitGameCompletion).toHaveBeenCalledTimes(1);
      expect(getDevFestBadge).toHaveBeenCalledTimes(1);
    });

    it('should show cached error and allow retry when previous submission failed', async () => {
      // Arrange: Previous submission failed
      (getDevFestBadge as any).mockReturnValue(null);
      (getDevFestSubmissionStatus as any).mockReturnValue({
        success: false,
        submittedAt: '2025-09-08T12:30:00Z',
        error: 'Network timeout',
      });
      (isDevFestSubmissionSuccessful as any).mockReturnValue(false);

      // Act
      render(
        <Router>
          <BadgePage />
        </Router>
      );

      // Assert: Should show error immediately without loading
      await waitFor(() => {
        expect(
          screen.getByText(/Errore nell'attivazione del badge/)
        ).toBeInTheDocument();
        expect(screen.getByText(/Network timeout/)).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /Riprova/ })
        ).toBeInTheDocument();
      });

      // Should NOT call API initially since we have cached error
      expect(submitGameCompletion).not.toHaveBeenCalled();
    });
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
      // Check for the complete badge heading text using regex to handle the mixed content
      expect(screen.getByText(/Badge.*ottenuto!/i)).toBeInTheDocument();
      // The badge name is rendered as-is in the span, not transformed to uppercase
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

  it('should display detailed error information when badge submission failed', async () => {
    (getDevFestBadge as any).mockReturnValue(null);
    (isDevFestSubmissionSuccessful as any).mockReturnValue(false);
    (submitGameCompletion as any).mockResolvedValue({
      success: false,
      error: 'Network timeout',
    });
    (getDevFestSubmissionStatus as any).mockReturnValue({
      success: false,
      submittedAt: '2025-09-10T10:00:00.000Z',
      error: 'Network timeout',
    });

    render(
      <Router>
        <BadgePage />
      </Router>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Errore nell'attivazione del badge")
      ).toBeInTheDocument();
      expect(screen.getByText('Problema di connessione')).toBeInTheDocument();
      expect(screen.getByText(/Network timeout/)).toBeInTheDocument();
      expect(screen.getByText('Riprova')).toBeInTheDocument();
    });

    // Should not show DevFest return button when there's an error
    expect(screen.queryByText(/Torna all'app DevFest/)).not.toBeInTheDocument();
  });

  it('should handle retry functionality', async () => {
    // Initially fails
    (getDevFestBadge as any).mockReturnValue(null);
    (isDevFestSubmissionSuccessful as any).mockReturnValue(false);
    (getDevFestSubmissionStatus as any).mockReturnValue({
      success: false,
      submittedAt: '2025-09-10T10:00:00.000Z',
      error: 'API temporarily unavailable',
    });

    const { rerender } = render(
      <Router>
        <BadgePage />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText('Riprova')).toBeInTheDocument();
    });

    // Mock successful retry
    (submitGameCompletion as any).mockResolvedValueOnce({
      success: true,
      badge: mockBadge,
    });

    // Click retry button
    const retryButton = screen.getByText('Riprova');
    await act(async () => {
      retryButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText(mockBadge.name)).toBeInTheDocument();
      expect(screen.queryByText('Riprova')).not.toBeInTheDocument();
    });
  });

  it('should show different error messages based on error type', async () => {
    (getDevFestBadge as any).mockReturnValue(null);
    (isDevFestSubmissionSuccessful as any).mockReturnValue(false);
    (getDevFestSubmissionStatus as any).mockReturnValue(null);

    // Test network error
    (submitGameCompletion as any).mockResolvedValue({
      success: false,
      error: 'fetch failed',
    });

    render(
      <Router>
        <BadgePage />
      </Router>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Errore nell'attivazione del badge")
      ).toBeInTheDocument();
      expect(screen.getByText(/Problema di connessione/)).toBeInTheDocument();
    });
  });
});
