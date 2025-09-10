import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import CanvasMap from '@/components/CanvasMap';

const GameMapPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { gameState } = useGameStore();

  useEffect(() => {
    console.log('[GameMapPage] Component mounted/updated on route:', location);
    console.log('[GameMapPage] Game state:', {
      userId: gameState.currentUser.userId,
      gameCompleted: gameState.gameProgress.gameCompleted,
      completedChallenges: gameState.gameProgress.completedChallenges.length,
    });

    // Redirect to intro if no user profile
    if (!gameState.currentUser.userId) {
      console.log('[GameMapPage] No user ID, redirecting to intro');
      setLocation('/');
      return;
    }

    // Check if all challenges are completed - redirect to final page
    if (gameState.gameProgress.gameCompleted) {
      console.log('[GameMapPage] Game completed, redirecting to game-complete');
      setLocation('/game-complete');
      return;
    }

    console.log('[GameMapPage] All checks passed, rendering CanvasMap');

    return () => {
      console.log('[GameMapPage] Component unmounted');
    };
  }, [
    location,
    gameState.currentUser.userId,
    gameState.gameProgress.gameCompleted,
    setLocation,
  ]);

  return <CanvasMap />;
};

export default GameMapPage;
