import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';

interface GameCompletionProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

/**
 * GameCompletionProtectedRoute - Redirects completed games to completion page
 * This is separate from auth protection and handles only game completion state
 *
 * Only redirects on initial render if game is already completed.
 * Does NOT redirect when game becomes completed during gameplay.
 */
const GameCompletionProtectedRoute: React.FC<
  GameCompletionProtectedRouteProps
> = ({ children, redirectPath = '/game-complete' }) => {
  const { gameState } = useGameStore();
  const [, setLocation] = useLocation();

  // Check only on initial render - if game is already completed, redirect
  useEffect(() => {
    if (gameState.gameProgress.gameCompleted) {
      setLocation(redirectPath);
    }
  }, []);

  return <>{children}</>;
};

export default GameCompletionProtectedRoute;
